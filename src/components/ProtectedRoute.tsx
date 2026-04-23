import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // SEG-006: consome isRoleLoading para evitar renderização com role indefinido
  const { isAuthenticated, loading, isRoleLoading } = useAuth();
  const location = useLocation();
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  // Check if Supabase is properly configured
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Considera carregando enquanto auth OU role estão sendo resolvidos
  const isLoading = loading || isRoleLoading;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 5000); // 5 segundos de timeout
    } else {
      setShowTimeoutMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Carregando painel...</h2>
        {showTimeoutMessage && (
          <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-muted-foreground mb-4">
              O carregamento está demorando mais do que o esperado.
            </p>
            {!isSupabaseConfigured && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive mb-1">Configuração Incompleta</p>
                  <p className="text-xs text-destructive/80">
                    As variáveis de ambiente do Supabase não foram detectadas. 
                    Verifique se <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong> foram configuradas no Vercel.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
