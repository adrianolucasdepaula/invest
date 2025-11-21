/**
 * useEconomicIndicators - React Query hooks for Economic Indicators
 *
 * Hooks for fetching economic indicators (SELIC, IPCA, CDI) from backend FASE 2.
 * Follows TanStack Query v5 patterns from use-assets.ts.
 *
 * @created 2025-11-21 - FASE 1 (Frontend Economic Indicators)
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { LatestIndicatorResponse, IndicatorsListResponse } from '@/types/economic-indicator';

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
 * Hook to fetch latest indicator by type (SELIC, IPCA, or CDI)
 * @param type - Indicator type ('SELIC' | 'IPCA' | 'CDI')
 * @returns React Query result with latest indicator data
 */
export function useLatestIndicator(type: 'SELIC' | 'IPCA' | 'CDI') {
  return useQuery<LatestIndicatorResponse>({
    queryKey: ['economic-indicator', type],
    queryFn: () => api.getLatestIndicator(type),
    enabled: !!type,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Convenience hook to fetch all 3 latest indicators in parallel
 * @returns Object with selic, ipca, cdi queries + isLoading/isError states
 *
 * Example usage:
 * ```tsx
 * const { selic, ipca, cdi, isLoading, isError } = useAllLatestIndicators();
 * if (isLoading) return <Skeleton />;
 * if (isError) return <ErrorMessage />;
 * return <div>{selic.data.currentValue}</div>;
 * ```
 */
export function useAllLatestIndicators() {
  const selic = useLatestIndicator('SELIC');
  const ipca = useLatestIndicator('IPCA');
  const cdi = useLatestIndicator('CDI');

  return {
    selic,
    ipca,
    cdi,
    isLoading: selic.isLoading || ipca.isLoading || cdi.isLoading,
    isError: selic.isError || ipca.isError || cdi.isError,
  };
}
