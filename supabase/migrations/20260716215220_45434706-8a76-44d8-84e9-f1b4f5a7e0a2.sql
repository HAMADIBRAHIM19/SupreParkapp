
-- Fix 1: bookings_crew_update_scope
-- Ensure validate_booking_update trigger is actually attached (schema shows no triggers exist)
-- and tighten the crew update RLS policy with an explicit WITH CHECK constraint
-- so field restrictions don't rely solely on trigger execution.

DROP TRIGGER IF EXISTS validate_booking_update_trigger ON public.bookings;
CREATE TRIGGER validate_booking_update_trigger
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_update();

-- Re-attach other booking-related triggers that also depend on functions above
DROP TRIGGER IF EXISTS notify_booking_status_change_trigger ON public.bookings;
CREATE TRIGGER notify_booking_status_change_trigger
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status_change();

DROP TRIGGER IF EXISTS credit_crew_on_completion_trigger ON public.bookings;
CREATE TRIGGER credit_crew_on_completion_trigger
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.credit_crew_on_completion();

-- Tighten the crew update policy: at RLS level, enforce that immutable/seeker-owned
-- fields cannot be changed. Trigger still provides defense in depth.
DROP POLICY IF EXISTS "Crew can update assigned bookings" ON public.bookings;
CREATE POLICY "Crew can update assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = crew_id)
WITH CHECK (
  auth.uid() = crew_id
  AND crew_id = (SELECT b.crew_id FROM public.bookings b WHERE b.id = bookings.id)
  AND seeker_id = (SELECT b.seeker_id FROM public.bookings b WHERE b.id = bookings.id)
  AND location = (SELECT b.location FROM public.bookings b WHERE b.id = bookings.id)
  AND vehicle_plate = (SELECT b.vehicle_plate FROM public.bookings b WHERE b.id = bookings.id)
  AND scheduled_at = (SELECT b.scheduled_at FROM public.bookings b WHERE b.id = bookings.id)
  AND payment_status = (SELECT b.payment_status FROM public.bookings b WHERE b.id = bookings.id)
  AND created_at = (SELECT b.created_at FROM public.bookings b WHERE b.id = bookings.id)
);

-- Fix 2: wallet_transactions_no_write_restriction_check
-- Add explicit, permanent deny policies for INSERT/UPDATE/DELETE on wallet_transactions
-- so writes are blocked at the policy level and only SECURITY DEFINER triggers can write.
DROP POLICY IF EXISTS "Deny all client inserts on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Deny all client inserts on wallet_transactions"
ON public.wallet_transactions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all client updates on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Deny all client updates on wallet_transactions"
ON public.wallet_transactions
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all client deletes on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Deny all client deletes on wallet_transactions"
ON public.wallet_transactions
FOR DELETE
TO authenticated, anon
USING (false);
