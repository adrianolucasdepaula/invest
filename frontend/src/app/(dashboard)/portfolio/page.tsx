'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Upload,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';

const mockPortfolio = {
  totalValue: 125430.50,
  totalInvested: 109195.60,
  totalGain: 16234.90,
  totalGainPercent: 14.87,
  dayGain: 1234.56,
  dayGainPercent: 0.99,
};

const mockPositions = [
  {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    quantity: 500,
    averagePrice: 32.50,
    currentPrice: 38.45,
    totalValue: 19225.00,
    gain: 2975.00,
    gainPercent: 18.31,
    weight: 15.33,
  },
  {
    ticker: 'VALE3',
    name: 'Vale ON',
    quantity: 300,
    averagePrice: 62.10,
    currentPrice: 65.78,
    totalValue: 19734.00,
    gain: 1104.00,
    gainPercent: 5.93,
    weight: 15.73,
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    quantity: 800,
    averagePrice: 26.75,
    currentPrice: 28.90,
    totalValue: 23120.00,
    gain: 1720.00,
    gainPercent: 8.04,
    weight: 18.43,
  },
  {
    ticker: 'BBDC4',
    name: 'Bradesco PN',
    quantity: 1000,
    averagePrice: 13.20,
    currentPrice: 14.56,
    totalValue: 14560.00,
    gain: 1360.00,
    gainPercent: 10.30,
    weight: 11.61,
  },
  {
    ticker: 'WEGE3',
    name: 'WEG ON',
    quantity: 400,
    averagePrice: 38.90,
    currentPrice: 42.15,
    totalValue: 16860.00,
    gain: 1300.00,
    gainPercent: 8.36,
    weight: 13.44,
  },
];

export default function PortfolioPage() {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

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
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Posição
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Valor Total"
          value={mockPortfolio.totalValue}
          format="currency"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Valor Investido"
          value={mockPortfolio.totalInvested}
          format="currency"
          icon={<PieChart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Ganho Total"
          value={mockPortfolio.totalGain}
          change={mockPortfolio.totalGainPercent}
          format="currency"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Ganho do Dia"
          value={mockPortfolio.dayGain}
          change={mockPortfolio.dayGainPercent}
          format="currency"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-2 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Posições</h3>
            <p className="text-sm text-muted-foreground">
              {mockPositions.length} ativos no portfólio
            </p>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
              <div className="col-span-2">Ticker</div>
              <div className="col-span-1 text-right">Qtd.</div>
              <div className="col-span-2 text-right">Preço Médio</div>
              <div className="col-span-2 text-right">Preço Atual</div>
              <div className="col-span-2 text-right">Valor Total</div>
              <div className="col-span-2 text-right">Ganho</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
            {mockPositions.map((position) => (
              <div
                key={position.ticker}
                className={cn(
                  'grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-colors hover:bg-accent cursor-pointer',
                  selectedPosition === position.ticker && 'bg-accent',
                )}
                onClick={() => setSelectedPosition(position.ticker)}
              >
                <div className="col-span-2">
                  <p className="font-semibold">{position.ticker}</p>
                  <p className="text-xs text-muted-foreground">{position.name}</p>
                </div>
                <div className="col-span-1 text-right font-medium">
                  {position.quantity}
                </div>
                <div className="col-span-2 text-right">
                  {formatCurrency(position.averagePrice)}
                </div>
                <div className="col-span-2 text-right font-medium">
                  {formatCurrency(position.currentPrice)}
                </div>
                <div className="col-span-2 text-right font-semibold">
                  {formatCurrency(position.totalValue)}
                </div>
                <div className="col-span-2 text-right">
                  <div className={cn('font-semibold', getChangeColor(position.gain))}>
                    {formatCurrency(position.gain)}
                  </div>
                  <div className={cn('text-xs', getChangeColor(position.gainPercent))}>
                    {formatPercent(position.gainPercent)}
                  </div>
                </div>
                <div className="col-span-1 flex items-center justify-end space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Distribuição</h3>
            <p className="text-sm text-muted-foreground">
              Peso de cada ativo no portfólio
            </p>
          </div>
          <div className="space-y-3">
            {mockPositions.map((position) => (
              <div key={position.ticker} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{position.ticker}</span>
                  <span className="text-muted-foreground">{formatPercent(position.weight)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${position.weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
