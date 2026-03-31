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
import { WarningType } from '@/types/feedback';
import { Loader2 } from 'lucide-react';
import { addWarningSchema, getFirstZodError } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

interface AddWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { warning_date: string; type: WarningType; reason: string; details?: string }) => Promise<boolean>;
}

export function AddWarningModal({ open, onOpenChange, onSubmit }: AddWarningModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<WarningType>('verbal');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const result = addWarningSchema.safeParse({
      warning_date: date,
      type,
      reason,
      details: details.trim() || undefined,
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
        warning_date: result.data.warning_date!,
        type: result.data.type! as WarningType,
        reason: result.data.reason!,
        details: result.data.details,
      });
      if (success) {
        setDate(new Date().toISOString().split('T')[0]);
        setType('verbal');
        setReason('');
        setDetails('');
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setType('verbal');
      setReason('');
      setDetails('');
      setSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Registrar Advertência</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="warning-date">Data</Label>
             <Input
               id="warning-date"
               type="date"
               value={date}
               onChange={(e) => setDate(e.target.value)}
             />
           </div>
 
           <div className="space-y-2">
             <Label>Tipo</Label>
             <Select value={type} onValueChange={(v) => setType(v as WarningType)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="verbal">Verbal</SelectItem>
                 <SelectItem value="escrita">Escrita</SelectItem>
                 <SelectItem value="suspensao">Suspensão</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="warning-reason">Motivo *</Label>
              <Input
                id="warning-reason"
                placeholder="Ex: Atraso reincidente"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="warning-details">Detalhes</Label>
              <Textarea
                id="warning-details"
                placeholder="Observações adicionais..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={3}
              />
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
             Cancelar
           </Button>
           <Button onClick={handleSubmit} disabled={!reason.trim() || submitting}>
             {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
             Registrar
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }