-- Fix: Change user_roles SELECT policies from RESTRICTIVE to PERMISSIVE
-- RESTRICTIVE policies use AND logic, which prevents non-admin users from reading their own role.
-- We need PERMISSIVE policies (OR logic) so users can read their own role OR admins can read all.

-- Drop existing RESTRICTIVE SELECT policies
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

-- Recreate as PERMISSIVE SELECT policies
CREATE POLICY "Users can read their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));