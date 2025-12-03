'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssets } from '@/lib/hooks/use-assets';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AssetTable } from '@/components/dashboard/asset-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, RefreshCw, Layers, Loader2, XCircle, Pause, Play } from 'lucide-react';
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
import { useAssetBulkUpdate } from '@/lib/hooks/useAssetBulkUpdate';
import { Progress } from '@/components/ui/progress';
import { AssetUpdateLogsPanel } from '@/components/dashboard/AssetUpdateLogsPanel';

type ViewMode = 'all' | 'sector' | 'type' | 'type-sector';

// Hook para evitar hydration mismatch com componentes Radix UI
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

// Helper function to detect asset type based on ticker
function getAssetType(ticker: string, assetType?: string): string {
  // If backend provides type, use it
  if (assetType) return assetType;

  // Otherwise, detect from ticker pattern
  if (ticker.endsWith('11')) return 'FII';
  if (/\d$/.test(ticker)) return 'Ação';
  return 'Outro';
}

export default function AssetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const hydrated = useHydrated();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showOnlyOptions, setShowOnlyOptions] = useState(false);
  const [syncingAsset, setSyncingAsset] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { data: assets, isLoading, error, refetch } = useAssets();

  // WebSocket hook for bulk updates
  const { state: bulkUpdateState, isConnected, clearLogs } = useAssetBulkUpdate({
    onUpdateComplete: () => {
      const successRate = bulkUpdateState.total > 0
        ? Math.round((bulkUpdateState.successCount / bulkUpdateState.total) * 100)
        : 0;

      toast({
        title: 'Atualização concluída!',
        description: `${bulkUpdateState.successCount}/${bulkUpdateState.total} ativos atualizados (${successRate}% sucesso)${bulkUpdateState.failedCount > 0 ? `. ${bulkUpdateState.failedCount} falharam` : ''}.`,
      });
      refetch();
    },
    onUpdateStarted: () => {
      toast({
        title: 'Atualização iniciada',
        description: `Atualizando dados fundamentalistas de todos os ativos em background...`,
      });
    },
  });

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
    // ✅ FIX: Check if there's already a bulk update running before starting a new one
    if (bulkUpdateState.isRunning) {
      toast({
        title: 'Atualização já em andamento',
        description: 'Aguarde a conclusão da atualização atual ou cancele-a antes de iniciar uma nova.',
        variant: 'default',
      });
      return;
    }

    // Double-check with API to prevent race conditions
    try {
      const queueStatus = await api.getBulkUpdateStatus();
      const pendingJobs = (queueStatus.active || 0) + (queueStatus.waiting || 0);

      if (pendingJobs > 0) {
        toast({
          title: 'Atualização já em andamento',
          description: `Existem ${pendingJobs} jobs pendentes na fila. Aguarde ou cancele antes de iniciar nova atualização.`,
          variant: 'default',
        });
        return;
      }

      await api.bulkUpdateAllAssetsFundamentals();
    } catch (error: any) {
      toast({
        title: 'Erro ao iniciar atualização',
        description: error.message || 'Erro ao iniciar atualização em massa',
        variant: 'destructive',
      });
    }
  };

  const handleCancelUpdate = async () => {
    setIsCancelling(true);
    try {
      const result = await api.cancelBulkUpdate();
      toast({
        title: 'Atualização cancelada',
        description: result.message || 'Jobs pendentes foram removidos da fila.',
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar',
        description: error.message || 'Erro ao cancelar atualização',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePauseResume = async () => {
    setIsPausing(true);
    try {
      if (isPaused) {
        await api.resumeBulkUpdate();
        setIsPaused(false);
        toast({
          title: 'Fila retomada',
          description: 'A atualização em massa foi retomada.',
        });
      } else {
        await api.pauseBulkUpdate();
        setIsPaused(true);
        toast({
          title: 'Fila pausada',
          description: 'A atualização em massa foi pausada. Jobs ativos serão concluídos.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao pausar/retomar atualização',
        variant: 'destructive',
      });
    } finally {
      setIsPausing(false);
    }
  };

  const handleSyncAsset = async (ticker: string) => {
    setSyncingAsset(ticker);
    const startTime = Date.now();
    const MIN_SPINNER_DURATION = 2000; // Minimum 2 seconds for user to see feedback

    try {
      // Use the same fundamental data update process as bulk update
      const result = await api.updateAssetFundamentals(ticker);
      toast({
        title: 'Atualização iniciada',
        description: `${ticker} foi adicionado à fila de atualização. Job ID: ${result.jobId}`,
      });

      // The WebSocket hook will handle real-time updates
      // Refetch after a delay to get updated data
      setTimeout(() => {
        refetch();
      }, 5000);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar ativo',
        description: error.message || `Erro ao atualizar ${ticker}`,
        variant: 'destructive',
      });
    } finally {
      // Keep spinner visible for at least MIN_SPINNER_DURATION for better UX
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SPINNER_DURATION - elapsed);
      setTimeout(() => setSyncingAsset(null), remainingTime);
    }
  };

  const lastCollectedAt = useMemo(() => {
    if (!assets || assets.length === 0) return null;

    // Usar lastUpdated (atualização completa via scrapers)
    const timestamps = assets
      .map((asset: any) => asset.lastUpdated)
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

    // Sort by ticker (A-Z)
    filtered.sort((a: any, b: any) => a.ticker.localeCompare(b.ticker));

    return filtered;
  }, [assets, searchTerm, showOnlyOptions]);

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

    // Sort each sector's assets by ticker (A-Z)
    Object.keys(grouped).forEach(sector => {
      grouped[sector].sort((a: any, b: any) => a.ticker.localeCompare(b.ticker));
    });

    return grouped;
  }, [sortedAndFilteredAssets, viewMode]);

  const groupedByType = useMemo(() => {
    if (viewMode !== 'type' || !sortedAndFilteredAssets.length) return {};

    const grouped = sortedAndFilteredAssets.reduce((acc: any, asset: any) => {
      const type = getAssetType(asset.ticker, asset.type);
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(asset);
      return acc;
    }, {});

    // Sort each type's assets by ticker (A-Z)
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a: any, b: any) => a.ticker.localeCompare(b.ticker));
    });

    return grouped;
  }, [sortedAndFilteredAssets, viewMode]);

  const groupedByTypeAndSector = useMemo(() => {
    if (viewMode !== 'type-sector' || !sortedAndFilteredAssets.length) return {};

    const grouped = sortedAndFilteredAssets.reduce((acc: any, asset: any) => {
      const type = getAssetType(asset.ticker, asset.type);
      const sector = asset.sector || 'Sem Setor';
      const key = `${type} - ${sector}`;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(asset);
      return acc;
    }, {});

    // Sort each group's assets by ticker (A-Z)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a: any, b: any) => a.ticker.localeCompare(b.ticker));
    });

    return grouped;
  }, [sortedAndFilteredAssets, viewMode]);

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
        <div className="flex items-center gap-2">
          {bulkUpdateState.isRunning && (
            <>
              <Button
                variant="outline"
                onClick={handlePauseResume}
                disabled={isPausing}
                className="gap-2"
              >
                {isPausing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                {isPaused ? 'Retomar' : 'Pausar'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelUpdate}
                disabled={isCancelling}
                className="gap-2"
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Cancelar
              </Button>
            </>
          )}
          <Button onClick={handleSyncAll} disabled={bulkUpdateState.isRunning} className="gap-2">
            {bulkUpdateState.isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {bulkUpdateState.isRunning ? 'Atualizando...' : 'Atualizar Todos'}
          </Button>
        </div>
      </div>

      {bulkUpdateState.isRunning && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Pause className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                <span className="font-medium">
                  {isPaused ? 'Atualização pausada' : 'Atualização em andamento'}
                </span>
                {bulkUpdateState.currentTicker && (
                  <span className="text-muted-foreground">- {bulkUpdateState.currentTicker}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {bulkUpdateState.current}/{bulkUpdateState.total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseResume}
                  disabled={isPausing}
                  className="gap-1"
                >
                  {isPausing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isPaused ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                  {isPaused ? 'Retomar' : 'Pausar'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelUpdate}
                  disabled={isCancelling}
                  className="gap-1"
                >
                  {isCancelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  Cancelar
                </Button>
              </div>
            </div>
            <Progress value={bulkUpdateState.progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{bulkUpdateState.progress}% completo{isPaused && ' (pausado)'}</span>
              <div className="flex items-center gap-3">
                <span className="text-green-600">✓ {bulkUpdateState.successCount} sucesso</span>
                {bulkUpdateState.failedCount > 0 && (
                  <span className="text-destructive">✗ {bulkUpdateState.failedCount} falhas</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

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
              onCheckedChange={checked => setShowOnlyOptions(checked === true)}
            />
            <Label htmlFor="options-mode">Com Opções</Label>
          </div>

          <div className="flex items-center gap-2">
            {hydrated ? (
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Visualização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Todos
                    </div>
                  </SelectItem>
                  <SelectItem value="type">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Por Tipo
                    </div>
                  </SelectItem>
                  <SelectItem value="sector">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Por Setor
                    </div>
                  </SelectItem>
                  <SelectItem value="type-sector">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Por Tipo e Setor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                <span className="text-muted-foreground">Visualização</span>
              </div>
            )}
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
      ) : viewMode === 'type' ? (
        <div className="space-y-6">
          {Object.entries(groupedByType).map(([type, typeAssets]: [string, any]) => (
            <Card key={type} className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{type}</h3>
                <p className="text-sm text-muted-foreground">
                  {typeAssets.length} {typeAssets.length === 1 ? 'ativo' : 'ativos'}
                </p>
              </div>
              <AssetTable
                assets={typeAssets}
                onAssetClick={handleAssetClick}
                onSyncAsset={handleSyncAsset}
                syncingAsset={syncingAsset}
              />
            </Card>
          ))}
        </div>
      ) : viewMode === 'sector' ? (
        <div className="space-y-6">
          {Object.entries(groupedBySector).map(([sector, sectorAssets]: [string, any]) => (
            <Card key={sector} className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{sector}</h3>
                <p className="text-sm text-muted-foreground">
                  {sectorAssets.length} {sectorAssets.length === 1 ? 'ativo' : 'ativos'}
                </p>
              </div>
              <AssetTable
                assets={sectorAssets}
                onAssetClick={handleAssetClick}
                onSyncAsset={handleSyncAsset}
                syncingAsset={syncingAsset}
              />
            </Card>
          ))}
        </div>
      ) : viewMode === 'type-sector' ? (
        <div className="space-y-6">
          {Object.entries(groupedByTypeAndSector).map(([group, groupAssets]: [string, any]) => (
            <Card key={group} className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{group}</h3>
                <p className="text-sm text-muted-foreground">
                  {groupAssets.length} {groupAssets.length === 1 ? 'ativo' : 'ativos'}
                </p>
              </div>
              <AssetTable
                assets={groupAssets}
                onAssetClick={handleAssetClick}
                onSyncAsset={handleSyncAsset}
                syncingAsset={syncingAsset}
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
            syncingAsset={syncingAsset}
          />
        </Card>
      )}

      {(bulkUpdateState.logs.length > 0 || bulkUpdateState.isRunning) && (
        <AssetUpdateLogsPanel
          logs={bulkUpdateState.logs}
          onClearLogs={clearLogs}
          isRunning={bulkUpdateState.isRunning}
          maxHeight={300}
          autoScroll
        />
      )}
    </div>
  );
}
