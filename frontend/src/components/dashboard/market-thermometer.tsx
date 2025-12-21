'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';

/**
 * Tipos de resposta da API de sentimento
 */
interface MarketSentimentSummary {
  overallSentiment: number;
  overallLabel: string;
  totalNewsAnalyzed: number;
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
}

/**
 * Mapeia labels de sentimento para cores e ícones
 */
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
 * Componente de termômetro visual
 */
function ThermometerGauge({ value }: { value: number }) {
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
    <div className="relative h-32 w-full flex items-end justify-center">
      {/* Termômetro container */}
      <div className="relative w-16 h-full bg-muted rounded-t-full rounded-b-3xl overflow-hidden">
        {/* Preenchimento */}
        <div
          className={cn('absolute bottom-0 left-0 right-0 transition-all duration-1000', getColor())}
          style={{ height: `${percentage}%` }}
        />

        {/* Marcações */}
        <div className="absolute inset-0 flex flex-col justify-between py-2">
          <span className="text-[8px] text-center text-muted-foreground">+1</span>
          <span className="text-[8px] text-center text-muted-foreground">0</span>
          <span className="text-[8px] text-center text-muted-foreground">-1</span>
        </div>
      </div>

      {/* Valor atual */}
      <div className="absolute bottom-0 left-20 right-0 flex items-end">
        <span className={cn('text-2xl font-bold', value >= 0 ? 'text-green-600' : 'text-red-600')}>
          {value >= 0 ? '+' : ''}{safeToFixed(value, 2)}
        </span>
      </div>
    </div>
  );
}

/**
 * Widget de Termômetro do Mercado
 *
 * FASE 75.5: Exibe sentimento consolidado do mercado baseado em
 * análise multi-provider de notícias financeiras.
 */
export function MarketThermometer() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<MarketSentimentSummary>({
    queryKey: ['market-sentiment'],
    queryFn: async () => {
      const response = await api.get('/news/market-sentiment');
      return response.data;
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Mutation para coletar notícias dos principais tickers
  const syncMutation = useMutation({
    mutationFn: async () => {
      const tickers = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'BBAS3', 'B3SA3'];
      let totalCollected = 0;

      for (const ticker of tickers) {
        const response = await api.post('/news/collect', { ticker });
        totalCollected += response.data.collected || 0;
      }

      return { totalCollected, tickerCount: tickers.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.totalCollected} notícias coletadas de ${data.tickerCount} tickers`);
      queryClient.invalidateQueries({ queryKey: ['market-sentiment'] });
    },
    onError: () => {
      toast.error('Erro ao sincronizar notícias');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Termômetro do Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Termômetro do Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar sentimento</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalNewsAnalyzed === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Termômetro do Mercado
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title="Sincronizar notícias"
            >
              <RefreshCw className={cn('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhuma notícia analisada ainda</p>
            <p className="text-sm">Clique no botão de sync para coletar notícias</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = sentimentConfig[data.overallLabel] || sentimentConfig.neutral;
  const SentimentIcon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Termômetro do Mercado
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Consolidado de todos os ativos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {data.totalNewsAnalyzed} notícias
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title="Sincronizar notícias"
              className="h-7 w-7"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Termômetro visual */}
        <ThermometerGauge value={data.overallSentiment} />

        {/* Label de sentimento */}
        <div className={cn('flex items-center justify-center gap-2 py-2 rounded-lg', config.bgColor)}>
          <SentimentIcon className={cn('h-5 w-5', config.color)} />
          <span className={cn('font-semibold', config.color)}>{config.label}</span>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg">{data.newsLast24h}</div>
            <div className="text-muted-foreground text-xs">Últimas 24h</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{data.totalNewsAnalyzed}</div>
            <div className="text-muted-foreground text-xs">Total analisado</div>
          </div>
        </div>

        {/* Breakdown por sentimento */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground mb-2">Distribuição:</div>
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            {data.breakdown.veryBullish > 0 && (
              <div
                className="bg-green-600 transition-all"
                style={{ width: `${(data.breakdown.veryBullish / data.totalNewsAnalyzed) * 100}%` }}
                title={`Muito Otimista: ${data.breakdown.veryBullish}`}
              />
            )}
            {data.breakdown.bullish > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(data.breakdown.bullish / data.totalNewsAnalyzed) * 100}%` }}
                title={`Otimista: ${data.breakdown.bullish}`}
              />
            )}
            {data.breakdown.slightlyBullish > 0 && (
              <div
                className="bg-lime-500 transition-all"
                style={{ width: `${(data.breakdown.slightlyBullish / data.totalNewsAnalyzed) * 100}%` }}
                title={`Levemente Otimista: ${data.breakdown.slightlyBullish}`}
              />
            )}
            {data.breakdown.neutral > 0 && (
              <div
                className="bg-gray-400 transition-all"
                style={{ width: `${(data.breakdown.neutral / data.totalNewsAnalyzed) * 100}%` }}
                title={`Neutro: ${data.breakdown.neutral}`}
              />
            )}
            {data.breakdown.slightlyBearish > 0 && (
              <div
                className="bg-orange-500 transition-all"
                style={{ width: `${(data.breakdown.slightlyBearish / data.totalNewsAnalyzed) * 100}%` }}
                title={`Levemente Pessimista: ${data.breakdown.slightlyBearish}`}
              />
            )}
            {data.breakdown.bearish > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(data.breakdown.bearish / data.totalNewsAnalyzed) * 100}%` }}
                title={`Pessimista: ${data.breakdown.bearish}`}
              />
            )}
            {data.breakdown.veryBearish > 0 && (
              <div
                className="bg-red-600 transition-all"
                style={{ width: `${(data.breakdown.veryBearish / data.totalNewsAnalyzed) * 100}%` }}
                title={`Muito Pessimista: ${data.breakdown.veryBearish}`}
              />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Otimista</span>
            <span>Pessimista</span>
          </div>
        </div>

        {/* Notícias recentes */}
        {data.recentNews.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">Notícias recentes:</div>
            {data.recentNews.slice(0, 3).map((news) => (
              <div key={news.id} className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {news.ticker}
                  </Badge>
                  {news.sentiment && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px]',
                        news.sentiment.finalSentiment >= 0.1 && 'bg-green-100 text-green-700',
                        news.sentiment.finalSentiment <= -0.1 && 'bg-red-100 text-red-700',
                      )}
                    >
                      {news.sentiment.finalSentiment >= 0 ? '+' : ''}
                      {safeToFixed(news.sentiment.finalSentiment, 2)}
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-1 text-muted-foreground">{news.title}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MarketThermometer;
