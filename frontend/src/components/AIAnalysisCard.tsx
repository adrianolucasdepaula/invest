'use client';

import React, { useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Sentiment = 'positive' | 'neutral' | 'negative';
type Recommendation = 'BUY' | 'HOLD' | 'SELL';

interface AIOpinion {
  aiName: string;
  sentiment: Sentiment;
  recommendation: Recommendation;
  confidence: number;
  summary: string;
  reasoning?: string;
}

interface AIAnalysisCardProps {
  ticker: string;
  consolidatedSentiment: Sentiment;
  consensusRecommendation: Recommendation;
  strengths: string[];
  risks: string[];
  aiOpinions: AIOpinion[];
  lastUpdate?: Date | string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AIAnalysisCard({
  ticker,
  consolidatedSentiment,
  consensusRecommendation,
  strengths,
  risks,
  aiOpinions,
  lastUpdate,
  onRefresh,
  isRefreshing = false,
}: AIAnalysisCardProps) {
  const [showAllOpinions, setShowAllOpinions] = useState(false);

  const getSentimentBadge = (sentiment: Sentiment) => {
    switch (sentiment) {
      case 'positive':
        return (
          <Badge variant="success" className="text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            Positivo
          </Badge>
        );
      case 'negative':
        return (
          <Badge variant="destructive" className="text-sm">
            <TrendingDown className="h-4 w-4 mr-1" />
            Negativo
          </Badge>
        );
      case 'neutral':
        return (
          <Badge variant="warning" className="text-sm">
            <Minus className="h-4 w-4 mr-1" />
            Neutro
          </Badge>
        );
    }
  };

  const getRecommendationBadge = (recommendation: Recommendation) => {
    switch (recommendation) {
      case 'BUY':
        return (
          <Badge variant="success" className="text-lg px-4 py-1">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            COMPRAR
          </Badge>
        );
      case 'SELL':
        return (
          <Badge variant="destructive" className="text-lg px-4 py-1">
            <XCircle className="h-5 w-5 mr-2" />
            VENDER
          </Badge>
        );
      case 'HOLD':
        return (
          <Badge variant="warning" className="text-lg px-4 py-1">
            <Minus className="h-5 w-5 mr-2" />
            MANTER
          </Badge>
        );
    }
  };

  const getSentimentIcon = (sentiment: Sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'negative':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'neutral':
        return <Minus className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Análise com IA</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Consenso de {aiOpinions.length} IAs
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consolidated Analysis */}
        <div className="p-6 rounded-lg border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                Sentimento Consolidado
              </span>
              {getSentimentBadge(consolidatedSentiment)}
            </div>
          </div>
          <div className="flex items-center justify-center py-4">
            {getRecommendationBadge(consensusRecommendation)}
          </div>
        </div>

        {/* Strengths and Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Principais Forças
              </h4>
            </div>
            <ul className="space-y-2">
              {strengths.slice(0, 3).map((strength, idx) => (
                <li
                  key={idx}
                  className="text-sm text-green-900 dark:text-green-100 flex items-start gap-2"
                >
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                Principais Riscos
              </h4>
            </div>
            <ul className="space-y-2">
              {risks.slice(0, 3).map((risk, idx) => (
                <li
                  key={idx}
                  className="text-sm text-red-900 dark:text-red-100 flex items-start gap-2"
                >
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Individual AI Opinions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Opiniões Individuais das IAs</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllOpinions(!showAllOpinions)}
            >
              {showAllOpinions ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expandir
                </>
              )}
            </Button>
          </div>

          {/* AI Opinions Grid - Show first 3, or all if expanded */}
          <div className="space-y-3">
            {(showAllOpinions ? aiOpinions : aiOpinions.slice(0, 3)).map(
              (opinion, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold">{opinion.aiName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(opinion.sentiment)}
                      <Badge
                        variant={
                          opinion.recommendation === 'BUY'
                            ? 'success'
                            : opinion.recommendation === 'SELL'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {opinion.recommendation}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {opinion.summary}
                  </p>
                  {showAllOpinions && opinion.reasoning && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      {opinion.reasoning}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      Confiança: {opinion.confidence}%
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {lastUpdate && (
          <p className="text-xs text-muted-foreground text-center">
            Última atualização:{' '}
            {new Date(lastUpdate).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
