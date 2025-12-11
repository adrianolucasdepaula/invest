'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Newspaper,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Clock,
  RefreshCw,
  ImageOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  sourceName: string;
  author?: string;
  imageUrl?: string;
  publishedAt: string;
  isAnalyzed: boolean;
  sentiment?: {
    finalSentiment: number;
    label: string;
    confidenceScore: number;
    providersCount: number;
    isHighConfidence: boolean;
  };
}

interface TickerNewsProps {
  ticker: string;
  limit?: number;
}

const sentimentColors: Record<string, string> = {
  very_bullish: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  bullish: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  slightly_bullish: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  slightly_bearish: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  bearish: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  very_bearish: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const sentimentLabels: Record<string, string> = {
  very_bullish: 'Muito Otimista',
  bullish: 'Otimista',
  slightly_bullish: 'Levemente Otimista',
  neutral: 'Neutro',
  slightly_bearish: 'Levemente Pessimista',
  bearish: 'Pessimista',
  very_bearish: 'Muito Pessimista',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `${minutes}min atrás`;
  }
  if (hours < 24) {
    return `${hours}h atrás`;
  }
  if (days < 7) {
    return `${days}d atrás`;
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function SentimentIcon({ label }: { label: string }) {
  if (label.includes('bullish')) {
    return <TrendingUp className="h-3 w-3" />;
  }
  if (label.includes('bearish')) {
    return <TrendingDown className="h-3 w-3" />;
  }
  return <Minus className="h-3 w-3" />;
}

export function TickerNews({ ticker, limit = 10 }: TickerNewsProps) {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const {
    data: news,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<NewsItem[]>({
    queryKey: ['ticker-news', ticker],
    queryFn: async () => {
      const response = await api.get(`/news/ticker/${ticker}`, {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  const handleCollectNews = async () => {
    try {
      await api.post('/news/collect', { ticker, limit: 20 });
      refetch();
    } catch (err) {
      console.error('Error collecting news:', err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Notícias
          </CardTitle>
          <CardDescription>Últimas notícias sobre {ticker.toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-28 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
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
            <Newspaper className="h-5 w-5" />
            Notícias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Erro ao carregar notícias</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Notícias
            </CardTitle>
            <CardDescription>Últimas notícias sobre {ticker.toUpperCase()}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollectNews}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!news || news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Newspaper className="mb-2 h-10 w-10 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nenhuma notícia encontrada para {ticker.toUpperCase()}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleCollectNews}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Coletar Notícias
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                {/* Image */}
                {item.imageUrl && !imageError[item.id] && (
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={112}
                      height={80}
                      className="h-full w-full object-cover"
                      unoptimized={true}
                      onError={() => setImageError((prev) => ({ ...prev, [item.id]: true }))}
                    />
                  </div>
                )}

                {/* Fallback when image fails */}
                {item.imageUrl && imageError[item.id] && (
                  <div className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-1 flex-col">
                  {/* Title + Link */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-1"
                  >
                    <h4 className="line-clamp-2 text-sm font-medium leading-tight group-hover:text-primary">
                      {item.title}
                    </h4>
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </a>

                  {/* Summary */}
                  {item.summary && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.summary}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* Source */}
                    <Badge variant="outline" className="text-xs">
                      {item.sourceName}
                    </Badge>

                    {/* Sentiment */}
                    {item.sentiment && (
                      <Badge
                        variant="outline"
                        className={cn('flex items-center gap-1 text-xs', sentimentColors[item.sentiment.label])}
                      >
                        <SentimentIcon label={item.sentiment.label} />
                        {sentimentLabels[item.sentiment.label] || item.sentiment.label}
                        {item.sentiment.isHighConfidence && (
                          <span className="ml-1 text-[10px] opacity-70">
                            ({Math.round(item.sentiment.confidenceScore * 100)}%)
                          </span>
                        )}
                      </Badge>
                    )}

                    {/* Date */}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.publishedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
