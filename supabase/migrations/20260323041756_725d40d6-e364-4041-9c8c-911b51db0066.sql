CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  seeker_id uuid NOT NULL,
  crew_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seekers can insert their own ratings"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Users can view ratings for their bookings"
  ON public.ratings FOR SELECT TO authenticated
  USING (auth.uid() = seeker_id OR auth.uid() = crew_id);
