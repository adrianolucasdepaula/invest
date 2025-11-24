'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Database,
  TrendingUp,
  Loader2,
  RefreshCw,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/lib/hooks/useDataSync';
import { AssetSyncStatus } from '@/lib/types/data-sync';
import type { AssetSyncStatusDto } from '@/lib/types/data-sync';
import { IndividualSyncModal } from './IndividualSyncModal';

/**
 * Helper: Get color class for sync status
 */
const getStatusColor = (status: AssetSyncStatus): string => {
  switch (status) {
    case AssetSyncStatus.SYNCED:
      return 'text-success';
    case AssetSyncStatus.PARTIAL:
      return 'text-warning';
    case AssetSyncStatus.FAILED:
      return 'text-destructive';
    case AssetSyncStatus.PENDING:
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
};

/**
 * Helper: Get icon for sync status
 */
const getStatusIcon = (status: AssetSyncStatus) => {
  switch (status) {
    case AssetSyncStatus.SYNCED:
      return <CheckCircle2 className="h-5 w-5" />;
    case AssetSyncStatus.PARTIAL:
      return <AlertCircle className="h-5 w-5" />;
    case AssetSyncStatus.FAILED:
      return <XCircle className="h-5 w-5" />;
    case AssetSyncStatus.PENDING:
      return <Clock className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

/**
 * Helper: Get label for sync status
 */
const getStatusLabel = (status: AssetSyncStatus): string => {
  switch (status) {
    case AssetSyncStatus.SYNCED:
      return 'Sincronizado';
    case AssetSyncStatus.PARTIAL:
      return 'Parcial';
    case AssetSyncStatus.FAILED:
      return 'Falhou';
    case AssetSyncStatus.PENDING:
      return 'Pendente';
    default:
      return 'Desconhecido';
  }
};

/**
 * Helper: Get badge color for sync status
 */
const getStatusBadgeColor = (status: AssetSyncStatus): string => {
  switch (status) {
    case AssetSyncStatus.SYNCED:
      return 'bg-success/10 text-success border-success/20';
    case AssetSyncStatus.PARTIAL:
      return 'bg-warning/10 text-warning border-warning/20';
    case AssetSyncStatus.FAILED:
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case AssetSyncStatus.PENDING:
      return 'bg-muted/10 text-muted-foreground border-muted/20';
    default:
      return 'bg-muted/10 text-muted-foreground border-muted/20';
  }
};

/**
 * Helper: Format date to pt-BR
 */
const formatDate = (date: string | null): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Helper: Format last sync timestamp
 */
const formatLastSync = (date: Date | null): string => {
  if (!date) return 'Nunca sincronizado';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Component: SyncStatusTable
 *
 * Displays sync status for all B3 assets using Card grid layout.
 * Features:
 * - KPI cards (total, synced, pending, failed)
 * - Filter buttons (All, SYNCED, PENDING, PARTIAL, FAILED)
 * - Card grid (one per asset)
 * - Status badges (colored)
 * - Action buttons (Re-sync)
 * - Loading/Error states
 */
export function SyncStatusTable() {
  const [filter, setFilter] = useState<'all' | AssetSyncStatus>('all');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: syncStatus, isLoading, error, refetch } = useSyncStatus();

  // Filter assets by status
  const assets = (syncStatus?.assets ?? []) as AssetSyncStatusDto[];
  const filteredAssets = assets.filter(
    (asset) => filter === 'all' || asset.status === filter
  );

  // Summary stats
  const summary = syncStatus?.summary ?? {
    total: 0,
    synced: 0,
    pending: 0,
    failed: 0,
  };

  // Calculate partial count
  const partialCount = summary.total - summary.synced - summary.pending - summary.failed;

  /**
   * FASE 37: Handle individual asset re-sync
   * Opens modal to configure period (startYear, endYear)
   */
  const handleResync = (ticker: string) => {
    setSelectedTicker(ticker);
    setIsModalOpen(true);
  };

  /**
   * Handle modal close
   * Refetch status to show updated data
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTicker(null);
    // Refetch status to update table
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">
          Carregando status de sincronização...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar dados</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Não foi possível carregar o status de sincronização.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Ativos</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-success/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sincronizados</p>
              <p className="text-2xl font-bold">{summary.synced}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-warning/10 p-3">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parciais</p>
              <p className="text-2xl font-bold">{partialCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-muted/10 p-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{summary.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos ({summary.total})
        </Button>
        <Button
          variant={filter === AssetSyncStatus.SYNCED ? 'default' : 'outline'}
          onClick={() => setFilter(AssetSyncStatus.SYNCED)}
        >
          Sincronizados ({summary.synced})
        </Button>
        <Button
          variant={filter === AssetSyncStatus.PARTIAL ? 'default' : 'outline'}
          onClick={() => setFilter(AssetSyncStatus.PARTIAL)}
        >
          Parciais ({partialCount})
        </Button>
        <Button
          variant={filter === AssetSyncStatus.PENDING ? 'default' : 'outline'}
          onClick={() => setFilter(AssetSyncStatus.PENDING)}
        >
          Pendentes ({summary.pending})
        </Button>
        {summary.failed > 0 && (
          <Button
            variant={filter === AssetSyncStatus.FAILED ? 'default' : 'outline'}
            onClick={() => setFilter(AssetSyncStatus.FAILED)}
          >
            Falhou ({summary.failed})
          </Button>
        )}
      </div>

      {/* Assets Grid */}
      <div className="grid gap-4">
        {filteredAssets.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum ativo encontrado</p>
              <p className="text-sm mt-1">
                Tente ajustar os filtros ou recarregar a página.
              </p>
            </div>
          </Card>
        ) : (
          filteredAssets.map((asset) => (
            <Card key={asset.ticker} className="p-6">
              <div className="flex items-start justify-between">
                {/* Asset Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    {/* Status Icon + Ticker */}
                    <div className={cn('flex items-center space-x-2', getStatusColor(asset.status))}>
                      {getStatusIcon(asset.status)}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {asset.ticker}
                        </h3>
                        <p className="text-sm text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      variant="outline"
                      className={cn('rounded-full border', getStatusBadgeColor(asset.status))}
                    >
                      {getStatusLabel(asset.status)}
                    </Badge>
                  </div>

                  {/* Period Badge - DESTAQUE DO PERÍODO DE DADOS */}
                  {asset.oldestDate && asset.newestDate && (
                    <div className="mb-3">
                      <Badge
                        variant="outline"
                        className="bg-primary/5 border-primary/20 text-primary text-sm px-3 py-1.5"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Período dos Dados: {formatDate(asset.oldestDate)} até {formatDate(asset.newestDate)}
                      </Badge>
                    </div>
                  )}

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <BarChart3 className="mr-1 h-4 w-4" />
                        Registros
                      </p>
                      <p className="text-xl font-bold">
                        {new Intl.NumberFormat('pt-BR').format(asset.recordsLoaded)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Data Mais Antiga
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(asset.oldestDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Data Mais Recente
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(asset.newestDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Última Sync
                      </p>
                      <p className="text-sm font-medium">
                        {formatLastSync(asset.lastSyncAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        Duração
                      </p>
                      <p className="text-sm font-medium">
                        {asset.lastSyncDuration !== null
                          ? `${Math.abs(asset.lastSyncDuration).toFixed(2)}s`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResync(asset.ticker)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-Sincronizar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Individual Sync Modal */}
      <IndividualSyncModal
        ticker={selectedTicker}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
