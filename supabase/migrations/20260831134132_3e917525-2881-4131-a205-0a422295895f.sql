DROP POLICY IF EXISTS "Crew can update assigned bookings" ON public.bookings;

CREATE POLICY "Crew can update assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = crew_id)
WITH CHECK (
  auth.uid() = crew_id
  AND status <> 'completed'::booking_status
  AND status = (SELECT b.status FROM public.bookings b WHERE b.id = bookings.id)
);