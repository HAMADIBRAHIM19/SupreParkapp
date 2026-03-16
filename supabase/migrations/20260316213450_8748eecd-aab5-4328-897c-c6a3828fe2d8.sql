
-- Crew wallet table
CREATE TABLE public.crew_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crew_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew can view their own wallet"
ON public.crew_wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Wallet transactions history
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.crew_wallets(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew can view their own transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.crew_wallets
  WHERE crew_wallets.id = wallet_transactions.wallet_id
  AND crew_wallets.user_id = auth.uid()
));

-- Trigger: auto-create wallet for crew on profile creation
CREATE OR REPLACE FUNCTION public.create_crew_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type = 'crew' THEN
    INSERT INTO public.crew_wallets (user_id) VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_crew_wallet_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_crew_wallet();

-- Trigger: credit crew wallet on booking completion (25% of 39 SAR = 9.75)
CREATE OR REPLACE FUNCTION public.credit_crew_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  crew_wallet_id uuid;
  credit_amount numeric(10,2) := 9.75; -- 25% of 39 SAR
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
    VALUES (crew_wallet_id, NEW.id, credit_amount, 'عمولة إكمال طلب - 25% من 39 ر.س');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER credit_crew_wallet_on_completion
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.credit_crew_on_completion();

-- Create wallets for existing crew members
INSERT INTO public.crew_wallets (user_id)
SELECT user_id FROM public.profiles WHERE account_type = 'crew'
ON CONFLICT (user_id) DO NOTHING;
