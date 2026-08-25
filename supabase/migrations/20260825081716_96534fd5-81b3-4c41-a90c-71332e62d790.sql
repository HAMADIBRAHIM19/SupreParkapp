-- 1. Replace tautological crew WITH CHECK
DROP POLICY IF EXISTS "Crew can update assigned bookings" ON public.bookings;
CREATE POLICY "Crew can update assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = crew_id)
WITH CHECK (auth.uid() = crew_id);

-- 2. Seeker update policy with explicit WITH CHECK on identity fields
DROP POLICY IF EXISTS "Seekers can update their bookings" ON public.bookings;
CREATE POLICY "Seekers can update their bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = seeker_id)
WITH CHECK (auth.uid() = seeker_id);

-- 3. Column-level enforcement using OLD values (RLS cannot reference OLD)
CREATE OR REPLACE FUNCTION public.enforce_bookings_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  -- Privileged / server-side contexts (service role, triggers with no JWT) are unrestricted
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Immutable for every client
  IF NEW.id <> OLD.id
     OR NEW.seeker_id <> OLD.seeker_id
     OR NEW.created_at <> OLD.created_at
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id THEN
    RAISE EXCEPTION 'Not allowed to modify payment or identity fields';
  END IF;

  IF uid = OLD.seeker_id THEN
    -- Seeker: may edit own request details and set final status; cannot touch crew fields
    IF NEW.crew_id IS DISTINCT FROM OLD.crew_id
       OR NEW.crew_vehicle_name IS DISTINCT FROM OLD.crew_vehicle_name
       OR NEW.crew_vehicle_plate IS DISTINCT FROM OLD.crew_vehicle_plate THEN
      RAISE EXCEPTION 'Not allowed to modify crew assignment fields';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('completed', 'cancelled') THEN
      RAISE EXCEPTION 'Invalid status transition';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.crew_id IS NULL AND NEW.crew_id = uid THEN
    -- Crew accepting a pending booking
    IF OLD.status <> 'pending' OR NEW.status <> 'approved' THEN
      RAISE EXCEPTION 'Invalid status transition';
    END IF;
    IF NEW.location <> OLD.location
       OR NEW.vehicle_plate <> OLD.vehicle_plate
       OR NEW.vehicle_name IS DISTINCT FROM OLD.vehicle_name
       OR NEW.scheduled_at <> OLD.scheduled_at
       OR NEW.notes IS DISTINCT FROM OLD.notes THEN
      RAISE EXCEPTION 'Not allowed to modify booking details';
    END IF;
    RETURN NEW;
  END IF;

  IF uid = OLD.crew_id THEN
    -- Assigned crew: only own vehicle details; status changes are seeker-only
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only the spot requester can change booking status';
    END IF;
    IF NEW.crew_id IS DISTINCT FROM OLD.crew_id
       OR NEW.location <> OLD.location
       OR NEW.vehicle_plate <> OLD.vehicle_plate
       OR NEW.vehicle_name IS DISTINCT FROM OLD.vehicle_name
       OR NEW.scheduled_at <> OLD.scheduled_at
       OR NEW.notes IS DISTINCT FROM OLD.notes THEN
      RAISE EXCEPTION 'Not allowed to modify booking details';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed to update this booking';
END;
$$;

DROP TRIGGER IF EXISTS enforce_bookings_update_scope ON public.bookings;
CREATE TRIGGER enforce_bookings_update_scope
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_bookings_update_scope();