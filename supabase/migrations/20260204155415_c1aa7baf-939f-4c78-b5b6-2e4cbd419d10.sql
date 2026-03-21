-- Create manual_feedbacks table for tracking individual feedback sessions
CREATE TABLE public.manual_feedbacks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
    feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    category TEXT CHECK (category IN ('performance', 'behavior', 'recognition', 'other')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.manual_feedbacks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin and manager access only
CREATE POLICY "Admins and managers can read manual feedbacks"
ON public.manual_feedbacks
FOR SELECT
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins and managers can insert manual feedbacks"
ON public.manual_feedbacks
FOR INSERT
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins and managers can update manual feedbacks"
ON public.manual_feedbacks
FOR UPDATE
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins and managers can delete manual feedbacks"
ON public.manual_feedbacks
FOR DELETE
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
);

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_manual_feedbacks_updated_at
BEFORE UPDATE ON public.manual_feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_manual_feedbacks_collaborator_id ON public.manual_feedbacks(collaborator_id);
CREATE INDEX idx_manual_feedbacks_status ON public.manual_feedbacks(status);
CREATE INDEX idx_manual_feedbacks_feedback_date ON public.manual_feedbacks(feedback_date DESC);