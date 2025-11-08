'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useDeletePosition } from '@/lib/hooks/use-portfolio';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeletePositionDialogProps {
  portfolioId: string;
  positionId: string;
  ticker: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DeletePositionDialog({
  portfolioId,
  positionId,
  ticker,
  trigger,
  onSuccess,
}: DeletePositionDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const deleteMutation = useDeletePosition();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ portfolioId, positionId });

      toast({
        title: 'Posição removida!',
        description: `${ticker} foi removido do seu portfólio.`,
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro ao remover posição',
        description: 'Não foi possível remover a posição. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Remover Posição</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover a posição de <strong className="text-foreground">{ticker}</strong> do
            seu portfólio? Todos os dados serão removidos permanentemente.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
