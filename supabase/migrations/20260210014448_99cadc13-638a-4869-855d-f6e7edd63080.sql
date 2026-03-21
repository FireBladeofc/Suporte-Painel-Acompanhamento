
-- Create development plans (PDI) table
CREATE TABLE public.development_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'in_progress',
  priority TEXT NOT NULL DEFAULT 'medium',
  source TEXT NOT NULL DEFAULT 'manual',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.development_plans ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users can manage)
CREATE POLICY "Authenticated users can view development plans"
ON public.development_plans FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can create development plans"
ON public.development_plans FOR INSERT
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update development plans"
ON public.development_plans FOR UPDATE
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete development plans"
ON public.development_plans FOR DELETE
USING (public.is_authenticated());

-- Trigger for updated_at
CREATE TRIGGER update_development_plans_updated_at
BEFORE UPDATE ON public.development_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
