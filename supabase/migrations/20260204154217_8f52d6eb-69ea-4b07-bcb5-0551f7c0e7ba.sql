-- Fix PUBLIC_DATA_EXPOSURE: Restrict feedback_analyses SELECT to managers/admins only
DROP POLICY IF EXISTS "Authenticated users can read feedback analyses" ON public.feedback_analyses;

CREATE POLICY "Managers and admins can read feedback analyses"
  ON public.feedback_analyses FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );

-- Fix PUBLIC_DATA_EXPOSURE: Restrict analysis_files SELECT to managers/admins only
DROP POLICY IF EXISTS "Authenticated users can read analysis files" ON public.analysis_files;

CREATE POLICY "Managers and admins can read analysis files"
  ON public.analysis_files FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );

-- Fix STORAGE_EXPOSURE: Restrict feedback-files storage SELECT to managers/admins only
DROP POLICY IF EXISTS "Authenticated users can read feedback files" ON storage.objects;

CREATE POLICY "Managers and admins can read feedback files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'feedback-files' AND
    (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  );

-- Fix MISSING_RLS_PROTECTION: Restrict collaborators SELECT to managers/admins only
DROP POLICY IF EXISTS "Authenticated users can read collaborators" ON public.collaborators;

CREATE POLICY "Managers and admins can read collaborators"
  ON public.collaborators FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );