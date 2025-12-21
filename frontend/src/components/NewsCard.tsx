'use client';

import React, { useState } from 'react';
import { Newspaper, ExternalLink, Filter, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date | string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface NewsCardProps {
  ticker: string;
  articles: NewsArticle[];
  availableSources?: string[];
}

const SOURCE_COLORS: Record<string, string> = {
  'Bloomberg Línea': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30',
  'Google News': 'bg-green-100 text-green-800 dark:bg-green-900/30',
  'Investing News': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30',
  'Valor Econômico': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30',
  Exame: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30',
  InfoMoney: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30',
};

export default function NewsCard({
  ticker,
  articles,
  availableSources = [],
}: NewsCardProps) {
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');

  // Extract unique sources from articles if not provided
  const sources = availableSources.length > 0
    ? availableSources
    : [...new Set(articles.map((a) => a.source))];

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSource = selectedSource === 'all' || article.source === selectedSource;
    const matchesSentiment =
      selectedSentiment === 'all' || article.sentiment === selectedSentiment;
    return matchesSource && matchesSentiment;
  });

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;

    switch (sentiment) {
      case 'positive':
        return (
          <Badge variant="success" className="text-xs">
            Positivo
          </Badge>
        );
      case 'negative':
        return (
          <Badge variant="destructive" className="text-xs">
            Negativo
          </Badge>
        );
      case 'neutral':
        return (
          <Badge variant="warning" className="text-xs">
            Neutro
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRelativeTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
    } catch (error) {
      return 'Data desconhecida';
    }
  };

  const getSourceBadgeClass = (source: string) => {
    return SOURCE_COLORS[source] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            <div>
              <CardTitle>Últimas Notícias</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredArticles.length} artigos encontrados
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por sentimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os sentimentos</SelectItem>
              <SelectItem value="positive">Positivo</SelectItem>
              <SelectItem value="neutral">Neutro</SelectItem>
              <SelectItem value="negative">Negativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-2" />
              <p>Nenhuma notícia encontrada com os filtros aplicados</p>
            </div>
          ) : (
            filteredArticles.slice(0, 10).map((article) => (
              <div
                key={article.id}
                className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer group"
                onClick={() => window.open(article.url, '_blank')}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={cn('text-xs', getSourceBadgeClass(article.source))}>
                    {article.source}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {getSentimentBadge(article.sentiment)}
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h4>

                {/* Summary */}
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {article.summary}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{getRelativeTime(article.publishedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredArticles.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Carregar mais notícias
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
