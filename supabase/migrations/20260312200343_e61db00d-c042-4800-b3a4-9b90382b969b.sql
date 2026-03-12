
CREATE POLICY "Crew can accept pending bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  crew_id IS NULL 
  AND status = 'pending'::booking_status 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'crew'::account_type
  )
)
WITH CHECK (
  crew_id = auth.uid() 
  AND status = 'approved'::booking_status
);
