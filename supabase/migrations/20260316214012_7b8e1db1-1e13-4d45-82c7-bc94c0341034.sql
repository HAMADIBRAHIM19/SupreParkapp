
-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.crew_wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bank_name text,
  iban text,
  holder_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew can view their own withdrawals"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Crew can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger to deduct balance on withdrawal request
CREATE OR REPLACE FUNCTION public.deduct_wallet_on_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric(10,2);
BEGIN
  SELECT balance INTO current_balance FROM public.crew_wallets WHERE id = NEW.wallet_id AND user_id = NEW.user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'المحفظة غير موجودة';
  END IF;
  
  IF current_balance < NEW.amount THEN
    RAISE EXCEPTION 'الرصيد غير كافٍ';
  END IF;
  
  UPDATE public.crew_wallets SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.wallet_id;
  
  -- Record transaction
  INSERT INTO public.wallet_transactions (wallet_id, amount, description)
  VALUES (NEW.wallet_id, -NEW.amount, 'طلب سحب رصيد');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER deduct_on_withdrawal
BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.deduct_wallet_on_withdrawal();
