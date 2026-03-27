import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collaborator } from '@/types/feedback';
import { SupportTicket, AgentMetrics } from '@/types/support';
import { ManualFeedbackTab } from './ManualFeedbackTab';
import { InsightsSummaryTab } from './InsightsSummaryTab';
import { CollaboratorProfileTab } from './CollaboratorProfileTab';
import { DevelopmentPlanTab } from './DevelopmentPlanTab';
import { 
  Calendar,
  ClipboardCheck,
  Sparkles,
  ClipboardList,
  Target,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  N1: { label: 'Primeiro Nível', badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  N2: { label: 'Segundo Nível', badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  implantador: { label: 'Implantador', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  financeiro: { label: 'Financeiro', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cs: { label: 'Customer Success', badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  tecnico_treinamento: { label: 'Analista de Treinamento', badgeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
};

const SUPPORT_ROLES = ['N1', 'N2'];
const isSupport = (role: string) => SUPPORT_ROLES.includes(role);

interface CollaboratorDetailProps {
  collaborator: Collaborator;
  onBack: () => void;
  tickets?: SupportTicket[];
  agentMetrics?: AgentMetrics[];
}

/**
 * Normalize a name for fuzzy matching:
 * - Remove emojis, special characters, accents
 * - Lowercase and trim
 */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Remove non-letter/number/space
    .toLowerCase()
    .trim();
}

/**
 * Match collaborator name to agent name from dashboard data.
 * Uses multi-step matching: exact, partial, two-part, first-name (unique or not), any-part.
 */
function findAgentMetrics(
  collaboratorName: string,
  agentMetrics: AgentMetrics[]
): AgentMetrics | null {
  if (agentMetrics.length === 0) return null;

  const normalizedCollabName = normalizeName(collaboratorName);
  const collabParts = normalizedCollabName.split(/\s+/).filter(Boolean);

  // Step 1: Exact match
  for (const m of agentMetrics) {
    if (normalizeName(m.agente) === normalizedCollabName) return m;
  }

  // Step 2: Partial match (one contains the other)
  for (const m of agentMetrics) {
    const normalizedAgent = normalizeName(m.agente);
    if (normalizedAgent.includes(normalizedCollabName) || normalizedCollabName.includes(normalizedAgent)) {
      return m;
    }
  }

  // Step 3: Two or more name parts match
  if (collabParts.length >= 2) {
    for (const m of agentMetrics) {
      const agentParts = normalizeName(m.agente).split(/\s+/).filter(Boolean);
      const matches = collabParts.filter(p => agentParts.includes(p));
      if (matches.length >= 2) return m;
    }
  }

  // Step 4: First name unique match
  if (collabParts.length > 0) {
    const firstName = collabParts[0];
    const firstNameMatches = agentMetrics.filter(m => {
      const agentFirst = normalizeName(m.agente).split(/\s+/)[0];
      return agentFirst === firstName;
    });
    if (firstNameMatches.length === 1) return firstNameMatches[0];
  }

  // Step 5: First name match (even if not unique, pick best by most name parts in common)
  if (collabParts.length > 0) {
    const firstName = collabParts[0];
    const candidates = agentMetrics.filter(m => {
      const agentParts = normalizeName(m.agente).split(/\s+/).filter(Boolean);
      return agentParts.some(p => p === firstName);
    });
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      // Pick the one with most overlapping parts
      let best: AgentMetrics | null = null;
      let bestScore = 0;
      for (const c of candidates) {
        const agentParts = normalizeName(c.agente).split(/\s+/).filter(Boolean);
        const score = collabParts.filter(p => agentParts.includes(p)).length;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      if (best) return best;
    }
  }

  // Step 6: Any name part match (last name, etc.)
  if (collabParts.length > 1) {
    for (const part of collabParts.slice(1)) {
      if (part.length < 3) continue; // skip very short parts
      const matches = agentMetrics.filter(m => {
        const agentParts = normalizeName(m.agente).split(/\s+/).filter(Boolean);
        return agentParts.some(ap => ap === part);
      });
      if (matches.length === 1) return matches[0];
    }
  }

  return null;
}

export function CollaboratorDetail({ collaborator, onBack, tickets = [], agentMetrics = [] }: CollaboratorDetailProps) {
  const matchedAgent = useMemo(() => findAgentMetrics(collaborator.name, agentMetrics), [collaborator.name, agentMetrics]);
  const roleConfig = ROLE_CONFIG[collaborator.role] ?? { label: collaborator.role, badgeClass: 'bg-muted/20 text-muted-foreground border-muted/30' };
  const supportRole = isSupport(collaborator.role);


  return (
    <div className="space-y-6">
      {/* Collaborator Header */}
      <Card className="bg-card/50 border-border/50 card-glow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              {collaborator.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display text-foreground">
                {collaborator.name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className={roleConfig.badgeClass}>
                    {roleConfig.label}
                  </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Desde {format(new Date(collaborator.created_at), "MMM yyyy", { locale: ptBR })}
                </span>
                {matchedAgent && (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    Dados do painel vinculados
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      {supportRole ? (
        /* Suporte (N1/N2): painel completo com métricas de atendimento */
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="insights" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Resumo &amp; Insights
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Ficha
            </TabsTrigger>
            <TabsTrigger value="pdi" className="gap-2">
              <Target className="w-4 h-4" />
              PDI
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Feedback Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
            <InsightsSummaryTab collaborator={collaborator} agentMetrics={matchedAgent || undefined} tickets={tickets} />
          </TabsContent>
          <TabsContent value="profile">
            <CollaboratorProfileTab collaborator={collaborator} />
          </TabsContent>
          <TabsContent value="pdi">
            <DevelopmentPlanTab collaborator={collaborator} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualFeedbackTab collaborator={collaborator} />
          </TabsContent>
        </Tabs>
      ) : (
        /* Outros cargos: painel simplificado sem métricas de ticket */
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="manual" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Feedback Manual
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Ficha
            </TabsTrigger>
            <TabsTrigger value="pdi" className="gap-2">
              <Target className="w-4 h-4" />
              PDI
            </TabsTrigger>
          </TabsList>

          {/* Banner informativo */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <Briefcase className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300/80">
              Colaborador de <strong>{roleConfig.label}</strong> — acompanhamento via feedbacks manuais e PDI.
            </p>
          </div>

          <TabsContent value="manual">
            <ManualFeedbackTab collaborator={collaborator} />
          </TabsContent>
          <TabsContent value="profile">
            <CollaboratorProfileTab collaborator={collaborator} />
          </TabsContent>
          <TabsContent value="pdi">
            <DevelopmentPlanTab collaborator={collaborator} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}