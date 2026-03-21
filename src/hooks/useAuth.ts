import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'manager' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no role found, user is a basic 'user' role
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
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast({
          title: 'Erro ao entrar',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
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
          description: error.message,
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
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Manager has access to manager and user roles
    if (userRole === 'manager' && (role === 'manager' || role === 'user')) return true;
    
    // User only has user access
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
    signIn,
    signUp,
    signOut,
    hasRole,
    canManageCollaborators,
    isAuthenticated: !!session,
  };
}
