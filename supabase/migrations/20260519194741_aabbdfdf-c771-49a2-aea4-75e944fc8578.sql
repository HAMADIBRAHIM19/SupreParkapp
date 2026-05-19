
-- 1) Prevent users from escalating their own account_type
CREATE OR REPLACE FUNCTION public.prevent_account_type_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Changing account_type is not allowed';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Changing user_id is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_account_type_change_trg ON public.profiles;
CREATE TRIGGER prevent_account_type_change_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_account_type_change();

-- 2) Drop unused contact_number column to eliminate PII exposure
ALTER TABLE public.bookings DROP COLUMN IF EXISTS contact_number;

-- 3) Realtime channel authorization for tracking-{bookingId}
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking members can read tracking channel" ON realtime.messages;
CREATE POLICY "Booking members can read tracking channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'tracking-%'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = substring(realtime.topic() from 10)
      AND (b.seeker_id = auth.uid() OR b.crew_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Booking members can broadcast tracking channel" ON realtime.messages;
CREATE POLICY "Booking members can broadcast tracking channel"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'tracking-%'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = substring(realtime.topic() from 10)
      AND (b.seeker_id = auth.uid() OR b.crew_id = auth.uid())
  )
);
