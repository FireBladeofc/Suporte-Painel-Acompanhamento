-- Tabela de perfis do colaborador
CREATE TABLE public.collaborator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  work_start_time time,
  work_end_time time,
  work_days text[] DEFAULT '{"seg","ter","qua","qui","sex"}',
  technical_level integer CHECK (technical_level >= 1 AND technical_level <= 5),
  communication_level integer CHECK (communication_level >= 1 AND communication_level <= 5),
  main_difficulties text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collaborator_id)
);

-- Tabela de advertências
CREATE TABLE public.collaborator_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  warning_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('verbal', 'escrita', 'suspensao')),
  reason text NOT NULL,
  details text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de sinais de atenção
CREATE TABLE public.collaborator_attention_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  flag_date date NOT NULL DEFAULT CURRENT_DATE,
  severity text NOT NULL CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'resolvido', 'monitorando')),
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.collaborator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_attention_flags ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at nos perfis
CREATE TRIGGER update_collaborator_profiles_updated_at
  BEFORE UPDATE ON public.collaborator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nos sinais de atenção
CREATE TRIGGER update_collaborator_attention_flags_updated_at
  BEFORE UPDATE ON public.collaborator_attention_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para collaborator_profiles
CREATE POLICY "Admins and managers can read collaborator profiles"
  ON public.collaborator_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can insert collaborator profiles"
  ON public.collaborator_profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update collaborator profiles"
  ON public.collaborator_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can delete collaborator profiles"
  ON public.collaborator_profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies para collaborator_warnings
CREATE POLICY "Admins and managers can read collaborator warnings"
  ON public.collaborator_warnings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can insert collaborator warnings"
  ON public.collaborator_warnings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update collaborator warnings"
  ON public.collaborator_warnings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can delete collaborator warnings"
  ON public.collaborator_warnings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies para collaborator_attention_flags
CREATE POLICY "Admins and managers can read attention flags"
  ON public.collaborator_attention_flags FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can insert attention flags"
  ON public.collaborator_attention_flags FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update attention flags"
  ON public.collaborator_attention_flags FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can delete attention flags"
  ON public.collaborator_attention_flags FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));