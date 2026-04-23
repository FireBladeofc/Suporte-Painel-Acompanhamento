import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'manager' | 'user';

/**
 * Mapeamento amigável de roles para exibição na UI
 * 'user' é tratado internamente como 'Agente' no painel
 */
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  manager: 'Gerente',
  user: 'Agente',
};

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

/**
 * Traduz mensagens de erro comuns do Supabase Auth para português
 */
const translateAuthError = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('email not confirmed')) {
    return 'E-mail não confirmado. Por favor, verifique sua caixa de entrada para ativar sua conta.';
  }
  if (lowerMessage.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
  }
  if (lowerMessage.includes('user already registered')) {
    return 'Este e-mail já está cadastrado no sistema.';
  }
  if (lowerMessage.includes('password should be at least 6 characters')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (lowerMessage.includes('rate limit exceeded')) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.';
  }
  if (lowerMessage.includes('signup_disabled')) {
    return 'O cadastro de novos usuários está temporariamente desativado.';
  }
  if (lowerMessage.includes('email address not authorized')) {
    return 'Este endereço de e-mail não está autorizado a acessar o sistema.';
  }
  
  // Mensagem genérica amigável se não houver mapeamento específico
  return message; 
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  // SEG-006: estado separado para carregamento de role — evita janela TOCTOU
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  // SEG-011: contador de tentativas falhas para rate limiting progressivo
  const failedAttempts = useRef(0);
  const { toast } = useToast();

  const fetchUserRole = useCallback(async (userId: string) => {
    setIsRoleLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se não houver role, usuário recebe role básico 'user'
        if (error.code === 'PGRST116') {
          setUserRole('user');
          return;
        }
        console.error('Error fetching user role:', error);
        setUserRole('user');
        return;
      }

      setUserRole(data.role as AppRole);
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole('user');
    } finally {
      // SEG-006: só libera isRoleLoading após role ser definido
      setIsRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setIsRoleLoading(false);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    // SEG-011: delay exponencial progressivo após falhas consecutivas
    const attempts = failedAttempts.current;
    if (attempts >= 5) {
      const delayMs = Math.min(Math.pow(2, attempts - 4) * 1000, 30000); // máx 30s
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        failedAttempts.current += 1;
        toast({
          title: 'Erro ao entrar',
          description: translateAuthError(error.message),
          variant: 'destructive',
        });
        return { error };
      }

      // Login bem-sucedido: resetar contador de falhas
      failedAttempts.current = 0;

      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });

      return { error: null };
    } catch (err) {
      failedAttempts.current += 1;
      const error = err as Error;
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: 'Erro ao cadastrar',
          description: translateAuthError(error.message),
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Cadastro realizado!',
        description: 'Verifique seu e-mail para confirmar a conta.',
      });

      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      failedAttempts.current = 0;
      toast({
        title: 'Até logo!',
        description: 'Você saiu da sua conta.',
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const hasRole = useCallback((role: AppRole) => {
    if (!userRole) return false;
    
    // Admin tem acesso a tudo
    if (userRole === 'admin') return true;
    
    // Manager tem acesso a manager e user
    if (userRole === 'manager' && (role === 'manager' || role === 'user')) return true;
    
    // User só tem acesso de user
    return userRole === role;
  }, [userRole]);

  const canManageCollaborators = useCallback(() => {
    return userRole === 'admin' || userRole === 'manager';
  }, [userRole]);

  return {
    user,
    session,
    userRole,
    loading,
    // SEG-006: isRoleLoading separado — não confundir "sem role" com "role não carregado"
    isRoleLoading,
    signIn,
    signUp,
    signOut,
    hasRole,
    canManageCollaborators,
    isAuthenticated: !!session,
    // Atalhos de role — só avaliados após isRoleLoading = false
    isAdmin: userRole === 'admin',
    // SEG-006: corrigido — userRole === null não significa isAgent enquanto carrega
    isAgent: userRole === 'user',
  };
}
