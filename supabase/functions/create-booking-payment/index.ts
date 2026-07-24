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

const parseJwtPayload = (token: string) => {
  const payload = token.split(".")[1];
  if (!payload) {
    throw new Error("Invalid token");
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(atob(padded)) as { sub?: string; email?: string };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "User not authenticated" }, 401);
    }

    const body = await req.json();
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const currency = (typeof body.currency === "string" ? body.currency : "sar").toLowerCase();
    const amountMinor = typeof body.amountMinor === "number" ? Math.round(body.amountMinor) : Math.round(amount * 100);

    if (!bookingId || !Number.isFinite(amount) || !Number.isFinite(amountMinor) || amountMinor <= 0) {
      return json({ error: "Missing bookingId or amount" }, 400);
    }

    const token = authHeader.replace("Bearer ", "");
    const tokenPayload = parseJwtPayload(token);

    if (!tokenPayload.sub) {
      return json({ error: "User not authenticated" }, 401);
    }

    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: booking, error: bookingError } = await supabaseUserClient
      .from("bookings")
      .select("id, seeker_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return json({ error: "Booking not found or access denied" }, 404);
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      booking.seeker_id,
    );

    const userEmail = userData.user?.email ?? tokenPayload.email;
    if (userError || !userEmail) {
      return json({ error: "User not authenticated" }, 401);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") ?? "https://idea-to-reality-pad.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amountMinor,
            product_data: {
              name: "SuperParking Booking",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${origin}/payment-cancel?booking_id=${bookingId}`,
      metadata: {
        booking_id: bookingId,
        user_id: booking.seeker_id,
        currency,
        amount: String(amount),
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", bookingId);

    if (updateError) {
      throw new Error("Failed to save payment session");
    }

    return json({ url: session.url }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-booking-payment error:", message);
    return json({ error: "Internal server error" }, 500);
  }
});