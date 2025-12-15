'use client';

import { useMemo, lazy, Suspense, useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { MultiPaneChart } from '@/components/charts/multi-pane-chart';
import {
  TimeframeRangePicker,
  type CandleTimeframe,
  type ViewingRange,
} from '@/components/charts/timeframe-range-picker';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  FileText,
  Star,
  ArrowLeft,
  AlertCircle,
  CircleDollarSign,
  Activity,
  Clock,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { useAsset, useMarketDataPrices, useAssetFundamentals, useAssetDataSources } from '@/lib/hooks/use-assets';
import { DataQualitySummary } from '@/components/assets/DataSourceIndicator';
import { ChartErrorBoundary } from '@/components/error-boundary';
import { useAnalysis, useRequestAnalysis } from '@/lib/hooks/use-analysis';
import { AdvancedChart } from '@/components/tradingview/widgets/AdvancedChart';
import FundamentalIndicatorsTable from '@/components/FundamentalIndicatorsTable';
import { TickerNews } from '@/components/assets/ticker-news';
import { TickerSentimentThermometer } from '@/components/assets/ticker-sentiment-thermometer';

export function AssetDetailPageClient({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const [selectedTimeframe, setSelectedTimeframe] = useState<CandleTimeframe>('1D');
  const [selectedRange, setSelectedRange] = useState<ViewingRange>('1y');
  const [showUnifiedHistory, setShowUnifiedHistory] = useState(false);

  // Fetch critical data first (for LCP optimization)
  const { data: asset, isLoading: assetLoading, error: assetError } = useAsset(ticker);


  // Technical chart state (Advanced mode is now DEFAULT)
  const [technicalData, setTechnicalData] = useState<any>(null);
  const [technicalLoading, setTechnicalLoading] = useState(false);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
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
  const { data: priceHistory, isLoading: pricesLoading } = useMarketDataPrices(ticker, {
    timeframe: selectedTimeframe,
    range: selectedRange,
    unified: showUnifiedHistory,
  });

  // TODO: Fundamentals API not implemented yet - temporarily disabled to avoid 404 errors
  // const { data: fundamentals, isLoading: fundamentalsLoading } = useAssetFundamentals(ticker);
  const fundamentals = null;
  const fundamentalsLoading = false;

  // Fetch data sources information for quality indicators
  const { data: dataSources, isLoading: dataSourcesLoading } = useAssetDataSources(ticker);

  // Fetch technical data from backend (ALWAYS - advanced mode is default)
  useEffect(() => {
    const fetchTechnicalData = async () => {
      setTechnicalLoading(true);
      setTechnicalError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/market-data/${ticker}/technical?timeframe=${selectedTimeframe}&range=${selectedRange}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch technical data: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Transform backend property names (snake_case) to frontend format (camelCase)
        // Backend: sma_20, sma_50, sma_200, ema_9, ema_21, bollinger_bands, macd.macd
        // Frontend: sma20, sma50, sma200, ema9, ema21, bollinger, macd.line
        const transformedData = {
          ...data,
          indicators: data.indicators
            ? {
                // Moving Averages (snake_case to camelCase)
                sma20: data.indicators.sma_20,
                sma50: data.indicators.sma_50,
                sma200: data.indicators.sma_200,
                ema9: data.indicators.ema_9,
                ema21: data.indicators.ema_21,
                // RSI (no transformation needed)
                rsi: data.indicators.rsi,
                // MACD (rename macd.macd to macd.line)
                macd: data.indicators.macd
                  ? {
                      line: data.indicators.macd.macd,
                      signal: data.indicators.macd.signal,
                      histogram: data.indicators.macd.histogram,
                    }
                  : undefined,
                // Stochastic (no transformation needed)
                stochastic: data.indicators.stochastic,
                // Bollinger Bands (rename bollinger_bands to bollinger)
                bollinger: data.indicators.bollinger_bands
                  ? {
                      upper: data.indicators.bollinger_bands.upper,
                      middle: data.indicators.bollinger_bands.middle,
                      lower: data.indicators.bollinger_bands.lower,
                    }
                  : undefined,
                // Keep other indicators as-is
                atr: data.indicators.atr,
                obv: data.indicators.obv,
                volume_sma: data.indicators.volume_sma,
                pivot: data.indicators.pivot,
                trend: data.indicators.trend,
                trend_strength: data.indicators.trend_strength,
              }
            : null,
        };

        setTechnicalData(transformedData);

        // Log metadata (cache hit/miss, duration, errors)
        console.log('Technical data metadata:', data.metadata);
        console.log(
          'Transformed indicators keys:',
          transformedData.indicators ? Object.keys(transformedData.indicators) : 'null'
        );

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
  }, [ticker, selectedTimeframe, selectedRange]);

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
    const labels: Record<ViewingRange, string> = {
      '1mo': '1 mês',
      '3mo': '3 meses',
      '6mo': '6 meses',
      '1y': '1 ano',
      '2y': '2 anos',
      '5y': '5 anos',
      max: 'histórico',
    };
    return labels[selectedRange] || selectedRange;
  }, [selectedRange]);

  const handleIndicatorToggle = (indicator: keyof typeof showIndicators) => {
    setShowIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  const isLoading = assetLoading || pricesLoading;

  // Error state
  if (assetError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
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
                <Skeleton className="mb-2 h-9 w-32" />
                <Skeleton className="h-5 w-48" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">{ticker.toUpperCase()}</h1>
                <p className="text-muted-foreground">{asset?.name || 'Carregando...'}</p>
                {dataSources && !dataSourcesLoading && (
                  <div className="mt-2">
                    <DataQualitySummary
                      overallConfidence={dataSources.overallConfidence}
                      totalFieldsTracked={dataSources.totalFieldsTracked}
                      fieldsWithDiscrepancy={dataSources.fieldsWithDiscrepancy}
                      fieldsWithHighConsensus={dataSources.fieldsWithHighConsensus}
                      sourcesUsed={dataSources.sourcesUsed}
                    />
                  </div>
                )}
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
          Array(4)
            .fill(0)
            .map((_, i) => (
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

      {/* Indicator Toggles */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Indicadores Técnicos</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Object.entries(showIndicators).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={() => handleIndicatorToggle(key as keyof typeof showIndicators)}
              />
              <label
                htmlFor={key}
                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {key
                  .toUpperCase()
                  .replace(/([A-Z])/g, ' $1')
                  .trim()}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Unified History Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Histórico Unificado</h3>
            <p className="text-xs text-muted-foreground">
              Incluir dados de tickers anteriores (ex: ELET3 → AXIA3)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="unified-history"
              checked={showUnifiedHistory}
              onCheckedChange={checked => setShowUnifiedHistory(checked as boolean)}
            />
            <label
              htmlFor="unified-history"
              className="cursor-pointer text-sm font-medium leading-none"
            >
              Habilitar
            </label>
          </div>
        </div>
      </Card>

      {/* Price Chart */}
      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Análise Técnica Avançada</h3>
              <p className="text-sm text-muted-foreground">
                Gráficos multi-pane com indicadores técnicos sincronizados
              </p>
            </div>
            {showUnifiedHistory && (
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-800 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Exibindo histórico unificado
                </span>
              </div>
            )}
          </div>
          <TimeframeRangePicker
            selectedTimeframe={selectedTimeframe}
            selectedRange={selectedRange}
            onTimeframeChange={setSelectedTimeframe}
            onRangeChange={setSelectedRange}
          />
        </div>
        {isLoading || technicalLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : technicalData?.prices && technicalData?.indicators ? (
          <ChartErrorBoundary chartType="MultiPaneChart">
            <MultiPaneChart
              data={technicalData.prices}
              indicators={technicalData.indicators}
              showIndicators={showIndicators}
            />
          </ChartErrorBoundary>
        ) : (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            <p>Dados insuficientes para gráfico avançado. Tente um período maior.</p>
          </div>
        )}
      </Card>

      {/* TradingView Advanced Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Análise Técnica TradingView</h3>
          <p className="text-sm text-muted-foreground">
            Gráfico interativo TradingView com indicadores técnicos profissionais
          </p>
        </div>
        <ChartErrorBoundary chartType="TradingView AdvancedChart">
          <AdvancedChart
            symbol={`BMFBOVESPA:${ticker.toUpperCase()}`}
            interval="D"
            range="12M"
            height={610}
          />
        </ChartErrorBoundary>
      </Card>

      {/* Fundamental Analysis - Full Table with all indicators */}
      {dataSourcesLoading ? (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Indicadores Fundamentalistas</h3>
            <p className="text-sm text-muted-foreground">Carregando indicadores...</p>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </Card>
      ) : dataSources?.fields ? (
        <FundamentalIndicatorsTable
          ticker={ticker}
          fields={dataSources.fields}
          sourcesUsed={dataSources.sourcesUsed || []}
          overallConfidence={dataSources.overallConfidence || 0}
          lastUpdate={dataSources.lastUpdate}
        />
      ) : (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Indicadores Fundamentalistas</h3>
            <p className="text-sm text-muted-foreground">Principais indicadores fundamentalistas</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2 py-8">
            <p className="text-muted-foreground">Dados fundamentalistas não disponíveis</p>
            <p className="text-xs text-muted-foreground">Sincronize os dados para visualizar</p>
          </div>
        </Card>
      )}

      {/* Options Liquidity Section */}
      {asset?.hasOptions && asset?.optionsLiquidityMetadata && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">📊 Opções Disponíveis</h3>
            <p className="text-sm text-muted-foreground">
              Dados de liquidez do mercado de opções
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Clock className="mt-0.5 h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Período da Análise</p>
                <p className="text-lg font-semibold">{asset.optionsLiquidityMetadata.periodo || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Hash className="mt-0.5 h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Negócios</p>
                <p className="text-lg font-semibold">
                  {asset.optionsLiquidityMetadata.totalNegocios?.toLocaleString('pt-BR') || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <CircleDollarSign className="mt-0.5 h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Financeiro</p>
                <p className="text-lg font-semibold">
                  {asset.optionsLiquidityMetadata.volumeFinanceiro
                    ? `R$ ${(asset.optionsLiquidityMetadata.volumeFinanceiro / 1000000).toFixed(2)}M`
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Activity className="mt-0.5 h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantidade Negociada</p>
                <p className="text-lg font-semibold">
                  {asset.optionsLiquidityMetadata.quantidadeNegociada?.toLocaleString('pt-BR') || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          {asset.optionsLiquidityMetadata.lastUpdated && (
            <p className="mt-4 text-xs text-muted-foreground">
              Última atualização: {new Date(asset.optionsLiquidityMetadata.lastUpdated).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">

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
          {technicalLoading || !technicalData ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
              </div>
            </div>
          ) : technicalData?.indicators ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">RSI (14)</p>
                  <p className="text-xl font-bold">
                    {technicalData.indicators.rsi
                      ? technicalData.indicators.rsi[
                          technicalData.indicators.rsi.length - 1
                        ]?.toFixed(1)
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
            <div className="flex flex-col items-center justify-center space-y-2 py-8">
              <p className="text-muted-foreground">Dados insuficientes para indicadores técnicos</p>
            </div>
          )}
        </Card>
      </div>

      {/* Sentiment & News Section - FASE 75 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Ticker Sentiment Thermometer */}
        <div className="md:col-span-1">
          <TickerSentimentThermometer ticker={ticker} showRecentNews={true} />
        </div>

        {/* Ticker News */}
        <div className="md:col-span-2">
          <TickerNews ticker={ticker} limit={10} />
        </div>
      </div>
    </div>
  );
}
