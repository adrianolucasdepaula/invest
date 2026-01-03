'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUpdatePosition } from '@/lib/hooks/use-portfolio';
import { Edit } from 'lucide-react';

interface EditPositionDialogProps {
  portfolioId: string;
  position: {
    id: string;
    ticker: string;
    quantity: number;
    averagePrice: number;
  };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function EditPositionDialog({
  portfolioId,
  position,
  trigger,
  onSuccess,
}: EditPositionDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(Number(position.quantity).toString());
  const [averagePrice, setAveragePrice] = useState(position.averagePrice.toString());
  const { toast } = useToast();
  const updateMutation = useUpdatePosition();

  useEffect(() => {
    setQuantity(Number(position.quantity).toString());
    setAveragePrice(position.averagePrice.toString());
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || !averagePrice) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para atualizar a posição.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        portfolioId,
        positionId: position.id,
        data: {
          quantity: parseInt(quantity),
          averagePrice: parseFloat(averagePrice),
        },
      });

      toast({
        title: 'Posição atualizada!',
        description: `${position.ticker} foi atualizado com sucesso.`,
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar posição',
        description: 'Não foi possível atualizar a posição. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Editar posição ${position.ticker}`}>
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Posição</DialogTitle>
            <DialogDescription>
              Atualize os dados da posição de {position.ticker}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="ticker" className="text-sm font-medium text-muted-foreground">
                Ticker
              </label>
              <Input
                id="ticker"
                value={position.ticker}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantidade *
              </label>
              <Input
                id="quantity"
                type="number"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                step="1"
                required
              />
              <p className="text-xs text-muted-foreground">
                Número de ações/cotas
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="averagePrice" className="text-sm font-medium">
                Preço Médio *
              </label>
              <Input
                id="averagePrice"
                type="number"
                placeholder="25.50"
                value={averagePrice}
                onChange={(e) => setAveragePrice(e.target.value)}
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-muted-foreground">
                Preço médio de compra por ação
              </p>
            </div>

            {quantity && averagePrice && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="text-sm font-semibold mb-2">Novo Resumo:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço Médio:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(parseFloat(averagePrice) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground font-semibold">
                      Valor Investido:
                    </span>
                    <span className="font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format((parseFloat(quantity) || 0) * (parseFloat(averagePrice) || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
