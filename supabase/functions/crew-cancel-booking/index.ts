import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const REASONS = ["no_spots", "vehicle_issue", "emergency", "cannot_arrive", "other"];

const REASON_AR: Record<string, string> = {
  no_spots: "لا تتوفر مواقف في الموقع",
  vehicle_issue: "عطل في المركبة",
  emergency: "ظرف طارئ",
  cannot_arrive: "تعذّر الوصول في الوقت المطلوب",
  other: "سبب آخر",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData } = await anonClient.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
    const reasonCode = typeof body.reasonCode === "string" ? body.reasonCode : "";
    const reasonNote = typeof body.reasonNote === "string" ? body.reasonNote.trim().slice(0, 500) : "";

    if (!bookingId || !REASONS.includes(reasonCode)) {
      return json({ error: "Invalid bookingId or reasonCode" }, 400);
    }
    if (reasonCode === "other" && !reasonNote) {
      return json({ error: "reasonNote required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, seeker_id, crew_id, status, location, payment_status, stripe_session_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.crew_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (booking.status !== "approved") return json({ error: "Booking is not active" }, 400);

    // Idempotency guard: don't double-refund
    const { data: existing } = await admin
      .from("booking_cancellations")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (existing) return json({ error: "Already cancelled" }, 409);

    const { data: cancellation, error: cancelInsertError } = await admin
      .from("booking_cancellations")
      .insert({
        booking_id: booking.id,
        crew_id: user.id,
        seeker_id: booking.seeker_id,
        reason_code: reasonCode,
        reason_note: reasonNote || null,
        refund_status: booking.payment_status === "paid" ? "pending" : "not_applicable",
      })
      .select("id")
      .single();

    if (cancelInsertError) throw new Error("Failed to record cancellation");

    // Refund via Stripe when the booking was paid
    let refundStatus = booking.payment_status === "paid" ? "failed" : "not_applicable";
    let refundId: string | null = null;

    if (booking.payment_status === "paid" && booking.stripe_session_id) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
        const paymentIntent = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
        if (paymentIntent) {
          const refund = await stripe.refunds.create({ payment_intent: paymentIntent });
          refundId = refund.id;
          refundStatus = refund.status === "succeeded" ? "refunded" : "pending";
        }
      } catch (e) {
        console.error("refund error:", e instanceof Error ? e.message : e);
      }
    }

    await admin
      .from("booking_cancellations")
      .update({ refund_status: refundStatus, refund_id: refundId })
      .eq("id", cancellation.id);

    const paymentStatus = refundStatus === "refunded"
      ? "refunded"
      : refundStatus === "pending"
        ? "refund_pending"
        : booking.payment_status;

    const { error: updateError } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        crew_id: null,
        crew_vehicle_name: null,
        crew_vehicle_plate: null,
        payment_status: paymentStatus,
        cancellation_reason: reasonCode,
        cancellation_reason_note: reasonNote || null,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateError) throw new Error("Failed to cancel booking");

    const refundLine = refundStatus === "refunded"
      ? " تم استرداد المبلغ كاملًا."
      : refundStatus === "pending"
        ? " جاري استرداد المبلغ."
        : "";

    await admin.from("notifications").insert({
      user_id: booking.seeker_id,
      booking_id: booking.id,
      title: "تعذّر توفير موقف",
      message: `اعتذر الطاقم عن طلبك في ${booking.location ?? ""} — السبب: ${
        REASON_AR[reasonCode]
      }${reasonNote ? ` (${reasonNote})` : ""}.${refundLine}`,
    });

    return json({ success: true, refundStatus }, 200);
  } catch (error) {
    console.error("crew-cancel-booking error:", error instanceof Error ? error.message : error);
    return json({ error: "Internal server error" }, 500);
  }
});
