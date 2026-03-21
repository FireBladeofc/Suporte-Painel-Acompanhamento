// Interfaces para Análise Avançada de Suporte
// Port das estruturas de dados do Python analise_suporte.py

export interface AgenteTMAStats {
  agente: string;
  totalAtendimentos: number;
  tmaMinutos: number;
  maximoMinutos: number;
  desvioPadrao: number;
}

export interface OutlierItem {
  agente?: string;
  duracaoMinutos: number;
  finalizacao?: string;
  leadNumber?: string;
}

export interface OutliersTMAResult {
  limiteSuperiorMinutos: number;
  totalOutliers: number;
  duracaoMediaOutliers: number;
  estatisticasPorAgente: AgenteTMAStats[];
  top5MaisLongos: OutlierItem[];
}

export interface CorrelacaoNPSItem {
  finalizacao: string;
  totalAvaliacoes: number;
  npsMedio: number;
}

export interface CasoLongoPorProblema {
  finalizacao: string;
  quantidade: number;
}

export interface CasoLongoPorAgente {
  agente: string;
  quantidade: number;
}

export interface CasosLongosResult {
  limiteHoras: number;
  totalCasos: number;
  duracaoMediaMinutos: number;
  impactoPercentualTempoTotal: number;
  porProblema: CasoLongoPorProblema[];
  porAgente: CasoLongoPorAgente[];
}

export interface MotivoFinalizacaoItem {
  motivo: string;
  quantidade: number;
  percentual: number;
}

export interface CategoriaMotivo {
  quantidade: number;
  percentual: number;
}

export interface MotivosFinalizacaoResult {
  totalAnalisado: number;
  totalMotivosUnicos: number;
  top10Motivos: MotivoFinalizacaoItem[];
  categorias: Record<string, CategoriaMotivo>;
  motivoMaisComum: MotivoFinalizacaoItem | null;
}

export interface DetratoresResult {
  total: number;
  motivosPrincipais: Record<string, number>;
  amostra: Array<Record<string, string>>;
}

export interface PlanoAcaoItem {
  area: string;
  status: 'CRÍTICO' | 'ATENÇÃO' | 'ALERTA' | 'OPORTUNIDADE';
  metricas: string;
  acao: string;
  metaSemana: string;
}

export interface AnaliseAvancadaResult {
  metricasGerais: {
    totalRegistros: number;
    contatosUnicos: number;
    tempoMedioAtendimento: number | null;
    tempoMedioEspera: number | null;
    npsMedio: number | null;
    taxaRechamadas: number;
    taxaAvaliacao: number;
    avaliacoesPendentes: number;
    totalFinalizacoesN2: number;
  };
  outliersTMA: OutliersTMAResult;
  correlacaoNPSProblema: CorrelacaoNPSItem[];
  casosLongos: CasosLongosResult;
  motivosFinalizacao: MotivosFinalizacaoResult;
  detratores: DetratoresResult;
  planoAcao: PlanoAcaoItem[];
}
