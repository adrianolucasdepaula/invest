'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/utils';

interface StockHeaderProps {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdate: Date | string;
  sector: string;
  volume?: number;
  marketCap?: number;
}

export default function StockHeader({
  ticker,
  companyName,
  currentPrice,
  priceChange,
  priceChangePercent,
  lastUpdate,
  sector,
  volume,
  marketCap,
}: StockHeaderProps) {
  const isPositive = priceChange >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{ticker}</h1>
                  <Badge variant="outline" className="text-sm">
                    {sector}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground">{companyName}</p>
              </div>
            </div>

            {/* Price Information */}
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Preço Atual</p>
                <p className="text-4xl font-bold">{formatCurrency(currentPrice)}</p>
              </div>

              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                )}
              >
                <TrendIcon
                  className={cn(
                    'h-6 w-6',
                    isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                />
                <div>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {formatCurrency(Math.abs(priceChange))}
                  </p>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {formatPercent(priceChangePercent)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="space-y-4">
            {marketCap && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor de Mercado</p>
                <p className="text-xl font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(marketCap)}
                </p>
              </div>
            )}

            {volume && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Volume (24h)</p>
                <p className="text-xl font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(volume)}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Atualizado: {formatDateTime(lastUpdate)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
