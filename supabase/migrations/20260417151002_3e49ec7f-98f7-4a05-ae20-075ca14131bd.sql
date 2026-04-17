
-- 1) Prevent account_type escalation on profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND account_type = (SELECT p.account_type FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2) Restrict profile insert to authenticated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Restrict bookings policies to authenticated only
DROP POLICY IF EXISTS "Crew can update assigned bookings" ON public.bookings;
CREATE POLICY "Crew can update assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = crew_id);

DROP POLICY IF EXISTS "Crew can view assigned bookings" ON public.bookings;
CREATE POLICY "Crew can view assigned bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = crew_id);

DROP POLICY IF EXISTS "Seekers can create bookings" ON public.bookings;
CREATE POLICY "Seekers can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Seekers can update their bookings" ON public.bookings;
CREATE POLICY "Seekers can update their bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Seekers can view their bookings" ON public.bookings;
CREATE POLICY "Seekers can view their bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = seeker_id);
