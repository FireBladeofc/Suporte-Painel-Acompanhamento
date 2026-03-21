
-- Fix: Add PERMISSIVE policies requiring authentication on all tables.
-- RESTRICTIVE-only policies need a base PERMISSIVE policy to work correctly.

-- analysis_files
CREATE POLICY "Authenticated users base access for analysis_files"
ON public.analysis_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- collaborator_attention_flags
CREATE POLICY "Authenticated users base access for attention_flags"
ON public.collaborator_attention_flags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- collaborator_profiles
CREATE POLICY "Authenticated users base access for profiles"
ON public.collaborator_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- collaborator_warnings
CREATE POLICY "Authenticated users base access for warnings"
ON public.collaborator_warnings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- collaborators
CREATE POLICY "Authenticated users base access for collaborators"
ON public.collaborators FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- feedback_analyses
CREATE POLICY "Authenticated users base access for feedback_analyses"
ON public.feedback_analyses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- manual_feedbacks
CREATE POLICY "Authenticated users base access for manual_feedbacks"
ON public.manual_feedbacks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- user_roles
CREATE POLICY "Authenticated users base access for user_roles"
ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
