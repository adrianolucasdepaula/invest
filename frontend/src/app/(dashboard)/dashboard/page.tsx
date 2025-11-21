'use client';

import { useMemo } from 'react';
import { useAssets } from '@/lib/hooks/use-assets';
import { StatCard } from '@/components/dashboard/stat-card';
import { AssetTable } from '@/components/dashboard/asset-table';
import { MarketIndices } from '@/components/dashboard/market-indices';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: assets, isLoading, error } = useAssets({ limit: 10 });

  // Calculate real stats from assets data
  const stats = useMemo(() => {
    if (!assets || assets.length === 0) {
      return {
        ibovespa: { value: null, change: null },
        topGainers: 0,
        topLosers: 0,
        activeAssets: 0,
        avgChange: null,
      };
    }

    // Find Ibovespa (^BVSP) or use first index asset
    const ibovespaAsset = assets.find((a: any) =>
      a.ticker === '^BVSP' || a.ticker === 'IBOV' || a.name?.includes('Ibovespa')
    );

    const topGainers = assets.filter((a: any) => a.changePercent && a.changePercent > 0).length;
    const topLosers = assets.filter((a: any) => a.changePercent && a.changePercent < 0).length;
    const activeAssets = assets.length;
    const avgChange = assets.reduce((sum: number, a: any) => sum + (a.changePercent || 0), 0) / assets.length;

    return {
      ibovespa: {
        value: ibovespaAsset?.price || null,
        change: ibovespaAsset?.changePercent || null,
      },
      topGainers,
      topLosers,
      activeAssets,
      avgChange,
    };
  }, [assets]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do mercado e do seu portfólio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Ibovespa"
              value={stats.ibovespa.value ?? 0}
              change={stats.ibovespa.change ?? undefined}
              format="number"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Ativos Rastreados"
              value={stats.activeAssets}
              change={stats.avgChange ?? undefined}
              format="number"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Maiores Altas"
              value={stats.topGainers}
              change={undefined}
              format="number"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Variação Média"
              value={stats.avgChange ?? 0}
              change={undefined}
              format="percent"
              icon={stats.avgChange && stats.avgChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              )}
            />
          </>
        )}
      </div>

      {/* Painel de Índices em Destaque (col-span-7 = largura completa) */}
      <div className="grid gap-4 md:grid-cols-1">
        <MarketIndices />
      </div>

      {/* Maiores Altas e Maiores Baixas (lado a lado) */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Maiores Altas */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Maiores Altas</h3>
            <p className="text-sm text-muted-foreground">
              Ativos com melhor performance hoje
            </p>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))
            ) : error ? (
              <p className="text-sm text-destructive">Erro ao carregar ativos</p>
            ) : (
              assets
                ?.filter((asset: any) => asset.changePercent && asset.changePercent > 0)
                .sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0))
                .slice(0, 5)
                .map((asset: any) => (
                  <div key={asset.ticker} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{asset.ticker}</p>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {asset.price
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(asset.price)
                          : 'N/A'}
                      </p>
                      <p
                        className={`text-sm ${
                          (asset.changePercent || 0) >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {(asset.changePercent || 0) >= 0 ? '+' : ''}
                        {asset.changePercent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        {/* Maiores Baixas */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Maiores Baixas</h3>
            <p className="text-sm text-muted-foreground">
              Ativos com pior performance hoje
            </p>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))
            ) : error ? (
              <p className="text-sm text-destructive">Erro ao carregar ativos</p>
            ) : (
              assets
                ?.filter((asset: any) => asset.changePercent && asset.changePercent < 0)
                .sort((a: any, b: any) => (a.changePercent || 0) - (b.changePercent || 0))
                .slice(0, 5)
                .map((asset: any) => (
                  <div key={asset.ticker} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{asset.ticker}</p>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {asset.price
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(asset.price)
                          : 'N/A'}
                      </p>
                      <p
                        className={`text-sm ${
                          (asset.changePercent || 0) >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {(asset.changePercent || 0) >= 0 ? '+' : ''}
                        {asset.changePercent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Ativos em Destaque</h3>
          <p className="text-sm text-muted-foreground">
            Principais ativos do mercado brasileiro
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Erro ao carregar ativos</p>
        ) : (
          <AssetTable assets={assets || []} />
        )}
      </Card>
    </div>
  );
}
