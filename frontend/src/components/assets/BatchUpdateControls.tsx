'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAssetUpdates, type OutdatedAsset } from '@/hooks/useAssetUpdates';
import { OutdatedBadge } from './OutdatedBadge';
import { UpdateProgressBar } from './UpdateProgressBar';
import { cn } from '@/lib/utils';

interface BatchUpdateControlsProps {
  portfolioId?: string;
  userId: string;
  className?: string;
  onUpdateComplete?: () => void;
}

export function BatchUpdateControls({
  portfolioId,
  userId,
  className,
  onUpdateComplete,
}: BatchUpdateControlsProps) {
  const {
    getOutdatedAssets,
    updateMultipleAssets,
    updatePortfolioAssets,
    isBatchUpdating,
  } = useAssetUpdates();

  const [outdatedAssets, setOutdatedAssets] = useState<OutdatedAsset[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOutdatedAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const assets = await getOutdatedAssets(portfolioId);
      setOutdatedAssets(assets);
      setSelectedTickers(assets.map((a: OutdatedAsset) => a.ticker));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar ativos desatualizados');
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, getOutdatedAssets]);

  useEffect(() => {
    loadOutdatedAssets();
  }, [loadOutdatedAssets]);

  const handleSelectAll = () => {
    if (selectedTickers.length === outdatedAssets.length) {
      setSelectedTickers([]);
    } else {
      setSelectedTickers(outdatedAssets.map((a: OutdatedAsset) => a.ticker));
    }
  };

  const handleToggleAsset = (ticker: string) => {
    setSelectedTickers((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  };

  const handleUpdateSelected = async () => {
    if (selectedTickers.length === 0) return;

    try {
      await updateMultipleAssets(selectedTickers, userId);
      await loadOutdatedAssets();
      onUpdateComplete?.();
    } catch (err) {
      // Error handling is done in the hook with toast
    }
  };

  const handleUpdateAll = async () => {
    if (!portfolioId) return;

    try {
      await updatePortfolioAssets(portfolioId, userId);
      await loadOutdatedAssets();
      onUpdateComplete?.();
    } catch (err) {
      // Error handling is done in the hook with toast
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando ativos desatualizados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOutdatedAssets}
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (outdatedAssets.length === 0) {
    return (
      <Card className={cn('border-green-200 bg-green-50/50', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-medium">Todos os ativos estao atualizados!</p>
              <p className="text-sm text-green-600 mt-1">
                Nao ha ativos pendentes de atualizacao no momento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <UpdateProgressBar />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Ativos Desatualizados</CardTitle>
              <CardDescription>
                {outdatedAssets.length} {outdatedAssets.length === 1 ? 'ativo precisa' : 'ativos precisam'} de atualizacao
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={isBatchUpdating}
              >
                {selectedTickers.length === outdatedAssets.length
                  ? 'Desmarcar todos'
                  : 'Selecionar todos'}
              </Button>
              {portfolioId && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUpdateAll}
                  disabled={isBatchUpdating || outdatedAssets.length === 0}
                  className="gap-2"
                >
                  <RefreshCw className={cn('h-4 w-4', isBatchUpdating && 'animate-spin')} />
                  Atualizar Portfolio
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleUpdateSelected}
                disabled={isBatchUpdating || selectedTickers.length === 0}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', isBatchUpdating && 'animate-spin')} />
                Atualizar Selecionados ({selectedTickers.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {outdatedAssets.map((asset) => (
              <div
                key={asset.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                  selectedTickers.includes(asset.ticker)
                    ? 'bg-primary/5 border-primary/20'
                    : 'hover:bg-muted/50'
                )}
              >
                <Checkbox
                  checked={selectedTickers.includes(asset.ticker)}
                  onCheckedChange={() => handleToggleAsset(asset.ticker)}
                  disabled={isBatchUpdating}
                />
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">
                        {asset.ticker}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {asset.name}
                      </span>
                    </div>
                  </div>
                  <OutdatedBadge
                    lastUpdated={asset.lastUpdated}
                    lastUpdateStatus={asset.lastUpdateStatus}
                    lastUpdateError={asset.lastUpdateError}
                    updateRetryCount={asset.updateRetryCount}
                    showTime={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
