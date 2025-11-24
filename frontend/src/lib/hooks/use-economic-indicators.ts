/**
 * useEconomicIndicators - React Query hooks for Economic Indicators
 *
 * Hooks for fetching economic indicators (8 types total) from backend FASE 2.
 * Follows TanStack Query v5 patterns from use-assets.ts.
 *
 * @created 2025-11-21 - FASE 1 (Frontend Economic Indicators)
 * @updated 2025-11-23 - FASE 1.4 (Added 5 new indicator types)
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type {
  LatestIndicatorResponse,
  LatestWithAccumulatedResponse,
  IndicatorsListResponse,
  IndicatorType,
} from '@/types/economic-indicator';

/**
 * Hook to fetch all economic indicators with optional filters
 * @param params - Optional filters (type, limit)
 * @returns React Query result with indicators list
 */
export function useEconomicIndicators(params?: { type?: string; limit?: number }) {
  return useQuery<IndicatorsListResponse>({
    queryKey: ['economic-indicators', params],
    queryFn: () => api.getEconomicIndicators(params),
    staleTime: 5 * 60 * 1000, // 5 minutes (economic data changes slowly)
  });
}

/**
 * Hook to fetch latest indicator by type (all 8 types supported)
 * UPDATED FASE 1.4: Now supports all 8 indicator types
 * @param type - Indicator type (IndicatorType)
 * @returns React Query result with latest indicator data + accumulated12Months
 */
export function useLatestIndicator(type: IndicatorType) {
  return useQuery<LatestWithAccumulatedResponse>({
    queryKey: ['economic-indicator', type],
    queryFn: () => api.getLatestIndicatorWithAccumulated(type),
    enabled: !!type,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Convenience hook to fetch all 8 latest indicators in parallel (FASE 1.4)
 * @returns Object with all 8 indicator queries + isLoading/isError states
 *
 * Example usage:
 * ```tsx
 * const { selic, ipca, cdi, ipca15, idpIngressos, ideSaidas, idpLiquido, ouroMonetario, isLoading, isError } = useAllLatestIndicators();
 * if (isLoading) return <Skeleton />;
 * if (isError) return <ErrorMessage />;
 * return <div>{selic.data.currentValue}</div>;
 * ```
 */
export function useAllLatestIndicators() {
  const selic = useLatestIndicator('SELIC');
  const ipca = useLatestIndicator('IPCA');
  const cdi = useLatestIndicator('CDI');
  const ipca15 = useLatestIndicator('IPCA_15');
  const idpIngressos = useLatestIndicator('IDP_INGRESSOS');
  const ideSaidas = useLatestIndicator('IDE_SAIDAS');
  const idpLiquido = useLatestIndicator('IDP_LIQUIDO');
  const ouroMonetario = useLatestIndicator('OURO_MONETARIO');

  return {
    selic,
    ipca,
    cdi,
    ipca15,
    idpIngressos,
    ideSaidas,
    idpLiquido,
    ouroMonetario,
    isLoading:
      selic.isLoading ||
      ipca.isLoading ||
      cdi.isLoading ||
      ipca15.isLoading ||
      idpIngressos.isLoading ||
      ideSaidas.isLoading ||
      idpLiquido.isLoading ||
      ouroMonetario.isLoading,
    isError:
      selic.isError ||
      ipca.isError ||
      cdi.isError ||
      ipca15.isError ||
      idpIngressos.isError ||
      ideSaidas.isError ||
      idpLiquido.isError ||
      ouroMonetario.isError,
  };
}
