-- Realtime for bookings so dashboards update live
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;

-- Notify all crew members when a new request becomes paid & available
CREATE OR REPLACE FUNCTION public.notify_crew_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  crew_record RECORD;
BEGIN
  IF NEW.crew_id IS NULL
     AND NEW.status = 'pending'
     AND NEW.payment_status = 'paid'
     AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
    FOR crew_record IN
      SELECT user_id FROM public.profiles WHERE account_type = 'crew'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, booking_id)
      VALUES (
        crew_record.user_id,
        'طلب موقف جديد',
        'يوجد طلب جديد متاح في ' || COALESCE(NEW.location, ''),
        NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_crew_new_booking_ins ON public.bookings;
CREATE TRIGGER notify_crew_new_booking_ins
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_crew_new_booking();

DROP TRIGGER IF EXISTS notify_crew_new_booking_upd ON public.bookings;
CREATE TRIGGER notify_crew_new_booking_upd
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_crew_new_booking();

-- Notify crew when a spot requester assigns/completes: message on new chat handled client-side.
-- Notify crew when their withdrawal request is processed
CREATE OR REPLACE FUNCTION public.notify_withdrawal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      NEW.user_id,
      'تحديث طلب السحب',
      CASE NEW.status
        WHEN 'approved' THEN 'تم اعتماد طلب سحب بمبلغ ' || NEW.amount || ' ر.س'
        WHEN 'rejected' THEN 'تم رفض طلب سحب بمبلغ ' || NEW.amount || ' ر.س وأُعيد الرصيد لمحفظتك'
        WHEN 'paid'     THEN 'تم تحويل مبلغ ' || NEW.amount || ' ر.س إلى حسابك'
        ELSE 'تم تحديث حالة طلب السحب إلى: ' || NEW.status
      END
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_withdrawal_status_trg ON public.withdrawal_requests;
CREATE TRIGGER notify_withdrawal_status_trg
AFTER UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_withdrawal_status();

-- Remove duplicate booking-status notification trigger (was firing twice)
DROP TRIGGER IF EXISTS notify_booking_status_change_trigger ON public.bookings;