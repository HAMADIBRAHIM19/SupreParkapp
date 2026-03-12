
-- Create messages table for booking chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for bookings they're part of (seeker or crew)
CREATE POLICY "Users can view booking messages"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = messages.booking_id
    AND (bookings.seeker_id = auth.uid() OR bookings.crew_id = auth.uid())
  )
);

-- Users can insert messages for bookings they're part of
CREATE POLICY "Users can send booking messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = messages.booking_id
    AND (bookings.seeker_id = auth.uid() OR bookings.crew_id = auth.uid())
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
