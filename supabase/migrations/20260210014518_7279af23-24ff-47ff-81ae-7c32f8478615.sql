
-- Drop overly permissive policies
DROP POLICY "Authenticated users can view development plans" ON public.development_plans;
DROP POLICY "Authenticated users can create development plans" ON public.development_plans;
DROP POLICY "Authenticated users can update development plans" ON public.development_plans;
DROP POLICY "Authenticated users can delete development plans" ON public.development_plans;

-- Create role-based policies matching existing pattern
CREATE POLICY "Admins and managers can read development plans"
ON public.development_plans FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can insert development plans"
ON public.development_plans FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update development plans"
ON public.development_plans FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can delete development plans"
ON public.development_plans FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
