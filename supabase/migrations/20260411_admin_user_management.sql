-- ============================================================
-- Migration: Gerenciamento de usuários pelo Admin (RBAC)
-- Objetivo: Função segura para listar usuários + suas roles
--           Protegida para ser chamada apenas por admins.
-- ============================================================

-- Função que retorna todos os usuários com seus roles
-- SECURITY DEFINER: roda com privilégios do owner (contorna RLS do auth.users)
-- Remove a função existente para evitar erro de assinatura (cannot change return type)
DROP FUNCTION IF EXISTS public.get_all_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  user_id   UUID,
  email     TEXT,
  created_at TIMESTAMPTZ,
  role      TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verifica se o chamador é um admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem listar usuários';
  END IF;

  RETURN QUERY
    SELECT
      u.id::UUID,
      u.email::TEXT,
      u.created_at::TIMESTAMPTZ,
      COALESCE(ur.role, 'user')::TEXT
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    ORDER BY u.created_at ASC;
END;
$$;

-- Revoke acesso público e concede apenas para autenticados
REVOKE ALL ON FUNCTION public.get_all_users_with_roles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_users_with_roles() TO authenticated;

-- ============================================================
-- Função para admin atualizar role de outro usuário
-- ============================================================
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

  -- Upsert na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = new_role;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
