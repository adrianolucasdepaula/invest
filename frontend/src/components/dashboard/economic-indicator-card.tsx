/**
 * EconomicIndicatorCard - Card component for displaying economic indicators
 *
 * Displays SELIC, IPCA, or CDI data with value, change, and reference date.
 * Follows StatCard pattern for consistency with dashboard.
 *
 * @created 2025-11-21 - FASE 1 (Frontend Economic Indicators)
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent, cn, getChangeColor } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import type { LatestIndicatorResponse } from '@/types/economic-indicator';

interface EconomicIndicatorCardProps {
  indicator: LatestIndicatorResponse;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function EconomicIndicatorCard({ indicator, isLoading, icon }: EconomicIndicatorCardProps) {
  // IMPORTANT: DO NOT round financial data
  // Use formatPercent() from lib/utils.ts to maintain precision
  const formattedValue = React.useMemo(() => {
    return formatPercent(indicator.currentValue);
  }, [indicator.currentValue]);

  const formattedChange = React.useMemo(() => {
    if (!indicator.change && indicator.change !== 0) return null;
    return formatPercent(Math.abs(indicator.change));
  }, [indicator.change]);

  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(indicator.referenceDate);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return indicator.referenceDate;
    }
  }, [indicator.referenceDate]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{indicator.type}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {formattedValue}
              <span className="text-sm text-muted-foreground ml-1">{indicator.unit}</span>
            </div>
            {indicator.change !== undefined && (
              <div className={cn('text-xs flex items-center gap-1 mt-1', getChangeColor(indicator.change))}>
                {indicator.change > 0 ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : indicator.change < 0 ? (
                  <ArrowDownIcon className="h-3 w-3" />
                ) : null}
                <span>
                  {formattedChange || '0%'}
                  {' vs anterior'}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Ref: {formattedDate}
            </p>
            <p className="text-xs text-muted-foreground">
              Fonte: {indicator.source}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
