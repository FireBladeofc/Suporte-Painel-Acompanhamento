import { DataValidationReport } from '@/hooks/useDataValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info,
  Database,
  Users,
  Building2,
  Calendar,
  Clock,
  Star,
  Timer,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DataValidationPanelProps {
  report: DataValidationReport;
}

export function DataValidationPanel({ report }: DataValidationPanelProps) {
  if (report.totalRecords === 0) return null;

  const getStatusIcon = () => {
    if (report.issues.filter(i => i.type === 'error').length > 0) {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    if (report.issues.filter(i => i.type === 'warning').length > 0) {
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
    return <CheckCircle2 className="w-5 h-5 text-primary" />;
  };

  const getStatusText = () => {
    const errorCount = report.issues.filter(i => i.type === 'error').length;
    const warningCount = report.issues.filter(i => i.type === 'warning').length;
    
    if (errorCount > 0) return `${errorCount} erro(s) encontrado(s)`;
    if (warningCount > 0) return `${warningCount} aviso(s)`;
    return 'Dados validados';
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-primary/30 hover:bg-primary/10"
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Relatório de Validação de Dados
          </DialogTitle>
          <DialogDescription>
            Resumo da integridade dos dados importados
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <Database className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{report.totalRecords.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">Total de Registros</p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{report.uniqueAgents}</p>
                  <p className="text-xs text-muted-foreground">Agentes</p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{report.uniqueDepartments}</p>
                  <p className="text-xs text-muted-foreground">Departamentos</p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">
                    {report.npsStats.avgNPS !== null ? report.npsStats.avgNPS.toFixed(1) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">NPS Médio</p>
                </CardContent>
              </Card>
            </div>

            {/* Date Range */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Período dos Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">De:</span>
                  <span className="font-medium">{formatDate(report.dateRange.earliest)}</span>
                  <span className="text-muted-foreground">Até:</span>
                  <span className="font-medium">{formatDate(report.dateRange.latest)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Time Averages */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Médias de Tempo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Duração Média (TMA)</p>
                    <p className="font-medium">{formatDuration(report.avgDuration)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Espera Média (TME)</p>
                    <p className="font-medium">{formatDuration(report.avgEspera)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ===== ANÁLISE DE TEMPOS HH:MM ===== */}
            {report.timeAnalysis.totalRegistrosAnalisados > 0 && (
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Timer className="w-4 h-4 text-primary" />
                    Análise de Tempos (HH:MM) — Conferência
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {/* Duração summary */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Coluna: Duração</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Soma Total</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.duracaoTotalFormatted}</p>
                        <p className="text-[10px] text-muted-foreground">{report.timeAnalysis.duracaoTotalMinutos.toLocaleString('pt-BR')} min</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Média</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.duracaoMediaFormatted}</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Mínimo</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.duracaoMinFormatted}</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Máximo</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.duracaoMaxFormatted}</p>
                      </div>
                    </div>
                    {report.timeAnalysis.duracaoZeroCount > 0 && (
                      <p className="text-xs text-warning mt-1">
                        ⚠ {report.timeAnalysis.duracaoZeroCount} registros com duração = 0
                      </p>
                    )}
                  </div>

                  {/* Espera summary */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Coluna: Espera</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Soma Total</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.esperaTotalFormatted}</p>
                        <p className="text-[10px] text-muted-foreground">{report.timeAnalysis.esperaTotalMinutos.toLocaleString('pt-BR')} min</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Média</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.esperaMediaFormatted}</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Mínimo</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.esperaMinFormatted}</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Máximo</p>
                        <p className="font-bold text-sm">{report.timeAnalysis.esperaMaxFormatted}</p>
                      </div>
                    </div>
                    {report.timeAnalysis.esperaZeroCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ℹ {report.timeAnalysis.esperaZeroCount} registros com espera = 0
                      </p>
                    )}
                  </div>

                  {/* Distribution ranges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Distribuição Duração
                      </p>
                      <div className="space-y-1">
                        {report.timeAnalysis.duracaoRanges.filter(r => r.count > 0).map(r => (
                          <div key={r.label} className="flex items-center gap-2 text-xs">
                            <span className="w-16 text-muted-foreground">{r.label}</span>
                            <Progress value={r.percent} className="h-1.5 flex-1" />
                            <span className="w-16 text-right">{r.count.toLocaleString('pt-BR')} ({r.percent}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Distribuição Espera
                      </p>
                      <div className="space-y-1">
                        {report.timeAnalysis.esperaRanges.filter(r => r.count > 0).map(r => (
                          <div key={r.label} className="flex items-center gap-2 text-xs">
                            <span className="w-16 text-muted-foreground">{r.label}</span>
                            <Progress value={r.percent} className="h-1.5 flex-1" />
                            <span className="w-16 text-right">{r.count.toLocaleString('pt-BR')} ({r.percent}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                    <p>💡 <strong>Conferência Python:</strong> Compare a soma total em minutos com <code>df['duracao'].apply(parse_hhmm).sum()</code> e <code>df['espera'].apply(parse_hhmm).sum()</code></p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Field Completeness */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preenchimento por Campo</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {report.fieldStats.map(stat => (
                  <div key={stat.field} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize">{stat.field.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">
                        {stat.filled.toLocaleString('pt-BR')} / {report.totalRecords.toLocaleString('pt-BR')} ({stat.fillRate}%)
                      </span>
                    </div>
                    <Progress 
                      value={stat.fillRate} 
                      className="h-1.5"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Issues */}
            {report.issues.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Alertas ({report.issues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {report.issues.map((issue, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border ${
                        issue.type === 'error' 
                          ? 'bg-destructive/10 border-destructive/20' 
                          : issue.type === 'warning'
                          ? 'bg-warning/10 border-warning/20'
                          : 'bg-muted/50 border-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {issue.type === 'error' ? (
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        ) : issue.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{issue.description}</p>
                          {issue.examples && issue.examples.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {issue.examples.map((ex, i) => (
                                <span key={i} className="block">• {ex}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {issue.field}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* NPS Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Avaliações NPS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {report.npsStats.withNPS.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">Com NPS</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-muted-foreground">
                      {(report.npsStats.total - report.npsStats.withNPS).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">Sem NPS</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {report.npsStats.total > 0 
                        ? Math.round((report.npsStats.withNPS / report.npsStats.total) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Taxa Avaliação</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Status */}
            <div className={`p-4 rounded-lg ${
              report.isValid 
                ? 'bg-primary/10 border border-primary/20' 
                : 'bg-warning/10 border border-warning/20'
            }`}>
              <div className="flex items-center gap-3">
                {report.isValid ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-warning" />
                )}
                <div>
                  <p className="font-medium">
                    {report.isValid 
                      ? 'Dados Validados com Sucesso' 
                      : 'Dados Importados com Avisos'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {report.validRecords.toLocaleString('pt-BR')} de {report.totalRecords.toLocaleString('pt-BR')} registros completos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
