-- ============================================================
-- Migration: Hardening de segurança do Storage Bucket (SEG-005)
-- Objetivo: Tornar o bucket feedback-files privado e restringir
--           acesso com políticas baseadas em roles autenticados.
-- ============================================================

-- 1. Revogar políticas públicas criadas na migration inicial
DROP POLICY IF EXISTS "Allow public read access to feedback files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert to feedback files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from feedback files" ON storage.objects;

-- 2. Tornar o bucket privado (sem acesso público via URL)
UPDATE storage.buckets
SET public = false
WHERE id = 'feedback-files';

-- 3. Leitura: apenas usuários autenticados com role admin ou manager
CREATE POLICY "Admins e managers podem ler arquivos de feedback"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'feedback-files'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'manager'::public.app_role)
    )
  );

-- 4. Upload: apenas admins e managers
CREATE POLICY "Admins e managers podem fazer upload de arquivos de feedback"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-files'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'manager'::public.app_role)
    )
  );

-- 5. Exclusão: apenas admins
CREATE POLICY "Apenas admins podem excluir arquivos de feedback"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feedback-files'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 6. Update de metadados: apenas admins e managers
CREATE POLICY "Admins e managers podem atualizar arquivos de feedback"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'feedback-files'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'manager'::public.app_role)
    )
  );
