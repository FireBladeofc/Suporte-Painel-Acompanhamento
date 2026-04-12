import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole, ROLE_LABELS } from '@/hooks/useAuth';

export interface UserWithRole {
  user_id: string;
  email: string;
  created_at: string;
  role: AppRole;
  /** Label legível do role (ex: 'Agente', 'Admin') */
  roleLabel: string;
}

/**
 * Hook de gerenciamento de usuários — utilizado apenas pelo admin.
 * Usa funções Postgres com SECURITY DEFINER para acessar auth.users com segurança.
 */
export function useUserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // user_id sendo atualizado
  const { toast } = useToast();

  /** Lista todos os usuários com seus roles via RPC segura */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_users_with_roles');

      if (error) {
        toast({
          title: 'Erro ao carregar usuários',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Mapeia os dados adicionando o label legível do role
      const mapped: UserWithRole[] = (data as UserWithRole[]).map((u) => ({
        ...u,
        role: (u.role as AppRole) ?? 'user',
        roleLabel: ROLE_LABELS[(u.role as AppRole) ?? 'user'],
      }));

      setUsers(mapped);
    } catch (err) {
      console.error('[useUserManagement] Erro ao buscar usuários:', err);
      toast({
        title: 'Erro inesperado',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /** Altera o role de um usuário via RPC admin segura */
  const updateUserRole = useCallback(
    async (targetUserId: string, newRole: AppRole) => {
      setIsUpdating(targetUserId);
      try {
        const { error } = await supabase.rpc('admin_set_user_role', {
          target_user_id: targetUserId,
          new_role: newRole,
        });

        if (error) {
          toast({
            title: 'Erro ao atualizar role',
            description: error.message,
            variant: 'destructive',
          });
          return false;
        }

        // Atualiza localmente sem precisar de novo fetch
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === targetUserId
              ? { ...u, role: newRole, roleLabel: ROLE_LABELS[newRole] }
              : u
          )
        );

        toast({
          title: 'Perfil atualizado!',
          description: `Usuário agora é ${ROLE_LABELS[newRole]}.`,
        });
        return true;
      } catch (err) {
        console.error('[useUserManagement] Erro ao atualizar role:', err);
        return false;
      } finally {
        setIsUpdating(null);
      }
    },
    [toast]
  );

  return {
    users,
    isLoading,
    isUpdating,
    fetchUsers,
    updateUserRole,
  };
}
