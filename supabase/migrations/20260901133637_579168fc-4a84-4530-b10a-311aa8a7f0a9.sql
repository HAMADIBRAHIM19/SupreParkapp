ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

UPDATE public.bookings SET accepted_at = updated_at WHERE status = 'approved' AND accepted_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_booking_accepted_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved' THEN
    NEW.accepted_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_booking_accepted_at_trigger ON public.bookings;
CREATE TRIGGER set_booking_accepted_at_trigger
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_accepted_at();