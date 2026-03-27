import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaborators } from '@/hooks/useFeedback';
import { CollaboratorList } from './CollaboratorList';
import { CollaboratorDetail } from './CollaboratorDetail';
import { AddCollaboratorModal } from './AddCollaboratorModal';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, ArrowLeft } from 'lucide-react';
import { Collaborator } from '@/types/feedback';
import { SupportTicket, AgentMetrics } from '@/types/support';

interface FeedbackPanelProps {
  tickets?: SupportTicket[];
  agentMetrics?: AgentMetrics[];
}

export function FeedbackPanel({ tickets = [], agentMetrics = [] }: FeedbackPanelProps) {
  const { collaborators, loading, addCollaborator, deleteCollaborator, fetchCollaborators } = useCollaborators();
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddCollaborator = async (name: string, role: string) => {
    await addCollaborator(name, role as any);
    setShowAddModal(false);
  };

  const handleBack = () => {
    setSelectedCollaborator(null);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {selectedCollaborator ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </div>
            <CollaboratorDetail
              collaborator={selectedCollaborator}
              onBack={handleBack}
              tickets={tickets}
              agentMetrics={agentMetrics}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-primary">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-foreground">
                    Análise de Feedback
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Acompanhamento de desempenho dos colaboradores
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="gap-2 bg-gradient-primary hover:opacity-90"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Colaborador
              </Button>
            </div>

            {/* Collaborators List */}
            <CollaboratorList
              collaborators={collaborators}
              loading={loading}
              onSelect={setSelectedCollaborator}
              onDelete={deleteCollaborator}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Collaborator Modal */}
      <AddCollaboratorModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={handleAddCollaborator}
      />
    </div>
  );
}