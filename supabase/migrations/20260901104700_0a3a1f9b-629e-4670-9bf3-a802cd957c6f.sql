DROP POLICY IF EXISTS "Crew can update assigned bookings" ON public.bookings;
CREATE POLICY "Crew can update assigned bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (auth.uid() = crew_id)
WITH CHECK (auth.uid() = crew_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);