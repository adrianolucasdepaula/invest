'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Newspaper,
  RefreshCw,
  Clock,
} from 'lucide-react';

/**
 * Tipos de resposta da API de sentimento por ticker
 */
interface TickerSentimentSummary {
  ticker: string;
  overallSentiment: number;
  overallLabel: string;
  avgConfidence: number;
  totalNews: number;
  analyzedNews: number;
  newsLast24h: number;
  breakdown: {
    veryBullish: number;
    bullish: number;
    slightlyBullish: number;
    neutral: number;
    slightlyBearish: number;
    bearish: number;
    veryBearish: number;
  };
  recentNews: Array<{
    id: string;
    ticker: string;
    title: string;
    source: string;
    publishedAt: string;
    sentiment?: {
      finalSentiment: number;
      label: string;
      isHighConfidence: boolean;
    };
  }>;
  lastUpdated: string;
}

/**
 * Enum de períodos para análise de sentimento
 * FASE 76: Time-Weighted Multi-Timeframe Sentiment
 */
type SentimentPeriod = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

/**
 * DTO para sentimento por período específico
 */
interface TimeframeSentiment {
  period: SentimentPeriod;
  sentiment: number;
  label: string;
  confidence: number;
  newsCount: number;
  oldestNews?: string;
  newestNews?: string;
}

/**
 * DTO para sentimento multi-período de um ticker
 */
interface MultiTimeframeSentiment {
  ticker: string;
  timeframes: TimeframeSentiment[];
  breakdown: {
    veryBullish: number;
    bullish: number;
    slightlyBullish: number;
    neutral: number;
    slightlyBearish: number;
    bearish: number;
    veryBearish: number;
  };
  lastUpdated: string;
}

/**
 * Mapeamento de período para label em português
 */
const periodLabels: Record<SentimentPeriod, string> = {
  weekly: '7D',
  monthly: '1M',
  quarterly: '3M',
  semiannual: '6M',
  annual: '1A',
};

/**
 * Safely format a number with toFixed, handling strings and invalid values
 */
function safeToFixed(value: unknown, decimals: number = 2): string {
  let num: number;
  if (value === undefined || value === null || value === '') {
    num = 0;
  } else if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    num = Number(value);
  }

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    num = 0;
  }

  return num.toFixed(decimals);
}

/**
 * Mapeia labels de sentimento para cores e ícones
 */
const sentimentConfig: Record<string, {
  color: string;
  bgColor: string;
  label: string;
  icon: typeof TrendingUp;
}> = {
  very_bullish: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Muito Otimista',
    icon: TrendingUp,
  },
  bullish: {
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    label: 'Otimista',
    icon: TrendingUp,
  },
  slightly_bullish: {
    color: 'text-lime-500 dark:text-lime-400',
    bgColor: 'bg-lime-50 dark:bg-lime-900/20',
    label: 'Levemente Otimista',
    icon: TrendingUp,
  },
  neutral: {
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Neutro',
    icon: Minus,
  },
  slightly_bearish: {
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Levemente Pessimista',
    icon: TrendingDown,
  },
  bearish: {
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    label: 'Pessimista',
    icon: TrendingDown,
  },
  very_bearish: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Muito Pessimista',
    icon: TrendingDown,
  },
};

/**
 * Componente de termômetro visual compacto
 */
function ThermometerGaugeCompact({ value }: { value: number }) {
  // Converter de -1/+1 para 0-100%
  const percentage = ((value + 1) / 2) * 100;

  // Determinar cor baseada no valor
  const getColor = () => {
    if (value >= 0.3) return 'bg-green-500';
    if (value >= 0.1) return 'bg-lime-500';
    if (value >= -0.1) return 'bg-gray-400';
    if (value >= -0.3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative h-24 w-full flex items-end justify-center">
      {/* Termômetro container */}
      <div className="relative w-12 h-full bg-gray-200 dark:bg-gray-700 rounded-t-full rounded-b-3xl overflow-hidden">
        {/* Preenchimento */}
        <div
          className={cn('absolute bottom-0 left-0 right-0 transition-all duration-1000', getColor())}
          style={{ height: `${percentage}%` }}
        />

        {/* Marcações */}
        <div className="absolute inset-0 flex flex-col justify-between py-1">
          <span className="text-[7px] text-center text-gray-500 dark:text-gray-400">+1</span>
          <span className="text-[7px] text-center text-gray-500 dark:text-gray-400">0</span>
          <span className="text-[7px] text-center text-gray-500 dark:text-gray-400">-1</span>
        </div>
      </div>

      {/* Valor atual */}
      <div className="absolute bottom-0 left-16 right-0 flex items-end">
        <span className={cn('text-xl font-bold', value >= 0 ? 'text-green-600' : 'text-red-600')}>
          {value >= 0 ? '+' : ''}{safeToFixed(value, 2)}
        </span>
      </div>
    </div>
  );
}

interface TickerSentimentThermometerProps {
  ticker: string;
  showRecentNews?: boolean;
  compact?: boolean;
}

/**
 * Widget de Termômetro de Sentimento por Ticker
 *
 * Exibe sentimento consolidado de um ativo específico baseado em
 * análise multi-provider de notícias financeiras.
 */
export function TickerSentimentThermometer({
  ticker,
  showRecentNews = false,
  compact = false,
}: TickerSentimentThermometerProps) {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<SentimentPeriod>('monthly');

  // Query para dados multi-timeframe (FASE 76)
  const { data: multiData, isLoading: isLoadingMulti, error: errorMulti } = useQuery<MultiTimeframeSentiment>({
    queryKey: ['ticker-sentiment-multi', ticker],
    queryFn: async () => {
      const response = await api.get(`/news/ticker-sentiment/${ticker}/multi`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60000,
  });

  // Query legada para dados detalhados (recentNews)
  const { data, isLoading, error } = useQuery<TickerSentimentSummary>({
    queryKey: ['ticker-sentiment', ticker],
    queryFn: async () => {
      const response = await api.get(`/news/ticker-sentiment/${ticker}`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60000,
  });

  // Obter dados do período selecionado
  const selectedTimeframe = multiData?.timeframes.find(tf => tf.period === selectedPeriod);

  // Verificar se ALGUM período tem dados (memoizado para evitar re-cálculos)
  const periodsWithData = useMemo(
    () => multiData?.timeframes.filter(tf => tf.newsCount > 0) ?? [],
    [multiData?.timeframes]
  );
  const hasAnyData = periodsWithData.length > 0;

  // Auto-selecionar primeiro período com dados quando multiData carrega
  useEffect(() => {
    if (multiData && periodsWithData.length > 0) {
      // Se período selecionado não tem dados, mudar para primeiro com dados
      const currentHasData = multiData.timeframes.find(tf => tf.period === selectedPeriod)?.newsCount ?? 0;
      if (currentHasData === 0) {
        setSelectedPeriod(periodsWithData[0].period);
      }
    }
  }, [multiData, periodsWithData, selectedPeriod]);

  // Mutation para coletar notícias do ticker
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/news/collect', { ticker });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success(`${result.collected} notícias coletadas para ${ticker}`);
      queryClient.invalidateQueries({ queryKey: ['ticker-sentiment', ticker] });
      queryClient.invalidateQueries({ queryKey: ['ticker-sentiment-multi', ticker] });
      queryClient.invalidateQueries({ queryKey: ['ticker-news', ticker] });
    },
    onError: () => {
      toast.error(`Erro ao sincronizar notícias de ${ticker}`);
    },
  });

  // Usar loading combinado
  const combinedLoading = isLoading || isLoadingMulti;
  const combinedError = error || errorMulti;

  if (combinedLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Thermometer className="h-4 w-4" />
            Sentimento {ticker}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (combinedError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Thermometer className="h-4 w-4" />
            Sentimento {ticker}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Erro ao carregar</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar se há dados do timeframe selecionado
  const hasTimeframeData = selectedTimeframe && selectedTimeframe.newsCount > 0;

  // Mostrar "Sem análise" apenas quando NENHUM período tem dados
  if (!multiData || !hasAnyData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Sentimento {ticker}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title="Coletar notícias"
              className="h-7 w-7"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sem análise de sentimento</p>
            <p className="text-xs">Clique para coletar notícias</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Usar dados do timeframe selecionado (com fallback para dados legados)
  const sentimentValue = selectedTimeframe?.sentiment ?? data?.overallSentiment ?? 0;
  const sentimentLabel = selectedTimeframe?.label ?? data?.overallLabel ?? 'neutral';
  const confidenceValue = selectedTimeframe?.confidence ?? data?.avgConfidence ?? 0;
  const newsCount = selectedTimeframe?.newsCount ?? data?.analyzedNews ?? 0;

  const config = sentimentConfig[sentimentLabel] || sentimentConfig.neutral;
  const SentimentIcon = config.icon;
  const totalBreakdown = multiData?.breakdown
    ? Object.values(multiData.breakdown).reduce((a, b) => a + b, 0) || 1
    : data?.analyzedNews || 1;
  const breakdown = multiData?.breakdown ?? data?.breakdown ?? {
    veryBullish: 0, bullish: 0, slightlyBullish: 0, neutral: 0,
    slightlyBearish: 0, bearish: 0, veryBearish: 0
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Sentimento {ticker}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {newsCount} notícias
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title="Coletar notícias"
              className="h-7 w-7"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Period Selector - FASE 76 */}
        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as SentimentPeriod)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-7">
            {(['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'] as SentimentPeriod[]).map((period) => {
              const tf = multiData?.timeframes.find(t => t.period === period);
              const hasData = tf && tf.newsCount > 0;
              return (
                <TabsTrigger
                  key={period}
                  value={period}
                  className="text-[10px] px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  disabled={!hasData}
                  title={hasData ? `${tf.newsCount} notícias` : 'Sem dados'}
                >
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {periodLabels[period]}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Termômetro visual */}
        <ThermometerGaugeCompact value={sentimentValue} />

        {/* Label de sentimento */}
        <div className={cn('flex items-center justify-center gap-2 py-1.5 rounded-lg', config.bgColor)}>
          <SentimentIcon className={cn('h-4 w-4', config.color)} />
          <span className={cn('font-semibold text-sm', config.color)}>{config.label}</span>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold">{newsCount}</div>
            <div className="text-muted-foreground text-[10px]">Notícias</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{(confidenceValue * 100).toFixed(0)}%</div>
            <div className="text-muted-foreground text-[10px]">Confiança</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{periodLabels[selectedPeriod]}</div>
            <div className="text-muted-foreground text-[10px]">Período</div>
          </div>
        </div>

        {/* Breakdown por sentimento */}
        {!compact && (
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Distribuição geral:</div>
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              {breakdown.veryBullish > 0 && (
                <div
                  className="bg-green-600 transition-all"
                  style={{ width: `${(breakdown.veryBullish / totalBreakdown) * 100}%` }}
                  title={`Muito Otimista: ${breakdown.veryBullish}`}
                />
              )}
              {breakdown.bullish > 0 && (
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(breakdown.bullish / totalBreakdown) * 100}%` }}
                  title={`Otimista: ${breakdown.bullish}`}
                />
              )}
              {breakdown.slightlyBullish > 0 && (
                <div
                  className="bg-lime-500 transition-all"
                  style={{ width: `${(breakdown.slightlyBullish / totalBreakdown) * 100}%` }}
                  title={`Levemente Otimista: ${breakdown.slightlyBullish}`}
                />
              )}
              {breakdown.neutral > 0 && (
                <div
                  className="bg-gray-400 transition-all"
                  style={{ width: `${(breakdown.neutral / totalBreakdown) * 100}%` }}
                  title={`Neutro: ${breakdown.neutral}`}
                />
              )}
              {breakdown.slightlyBearish > 0 && (
                <div
                  className="bg-orange-500 transition-all"
                  style={{ width: `${(breakdown.slightlyBearish / totalBreakdown) * 100}%` }}
                  title={`Levemente Pessimista: ${breakdown.slightlyBearish}`}
                />
              )}
              {breakdown.bearish > 0 && (
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${(breakdown.bearish / totalBreakdown) * 100}%` }}
                  title={`Pessimista: ${breakdown.bearish}`}
                />
              )}
              {breakdown.veryBearish > 0 && (
                <div
                  className="bg-red-600 transition-all"
                  style={{ width: `${(breakdown.veryBearish / totalBreakdown) * 100}%` }}
                  title={`Muito Pessimista: ${breakdown.veryBearish}`}
                />
              )}
            </div>
          </div>
        )}

        {/* Notícias recentes */}
        {showRecentNews && data?.recentNews && data.recentNews.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <div className="text-[10px] text-muted-foreground">Últimas notícias:</div>
            {data.recentNews.slice(0, 2).map((news) => (
              <div key={news.id} className="text-xs">
                <div className="flex items-center gap-1.5">
                  {news.sentiment && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[9px] px-1 h-4',
                        news.sentiment.finalSentiment >= 0.1 && 'bg-green-100 text-green-700',
                        news.sentiment.finalSentiment <= -0.1 && 'bg-red-100 text-red-700',
                      )}
                    >
                      {news.sentiment.finalSentiment >= 0 ? '+' : ''}
                      {safeToFixed(news.sentiment.finalSentiment, 2)}
                    </Badge>
                  )}
                  <p className="line-clamp-1 text-muted-foreground flex-1">{news.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TickerSentimentThermometer;
