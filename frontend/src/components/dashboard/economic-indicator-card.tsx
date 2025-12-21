/**
 * EconomicIndicatorCard - Card component for displaying economic indicators
 *
 * Displays 8 indicator types (FASE 1.4):
 * - Percentage indicators: SELIC, IPCA, CDI, IPCA_15 (formatted as %)
 * - Monetary indicators: IDP_INGRESSOS, IDE_SAIDAS, IDP_LIQUIDO, OURO_MONETARIO (formatted as US$ M)
 *
 * Features:
 * - Monthly value + 12-month accumulated
 * - Conditional formatting based on unit type
 * - Refresh button for manual sync
 *
 * @created 2025-11-21 - FASE 1 (Frontend Economic Indicators)
 * @updated 2025-11-21 - FASE 1.1 (Added 12-month accumulated display)
 * @updated 2025-11-23 - FASE 1.4 (Added conditional formatting for 8 indicator types)
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPercent, cn, getChangeColor } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { LatestWithAccumulatedResponse } from '@/types/economic-indicator';

interface EconomicIndicatorCardProps {
  indicator: LatestWithAccumulatedResponse;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function EconomicIndicatorCard({ indicator, isLoading, icon }: EconomicIndicatorCardProps) {
  const queryClient = useQueryClient();

  // Mutation to sync this specific indicator
  const syncMutation = useMutation({
    mutationFn: async () => {
      await api.syncEconomicIndicators();
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['economic-indicator', indicator.type] });
      toast.success(`${indicator.type} atualizado com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar ${indicator.type}: ${error.message}`);
    },
  });

  // IMPORTANT: DO NOT round financial data
  // Format conditionally: % for rates, US$ for monetary values
  const isMonetary = React.useMemo(() => {
    const result = indicator.unit?.includes('US$') || indicator.unit?.includes('milhões');

    // DEBUG: Log durante renderização
    if (indicator.type === 'IDP_INGRESSOS' || indicator.type === 'IDE_SAIDAS') {
      console.log('[DEBUG RENDER] isMonetary:', {
        type: indicator.type,
        unit: indicator.unit,
        result,
        includesUS: indicator.unit?.includes('US$'),
        includesMilhoes: indicator.unit?.includes('milhões')
      });
    }

    return result;
  }, [indicator.unit, indicator.type]);

  const formatValue = React.useCallback(
    (value: unknown) => {
      // Safely convert to number
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

      // Validate conversion
      if (Number.isNaN(num) || !Number.isFinite(num)) {
        num = 0;
      }

      // Use isMonetary directly to ensure consistency
      if (isMonetary) {
        // Format as US$ millions with 1 decimal
        return `US$ ${num.toFixed(1)}M`;
      }
      // Format as percentage
      return formatPercent(num);
    },
    [isMonetary]
  );

  const formattedValue = React.useMemo(() => {
    return formatValue(indicator.currentValue);
  }, [indicator.currentValue, formatValue]);

  const formattedAccumulated = React.useMemo(() => {
    return formatValue(indicator.accumulated12Months);
  }, [indicator.accumulated12Months, formatValue]);

  const formattedChange = React.useMemo(() => {
    if (!indicator.change && indicator.change !== 0) return null;
    return formatValue(Math.abs(indicator.change));
  }, [indicator.change, formatValue]);

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
        <div className="flex items-center gap-2">
          {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || isLoading}
            className="h-8 w-8 p-0"
            title="Atualizar indicador"
          >
            <RefreshCw className={cn('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {/* Monthly Value */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Mensal</p>
                <div className="text-2xl font-bold">
                  {formattedValue}
                  {!isMonetary && <span className="text-sm text-muted-foreground ml-1">{indicator.unit}</span>}
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
              </div>

              {/* 12-Month Accumulated */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  Acumulado 12 meses ({indicator.monthsCount} {indicator.monthsCount === 1 ? 'mês' : 'meses'})
                </p>
                <div className="text-xl font-semibold text-primary">
                  {formattedAccumulated}
                  {!isMonetary && <span className="text-sm text-muted-foreground ml-1">{indicator.unit}</span>}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
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
