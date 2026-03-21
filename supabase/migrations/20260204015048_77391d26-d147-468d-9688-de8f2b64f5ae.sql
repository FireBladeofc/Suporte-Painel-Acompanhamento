-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Policy for user_roles table
CREATE POLICY "Users can read their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all access to collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Allow all access to feedback_analyses" ON public.feedback_analyses;
DROP POLICY IF EXISTS "Allow all access to analysis_files" ON public.analysis_files;

-- Create secure RLS policies for collaborators (authenticated users can read, managers/admins can modify)
CREATE POLICY "Authenticated users can read collaborators"
  ON public.collaborators FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Managers and admins can insert collaborators"
  ON public.collaborators FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers and admins can update collaborators"
  ON public.collaborators FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete collaborators"
  ON public.collaborators FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RLS policies for feedback_analyses
CREATE POLICY "Authenticated users can read feedback analyses"
  ON public.feedback_analyses FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Managers and admins can insert feedback analyses"
  ON public.feedback_analyses FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers and admins can update feedback analyses"
  ON public.feedback_analyses FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete feedback analyses"
  ON public.feedback_analyses FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RLS policies for analysis_files
CREATE POLICY "Authenticated users can read analysis files"
  ON public.analysis_files FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Managers and admins can insert analysis files"
  ON public.analysis_files FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers and admins can update analysis files"
  ON public.analysis_files FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete analysis files"
  ON public.analysis_files FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix storage bucket: make it private
UPDATE storage.buckets SET public = false WHERE id = 'feedback-files';

-- Drop existing public storage policies
DROP POLICY IF EXISTS "Allow public read access to feedback files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert to feedback files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from feedback files" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Authenticated users can read feedback files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'feedback-files' AND
    public.is_authenticated()
  );

CREATE POLICY "Managers and admins can upload feedback files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'feedback-files' AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins can delete feedback files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'feedback-files' AND
    public.has_role(auth.uid(), 'admin')
  );