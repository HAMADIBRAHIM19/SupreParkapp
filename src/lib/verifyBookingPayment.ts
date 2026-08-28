import { supabase } from "@/integrations/supabase/client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Confirms a booking payment after the user returns from Stripe checkout.
 * Reads the stored checkout session for the booking and asks the backend to
 * verify it, retrying a few times because Stripe may need a moment to settle.
 * Resolves true when the booking ends up paid.
 */
export async function verifyBookingPayment(bookingId: string, attempts = 6): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("payment_status, stripe_session_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (booking?.payment_status === "paid") return true;

    if (booking?.stripe_session_id) {
      try {
        const { data } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId: booking.stripe_session_id, bookingId },
        });
        if (data?.paid) return true;
      } catch (e) {
        console.error("verify-payment failed", e);
      }
    }

    if (i < attempts - 1) await sleep(2000);
  }
  return false;
}
