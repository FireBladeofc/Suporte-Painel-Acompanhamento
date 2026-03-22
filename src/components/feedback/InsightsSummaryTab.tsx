import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collaborator } from '@/types/feedback';
import { AgentMetrics, SupportTicket } from '@/types/support';
import { useManualFeedbacks } from '@/hooks/useManualFeedbacks';
import { useDevelopmentPlans } from '@/hooks/useDevelopmentPlans';
import { 
  Loader2,
  TrendingDown,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Sparkles,
  MessageSquare,
  Clock,
  Headphones,
  RefreshCw,
  Star,
  ListChecks,
  Shield
} from 'lucide-react';

interface InsightsSummaryTabProps {
  collaborator: Collaborator;
  agentMetrics?: AgentMetrics;
  tickets?: SupportTicket[];
}

export function InsightsSummaryTab({ collaborator, agentMetrics: dashboardMetrics, tickets = [] }: InsightsSummaryTabProps) {
  const { feedbacks, loading: loadingFeedbacks, stats: feedbackStats } = useManualFeedbacks(collaborator.id);
  const { plans, stats: pdiStats, loading: loadingPDI } = useDevelopmentPlans(collaborator.id);

  // Compute top 4 finalization reasons for this agent
  const topFinalizacoes = useMemo(() => {
    if (!dashboardMetrics || tickets.length === 0) return [];
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, '').toLowerCase().trim();
    const normalizedAgent = normalize(dashboardMetrics.agente);
    const agentTickets = tickets.filter(t => {
      const n = normalize(t.agente);
      return n === normalizedAgent;
    });
    const counts: Record<string, number> = {};
    agentTickets.forEach(t => {
      if (t.finalizacao) {
        counts[t.finalizacao] = (counts[t.finalizacao] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [dashboardMetrics, tickets]);

  const insights = useMemo(() => {
    const categoryBreakdown: Record<string, number> = {};
    feedbacks.forEach(f => {
      const cat = f.category || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    const feedbackCompletionRate = feedbackStats.total > 0 
      ? (feedbackStats.completed / feedbackStats.total) * 100 
      : 0;

    const recentObservations = feedbacks
      .filter(f => f.observations)
      .slice(0, 5)
      .map(f => f.observations!);

    return {
      categoryBreakdown,
      feedbackCompletionRate,
      recentObservations,
      totalFeedbacks: feedbacks.length,
    };
  }, [feedbacks, feedbackStats]);

  const operationalInsights = useMemo(() => {
    if (!dashboardMetrics) return [];
    const items: { title: string; desc: string; type: 'info' | 'warning' | 'success' | 'alert' }[] = [];

    // NPS Logic
    if (dashboardMetrics.npsMedio !== null) {
      if (dashboardMetrics.npsMedio >= 4.8) {
        items.push({
          title: 'Excelência em Satisfação',
          desc: 'NPS acima de 4.8 indica altíssima qualidade de resolução e simpatia.',
          type: 'success'
        });
      } else if (dashboardMetrics.npsMedio < 4.0) {
        items.push({
          title: 'Atenção ao NPS',
          desc: 'Pontuação abaixo de 4.0 sugere atritos no atendimento ou falta de clareza.',
          type: 'alert'
        });
      }
    }

    // TMA Logic
    if (dashboardMetrics.tma > 20) {
      items.push({
        title: 'TMA Elevado',
        desc: 'Atendimentos longos sugerem necessidade de treinamento em ferramentas ou processos.',
        type: 'warning'
      });
    } else if (dashboardMetrics.tma > 0 && dashboardMetrics.tma < 10) {
      items.push({
        title: 'Alta Agilidade',
        desc: 'TMA abaixo de 10 min. Ótima performance em volume de atendimentos.',
        type: 'success'
      });
    }

    // Rechamadas Logic
    if (dashboardMetrics.taxaRechamadas > 20) {
      items.push({
        title: 'Baixa Resolutividade',
        desc: 'Taxa de rechamadas acima de 20%. Clientes estão voltando com a mesma dúvida.',
        type: 'alert'
      });
    }

    // Taxa de Avaliação Logic
    if (dashboardMetrics.taxaAvaliacao < 15 && dashboardMetrics.totalAtendimentos > 50) {
      items.push({
        title: 'Engajamento em Avaliações',
        desc: 'Baixa captação de feedback. Sugerir foco na solicitação de avaliação no encerramento.',
        type: 'info'
      });
    }

    return items;
  }, [dashboardMetrics]);

  const loading = loadingFeedbacks || loadingPDI;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasSomeData = insights.totalFeedbacks > 0 || pdiStats.total > 0 || (dashboardMetrics && dashboardMetrics.totalAtendimentos > 0);

  const categoryLabels: Record<string, string> = {
    performance: 'Desempenho',
    behavior: 'Comportamento',
    recognition: 'Reconhecimento',
    other: 'Outros'
  };

  if (!hasSomeData) {
    return (
      <Card className="bg-card/50 border-border/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Sparkles className="w-8 h-8 animate-pulse text-muted-foreground" />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">
            Aguardando dados...
          </h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            Adicione ações ao PDI ou aguarde a integração de dados para visualizar o painel.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operational Insights Section */}
      {operationalInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-card/50 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Diagnóstico de Performance Operacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {operationalInsights.map((insight, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg border flex gap-3 items-start ${
                      insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      insight.type === 'alert' ? 'bg-red-500/5 border-red-500/20' :
                      insight.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                      'bg-blue-500/5 border-blue-500/20'
                    }`}
                  >
                    <div className="mt-0.5">
                      {insight.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                       insight.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                       insight.type === 'warning' ? <TrendingDown className="w-4 h-4 text-yellow-500" /> :
                       <Lightbulb className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${
                        insight.type === 'success' ? 'text-emerald-500' :
                        insight.type === 'alert' ? 'text-red-500' :
                        insight.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-500'
                      }`}>{insight.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{insight.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* PDI Progress Summary */}
      {pdiStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/50 border-border/50 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target className="w-24 h-24" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-primary" />
                Plano de Desenvolvimento (PDI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-2xl font-bold">{pdiStats.completed}/{pdiStats.total}</span>
                    <span className="text-xs text-muted-foreground mb-1">Concluído</span>
                  </div>
                  <Progress value={(pdiStats.completed / pdiStats.total) * 100} className="h-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-center">
                      <p className="text-lg font-bold">{pdiStats.completed}</p>
                      <p className="text-[10px] uppercase">Fim</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary text-center">
                      <p className="text-lg font-bold">{pdiStats.inProgress}</p>
                      <p className="text-[10px] uppercase">Ação</p>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Últimas Ações do Plano</p>
                  <div className="space-y-2">
                    {plans.slice(0, 3).map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className={`w-4 h-4 ${plan.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                          <span className={`text-sm ${plan.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                            {plan.title}
                          </span>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${
                          plan.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                          plan.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {plan.priority === 'high' ? 'Alta' : plan.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    ))}
                    {plans.length > 3 && (
                      <p className="text-[10px] text-center text-muted-foreground mt-1">
                        + {plans.length - 3} outras ações no plano completo
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dashboard Metrics - linked from panel */}
      {dashboardMetrics && dashboardMetrics.totalAtendimentos > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/50 border-border/50 border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Headphones className="w-5 h-5 text-primary" />
                Dados do Painel Vinculados
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Métricas importadas da planilha de atendimentos
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{dashboardMetrics.tma}min</p>
                  <p className="text-xs text-muted-foreground">TMA</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Headphones className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{dashboardMetrics.leadsUnicos}</p>
                  <p className="text-xs text-muted-foreground">Contatos Únicos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <RefreshCw className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{dashboardMetrics.taxaRechamadas}%</p>
                  <p className="text-xs text-muted-foreground">Rechamadas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Star className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">
                    {dashboardMetrics.npsMedio !== null ? dashboardMetrics.npsMedio.toFixed(1) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">NPS Médio</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{dashboardMetrics.totalAtendimentos}</p>
                  <p className="text-xs text-muted-foreground">Total Atendimentos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{dashboardMetrics.avaliacoesRecebidas}</p>
                  <p className="text-xs text-muted-foreground">Avaliações</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{dashboardMetrics.taxaAvaliacao}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Avaliação</p>
                </div>
              </div>
              {/* Top 4 Motivos de Finalização */}
              {topFinalizacoes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Top 4 Motivos de Finalização</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {topFinalizacoes.map(([motivo, count], i) => {
                      const total = dashboardMetrics!.totalAtendimentos;
                      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={i} className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm font-medium text-foreground truncate" title={motivo}>{motivo}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{count} atendimentos</span>
                            <Badge variant="secondary" className="text-xs">{pct}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{insights.totalFeedbacks}</span>
            </div>
            <p className="text-xs text-muted-foreground">Feedbacks Manuais</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">
                {insights.feedbackCompletionRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Feedbacks Realizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Feedback Categories */}
      {Object.keys(insights.categoryBreakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
                Categorias de Feedback Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(insights.categoryBreakdown).map(([cat, count]) => (
                  <div 
                    key={cat} 
                    className="p-3 rounded-lg bg-muted/50 text-center"
                  >
                    <p className="text-xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabels[cat] || cat}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Observations */}
      {insights.recentObservations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Observações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.recentObservations.map((obs, i) => (
                  <li 
                    key={i} 
                    className="p-3 rounded-lg bg-muted/30 text-sm text-foreground border-l-2 border-primary"
                  >
                    "{obs}"
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
