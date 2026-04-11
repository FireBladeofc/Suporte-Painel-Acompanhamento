import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AgentMetrics } from '@/types/support';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ChevronUp, ChevronDown, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AgentPerformancePanelProps {
  agentMetrics: AgentMetrics[];
}

type SortField = 'agente' | 'totalAtendimentos' | 'leadsUnicos' | 'taxaRechamadas' | 'tma' | 'tme' | 'tmr' | 'npsMedio' | 'avaliacoesRecebidas' | 'avaliacoesPendentes' | 'taxaAvaliacao';
type SortDirection = 'asc' | 'desc';

export function AgentPerformancePanel({ agentMetrics }: AgentPerformancePanelProps) {
  const [sortField, setSortField] = useState<SortField>('totalAtendimentos');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedMetrics = useMemo(() => {
    let filtered = agentMetrics;
    
    if (searchQuery) {
      filtered = agentMetrics.filter(a => 
        a.agente.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle null values for NPS
      if (aVal === null) aVal = -1;
      if (bVal === null) bVal = -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [agentMetrics, sortField, sortDirection, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold text-muted-foreground hover:text-foreground hover:bg-transparent text-xs"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="ml-1 h-3 w-3 text-primary" />
        ) : (
          <ChevronDown className="ml-1 h-3 w-3 text-primary" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
      )}
    </Button>
  );

  // Calculate averages for comparison (using unique contacts)
  const avgTMA = Math.round(agentMetrics.reduce((acc, a) => acc + a.tma, 0) / agentMetrics.length) || 0;
  const avgTME = Math.round(agentMetrics.reduce((acc, a) => acc + a.tme, 0) / agentMetrics.length) || 0;
  const avgTMR = Math.round(agentMetrics.reduce((acc, a) => acc + a.tmr, 0) / agentMetrics.length) || 0;
  const npsValues = agentMetrics.filter(a => a.npsMedio !== null).map(a => a.npsMedio!);
  const avgNPS = npsValues.length > 0 ? npsValues.reduce((a, b) => a + b, 0) / npsValues.length : 0;
  const avgTaxaRechamadas = Math.round(agentMetrics.reduce((acc, a) => acc + a.taxaRechamadas, 0) / agentMetrics.length) || 0;
  const avgLeadsUnicos = Math.round(agentMetrics.reduce((acc, a) => acc + a.leadsUnicos, 0) / agentMetrics.length) || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h2 className="text-2xl font-bold font-display text-foreground">
            Performance de Agentes
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-4">
          Métricas individuais com ordenação dinâmica
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border/50 rounded-xl focus:border-primary/50"
          />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-mesh border border-border/50 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent bg-muted/30">
                <TableHead className="min-w-[250px] py-4">
                  <SortHeader field="agente">Agente</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="leadsUnicos">Contatos Únicos</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="totalAtendimentos">Total Registros</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  Duplicados
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="taxaRechamadas">Rechamadas</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="tma">Tempo Médio Atend.</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="tme">Tempo Médio Espera</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="tmr">Tempo Médio Resol.</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="npsMedio">NPS Médio</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="avaliacoesRecebidas">Avaliações</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="avaliacoesPendentes">Pendentes</SortHeader>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap py-4">
                  <SortHeader field="taxaAvaliacao">Taxa Avaliação</SortHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedMetrics.map((agent, index) => (
                <motion.tr
                  key={agent.agente}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "border-border/20 transition-all duration-200 hover:bg-primary/5",
                    index % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                  )}
                >
                  <TableCell className="font-medium py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/30">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium" title={agent.agente}>
                        {agent.agente}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm font-semibold">
                    {agent.leadsUnicos}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">
                    {agent.totalAtendimentos}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono text-sm px-2.5 py-1 rounded-lg font-medium",
                      (agent.totalAtendimentos - agent.leadsUnicos) > (agent.totalAtendimentos * 0.15) || (agent.totalAtendimentos - agent.leadsUnicos) > 20
                        ? "bg-destructive/15 text-destructive"
                        : (agent.totalAtendimentos - agent.leadsUnicos) > 5
                          ? "bg-warning/15 text-warning"
                          : "text-muted-foreground"
                    )}>
                      {agent.totalAtendimentos - agent.leadsUnicos}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono text-sm px-2.5 py-1 rounded-lg font-medium",
                      agent.taxaRechamadas > 25 
                        ? "bg-destructive/15 text-destructive" 
                        : agent.taxaRechamadas > 15
                          ? "bg-warning/15 text-warning"
                          : agent.taxaRechamadas < 10
                            ? "bg-success/15 text-success"
                            : "text-muted-foreground"
                    )}>
                      {agent.taxaRechamadas}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono text-sm px-2.5 py-1 rounded-lg font-medium",
                      agent.tma < avgTMA * 0.7 
                        ? "bg-success/15 text-success" 
                        : agent.tma > avgTMA * 1.3
                          ? "bg-warning/15 text-warning"
                          : "text-muted-foreground"
                    )}>
                      {agent.tma}min
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono text-sm px-2.5 py-1 rounded-lg font-medium",
                      agent.tme >= 60 
                        ? "bg-destructive/15 text-destructive" 
                        : agent.tme >= 30
                          ? "bg-warning/15 text-warning"
                          : agent.tme <= 10
                            ? "bg-success/15 text-success"
                            : "text-muted-foreground"
                    )}>
                      {agent.tme}min
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono text-sm px-2.5 py-1 rounded-lg font-medium",
                      agent.tmr > avgTMR * 1.8 
                        ? "bg-destructive/15 text-destructive" 
                        : agent.tmr > avgTMR * 1.3
                          ? "bg-warning/15 text-warning"
                          : agent.tmr < avgTMR * 0.7
                            ? "bg-success/15 text-success"
                            : "text-muted-foreground"
                    )}>
                      {agent.tmr}h
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {agent.npsMedio !== null ? (
                      <span className={cn(
                        "font-mono text-sm px-2.5 py-1 rounded-lg font-medium",
                        // Escala 0–5: >= 4.5 = ótimo | 4.0-4.49 = atenção | < 4 = detrator
                        agent.npsMedio >= 4.5 
                          ? "bg-success/15 text-success" 
                          : agent.npsMedio >= 4.0
                            ? "bg-warning/15 text-warning"
                            : "bg-destructive/15 text-destructive"
                      )}>
                        {agent.npsMedio}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {agent.avaliacoesRecebidas}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono text-sm",
                      agent.avaliacoesPendentes > agent.avaliacoesRecebidas && "text-muted-foreground/60"
                    )}>
                      {agent.avaliacoesPendentes}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono text-sm px-2.5 py-1 rounded-lg font-medium",
                      agent.taxaAvaliacao >= 50 
                        ? "bg-success/15 text-success" 
                        : agent.taxaAvaliacao < 20
                          ? "bg-warning/15 text-warning"
                          : "text-muted-foreground"
                    )}>
                      {agent.taxaAvaliacao}%
                    </span>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-success/20 border border-success/40" />
          <span>Excelente Performance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-warning/20 border border-warning/40" />
          <span>Atenção / Alerta</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-destructive/20 border border-destructive/40" />
          <span>Crítico / Imediato</span>
        </div>
      </div>
    </motion.div>
  );
}
