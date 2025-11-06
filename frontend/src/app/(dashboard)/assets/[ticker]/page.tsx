'use client';

import { use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceChart } from '@/components/charts/price-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  FileText,
  Star,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const mockPriceData = Array.from({ length: 90 }, (_, i) => {
  const basePrice = 38 + Math.random() * 5;
  return {
    date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    open: basePrice,
    high: basePrice + Math.random() * 2,
    low: basePrice - Math.random() * 2,
    close: basePrice + Math.random() * 2 - 1,
    volume: Math.floor(Math.random() * 50000000) + 10000000,
  };
});

const mockFundamentals = {
  pl: 8.5,
  pvp: 1.2,
  roe: 18.5,
  dividendYield: 12.3,
  debtEquity: 0.45,
  currentRatio: 1.8,
  grossMargin: 42.5,
  netMargin: 15.2,
};

const mockTechnicalIndicators = {
  rsi: 62.5,
  macd: 'Compra',
  sma20: 37.8,
  sma50: 36.5,
  sma200: 35.2,
  bollingerUpper: 40.2,
  bollingerLower: 35.8,
  signal: 'COMPRA',
};

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ticker.toUpperCase()}</h1>
            <p className="text-muted-foreground">
              Petrobras Preferencial
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Star className="mr-2 h-4 w-4" />
            Adicionar aos Favoritos
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Preço Atual"
          value={38.45}
          change={2.34}
          format="currency"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Volume"
          value={125000000}
          format="number"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Máxima 52 semanas"
          value={42.15}
          change={5.67}
          format="currency"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Mínima 52 semanas"
          value={32.10}
          change={-12.34}
          format="currency"
          icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Gráfico de Preços - Últimos 90 dias</h3>
          <p className="text-sm text-muted-foreground">
            Evolução do preço com volume negociado
          </p>
        </div>
        <PriceChart data={mockPriceData} />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Análise Fundamentalista</h3>
            <p className="text-sm text-muted-foreground">
              Principais indicadores fundamentalistas
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">P/L</p>
              <p className="text-2xl font-bold">{mockFundamentals.pl.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">P/VP</p>
              <p className="text-2xl font-bold">{mockFundamentals.pvp.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ROE</p>
              <p className="text-2xl font-bold">{mockFundamentals.roe.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Div. Yield</p>
              <p className="text-2xl font-bold">{mockFundamentals.dividendYield.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dívida/PL</p>
              <p className="text-2xl font-bold">{mockFundamentals.debtEquity.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Liquidez Corrente</p>
              <p className="text-2xl font-bold">{mockFundamentals.currentRatio.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Margem Bruta</p>
              <p className="text-2xl font-bold">{mockFundamentals.grossMargin.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Margem Líquida</p>
              <p className="text-2xl font-bold">{mockFundamentals.netMargin.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Análise Técnica</h3>
            <p className="text-sm text-muted-foreground">
              Indicadores técnicos e sinais
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Sinal Geral</span>
              <span className="rounded-full bg-success px-3 py-1 text-sm font-semibold text-success-foreground">
                {mockTechnicalIndicators.signal}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">RSI (14)</p>
                <p className="text-xl font-bold">{mockTechnicalIndicators.rsi.toFixed(1)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">MACD</p>
                <p className="text-xl font-bold">{mockTechnicalIndicators.macd}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">SMA 20</p>
                <p className="text-xl font-bold">R$ {mockTechnicalIndicators.sma20.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">SMA 50</p>
                <p className="text-xl font-bold">R$ {mockTechnicalIndicators.sma50.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">SMA 200</p>
                <p className="text-xl font-bold">R$ {mockTechnicalIndicators.sma200.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Bollinger Superior</p>
                <p className="text-xl font-bold">R$ {mockTechnicalIndicators.bollingerUpper.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
