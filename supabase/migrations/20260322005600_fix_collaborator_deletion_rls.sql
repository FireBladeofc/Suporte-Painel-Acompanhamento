
-- Add explicit DELETE policy for collaborators table
-- This ensures admins and managers can delete collaborators even if base policies are restrictive
DROP POLICY IF EXISTS "Managers and admins can delete collaborators" ON public.collaborators;

CREATE POLICY "Managers and admins can delete collaborators"
ON public.collaborators
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Also ensure they can delete from related tables if CASCADE isn't enough or for manual cleanup
DROP POLICY IF EXISTS "Managers and admins can delete collaborator profiles" ON public.collaborator_profiles;
CREATE POLICY "Managers and admins can delete collaborator profiles"
ON public.collaborator_profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Managers and admins can delete collaborator warnings" ON public.collaborator_warnings;
CREATE POLICY "Managers and admins can delete collaborator warnings"
ON public.collaborator_warnings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Managers and admins can delete attention flags" ON public.collaborator_attention_flags;
CREATE POLICY "Managers and admins can delete attention flags"
ON public.collaborator_attention_flags FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));
