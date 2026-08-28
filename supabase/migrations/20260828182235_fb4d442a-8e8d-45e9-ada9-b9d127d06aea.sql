-- Device push tokens
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'unknown',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can register their own push tokens"
ON public.push_tokens FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
ON public.push_tokens FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX push_tokens_user_id_idx ON public.push_tokens(user_id);

-- Internal config (no client access at all)
CREATE TABLE public.app_config (
  key text NOT NULL PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_config TO service_role;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all client reads on app_config"
ON public.app_config FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Deny all client inserts on app_config"
ON public.app_config FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny all client updates on app_config"
ON public.app_config FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny all client deletes on app_config"
ON public.app_config FOR DELETE TO anon, authenticated USING (false);

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Dispatch a push message for every new in-app notification
CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  fn_url text;
  hook_secret text;
BEGIN
  SELECT value INTO fn_url FROM public.app_config WHERE key = 'push_function_url';
  SELECT value INTO hook_secret FROM public.app_config WHERE key = 'push_hook_secret';

  IF fn_url IS NULL OR hook_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-hook-secret', hook_secret
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.message,
      'notification_id', NEW.id,
      'booking_id', NEW.booking_id
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER dispatch_push_on_notification
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_notification();