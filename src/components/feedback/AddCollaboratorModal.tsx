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
  onAdd: (name: string, role: string) => Promise<void>;
}

export function AddCollaboratorModal({ open, onOpenChange, onAdd }: AddCollaboratorModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('N1');
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
      <DialogContent className="sm:max-w-lg">
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
              onValueChange={setRole}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="N1" id="role-n1" />
                <Label htmlFor="role-n1" className="cursor-pointer font-medium">N1 <span className="text-[10px] text-muted-foreground ml-0.5">(Primeiro Nível)</span></Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="N2" id="role-n2" />
                <Label htmlFor="role-n2" className="cursor-pointer font-medium">N2 <span className="text-[10px] text-muted-foreground ml-0.5">(Segundo Nível)</span></Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="implantador" id="role-implantador" />
                <Label htmlFor="role-implantador" className="cursor-pointer font-medium">Implantador</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="financeiro" id="role-financeiro" />
                <Label htmlFor="role-financeiro" className="cursor-pointer font-medium">Financeiro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cs" id="role-cs" />
                <Label htmlFor="role-cs" className="cursor-pointer font-medium">Customer Success</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tecnico_treinamento" id="role-treinamento" />
                <Label htmlFor="role-treinamento" className="cursor-pointer font-medium">Analista Treinamento</Label>
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
