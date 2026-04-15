-- ============================================================
-- Migration: CORREÇÃO DEFINITIVA DE ROLE CAST E EXCLUSÃO
-- Objetivo: Forçar a substituição da função com erro de tipo
-- ============================================================

-- 1. Removemos a função antiga para evitar conflitos de assinatura
DROP FUNCTION IF EXISTS public.admin_set_user_role(UUID, TEXT);

-- 2. Criamos a função novamente com o CAST para app_role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se o chamador é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem alterar roles';
  END IF;

  -- Valida o papel informado
  IF new_role NOT IN ('admin', 'manager', 'user') THEN
    RAISE EXCEPTION 'Role inválido: use admin, manager ou user';
  END IF;

  -- Upsert com cast explícito ::public.app_role
  -- O erro "expression is of type text" ocorre aqui se o cast for omitido
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role::public.app_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = new_role::public.app_role;
END;
$$;

-- 3. Função de exclusão (nova)
DROP FUNCTION IF EXISTS public.admin_delete_user(UUID);
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem excluir usuários';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode excluir sua própria conta';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 4. Permissões
REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
