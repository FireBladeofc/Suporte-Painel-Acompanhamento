import { useMemo } from 'react';
import { SupportTicket } from '@/types/support';

export interface UniqueContactMetrics {
  /** Total de contatos únicos (lead_numbers distintos) */
  totalContatosUnicos: number;
  /** Total de duplicidades removidas */
  totalDuplicidadesRemovidas: number;
  /** Total de contatos únicos atendidos (com sessão válida) */
  totalContatosAtendidos: number;
  /** Total de contatos sem resposta */
  totalSemResposta: number;
  /** TMA correto: soma de tempo_atendimento / total de contatos únicos atendidos (em segundos) */
  tmaCorretoSeconds: number;
  /** Base consolidada: 1 registro por lead_number */
  baseConsolidada: SupportTicket[];
}

/**
 * Normaliza lead_number removendo espaços e caracteres especiais
 * para garantir deduplicação consistente
 */
function normalizeLeadNumber(lead: string): string {
  return lead.replace(/[\s\-().+]/g, '').toLowerCase().trim();
}

/**
 * Determina se um ticket representa um atendimento válido (com resposta do agente).
 * Um contato "sem resposta" é aquele que não teve interação significativa:
 * - duracao_sessao === 0 (sem tempo de sessão calculável)
 * - E duracao === 0 (sem duração registrada no arquivo)
 */
function isAtendimentoValido(ticket: SupportTicket): boolean {
  // Precisa ter ambas as datas válidas
  const hasValidDates = ticket.data_abertura instanceof Date && 
                        !isNaN(ticket.data_abertura.getTime()) &&
                        ticket.data_finalizacao instanceof Date && 
                        !isNaN(ticket.data_finalizacao.getTime());
  
  if (!hasValidDates) return false;
  
  // Precisa ter duração de sessão > 0 (indica que houve interação real)
  return ticket.duracao_sessao > 0;
}

/**
 * Processa tickets brutos e retorna métricas baseadas em contatos únicos.
 * 
 * Regras:
 * 1. Cada lead_number distinto = 1 contato único
 * 2. Quando há duplicatas, mantém o registro com maior duracao_sessao (interação mais representativa)
 * 3. Contatos sem resposta são excluídos do cálculo de TMA
 * 4. TMA = soma do tempo_atendimento dos contatos únicos atendidos / total de contatos únicos atendidos
 */
export function processUniqueContacts(tickets: SupportTicket[]): UniqueContactMetrics {
  if (tickets.length === 0) {
    return {
      totalContatosUnicos: 0,
      totalDuplicidadesRemovidas: 0,
      totalContatosAtendidos: 0,
      totalSemResposta: 0,
      tmaCorretoSeconds: 0,
      baseConsolidada: [],
    };
  }

  // Agrupar por lead_number normalizado
  const leadMap = new Map<string, SupportTicket[]>();
  
  for (const ticket of tickets) {
    const normalizedLead = normalizeLeadNumber(ticket.lead_number);
    if (!normalizedLead) continue;
    
    const existing = leadMap.get(normalizedLead);
    if (existing) {
      existing.push(ticket);
    } else {
      leadMap.set(normalizedLead, [ticket]);
    }
  }

  // Consolidar: 1 registro por lead_number (manter o de maior duracao_sessao)
  const baseConsolidada: SupportTicket[] = [];
  
  for (const [, group] of leadMap) {
    // Selecionar o ticket mais representativo:
    // Prioridade: maior duracao_sessao (interação mais longa)
    const best = group.reduce((prev, curr) => {
      // Preferir ticket com sessão válida
      if (curr.duracao_sessao > prev.duracao_sessao) return curr;
      // Em caso de empate, preferir o mais recente
      if (curr.duracao_sessao === prev.duracao_sessao && 
          curr.data_finalizacao > prev.data_finalizacao) return curr;
      return prev;
    });
    baseConsolidada.push(best);
  }

  const totalContatosUnicos = baseConsolidada.length;
  const totalDuplicidadesRemovidas = tickets.length - totalContatosUnicos;

  // Separar atendidos vs sem resposta
  const atendidos = baseConsolidada.filter(isAtendimentoValido);
  const semResposta = baseConsolidada.filter(t => !isAtendimentoValido(t));

  // Calcular TMA sobre contatos únicos atendidos
  // TMA = soma(duracao_sessao de cada contato único atendido) / total de contatos únicos atendidos
  const somaTempo = atendidos.reduce((acc, t) => acc + t.duracao_sessao, 0);
  const tmaCorretoSeconds = atendidos.length > 0
    ? Math.round(somaTempo / atendidos.length)
    : 0;

  return {
    totalContatosUnicos,
    totalDuplicidadesRemovidas,
    totalContatosAtendidos: atendidos.length,
    totalSemResposta: semResposta.length,
    tmaCorretoSeconds,
    baseConsolidada,
  };
}

/**
 * Hook React que processa contatos únicos com memoização
 */
export function useUniqueContacts(tickets: SupportTicket[]): UniqueContactMetrics {
  return useMemo(() => processUniqueContacts(tickets), [tickets]);
}
