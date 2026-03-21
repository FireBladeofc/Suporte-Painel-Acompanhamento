export interface SupportTicket {
  id: string;
  agente: string;
  data_abertura: Date;
  data_finalizacao: Date;
  duracao: number; // in minutes (from file - may include days)
  duracao_sessao: number; // in seconds - time-only duration (ignoring date)
  espera: number; // in minutes
  finalizacao: string;
  nps: number | null;
  lead_number: string;
  departamento: string;
}

export interface AgentMetrics {
  agente: string;
  totalAtendimentos: number;
  leadsUnicos: number;
  taxaRechamadas: number;
  tma: number; // Tempo Médio de Atendimento (minutos)
  tme: number; // Tempo Médio de Espera (minutos)
  tmr: number; // Tempo Médio de Resolução (minutos)
  npsMedio: number | null;
  avaliacoesRecebidas: number;
  avaliacoesPendentes: number;
  taxaAvaliacao: number;
}

export interface DashboardFilters {
  agente: string | null;
  periodo: { start: Date; end: Date } | null;
  departamento: string | null;
  finalizacao: string | null;
  avaliado: 'todos' | 'avaliado' | 'nao_avaliado';
}

export interface KPIData {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'critical';
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

export interface RankingItem {
  agente: string;
  value: number | string;
  rank: number;
}
