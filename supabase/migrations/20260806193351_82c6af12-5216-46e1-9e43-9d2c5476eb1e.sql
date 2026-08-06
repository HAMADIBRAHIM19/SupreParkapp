CREATE OR REPLACE FUNCTION public.credit_crew_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  crew_wallet_id uuid;
  credit_amount numeric(10,2) := 7.25; -- 25% of 29 SAR
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' AND NEW.crew_id IS NOT NULL THEN
    -- Ensure wallet exists
    INSERT INTO public.crew_wallets (user_id) VALUES (NEW.crew_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO crew_wallet_id FROM public.crew_wallets WHERE user_id = NEW.crew_id;

    -- Credit wallet
    UPDATE public.crew_wallets SET balance = balance + credit_amount, updated_at = now()
    WHERE id = crew_wallet_id;

    -- Record transaction
    INSERT INTO public.wallet_transactions (wallet_id, booking_id, amount, description)
    VALUES (crew_wallet_id, NEW.id, credit_amount, 'عمولة إكمال طلب - 25% من 29 ر.س');
  END IF;
  RETURN NEW;
END;
$$;