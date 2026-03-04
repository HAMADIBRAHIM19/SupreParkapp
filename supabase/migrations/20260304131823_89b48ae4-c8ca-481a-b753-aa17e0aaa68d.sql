
-- Allow crew to see pending bookings without assigned crew (so they can accept them)
DROP POLICY IF EXISTS "Crew can view assigned bookings " ON public.bookings;
CREATE POLICY "Crew can view available and assigned bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() = crew_id 
  OR (
    crew_id IS NULL 
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND account_type = 'crew'
    )
  )
);
