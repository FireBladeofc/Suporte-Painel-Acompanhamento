import { useState, useMemo } from 'react';
import { DashboardFilters, SupportTicket } from '@/types/support';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface GlobalFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  tickets: SupportTicket[];
}

export function GlobalFilters({ filters, onFiltersChange, tickets }: GlobalFiltersProps) {
  // Extract unique values from tickets
  const agentes = useMemo(() => [...new Set(tickets.map(t => t.agente))].sort(), [tickets]);
  const departamentos = useMemo(() => [...new Set(tickets.map(t => t.departamento).filter(Boolean))].sort(), [tickets]);
  const motivos = useMemo(() => [...new Set(tickets.map(t => t.finalizacao).filter(Boolean))].sort(), [tickets]);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filters.periodo 
      ? { from: filters.periodo.start, to: filters.periodo.end }
      : undefined
  );

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      const endOfDay = new Date(range.to);
      endOfDay.setHours(23, 59, 59, 999);
      
      onFiltersChange({
        ...filters,
        periodo: { start: range.from, end: endOfDay }
      });
    } else if (!range) {
      onFiltersChange({
        ...filters,
        periodo: null
      });
    }
  };

  const clearFilters = () => {
    setDateRange(undefined);
    onFiltersChange({
      agente: null,
      periodo: null,
      departamento: null,
      finalizacao: null,
      avaliado: 'todos'
    });
  };

  const hasActiveFilters = filters.agente || filters.periodo || filters.departamento || filters.finalizacao || filters.avaliado !== 'todos';

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Filtros Globais</span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-7 text-xs">
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Agente Filter */}
        <Select 
          value={filters.agente || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, agente: v === 'all' ? null : v })}
        >
          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
            <SelectValue placeholder="Agente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Agentes</SelectItem>
            {agentes.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 text-xs justify-start bg-background/50 border-border/50 font-normal">
              <CalendarIcon className="mr-2 h-3 w-3" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                "Período"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateChange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Departamento Filter */}
        <Select 
          value={filters.departamento || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, departamento: v === 'all' ? null : v })}
        >
          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Departamentos</SelectItem>
            {departamentos.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Motivo Finalização Filter */}
        <Select 
          value={filters.finalizacao || 'all'} 
          onValueChange={(v) => onFiltersChange({ ...filters, finalizacao: v === 'all' ? null : v })}
        >
          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
            <SelectValue placeholder="Finalização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Finalizações</SelectItem>
            {motivos.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Avaliado Filter */}
        <Select 
          value={filters.avaliado} 
          onValueChange={(v: 'todos' | 'avaliado' | 'nao_avaliado') => onFiltersChange({ ...filters, avaliado: v })}
        >
          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
            <SelectValue placeholder="Avaliação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="avaliado">Avaliados</SelectItem>
            <SelectItem value="nao_avaliado">Não Avaliados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
