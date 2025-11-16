'use client';

import { useMemo, lazy, Suspense, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { MultiPaneChart } from '@/components/charts/multi-pane-chart';
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

export default function AssetDetailPage({
  params,
}: {
  params: { ticker: string };
}) {
  const ticker = params.ticker;
  const [selectedRange, setSelectedRange] = useState<string>('1y');

  // Fetch critical data first (for LCP optimization)
  const { data: asset, isLoading: assetLoading, error: assetError } = useAsset(ticker);

  // Technical chart state
  const [technicalData, setTechnicalData] = useState<any>(null);
  const [technicalLoading, setTechnicalLoading] = useState(false);
  const [showAdvancedChart, setShowAdvancedChart] = useState(false);
  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    sma50: true,
    sma200: false,
    ema9: false,
    ema21: false,
    bollinger: false,
    pivotPoints: false,
    rsi: true,
    macd: true,
    stochastic: false,
  });

  // Defer non-critical data to improve LCP - fetch in parallel after critical data
  const { data: priceHistory, isLoading: pricesLoading } = useAssetPrices(ticker, {
    range: selectedRange,
  });

  // TODO: Fundamentals API not implemented yet - temporarily disabled to avoid 404 errors
  // const { data: fundamentals, isLoading: fundamentalsLoading } = useAssetFundamentals(ticker);
  const fundamentals = null;
  const fundamentalsLoading = false;

  // Fetch technical data from backend when advanced chart is enabled
  useEffect(() => {
    if (!showAdvancedChart) {
      setTechnicalData(null);
      return;
    }

    const fetchTechnicalData = async () => {
      setTechnicalLoading(true);
      try {
        const timeframeMap: Record<string, string> = {
          '1d': '1D',
          '1mo': '1MO',
          '3mo': '3MO',
          '6mo': '6MO',
          '1y': '1Y',
          '2y': '2Y',
          '5y': '5Y',
          'max': 'MAX',
        };
        const timeframe = timeframeMap[selectedRange] || '1Y';

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/market-data/${ticker}/technical?timeframe=${timeframe}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch technical data');

        const data = await response.json();
        setTechnicalData(data);

        // Log metadata (cache hit/miss, duration, errors)
        console.log('Technical data metadata:', data.metadata);

        // Show warning if insufficient data
        if (data.metadata.error === 'INSUFFICIENT_DATA') {
          console.warn(
            `Insufficient data: ${data.metadata.available}/${data.metadata.required} points`
          );
        }
      } catch (error) {
        console.error('Error fetching technical data:', error);
      } finally {
        setTechnicalLoading(false);
      }
    };

    fetchTechnicalData();
  }, [ticker, selectedRange, showAdvancedChart]);

  // Calculate period high/low from price history
  const periodStats = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return { high: null, low: null };
    }

    const prices = priceHistory.map((p: any) => Number(p.close));
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }, [priceHistory]);

  // Get period label for display
  const periodLabel = useMemo(() => {
    const labels: Record<string, string> = {
      '1d': '1 dia',
      '1mo': '1 mês',
      '3mo': '3 meses',
      '6mo': '6 meses',
      '1y': '1 ano',
      '2y': '2 anos',
      '5y': '5 anos',
      'max': 'histórico',
    };
    return labels[selectedRange] || selectedRange;
  }, [selectedRange]);

  const handleIndicatorToggle = (indicator: keyof typeof showIndicators) => {
    setShowIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
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
              title={`Máxima ${periodLabel}`}
              value={periodStats.high ?? 0}
              change={undefined}
              format="currency"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title={`Mínima ${periodLabel}`}
              value={periodStats.low ?? 0}
              change={undefined}
              format="currency"
              icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
            />
          </>
        )}
      </div>

      {/* Advanced Chart Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Gráfico Avançado com Indicadores Técnicos</h3>
            <p className="text-xs text-muted-foreground">
              Habilite para visualizar gráficos multi-pane com RSI, MACD, Stochastic e mais
            </p>
          </div>
          <Button
            variant={showAdvancedChart ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdvancedChart(!showAdvancedChart)}
            disabled={technicalLoading}
          >
            {technicalLoading ? 'Carregando...' : showAdvancedChart ? 'Modo Avançado' : 'Ativar Modo Avançado'}
          </Button>
        </div>
      </Card>

      {/* Indicator Toggles (only when advanced chart is active) */}
      {showAdvancedChart && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Indicadores</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(showIndicators).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={value}
                  onCheckedChange={() => handleIndicatorToggle(key as keyof typeof showIndicators)}
                />
                <label
                  htmlFor={key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Price Chart */}
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {showAdvancedChart ? 'Análise Técnica Avançada' : `Gráfico de Preços - ${selectedRange.toUpperCase()}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {showAdvancedChart
                ? 'Gráficos multi-pane com indicadores técnicos sincronizados'
                : 'Evolução do preço com volume negociado'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Período:</span>
            {['1d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'].map((range) => (
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
        {isLoading || (showAdvancedChart && technicalLoading) ? (
          <Skeleton className="h-[400px] w-full" />
        ) : showAdvancedChart && technicalData?.prices && technicalData?.indicators ? (
          <MultiPaneChart
            data={technicalData.prices}
            indicators={technicalData.indicators}
            showIndicators={showIndicators}
          />
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <p>
              {showAdvancedChart
                ? 'Dados insuficientes para gráfico avançado. Tente um período maior.'
                : priceHistory && priceHistory.length > 0
                ? 'Habilite o Modo Avançado para visualizar indicadores técnicos'
                : 'Sem dados de histórico de preços disponíveis'}
            </p>
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

        {/* Technical Analysis Summary */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Resumo de Indicadores</h3>
              <p className="text-sm text-muted-foreground">
                Valores atuais dos principais indicadores técnicos
              </p>
            </div>
          </div>
          {technicalLoading || (showAdvancedChart && !technicalData) ? (
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
          ) : showAdvancedChart && technicalData?.indicators ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">RSI (14)</p>
                  <p className="text-xl font-bold">
                    {technicalData.indicators.rsi
                      ? technicalData.indicators.rsi[technicalData.indicators.rsi.length - 1]?.toFixed(1)
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MACD</p>
                  <p className="text-xl font-bold">
                    {technicalData.indicators.macd?.histogram
                      ? technicalData.indicators.macd.histogram[
                          technicalData.indicators.macd.histogram.length - 1
                        ] > 0
                        ? 'Compra'
                        : 'Venda'
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SMA 20</p>
                  <p className="text-xl font-bold">
                    {technicalData.indicators.sma20
                      ? `R$ ${technicalData.indicators.sma20[technicalData.indicators.sma20.length - 1]?.toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SMA 50</p>
                  <p className="text-xl font-bold">
                    {technicalData.indicators.sma50
                      ? `R$ ${technicalData.indicators.sma50[technicalData.indicators.sma50.length - 1]?.toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SMA 200</p>
                  <p className="text-xl font-bold">
                    {technicalData.indicators.sma200
                      ? `R$ ${technicalData.indicators.sma200[technicalData.indicators.sma200.length - 1]?.toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">EMA 12</p>
                  <p className="text-xl font-bold">
                    {technicalData.indicators.ema12
                      ? `R$ ${technicalData.indicators.ema12[technicalData.indicators.ema12.length - 1]?.toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <p className="text-muted-foreground">
                {showAdvancedChart
                  ? 'Dados insuficientes para indicadores técnicos'
                  : 'Habilite o Modo Avançado para visualizar indicadores'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
