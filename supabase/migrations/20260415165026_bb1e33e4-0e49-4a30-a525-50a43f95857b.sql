
CREATE OR REPLACE FUNCTION public.notify_support_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when admin_reply changes from null to a value
  IF OLD.admin_reply IS NULL AND NEW.admin_reply IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      NEW.user_id,
      'رد على تذكرة الدعم',
      'تم الرد على استفسارك: ' || LEFT(NEW.subject, 50)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_support_ticket_reply
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_support_reply();
