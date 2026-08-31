ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));