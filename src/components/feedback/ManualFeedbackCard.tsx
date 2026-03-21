import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ManualFeedback, ManualFeedbackStatus, ManualFeedbackCategory } from '@/types/feedback';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  MessageSquare 
} from 'lucide-react';

interface ManualFeedbackCardProps {
  feedback: ManualFeedback;
  onToggleStatus: (id: string) => Promise<boolean>;
  onUpdate: (id: string, data: { status?: ManualFeedbackStatus; category?: ManualFeedbackCategory | null; observations?: string | null }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const categoryLabels: Record<ManualFeedbackCategory, string> = {
  performance: 'Desempenho',
  behavior: 'Comportamento',
  recognition: 'Reconhecimento',
  other: 'Outro',
};

const statusColors: Record<ManualFeedbackStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<ManualFeedbackStatus, string> = {
  pending: 'Pendente',
  completed: 'Realizado',
  cancelled: 'Cancelado',
};

export function ManualFeedbackCard({ 
  feedback, 
  onToggleStatus, 
  onUpdate, 
  onDelete 
}: ManualFeedbackCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedObservations, setEditedObservations] = useState(feedback.observations || '');
  const [editedCategory, setEditedCategory] = useState<ManualFeedbackCategory | null>(feedback.category);
  const [editedStatus, setEditedStatus] = useState<ManualFeedbackStatus>(feedback.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    const success = await onUpdate(feedback.id, {
      observations: editedObservations || null,
      category: editedCategory,
      status: editedStatus,
    });
    if (success) {
      setIsEditing(false);
    }
    setIsUpdating(false);
  };

  const handleCancel = () => {
    setEditedObservations(feedback.observations || '');
    setEditedCategory(feedback.category);
    setEditedStatus(feedback.status);
    setIsEditing(false);
  };

  const handleCheckboxChange = async () => {
    await onToggleStatus(feedback.id);
  };

  return (
    <Card className={`bg-card/50 border-border/50 transition-all ${feedback.status === 'completed' ? 'opacity-75' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={feedback.status === 'completed'}
              onCheckedChange={handleCheckboxChange}
              disabled={isUpdating || isEditing}
              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {format(new Date(feedback.feedback_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
                <Badge variant="outline" className={statusColors[feedback.status]}>
                  {statusLabels[feedback.status]}
                </Badge>
                {feedback.category && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {categoryLabels[feedback.category]}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-500 hover:text-green-400"
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={handleCancel}
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(feedback.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Observations / Edit mode */}
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    value={editedStatus}
                    onValueChange={(value) => setEditedStatus(value as ManualFeedbackStatus)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Realizado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={editedCategory || 'none'}
                    onValueChange={(value) => setEditedCategory(value === 'none' ? null : value as ManualFeedbackCategory)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      <SelectItem value="performance">Desempenho</SelectItem>
                      <SelectItem value="behavior">Comportamento</SelectItem>
                      <SelectItem value="recognition">Reconhecimento</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  value={editedObservations}
                  onChange={(e) => setEditedObservations(e.target.value)}
                  placeholder="Observações do feedback..."
                  className="min-h-[80px] text-sm resize-none"
                />
              </div>
            ) : feedback.observations ? (
              <div className="flex items-start gap-2 mt-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {feedback.observations}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
