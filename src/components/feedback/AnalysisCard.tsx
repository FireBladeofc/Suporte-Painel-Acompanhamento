import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedbackAnalysis } from '@/types/feedback';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ChevronDown,
  Calendar,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Loader2,
  ArrowRightLeft,
  Key,
  Bot,
  Zap,
  SmilePlus,
  Quote,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AnalysisCardProps {
  analysis: FeedbackAnalysis;
  onDelete?: (analysisId: string) => void;
  deleting?: boolean;
}

export function AnalysisCard({ analysis, onDelete, deleting }: AnalysisCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getEngagementEmoji = () => {
    switch (analysis.engagement_level) {
      case 'positive': return '😀';
      case 'neutral': return '😐';
      case 'negative': return '😠';
      default: return '❓';
    }
  };

  const getEngagementColor = () => {
    switch (analysis.engagement_level) {
      case 'positive': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'neutral': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'negative': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getResolutionIcon = () => {
    const status = analysis.resolution_status?.toLowerCase();
    if (status?.includes('resolvido') && !status?.includes('não')) {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    }
    if (status?.includes('não') || status?.includes('nao')) {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{getEngagementEmoji()}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      Semana de {format(new Date(analysis.week_start), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Analisado em {format(new Date(analysis.analysis_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Quick indicator badges */}
                {analysis.robotic_communication && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                    <Bot className="w-3 h-3" />
                    Robótico
                  </Badge>
                )}
                {analysis.instance_code_requested === false && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
                    <Key className="w-3 h-3" />
                    Sem código
                  </Badge>
                )}
                {analysis.transfer_detected && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
                    <ArrowRightLeft className="w-3 h-3" />
                    Transferido
                  </Badge>
                )}

                <Badge className={cn("gap-1", getEngagementColor())}>
                  {getEngagementEmoji()} {analysis.engagement_level === 'positive' ? 'Positivo' : 
                   analysis.engagement_level === 'neutral' ? 'Neutro' : 'Negativo'}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getResolutionIcon()}
                  <span className="hidden sm:inline">{analysis.resolution_status}</span>
                </div>

                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir análise?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A análise e todos os arquivos anexados serão permanentemente removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => onDelete(analysis.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-bold text-foreground">{analysis.complaints_count}</p>
                  <p className="text-xs text-muted-foreground">Reclamações</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-lg font-bold text-foreground">{analysis.questions_count}</p>
                  <p className="text-xs text-muted-foreground">Dúvidas</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tom do Atendente</p>
                <Badge variant="outline" className="text-primary border-primary/30">
                  {analysis.tone_attendant}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tom do Cliente</p>
                <Badge variant="outline">
                  {analysis.tone_client}
                </Badge>
              </div>
            </div>

            {/* New: Sentiment Journey */}
            {(analysis.client_sentiment_start || analysis.client_sentiment_end) && (
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <SmilePlus className="w-4 h-4 text-primary" />
                  Jornada de Sentimento do Cliente
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Início</p>
                    <Badge variant="outline">{analysis.client_sentiment_start || '-'}</Badge>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div className="flex-1 p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Final</p>
                    <Badge variant="outline">{analysis.client_sentiment_end || '-'}</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* New: Efficiency Conclusion */}
            {analysis.efficiency_conclusion && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Conclusão de Eficiência
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.efficiency_conclusion}
                </p>
              </div>
            )}

            {/* New: Critical Indicators Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instance Code */}
              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                analysis.instance_code_requested
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              )}>
                <Key className={cn("w-5 h-5 flex-shrink-0", 
                  analysis.instance_code_requested ? "text-green-400" : "text-red-400"
                )} />
                <div>
                  <p className="text-sm font-medium text-foreground">Código de Instância</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.instance_code_requested 
                      ? '✅ Solicitado corretamente' 
                      : '❌ NÃO solicitado (obrigatório)'}
                  </p>
                </div>
              </div>

              {/* Transfer */}
              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                analysis.transfer_detected
                  ? "bg-yellow-500/5 border-yellow-500/20"
                  : "bg-green-500/5 border-green-500/20"
              )}>
                <ArrowRightLeft className={cn("w-5 h-5 flex-shrink-0", 
                  analysis.transfer_detected ? "text-yellow-400" : "text-green-400"
                )} />
                <div>
                  <p className="text-sm font-medium text-foreground">Transferência</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.transfer_detected 
                      ? analysis.transfer_reason || 'Transferência detectada' 
                      : '✅ Resolvido sem transferência'}
                  </p>
                </div>
              </div>

              {/* Robotic Communication */}
              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                analysis.robotic_communication
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-green-500/5 border-green-500/20"
              )}>
                <Bot className={cn("w-5 h-5 flex-shrink-0", 
                  analysis.robotic_communication ? "text-red-400" : "text-green-400"
                )} />
                <div>
                  <p className="text-sm font-medium text-foreground">Comunicação</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.robotic_communication 
                      ? '❌ Comunicação robótica detectada' 
                      : '✅ Comunicação natural e humanizada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Robotic Communication Details */}
            {analysis.robotic_communication && analysis.robotic_communication_details && (
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Detalhes da Comunicação Robótica
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.robotic_communication_details}
                </p>
              </div>
            )}

            {/* Top 3 Phrases */}
            {analysis.top_phrases && analysis.top_phrases.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-primary" />
                  Top 3 Frases Mais Utilizadas
                </h4>
                <div className="space-y-2">
                  {analysis.top_phrases.map((phrase, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-sm text-muted-foreground italic">&ldquo;{phrase}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {analysis.summary && (
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Resumo
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* Processes */}
            {analysis.processes_executed && analysis.processes_executed.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Processos Executados</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.processes_executed.map((process, i) => (
                    <Badge key={i} variant="secondary">
                      {process}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Patterns */}
            {analysis.patterns && analysis.patterns.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Padrões Identificados</h4>
                <ul className="space-y-1">
                  {analysis.patterns.map((pattern, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    Pontos Fortes
                  </h4>
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.improvements && analysis.improvements.length > 0 && (
                <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pontos de Melhoria
                  </h4>
                  <ul className="space-y-1">
                    {analysis.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Insights
                </h4>
                <ul className="space-y-1">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">💡</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}