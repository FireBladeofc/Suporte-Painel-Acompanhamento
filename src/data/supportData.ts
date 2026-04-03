import { SupportTicket, AgentMetrics, Insight } from '@/types/support';

// Duração máxima considerada como atendimento ativo (24 horas em minutos).
// Tickets em aberto por dias/semanas são excluídos do cálculo de TMA.
const MAX_DURACAO_ATIVA = 1440;

// Helper to parse duration string "HH:MM" or "HHHH:MM:SS" to minutes
export function parseDuration(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

// Helper to parse date DD/MM/YYYY
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let year = parseInt(parts[2]);
    if (year < 100) {
      year += 2000;
    }
    return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date();
}

// Clean agent name (remove emoji prefix if any)
export function cleanAgentName(name: string): string {
  return name.replace(/^💬\s*/, '').trim();
}

// Clean department name (remove markdown escapes)
export function cleanDepartment(dept: string): string {
  return dept.replace(/\\\*/g, '*').replace(/\*/g, '').trim();
}

// Normalize lead_number for consistent deduplication
function normalizeLeadNumber(lead: string): string {
  return lead.replace(/[\s\-().+]/g, '').toLowerCase().trim();
}

// Empty initial state - data will be loaded via Excel upload
export const rawTickets: SupportTicket[] = [];

// Calculate agent metrics from tickets
export function calculateAgentMetrics(tickets: SupportTicket[]): AgentMetrics[] {
  const agentMap = new Map<string, SupportTicket[]>();

  tickets.forEach(ticket => {
    const existing = agentMap.get(ticket.agente) || [];
    existing.push(ticket);
    agentMap.set(ticket.agente, existing);
  });

  const metrics: AgentMetrics[] = [];

  agentMap.forEach((agentTickets, agente) => {
    const totalAtendimentos = agentTickets.length;
    
    // Leads únicos (normalizado para consistência com useUniqueContacts e OperationalPanel)
    const leadsSet = new Set(agentTickets.map(t => normalizeLeadNumber(t.lead_number)));
    const leadsUnicos = leadsSet.size;
    
    // Taxa de rechamadas
    const rechamadas = totalAtendimentos - leadsUnicos;
    const taxaRechamadas = totalAtendimentos > 0 
      ? Math.round((rechamadas / totalAtendimentos) * 100) 
      : 0;
    
    // TMA - Tempo Médio de Atendimento (minutos)
    // Exclui tickets em aberto por tempo excessivo (> 24h) que distorcem a média
    const ticketsAtivos = agentTickets.filter(t => t.duracao > 0 && t.duracao <= MAX_DURACAO_ATIVA);
    const tma = ticketsAtivos.length > 0 
      ? Math.round(ticketsAtivos.reduce((acc, t) => acc + t.duracao, 0) / ticketsAtivos.length)
      : 0;
    
    // TME - Tempo Médio de Espera (minutos)
    const tme = totalAtendimentos > 0
      ? Math.round(agentTickets.reduce((acc, t) => acc + t.espera, 0) / totalAtendimentos)
      : 0;
    
    // TMR - Tempo Médio de Resolução (minutos)
    const validTmrTickets = agentTickets.filter(t => 
      t.data_abertura instanceof Date && !isNaN(t.data_abertura.getTime()) &&
      t.data_finalizacao instanceof Date && !isNaN(t.data_finalizacao.getTime()) &&
      t.data_finalizacao.getTime() > t.data_abertura.getTime()
    );
    const tmr = validTmrTickets.length > 0
      ? Math.round(validTmrTickets.reduce((acc, t) => {
          const diff = t.data_finalizacao.getTime() - t.data_abertura.getTime();
          return acc + (diff / (1000 * 60)); // Convert ms to minutes
        }, 0) / validTmrTickets.length)
      : 0;
    
    // NPS
    const npsValues = agentTickets.map(t => t.nps).filter((n): n is number => n !== null);
    const npsMedio = npsValues.length > 0
      ? parseFloat((npsValues.reduce((a, b) => a + b, 0) / npsValues.length).toFixed(1))
      : null;
    
    // Avaliações
    const avaliacoesRecebidas = npsValues.length;
    const avaliacoesPendentes = totalAtendimentos - avaliacoesRecebidas;
    const taxaAvaliacao = totalAtendimentos > 0
      ? Math.round((avaliacoesRecebidas / totalAtendimentos) * 100)
      : 0;

    metrics.push({
      agente,
      totalAtendimentos,
      leadsUnicos,
      taxaRechamadas,
      tma,
      tme,
      tmr,
      npsMedio,
      avaliacoesRecebidas,
      avaliacoesPendentes,
      taxaAvaliacao
    });
  });

  return metrics.sort((a, b) => b.totalAtendimentos - a.totalAtendimentos);
}

// Helper to format date without timezone issues
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get tickets grouped by date for charts
export function getTicketsByDate(tickets: SupportTicket[]): { date: string; dateDisplay: string; count: number }[] {
  const dateMap = new Map<string, { count: number; dateDisplay: string }>();
  
  tickets.forEach(ticket => {
    // Use local date components to avoid timezone issues
    const dateKey = formatDateString(ticket.data_finalizacao);
    const dateDisplay = ticket.data_finalizacao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.count++;
    } else {
      dateMap.set(dateKey, { count: 1, dateDisplay });
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, dateDisplay: data.dateDisplay, count: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Get tickets grouped by finalizacao
export function getTicketsByFinalizacao(tickets: SupportTicket[]): { name: string; value: number }[] {
  const finalizacaoMap = new Map<string, number>();
  
  tickets.forEach(ticket => {
    finalizacaoMap.set(ticket.finalizacao, (finalizacaoMap.get(ticket.finalizacao) || 0) + 1);
  });

  return Array.from(finalizacaoMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Generate insights from tickets
export function generateInsights(tickets: SupportTicket[], agentMetrics: AgentMetrics[]): Insight[] {
  const insights: Insight[] = [];

  if (tickets.length === 0) {
    insights.push({
      id: 'no-data',
      type: 'info',
      title: 'Aguardando dados',
      description: 'Importe um arquivo Excel para visualizar os insights do período.',
      action: 'Clique em "Importar Excel" no cabeçalho para carregar os dados de suporte.',
    });
    return insights;
  }

  // 1. High rechamada rate
  const highRechamadaAgents = agentMetrics.filter(a => a.taxaRechamadas > 20);
  if (highRechamadaAgents.length > 0) {
    const worst = highRechamadaAgents[0];
    insights.push({
      id: 'high-rechamada',
      type: 'warning',
      title: 'Taxa de rechamadas elevada',
      description: `${highRechamadaAgents.length} agentes com taxa de rechamadas acima de 20%. ${worst.agente} lidera com ${worst.taxaRechamadas}%.`,
      metric: `${worst.taxaRechamadas}%`,
      action: 'Revisar qualidade do primeiro atendimento e completude das resoluções.',
    });
  }

  // 2. Low NPS agents
  const lowNPSAgents = agentMetrics.filter(a => a.npsMedio !== null && a.npsMedio < 4);
  if (lowNPSAgents.length > 0) {
    insights.push({
      id: 'low-nps',
      type: 'critical',
      title: 'NPS abaixo da meta',
      description: `${lowNPSAgents.length} agentes com NPS médio abaixo de 4.0. Risco de insatisfação do cliente.`,
      metric: `${lowNPSAgents.length} agentes`,
      action: 'Implementar coaching individual e revisão de abordagem de atendimento.',
    });
  }

  // 3. High wait time impact on NPS
  const highWaitTickets = tickets.filter(t => t.espera > 10);
  const highWaitWithNPS = highWaitTickets.filter(t => t.nps !== null);
  if (highWaitWithNPS.length > 5) {
    const avgNPSHighWait = highWaitWithNPS.reduce((acc, t) => acc + (t.nps || 0), 0) / highWaitWithNPS.length;
    const lowWaitTickets = tickets.filter(t => t.espera <= 10 && t.nps !== null);
    const avgNPSLowWait = lowWaitTickets.length > 0 
      ? lowWaitTickets.reduce((acc, t) => acc + (t.nps || 0), 0) / lowWaitTickets.length 
      : 0;
    
    if (avgNPSHighWait < avgNPSLowWait - 0.5) {
      insights.push({
        id: 'wait-time-nps',
        type: 'warning',
        title: 'Tempo de espera impactando NPS',
        description: `Atendimentos com espera > 10min têm NPS ${avgNPSHighWait.toFixed(1)} vs ${avgNPSLowWait.toFixed(1)} para espera ≤ 10min.`,
        metric: `${(avgNPSLowWait - avgNPSHighWait).toFixed(1)} pontos`,
        action: 'Otimizar distribuição de chamados e aumentar capacidade nos horários de pico.',
      });
    }
  }

  // 4. Low evaluation rate
  const overallEvalRate = tickets.length > 0 
    ? (tickets.filter(t => t.nps !== null).length / tickets.length) * 100 
    : 0;
  
  if (overallEvalRate < 30) {
    insights.push({
      id: 'low-eval-rate',
      type: 'warning',
      title: 'Taxa de avaliação baixa',
      description: `Apenas ${overallEvalRate.toFixed(0)}% dos atendimentos foram avaliados. Dados insuficientes para análise completa.`,
      metric: `${overallEvalRate.toFixed(0)}%`,
      action: 'Implementar lembretes de avaliação pós-atendimento e campanhas de incentivo.',
    });
  }

  // 5. Top performers
  const topPerformers = agentMetrics
    .filter(a => a.npsMedio !== null && a.npsMedio >= 4.5 && a.totalAtendimentos >= 10)
    .slice(0, 3);
  
  if (topPerformers.length > 0) {
    insights.push({
      id: 'top-performers',
      type: 'success',
      title: 'Destaques positivos',
      description: `${topPerformers.map(a => a.agente.split(' - ').pop()).join(', ')} apresentam NPS ≥ 4.5 com volume significativo.`,
      metric: `${topPerformers.length} agentes`,
      action: 'Documentar práticas destes agentes e replicar no time.',
    });
  }

  // 6. Finalization patterns causing rechamadas
  const finalizacaoMap = new Map<string, { total: number; rechamadas: number }>();
  const leadFinalizacoes = new Map<string, Set<string>>();
  
  tickets.forEach(t => {
    if (!leadFinalizacoes.has(t.lead_number)) {
      leadFinalizacoes.set(t.lead_number, new Set());
    }
    leadFinalizacoes.get(t.lead_number)!.add(t.finalizacao);
  });

  tickets.forEach(t => {
    const current = finalizacaoMap.get(t.finalizacao) || { total: 0, rechamadas: 0 };
    current.total++;
    if (leadFinalizacoes.get(t.lead_number)!.size > 1) {
      current.rechamadas++;
    }
    finalizacaoMap.set(t.finalizacao, current);
  });

  const highRechamadaFinalizacoes = Array.from(finalizacaoMap.entries())
    .filter(([_, data]) => data.total >= 10 && (data.rechamadas / data.total) > 0.3)
    .sort((a, b) => (b[1].rechamadas / b[1].total) - (a[1].rechamadas / a[1].total));

  if (highRechamadaFinalizacoes.length > 0) {
    const [motivo, data] = highRechamadaFinalizacoes[0];
    const rate = Math.round((data.rechamadas / data.total) * 100);
    insights.push({
      id: 'finalizacao-rechamada',
      type: 'critical',
      title: 'Motivo com alta rechamada',
      description: `"${motivo}" tem ${rate}% de taxa de rechamada (${data.rechamadas}/${data.total} atendimentos).`,
      metric: `${rate}%`,
      action: 'Revisar processo e treinamento específico para este tipo de atendimento.',
    });
  }

  // 7. Instabilidade rate
  const instabilidadeTickets = tickets.filter(t => 
    t.finalizacao.toLowerCase().includes('instabilidade')
  );
  
  if (instabilidadeTickets.length > tickets.length * 0.15) {
    const rate = Math.round((instabilidadeTickets.length / tickets.length) * 100);
    insights.push({
      id: 'high-instabilidade',
      type: 'critical',
      title: 'Alto volume de instabilidade',
      description: `${rate}% dos atendimentos são relacionados a instabilidade (${instabilidadeTickets.length} tickets).`,
      metric: `${instabilidadeTickets.length} tickets`,
      action: 'Escalar para equipe técnica para identificar causa raiz das instabilidades.',
    });
  }

  // 8. Inactividade cliente analysis
  const inatividadeTickets = tickets.filter(t => 
    t.finalizacao.toLowerCase().includes('inativ')
  );
  
  if (inatividadeTickets.length > tickets.length * 0.1) {
    const rate = Math.round((inatividadeTickets.length / tickets.length) * 100);
    insights.push({
      id: 'high-inatividade',
      type: 'info',
      title: 'Taxa de inatividade elevada',
      description: `${rate}% dos atendimentos finalizaram por inatividade do cliente (${inatividadeTickets.length} tickets).`,
      metric: `${inatividadeTickets.length} tickets`,
      action: 'Revisar tempo de timeout e implementar lembretes de resposta ao cliente.',
    });
  }

  // 9. Day of week analysis
  const dayMap = new Map<number, number>();
  tickets.forEach(t => {
    const day = t.data_abertura.getDay();
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });
  
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  let maxDay = 0, maxCount = 0;
  dayMap.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      maxDay = day;
    }
  });

  if (maxCount > 0) {
    insights.push({
      id: 'peak-day',
      type: 'info',
      title: 'Dia de pico identificado',
      description: `${days[maxDay]} concentra o maior volume com ${maxCount} atendimentos no período.`,
      metric: `${maxCount} atendimentos`,
      action: 'Considerar reforço de equipe ou redistribuição de escala.',
    });
  }

  return insights;
}
