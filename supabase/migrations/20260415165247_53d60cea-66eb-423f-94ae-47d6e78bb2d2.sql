
CREATE OR REPLACE FUNCTION public.notify_admins_new_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      admin_record.user_id,
      'تذكرة دعم جديدة',
      'تذكرة جديدة من مستخدم بعنوان: ' || LEFT(NEW.subject, 50)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_support_ticket
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_ticket();
