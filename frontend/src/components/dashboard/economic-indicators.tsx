/**
 * EconomicIndicators - Container component for displaying all economic indicators
 *
 * Shows SELIC, IPCA, and CDI in a 3-column grid with loading states and error handling.
 * Fetches data from backend FASE 2 economic indicators endpoints.
 *
 * @created 2025-11-21 - FASE 1 (Frontend Economic Indicators)
 */

'use client';

import { useAllLatestIndicators } from '@/lib/hooks/use-economic-indicators';
import { EconomicIndicatorCard } from './economic-indicator-card';
import { TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function EconomicIndicators() {
  const { selic, ipca, cdi, isLoading, isError } = useAllLatestIndicators();

  if (isError) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Indicadores Econômicos</h2>
          <p className="text-muted-foreground">
            Taxas atualizadas do Banco Central do Brasil
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm text-destructive">
            Erro ao carregar indicadores econômicos. Tente novamente mais tarde.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Indicadores Econômicos</h2>
        <p className="text-muted-foreground">
          Taxas atualizadas do Banco Central do Brasil
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </Card>
              ))}
          </>
        ) : (
          <>
            {selic.data && (
              <EconomicIndicatorCard
                indicator={selic.data}
                isLoading={selic.isLoading}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            )}
            {ipca.data && (
              <EconomicIndicatorCard
                indicator={ipca.data}
                isLoading={ipca.isLoading}
                icon={<Percent className="h-4 w-4" />}
              />
            )}
            {cdi.data && (
              <EconomicIndicatorCard
                indicator={cdi.data}
                isLoading={cdi.isLoading}
                icon={<TrendingDown className="h-4 w-4" />}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
