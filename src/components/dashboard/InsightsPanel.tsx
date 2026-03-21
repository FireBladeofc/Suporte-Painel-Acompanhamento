import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SupportTicket, AgentMetrics, Insight } from '@/types/support';
import { generateInsights } from '@/data/supportData';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  XCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  tickets: SupportTicket[];
  agentMetrics: AgentMetrics[];
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

export function InsightsPanel({ tickets, agentMetrics }: InsightsPanelProps) {
  const insights = useMemo(() => generateInsights(tickets, agentMetrics), [tickets, agentMetrics]);

  // Executive Summary
  const summary = useMemo(() => {
    const total = tickets.length;
    const npsValues = tickets.map(t => t.nps).filter((n): n is number => n !== null);
    const avgNPS = npsValues.length > 0 
      ? (npsValues.reduce((a, b) => a + b, 0) / npsValues.length).toFixed(1)
      : null;
    
    const avgTME = Math.round(tickets.reduce((acc, t) => acc + t.espera, 0) / total);
    const avgTMA = Math.round(tickets.reduce((acc, t) => acc + t.duracao, 0) / total);
    
    const leadsSet = new Set(tickets.map(t => t.lead_number));
    const taxaRechamadas = Math.round(((total - leadsSet.size) / total) * 100);
    
    const taxaAvaliacao = Math.round((npsValues.length / total) * 100);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];

    if (avgNPS && parseFloat(avgNPS) >= 4.5) strengths.push(`NPS médio de ${avgNPS} indica alta satisfação`);
    if (avgTME <= 5) strengths.push(`TME de ${avgTME}min está dentro do ideal`);
    if (taxaRechamadas < 15) strengths.push(`Taxa de rechamadas controlada em ${taxaRechamadas}%`);
    
    if (avgNPS && parseFloat(avgNPS) < 4) weaknesses.push(`NPS médio de ${avgNPS} precisa de atenção`);
    if (avgTME > 10) weaknesses.push(`TME de ${avgTME}min está elevado`);
    if (taxaRechamadas > 25) weaknesses.push(`Taxa de rechamadas de ${taxaRechamadas}% indica problemas de resolução`);
    if (taxaAvaliacao < 30) weaknesses.push(`Apenas ${taxaAvaliacao}% dos atendimentos foram avaliados`);
    
    if (avgTME > 15 && avgNPS && parseFloat(avgNPS) < 3.5) {
      risks.push('Correlação negativa entre espera e satisfação');
    }
    if (taxaRechamadas > 30) {
      risks.push('Alto índice de rechamadas pode indicar resolução incompleta');
    }

    return { total, avgNPS, avgTME, avgTMA, taxaRechamadas, taxaAvaliacao, strengths, weaknesses, risks };
  }, [tickets]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      case 'info': return Info;
    }
  };

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'border-success/30 bg-success/5 hover:border-success/50';
      case 'warning': return 'border-warning/30 bg-warning/5 hover:border-warning/50';
      case 'critical': return 'border-destructive/30 bg-destructive/5 hover:border-destructive/50';
      case 'info': return 'border-primary/30 bg-primary/5 hover:border-primary/50';
    }
  };

  const getIconStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'text-success bg-success/15';
      case 'warning': return 'text-warning bg-warning/15';
      case 'critical': return 'text-destructive bg-destructive/15';
      case 'info': return 'text-primary bg-primary/15';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h2 className="text-2xl font-bold font-display text-foreground">
            Insights & Ações Recomendadas
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-4">
          Análise automatizada baseada em dados com foco em melhorias imediatas
        </p>
      </div>

      {/* Executive Summary */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-mesh border border-border/50 rounded-2xl p-8 card-glow"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-primary shadow-lg">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground">Resumo Executivo</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { value: summary.total, label: 'Atendimentos', highlight: true },
              { value: summary.avgNPS || '-', label: 'NPS Médio' },
              { value: `${summary.avgTMA}min`, label: 'TMA Médio' },
              { value: `${summary.taxaRechamadas}%`, label: 'Rechamadas' },
              { value: `${summary.taxaAvaliacao}%`, label: 'Taxa Aval.' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02, y: -2 }}
                className="text-center p-4 bg-muted/30 rounded-xl border border-border/30 backdrop-blur-sm"
              >
                <p className={cn(
                  "text-2xl font-bold font-display",
                  item.highlight ? "text-gradient" : "text-foreground"
                )}>
                  {item.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Pontos Fortes */}
            <div className="p-5 rounded-xl bg-success/5 border border-success/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-success/20">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <span className="text-sm font-semibold text-success">Pontos Fortes</span>
              </div>
              {summary.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {summary.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">Nenhum destaque identificado</p>
              )}
            </div>

            {/* Gargalos */}
            <div className="p-5 rounded-xl bg-warning/5 border border-warning/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <span className="text-sm font-semibold text-warning">Gargalos</span>
              </div>
              {summary.weaknesses.length > 0 ? (
                <ul className="space-y-3">
                  {summary.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">Operação estável</p>
              )}
            </div>

            {/* Riscos */}
            <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-destructive/20">
                  <XCircle className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-sm font-semibold text-destructive">Riscos</span>
              </div>
              {summary.risks.length > 0 ? (
                <ul className="space-y-3">
                  {summary.risks.map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">Nenhum risco crítico</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/15">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">Insights Automáticos</h3>
        </div>

        <div className="grid gap-4">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <motion.div 
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.005, x: 4 }}
                className={cn(
                  "border rounded-2xl p-6 transition-all duration-300",
                  getInsightStyles(insight.type)
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl flex-shrink-0", getIconStyles(insight.type))}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="font-semibold text-foreground text-lg">{insight.title}</h4>
                      {insight.metric && (
                        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground flex-shrink-0 border border-border/50">
                          {insight.metric}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {insight.description}
                    </p>
                    
                    {insight.action && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="p-1.5 rounded-lg bg-primary/15">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Ação Recomendada</span>
                          <p className="text-sm text-foreground mt-1">{insight.action}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {insights.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="p-4 rounded-2xl bg-muted/20 w-fit mx-auto mb-4">
                <Info className="w-12 h-12 opacity-40" />
              </div>
              <p className="text-sm">Nenhum insight crítico identificado para o período selecionado.</p>
              <p className="text-xs mt-1 text-muted-foreground/60">Ajuste os filtros para uma análise mais específica.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
