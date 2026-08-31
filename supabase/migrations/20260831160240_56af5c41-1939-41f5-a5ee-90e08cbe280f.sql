CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  b RECORD;
  recipient uuid;
BEGIN
  SELECT seeker_id, crew_id, location INTO b FROM public.bookings WHERE id = NEW.booking_id;
  IF b IS NULL OR b.crew_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = b.seeker_id THEN
    recipient := b.crew_id;
  ELSIF NEW.sender_id = b.crew_id THEN
    recipient := b.seeker_id;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, booking_id)
  VALUES (
    recipient,
    'رسالة جديدة',
    'رسالة جديدة بخصوص الطلب في ' || COALESCE(b.location, '') || ': ' || LEFT(NEW.content, 100),
    NEW.booking_id
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_new_chat_message ON public.messages;
CREATE TRIGGER on_new_chat_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_chat_message();