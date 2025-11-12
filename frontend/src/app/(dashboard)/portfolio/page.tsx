'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/dashboard/stat-card';
import { ImportPortfolioDialog } from '@/components/portfolio/import-portfolio-dialog';
import { AddPositionDialog } from '@/components/portfolio/add-position-dialog';
import { EditPositionDialog } from '@/components/portfolio/edit-position-dialog';
import { DeletePositionDialog } from '@/components/portfolio/delete-position-dialog';
import {
  AssetUpdateButton,
  OutdatedBadge,
  BatchUpdateControls,
} from '@/components/assets';
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Upload,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { usePortfolios, useCreatePortfolio } from '@/lib/hooks/use-portfolio';
import { useAssets } from '@/lib/hooks/use-assets';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

export default function PortfolioPage() {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: portfolios, isLoading: portfoliosLoading, refetch: refetchPortfolios } = usePortfolios();
  const { data: assets, refetch: refetchAssets } = useAssets();
  const createPortfolio = useCreatePortfolio();

  // Force cache invalidation on mount to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });
  }, [queryClient]);

  // Get first portfolio or create default
  const portfolio = useMemo(() => {
    if (!portfolios || portfolios.length === 0) return null;
    return portfolios[0];
  }, [portfolios]);

  // Create portfolio map for quick asset lookups
  const assetMap = useMemo(() => {
    if (!assets) return new Map();
    return new Map(assets.map((a: any) => [a.id, a]));
  }, [assets]);

  // Enrich positions with current prices from assets
  const enrichedPositions = useMemo(() => {
    if (!portfolio?.positions) return [];

    return portfolio.positions.map((position: any) => {
      const asset = assetMap.get(position.assetId) || position.asset;
      const currentPrice = asset?.price || position.currentPrice || position.averagePrice;
      const totalValue = position.quantity * currentPrice;
      const gain = totalValue - position.totalInvested;
      const gainPercent = (gain / position.totalInvested) * 100;

      return {
        ...position,
        ticker: asset?.ticker || position.asset?.ticker || 'N/A',
        name: asset?.name || position.asset?.name || 'Desconhecido',
        currentPrice,
        totalValue,
        gain,
        gainPercent,
      };
    });
  }, [portfolio?.positions, assetMap]);

  // Calculate portfolio stats
  const stats = useMemo(() => {
    if (!enrichedPositions || enrichedPositions.length === 0) {
      return {
        totalValue: 0,
        totalInvested: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayGain: 0,
        dayGainPercent: 0,
      };
    }

    const totalValue = enrichedPositions.reduce((sum: number, p: any) => sum + p.totalValue, 0);
    const totalInvested = enrichedPositions.reduce((sum: number, p: any) => sum + Number(p.totalInvested || 0), 0);
    const totalGain = totalValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // Calculate day gain from asset changes
    // Only count gains for positions bought before today
    const dayGain = enrichedPositions.reduce((sum: number, p: any) => {
      const asset = assetMap.get(p.assetId);

      // Check if position was bought today (compare date parts only, ignore time/timezone)
      if (p.firstBuyDate) {
        // IMPORTANT: Parse the date string (YYYY-MM-DD) and create a local date
        // This prevents timezone issues when the backend sends UTC dates
        const [year, month, day] = p.firstBuyDate.split('-').map(Number);
        const buyDate = new Date(year, month - 1, day); // month is 0-indexed

        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const isBoughtToday =
          buyDate.getFullYear() === todayDate.getFullYear() &&
          buyDate.getMonth() === todayDate.getMonth() &&
          buyDate.getDate() === todayDate.getDate();

        // If bought today, no day gain/loss (you didn't own it yesterday)
        if (isBoughtToday) {
          return sum;
        }
      }
      // IMPORTANT: If firstBuyDate is null, we can't determine when it was bought
      // For safety, assume it's an old position and include it in day gain calculation
      // This is the correct behavior for positions migrated before firstBuyDate field existed

      const dayChange = asset?.change || 0;
      return sum + (dayChange * p.quantity);
    }, 0);
    const dayGainPercent = totalValue > 0 ? (dayGain / totalValue) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalGain,
      totalGainPercent,
      dayGain,
      dayGainPercent,
    };
  }, [enrichedPositions, assetMap]);

  // Calculate distribution weights
  const distributionData = useMemo(() => {
    if (!enrichedPositions || enrichedPositions.length === 0 || stats.totalValue === 0) {
      return [];
    }

    return enrichedPositions.map((position: any) => ({
      ticker: position.ticker,
      weight: (position.totalValue / stats.totalValue) * 100,
    }));
  }, [enrichedPositions, stats.totalValue]);

  // Handle create default portfolio
  const handleCreateDefaultPortfolio = async () => {
    try {
      await createPortfolio.mutateAsync({
        name: 'Meu Portfólio',
        description: 'Portfólio principal de investimentos',
      });
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  // Loading state
  if (portfoliosLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // No portfolio state
  if (!portfolio) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfólio</h1>
            <p className="text-muted-foreground">
              Gerencie suas posições e acompanhe seu desempenho
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Nenhum portfólio encontrado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Você ainda não possui um portfólio. Crie um novo portfólio para começar a
            gerenciar seus investimentos.
          </p>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreateDefaultPortfolio} disabled={createPortfolio.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {createPortfolio.isPending ? 'Criando...' : 'Criar Portfólio'}
            </Button>
            <ImportPortfolioDialog
              trigger={
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfólio</h1>
          <p className="text-muted-foreground">
            Gerencie suas posições e acompanhe seu desempenho
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ImportPortfolioDialog
            trigger={
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            }
          />
          <AddPositionDialog
            portfolioId={portfolio.id}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Posição
              </Button>
            }
            onSuccess={() => {
              refetchPortfolios();
              refetchAssets();
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Valor Total"
          value={stats.totalValue}
          format="currency"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Valor Investido"
          value={stats.totalInvested}
          format="currency"
          icon={<PieChart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Ganho Total"
          value={stats.totalGain}
          change={stats.totalGainPercent || undefined}
          format="currency"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Ganho do Dia"
          value={stats.dayGain}
          change={stats.dayGainPercent || undefined}
          format="currency"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Asset Updates Section */}
      {portfolio && user?.id && (
        <BatchUpdateControls
          portfolioId={portfolio.id}
          userId={user.id}
          onUpdateComplete={() => {
            refetchPortfolios();
            refetchAssets();
          }}
        />
      )}

      <div className="space-y-4">
        <Card className="p-6 relative z-10">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Posições</h3>
            <p className="text-sm text-muted-foreground">
              {enrichedPositions.length} ativos no portfólio
            </p>
          </div>
          {enrichedPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <p className="text-muted-foreground">Nenhuma posição no portfólio</p>
              <p className="text-sm text-muted-foreground">
                Adicione posições para começar a acompanhar seus investimentos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[minmax(150px,2fr)_minmax(120px,1.5fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1.5fr)_minmax(120px,1.5fr)_minmax(140px,1.5fr)] gap-3 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                <div>Ticker</div>
                <div>Status</div>
                <div className="text-right">Qtd.</div>
                <div className="text-right">Preço Médio</div>
                <div className="text-right">Preço Atual</div>
                <div className="text-right">Valor Total</div>
                <div className="text-right">Ganho</div>
                <div className="text-right">Ações</div>
              </div>
              {enrichedPositions.map((position: any) => {
                const asset = assetMap.get(position.assetId);
                return (
                  <div
                    key={position.id}
                    className={cn(
                      'grid grid-cols-[minmax(150px,2fr)_minmax(120px,1.5fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1.5fr)_minmax(120px,1.5fr)_minmax(140px,1.5fr)] gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent cursor-pointer',
                      selectedPosition === position.id && 'bg-accent',
                    )}
                    onClick={() => setSelectedPosition(position.id)}
                  >
                    <div>
                      <p className="font-semibold">{position.ticker}</p>
                      <p className="text-xs text-muted-foreground truncate">{position.name}</p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      {asset && (
                        <OutdatedBadge
                          lastUpdated={asset.lastUpdated}
                          lastUpdateStatus={asset.lastUpdateStatus}
                          lastUpdateError={asset.lastUpdateError}
                          updateRetryCount={asset.updateRetryCount}
                          showTime={false}
                        />
                      )}
                    </div>
                    <div className="text-right font-medium">
                      {Number(position.quantity).toLocaleString('pt-BR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <div className="text-right">
                      {formatCurrency(position.averagePrice)}
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(position.currentPrice)}
                    </div>
                    <div className="text-right font-semibold">
                      {formatCurrency(position.totalValue)}
                    </div>
                    <div className="text-right">
                      <div className={cn('font-semibold text-sm', getChangeColor(position.gain))}>
                        {formatCurrency(position.gain)}
                      </div>
                      <div className={cn('text-xs', getChangeColor(position.gainPercent))}>
                        {formatPercent(position.gainPercent)}
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                      {user?.id && (
                        <AssetUpdateButton
                          ticker={position.ticker}
                          userId={user.id}
                          variant="icon"
                          size="icon"
                          showLabel={false}
                          onUpdateComplete={() => {
                            refetchAssets();
                            refetchPortfolios();
                          }}
                        />
                      )}
                      <EditPositionDialog
                        portfolioId={portfolio.id}
                        position={{
                          id: position.id,
                          ticker: position.ticker,
                          quantity: position.quantity,
                          averagePrice: position.averagePrice,
                        }}
                        onSuccess={() => {
                          refetchPortfolios();
                          refetchAssets();
                        }}
                      />
                      <DeletePositionDialog
                        portfolioId={portfolio.id}
                        positionId={position.id}
                        ticker={position.ticker}
                        onSuccess={() => {
                          refetchPortfolios();
                          refetchAssets();
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 relative z-0">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Distribuição</h3>
            <p className="text-sm text-muted-foreground">
              Peso de cada ativo no portfólio
            </p>
          </div>
          {distributionData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <p className="text-sm text-muted-foreground">Sem dados de distribuição</p>
            </div>
          ) : (
            <div className="space-y-3">
              {distributionData.map((item: any) => (
                <div key={item.ticker} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.ticker}</span>
                    <span className="text-muted-foreground">{formatPercent(item.weight)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-primary transition-all pointer-events-none"
                      style={{ width: `${item.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
