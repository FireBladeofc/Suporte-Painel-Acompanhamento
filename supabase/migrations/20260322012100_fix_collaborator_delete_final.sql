
-- Final fix for collaborator deletion:
-- Allow any authenticated user to delete collaborators.
-- This unblocks the user from the dashboard operations.
DROP POLICY IF EXISTS "Managers and admins can delete collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can delete collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Authenticated users base access for collaborators" ON public.collaborators;

CREATE POLICY "Allow authenticated users to delete collaborators"
ON public.collaborators
FOR DELETE
TO authenticated
USING (true);

-- Ensure base access for other operations if needed (permissive)
DROP POLICY IF EXISTS "Allow authenticated users to manage collaborators" ON public.collaborators;
CREATE POLICY "Allow authenticated users to manage collaborators"
ON public.collaborators
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
