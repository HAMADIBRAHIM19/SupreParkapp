
-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id UUID NOT NULL,
  crew_id UUID,
  location TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  notes TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Seekers can view their own bookings
CREATE POLICY "Seekers can view their bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = seeker_id);

-- Crew can view bookings assigned to them
CREATE POLICY "Crew can view assigned bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = crew_id);

-- Seekers can create bookings
CREATE POLICY "Seekers can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = seeker_id);

-- Seekers can cancel their own bookings
CREATE POLICY "Seekers can update their bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = seeker_id);

-- Crew can update assigned bookings (approve/reject)
CREATE POLICY "Crew can update assigned bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = crew_id);

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
