-- ============================================================
-- Migration: Restringir importação de planilhas apenas para Admins
-- Objetivo: Apenas usuários com role 'admin' podem inserir na
--           tabela ticket_imports (RLS level security).
-- ============================================================

-- Remove a policy permissiva de INSERT anterior
DROP POLICY IF EXISTS "Usuário autenticado pode inserir import" ON public.ticket_imports;

-- Nova policy: apenas admins podem importar planilhas
CREATE POLICY "Apenas admins podem importar planilhas"
  ON public.ticket_imports FOR INSERT
  TO authenticated
  WITH CHECK (
    imported_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- A policy de UPDATE também passa a exigir role admin
DROP POLICY IF EXISTS "Apenas owner pode atualizar" ON public.ticket_imports;

CREATE POLICY "Apenas admins podem atualizar imports"
  ON public.ticket_imports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );
