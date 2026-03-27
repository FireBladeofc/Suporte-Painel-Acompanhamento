import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collaborator } from '@/types/feedback';
import { User, Trash2, ChevronRight, Calendar, ClipboardCheck, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollaboratorStats, CollaboratorFeedbackStats } from '@/hooks/useCollaboratorStats';
import { useMemo } from 'react';

interface CollaboratorListProps {
  collaborators: Collaborator[];
  loading: boolean;
  onSelect: (collaborator: Collaborator) => void;
  onDelete: (id: string) => void;
}

export function CollaboratorList({ collaborators, loading, onSelect, onDelete }: CollaboratorListProps) {
  // Get IDs for stats lookup
  const collaboratorIds = useMemo(() => collaborators.map(c => c.id), [collaborators]);
  const { stats, loading: statsLoading } = useCollaboratorStats(collaboratorIds);

  const getStats = (id: string): CollaboratorFeedbackStats | undefined => stats.get(id);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum colaborador cadastrado
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Adicione colaboradores para começar a analisar os feedbacks de atendimento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {collaborators.map((collaborator, index) => {
        const collabStats = getStats(collaborator.id);
        
        return (
          <motion.div
            key={collaborator.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 group cursor-pointer card-glow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="flex items-center gap-3 flex-1"
                    onClick={() => onSelect(collaborator)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {collaborator.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'border-opacity-30',
                          (() => {
                            switch (collaborator.role) {
                              case 'N1': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                              case 'N2': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                              case 'implantador': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                              case 'financeiro': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                              case 'cs': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
                              case 'tecnico_treinamento': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
                              default: return 'bg-muted/20 text-muted-foreground border-muted/30';
                            }
                          })()
                        )}
                      >
                        {(() => {
                          switch (collaborator.role) {
                            case 'implantador': return 'Implantador';
                            case 'financeiro': return 'Financeiro';
                            case 'cs': return 'Customer Success';
                            case 'tecnico_treinamento': return 'Treinamento';
                            default: return collaborator.role;
                          }
                        })()}
                      </Badge>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá remover {collaborator.name} e todas as análises associadas. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(collaborator.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div 
                  className="flex items-center gap-4 mb-3 text-xs"
                  onClick={() => onSelect(collaborator)}
                >
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{statsLoading ? '...' : collabStats?.manualFeedbacksCount || 0}</span>
                    <span className="text-muted-foreground/70">manuais</span>
                  </div>
                  {collabStats?.pendingFeedbacksCount ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-warning" />
                      <span className="text-warning">{collabStats.pendingFeedbacksCount} pendentes</span>
                    </div>
                  ) : null}
                </div>

                <div 
                  className="flex items-center justify-between text-sm text-muted-foreground"
                  onClick={() => onSelect(collaborator)}
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(collaborator.created_at), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
