
-- Realtime: chat channels restricted to booking participants
CREATE POLICY "Booking members can read chat channel"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'chat-%'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = SUBSTRING(realtime.topic() FROM 6)
      AND (b.seeker_id = auth.uid() OR b.crew_id = auth.uid())
  )
);

-- Realtime: per-user notifications channel
CREATE POLICY "Users can read own notifications channel"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notifications-' || auth.uid()::text
);

-- Withdrawal balance enforcement via trigger (CHECK constraints can't reference other tables)
CREATE OR REPLACE FUNCTION public.enforce_withdrawal_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric(10,2);
BEGIN
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive';
  END IF;

  SELECT balance INTO current_balance
  FROM public.crew_wallets
  WHERE id = NEW.wallet_id AND user_id = NEW.user_id;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for this user';
  END IF;

  IF NEW.amount > current_balance THEN
    RAISE EXCEPTION 'Withdrawal amount exceeds available balance';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_withdrawal_balance_trigger ON public.withdrawal_requests;
CREATE TRIGGER enforce_withdrawal_balance_trigger
BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_withdrawal_balance();
