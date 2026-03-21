import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Collaborator, DevelopmentPlan, DevelopmentPlanCategory, DevelopmentPlanPriority } from '@/types/feedback';
import { FeedbackAnalysis } from '@/types/feedback';
import { useDevelopmentPlans } from '@/hooks/useDevelopmentPlans';
import { useCollaboratorAnalyses } from '@/hooks/useFeedback';
import {
  Loader2,
  Plus,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
  Users,
  MessageCircle,
  Settings,
  MoreHorizontal,
  Trash2,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Brain,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DevelopmentPlanTabProps {
  collaborator: Collaborator;
}

const categoryConfig: Record<DevelopmentPlanCategory, { label: string; icon: React.ElementType; color: string }> = {
  technical_training: { label: 'Treinamento Técnico', icon: GraduationCap, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  shadowing: { label: 'Shadowing', icon: Users, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  communication: { label: 'Comunicação', icon: MessageCircle, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  process: { label: 'Processos', icon: Settings, color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' },
  other: { label: 'Outros', icon: MoreHorizontal, color: 'text-muted-foreground bg-muted/50 border-border/50' },
};

const priorityConfig: Record<DevelopmentPlanPriority, { label: string; icon: React.ElementType; color: string }> = {
  high: { label: 'Alta', icon: ArrowUpCircle, color: 'text-red-400' },
  medium: { label: 'Média', icon: ArrowRightCircle, color: 'text-yellow-400' },
  low: { label: 'Baixa', icon: ArrowDownCircle, color: 'text-green-400' },
};

function generateAIRecommendations(analyses: FeedbackAnalysis[]): Array<{ title: string; description: string; category: DevelopmentPlanCategory; priority: DevelopmentPlanPriority }> {
  if (analyses.length === 0) return [];
  const recommendations: Array<{ title: string; description: string; category: DevelopmentPlanCategory; priority: DevelopmentPlanPriority }> = [];

  // Check for robotic communication
  const roboticCount = analyses.filter(a => a.robotic_communication).length;
  if (roboticCount >= 2) {
    recommendations.push({
      title: 'Reforço em comunicação humanizada',
      description: `Detectada comunicação robótica em ${roboticCount} análises. Recomenda-se treinamento focado em empatia e personalização no atendimento.`,
      category: 'communication',
      priority: 'high',
    });
  }

  // Check for frequent transfers
  const transferCount = analyses.filter(a => a.transfer_detected).length;
  if (transferCount >= 2) {
    recommendations.push({
      title: 'Shadowing com agente N2 experiente',
      description: `Detectados ${transferCount} escalonamentos. Acompanhamento com agente sênior pode ajudar a resolver casos mais complexos de forma autônoma.`,
      category: 'shadowing',
      priority: 'medium',
    });
  }

  // Check for missing instance codes
  const noCodeCount = analyses.filter(a => a.instance_code_requested === false).length;
  if (noCodeCount >= 2) {
    recommendations.push({
      title: 'Treinamento em processos obrigatórios',
      description: `Código de instância não solicitado em ${noCodeCount} atendimentos. Reforçar o checklist de procedimentos obrigatórios.`,
      category: 'process',
      priority: 'high',
    });
  }

  // Check common improvements
  const allImprovements: Record<string, number> = {};
  analyses.forEach(a => {
    a.improvements?.forEach(i => {
      allImprovements[i] = (allImprovements[i] || 0) + 1;
    });
  });
  const topImprovement = Object.entries(allImprovements).sort((a, b) => b[1] - a[1])[0];
  if (topImprovement && topImprovement[1] >= 2) {
    recommendations.push({
      title: `Foco em: ${topImprovement[0]}`,
      description: `Ponto de melhoria identificado ${topImprovement[1]} vezes nas análises de IA. Ação direcionada recomendada.`,
      category: 'technical_training',
      priority: 'medium',
    });
  }

  // Check negative engagement trend
  const negativeCount = analyses.filter(a => a.engagement_level === 'negative').length;
  if (negativeCount >= 2) {
    recommendations.push({
      title: 'Acompanhamento de engajamento',
      description: `${negativeCount} análises com engajamento negativo. Recomenda-se acompanhamento próximo e sessões de feedback regulares.`,
      category: 'communication',
      priority: 'high',
    });
  }

  return recommendations.slice(0, 4);
}

export function DevelopmentPlanTab({ collaborator }: DevelopmentPlanTabProps) {
  const { plans, loading, stats, addPlan, updatePlan, deletePlan } = useDevelopmentPlans(collaborator.id);
  const { analyses, loading: loadingAnalyses } = useCollaboratorAnalyses(collaborator.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<DevelopmentPlanCategory>('other');
  const [newPriority, setNewPriority] = useState<DevelopmentPlanPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const aiRecommendations = useMemo(() => generateAIRecommendations(analyses), [analyses]);

  // Filter out already-added AI recommendations
  const pendingRecommendations = useMemo(() => {
    return aiRecommendations.filter(rec =>
      !plans.some(p => p.title === rec.title && p.source === 'ai_recommendation')
    );
  }, [aiRecommendations, plans]);

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addPlan({
      collaborator_id: collaborator.id,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      category: newCategory,
      priority: newPriority,
      source: 'manual',
      due_date: newDueDate || null,
    });
    setNewTitle('');
    setNewDescription('');
    setNewCategory('other');
    setNewPriority('medium');
    setNewDueDate('');
    setDialogOpen(false);
  };

  const handleAddRecommendation = async (rec: typeof aiRecommendations[0]) => {
    await addPlan({
      collaborator_id: collaborator.id,
      title: rec.title,
      description: rec.description,
      category: rec.category,
      priority: rec.priority,
      source: 'ai_recommendation',
    });
  };

  const handleToggleStatus = async (plan: DevelopmentPlan) => {
    const newStatus = plan.status === 'completed' ? 'in_progress' : 'completed';
    await updatePlan(plan.id, { status: newStatus });
  };

  if (loading || loadingAnalyses) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-1" />
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <p className="text-xs text-muted-foreground">Total de Metas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <span className="text-2xl font-bold text-foreground">{stats.inProgress}</span>
            <p className="text-xs text-muted-foreground">Em Andamento</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <span className="text-2xl font-bold text-foreground">{stats.completed}</span>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <span className="text-2xl font-bold text-foreground">{stats.aiRecommended}</span>
            <p className="text-xs text-muted-foreground">Sugeridas pela IA</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progresso do PDI</span>
              <span className="text-sm text-muted-foreground">{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-2 bg-muted [&>div]:bg-green-500" />
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {pendingRecommendations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card/50 border-primary/20 border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-primary" />
                Ações Recomendadas pela IA
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Baseadas nas análises de atendimento do colaborador
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRecommendations.map((rec, i) => {
                const catCfg = categoryConfig[rec.category];
                const priCfg = priorityConfig[rec.priority];
                const CatIcon = catCfg.icon;
                const PriIcon = priCfg.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className={`p-2 rounded-lg ${catCfg.color}`}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{rec.title}</span>
                        <PriIcon className={`w-4 h-4 ${priCfg.color}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => handleAddRecommendation(rec)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Metas & Ações</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Ação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Ação ao PDI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground">Título *</label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Treinamento em ChatPro avançado" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Detalhes da ação..." className="mt-1" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Categoria</label>
                  <Select value={newCategory} onValueChange={v => setNewCategory(v as DevelopmentPlanCategory)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Prioridade</label>
                  <Select value={newPriority} onValueChange={v => setNewPriority(v as DevelopmentPlanPriority)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Prazo</label>
                <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={handleAdd} disabled={!newTitle.trim()} className="w-full">
                Adicionar ao PDI
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <Card className="bg-card/50 border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Nenhuma meta definida</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Adicione ações ao plano de desenvolvimento ou aceite as recomendações da IA.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((plan, i) => {
            const catCfg = categoryConfig[plan.category as DevelopmentPlanCategory] || categoryConfig.other;
            const priCfg = priorityConfig[plan.priority as DevelopmentPlanPriority] || priorityConfig.medium;
            const CatIcon = catCfg.icon;
            const PriIcon = priCfg.icon;
            const isCompleted = plan.status === 'completed';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`bg-card/50 border-border/50 ${isCompleted ? 'opacity-70' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-muted-foreground/40 hover:border-primary'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {plan.title}
                          </span>
                          <Badge variant="outline" className={`text-xs ${catCfg.color}`}>
                            <CatIcon className="w-3 h-3 mr-1" />
                            {catCfg.label}
                          </Badge>
                          <PriIcon className={`w-4 h-4 ${priCfg.color}`} />
                          {plan.source === 'ai_recommendation' && (
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground mb-1">{plan.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Criado em {format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                          {plan.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Prazo: {format(new Date(plan.due_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                          {plan.completed_at && (
                            <span className="text-green-500">
                              Concluído em {format(new Date(plan.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
