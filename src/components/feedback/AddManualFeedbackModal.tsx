import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ManualFeedbackCategory, ManualFeedbackStatus } from '@/types/feedback';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { addManualFeedbackSchema, getFirstZodError } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

interface AddManualFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    feedback_date: string;
    status: ManualFeedbackStatus;
    category: ManualFeedbackCategory | null;
    observations: string | null;
  }) => Promise<boolean>;
}

export function AddManualFeedbackModal({ 
  open, 
  onOpenChange, 
  onAdd 
}: AddManualFeedbackModalProps) {
  const [feedbackDate, setFeedbackDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<ManualFeedbackStatus>('pending');
  const [category, setCategory] = useState<ManualFeedbackCategory | 'none'>('none');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedCategory = category === 'none' ? null : category;
    const parsedObservations = observations.trim() || null;

    const result = addManualFeedbackSchema.safeParse({
      feedback_date: feedbackDate,
      status,
      category: parsedCategory,
      observations: parsedObservations,
    });

    if (!result.success) {
      toast({
        title: 'Dados inválidos',
        description: getFirstZodError(result.error),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const success = await onAdd({
        feedback_date: result.data.feedback_date!,
        status: result.data.status! as ManualFeedbackStatus,
        category: (result.data.category ?? null) as ManualFeedbackCategory | null,
        observations: result.data.observations ?? null,
      });

      if (success) {
        setFeedbackDate(format(new Date(), 'yyyy-MM-dd'));
        setStatus('pending');
        setCategory('none');
        setObservations('');
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFeedbackDate(format(new Date(), 'yyyy-MM-dd'));
      setStatus('pending');
      setCategory('none');
      setObservations('');
      setLoading(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Feedback</DialogTitle>
          <DialogDescription>
            Registre um novo feedback para acompanhamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback_date">Data do Feedback</Label>
            <Input
              id="feedback_date"
              type="date"
              value={feedbackDate}
              onChange={(e) => setFeedbackDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ManualFeedbackStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Realizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ManualFeedbackCategory | 'none')}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="performance">Desempenho</SelectItem>
                  <SelectItem value="behavior">Comportamento</SelectItem>
                  <SelectItem value="recognition">Reconhecimento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Pontos discutidos, acordos, próximos passos..."
              maxLength={5000}
              className="min-h-[100px] resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar Feedback'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
