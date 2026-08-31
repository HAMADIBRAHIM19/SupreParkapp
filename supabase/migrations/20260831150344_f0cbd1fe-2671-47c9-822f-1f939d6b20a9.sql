ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_reason_note text;

CREATE TABLE public.booking_cancellations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  crew_id uuid NOT NULL,
  seeker_id uuid NOT NULL,
  reason_code text NOT NULL,
  reason_note text,
  refund_status text NOT NULL DEFAULT 'pending',
  refund_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.booking_cancellations TO authenticated;
GRANT ALL ON public.booking_cancellations TO service_role;

ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their cancellations"
ON public.booking_cancellations FOR SELECT TO authenticated
USING (auth.uid() = crew_id OR auth.uid() = seeker_id);

CREATE POLICY "Admins can view all cancellations"
ON public.booking_cancellations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny client inserts on booking_cancellations"
ON public.booking_cancellations FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "Deny client updates on booking_cancellations"
ON public.booking_cancellations FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes on booking_cancellations"
ON public.booking_cancellations FOR DELETE TO anon, authenticated USING (false);

CREATE INDEX idx_booking_cancellations_booking ON public.booking_cancellations(booking_id);

CREATE TRIGGER update_booking_cancellations_updated_at
BEFORE UPDATE ON public.booking_cancellations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();