-- ============================================================
-- Migration: Limite de tamanho em ticket_imports (SEG-009)
-- Objetivo: Prevenir inserção de payloads excessivamente grandes
--           que possam causar DoS ou custos elevados no Supabase.
-- ============================================================

-- 1. Constraint de limite de registros por importação
ALTER TABLE public.ticket_imports
  ADD CONSTRAINT chk_ticket_count_limit
  CHECK (ticket_count <= 50000);

-- 2. Função trigger para validar tamanho do payload JSONB
CREATE OR REPLACE FUNCTION public.validate_ticket_import_size()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload_size_bytes BIGINT;
BEGIN
  -- Estima o tamanho do payload JSONB em bytes
  payload_size_bytes := octet_length(NEW.tickets::text);

  -- Rejeita payloads maiores que 50 MB
  IF payload_size_bytes > 52428800 THEN
    RAISE EXCEPTION
      'Payload JSONB excede o limite de 50 MB (recebido: % MB). Reduza o número de registros.',
      round(payload_size_bytes / 1048576.0, 1);
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger BEFORE INSERT para validar antes de persistir
DROP TRIGGER IF EXISTS trg_validate_ticket_import_size ON public.ticket_imports;
CREATE TRIGGER trg_validate_ticket_import_size
  BEFORE INSERT ON public.ticket_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ticket_import_size();
