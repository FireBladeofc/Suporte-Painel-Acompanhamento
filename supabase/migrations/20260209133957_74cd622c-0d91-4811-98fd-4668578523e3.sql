
-- Step 1: Drop ALL "base access" policies (both old RESTRICTIVE and new PERMISSIVE versions)
DROP POLICY IF EXISTS "Authenticated users base access for analysis_files" ON public.analysis_files;
DROP POLICY IF EXISTS "Authenticated users base access for attention_flags" ON public.collaborator_attention_flags;
DROP POLICY IF EXISTS "Authenticated users base access for profiles" ON public.collaborator_profiles;
DROP POLICY IF EXISTS "Authenticated users base access for warnings" ON public.collaborator_warnings;
DROP POLICY IF EXISTS "Authenticated users base access for collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Authenticated users base access for feedback_analyses" ON public.feedback_analyses;
DROP POLICY IF EXISTS "Authenticated users base access for manual_feedbacks" ON public.manual_feedbacks;
DROP POLICY IF EXISTS "Authenticated users base access for user_roles" ON public.user_roles;

-- Step 2: Drop existing RESTRICTIVE role-based policies and recreate as PERMISSIVE

-- === analysis_files ===
DROP POLICY IF EXISTS "Managers and admins can read analysis files" ON public.analysis_files;
DROP POLICY IF EXISTS "Managers and admins can insert analysis files" ON public.analysis_files;
DROP POLICY IF EXISTS "Managers and admins can update analysis files" ON public.analysis_files;
DROP POLICY IF EXISTS "Admins and managers can delete analysis files" ON public.analysis_files;

CREATE POLICY "Managers and admins can read analysis files" ON public.analysis_files
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers and admins can insert analysis files" ON public.analysis_files
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers and admins can update analysis files" ON public.analysis_files
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can delete analysis files" ON public.analysis_files
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- === collaborator_attention_flags ===
DROP POLICY IF EXISTS "Admins and managers can read attention flags" ON public.collaborator_attention_flags;
DROP POLICY IF EXISTS "Admins and managers can insert attention flags" ON public.collaborator_attention_flags;
DROP POLICY IF EXISTS "Admins and managers can update attention flags" ON public.collaborator_attention_flags;
DROP POLICY IF EXISTS "Admins and managers can delete attention flags" ON public.collaborator_attention_flags;

CREATE POLICY "Admins and managers can read attention flags" ON public.collaborator_attention_flags
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can insert attention flags" ON public.collaborator_attention_flags
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can update attention flags" ON public.collaborator_attention_flags
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can delete attention flags" ON public.collaborator_attention_flags
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- === collaborator_profiles ===
DROP POLICY IF EXISTS "Admins and managers can read collaborator profiles" ON public.collaborator_profiles;
DROP POLICY IF EXISTS "Admins and managers can insert collaborator profiles" ON public.collaborator_profiles;
DROP POLICY IF EXISTS "Admins and managers can update collaborator profiles" ON public.collaborator_profiles;
DROP POLICY IF EXISTS "Admins and managers can delete collaborator profiles" ON public.collaborator_profiles;

CREATE POLICY "Admins and managers can read collaborator profiles" ON public.collaborator_profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can insert collaborator profiles" ON public.collaborator_profiles
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can update collaborator profiles" ON public.collaborator_profiles
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can delete collaborator profiles" ON public.collaborator_profiles
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- === collaborator_warnings ===
DROP POLICY IF EXISTS "Admins and managers can read collaborator warnings" ON public.collaborator_warnings;
DROP POLICY IF EXISTS "Admins and managers can insert collaborator warnings" ON public.collaborator_warnings;
DROP POLICY IF EXISTS "Admins and managers can update collaborator warnings" ON public.collaborator_warnings;
DROP POLICY IF EXISTS "Admins and managers can delete collaborator warnings" ON public.collaborator_warnings;

CREATE POLICY "Admins and managers can read collaborator warnings" ON public.collaborator_warnings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can insert collaborator warnings" ON public.collaborator_warnings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can update collaborator warnings" ON public.collaborator_warnings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can delete collaborator warnings" ON public.collaborator_warnings
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- === collaborators ===
DROP POLICY IF EXISTS "Managers and admins can read collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Managers and admins can insert collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Managers and admins can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can delete collaborators" ON public.collaborators;

CREATE POLICY "Managers and admins can read collaborators" ON public.collaborators
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers and admins can insert collaborators" ON public.collaborators
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers and admins can update collaborators" ON public.collaborators
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins can delete collaborators" ON public.collaborators
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- === feedback_analyses ===
DROP POLICY IF EXISTS "Managers and admins can read feedback analyses" ON public.feedback_analyses;
DROP POLICY IF EXISTS "Managers and admins can insert feedback analyses" ON public.feedback_analyses;
DROP POLICY IF EXISTS "Managers and admins can update feedback analyses" ON public.feedback_analyses;
DROP POLICY IF EXISTS "Admins and managers can delete feedback analyses" ON public.feedback_analyses;

CREATE POLICY "Managers and admins can read feedback analyses" ON public.feedback_analyses
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers and admins can insert feedback analyses" ON public.feedback_analyses
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers and admins can update feedback analyses" ON public.feedback_analyses
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can delete feedback analyses" ON public.feedback_analyses
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- === manual_feedbacks ===
DROP POLICY IF EXISTS "Admins and managers can read manual feedbacks" ON public.manual_feedbacks;
DROP POLICY IF EXISTS "Admins and managers can insert manual feedbacks" ON public.manual_feedbacks;
DROP POLICY IF EXISTS "Admins and managers can update manual feedbacks" ON public.manual_feedbacks;
DROP POLICY IF EXISTS "Admins and managers can delete manual feedbacks" ON public.manual_feedbacks;

CREATE POLICY "Admins and managers can read manual feedbacks" ON public.manual_feedbacks
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can insert manual feedbacks" ON public.manual_feedbacks
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can update manual feedbacks" ON public.manual_feedbacks
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can delete manual feedbacks" ON public.manual_feedbacks
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- === user_roles ===
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can read their own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
