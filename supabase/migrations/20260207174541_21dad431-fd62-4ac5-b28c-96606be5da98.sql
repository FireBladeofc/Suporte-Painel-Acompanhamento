
-- Drop the broad ALL policy and replace with explicit per-operation policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Explicit SELECT policy for admins (to see all roles, not just their own)
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Explicit INSERT policy - only admins can create role assignments
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Explicit UPDATE policy - only admins can modify role assignments
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Explicit DELETE policy - only admins can remove role assignments
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
