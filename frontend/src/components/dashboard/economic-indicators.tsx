/**
 * EconomicIndicators - Container component for displaying all economic indicators
 *
 * Shows 8 economic indicators in a responsive grid (FASE 1.4).
 * Indicators: SELIC, IPCA, CDI, IPCA-15, IDP Ingressos, IDE Saídas, IDP Líquido, Ouro Monetário
 * Fetches data from backend FASE 2 economic indicators endpoints.
 *
 * @created 2025-11-21 - FASE 1 (Frontend Economic Indicators)
 * @updated 2025-11-23 - FASE 1.4 (Added 5 new indicators)
 */

'use client';

import { useAllLatestIndicators } from '@/lib/hooks/use-economic-indicators';
import { EconomicIndicatorCard } from './economic-indicator-card';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Coins,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function EconomicIndicators() {
  const {
    selic,
    ipca,
    cdi,
    ipca15,
    idpIngressos,
    ideSaidas,
    idpLiquido,
    ouroMonetario,
    isLoading,
    isError,
  } = useAllLatestIndicators();

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
          Taxas e indicadores atualizados do Banco Central do Brasil (8 indicadores - FASE 1.4)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {Array(8)
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
            {/* Row 1: SELIC, IPCA, CDI, IPCA-15 */}
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
            {ipca15.data && (
              <EconomicIndicatorCard
                indicator={ipca15.data}
                isLoading={ipca15.isLoading}
                icon={<Calendar className="h-4 w-4" />}
              />
            )}

            {/* Row 2: IDP Ingressos, IDE Saídas, IDP Líquido, Ouro Monetário */}
            {idpIngressos.data && (
              <EconomicIndicatorCard
                indicator={idpIngressos.data}
                isLoading={idpIngressos.isLoading}
                icon={<ArrowDownToLine className="h-4 w-4" />}
              />
            )}
            {ideSaidas.data && (
              <EconomicIndicatorCard
                indicator={ideSaidas.data}
                isLoading={ideSaidas.isLoading}
                icon={<ArrowUpFromLine className="h-4 w-4" />}
              />
            )}
            {idpLiquido.data && (
              <EconomicIndicatorCard
                indicator={idpLiquido.data}
                isLoading={idpLiquido.isLoading}
                icon={<ArrowRightLeft className="h-4 w-4" />}
              />
            )}
            {ouroMonetario.data && (
              <EconomicIndicatorCard
                indicator={ouroMonetario.data}
                isLoading={ouroMonetario.isLoading}
                icon={<Coins className="h-4 w-4" />}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
