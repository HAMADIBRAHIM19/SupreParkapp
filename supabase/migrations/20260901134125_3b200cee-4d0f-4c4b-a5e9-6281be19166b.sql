CREATE OR REPLACE FUNCTION public.notify_refund_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notif_title text;
  notif_message text;
BEGIN
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status
     AND NEW.payment_status IN ('refunded', 'refund_pending') THEN

    IF NEW.payment_status = 'refunded' THEN
      notif_title := 'تم استرداد المبلغ';
      notif_message := 'تم استرداد مبلغ طلبك في ' || COALESCE(NEW.location, '') || ' كاملًا.';
    ELSE
      notif_title := 'الاسترداد قيد التنفيذ';
      notif_message := 'جاري استرداد مبلغ طلبك في ' || COALESCE(NEW.location, '') || '.';
    END IF;

    INSERT INTO public.notifications (user_id, title, message, booking_id)
    VALUES (NEW.seeker_id, notif_title, notif_message, NEW.id);

    IF NEW.crew_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, booking_id)
      VALUES (NEW.crew_id, notif_title, notif_message, NEW.id);
    ELSIF OLD.crew_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, booking_id)
      VALUES (OLD.crew_id, notif_title, notif_message, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_refund_status_change ON public.bookings;
CREATE TRIGGER on_booking_refund_status_change
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_refund_status_change();