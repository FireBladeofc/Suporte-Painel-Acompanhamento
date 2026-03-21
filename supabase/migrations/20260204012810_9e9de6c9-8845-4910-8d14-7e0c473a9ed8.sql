-- Create function to update timestamps first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create collaborators table
CREATE TABLE public.collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('N1', 'N2')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback_analyses table
CREATE TABLE public.feedback_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tone_attendant TEXT,
  tone_client TEXT,
  complaints_count INTEGER DEFAULT 0,
  questions_count INTEGER DEFAULT 0,
  processes_executed TEXT[],
  resolution_status TEXT,
  summary TEXT,
  insights TEXT[],
  feedback TEXT,
  engagement_level TEXT CHECK (engagement_level IN ('positive', 'neutral', 'negative')),
  strengths TEXT[],
  improvements TEXT[],
  patterns TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_files table
CREATE TABLE public.analysis_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.feedback_analyses(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_files ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Allow all access to collaborators" ON public.collaborators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to feedback_analyses" ON public.feedback_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to analysis_files" ON public.analysis_files FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for feedback files
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-files', 'feedback-files', true);

-- Storage policies
CREATE POLICY "Allow public read access to feedback files" ON storage.objects FOR SELECT USING (bucket_id = 'feedback-files');
CREATE POLICY "Allow public insert to feedback files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'feedback-files');
CREATE POLICY "Allow public delete from feedback files" ON storage.objects FOR DELETE USING (bucket_id = 'feedback-files');

-- Create updated_at trigger
CREATE TRIGGER update_collaborators_updated_at
BEFORE UPDATE ON public.collaborators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_feedback_analyses_collaborator ON public.feedback_analyses(collaborator_id);
CREATE INDEX idx_feedback_analyses_week ON public.feedback_analyses(week_start);
CREATE INDEX idx_analysis_files_analysis ON public.analysis_files(analysis_id);