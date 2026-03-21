import { useMemo } from 'react';
import { SupportTicket } from '@/types/support';

export interface ValidationIssue {
  type: 'warning' | 'error' | 'info';
  field: string;
  count: number;
  description: string;
  examples?: string[];
}

export interface TimeAnalysisStats {
  // Duração (coluna duracao - parsed as HH:MM)
  duracaoTotalMinutos: number;
  duracaoTotalFormatted: string; // "XXXh YYmin"
  duracaoMedia: number;
  duracaoMediaFormatted: string;
  duracaoMin: number;
  duracaoMinFormatted: string;
  duracaoMax: number;
  duracaoMaxFormatted: string;
  duracaoZeroCount: number;
  // Espera (coluna espera - parsed as HH:MM)
  esperaTotalMinutos: number;
  esperaTotalFormatted: string;
  esperaMedia: number;
  esperaMediaFormatted: string;
  esperaMin: number;
  esperaMinFormatted: string;
  esperaMax: number;
  esperaMaxFormatted: string;
  esperaZeroCount: number;
  // Distribuição por faixas de duração
  duracaoRanges: { label: string; count: number; percent: number }[];
  esperaRanges: { label: string; count: number; percent: number }[];
  // Conferência
  totalRegistrosAnalisados: number;
}

export interface DataValidationReport {
  totalRecords: number;
  validRecords: number;
  issueCount: number;
  issues: ValidationIssue[];
  fieldStats: {
    field: string;
    filled: number;
    empty: number;
    fillRate: number;
  }[];
  dateRange: {
    earliest: Date | null;
    latest: Date | null;
  };
  uniqueAgents: number;
  uniqueLeads: number;
  uniqueDepartments: number;
  avgDuration: number;
  avgEspera: number;
  npsStats: {
    total: number;
    withNPS: number;
    avgNPS: number | null;
  };
  timeAnalysis: TimeAnalysisStats;
  isValid: boolean;
}

function formatMinutesHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h.toLocaleString('pt-BR')}h ${String(m).padStart(2, '0')}min`;
}

function buildRanges(values: number[], ranges: { label: string; min: number; max: number }[]): { label: string; count: number; percent: number }[] {
  const total = values.length || 1;
  return ranges.map(r => {
    const count = values.filter(v => v >= r.min && v < r.max).length;
    return { label: r.label, count, percent: Math.round((count / total) * 100) };
  });
}

const emptyTimeAnalysis: TimeAnalysisStats = {
  duracaoTotalMinutos: 0, duracaoTotalFormatted: '0h 00min',
  duracaoMedia: 0, duracaoMediaFormatted: '0h 00min',
  duracaoMin: 0, duracaoMinFormatted: '0h 00min',
  duracaoMax: 0, duracaoMaxFormatted: '0h 00min',
  duracaoZeroCount: 0,
  esperaTotalMinutos: 0, esperaTotalFormatted: '0h 00min',
  esperaMedia: 0, esperaMediaFormatted: '0h 00min',
  esperaMin: 0, esperaMinFormatted: '0h 00min',
  esperaMax: 0, esperaMaxFormatted: '0h 00min',
  esperaZeroCount: 0,
  duracaoRanges: [], esperaRanges: [],
  totalRegistrosAnalisados: 0,
};

export function useDataValidation(tickets: SupportTicket[]) {
  const validationReport = useMemo((): DataValidationReport => {
    if (!tickets || tickets.length === 0) {
      return {
        totalRecords: 0,
        validRecords: 0,
        issueCount: 0,
        issues: [],
        fieldStats: [],
        dateRange: { earliest: null, latest: null },
        uniqueAgents: 0,
        uniqueLeads: 0,
        uniqueDepartments: 0,
        avgDuration: 0,
        avgEspera: 0,
        npsStats: { total: 0, withNPS: 0, avgNPS: null },
        timeAnalysis: emptyTimeAnalysis,
        isValid: false
      };
    }

    const issues: ValidationIssue[] = [];
    
    // Field completeness tracking
    const fieldTracking = {
      agente: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      departamento: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      data_abertura: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      data_finalizacao: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      duracao: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      espera: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      finalizacao: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      lead_number: { filled: 0, empty: 0, invalidExamples: [] as string[] },
      nps: { filled: 0, empty: 0, invalidExamples: [] as string[] }
    };

    // Stats tracking
    const uniqueAgents = new Set<string>();
    const uniqueLeads = new Set<string>();
    const uniqueDepartments = new Set<string>();
    let totalDuration = 0;
    let totalEspera = 0;
    let totalNPS = 0;
    let npsCount = 0;
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    // Anomaly tracking
    let negativeDurations = 0;
    let negativeDurationExamples: string[] = [];
    let futuresDates = 0;
    let futureDateExamples: string[] = [];
    let invalidNPS = 0;
    let invalidNPSExamples: string[] = [];
    let longDurations = 0; // > 24h
    let longDurationExamples: string[] = [];

    const now = new Date();

    tickets.forEach((ticket, index) => {
      // Track agent
      if (ticket.agente && ticket.agente !== 'Desconhecido') {
        fieldTracking.agente.filled++;
        uniqueAgents.add(ticket.agente);
      } else {
        fieldTracking.agente.empty++;
      }

      // Track department
      if (ticket.departamento && ticket.departamento !== 'Sem departamento') {
        fieldTracking.departamento.filled++;
        uniqueDepartments.add(ticket.departamento);
      } else {
        fieldTracking.departamento.empty++;
      }

      // Track dates
      const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime()) && d.getFullYear() > 2000;
      
      if (isValidDate(ticket.data_abertura)) {
        fieldTracking.data_abertura.filled++;
        if (!earliestDate || ticket.data_abertura < earliestDate) earliestDate = ticket.data_abertura;
        if (!latestDate || ticket.data_abertura > latestDate) latestDate = ticket.data_abertura;
        
        // Check for future dates
        if (ticket.data_abertura > now) {
          futuresDates++;
          if (futureDateExamples.length < 3) {
            futureDateExamples.push(`Registro ${index + 1}: ${ticket.data_abertura.toLocaleDateString('pt-BR')}`);
          }
        }
      } else {
        fieldTracking.data_abertura.empty++;
      }

      if (isValidDate(ticket.data_finalizacao)) {
        fieldTracking.data_finalizacao.filled++;
      } else {
        fieldTracking.data_finalizacao.empty++;
      }

      // Track duration
      if (typeof ticket.duracao === 'number' && ticket.duracao >= 0) {
        fieldTracking.duracao.filled++;
        totalDuration += ticket.duracao;
        
        // Check for very long durations (>24h = 1440 min)
        if (ticket.duracao > 1440) {
          longDurations++;
          if (longDurationExamples.length < 3) {
            const hours = Math.floor(ticket.duracao / 60);
            longDurationExamples.push(`${ticket.agente}: ${hours}h`);
          }
        }
      } else if (ticket.duracao < 0) {
        negativeDurations++;
        if (negativeDurationExamples.length < 3) {
          negativeDurationExamples.push(`${ticket.agente}: ${ticket.duracao}min`);
        }
        fieldTracking.duracao.empty++;
      } else {
        fieldTracking.duracao.empty++;
      }

      // Track espera
      if (typeof ticket.espera === 'number' && ticket.espera >= 0) {
        fieldTracking.espera.filled++;
        totalEspera += ticket.espera;
      } else {
        fieldTracking.espera.empty++;
      }

      // Track finalizacao
      if (ticket.finalizacao && ticket.finalizacao.trim()) {
        fieldTracking.finalizacao.filled++;
      } else {
        fieldTracking.finalizacao.empty++;
      }

      // Track lead_number
      if (ticket.lead_number && ticket.lead_number.trim()) {
        fieldTracking.lead_number.filled++;
        uniqueLeads.add(ticket.lead_number);
      } else {
        fieldTracking.lead_number.empty++;
      }

      // Track NPS
      if (ticket.nps !== null && ticket.nps !== undefined) {
        if (ticket.nps >= 0 && ticket.nps <= 10) {
          fieldTracking.nps.filled++;
          totalNPS += ticket.nps;
          npsCount++;
        } else {
          invalidNPS++;
          if (invalidNPSExamples.length < 3) {
            invalidNPSExamples.push(`${ticket.agente}: NPS=${ticket.nps}`);
          }
          fieldTracking.nps.empty++;
        }
      } else {
        fieldTracking.nps.empty++;
      }
    });

    // Generate issues based on findings
    const total = tickets.length;

    // Check for empty critical fields
    Object.entries(fieldTracking).forEach(([field, stats]) => {
      const fillRate = (stats.filled / total) * 100;
      
      if (fillRate < 50 && field !== 'nps') {
        issues.push({
          type: 'warning',
          field,
          count: stats.empty,
          description: `Campo "${field}" está vazio em ${stats.empty.toLocaleString('pt-BR')} registros (${(100 - fillRate).toFixed(1)}%)`
        });
      }
    });

    // Add specific anomaly issues
    if (negativeDurations > 0) {
      issues.push({
        type: 'error',
        field: 'duracao',
        count: negativeDurations,
        description: `${negativeDurations} registros com duração negativa`,
        examples: negativeDurationExamples
      });
    }

    if (futuresDates > 0) {
      issues.push({
        type: 'warning',
        field: 'data_abertura',
        count: futuresDates,
        description: `${futuresDates} registros com datas futuras`,
        examples: futureDateExamples
      });
    }

    if (invalidNPS > 0) {
      issues.push({
        type: 'warning',
        field: 'nps',
        count: invalidNPS,
        description: `${invalidNPS} registros com NPS fora do intervalo 0-10`,
        examples: invalidNPSExamples
      });
    }

    if (longDurations > 0) {
      issues.push({
        type: 'info',
        field: 'duracao',
        count: longDurations,
        description: `${longDurations} atendimentos com duração superior a 24 horas`,
        examples: longDurationExamples
      });
    }

    // Calculate field stats
    const fieldStats = Object.entries(fieldTracking).map(([field, stats]) => ({
      field,
      filled: stats.filled,
      empty: stats.empty,
      fillRate: total > 0 ? Math.round((stats.filled / total) * 100) : 0
    }));

    // Calculate final stats
    const validRecords = tickets.filter(t => 
      t.agente !== 'Desconhecido' && 
      t.departamento !== 'Sem departamento' &&
      t.duracao >= 0
    ).length;

    const avgNPS = npsCount > 0 ? totalNPS / npsCount : null;

    // ===== Time Analysis (HH:MM validation) =====
    const duracaoValues = tickets.map(t => t.duracao).filter(d => typeof d === 'number' && d >= 0);
    const esperaValues = tickets.map(t => t.espera).filter(e => typeof e === 'number' && e >= 0);

    const duracaoTotal = duracaoValues.reduce((a, b) => a + b, 0);
    const esperaTotal = esperaValues.reduce((a, b) => a + b, 0);
    const duracaoAvg = duracaoValues.length > 0 ? duracaoTotal / duracaoValues.length : 0;
    const esperaAvg = esperaValues.length > 0 ? esperaTotal / esperaValues.length : 0;
    const duracaoMin = duracaoValues.length > 0 ? Math.min(...duracaoValues) : 0;
    const duracaoMax = duracaoValues.length > 0 ? Math.max(...duracaoValues) : 0;
    const esperaMin = esperaValues.length > 0 ? Math.min(...esperaValues) : 0;
    const esperaMax = esperaValues.length > 0 ? Math.max(...esperaValues) : 0;

    const duracaoRanges = buildRanges(duracaoValues, [
      { label: '0min', min: 0, max: 1 },
      { label: '1-10min', min: 1, max: 11 },
      { label: '11-30min', min: 11, max: 31 },
      { label: '31min-1h', min: 31, max: 61 },
      { label: '1h-2h', min: 61, max: 121 },
      { label: '2h-6h', min: 121, max: 361 },
      { label: '6h-24h', min: 361, max: 1441 },
      { label: '>24h', min: 1441, max: Infinity },
    ]);

    const esperaRanges = buildRanges(esperaValues, [
      { label: '0min', min: 0, max: 1 },
      { label: '1-5min', min: 1, max: 6 },
      { label: '6-10min', min: 6, max: 11 },
      { label: '11-30min', min: 11, max: 31 },
      { label: '31min-1h', min: 31, max: 61 },
      { label: '>1h', min: 61, max: Infinity },
    ]);

    const timeAnalysis: TimeAnalysisStats = {
      duracaoTotalMinutos: duracaoTotal,
      duracaoTotalFormatted: formatMinutesHHMM(duracaoTotal),
      duracaoMedia: duracaoAvg,
      duracaoMediaFormatted: formatMinutesHHMM(duracaoAvg),
      duracaoMin,
      duracaoMinFormatted: formatMinutesHHMM(duracaoMin),
      duracaoMax,
      duracaoMaxFormatted: formatMinutesHHMM(duracaoMax),
      duracaoZeroCount: duracaoValues.filter(v => v === 0).length,
      esperaTotalMinutos: esperaTotal,
      esperaTotalFormatted: formatMinutesHHMM(esperaTotal),
      esperaMedia: esperaAvg,
      esperaMediaFormatted: formatMinutesHHMM(esperaAvg),
      esperaMin,
      esperaMinFormatted: formatMinutesHHMM(esperaMin),
      esperaMax,
      esperaMaxFormatted: formatMinutesHHMM(esperaMax),
      esperaZeroCount: esperaValues.filter(v => v === 0).length,
      duracaoRanges,
      esperaRanges,
      totalRegistrosAnalisados: total,
    };

    return {
      totalRecords: total,
      validRecords,
      issueCount: issues.length,
      issues,
      fieldStats,
      dateRange: { earliest: earliestDate, latest: latestDate },
      uniqueAgents: uniqueAgents.size,
      uniqueLeads: uniqueLeads.size,
      uniqueDepartments: uniqueDepartments.size,
      avgDuration: total > 0 ? totalDuration / fieldTracking.duracao.filled : 0,
      avgEspera: total > 0 ? totalEspera / fieldTracking.espera.filled : 0,
      npsStats: {
        total,
        withNPS: npsCount,
        avgNPS
      },
      timeAnalysis,
      isValid: issues.filter(i => i.type === 'error').length === 0
    };
  }, [tickets]);

  return validationReport;
}
