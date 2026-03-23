import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardFilters, SupportTicket } from '@/types/support';
import { calculateAgentMetrics } from '@/data/supportData';
import { GlobalFilters } from './GlobalFilters';
import { ExecutivePanel } from './ExecutivePanel';
import { OperationalPanel } from './OperationalPanel';
import { AgentPerformancePanel } from './AgentPerformancePanel';
import { InsightsPanel } from './InsightsPanel';
import { ExcelUploader } from './ExcelUploader';
import { DataValidationPanel } from './DataValidationPanel';
import { AdvancedAnalysisPanel } from './AdvancedAnalysisPanel';
import { FeedbackPanel } from '@/components/feedback/FeedbackPanel';
import { useDataValidation } from '@/hooks/useDataValidation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Lightbulb,
  Headphones,
  FileSpreadsheet,
  Activity,
  FlaskConical,
  MessageSquareText
} from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export function Dashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  const [filters, setFilters] = useState<DashboardFilters>({
    agente: null,
    periodo: null,
    departamento: null,
    finalizacao: null,
    avaliado: 'todos'
  });

  const [activeTab, setActiveTab] = useState('executive');

  // Handle Excel data import
  const handleDataLoaded = useCallback((newTickets: SupportTicket[]) => {
    setTickets(newTickets);
    // Reset filters when new data is loaded
    setFilters({
      agente: null,
      periodo: null,
      departamento: null,
      finalizacao: null,
      avaliado: 'todos'
    });
  }, []);

  // Apply filters to tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Filter by agente
      if (filters.agente && ticket.agente !== filters.agente) return false;
      
      // Filter by periodo
      if (filters.periodo) {
        const ticketDate = startOfDay(ticket.data_abertura);
        const filterStart = startOfDay(filters.periodo.start);
        const filterEnd = startOfDay(filters.periodo.end);
        
        if (ticketDate < filterStart || ticketDate > filterEnd) return false;
      }
      
      // Filter by departamento
      if (filters.departamento && ticket.departamento !== filters.departamento) return false;
      
      // Filter by finalizacao
      if (filters.finalizacao && ticket.finalizacao !== filters.finalizacao) return false;
      
      // Filter by avaliado
      if (filters.avaliado === 'avaliado' && ticket.nps === null) return false;
      if (filters.avaliado === 'nao_avaliado' && ticket.nps !== null) return false;
      
      return true;
    });
  }, [tickets, filters]);

  // Calculate agent metrics from filtered tickets
  const agentMetrics = useMemo(() => {
    return calculateAgentMetrics(filteredTickets);
  }, [filteredTickets]);

  // Calculate unfiltered agent metrics for Feedback tab (always show all data per collaborator)
  const allAgentMetrics = useMemo(() => {
    return calculateAgentMetrics(tickets);
  }, [tickets]);

  // Validate data integrity
  const validationReport = useDataValidation(tickets);

  return (
    <div className="min-h-screen bg-background noise-overlay">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30">
        <div className="absolute inset-0 bg-background/70 backdrop-blur-xl" />
        <div className="relative container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <div className="relative p-3 rounded-2xl bg-gradient-primary shadow-lg">
                  <FileSpreadsheet className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            Dashboard Suporte ChatPro
                  {tickets.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-normal text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <Activity className="w-3 h-3 pulse-live" />
                      Live
                    </span>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Análise operacional e insights gerenciais
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <ExcelUploader onDataLoaded={handleDataLoaded} />
              {tickets.length > 0 && (
                <DataValidationPanel report={validationReport} />
              )}
              
              {tickets.length > 0 && (
                <div className="hidden md:flex items-center gap-4 pl-4 border-l border-border/50">
                  <div className="text-right">
                    <p className="text-lg font-bold font-display text-gradient">
                      {filteredTickets.length.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      atendimentos
                    </p>
                  </div>
                  <div className="w-px h-8 bg-border/50" />
                  <div className="text-right">
                    <p className="text-lg font-bold font-display text-foreground">
                      {agentMetrics.length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      agentes
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Show only import prompt when no data is loaded */}
        {tickets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative p-6 rounded-3xl bg-gradient-mesh border border-border/50 card-glow">
                <FileSpreadsheet className="w-16 h-16 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold font-display text-foreground mb-3">
              Bem-vindo ao Dashboard
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
              Importe um arquivo Excel com os dados de atendimento para visualizar o dashboard completo com KPIs, gráficos e insights.
            </p>
            <ExcelUploader onDataLoaded={handleDataLoaded} />
          </motion.div>
        ) : (
          /* Dashboard Tabs - Only visible when data is loaded */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="w-full md:w-auto bg-card/50 backdrop-blur-sm p-1.5 rounded-2xl border border-border/50 gap-1 flex-wrap">
              <TabsTrigger 
                value="executive" 
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 rounded-xl px-4 py-2.5 transition-all duration-300"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Visão Executiva</span>
                <span className="sm:hidden font-medium">Executivo</span>
              </TabsTrigger>
              <TabsTrigger 
                value="operational"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 rounded-xl px-4 py-2.5 transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Análise Operacional</span>
                <span className="sm:hidden font-medium">Operacional</span>
              </TabsTrigger>
              <TabsTrigger 
                value="agents"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 rounded-xl px-4 py-2.5 transition-all duration-300"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Performance</span>
                <span className="sm:hidden font-medium">Agentes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="insights"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 rounded-xl px-4 py-2.5 transition-all duration-300"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">Insights</span>
              </TabsTrigger>
              <TabsTrigger 
                value="advanced"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 rounded-xl px-4 py-2.5 transition-all duration-300"
              >
                <FlaskConical className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Análise Avançada</span>
                <span className="sm:hidden font-medium">Avançada</span>
              </TabsTrigger>
              <TabsTrigger 
                value="feedback"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg gap-2 rounded-xl px-4 py-2.5 transition-all duration-300"
              >
                <MessageSquareText className="w-4 h-4" />
                <span className="font-medium">Feedback</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tabs Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {activeTab !== 'feedback' && (
                  <GlobalFilters 
                    filters={filters} 
                    onFiltersChange={setFilters} 
                    tickets={tickets}
                  />
                )}

                <TabsContent value="executive" className="mt-8">
                  <ExecutivePanel tickets={filteredTickets} agentMetrics={agentMetrics} />
                </TabsContent>

                <TabsContent value="operational" className="mt-8">
                  <OperationalPanel tickets={filteredTickets} agentMetrics={agentMetrics} />
                </TabsContent>

                <TabsContent value="agents" className="mt-8">
                  <AgentPerformancePanel agentMetrics={agentMetrics} />
                </TabsContent>

                <TabsContent value="insights" className="mt-8">
                  <InsightsPanel tickets={filteredTickets} agentMetrics={agentMetrics} />
                </TabsContent>

                <TabsContent value="advanced" className="mt-8">
                  <AdvancedAnalysisPanel tickets={filteredTickets} agentMetrics={agentMetrics} />
                </TabsContent>

                <TabsContent value="feedback" className="mt-0">
                  <FeedbackPanel tickets={tickets} agentMetrics={allAgentMetrics} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Dashboard de Suporte Técnico • Dados carregados via Excel
          </p>
        </div>
      </footer>
    </div>
  );
}
