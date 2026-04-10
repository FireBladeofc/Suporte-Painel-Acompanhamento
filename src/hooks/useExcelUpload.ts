import { useState, useCallback } from 'react';
import ExcelJS from 'exceljs';
import { SupportTicket } from '@/types/support';

// Helper to parse duration from Excel - formato HH:MM ou HH:MM:SS
// Também trata frações de dia do Excel e valores numéricos diretos
function parseDuration(duration: string | number | undefined): number {
  if (!duration && duration !== 0) return 0;
  
  // Se for número, verificar se é fração de dia do Excel
  if (typeof duration === 'number') {
    // Frações de dia do Excel: valores entre 0 e 2 representam tempo (0-48h)
    if (duration >= 0 && duration < 2) {
      return Math.round(duration * 24 * 60); // Converte fração de dia → minutos
    }
    // Valores >= 2: já são minutos
    return Math.round(duration);
  }

  const durationStr = String(duration).trim();
  
  // Formato HH:MM ou HH:MM:SS (horas:minutos ou horas:minutos:segundos)
  if (durationStr.includes(':')) {
    const parts = durationStr.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    
    if (parts.length === 2) {
      // Formato HH:MM - horas e minutos apenas
      return hours * 60 + minutes;
    } else if (parts.length >= 3) {
      // Formato HH:MM:SS - inclui arredondamento de segundos
      const seconds = parseInt(parts[2]) || 0;
      return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
    }
  }
  
  // Tenta converter string numérica
  const numValue = parseFloat(durationStr);
  if (!isNaN(numValue)) {
    if (numValue >= 0 && numValue < 2) {
      return Math.round(numValue * 24 * 60);
    }
    return Math.round(numValue);
  }
  
  return 0;
}

// Calculate session duration in SECONDS from two Date objects (time-only, ignoring date component)
// Returns 0 if duration exceeds 24 hours (outlier)
function calculateSessionDuration(startDate: Date, endDate: Date): number {
  // Extract only the time components
  const startSeconds = startDate.getHours() * 3600 + startDate.getMinutes() * 60 + startDate.getSeconds();
  const endSeconds = endDate.getHours() * 3600 + endDate.getMinutes() * 60 + endDate.getSeconds();
  
  // Calculate difference (handle overnight sessions by adding 24h if end < start)
  let diffSeconds = endSeconds - startSeconds;
  if (diffSeconds < 0) {
    diffSeconds += 24 * 3600; // Add 24 hours in seconds
  }
  
  // If duration exceeds 24 hours (86400 seconds), treat as outlier and return 0
  if (diffSeconds > 86400) {
    return 0;
  }
  
  return diffSeconds;
}

// Helper to parse date from various formats
function parseDate(dateValue: string | number | Date | undefined): Date {
  if (!dateValue) return new Date();
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
  }
  
  const dateStr = String(dateValue).trim();
  
  // Try DD/MM/YYYY or DD/MM/YY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let year = parseInt(parts[2]);
    if (year < 100) {
      year += 2000; // Assume 20xx for 2-digit years
    }
    return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return new Date();
}

// Clean agent name
function cleanAgentName(name: string | undefined): string {
  if (!name) return 'Desconhecido';
  return String(name).replace(/^💬\s*/, '').trim();
}

// Clean department name
function cleanDepartment(dept: string | undefined): string {
  if (!dept) return 'Sem departamento';
  return String(dept).replace(/\\\*/g, '*').replace(/\*/g, '').trim();
}

// Parse NPS value
function parseNPS(nps: string | number | null | undefined): number | null {
  if (nps === null || nps === undefined || nps === '' || nps === ' ') return null;
  const parsed = parseFloat(String(nps));
  return isNaN(parsed) ? null : parsed;
}

// Get cell value as string
function getCellValue(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return cell.value.richText.map((rt: { text: string }) => rt.text).join('');
  }
  
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return String(cell.value.result ?? '');
  }
  
  if (typeof cell.value === 'object' && 'text' in cell.value) {
    return String(cell.value.text ?? '');
  }
  
  return String(cell.value);
}

// Get cell value preserving native type for time/duration cells.
// Usa 3 estratégias em cascata para evitar bugs de fuso horário:
//   1) cell.text → texto formatado como aparece no Excel (ex: "1:39:36") — mais confiável
//   2) number → fração de dia bruta do Excel → parseDuration converte para minutos
//   3) Date → calcula milissegundos desde meia-noite LOCAL (timezone-safe)
function getCellTimeValue(cell: ExcelJS.Cell | undefined): string | number {
  if (!cell || cell.value === null || cell.value === undefined) return 0;

  // Estratégia 1: Texto formatado da célula (mais confiável, sem timezone issues)
  // cell.text retorna exatamente o que o Excel mostra, ex: "1:39:36" ou "01:17"
  try {
    const text = cell.text;
    if (text && typeof text === 'string' && text.includes(':')) {
      return text; // parseDuration parseará como "HH:MM" ou "HH:MM:SS"
    }
  } catch {
    // cell.text pode não estar disponível em alguns cenários
  }

  // Estratégia 2: Número bruto (fração de dia do Excel)
  // Ex: 0.069167 = 1h 39m 36s → parseDuration converte com * 24 * 60
  if (typeof cell.value === 'number') {
    return cell.value;
  }

  // Estratégia 3: Date → calcular minutos desde meia-noite (timezone-safe)
  // Usa new Date(y, m, d) que cria meia-noite em horário LOCAL, 
  // eliminando qualquer desvio de fuso horário
  if (cell.value instanceof Date) {
    const d = cell.value;
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const elapsedMs = d.getTime() - midnight.getTime();
    return Math.max(0, Math.round(elapsedMs / 60000)); // retorna minutos direto
  }

  // Estratégia 4: Fórmula com resultado
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    const result = cell.value.result;
    if (typeof result === 'number') return result;
    if (result instanceof Date) {
      const d = result;
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const elapsedMs = d.getTime() - midnight.getTime();
      return Math.max(0, Math.round(elapsedMs / 60000));
    }
    // Tenta texto do resultado
    const resultStr = String(result ?? '');
    if (resultStr.includes(':')) return resultStr;
    return resultStr || '0';
  }

  return String(cell.value);
}

// Get cell value for date
function getCellDateValue(cell: ExcelJS.Cell | undefined): Date | string | number {
  if (!cell || cell.value === null || cell.value === undefined) return new Date();
  
  if (cell.value instanceof Date) {
    return cell.value;
  }
  
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    const result = cell.value.result;
    if (result instanceof Date) return result;
    return String(result ?? '');
  }
  
  return cell.value as string | number;
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export interface UploadResult {
  success: boolean;
  tickets: SupportTicket[];
  rowCount: number;
  errors: string[];
}

export interface UploadProgress {
  current: number;
  total: number;
  percent: number;
}

export function useExcelUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  // Nova função para processar via API Python (Vercel Ready)
  const processWithPython = async (file: File): Promise<UploadResult | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Tenta conexão com a API local ou produção
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api/analyze' 
        : '/api/analyze';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do motor Python');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.errors?.join(', ') || 'Erro desconhecido no Python');
      }

      // Converte o formato do Python para o que o Dashboard espera
      // Nota: O Python retorna métricas agregadas. Aqui adaptamos se necessário.
      // Para manter a retrocompatibilidade total, retornamos os tickets formatados
      // ou apenas injetamos os insights calculados pelo Python.
      
      return {
        success: true,
        tickets: data.tickets.map((t: any) => ({
          ...t,
          data_abertura: new Date(t.data_abertura),
          data_finalizacao: t.data_finalizacao ? new Date(t.data_finalizacao) : new Date(),
          // Garante que duracao_sessao exista para compatibilidade
          duracao_sessao: (t.duracao || 0) * 60 
        })),
        rowCount: data.metricas_gerais.total_registros,
        errors: [],
        pythonData: data 
      };
    } catch (err) {
      console.warn('Motor Python offline ou erro na conexão. Usando processamento local TS.', err);
      return null;
    }
  };

  // Process CSV file with batch processing
  const processCSVFile = useCallback(async (file: File): Promise<UploadResult> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, tickets: [], rowCount: 0, errors: ['Arquivo CSV vazio ou sem dados'] };
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
    
    // Create column index map
    const getColumnIndex = (...names: string[]): number => {
      for (const name of names) {
        const index = headers.indexOf(name.toLowerCase());
        if (index !== -1) return index;
      }
      return -1;
    };

    const finalizacaoCol = getColumnIndex('finalizacao', 'finalização');
    const departamentoCol = getColumnIndex('departamento');
    const dataAberturaCol = getColumnIndex('data_abertura', 'data abertura');
    const dataFinalizacaoCol = getColumnIndex('data_finalizacao', 'data finalizacao', 'data finalização');
    const duracaoCol = getColumnIndex('duracao', 'duração');
    const esperaCol = getColumnIndex('espera');
    const leadNumberCol = getColumnIndex('lead_number', 'lead number');
    const agenteCol = getColumnIndex('agente');
    const npsCol = getColumnIndex('nps');

    const tickets: SupportTicket[] = [];
    const errors: string[] = [];
    const totalRows = lines.length - 1;
    const BATCH_SIZE = 1000;
    
    // Process in batches to avoid UI freeze
    for (let batchStart = 1; batchStart < lines.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, lines.length);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        try {
          const values = parseCSVLine(line);
          
          const getValue = (col: number): string => (col >= 0 && col < values.length) ? values[col] : '';
          
          const finalizacao = getValue(finalizacaoCol);
          const departamento = getValue(departamentoCol);
          const dataAbertura = getValue(dataAberturaCol);
          const dataFinalizacao = getValue(dataFinalizacaoCol);
          const duracao = getValue(duracaoCol);
          const espera = getValue(esperaCol);
          const leadNumber = getValue(leadNumberCol);
          const agente = getValue(agenteCol);
          const npsValue = getValue(npsCol);

          // Skip empty rows
          if (!finalizacao && !departamento && !agente) {
            continue;
          }

          const parsedDataAbertura = parseDate(dataAbertura);
          const parsedDataFinalizacao = parseDate(dataFinalizacao);
          
          const ticket: SupportTicket = {
            id: `ticket-${i}-${Date.now()}`,
            finalizacao: finalizacao.trim(),
            departamento: cleanDepartment(departamento),
            data_abertura: parsedDataAbertura,
            data_finalizacao: parsedDataFinalizacao,
            duracao: parseDuration(duracao),
            duracao_sessao: calculateSessionDuration(parsedDataAbertura, parsedDataFinalizacao),
            espera: parseDuration(espera),
            lead_number: leadNumber.trim(),
            agente: cleanAgentName(agente),
            nps: parseNPS(npsValue)
          };

          tickets.push(ticket);
        } catch (rowError) {
          errors.push(`Linha ${i + 1}: ${rowError}`);
        }
      }

      // Update progress and yield to UI thread
      const processed = Math.min(batchEnd - 1, totalRows);
      setProgress({
        current: processed,
        total: totalRows,
        percent: Math.round((processed / totalRows) * 100)
      });
      
      // Yield to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return { success: true, tickets, rowCount: tickets.length, errors };
  }, []);

  // Process Excel file
  const processExcelFile = useCallback(async (file: File): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      // 1. Tentar processar via Motor Python primeiro (Garantia de Margem de Erro)
      const pythonResult = await processWithPython(file);
      if (pythonResult) {
        setIsLoading(false);
        return pythonResult;
      }

      // 2. Se o Python falhar/estiver offline, fallback para o processamento original
      // Check if it's a CSV file
      const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
      
      if (isCSV) {
        const result = await processCSVFile(file);
        setIsLoading(false);
        setProgress(null);
        return result;
      }

      // Process as Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      
      if (!worksheet) {
        throw new Error('Nenhuma planilha encontrada no arquivo');
      }

      const tickets: SupportTicket[] = [];
      const errors: string[] = [];
      
      // Get header row to map column indices
      const headerRow = worksheet.getRow(1);
      const columnMap: Record<string, number> = {};
      
      headerRow.eachCell((cell, colNumber) => {
        const headerName = getCellValue(cell).toLowerCase().trim();
        columnMap[headerName] = colNumber;
      });

      const getColumnIndex = (...names: string[]): number => {
        for (const name of names) {
          if (columnMap[name.toLowerCase()]) {
            return columnMap[name.toLowerCase()];
          }
        }
        return -1;
      };

      const finalizacaoCol = getColumnIndex('finalizacao', 'finalização');
      const departamentoCol = getColumnIndex('departamento');
      const dataAberturaCol = getColumnIndex('data_abertura', 'data abertura');
      const dataFinalizacaoCol = getColumnIndex('data_finalizacao', 'data finalizacao', 'data finalização');
      const duracaoCol = getColumnIndex('duracao', 'duração');
      const esperaCol = getColumnIndex('espera');
      const leadNumberCol = getColumnIndex('lead_number', 'lead number');
      const agenteCol = getColumnIndex('agente');
      const npsCol = getColumnIndex('nps');

      const totalRows = worksheet.rowCount - 1;
      let processedRows = 0;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        try {
          const finalizacao = finalizacaoCol > 0 ? getCellValue(row.getCell(finalizacaoCol)) : '';
          const departamento = departamentoCol > 0 ? getCellValue(row.getCell(departamentoCol)) : '';
          const dataAbertura = dataAberturaCol > 0 ? getCellDateValue(row.getCell(dataAberturaCol)) : '';
          const dataFinalizacao = dataFinalizacaoCol > 0 ? getCellDateValue(row.getCell(dataFinalizacaoCol)) : '';
          const duracao = duracaoCol > 0 ? getCellTimeValue(row.getCell(duracaoCol)) : 0;
          const espera = esperaCol > 0 ? getCellTimeValue(row.getCell(esperaCol)) : 0;

          const leadNumber = leadNumberCol > 0 ? getCellValue(row.getCell(leadNumberCol)) : '';
          const agente = agenteCol > 0 ? getCellValue(row.getCell(agenteCol)) : '';
          const npsValue = npsCol > 0 ? getCellValue(row.getCell(npsCol)) : null;

          if (!finalizacao && !departamento && !agente) {
            return;
          }

          const parsedDataAbertura = parseDate(dataAbertura);
          const parsedDataFinalizacao = parseDate(dataFinalizacao);
          
          const ticket: SupportTicket = {
            id: `ticket-${rowNumber}-${Date.now()}`,
            finalizacao: String(finalizacao).trim(),
            departamento: cleanDepartment(String(departamento)),
            data_abertura: parsedDataAbertura,
            data_finalizacao: parsedDataFinalizacao,
            duracao: parseDuration(duracao),
            duracao_sessao: calculateSessionDuration(parsedDataAbertura, parsedDataFinalizacao),
            espera: parseDuration(espera),
            lead_number: String(leadNumber).trim(),
            agente: cleanAgentName(String(agente)),
            nps: parseNPS(npsValue)
          };

          tickets.push(ticket);
          processedRows++;
          
          // Update progress every 1000 rows
          if (processedRows % 1000 === 0) {
            setProgress({
              current: processedRows,
              total: totalRows,
              percent: Math.round((processedRows / totalRows) * 100)
            });
          }
        } catch (rowError) {
          errors.push(`Linha ${rowNumber}: ${rowError}`);
        }
      });

      setIsLoading(false);
      setProgress(null);
      return { success: true, tickets, rowCount: tickets.length, errors };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      setError(errorMessage);
      setIsLoading(false);
      setProgress(null);
      return { success: false, tickets: [], rowCount: 0, errors: [errorMessage] };
    }
  }, [processCSVFile]);

  return {
    processExcelFile,
    isLoading,
    error,
    progress
  };
}
