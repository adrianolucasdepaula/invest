'use client';

import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  sector: string;
  metrics: {
    pl?: number;
    pvp?: number;
    roe?: number;
    dividendYield?: number;
    debtEquity?: number;
    marketCap?: number;
  };
  aiRecommendation?: 'BUY' | 'HOLD' | 'SELL';
  performance30d?: number;
  performance90d?: number;
  performance1y?: number;
}

interface StockComparisonProps {
  stocks: StockData[];
  onRemoveStock?: (ticker: string) => void;
}

export default function StockComparison({
  stocks,
  onRemoveStock,
}: StockComparisonProps) {
  const getRecommendationBadge = (recommendation?: string) => {
    if (!recommendation) return null;

    switch (recommendation) {
      case 'BUY':
        return (
          <Badge variant="success" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Comprar
          </Badge>
        );
      case 'SELL':
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Vender
          </Badge>
        );
      case 'HOLD':
        return (
          <Badge variant="warning" className="text-xs">
            Manter
          </Badge>
        );
    }
  };

  const formatMetricValue = (value: number | undefined, isPercentage: boolean = false) => {
    if (value === undefined || value === null) return 'N/A';
    return isPercentage ? formatPercent(value, 2) : formatNumber(value, 2);
  };

  const getPerformanceColor = (value?: number) => {
    if (!value) return 'text-muted-foreground';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getBestValue = (metric: keyof StockData['metrics'], higher: boolean = false) => {
    const values = stocks
      .map((s) => s.metrics[metric])
      .filter((v): v is number => v !== undefined && v !== null);

    if (values.length === 0) return null;

    return higher ? Math.max(...values) : Math.min(...values);
  };

  const isBestValue = (
    value: number | undefined,
    metric: keyof StockData['metrics'],
    higher: boolean = false
  ) => {
    if (value === undefined || value === null) return false;
    const best = getBestValue(metric, higher);
    return best !== null && value === best;
  };

  if (stocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Nenhuma ação selecionada para comparação</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Ações</CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparando {stocks.length} {stocks.length === 1 ? 'ação' : 'ações'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                  Métrica
                </th>
                {stocks.map((stock) => (
                  <th key={stock.ticker} className="text-center p-3 min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-lg">{stock.ticker}</span>
                        {onRemoveStock && stocks.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveStock(stock.ticker)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-normal">
                        {stock.companyName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {stock.sector}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">Preço Atual</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    <div className="space-y-1">
                      <p className="font-bold text-lg">
                        {formatCurrency(stock.currentPrice)}
                      </p>
                      <div
                        className={cn(
                          'flex items-center justify-center gap-1 text-sm',
                          stock.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {stock.priceChange >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{formatPercent(stock.priceChangePercent)}</span>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Market Cap */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">Valor de Mercado</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    <span
                      className={cn(
                        'font-semibold',
                        isBestValue(stock.metrics.marketCap, 'marketCap', true) &&
                          'text-green-600'
                      )}
                    >
                      {stock.metrics.marketCap
                        ? new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            compactDisplay: 'short',
                          }).format(stock.metrics.marketCap)
                        : 'N/A'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* P/L */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">P/L</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    <span
                      className={cn(
                        'font-semibold',
                        isBestValue(stock.metrics.pl, 'pl', false) && 'text-green-600'
                      )}
                    >
                      {formatMetricValue(stock.metrics.pl)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* P/VP */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">P/VP</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    <span
                      className={cn(
                        'font-semibold',
                        isBestValue(stock.metrics.pvp, 'pvp', false) && 'text-green-600'
                      )}
                    >
                      {formatMetricValue(stock.metrics.pvp)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* ROE */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">ROE</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    <span
                      className={cn(
                        'font-semibold',
                        isBestValue(stock.metrics.roe, 'roe', true) && 'text-green-600'
                      )}
                    >
                      {formatMetricValue(stock.metrics.roe, true)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Dividend Yield */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">Dividend Yield</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    <span
                      className={cn(
                        'font-semibold',
                        isBestValue(stock.metrics.dividendYield, 'dividendYield', true) &&
                          'text-green-600'
                      )}
                    >
                      {formatMetricValue(stock.metrics.dividendYield, true)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Debt/Equity */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">Dívida/Patrimônio</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    <span
                      className={cn(
                        'font-semibold',
                        isBestValue(stock.metrics.debtEquity, 'debtEquity', false) &&
                          'text-green-600'
                      )}
                    >
                      {formatMetricValue(stock.metrics.debtEquity)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Performance 30d */}
              {stocks.some((s) => s.performance30d !== undefined) && (
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3 text-sm font-medium">Performance 30d</td>
                  {stocks.map((stock) => (
                    <td key={stock.ticker} className="p-3 text-center">
                      <span
                        className={cn('font-semibold', getPerformanceColor(stock.performance30d))}
                      >
                        {formatMetricValue(stock.performance30d, true)}
                      </span>
                    </td>
                  ))}
                </tr>
              )}

              {/* AI Recommendation */}
              <tr className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm font-medium">Recomendação IA</td>
                {stocks.map((stock) => (
                  <td key={stock.ticker} className="p-3 text-center">
                    {getRecommendationBadge(stock.aiRecommendation)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <p>
            <strong className="text-green-600">Valores em verde</strong> indicam o melhor
            valor entre as ações comparadas para cada métrica.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
