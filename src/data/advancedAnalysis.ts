/**
 * Análise Avançada de Suporte Técnico
 * Port das funções do Python analise_suporte.py para TypeScript
 * Opera sobre SupportTicket[] já carregados pelo useExcelUpload
 */

import { SupportTicket, AgentMetrics } from '@/types/support';
import {
  OutliersTMAResult,
  AgenteTMAStats,
  OutlierItem,
  CorrelacaoNPSItem,
  CasosLongosResult,
  MotivosFinalizacaoResult,
  MotivoFinalizacaoItem,
  CategoriaMotivo,
  DetratoresResult,
  PlanoAcaoItem,
  AnaliseAvancadaResult,
} from '@/types/analysis';

// ─── Utilitários ────────────────────────────────────────────────────────────

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < sorted.length) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function formatarMinutosParaTexto(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || isNaN(minutos)) return 'N/A';
  const minutosInt = Math.round(minutos);
  const horas = Math.floor(minutosInt / 60);
  const mins = minutosInt % 60;
  if (horas > 0) {
    return `${horas}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${mins}m`;
}

// ─── Análise de Outliers TMA ────────────────────────────────────────────────

export function analisarOutliersTMA(tickets: SupportTicket[]): OutliersTMAResult {
  const durações = tickets
    .map(t => t.duracao)
    .filter(d => d > 0)
    .sort((a, b) => a - b);

  if (durações.length === 0) {
    return {
      limiteSuperiorMinutos: 0,
      totalOutliers: 0,
      duracaoMediaOutliers: 0,
      estatisticasPorAgente: [],
      top5MaisLongos: [],
    };
  }

  const q1 = quantile(durações, 0.25);
  const q3 = quantile(durações, 0.75);
  const iqr = q3 - q1;
  const limiteSuperior = round(q3 + 1.5 * iqr, 2);

  const outlierTickets = tickets.filter(t => t.duracao > limiteSuperior);

  // Estatísticas por agente
  const agenteMap = new Map<string, number[]>();
  tickets.forEach(t => {
    if (t.duracao > 0) {
      const arr = agenteMap.get(t.agente) || [];
      arr.push(t.duracao);
      agenteMap.set(t.agente, arr);
    }
  });

  const estatisticasPorAgente: AgenteTMAStats[] = [];
  agenteMap.forEach((duracoes, agente) => {
    const mean = duracoes.reduce((a, b) => a + b, 0) / duracoes.length;
    estatisticasPorAgente.push({
      agente,
      totalAtendimentos: duracoes.length,
      tmaMinutos: round(mean),
      maximoMinutos: round(Math.max(...duracoes)),
      desvioPadrao: round(stdDev(duracoes)),
    });
  });
  estatisticasPorAgente.sort((a, b) => b.totalAtendimentos - a.totalAtendimentos);

  // Top 5 mais longos
  const top5MaisLongos: OutlierItem[] = outlierTickets
    .sort((a, b) => b.duracao - a.duracao)
    .slice(0, 5)
    .map(t => ({
      agente: t.agente,
      duracaoMinutos: round(t.duracao),
      finalizacao: t.finalizacao,
      leadNumber: t.lead_number,
    }));

  const mediaOutliers = outlierTickets.length > 0
    ? round(outlierTickets.reduce((acc, t) => acc + t.duracao, 0) / outlierTickets.length)
    : 0;

  return {
    limiteSuperiorMinutos: limiteSuperior,
    totalOutliers: outlierTickets.length,
    duracaoMediaOutliers: mediaOutliers,
    estatisticasPorAgente,
    top5MaisLongos,
  };
}

// ─── Correlação NPS × Tipo de Problema ──────────────────────────────────────

export function analisarCorrelacaoNPSProblema(
  tickets: SupportTicket[],
  minAvaliacoes: number = 5
): CorrelacaoNPSItem[] {
  const grupoMap = new Map<string, number[]>();

  tickets.forEach(t => {
    if (t.nps !== null) {
      const arr = grupoMap.get(t.finalizacao) || [];
      arr.push(t.nps);
      grupoMap.set(t.finalizacao, arr);
    }
  });

  const resultado: CorrelacaoNPSItem[] = [];
  grupoMap.forEach((npsValues, finalizacao) => {
    if (npsValues.length >= minAvaliacoes) {
      resultado.push({
        finalizacao,
        totalAvaliacoes: npsValues.length,
        npsMedio: round(npsValues.reduce((a, b) => a + b, 0) / npsValues.length, 2),
      });
    }
  });

  resultado.sort((a, b) => b.npsMedio - a.npsMedio);
  return resultado;
}

// ─── Análise de Casos Longos ────────────────────────────────────────────────

export function analisarCasosLongos(
  tickets: SupportTicket[],
  limiteHoras: number = 5
): CasosLongosResult {
  const limiteMin = limiteHoras * 60;
  const ticketsComDuracao = tickets.filter(t => t.duracao > 0);

  if (ticketsComDuracao.length === 0) {
    return {
      limiteHoras,
      totalCasos: 0,
      duracaoMediaMinutos: 0,
      impactoPercentualTempoTotal: 0,
      porProblema: [],
      porAgente: [],
    };
  }

  const casosLongos = ticketsComDuracao.filter(t => t.duracao > limiteMin);
  const tempoTotal = ticketsComDuracao.reduce((acc, t) => acc + t.duracao, 0);
  const tempoLongos = casosLongos.reduce((acc, t) => acc + t.duracao, 0);
  const impactoPct = tempoTotal > 0 ? round((tempoLongos / tempoTotal) * 100) : 0;

  // Por problema
  const problemaMap = new Map<string, number>();
  casosLongos.forEach(t => {
    problemaMap.set(t.finalizacao, (problemaMap.get(t.finalizacao) || 0) + 1);
  });
  const porProblema = Array.from(problemaMap.entries())
    .map(([finalizacao, quantidade]) => ({ finalizacao, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  // Por agente
  const agenteMap = new Map<string, number>();
  casosLongos.forEach(t => {
    agenteMap.set(t.agente, (agenteMap.get(t.agente) || 0) + 1);
  });
  const porAgente = Array.from(agenteMap.entries())
    .map(([agente, quantidade]) => ({ agente, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const duracaoMedia = casosLongos.length > 0
    ? round(casosLongos.reduce((acc, t) => acc + t.duracao, 0) / casosLongos.length)
    : 0;

  return {
    limiteHoras,
    totalCasos: casosLongos.length,
    duracaoMediaMinutos: duracaoMedia,
    impactoPercentualTempoTotal: impactoPct,
    porProblema,
    porAgente,
  };
}

// ─── Análise de Motivos de Finalização ──────────────────────────────────────

export function analisarMotivosFinalizacao(tickets: SupportTicket[]): MotivosFinalizacaoResult {
  const ticketsComMotivo = tickets.filter(t => t.finalizacao && t.finalizacao.trim() !== '');

  if (ticketsComMotivo.length === 0) {
    return {
      totalAnalisado: 0,
      totalMotivosUnicos: 0,
      top10Motivos: [],
      categorias: {},
      motivoMaisComum: null,
    };
  }

  const total = ticketsComMotivo.length;
  const contagemMap = new Map<string, number>();
  ticketsComMotivo.forEach(t => {
    contagemMap.set(t.finalizacao, (contagemMap.get(t.finalizacao) || 0) + 1);
  });

  const ordenado = Array.from(contagemMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const top10Motivos: MotivoFinalizacaoItem[] = ordenado.slice(0, 10).map(([motivo, qtd]) => ({
    motivo,
    quantidade: qtd,
    percentual: round((qtd / total) * 100, 2),
  }));

  // Categorização
  const categorias: Record<string, { quantidade: number }> = {
    'Instabilidade/Falhas': { quantidade: 0 },
    'Dúvidas/Suporte': { quantidade: 0 },
    'Configuração': { quantidade: 0 },
    'Comunicação': { quantidade: 0 },
    'Outros': { quantidade: 0 },
  };

  ordenado.forEach(([motivo, qtd]) => {
    const lower = motivo.toLowerCase();
    if (['instabilidade', 'falha', 'erro', 'bug'].some(p => lower.includes(p))) {
      categorias['Instabilidade/Falhas'].quantidade += qtd;
    } else if (['dúvida', 'duvida', 'ajuda', 'suporte'].some(p => lower.includes(p))) {
      categorias['Dúvidas/Suporte'].quantidade += qtd;
    } else if (['config', 'ajuste', 'setup'].some(p => lower.includes(p))) {
      categorias['Configuração'].quantidade += qtd;
    } else if (['comunicação', 'comunicacao', 'mensagem', 'sincroniza'].some(p => lower.includes(p))) {
      categorias['Comunicação'].quantidade += qtd;
    } else {
      categorias['Outros'].quantidade += qtd;
    }
  });

  const categoriasComPercentual: Record<string, CategoriaMotivo> = {};
  Object.entries(categorias).forEach(([cat, dados]) => {
    if (dados.quantidade > 0) {
      categoriasComPercentual[cat] = {
        quantidade: dados.quantidade,
        percentual: round((dados.quantidade / total) * 100, 2),
      };
    }
  });

  return {
    totalAnalisado: total,
    totalMotivosUnicos: contagemMap.size,
    top10Motivos,
    categorias: categoriasComPercentual,
    motivoMaisComum: top10Motivos.length > 0 ? top10Motivos[0] : null,
  };
}

// ─── Análise de Detratores ──────────────────────────────────────────────────

export function analisarDetratores(tickets: SupportTicket[]): DetratoresResult {
  const detratores = tickets.filter(t => t.nps !== null && t.nps < 4);

  if (detratores.length === 0) {
    return { total: 0, motivosPrincipais: {}, amostra: [] };
  }

  // Motivos dos detratores
  const motivoMap = new Map<string, number>();
  detratores.forEach(t => {
    motivoMap.set(t.finalizacao, (motivoMap.get(t.finalizacao) || 0) + 1);
  });

  const motivosPrincipais: Record<string, number> = {};
  Array.from(motivoMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([motivo, qtd]) => {
      motivosPrincipais[motivo] = qtd;
    });

  // Amostra (10 primeiros)
  const amostra = detratores.slice(0, 10).map(t => ({
    agente: t.agente,
    nps: String(t.nps),
    finalizacao: t.finalizacao,
  }));

  return {
    total: detratores.length,
    motivosPrincipais,
    amostra,
  };
}

// ─── Plano de Ação Semanal ──────────────────────────────────────────────────

export function gerarPlanoAcaoSemanal(
  tickets: SupportTicket[],
  agentMetrics: AgentMetrics[]
): PlanoAcaoItem[] {
  const plano: PlanoAcaoItem[] = [];

  if (tickets.length === 0) return plano;

  // Métricas gerais rápidas
  const leadsSet = new Set(tickets.map(t => t.lead_number));
  const contatosUnicos = leadsSet.size;
  const taxaRechamadas = contatosUnicos > 0
    ? round(((tickets.length - contatosUnicos) / contatosUnicos) * 100, 2)
    : 0;

  const ticketsComEspera = tickets.filter(t => t.espera > 0);
  const tme = ticketsComEspera.length > 0
    ? round(ticketsComEspera.reduce((a, t) => a + t.espera, 0) / ticketsComEspera.length, 2)
    : null;

  const npsValues = tickets.map(t => t.nps).filter((n): n is number => n !== null);
  const npsMedio = npsValues.length > 0
    ? round(npsValues.reduce((a, b) => a + b, 0) / npsValues.length, 2)
    : null;

  const motivos = analisarMotivosFinalizacao(tickets);

  // 1. Rechamadas
  if (taxaRechamadas > 25) {
    plano.push({
      area: 'Qualidade',
      status: 'CRÍTICO',
      metricas: `Taxa de Rechamadas: ${taxaRechamadas}%`,
      acao: 'Realizar auditoria em tickets duplicados e reforçar treinamento de resolução no primeiro contato (FCR).',
      metaSemana: 'Reduzir rechamadas para abaixo de 20%',
    });
  } else if (taxaRechamadas > 15) {
    plano.push({
      area: 'Qualidade',
      status: 'ATENÇÃO',
      metricas: `Taxa de Rechamadas: ${taxaRechamadas}%`,
      acao: 'Monitorar casos de rechamada para identificar dúvidas recorrentes da equipe.',
      metaSemana: 'Reduzir rechamadas para abaixo de 15%',
    });
  }

  // 2. Tempo de espera
  if (tme && tme > 60) {
    plano.push({
      area: 'Operacional',
      status: 'CRÍTICO',
      metricas: `Tempo Médio de Espera: ${formatarMinutosParaTexto(tme)}`,
      acao: 'Revisar escala de horários de pico e considerar transbordo ou plantão.',
      metaSemana: 'Reduzir espera média para 30m',
    });
  }

  // 3. Top ofensores
  if (motivos.top10Motivos.length > 0) {
    const top1 = motivos.top10Motivos[0];
    plano.push({
      area: 'Processos/Produto',
      status: 'OPORTUNIDADE',
      metricas: `Top Motivo: ${top1.motivo} (${top1.percentual}%)`,
      acao: `Criar ou atualizar material de autoajuda (FAQ/Artigo) específico sobre '${top1.motivo}'.`,
      metaSemana: 'Reduzir incidência deste motivo em 5%',
    });
  }

  // 4. NPS
  if (npsMedio !== null && npsMedio < 4) {
    plano.push({
      area: 'Satisfação',
      status: 'ALERTA',
      metricas: `NPS Atual: ${npsMedio}`,
      acao: 'Contatar detratores da semana para entender insatisfação e reverter quadro.',
      metaSemana: 'Elevar NPS para zona de qualidade',
    });
  }

  // 5. Desbalanceamento de carga
  if (agentMetrics.length > 1) {
    const cargas = agentMetrics.map(a =>
      (a.totalAtendimentos / tickets.length) * 100
    );
    const maxCarga = Math.max(...cargas);
    const minCarga = Math.min(...cargas);
    if (maxCarga - minCarga > 20) {
      plano.push({
        area: 'Gestão de Equipe',
        status: 'ALERTA',
        metricas: `Desbalanceamento: Max ${round(maxCarga)}% vs Min ${round(minCarga)}%`,
        acao: 'Redistribuir tickets ou ajustar pausas para equilibrar demanda entre agentes.',
        metaSemana: 'Equiparar carga de trabalho',
      });
    }
  }

  return plano;
}

// ─── Função Principal Orquestradora ─────────────────────────────────────────

export function executarAnaliseAvancada(
  tickets: SupportTicket[],
  agentMetrics: AgentMetrics[]
): AnaliseAvancadaResult {
  // Métricas gerais
  const leadsSet = new Set(tickets.map(t => t.lead_number));
  const contatosUnicos = leadsSet.size;
  const ticketsComDuracao = tickets.filter(t => t.duracao > 0);
  const tempoMedioAtendimento = ticketsComDuracao.length > 0
    ? round(ticketsComDuracao.reduce((a, t) => a + t.duracao, 0) / ticketsComDuracao.length, 2)
    : null;

  const ticketsComEspera = tickets.filter(t => t.espera > 0);
  const tempoMedioEspera = ticketsComEspera.length > 0
    ? round(ticketsComEspera.reduce((a, t) => a + t.espera, 0) / ticketsComEspera.length, 2)
    : null;

  const npsValues = tickets.map(t => t.nps).filter((n): n is number => n !== null);
  const npsMedio = npsValues.length > 0
    ? round(npsValues.reduce((a, b) => a + b, 0) / npsValues.length, 2)
    : null;

  const taxaRechamadas = contatosUnicos > 0
    ? round(((tickets.length - contatosUnicos) / contatosUnicos) * 100, 2)
    : 0;

  const taxaAvaliacao = tickets.length > 0
    ? round((npsValues.length / tickets.length) * 100, 2)
    : 0;

  const avaliacoesPendentes = tickets.length - npsValues.length;

  const n2Count = tickets.filter(t =>
    t.finalizacao.toLowerCase().includes('n2') ||
    t.finalizacao.toLowerCase().includes('sup - n2')
  ).length;

  return {
    metricasGerais: {
      totalRegistros: tickets.length,
      contatosUnicos,
      tempoMedioAtendimento,
      tempoMedioEspera,
      npsMedio,
      taxaRechamadas,
      taxaAvaliacao,
      avaliacoesPendentes,
      totalFinalizacoesN2: n2Count,
    },
    outliersTMA: analisarOutliersTMA(tickets),
    correlacaoNPSProblema: analisarCorrelacaoNPSProblema(tickets),
    casosLongos: analisarCasosLongos(tickets),
    motivosFinalizacao: analisarMotivosFinalizacao(tickets),
    detratores: analisarDetratores(tickets),
    planoAcao: gerarPlanoAcaoSemanal(tickets, agentMetrics),
  };
}

// ─── Exportação JSON ────────────────────────────────────────────────────────

export function exportarAnaliseJSON(resultado: AnaliseAvancadaResult, nomeArquivo?: string): void {
  const dataStr = JSON.stringify(resultado, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo || `analise_suporte_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
