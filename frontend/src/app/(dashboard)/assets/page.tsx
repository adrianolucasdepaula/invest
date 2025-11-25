'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssets } from '@/lib/hooks/use-assets';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AssetTable } from '@/components/dashboard/asset-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, RefreshCw, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type SortBy = 'ticker' | 'day' | 'week' | 'month' | 'year';
type ViewMode = 'all' | 'sector';

export default function AssetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('ticker');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showOnlyOptions, setShowOnlyOptions] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingAsset, setSyncingAsset] = useState<string | null>(null);
  const { data: assets, isLoading, error, refetch } = useAssets();

  // Auto-refresh every hour
  useEffect(() => {
    const interval = setInterval(
      () => {
        console.log('Auto-refreshing assets...');
        refetch();
      },
      60 * 60 * 1000
    ); // 1 hour

    return () => clearInterval(interval);
  }, [refetch]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      // Step 1: Queue the sync job (returns immediately)
      const result = await api.syncAllAssets();
      const { jobId, total } = result;

      toast({
        title: 'Sincronização iniciada',
        description: `Job ${jobId}: Sincronizando ${total} ativos em background...`,
      });

      // Step 2: Poll job status
      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getSyncStatus(jobId);

          // Check if job is complete
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setSyncing(false);
            toast({
              title: 'Sincronização concluída',
              description: `${status.result?.successCount || 0} ativos atualizados com sucesso!`,
            });
            refetch(); // Refresh the assets list
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setSyncing(false);
            toast({
              title: 'Erro na sincronização',
              description: status.failedReason || 'Job failed',
              variant: 'destructive',
            });
          }
          // If status is 'waiting', 'active', or 'delayed', continue polling
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 5 minutes (safety net)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (syncing) {
          setSyncing(false);
          toast({
            title: 'Timeout',
            description: 'Sincronização ainda em progresso. Atualize a página para ver os resultados.',
            variant: 'destructive',
          });
        }
      }, 5 * 60 * 1000); // 5 minutes
    } catch (error: any) {
      setSyncing(false);
      toast({
        title: 'Erro ao sincronizar',
        description: error.message || 'Erro ao iniciar sincronização',
        variant: 'destructive',
      });
    }
  };

  const handleSyncAsset = async (ticker: string) => {
    setSyncingAsset(ticker);
    try {
      const result = await api.syncAsset(ticker);
      toast({
        title: 'Ativo atualizado',
        description: `${ticker} foi atualizado com sucesso. Preço: R$ ${result.currentPrice?.toFixed(2) || 'N/A'}`,
      });

      // Refresh data after sync
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar ativo',
        description: error.message || `Erro ao atualizar ${ticker}`,
        variant: 'destructive',
      });
    } finally {
      setSyncingAsset(null);
    }
  };

  // Get most recent collection timestamp
  const lastCollectedAt = useMemo(() => {
    if (!assets || assets.length === 0) return null;

    const timestamps = assets
      .map((asset: any) => asset.currentPrice?.collectedAt)
      .filter(Boolean)
      .map((date: string) => new Date(date).getTime());

    if (timestamps.length === 0) return null;

    return new Date(Math.max(...timestamps));
  }, [assets]);

  const sortedAndFilteredAssets = useMemo(() => {
    if (!assets) return [];

    let filtered = assets.filter(
      (asset: any) =>
        asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showOnlyOptions) {
      filtered = filtered.filter((asset: any) => asset.hasOptions);
    }

    // Sort by selected criteria
    switch (sortBy) {
      case 'day':
        filtered.sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0));
        break;
      case 'week':
      case 'month':
      case 'year':
        // TODO: Implement historical sorting when data is available
        filtered.sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0));
        break;
      case 'ticker':
      default:
        filtered.sort((a: any, b: any) => a.ticker.localeCompare(b.ticker));
    }

    return filtered;
  }, [assets, searchTerm, sortBy, showOnlyOptions]);

  const groupedBySector = useMemo(() => {
    if (viewMode !== 'sector' || !sortedAndFilteredAssets.length) return {};

    const grouped = sortedAndFilteredAssets.reduce((acc: any, asset: any) => {
      const sector = asset.sector || 'Sem Setor';
      if (!acc[sector]) {
        acc[sector] = [];
      }
      acc[sector].push(asset);
      return acc;
    }, {});

    // Sort each sector's assets
    Object.keys(grouped).forEach(sector => {
      grouped[sector].sort((a: any, b: any) => {
        switch (sortBy) {
          case 'day':
          case 'week':
          case 'month':
          case 'year':
            return (b.changePercent || 0) - (a.changePercent || 0);
          default:
            return a.ticker.localeCompare(b.ticker);
        }
      });
    });

    return grouped;
  }, [sortedAndFilteredAssets, viewMode, sortBy]);

  const handleAssetClick = (ticker: string) => {
    router.push(`/assets/${ticker}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ativos</h1>
          <p className="text-muted-foreground">Explore e analise os principais ativos da B3</p>
          {lastCollectedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Última atualização:{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'medium',
              }).format(lastCollectedAt)}
            </p>
          )}
        </div>
        <Button onClick={handleSyncAll} disabled={syncing} className="gap-2">
          <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
          {syncing ? 'Sincronizando...' : 'Atualizar Todos'}
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por ticker, nome ou setor..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mr-4 flex items-center space-x-2">
            <Checkbox
              id="options-mode"
              checked={showOnlyOptions}
              onCheckedChange={checked => setShowOnlyOptions(checked as boolean)}
            />
            <Label htmlFor="options-mode">Com Opções</Label>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ticker">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Ticker (A-Z)
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Alta do Dia
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Alta da Semana
                  </div>
                </SelectItem>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Alta do Mês
                  </div>
                </SelectItem>
                <SelectItem value="year">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Alta do Ano
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Todos
                  </div>
                </SelectItem>
                <SelectItem value="sector">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Por Setor
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-6">
          <div className="space-y-4">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <div className="py-8 text-center">
            <p className="text-destructive">Erro ao carregar ativos</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Verifique sua conexão e tente novamente
            </p>
          </div>
        </Card>
      ) : sortedAndFilteredAssets.length === 0 ? (
        <Card className="p-6">
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum ativo encontrado</p>
          </div>
        </Card>
      ) : viewMode === 'sector' ? (
        <div className="space-y-6">
          {Object.entries(groupedBySector).map(([sector, sectorAssets]: [string, any]) => (
            <Card key={sector} className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{sector}</h3>
                  <p className="text-sm text-muted-foreground">
                    {sectorAssets.length} {sectorAssets.length === 1 ? 'ativo' : 'ativos'}
                  </p>
                </div>
                {sortBy !== 'ticker' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>
                      Ordenado por{' '}
                      {sortBy === 'day'
                        ? 'alta do dia'
                        : sortBy === 'week'
                          ? 'alta da semana'
                          : sortBy === 'month'
                            ? 'alta do mês'
                            : 'alta do ano'}
                    </span>
                  </div>
                )}
              </div>
              <AssetTable
                assets={sectorAssets}
                onAssetClick={handleAssetClick}
                onSyncAsset={handleSyncAsset}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <AssetTable
            assets={sortedAndFilteredAssets}
            onAssetClick={handleAssetClick}
            onSyncAsset={handleSyncAsset}
          />
        </Card>
      )}
    </div>
  );
}
