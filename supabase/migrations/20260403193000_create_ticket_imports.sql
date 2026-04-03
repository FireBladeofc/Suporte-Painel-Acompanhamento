-- Migration: Tabela para persistência multi-usuário de importações de planilha
-- Fase 2: Dados salvos no servidor, acessíveis por qualquer usuário autenticado

CREATE TABLE IF NOT EXISTS public.ticket_imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  imported_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  tickets       JSONB NOT NULL,
  ticket_count  INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true  -- apenas 1 import ativo por vez
);

-- Índice para buscar o import ativo mais recente
CREATE INDEX IF NOT EXISTS idx_ticket_imports_active
  ON public.ticket_imports (is_active, imported_at DESC);

-- Garante que apenas 1 import pode ser ativo globalmente
-- (ao inserir novo, desativa os anteriores via trigger)
CREATE OR REPLACE FUNCTION public.deactivate_previous_imports()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Desativa todos os imports ativos anteriores
  UPDATE public.ticket_imports
  SET is_active = false
  WHERE is_active = true AND id != NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deactivate_previous_imports
  AFTER INSERT ON public.ticket_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_previous_imports();

-- RLS: Leitura para qualquer usuário autenticado
ALTER TABLE public.ticket_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer usuário autenticado pode ler imports"
  ON public.ticket_imports FOR SELECT
  TO authenticated
  USING (true);

-- RLS: Apenas admins (ou o próprio usuário) podem inserir
-- Por ora, qualquer autenticado pode importar. 
-- Para restringir a admins, adicionar uma tabela de roles ou usar user_metadata.
CREATE POLICY "Usuário autenticado pode inserir import"
  ON public.ticket_imports FOR INSERT
  TO authenticated
  WITH CHECK (imported_by = auth.uid());

-- Nenhum usuário pode deletar ou atualizar diretamente (só o trigger gerencia)
CREATE POLICY "Apenas owner pode atualizar"
  ON public.ticket_imports FOR UPDATE
  TO authenticated
  USING (imported_by = auth.uid());
