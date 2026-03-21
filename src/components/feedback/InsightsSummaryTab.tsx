import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collaborator, FeedbackAnalysis, ManualFeedback } from '@/types/feedback';
import { AgentMetrics, SupportTicket } from '@/types/support';
import { useCollaboratorAnalyses } from '@/hooks/useFeedback';
import { useManualFeedbacks } from '@/hooks/useManualFeedbacks';
import { 
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Sparkles,
  MessageSquare,
   Brain,
   FileText,
   Clock,
   Headphones,
   RefreshCw,
   Star,
   ListChecks
} from 'lucide-react';

interface InsightsSummaryTabProps {
  collaborator: Collaborator;
  agentMetrics?: AgentMetrics;
  tickets?: SupportTicket[];
}

export function InsightsSummaryTab({ collaborator, agentMetrics: dashboardMetrics, tickets = [] }: InsightsSummaryTabProps) {
  const { analyses, loading: loadingAnalyses } = useCollaboratorAnalyses(collaborator.id);
  const { feedbacks, loading: loadingFeedbacks, stats } = useManualFeedbacks(collaborator.id);

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
    if (analyses.length === 0 && feedbacks.length === 0) return null;

    // Engagement analysis from AI
    const engagementCounts = {
      positive: analyses.filter(a => a.engagement_level === 'positive').length,
      neutral: analyses.filter(a => a.engagement_level === 'neutral').length,
      negative: analyses.filter(a => a.engagement_level === 'negative').length,
    };
    const totalEngagement = engagementCounts.positive + engagementCounts.neutral + engagementCounts.negative;
    const positiveRate = totalEngagement > 0 ? (engagementCounts.positive / totalEngagement) * 100 : 0;
    const negativeRate = totalEngagement > 0 ? (engagementCounts.negative / totalEngagement) * 100 : 0;

    // Aggregate strengths and improvements from AI analyses
    const allStrengths: Record<string, number> = {};
    const allImprovements: Record<string, number> = {};
    const allPatterns: Record<string, number> = {};

    analyses.forEach(a => {
      a.strengths?.forEach(s => {
        allStrengths[s] = (allStrengths[s] || 0) + 1;
      });
      a.improvements?.forEach(i => {
        allImprovements[i] = (allImprovements[i] || 0) + 1;
      });
      a.patterns?.forEach(p => {
        allPatterns[p] = (allPatterns[p] || 0) + 1;
      });
    });

    const topStrengths = Object.entries(allStrengths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const topImprovements = Object.entries(allImprovements)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topPatterns = Object.entries(allPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Manual feedback analysis
    const categoryBreakdown: Record<string, number> = {};
    feedbacks.forEach(f => {
      const cat = f.category || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    const feedbackCompletionRate = stats.total > 0 
      ? (stats.completed / stats.total) * 100 
      : 0;

    // Recent observations from manual feedbacks
    const recentObservations = feedbacks
      .filter(f => f.observations)
      .slice(0, 5)
      .map(f => f.observations!);

    // Complaints and questions totals
    const totalComplaints = analyses.reduce((sum, a) => sum + (a.complaints_count || 0), 0);
    const totalQuestions = analyses.reduce((sum, a) => sum + (a.questions_count || 0), 0);

     // Collect all AI feedbacks for collaborator
     const allFeedbacks = analyses
       .filter(a => a.feedback)
       .map(a => ({
         date: a.analysis_date,
         weekStart: a.week_start,
         feedback: a.feedback!,
         engagementLevel: a.engagement_level,
       }));

    // Trend analysis (compare first half vs second half of analyses)
    let engagementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (analyses.length >= 4) {
      const half = Math.floor(analyses.length / 2);
      const firstHalf = analyses.slice(half); // older (arrays are sorted desc)
      const secondHalf = analyses.slice(0, half); // newer
      
      const firstPositiveRate = firstHalf.filter(a => a.engagement_level === 'positive').length / firstHalf.length;
      const secondPositiveRate = secondHalf.filter(a => a.engagement_level === 'positive').length / secondHalf.length;
      
      if (secondPositiveRate > firstPositiveRate + 0.1) engagementTrend = 'up';
      else if (secondPositiveRate < firstPositiveRate - 0.1) engagementTrend = 'down';
    }

    return {
      engagementCounts,
      positiveRate,
      negativeRate,
      topStrengths,
      topImprovements,
      topPatterns,
      categoryBreakdown,
      feedbackCompletionRate,
      recentObservations,
      totalComplaints,
      totalQuestions,
      engagementTrend,
      totalAnalyses: analyses.length,
      totalFeedbacks: feedbacks.length,
       allFeedbacks,
    };
  }, [analyses, feedbacks, stats]);

  const loading = loadingAnalyses || loadingFeedbacks;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!insights || (insights.totalAnalyses === 0 && insights.totalFeedbacks === 0)) {
    return (
      <Card className="bg-card/50 border-border/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">
            Sem dados para análise
          </h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            Registre feedbacks manuais ou faça análises de IA para gerar insights consolidados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = insights.engagementTrend === 'up' ? TrendingUp : 
                    insights.engagementTrend === 'down' ? TrendingDown : Minus;
  const trendColor = insights.engagementTrend === 'up' ? 'text-green-500' : 
                     insights.engagementTrend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  const categoryLabels: Record<string, string> = {
    performance: 'Desempenho',
    behavior: 'Comportamento',
    recognition: 'Reconhecimento',
    other: 'Outros'
  };

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{insights.totalAnalyses}</span>
            </div>
            <p className="text-xs text-muted-foreground">Análises de IA</p>
          </CardContent>
        </Card>

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
              <TrendIcon className={`w-5 h-5 ${trendColor}`} />
              <span className="text-2xl font-bold text-foreground">
                {insights.positiveRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Engajamento Positivo</p>
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

      {/* Engagement Breakdown */}
      {insights.totalAnalyses > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                Distribuição de Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Positivo 😀</span>
                    <span className="font-medium text-green-500">{insights.engagementCounts.positive}</span>
                  </div>
                  <Progress value={insights.positiveRate} className="h-2 bg-muted [&>div]:bg-green-500" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Neutro 😐</span>
                    <span className="font-medium text-yellow-500">{insights.engagementCounts.neutral}</span>
                  </div>
                  <Progress 
                    value={insights.totalAnalyses > 0 ? (insights.engagementCounts.neutral / insights.totalAnalyses) * 100 : 0} 
                    className="h-2 bg-muted [&>div]:bg-yellow-500" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Negativo 😠</span>
                    <span className="font-medium text-red-500">{insights.engagementCounts.negative}</span>
                  </div>
                  <Progress value={insights.negativeRate} className="h-2 bg-muted [&>div]:bg-red-500" />
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <span className="text-sm text-muted-foreground">
                    {insights.engagementTrend === 'up' && 'Tendência de melhoria no engajamento'}
                    {insights.engagementTrend === 'down' && 'Tendência de queda no engajamento'}
                    {insights.engagementTrend === 'stable' && 'Engajamento estável'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        {insights.topStrengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/50 border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  Pontos Fortes Recorrentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.topStrengths.map(([strength, count], i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-foreground flex-1">{strength}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}x
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Improvements */}
        {insights.topImprovements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-card/50 border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-yellow-500">
                  <Target className="w-5 h-5" />
                  Pontos de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.topImprovements.map(([improvement, count], i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span className="text-foreground flex-1">{improvement}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}x
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Patterns */}
      {insights.topPatterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-primary" />
                Padrões Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {insights.topPatterns.map(([pattern, count], i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {pattern} ({count}x)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* Quick Stats */}
      {(insights.totalComplaints > 0 || insights.totalQuestions > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
                Métricas dos Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 text-center">
                  <p className="text-2xl font-bold text-red-500">{insights.totalComplaints}</p>
                  <p className="text-xs text-muted-foreground">Reclamações Identificadas</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-2xl font-bold text-blue-500">{insights.totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">Dúvidas Registradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

       {/* Consolidated AI Feedbacks */}
       {insights.allFeedbacks.length > 0 && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
         >
           <Card className="bg-card/50 border-border/50 border-2 border-primary/20">
             <CardHeader className="pb-3">
               <CardTitle className="flex items-center gap-2 text-lg">
                 <FileText className="w-5 h-5 text-primary" />
                 Feedbacks Consolidados para o Colaborador
               </CardTitle>
               <p className="text-sm text-muted-foreground">
                 Resumo dos feedbacks gerados pela IA para encaminhar ao colaborador
               </p>
             </CardHeader>
             <CardContent className="space-y-4">
               {insights.allFeedbacks.map((item, i) => {
                 const engagementEmoji = item.engagementLevel === 'positive' ? '😀' : 
                                        item.engagementLevel === 'neutral' ? '😐' : '😠';
                 const engagementColor = item.engagementLevel === 'positive' ? 'border-green-500/30 bg-green-500/5' : 
                                        item.engagementLevel === 'neutral' ? 'border-yellow-500/30 bg-yellow-500/5' : 
                                        'border-red-500/30 bg-red-500/5';
                 
                 return (
                   <div 
                     key={i}
                     className={`p-4 rounded-lg border ${engagementColor}`}
                   >
                     <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                       <span className="text-base">{engagementEmoji}</span>
                       <span>Semana de {new Date(item.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
                       <span>•</span>
                       <span>Análise em {new Date(item.date).toLocaleDateString('pt-BR')}</span>
                     </div>
                     <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                       {item.feedback}
                     </div>
                   </div>
                 );
               })}
             </CardContent>
           </Card>
         </motion.div>
       )}
    </div>
  );
}
