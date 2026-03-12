
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow insert from triggers (service role)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger function to generate notification on booking status change
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  status_label text;
  notif_title text;
  notif_message text;
  target_user_id uuid;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map status to Arabic label
  CASE NEW.status
    WHEN 'approved' THEN status_label := 'مقبول';
    WHEN 'rejected' THEN status_label := 'مرفوض';
    WHEN 'completed' THEN status_label := 'مكتمل';
    WHEN 'cancelled' THEN status_label := 'ملغي';
    WHEN 'pending' THEN status_label := 'قيد الانتظار';
    ELSE status_label := NEW.status::text;
  END CASE;

  notif_title := 'تحديث حالة الحجز';
  notif_message := 'تم تغيير حالة حجزك في ' || COALESCE(NEW.location, '') || ' إلى: ' || status_label;

  -- Notify the seeker
  INSERT INTO public.notifications (user_id, title, message, booking_id)
  VALUES (NEW.seeker_id, notif_title, notif_message, NEW.id);

  -- Also notify crew if assigned
  IF NEW.crew_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, booking_id)
    VALUES (NEW.crew_id, notif_title, 'تم تغيير حالة الحجز في ' || COALESCE(NEW.location, '') || ' إلى: ' || status_label, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to bookings table
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();
