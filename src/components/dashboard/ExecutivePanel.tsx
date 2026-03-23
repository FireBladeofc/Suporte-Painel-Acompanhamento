import { SupportTicket, AgentMetrics } from '@/types/support';
import { KPICard } from './KPICard';
import { useUniqueContacts } from '@/hooks/useUniqueContacts';
import { motion } from 'framer-motion';
import {
  Headphones,
  Hourglass,
  Star,
  ThumbsUp,
  AlertCircle,
  RefreshCw,
  Users,
  Timer
} from 'lucide-react';

interface ExecutivePanelProps {
  tickets: SupportTicket[];
  agentMetrics: AgentMetrics[];
}

export function ExecutivePanel({ tickets, agentMetrics }: ExecutivePanelProps) {
  const uniqueMetrics = useUniqueContacts(tickets);
  const { baseConsolidada } = uniqueMetrics;

  const totalRegistros = tickets.length;

  // TME - Tempo Médio de Espera (minutos) — coluna "espera", sobre tickets brutos (alinhado com Python)
  const tme = tickets.length > 0
    ? Math.round(tickets.reduce((acc, t) => acc + t.espera, 0) / tickets.length)
    : 0;

  // NPS Médio — sobre tickets brutos (alinhado com Python)
  const npsValues = tickets.map(t => t.nps).filter((n): n is number => n !== null);
  const npsMedio = npsValues.length > 0
    ? (npsValues.reduce((a, b) => a + b, 0) / npsValues.length).toFixed(1)
    : '-';

  // Taxa de Avaliação — sobre tickets brutos (alinhado com Python)
  const avaliacoesRecebidas = npsValues.length;
  const avaliacoesPendentes = totalRegistros - avaliacoesRecebidas;
  const taxaAvaliacao = totalRegistros > 0
    ? Math.round((avaliacoesRecebidas / totalRegistros) * 100)
    : 0;

  // Taxa de Rechamadas (registros brutos vs contatos únicos)
  const rechamadas = totalRegistros - uniqueMetrics.totalContatosUnicos;
  const taxaRechamadas = totalRegistros > 0
    ? Math.round((rechamadas / totalRegistros) * 100)
    : 0;



  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  // Format MM:SS
  const formatSessionDuration = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    const totalMinutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${String(totalMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

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
            Visão Executiva
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-4">
          Indicadores consolidados por contato único — {uniqueMetrics.totalDuplicidadesRemovidas.toLocaleString('pt-BR')} duplicidades removidas de {totalRegistros.toLocaleString('pt-BR')} registros
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total de Contatos"
          value={uniqueMetrics.totalContatosUnicos.toLocaleString('pt-BR')}
          subtitle="contatos únicos"
          icon={Users}
          variant="primary"
          delay={0}
        />

        <KPICard
          title="TMA"
          value={(() => {
            const validTickets = tickets.filter(t => t.duracao > 0);
            if (validTickets.length === 0) return '0min';
            const avgMinutes = validTickets.reduce((acc, t) => acc + t.duracao, 0) / validTickets.length;
            return formatDuration(Math.round(avgMinutes));
          })()}
          subtitle="Tempo médio de atendimento"
          icon={Timer}
          variant="primary"
          delay={1}
        />

        <KPICard
          title="TME"
          value={formatDuration(tme)}
          subtitle="Tempo Médio de Espera"
          icon={Hourglass}
          variant={tme > 60 ? 'warning' : 'default'}
          delay={3}
        />

        <KPICard
          title="NPS Médio"
          value={npsMedio}
          icon={Star}
          variant={typeof npsMedio === 'string' && parseFloat(npsMedio) >= 4.5 ? 'success' : 'default'}
          delay={4}
        />

        <KPICard
          title="Taxa de Rechamadas"
          value={`${taxaRechamadas}%`}
          subtitle={`${rechamadas.toLocaleString('pt-BR')} rechamadas`}
          icon={RefreshCw}
          variant={taxaRechamadas > 20 ? 'warning' : 'default'}
          delay={5}
        />

        <KPICard
          title="Taxa de Avaliação"
          value={`${taxaAvaliacao}%`}
          subtitle={`${avaliacoesRecebidas} respostas`}
          icon={ThumbsUp}
          variant={taxaAvaliacao < 30 ? 'warning' : 'default'}
          delay={6}
        />

        <KPICard
          title="Avaliações Pendentes"
          value={avaliacoesPendentes.toLocaleString('pt-BR')}
          icon={AlertCircle}
          variant={avaliacoesPendentes > totalRegistros * 0.7 ? 'warning' : 'default'}
          delay={7}
        />



        <KPICard
          title="Total de Registros"
          value={totalRegistros.toLocaleString('pt-BR')}
          subtitle="Total de Atendimentos"
          icon={FileSpreadsheet}
          delay={9}
        />
      </div>
    </motion.div>
  );
}
