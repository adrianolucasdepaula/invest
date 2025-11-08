'use client';

import { useAssets } from '@/lib/hooks/use-assets';
import { StatCard } from '@/components/dashboard/stat-card';
import { AssetTable } from '@/components/dashboard/asset-table';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { MarketChart } from '@/components/charts/market-chart';
import { Skeleton } from '@/components/ui/skeleton';

// Mock stats - TODO: Integrate with real portfolio data
const mockStats = {
  ibovespa: { value: 127453.68, change: 1.23 },
  portfolio: { value: 125430.50, change: 2.45 },
  dayGain: { value: 3456.78, change: 1.85 },
  totalGain: { value: 15234.90, change: 13.85 },
};

export default function DashboardPage() {
  const { data: assets, isLoading, error } = useAssets({ limit: 10 });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do mercado e do seu portfólio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ibovespa"
          value={mockStats.ibovespa.value}
          change={mockStats.ibovespa.change}
          format="number"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Valor do Portfólio"
          value={mockStats.portfolio.value}
          change={mockStats.portfolio.change}
          format="currency"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Ganho do Dia"
          value={mockStats.dayGain.value}
          change={mockStats.dayGain.change}
          format="currency"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Ganho Total"
          value={mockStats.totalGain.value}
          change={mockStats.totalGain.change}
          format="currency"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Ibovespa - Últimos 30 dias</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe a evolução do principal índice da B3
            </p>
          </div>
          <MarketChart />
        </Card>

        <Card className="col-span-3 p-6">
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
