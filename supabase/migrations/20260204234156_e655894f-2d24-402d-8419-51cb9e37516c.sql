-- Add a permissive policy to require authentication for reading user_roles
-- This prevents unauthenticated users from seeing role assignments
CREATE POLICY "Authenticated users can read roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);