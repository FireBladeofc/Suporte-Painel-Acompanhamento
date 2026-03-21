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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserPlus } from 'lucide-react';
import { addCollaboratorSchema, getFirstZodError } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

interface AddCollaboratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, role: 'N1' | 'N2') => Promise<void>;
}

export function AddCollaboratorModal({ open, onOpenChange, onAdd }: AddCollaboratorModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'N1' | 'N2'>('N1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = addCollaboratorSchema.safeParse({ name, role });
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
      await onAdd(result.data.name, result.data.role);
      setName('');
      setRole('N1');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setRole('N1');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Adicionar Colaborador
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Colaborador</Label>
            <Input
              id="name"
              placeholder="Digite o nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <Label>Cargo/Função</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as 'N1' | 'N2')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="N1" id="n1" />
                <Label htmlFor="n1" className="cursor-pointer">
                  <span className="font-medium">N1</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    (Primeiro Nível)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="N2" id="n2" />
                <Label htmlFor="n2" className="cursor-pointer">
                  <span className="font-medium">N2</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    (Segundo Nível)
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="bg-gradient-primary"
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
