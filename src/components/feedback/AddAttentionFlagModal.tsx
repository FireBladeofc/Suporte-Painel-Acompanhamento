import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { AttentionFlagSeverity } from '@/types/feedback';
import { Loader2 } from 'lucide-react';
import { addAttentionFlagSchema, getFirstZodError } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

interface AddAttentionFlagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { flag_date: string; severity: AttentionFlagSeverity; description: string }) => Promise<boolean>;
}

export function AddAttentionFlagModal({ open, onOpenChange, onSubmit }: AddAttentionFlagModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [severity, setSeverity] = useState<AttentionFlagSeverity>('media');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const result = addAttentionFlagSchema.safeParse({
      flag_date: date,
      severity,
      description,
    });

    if (!result.success) {
      toast({
        title: 'Dados inválidos',
        description: getFirstZodError(result.error),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit({
        flag_date: result.data.flag_date!,
        severity: result.data.severity! as AttentionFlagSeverity,
        description: result.data.description!,
      });
      if (success) {
        setDate(new Date().toISOString().split('T')[0]);
        setSeverity('media');
        setDescription('');
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setSeverity('media');
      setDescription('');
      setSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Registrar Sinal de Atenção</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="flag-date">Data</Label>
             <Input
               id="flag-date"
               type="date"
               value={date}
               onChange={(e) => setDate(e.target.value)}
             />
           </div>
 
           <div className="space-y-2">
             <Label>Severidade</Label>
             <Select value={severity} onValueChange={(v) => setSeverity(v as AttentionFlagSeverity)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="baixa">🟢 Baixa</SelectItem>
                 <SelectItem value="media">🟡 Média</SelectItem>
                 <SelectItem value="alta">🟠 Alta</SelectItem>
                 <SelectItem value="critica">🔴 Crítica</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="flag-description">Descrição *</Label>
              <Textarea
                id="flag-description"
                placeholder="Descreva o sinal de atenção observado..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
              />
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
             Cancelar
           </Button>
           <Button onClick={handleSubmit} disabled={!description.trim() || submitting}>
             {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
             Registrar
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }