'use client';

import { useMemo, lazy, Suspense, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  FileText,
  Star,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useAsset, useAssetPrices, useAssetFundamentals } from '@/lib/hooks/use-assets';
import { useAnalysis, useRequestAnalysis } from '@/lib/hooks/use-analysis';

// Lazy load heavy components for better LCP
const CandlestickChart = lazy(() => import('@/components/charts/candlestick-chart').then(mod => ({ default: mod.CandlestickChart })));

export default function AssetDetailPage({
  params,
}: {
  params: { ticker: string };
}) {
  const ticker = params.ticker;
  const [selectedRange, setSelectedRange] = useState<string>('1y');

  // Fetch critical data first (for LCP optimization)
  const { data: asset, isLoading: assetLoading, error: assetError } = useAsset(ticker);

  // Defer non-critical data to improve LCP - fetch in parallel after critical data
  const { data: priceHistory, isLoading: pricesLoading } = useAssetPrices(ticker, {
    range: selectedRange,
  });

  // TODO: Fundamentals API not implemented yet - temporarily disabled to avoid 404 errors
  // const { data: fundamentals, isLoading: fundamentalsLoading } = useAssetFundamentals(ticker);
  const fundamentals = null;
  const fundamentalsLoading = false;

  // Defer technical analysis (non-critical for LCP)
  const { data: technicalAnalysis, isLoading: technicalLoading } = useAnalysis(ticker, 'technical');
  const requestAnalysis = useRequestAnalysis();

  // Calculate 52-week high/low from price history
  const weekStats = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return { high52w: null, low52w: null };
    }

    const prices = priceHistory.map((p: any) => Number(p.close));
    return {
      high52w: Math.max(...prices),
      low52w: Math.min(...prices),
    };
  }, [priceHistory]);

  // Handle request technical analysis
  const handleRequestAnalysis = () => {
    requestAnalysis.mutate({ ticker, type: 'technical' });
  };

  const isLoading = assetLoading || pricesLoading;

  // Error state
  if (assetError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Ativo não encontrado</h2>
        <p className="text-muted-foreground">O ticker {ticker.toUpperCase()} não foi encontrado</p>
        <Link href="/assets">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Ativos
          </Button>
        </Link>
      </div>
    );
  }

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
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-32 mb-2" />
                <Skeleton className="h-5 w-48" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">{ticker.toUpperCase()}</h1>
                <p className="text-muted-foreground">{asset?.name || 'Carregando...'}</p>
              </>
            )}
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Preço Atual"
              value={asset?.price ?? 0}
              change={asset?.changePercent ?? undefined}
              format="currency"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Volume"
              value={asset?.volume ?? 0}
              format="number"
              icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Máxima 52 semanas"
              value={weekStats.high52w ?? 0}
              change={undefined}
              format="currency"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Mínima 52 semanas"
              value={weekStats.low52w ?? 0}
              change={undefined}
              format="currency"
              icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
            />
          </>
        )}
      </div>

      {/* Price Chart - Lazy loaded for better LCP */}
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Gráfico de Preços - {selectedRange.toUpperCase()}
            </h3>
            <p className="text-sm text-muted-foreground">
              Evolução do preço com volume negociado
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Período:</span>
            {['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'].map((range) => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range)}
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        {pricesLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : priceHistory && priceHistory.length > 0 ? (
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <CandlestickChart data={priceHistory} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <p>Sem dados de histórico de preços disponíveis</p>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Fundamental Analysis */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Análise Fundamentalista</h3>
            <p className="text-sm text-muted-foreground">
              Principais indicadores fundamentalistas
            </p>
          </div>
          {/* TODO: API de fundamentals não implementada ainda - exibindo mensagem padrão */}
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <p className="text-muted-foreground">Dados fundamentalistas não disponíveis</p>
            <p className="text-xs text-muted-foreground">API em desenvolvimento</p>
          </div>
        </Card>

        {/* Technical Analysis */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Análise Técnica</h3>
              <p className="text-sm text-muted-foreground">
                Indicadores técnicos e sinais
              </p>
            </div>
            {!technicalAnalysis && !technicalLoading && (
              <Button
                size="sm"
                onClick={handleRequestAnalysis}
                disabled={requestAnalysis.isPending}
              >
                {requestAnalysis.isPending ? 'Gerando...' : 'Gerar Análise'}
              </Button>
            )}
          </div>
          {technicalLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : technicalAnalysis?.indicators ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">Sinal Geral</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  technicalAnalysis.recommendation === 'STRONG_BUY' || technicalAnalysis.recommendation === 'BUY'
                    ? 'bg-success text-success-foreground'
                    : technicalAnalysis.recommendation === 'STRONG_SELL' || technicalAnalysis.recommendation === 'SELL'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {technicalAnalysis.recommendation || 'NEUTRO'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">RSI (14)</p>
                  <p className="text-xl font-bold">{technicalAnalysis.indicators.rsi?.toFixed(1) ?? 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MACD</p>
                  <p className="text-xl font-bold">
                    {technicalAnalysis.indicators.macd?.histogram > 0 ? 'Compra' : 'Venda'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SMA 20</p>
                  <p className="text-xl font-bold">
                    R$ {technicalAnalysis.indicators.sma20?.toFixed(2) ?? 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SMA 50</p>
                  <p className="text-xl font-bold">
                    R$ {technicalAnalysis.indicators.sma50?.toFixed(2) ?? 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SMA 200</p>
                  <p className="text-xl font-bold">
                    R$ {technicalAnalysis.indicators.sma200?.toFixed(2) ?? 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">EMA 12</p>
                  <p className="text-xl font-bold">
                    R$ {technicalAnalysis.indicators.ema12?.toFixed(2) ?? 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <p className="text-muted-foreground">Análise técnica não disponível</p>
              <p className="text-sm text-muted-foreground">
                Clique em &quot;Gerar Análise&quot; para criar uma nova análise
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
