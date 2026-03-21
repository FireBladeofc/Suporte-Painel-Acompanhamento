
-- Add RLS policies for rate_limit_logs table
-- Only the cleanup function (SECURITY DEFINER) and edge functions using service role should access this table
-- Users should be able to insert their own rate limit logs

CREATE POLICY "Users can insert their own rate limit logs"
ON public.rate_limit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read rate limit logs"
ON public.rate_limit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rate limit logs"
ON public.rate_limit_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
