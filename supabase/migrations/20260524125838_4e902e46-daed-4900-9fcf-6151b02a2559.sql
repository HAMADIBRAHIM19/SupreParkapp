
-- 1) Tighten INSERT policy for seekers on bookings
DROP POLICY IF EXISTS "Seekers can create bookings" ON public.bookings;
CREATE POLICY "Seekers can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = seeker_id
  AND payment_status = 'unpaid'
  AND status = 'pending'
  AND crew_id IS NULL
  AND crew_vehicle_name IS NULL
  AND crew_vehicle_plate IS NULL
  AND stripe_session_id IS NULL
);

-- 2) Validation trigger to lock down field mutations by role
CREATE OR REPLACE FUNCTION public.validate_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always immutable fields (regardless of who updates)
  IF NEW.seeker_id IS DISTINCT FROM OLD.seeker_id THEN
    RAISE EXCEPTION 'Cannot change seeker_id';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot change created_at';
  END IF;

  -- Seeker-initiated update
  IF auth.uid() = OLD.seeker_id AND (OLD.crew_id IS NULL OR auth.uid() <> OLD.crew_id) THEN
    -- Seekers cannot touch crew fields or payment status directly
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      RAISE EXCEPTION 'Seekers cannot change payment_status';
    END IF;
    IF NEW.crew_id IS DISTINCT FROM OLD.crew_id THEN
      RAISE EXCEPTION 'Seekers cannot change crew_id';
    END IF;
    IF NEW.crew_vehicle_name IS DISTINCT FROM OLD.crew_vehicle_name
       OR NEW.crew_vehicle_plate IS DISTINCT FROM OLD.crew_vehicle_plate THEN
      RAISE EXCEPTION 'Seekers cannot change crew vehicle info';
    END IF;
    IF NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id THEN
      RAISE EXCEPTION 'Seekers cannot change stripe_session_id';
    END IF;
    -- Restrict status transitions: only cancel from pending, or complete from approved
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (
        (OLD.status = 'pending'  AND NEW.status IN ('cancelled')) OR
        (OLD.status = 'approved' AND NEW.status IN ('completed','cancelled'))
      ) THEN
        RAISE EXCEPTION 'Invalid status transition for seeker: % -> %', OLD.status, NEW.status;
      END IF;
      -- Completion requires payment to be paid
      IF NEW.status = 'completed' AND OLD.payment_status <> 'paid' THEN
        RAISE EXCEPTION 'Cannot complete an unpaid booking';
      END IF;
    END IF;

  -- Crew-initiated update (assigned crew only; acceptance handled by separate policy)
  ELSIF auth.uid() = OLD.crew_id THEN
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      RAISE EXCEPTION 'Crew cannot change payment_status';
    END IF;
    IF NEW.location IS DISTINCT FROM OLD.location
       OR NEW.vehicle_plate IS DISTINCT FROM OLD.vehicle_plate
       OR NEW.vehicle_name IS DISTINCT FROM OLD.vehicle_name
       OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at
       OR NEW.notes IS DISTINCT FROM OLD.notes THEN
      RAISE EXCEPTION 'Crew cannot modify seeker-owned booking fields';
    END IF;
    IF NEW.crew_id IS DISTINCT FROM OLD.crew_id THEN
      RAISE EXCEPTION 'Crew cannot reassign booking';
    END IF;
    IF NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id THEN
      RAISE EXCEPTION 'Crew cannot change stripe_session_id';
    END IF;
    -- Crew cannot change status (completion is seeker-only; acceptance uses different policy path)
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'approved' THEN
      RAISE EXCEPTION 'Crew cannot change status to %', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_booking_update_trigger ON public.bookings;
CREATE TRIGGER validate_booking_update_trigger
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_booking_update();

-- 3) Drop unused phone column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- Update handle_new_user to not insert phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::account_type, 'seeker')
  );
  RETURN NEW;
END;
$$;

-- 4) Revoke execute on internal trigger-only / definer functions from public roles
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_booking_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_wallet_on_withdrawal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_wallet_on_rejection() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_support_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_crew_on_completion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_crew_wallet() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_account_type_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_booking_update() FROM PUBLIC, anon, authenticated;
