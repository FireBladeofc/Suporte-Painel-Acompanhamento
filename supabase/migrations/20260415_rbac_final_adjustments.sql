-- ============================================================
-- Migration: AJUSTES FINAIS DE RBAC E INTEGRIDADE
-- Objetivo: Garantir unicidade de role por usuário e 
--           funcionalidade de deleção/update via RPC.
-- ============================================================

-- 1. Ajuste da restrição de unicidade na tabela user_roles
-- Removemos a restrição composta antiga e forçamos 1 perfil por usuário
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 2. Atualização da função admin_set_user_role com cast explícito
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
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem alterar roles';
  END IF;

  IF new_role NOT IN ('admin', 'manager', 'user') THEN
    RAISE EXCEPTION 'Role inválido: use admin, manager ou user';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role::public.app_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = EXCLUDED.role;
END;
$$;

-- 3. Função de exclusão administrativa (garantindo assinatura UUID)
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

-- 4. Permissões finais e Cache Reload
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
