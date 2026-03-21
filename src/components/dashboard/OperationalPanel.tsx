import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SupportTicket, AgentMetrics } from '@/types/support';
import { getTicketsByDate, getTicketsByFinalizacao } from '@/data/supportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, Award, Clock, Zap, Star, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OperationalPanelProps {
  tickets: SupportTicket[];
  agentMetrics: AgentMetrics[];
}

const CHART_COLORS = [
  'hsl(160, 84%, 50%)',
  'hsl(200, 90%, 55%)',
  'hsl(280, 80%, 60%)',
  'hsl(42, 95%, 55%)',
  'hsl(0, 75%, 55%)',
  'hsl(180, 70%, 50%)',
  'hsl(240, 70%, 60%)',
  'hsl(320, 70%, 55%)',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

export function OperationalPanel({ tickets, agentMetrics }: OperationalPanelProps) {
  // Consolidado geral: únicos vs duplicados POR AGENTE (agente + lead_number)
  const consolidadoGeral = useMemo(() => {
    // Agrupar por agente + lead_number normalizado
    const agentLeadFreq = new Map<string, number>();
    for (const t of tickets) {
      const leadKey = t.lead_number.replace(/[\s\-().+]/g, '').toLowerCase().trim();
      if (!leadKey) continue;
      const compositeKey = `${t.agente}|||${leadKey}`;
      agentLeadFreq.set(compositeKey, (agentLeadFreq.get(compositeKey) || 0) + 1);
    }
    // Únicos por agente = total de chaves distintas (agente+lead)
    const totalUnicos = agentLeadFreq.size;
    // Duplicados = quantas combinações agente+lead tiveram freq > 1
    const contatosDuplicados = Array.from(agentLeadFreq.values()).filter(f => f > 1).length;
    return {
      totalRegistros: tickets.length,
      totalUnicos,
      contatosDuplicados,
    };
  }, [tickets]);

  // Data for charts
  // Atendimentos por Agente — contatos únicos
  const ticketsByAgent = useMemo(() => {
    return [...agentMetrics]
      .sort((a, b) => b.leadsUnicos - a.leadsUnicos)
      .slice(0, 10)
      .map(a => ({
        name: a.agente,
        fullName: a.agente,
        contatosUnicos: a.leadsUnicos,
        duplicados: a.totalAtendimentos - a.leadsUnicos
      }));
  }, [agentMetrics]);

  const ticketsByDate = useMemo(() => getTicketsByDate(tickets), [tickets]);
  
  const ticketsByMotivo = useMemo(() => getTicketsByFinalizacao(tickets), [tickets]);

  // TMA and Volume targets for the performance matrix
  const TMA_TARGET = 30; // Meta de TMA em minutos
  // Matriz de Desempenho — contatos únicos
  const VOLUME_MEDIO = useMemo(() => {
    const totalVolume = agentMetrics.reduce((acc, a) => acc + a.leadsUnicos, 0);
    return agentMetrics.length > 0 ? Math.round(totalVolume / agentMetrics.length) : 50;
  }, [agentMetrics]);

  const tmaVolumeData = useMemo(() => {
    return agentMetrics
      .filter(a => a.tma > 0 && a.leadsUnicos > 0)
      .map(a => {
        const tma = a.tma;
        const volume = a.leadsUnicos;
        
        // Determine quadrant and color based on position
        // Baixo TMA + Alto Volume = Alta Performance
        // Alto TMA + Alto Volume = Produtivo mas Lento
        // Baixo TMA + Baixo Volume = Eficiente mas Baixo Volume
        // Alto TMA + Baixo Volume = Atenção Crítica
        let quadrant: string;
        let color: string;
        
        if (tma <= TMA_TARGET && volume >= VOLUME_MEDIO) {
          quadrant = 'Alta Performance';
          color = 'hsl(160, 84%, 50%)'; // Green
        } else if (tma > TMA_TARGET && volume >= VOLUME_MEDIO) {
          quadrant = 'Produtivo (Lento)';
          color = 'hsl(200, 90%, 55%)'; // Blue
        } else if (tma <= TMA_TARGET && volume < VOLUME_MEDIO) {
          quadrant = 'Eficiente (Baixo Vol.)';
          color = 'hsl(35, 95%, 55%)'; // Orange
        } else {
          quadrant = 'Atenção Crítica';
          color = 'hsl(0, 75%, 55%)'; // Red
        }
        
        return {
          name: a.agente,
          tma,
          volume,
          nps: a.npsMedio,
          quadrant,
          color
        };
      });
  }, [agentMetrics, VOLUME_MEDIO]);

  // Rankings
  const rankings = useMemo(() => {
    const sorted = [...agentMetrics].filter(a => a.leadsUnicos >= 2);
    
    return {
      maiorVolume: sorted.sort((a, b) => b.leadsUnicos - a.leadsUnicos).slice(0, 5),
      melhorTMA: sorted.filter(a => a.tma > 0).sort((a, b) => a.tma - b.tma).slice(0, 5),
      melhorTMR: sorted.filter(a => a.tmr > 0).sort((a, b) => a.tmr - b.tmr).slice(0, 5),
      melhorNPS: sorted.filter(a => a.npsMedio !== null).sort((a, b) => (b.npsMedio ?? 0) - (a.npsMedio ?? 0)).slice(0, 5),
      maiorRechamadas: sorted.sort((a, b) => b.taxaRechamadas - a.taxaRechamadas).slice(0, 5),
    };
  }, [agentMetrics]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl p-4">
          <p className="text-sm font-semibold text-foreground mb-1">{payload[0]?.payload?.fullName || label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground">
              {p.name}: <span className="text-primary font-mono font-semibold">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const AgentChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const unicos = data?.contatosUnicos || 0;
      const duplicados = data?.duplicados || 0;
      const total = unicos + duplicados;
      return (
        <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl p-4">
          <p className="text-sm font-bold text-foreground mb-2">{data?.fullName}</p>
          <p className="text-xs text-muted-foreground">
            Total: <span className="text-foreground font-mono font-bold">{total}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Únicos: <span className="text-primary font-mono font-semibold">{unicos}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Duplicados: <span className="text-destructive font-mono font-semibold">{duplicados}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h2 className="text-2xl font-bold font-display text-foreground">
            Análise Operacional
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-4">
          Gráficos e rankings de performance
        </p>
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atendimentos por Agente */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-mesh border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Contatos por Agente
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByAgent} layout="vertical" stackOffset="none">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(160, 84%, 50%)" />
                    <stop offset="100%" stopColor="hsl(200, 90%, 55%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 15%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'hsl(225 10% 50%)', fontSize: 11 }} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(225 10% 50%)', fontSize: 11 }} width={140} axisLine={false} />
                <Tooltip content={<AgentChartTooltip />} cursor={{ fill: 'hsl(225 15% 15% / 0.5)' }} />
                <Bar dataKey="contatosUnicos" name="Únicos" stackId="a" fill="url(#barGradient)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="duplicados" name="Duplicados" stackId="a" fill="hsl(0, 85%, 65%)" radius={[0, 8, 8, 0]} opacity={0.55} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, hsl(160, 84%, 50%), hsl(200, 90%, 55%))' }} />
              Únicos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm" style={{ background: 'hsl(0, 85%, 65%)', opacity: 0.55 }} />
              Duplicados
            </span>
          </div>
        </motion.div>

        {/* Evolução Temporal */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-mesh border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Evolução de Atendimentos
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ticketsByDate}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 15%)" vertical={false} />
                <XAxis 
                  dataKey="dateDisplay" 
                  tick={{ fill: 'hsl(225 10% 50%)', fontSize: 10 }}
                  axisLine={false}
                />
                <YAxis tick={{ fill: 'hsl(225 10% 50%)', fontSize: 10 }} axisLine={false} />
                <Tooltip 
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.dateDisplay || ''}
                  contentStyle={{
                    background: 'hsl(225 20% 6% / 0.95)', 
                    border: '1px solid hsl(225 15% 20%)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(160, 84%, 50%)" 
                  strokeWidth={2.5}
                  fill="url(#areaGradient)"
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(160, 84%, 50%)', stroke: 'hsl(225 25% 3%)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribuição por Motivo */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-mesh border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Distribuição por Motivo de Finalização
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketsByMotivo.slice(0, 8)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'hsl(225 10% 40%)' }}
                >
                  {ticketsByMotivo.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(225 20% 6% / 0.95)', 
                    border: '1px solid hsl(225 15% 20%)', 
                    borderRadius: '12px' 
                  }}
                  formatter={(value: number, name: string) => [`${value} atendimentos`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {ticketsByMotivo.slice(0, 8).map((item, i) => (
              <span key={i} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="truncate max-w-[140px]" title={item.name}>{item.name}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* TMA x Volume - 4 Quadrant Performance Matrix */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-mesh border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Matriz de Desempenho TMA x Volume
          </h3>
          <div className="h-80">
            {tmaVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ bottom: 30, left: 10, top: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 15%)" />
                  
                  {/* X Axis - TMA */}
                  <XAxis 
                    type="number"
                    dataKey="tma" 
                    name="TMA (min)" 
                    tick={{ fill: 'hsl(225 10% 50%)', fontSize: 10 }} 
                    label={{ value: 'TMA (min) →', position: 'insideBottom', offset: -20, fill: 'hsl(225 10% 50%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(225 15% 25%)' }}
                    domain={['auto', 'auto']}
                  />
                  
                  {/* Y Axis - Volume */}
                  <YAxis 
                    type="number"
                    dataKey="volume" 
                    name="Volume" 
                    tick={{ fill: 'hsl(225 10% 50%)', fontSize: 10 }}
                    label={{ value: 'Volume ↑', angle: -90, position: 'insideLeft', fill: 'hsl(225 10% 50%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(225 15% 25%)' }}
                  />
                  
                  {/* Reference Line - TMA Target (Vertical) */}
                  <ReferenceLine 
                    x={TMA_TARGET} 
                    stroke="hsl(225 10% 50%)" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ 
                      value: `Meta TMA: ${TMA_TARGET}min`, 
                      position: 'top', 
                      fill: 'hsl(225 10% 60%)', 
                      fontSize: 9 
                    }}
                  />
                  
                  {/* Reference Line - Volume Médio (Horizontal) */}
                  <ReferenceLine 
                    y={VOLUME_MEDIO} 
                    stroke="hsl(225 10% 50%)" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ 
                      value: `Média: ${VOLUME_MEDIO}`, 
                      position: 'right', 
                      fill: 'hsl(225 10% 60%)', 
                      fontSize: 9 
                    }}
                  />
                  
                  {/* Custom Tooltip */}
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: 'hsl(225 10% 40%)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl p-4">
                            <p className="text-sm font-bold text-foreground mb-2">{data.name}</p>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                TMA: <span className="text-primary font-mono font-semibold">{data.tma}min</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Volume: <span className="text-primary font-mono font-semibold">{data.volume} atendimentos</span>
                              </p>
                              {data.nps !== null && (
                                <p className="text-xs text-muted-foreground">
                                  NPS: <span className="text-primary font-mono font-semibold">{data.nps.toFixed(1)}</span>
                                </p>
                              )}
                              <p className="text-xs mt-2 px-2 py-1 rounded-lg font-medium" style={{ 
                                backgroundColor: `${data.color}20`,
                                color: data.color
                              }}>
                                {data.quadrant}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Scatter Points with quadrant-based colors */}
                  <Scatter name="Agentes" data={tmaVolumeData}>
                    {tmaVolumeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="hsl(225 25% 3%)"
                        strokeWidth={2}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem dados disponíveis
              </div>
            )}
          </div>
          
          {/* Reference Lines Info + Quadrant Legend */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  Metas: TMA ≤ <span className="font-mono text-foreground">{TMA_TARGET}min</span> | Volume ≥ <span className="font-mono text-foreground">{VOLUME_MEDIO}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(160, 84%, 50%)' }} />
                <span className="text-[10px] text-foreground">Alta Performance</span>
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(200, 90%, 55%)' }} />
                <span className="text-[10px] text-foreground">Produtivo (Lento)</span>
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(35, 95%, 55%)' }} />
                <span className="text-[10px] text-foreground">Eficiente (Baixo Vol.)</span>
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(0, 75%, 55%)' }} />
                <span className="text-[10px] text-foreground">Atenção Crítica</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rankings */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Rankings de Performance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RankingCard 
            title="Maior Volume" 
            icon={Award}
           items={rankings.maiorVolume.map((a, i) => ({ 
              rank: i + 1, 
              agente: a.agente, 
              value: `${a.leadsUnicos}` 
            }))} 
          />
          <RankingCard 
            title="Melhor TMA" 
            icon={Clock}
            items={rankings.melhorTMA.map((a, i) => ({ 
              rank: i + 1, 
              agente: a.agente, 
              value: `${a.tma}min` 
            }))} 
          />
          <RankingCard
            title="Melhor NPS" 
            icon={Star}
            items={rankings.melhorNPS.map((a, i) => ({ 
              rank: i + 1, 
              agente: a.agente, 
              value: `${a.npsMedio}` 
            }))} 
          />
          <RankingCard 
            title="Maior Rechamadas" 
            icon={RefreshCw}
            variant="warning"
            items={rankings.maiorRechamadas.map((a, i) => ({ 
              rank: i + 1, 
              agente: a.agente, 
              value: `${a.taxaRechamadas}%` 
            }))} 
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

interface RankingCardProps {
  title: string;
  icon: React.ElementType;
  items: { rank: number; agente: string; value: string }[];
  variant?: 'default' | 'warning';
}

function RankingCard({ title, icon: Icon, items, variant = 'default' }: RankingCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-mesh border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={cn(
          "p-1.5 rounded-lg",
          variant === 'warning' ? "bg-warning/15" : "bg-primary/15"
        )}>
          <Icon className={cn(
            "w-4 h-4",
            variant === 'warning' ? 'text-warning' : 'text-primary'
          )} />
        </div>
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={cn(
              "w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center flex-shrink-0 transition-all",
              i === 0 
                ? 'bg-gradient-primary text-primary-foreground shadow-lg' 
                : 'bg-muted/50 text-muted-foreground'
            )}>
              {item.rank}
            </span>
            <span className="text-xs text-foreground flex-1 min-w-0 break-words leading-tight" title={item.agente}>
              {item.agente}
            </span>
            <span className="text-xs font-mono text-primary font-semibold flex-shrink-0">{item.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
