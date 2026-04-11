import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SupportTicket, AgentMetrics } from '@/types/support';
import {
  executarAnaliseAvancada,
  exportarAnaliseJSON,
  formatarMinutosParaTexto,
} from '@/data/advancedAnalysis';
import { CategoriaMotivo } from '@/types/analysis';
import { cn } from '@/lib/utils';
import {
  FlaskConical,
  Download,
  AlertTriangle,
  Clock,
  BarChart3,
  Target,
  Users,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Zap,
  GitCompareArrows,
  Timer,
  ShieldAlert,
  Trophy,
  Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdvancedAnalysisPanelProps {
  tickets: SupportTicket[];
  agentMetrics: AgentMetrics[];
  allTickets?: SupportTicket[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

function SectionCard({
  children,
  title,
  icon: Icon,
  badge,
  badgeVariant = 'default',
  defaultExpanded = true,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'warning' | 'critical' | 'success';
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const badgeStyles = {
    default: 'bg-primary/15 text-primary border-primary/20',
    warning: 'bg-warning/15 text-warning border-warning/20',
    critical: 'bg-destructive/15 text-destructive border-destructive/20',
    success: 'bg-success/15 text-success border-success/20',
  };

  return (
    <motion.div
      variants={itemVariants}
      className="border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-border/70"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-primary shadow-lg">
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold font-display text-foreground">{title}</h3>
          {badge && (
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full border',
                badgeStyles[badgeVariant]
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AdvancedAnalysisPanel({
  tickets,
  agentMetrics,
  allTickets,
}: AdvancedAnalysisPanelProps) {
  const analise = useMemo(
    () => executarAnaliseAvancada(tickets, agentMetrics, allTickets),
    [tickets, agentMetrics, allTickets]
  );

  const { outliersTMA, correlacaoNPSProblema, casosLongos, motivosFinalizacao, detratores, planoAcao } =
    analise;

  const handleExport = () => {
    exportarAnaliseJSON(analise);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'CRÍTICO':
        return '🔴';
      case 'ALERTA':
        return '🟡';
      case 'ATENÇÃO':
        return '🟠';
      case 'OPORTUNIDADE':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'CRÍTICO':
        return 'border-destructive/40 bg-destructive/5';
      case 'ALERTA':
      case 'ATENÇÃO':
        return 'border-warning/40 bg-warning/5';
      case 'OPORTUNIDADE':
        return 'border-primary/40 bg-primary/5';
      default:
        return 'border-border/40 bg-muted/5';
    }
  };

  // Max value for category bars
  const categoriasEntries = Object.entries(motivosFinalizacao.categorias) as [string, CategoriaMotivo][];
  const maxCategoriaPercent = categoriasEntries.reduce(
    (max, [, c]) => Math.max(max, c.percentual),
    0
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-accent" />
            <h2 className="text-2xl font-bold font-display text-foreground">Análise Avançada</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            Análise estratégica aprofundada — equivalente ao script Python de suporte
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar JSON</span>
        </Button>
      </div>

      {/* 1. Plano de Ação Semanal */}
      <SectionCard
        title="Plano de Ação Semanal"
        icon={Target}
        badge={planoAcao.length > 0 ? `${planoAcao.length} ações` : undefined}
        badgeVariant={planoAcao.some(a => a.status === 'CRÍTICO') ? 'critical' : 'warning'}
      >
        {planoAcao.length > 0 ? (
          <div className="grid gap-4">
            {planoAcao.map((acao, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn('border rounded-xl p-5 transition-all', statusStyle(acao.status))}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{statusIcon(acao.status)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-foreground">{acao.area}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                        {acao.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{acao.metricas}</p>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Ação</p>
                        <p className="text-sm text-foreground">{acao.acao}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span className="font-medium">Meta:</span> {acao.metaSemana}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma ação crítica identificada automaticamente.</p>
            <p className="text-xs mt-1 opacity-60">Todos os indicadores estão dentro dos parâmetros.</p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Análise de Detratores (NPS < 4)"
        icon={ShieldAlert}
        badge={detratores.total > 0 ? `${detratores.total} detratores` : '✅ Nenhum'}
        badgeVariant={detratores.total > 0 ? 'critical' : 'success'}
      >
        {detratores.total > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <TrendingDown className="w-8 h-8 text-destructive" />
              <div>
                <p className="font-bold text-foreground text-lg">{detratores.total}</p>
                <p className="text-sm text-muted-foreground">avaliações baixas identificadas</p>
              </div>
            </div>

            {Object.keys(detratores.motivosPrincipais).length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Motivo de Finalização
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Ocorrências
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detratores.motivosPrincipais).map(([motivo, qtd], i) => (
                      <tr
                        key={motivo}
                        className={cn(
                          'border-b border-border/30 transition-colors hover:bg-muted/20',
                          i === 0 && 'bg-destructive/5'
                        )}
                      >
                        <td className="py-3 px-4 text-foreground">{motivo}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-foreground">{qtd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">✅ Excelente! Nenhum detrator (NPS {"<"} 4) identificado no período.</p>
          </div>
        )}
      </SectionCard>

      {/* 3. Outliers TMA */}
      <SectionCard
        title="Outliers de TMA"
        icon={Timer}
        badge={
          outliersTMA.totalOutliers > 0
            ? `${outliersTMA.totalOutliers} outliers`
            : 'Normal'
        }
        badgeVariant={outliersTMA.totalOutliers > 10 ? 'warning' : 'default'}
      >
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center">
              <p className="text-2xl font-bold font-display text-foreground">
                {formatarMinutosParaTexto(outliersTMA.limiteSuperiorMinutos)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                Limite IQR
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5 italic">
                (Limite Estatístico)
              </p>
            </div>
            {outliersTMA.totalOutliers > 0 ? (
              <>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold font-display text-foreground">
                    {outliersTMA.totalOutliers}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    Outliers detectados
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold font-display text-foreground">
                    {formatarMinutosParaTexto(outliersTMA.duracaoMediaOutliers)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    Média de TMA
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center flex flex-col justify-center min-h-[90px]">
                  <div className="flex justify-center items-end gap-3 mb-2">
                    {/* Logica de podio 2-1-3 */}
                    {[1, 0, 2].map((idx) => {
                      const ag = outliersTMA.topAgentes[idx];
                      if (!ag) return null;
                      const isFirst = idx === 0;
                      return (
                        <div key={idx} className={cn(
                          "flex flex-col items-center transition-all duration-300",
                          isFirst ? "scale-110 -translate-y-1" : "opacity-80 scale-90"
                        )}>
                          <div className={cn(
                            "rounded-full flex items-center justify-center mb-1.5 shadow-sm",
                            isFirst ? "w-8 h-8 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" :
                            idx === 1 ? "w-7 h-7 bg-slate-300/20 text-slate-300 border border-slate-300/30" :
                            "w-7 h-7 bg-amber-600/20 text-amber-600 border border-amber-600/30"
                          )}>
                            <Trophy className={isFirst ? "w-4 h-4" : "w-3.5 h-3.5"} />
                          </div>
                          <span 
                            title={ag.agente.split(' - ').pop()}
                            className={cn(
                              "text-center leading-tight truncate px-1 font-semibold",
                              isFirst ? "text-xs text-foreground w-24" : "text-[10px] text-muted-foreground w-20"
                            )}
                          >
                            {ag.agente.split(' - ').pop()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-primary/80 font-bold mt-1">
                    🏆 Pódio de Agilidade
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center">
                  <p className="text-2xl font-bold font-display text-success">
                    {outliersTMA.topAgentes.length > 0 
                      ? formatarMinutosParaTexto(outliersTMA.topAgentes[0].tmaMinutos)
                      : "N/A"
                    }
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    Melhor Performance
                  </p>
                  <p className="text-[9px] text-success/70 mt-0.5 italic">
                    (Média do 1º Colocado)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Estatísticas por agente */}
          {outliersTMA.estatisticasPorAgente.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Estatísticas de Duração por Agente
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Agente
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Atend.
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Duração Média
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Máx.
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Desvio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outliersTMA.estatisticasPorAgente.map((ag) => (
                      <tr
                        key={ag.agente}
                        className="border-b border-border/30 transition-colors hover:bg-muted/20"
                      >
                        <td className="py-3 px-4 text-foreground font-medium">{ag.agente.split(' - ').pop()}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{ag.totalAtendimentos}</td>
                        <td className="py-3 px-4 text-center font-mono text-foreground">
                          {formatarMinutosParaTexto(ag.tmaMinutos)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-foreground">
                          {formatarMinutosParaTexto(ag.maximoMinutos)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {ag.desvioPadrao.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top 5 mais longos */}
          {outliersTMA.top5MaisLongos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                Top 5 Atendimentos Mais Longos
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Agente
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Duração
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Finalização
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Lead
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outliersTMA.top5MaisLongos.map((item, i) => (
                      <tr
                        key={i}
                        className={cn(
                          'border-b border-border/30 transition-colors hover:bg-muted/20',
                          i === 0 && 'bg-warning/5'
                        )}
                      >
                        <td className="py-3 px-4 text-foreground font-medium">
                          {item.agente?.split(' - ').pop() || '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-warning">
                          {formatarMinutosParaTexto(item.duracaoMinutos)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{item.finalizacao || '-'}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                          {item.leadNumber || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 4. Correlação NPS × Problema */}
      <SectionCard
        title="Correlação NPS × Tipo de Problema"
        icon={GitCompareArrows}
        badge={correlacaoNPSProblema.length > 0 ? `${correlacaoNPSProblema.length} tipos` : undefined}
      >
        {correlacaoNPSProblema.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Finalização
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Avaliações
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    NPS Médio
                  </th>
                </tr>
              </thead>
              <tbody>
                {correlacaoNPSProblema.map((item, i) => {
                  const isFirst = i === 0;
                  const isLast = i === correlacaoNPSProblema.length - 1;
                  return (
                    <tr
                      key={item.finalizacao}
                      className={cn(
                        'border-b border-border/30 transition-colors hover:bg-muted/20',
                        isFirst && 'bg-success/5',
                        isLast && correlacaoNPSProblema.length > 1 && 'bg-destructive/5'
                      )}
                    >
                      <td className="py-3 px-4 text-foreground">
                        {isFirst && <span className="mr-1">🏆</span>}
                        {isLast && correlacaoNPSProblema.length > 1 && <span className="mr-1">⚠️</span>}
                        {item.finalizacao}
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{item.totalAvaliacoes}</td>
                      <td
                        className={cn(
                          'py-3 px-4 text-center font-mono font-bold',
                          // Escala 0–5: >= 4.5 = ótimo | 4.0-4.49 = atenção | < 4 = detrator
                          item.npsMedio >= 4.5 ? 'text-success' : item.npsMedio < 4 ? 'text-destructive' : 'text-foreground'
                        )}
                      >
                        {item.npsMedio.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Dados insuficientes para correlação (mínimo 5 avaliações por tipo).</p>
          </div>
        )}
      </SectionCard>

      {/* 5. Casos Longos */}
      <SectionCard
        title={`Casos com Duração > ${casosLongos.limiteHoras}h`}
        icon={AlertTriangle}
        badge={casosLongos.totalCasos > 0 ? `${casosLongos.totalCasos} casos` : 'Nenhum'}
        badgeVariant={casosLongos.totalCasos > 0 ? 'warning' : 'success'}
        defaultExpanded={casosLongos.totalCasos > 0}
      >
        {casosLongos.totalCasos > 0 ? (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-center">
                <p className="text-2xl font-bold font-display text-foreground">{casosLongos.totalCasos}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Total de Casos
                </p>
              </div>
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-center">
                <p className="text-2xl font-bold font-display text-foreground">
                  {formatarMinutosParaTexto(casosLongos.duracaoMediaMinutos)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Duração Média
                </p>
              </div>
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-center">
                <p className="text-2xl font-bold font-display text-warning">
                  {casosLongos.impactoPercentualTempoTotal}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Impacto no Tempo Total
                </p>
              </div>
            </div>

            {/* Por problema */}
            {casosLongos.porProblema.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Distribuição por Problema</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Finalização
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Quantidade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {casosLongos.porProblema.map((p) => (
                        <tr
                          key={p.finalizacao}
                          className="border-b border-border/30 transition-colors hover:bg-muted/20"
                        >
                          <td className="py-3 px-4 text-foreground">{p.finalizacao}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                            {p.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Por agente */}
            {casosLongos.porAgente.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Distribuição por Agente</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Agente
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Quantidade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {casosLongos.porAgente.map((a) => (
                        <tr
                          key={a.agente}
                          className="border-b border-border/30 transition-colors hover:bg-muted/20"
                        >
                          <td className="py-3 px-4 text-foreground font-medium">
                            {a.agente.split(' - ').pop()}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                            {a.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">
              ✅ Nenhum atendimento com duração superior a {casosLongos.limiteHoras}h.
            </p>
          </div>
        )}
      </SectionCard>

      {/* 6. Categorização de Motivos */}
      <SectionCard
        title="Categorização de Motivos"
        icon={BarChart3}
        badge={`${motivosFinalizacao.totalMotivosUnicos} motivos únicos`}
      >
        <div className="space-y-6">
          {/* Barras de categoria */}
          {categoriasEntries.length > 0 && (
            <div className="space-y-3">
              {([...categoriasEntries] as [string, CategoriaMotivo][])
                .sort(([, a], [, b]) => b.percentual - a.percentual)
                .map(([cat, dados]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground">{cat}</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {dados.quantidade} ({dados.percentual}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted/30 border border-border/30 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dados.percentual / maxCategoriaPercent) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-primary"
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Top 10 motivos */}
          {motivosFinalizacao.top10Motivos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Top 10 Motivos de Contato
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-12">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Motivo
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Volume
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {motivosFinalizacao.top10Motivos.map((m, i) => (
                      <tr
                        key={m.motivo}
                        className={cn(
                          'border-b border-border/30 transition-colors hover:bg-muted/20',
                          i === 0 && 'bg-primary/5'
                        )}
                      >
                        <td className="py-3 px-4 text-center text-muted-foreground font-medium">
                          {i + 1}º
                        </td>
                        <td className="py-3 px-4 text-foreground">{m.motivo}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                          {m.quantidade}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {m.percentual}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 7. Leads com Risco (TMA + Rechamadas) */}
      <SectionCard
        title="Leads com Risco (Duração + Rechamadas)"
        icon={ShieldAlert}
        badge={analise.leadsComRisco.total > 0 ? `${analise.leadsComRisco.total} leads` : 'Nenhum'}
        badgeVariant={analise.leadsComRisco.total > 0 ? 'critical' : 'success'}
        defaultExpanded={analise.leadsComRisco.total > 0}
      >
        {analise.leadsComRisco.total > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <p className="font-bold text-foreground text-lg">{analise.leadsComRisco.total}</p>
                <p className="text-sm text-muted-foreground">leads críticos identificados com alta recorrência e lentidão</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Lead / Instância
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Último Agente
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Duração Média
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Rechamadas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analise.leadsComRisco.leads.map((lead, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'border-b border-border/30 transition-colors hover:bg-muted/20',
                        i === 0 && 'bg-destructive/5'
                      )}
                    >
                      <td className="py-3 px-4 font-mono text-foreground font-medium">{lead.leadNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">{lead.agente}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                        {formatarMinutosParaTexto(lead.tmaMinutos)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-destructive">
                        {lead.rechamadas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground italic px-2">
              * Critérico: Leads com 3 ou mais contatos e TMA médio superior ao limite estatístico de normalidade.
            </p>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">✅ Nenhum lead com padrão de risco (alta recorrência + TMA elevado) identificado.</p>
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
