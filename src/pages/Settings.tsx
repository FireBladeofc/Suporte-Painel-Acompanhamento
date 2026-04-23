import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, AppRole, ROLE_LABELS } from '@/hooks/useAuth';
import { useUserManagement, UserWithRole } from '@/hooks/useUserManagement';
import {
  Settings,
  Users,
  Shield,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Crown,
  UserCog,
  Mail,
  Calendar,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Badge colorida por role */
function RoleBadge({ role }: { role: AppRole }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Crown className="w-3 h-3" />
        Admin
      </span>
    );
  }
  if (role === 'manager') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
        <ShieldCheck className="w-3 h-3" />
        Gerente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <Shield className="w-3 h-3" />
      Agente
    </span>
  );
}

/** Card individual de usuário */
function UserCard({
  userRow,
  currentUserId,
  isUpdating,
  isDeleting,
  onRoleChange,
  onDelete,
}: {
  userRow: UserWithRole;
  currentUserId: string;
  isUpdating: string | null;
  isDeleting: string | null;
  onRoleChange: (userId: string, role: AppRole) => void;
  onDelete: (userId: string) => void;
}) {
  const isSelf = userRow.user_id === currentUserId;
  const busy = isUpdating === userRow.user_id;
  const deleting = isDeleting === userRow.user_id;

  const formattedDate = new Date(userRow.created_at).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-border/70 transition-all duration-200"
    >
      {/* Info do usuário */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">
            {userRow.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {userRow.email}
            </p>
            {isSelf && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                Você
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
            <RoleBadge role={userRow.role} />
          </div>
        </div>
      </div>

      {/* Seletor de role */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {busy ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            Atualizando...
          </div>
        ) : (
          <Select
            value={userRow.role}
            onValueChange={(val) => onRoleChange(userRow.user_id, val as AppRole)}
            disabled={isSelf} // Admin não pode mudar seu próprio role
          >
            <SelectTrigger className="w-36 h-8 text-xs border-border/50 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <span className="flex items-center gap-2">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Admin
                </span>
              </SelectItem>
              <SelectItem value="manager">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  Gerente
                </span>
              </SelectItem>
              <SelectItem value="user">
                <span className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  Agente
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        {isSelf ? (
          <span className="text-xs text-muted-foreground">(seu perfil)</span>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(userRow.user_id)}
            disabled={deleting || busy}
            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Excluir Usuário"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-destructive" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/** Página principal de Configurações */
export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAdmin, userRole } = useAuth();
  const { 
    users, 
    isLoading, 
    isUpdating, 
    isDeleting, 
    fetchUsers, 
    updateUserRole, 
    deleteUser 
  } = useUserManagement();

  // SEG-012: estado do modal de confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<UserWithRole | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const CONFIRM_KEYWORD = 'CONFIRMAR';

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.user_id === userId);
    if (!userToDelete) return;
    // Abre o modal de confirmação em vez de window.confirm()
    setDeleteTarget(userToDelete);
    setDeleteConfirmInput('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteConfirmInput !== CONFIRM_KEYWORD) return;
    await deleteUser(deleteTarget.user_id);
    setDeleteTarget(null);
    setDeleteConfirmInput('');
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
    setDeleteConfirmInput('');
  };

  // Redireciona não-admins imediatamente
  useEffect(() => {
    if (userRole !== null && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, userRole, navigate]);

  // Carrega usuários ao montar
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const agentCount = users.filter((u) => u.role === 'user').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;

  return (
    <div className="min-h-screen bg-background noise-overlay">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30">
        <div className="absolute inset-0 bg-background/70 backdrop-blur-xl" />
        <div className="relative container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar ao Painel</span>
              </Button>

              <div className="w-px h-6 bg-border/50" />

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                    <Settings className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold font-display text-foreground">
                    Configurações
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Gerenciamento de usuários e permissões
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              className="gap-2 border-primary/30 hover:bg-primary/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8"
        >
          {[
            {
              label: 'Total de Usuários',
              value: users.length,
              icon: Users,
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              label: 'Admins',
              value: adminCount,
              icon: Crown,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
            },
            {
              label: 'Agentes',
              value: agentCount + managerCount,
              icon: Shield,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? '—' : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Users list */}
        <Card className="bg-card/30 border-border/40">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Gerenciar Usuários</CardTitle>
            </div>
            <CardDescription>
              Altere o perfil de acesso de cada usuário cadastrado no sistema.
              Usuários recém-cadastrados entram automaticamente como <strong>Agente</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Carregando usuários...
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Users className="w-10 h-10 opacity-30" />
                <p className="text-sm">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <UserCard
                    key={u.user_id}
                    userRow={u}
                    currentUserId={user?.id ?? ''}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                    onRoleChange={updateUserRole}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-primary">📋 Como funciona a hierarquia:</strong>{' '}
            Novos usuários entram automaticamente como <strong>Agente</strong> — com acesso às
            abas Visão Executiva, Análise Operacional e Performance. O{' '}
            <strong>Admin</strong> tem acesso completo ao painel, pode importar planilhas e
            gerenciar usuários nesta página. Alterações de role têm efeito no próximo login do
            usuário.
          </p>
        </motion.div>
        {/* SEG-012: Modal de confirmação seguro com campo de digitação */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) handleCancelDelete(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-destructive">Excluir Usuário</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-left space-y-3">
                <p>
                  Você está prestes a excluir permanentemente o usuário:
                </p>
                <div className="p-3 rounded-lg bg-muted border border-border font-mono text-sm text-foreground">
                  {deleteTarget?.email}
                </div>
                <p className="text-destructive/80 text-sm">
                  Esta ação <strong>NÃO pode ser desfeita</strong> e removerá todos os dados vinculados a este usuário.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Para confirmar, digite <strong className="text-foreground">{CONFIRM_KEYWORD}</strong> abaixo:
                  </p>
                  <Input
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder={CONFIRM_KEYWORD}
                    className="border-destructive/40 focus-visible:ring-destructive/40"
                    autoFocus
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleCancelDelete} disabled={isDeleting === deleteTarget?.user_id}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmInput !== CONFIRM_KEYWORD || isDeleting === deleteTarget?.user_id}
              >
                {isDeleting === deleteTarget?.user_id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Excluindo...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" />Excluir Permanentemente</>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
