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
import { useAddPosition } from '@/lib/hooks/use-portfolio';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';

interface AddPositionDialogProps {
  portfolioId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddPositionDialog({
  portfolioId,
  trigger,
  onSuccess,
}: AddPositionDialogProps) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [assetInfo, setAssetInfo] = useState<any>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const { toast} = useToast();
  const addMutation = useAddPosition();

  // Fetch asset info when ticker changes
  useEffect(() => {
    const fetchAssetInfo = async () => {
      if (ticker.length >= 3) {
        setLoadingAsset(true);
        try {
          const assets = await api.getAssets({ search: ticker.toUpperCase() });
          const asset = assets.find((a: any) => a.ticker === ticker.toUpperCase());
          setAssetInfo(asset || null);
        } catch (error) {
          console.error('Error fetching asset:', error);
          setAssetInfo(null);
        } finally {
          setLoadingAsset(false);
        }
      } else {
        setAssetInfo(null);
      }
    };

    const debounce = setTimeout(fetchAssetInfo, 500);
    return () => clearTimeout(debounce);
  }, [ticker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker || !quantity || !averagePrice || !purchaseDate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para adicionar a posição.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addMutation.mutateAsync({
        portfolioId,
        data: {
          ticker: ticker.toUpperCase(),
          quantity: parseInt(quantity),
          averagePrice: parseFloat(averagePrice),
          purchaseDate: purchaseDate,
        },
      });

      toast({
        title: 'Posição adicionada!',
        description: `${ticker.toUpperCase()} foi adicionado ao seu portfólio.`,
      });

      setOpen(false);
      setTicker('');
      setQuantity('');
      setAveragePrice('');
      setPurchaseDate('');
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro ao adicionar posição',
        description: 'Não foi possível adicionar a posição. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Posição
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Posição</DialogTitle>
            <DialogDescription>
              Adicione um novo ativo ao seu portfólio
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="ticker" className="text-sm font-medium">
                Ticker *
              </label>
              <Input
                id="ticker"
                placeholder="Ex: PETR4"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-muted-foreground">
                Código do ativo na B3
              </p>
              {loadingAsset && (
                <p className="text-xs text-blue-600">Buscando informações...</p>
              )}
              {assetInfo && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 space-y-1">
                  <p className="text-sm font-semibold text-green-900">{assetInfo.name}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">Preço Atual:</span>
                    <span className="font-bold text-green-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(assetInfo.price || 0)}
                    </span>
                  </div>
                  {assetInfo.changePercent && (
                    <div className="flex items-center gap-1 text-xs">
                      {assetInfo.changePercent > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={assetInfo.changePercent > 0 ? 'text-green-600' : 'text-red-600'}>
                        {assetInfo.changePercent > 0 ? '+' : ''}{assetInfo.changePercent?.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
              {ticker.length >= 3 && !loadingAsset && !assetInfo && (
                <p className="text-xs text-amber-600">Ativo não encontrado no sistema</p>
              )}
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

            <div className="space-y-2">
              <label htmlFor="purchaseDate" className="text-sm font-medium">
                Data de Compra *
              </label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-muted-foreground">
                Data em que o ativo foi comprado
              </p>
            </div>

            {ticker && quantity && averagePrice && purchaseDate && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="text-sm font-semibold mb-2">Resumo:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticker:</span>
                    <span className="font-medium">{ticker.toUpperCase()}</span>
                  </div>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Compra:</span>
                    <span className="font-medium">
                      {new Date(purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR')}
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
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
