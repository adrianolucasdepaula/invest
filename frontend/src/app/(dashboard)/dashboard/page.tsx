'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/dashboard/stat-card';
import { AssetTable } from '@/components/dashboard/asset-table';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { MarketChart } from '@/components/charts/market-chart';

// Mock data - substituir com chamadas reais à API
const mockStats = {
  ibovespa: { value: 127453.68, change: 1.23 },
  portfolio: { value: 125430.50, change: 2.45 },
  dayGain: { value: 3456.78, change: 1.85 },
  totalGain: { value: 15234.90, change: 13.85 },
};

const mockAssets = [
  { ticker: 'PETR4', name: 'Petrobras PN', price: 38.45, change: 2.34, changePercent: 2.34, volume: 125000000, marketCap: 500000000000 },
  { ticker: 'VALE3', name: 'Vale ON', price: 65.78, change: -1.12, changePercent: -1.12, volume: 98000000, marketCap: 350000000000 },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', price: 28.90, change: 0.87, changePercent: 0.87, volume: 67000000, marketCap: 280000000000 },
  { ticker: 'BBDC4', name: 'Bradesco PN', price: 14.56, change: 1.45, changePercent: 1.45, volume: 89000000, marketCap: 150000000000 },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', price: 25.34, change: -0.34, changePercent: -0.34, volume: 45000000, marketCap: 120000000000 },
];

export default function DashboardPage() {
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
            {mockAssets.slice(0, 5).map((asset) => (
              <div key={asset.ticker} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{asset.ticker}</p>
                  <p className="text-sm text-muted-foreground">{asset.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(asset.price)}
                  </p>
                  <p
                    className={`text-sm ${
                      asset.change >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {asset.change >= 0 ? '+' : ''}
                    {asset.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
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
        <AssetTable assets={mockAssets} />
      </Card>
    </div>
  );
}
