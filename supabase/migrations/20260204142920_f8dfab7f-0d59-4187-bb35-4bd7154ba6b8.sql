-- Allow managers to also delete feedback analyses and analysis files
DROP POLICY IF EXISTS "Admins can delete feedback analyses" ON public.feedback_analyses;
CREATE POLICY "Admins and managers can delete feedback analyses" 
ON public.feedback_analyses 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Admins can delete analysis files" ON public.analysis_files;
CREATE POLICY "Admins and managers can delete analysis files" 
ON public.analysis_files 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));