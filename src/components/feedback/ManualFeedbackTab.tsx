import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collaborator } from '@/types/feedback';
import { useManualFeedbacks } from '@/hooks/useManualFeedbacks';
import { ManualFeedbackCard } from './ManualFeedbackCard';
import { AddManualFeedbackModal } from './AddManualFeedbackModal';
import { 
  Plus, 
  Loader2, 
  ClipboardCheck,
  CheckCircle2,
  Clock,
  XCircle 
} from 'lucide-react';

interface ManualFeedbackTabProps {
  collaborator: Collaborator;
}

export function ManualFeedbackTab({ collaborator }: ManualFeedbackTabProps) {
  const { 
    feedbacks, 
    loading, 
    stats,
    addFeedback, 
    updateFeedback, 
    deleteFeedback,
    toggleStatus 
  } = useManualFeedbacks(collaborator.id);
  
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = async (data: {
    feedback_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    category: 'performance' | 'behavior' | 'recognition' | 'other' | null;
    observations: string | null;
  }) => {
    const result = await addFeedback({
      collaborator_id: collaborator.id,
      ...data,
    });
    return result !== null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Realizados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <XCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Cancelados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddModal(true)}
          className="gap-2 bg-gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Novo Feedback
        </Button>
      </div>

      {/* Feedbacks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : feedbacks.length === 0 ? (
        <Card className="bg-card/50 border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <ClipboardCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Nenhum feedback registrado
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Registre feedbacks individuais para acompanhar o desenvolvimento do colaborador.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeiro feedback
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback, index) => (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <ManualFeedbackCard
                feedback={feedback}
                onToggleStatus={toggleStatus}
                onUpdate={updateFeedback}
                onDelete={deleteFeedback}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddManualFeedbackModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={handleAdd}
      />
    </div>
  );
}
