ALTER TABLE public.bookings 
  ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN stripe_session_id text;