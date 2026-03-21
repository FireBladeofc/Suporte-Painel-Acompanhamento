-- Create rate limit tracking table for edge functions
CREATE TABLE public.rate_limit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Only the service role (edge functions) should interact with this table
-- No user-facing policies needed - edge function uses service role client

-- Index for efficient rate limit queries
CREATE INDEX idx_rate_limit_logs_lookup ON public.rate_limit_logs (user_id, function_name, created_at DESC);

-- Auto-cleanup old entries (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_logs WHERE created_at < now() - interval '24 hours';
$$;