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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
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
    if (!bookingId) return json({ error: "Invalid bookingId" }, 400);

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
    if (booking.seeker_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (booking.status !== "pending" || booking.crew_id) {
      return json({ error: "Booking cannot be cancelled" }, 400);
    }
    if (booking.payment_status === "refunded" || booking.payment_status === "refund_pending") {
      return json({ error: "Already refunded" }, 409);
    }

    let refundStatus = booking.payment_status === "paid" ? "failed" : "not_applicable";

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
          refundStatus = refund.status === "succeeded" ? "refunded" : "pending";
        }
      } catch (e) {
        console.error("refund error:", e instanceof Error ? e.message : e);
      }
    }

    const paymentStatus = refundStatus === "refunded"
      ? "refunded"
      : refundStatus === "pending"
        ? "refund_pending"
        : booking.payment_status;

    const { error: updateError } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: paymentStatus,
        cancellation_reason: "seeker_no_crew",
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
      title: "تم إلغاء الطلب",
      message: `تم إلغاء طلبك في ${booking.location ?? ""} بسبب عدم قبول أي فرد من الطاقم.${refundLine}`,
    });

    return json({ success: true, refundStatus }, 200);
  } catch (error) {
    console.error("seeker-cancel-booking error:", error instanceof Error ? error.message : error);
    return json({ error: "Internal server error" }, 500);
  }
});
