import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collaborator } from '@/types/feedback';
import { 
  Clock, 
  RefreshCw, 
  Headphones, 
  Star, 
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CollaboratorReportTabProps {
  collaborator: Collaborator;
  // These would come from actual data - for now we'll simulate
  agentMetrics?: {
    tma: number;
    tme: number;
    totalAtendimentos: number;
    taxaRechamadas: number;
    npsMedio: number | null;
    avaliacoesRecebidas: number;
    avaliacoesPendentes: number;
    taxaAvaliacao: number;
    leadsUnicos: number;
  };
  teamAverages?: {
    tma: number;
    tme: number;
    totalAtendimentos: number;
    taxaRechamadas: number;
    npsMedio: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

export function CollaboratorReportTab({ 
  collaborator, 
  agentMetrics,
  teamAverages 
}: CollaboratorReportTabProps) {
  const hasData = !!agentMetrics && agentMetrics.totalAtendimentos > 0;

  // Default metrics if none provided
  const metrics = agentMetrics || {
    tma: 0,
    tme: 0,
    totalAtendimentos: 0,
    taxaRechamadas: 0,
    npsMedio: null,
    avaliacoesRecebidas: 0,
    avaliacoesPendentes: 0,
    taxaAvaliacao: 0,
    leadsUnicos: 0
  };

  const averages = teamAverages || {
    tma: 25,
    tme: 5,
    totalAtendimentos: 150,
    taxaRechamadas: 15,
    npsMedio: 4.2
  };

  // Calculate performance comparisons
  const comparisons = useMemo(() => {
    const tmaComparison = averages.tma > 0 
      ? ((metrics.tma - averages.tma) / averages.tma * 100).toFixed(0) 
      : '0';
    const volumeComparison = averages.totalAtendimentos > 0 
      ? ((metrics.totalAtendimentos - averages.totalAtendimentos) / averages.totalAtendimentos * 100).toFixed(0)
      : '0';
    const rechamadaComparison = ((metrics.taxaRechamadas - averages.taxaRechamadas)).toFixed(0);
    
    return {
      tma: {
        value: parseInt(tmaComparison),
        isGood: parseInt(tmaComparison) <= 0
      },
      volume: {
        value: parseInt(volumeComparison),
        isGood: parseInt(volumeComparison) >= 0
      },
      rechamada: {
        value: parseInt(rechamadaComparison),
        isGood: parseInt(rechamadaComparison) <= 0
      }
    };
  }, [metrics, averages]);

  // Generate improvement suggestions based on metrics
  const improvementSuggestions = useMemo(() => {
    const suggestions: { priority: 'alta' | 'media' | 'baixa'; text: string; metric: string }[] = [];

    if (metrics.tma > averages.tma * 1.2) {
      suggestions.push({
        priority: 'alta',
        text: 'Reduzir tempo médio de atendimento focando em respostas mais objetivas',
        metric: `TMA atual: ${metrics.tma}min (Média: ${averages.tma}min)`
      });
    }

    if (metrics.taxaRechamadas > averages.taxaRechamadas + 5) {
      suggestions.push({
        priority: 'alta',
        text: 'Melhorar resolução no primeiro contato para reduzir rechamadas',
        metric: `Taxa: ${metrics.taxaRechamadas}% (Média: ${averages.taxaRechamadas}%)`
      });
    }

    if (metrics.taxaAvaliacao < 30) {
      suggestions.push({
        priority: 'media',
        text: 'Solicitar avaliação aos clientes após cada atendimento',
        metric: `Taxa atual: ${metrics.taxaAvaliacao}%`
      });
    }

    if (metrics.npsMedio !== null && metrics.npsMedio < averages.npsMedio) {
      suggestions.push({
        priority: 'media',
        text: 'Focar em empatia e resolução efetiva para melhorar NPS',
        metric: `NPS: ${metrics.npsMedio.toFixed(1)} (Média: ${averages.npsMedio.toFixed(1)})`
      });
    }

    if (metrics.totalAtendimentos < averages.totalAtendimentos * 0.8) {
      suggestions.push({
        priority: 'baixa',
        text: 'Aumentar volume de atendimentos para atingir a média da equipe',
        metric: `Volume: ${metrics.totalAtendimentos} (Média: ${averages.totalAtendimentos})`
      });
    }

    return suggestions;
  }, [metrics, averages]);

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Calculate overall performance score (0-100)
  const performanceScore = useMemo(() => {
    let score = 50;
    
    if (metrics.tma > 0 && averages.tma > 0) {
      const tmaRatio = metrics.tma / averages.tma;
      score += tmaRatio <= 0.8 ? 15 : tmaRatio <= 1 ? 10 : tmaRatio <= 1.2 ? 0 : -10;
    }
    
    if (metrics.totalAtendimentos > 0 && averages.totalAtendimentos > 0) {
      const volumeRatio = metrics.totalAtendimentos / averages.totalAtendimentos;
      score += volumeRatio >= 1.2 ? 15 : volumeRatio >= 1 ? 10 : volumeRatio >= 0.8 ? 0 : -10;
    }
    
    if (metrics.taxaRechamadas <= averages.taxaRechamadas - 5) {
      score += 10;
    } else if (metrics.taxaRechamadas > averages.taxaRechamadas + 5) {
      score -= 10;
    }
    
    if (metrics.npsMedio !== null && averages.npsMedio > 0) {
      const npsRatio = metrics.npsMedio / averages.npsMedio;
      score += npsRatio >= 1.1 ? 10 : npsRatio >= 1 ? 5 : npsRatio >= 0.9 ? 0 : -10;
    }
    
    return Math.max(0, Math.min(100, score));
  }, [metrics, averages]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Regular';
    if (score >= 30) return 'Atenção';
    return 'Crítico';
  };

  // Show empty state if no dashboard data is linked (after all hooks)
  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="p-4 rounded-full bg-muted mb-4">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h4 className="text-lg font-semibold text-foreground mb-2">
          Dados do painel não disponíveis
        </h4>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Para visualizar o relatório de performance, importe a planilha de atendimentos no dashboard.
          O nome do colaborador será vinculado automaticamente ao agente correspondente.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Performance Score Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-mesh border-border/50 card-glow overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-primary shadow-lg">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              Relatório de Performance - {collaborator.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Score de Performance</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold font-display ${getScoreColor(performanceScore)}`}>
                    {performanceScore}
                  </span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <Badge className={`mt-2 ${
                  performanceScore >= 70 ? 'bg-success/20 text-success border-success/30' :
                  performanceScore >= 50 ? 'bg-warning/20 text-warning border-warning/30' :
                  'bg-destructive/20 text-destructive border-destructive/30'
                }`}>
                  {getScoreLabel(performanceScore)}
                </Badge>
              </div>
              <div className="w-32 h-32">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={performanceScore >= 70 ? 'hsl(160, 84%, 50%)' : performanceScore >= 50 ? 'hsl(42, 95%, 55%)' : 'hsl(0, 75%, 55%)'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${performanceScore * 2.83} 283`}
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TMA */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-primary" />
              {comparisons.tma.value !== 0 && (
                <Badge variant="outline" className={comparisons.tma.isGood ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'}>
                  {comparisons.tma.isGood ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                  {Math.abs(comparisons.tma.value)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatDuration(metrics.tma)}</p>
            <p className="text-xs text-muted-foreground">Tempo Médio de Atendimento</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Média equipe: {formatDuration(averages.tma)}</p>
          </CardContent>
        </Card>

        {/* Volume */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Headphones className="w-5 h-5 text-primary" />
              {comparisons.volume.value !== 0 && (
                <Badge variant="outline" className={comparisons.volume.isGood ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'}>
                  {comparisons.volume.isGood ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(comparisons.volume.value)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.totalAtendimentos}</p>
            <p className="text-xs text-muted-foreground">Total de Atendimentos</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Média equipe: {averages.totalAtendimentos}</p>
          </CardContent>
        </Card>

        {/* Taxa de Rechamadas */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              {comparisons.rechamada.value !== 0 && (
                <Badge variant="outline" className={comparisons.rechamada.isGood ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'}>
                  {comparisons.rechamada.isGood ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                  {Math.abs(comparisons.rechamada.value)}pp
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.taxaRechamadas}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Rechamadas</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Média equipe: {averages.taxaRechamadas}%</p>
          </CardContent>
        </Card>

        {/* NPS */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.npsMedio !== null ? metrics.npsMedio.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">NPS Médio</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Média equipe: {averages.npsMedio.toFixed(1)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{metrics.leadsUnicos}</p>
            <p className="text-xs text-muted-foreground">Leads Únicos</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{metrics.avaliacoesRecebidas}</p>
            <p className="text-xs text-muted-foreground">Avaliações Recebidas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{metrics.taxaAvaliacao}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Avaliação</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Improvement Suggestions */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Metas de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {improvementSuggestions.length > 0 ? (
              improvementSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border ${
                    suggestion.priority === 'alta' 
                      ? 'bg-destructive/5 border-destructive/20' 
                      : suggestion.priority === 'media'
                      ? 'bg-warning/5 border-warning/20'
                      : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {suggestion.priority === 'alta' ? (
                      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    ) : suggestion.priority === 'media' ? (
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    ) : (
                      <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{suggestion.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.metric}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`ml-auto flex-shrink-0 ${
                        suggestion.priority === 'alta' 
                          ? 'border-destructive/50 text-destructive' 
                          : suggestion.priority === 'media'
                          ? 'border-warning/50 text-warning'
                          : 'border-primary/50 text-primary'
                      }`}
                    >
                      {suggestion.priority === 'alta' ? 'Prioridade Alta' : 
                       suggestion.priority === 'media' ? 'Prioridade Média' : 'Sugestão'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">Excelente trabalho!</p>
                  <p className="text-xs text-muted-foreground">Todas as métricas estão dentro ou acima da média da equipe.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Note */}
      <motion.div variants={itemVariants}>
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Este relatório pode ser compartilhado com o colaborador para acompanhamento de performance e definição de metas.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}