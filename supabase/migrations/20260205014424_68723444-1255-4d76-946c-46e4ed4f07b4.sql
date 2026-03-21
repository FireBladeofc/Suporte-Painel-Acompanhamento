-- Fix ERROR: Remove the policy that exposes all user roles to any authenticated user
-- Users should only see their own role, not everyone's roles
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;

-- Fix WARN: Storage delete permission mismatch - managers can delete DB records but not storage files
-- Update storage policy to allow managers to delete files too
DROP POLICY IF EXISTS "Admins can delete feedback files" ON storage.objects;

CREATE POLICY "Admins and managers can delete feedback files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'feedback-files' AND
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
);