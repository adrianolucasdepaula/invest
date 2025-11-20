/**
 * FASE 35: React Query Hooks para Sistema de Gerenciamento de Sync B3
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSyncStatus, startBulkSync, getSyncStats } from '../api/data-sync';
import type { SyncBulkRequestDto } from '../types/data-sync';

/**
 * Hook para obter status de sincronização de todos os ativos
 *
 * Refetch automático:
 * - staleTime: 30s (dados frescos por 30 segundos)
 * - refetchInterval: desabilitado (manual via invalidateQueries)
 *
 * @example
 * const { data, isLoading, error } = useSyncStatus();
 * if (data) {
 *   console.log(data.summary); // { total: 55, synced: 6, ... }
 * }
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: getSyncStatus,
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para iniciar sincronização em massa
 *
 * Comportamento:
 * 1. Envia requisição POST /sync-bulk
 * 2. Backend retorna HTTP 202 Accepted imediatamente
 * 3. Invalida cache de sync-status após sucesso
 * 4. Progresso monitorado via useSyncWebSocket
 *
 * @example
 * const syncMutation = useStartBulkSync();
 * await syncMutation.mutateAsync({
 *   tickers: ['VALE3', 'PETR4'],
 *   startYear: 2020,
 *   endYear: 2024
 * });
 * console.log(syncMutation.data?.estimatedMinutes); // 5
 */
export function useStartBulkSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SyncBulkRequestDto) => startBulkSync(request),
    onSuccess: () => {
      // Invalidar cache de status para refetch automático
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
  });
}

/**
 * Hook para obter estatísticas consolidadas de sincronização
 *
 * Inclui métricas adicionais:
 * - Total de registros carregados
 * - Média de registros por ativo
 * - Cobertura percentual (ativos SYNCED)
 * - Top 5 ativos com mais/menos dados
 *
 * @example
 * const { data: stats } = useSyncStats();
 * console.log(stats?.metrics.coverage); // "10.9%"
 * console.log(stats?.topAssets.mostData); // [{ ticker: 'VALE3', records: 2514 }, ...]
 */
export function useSyncStats() {
  return useQuery({
    queryKey: ['sync-stats'],
    queryFn: getSyncStats,
    staleTime: 60 * 1000, // 1 minuto
  });
}

/**
 * Hook helper para invalidar manualmente o cache de sync status
 *
 * Útil para forçar refetch após eventos WebSocket (sync:completed)
 *
 * @example
 * const { refetchSyncStatus } = useSyncHelpers();
 * // No handler do WebSocket:
 * socket.on('sync:completed', () => {
 *   refetchSyncStatus();
 * });
 */
export function useSyncHelpers() {
  const queryClient = useQueryClient();

  const refetchSyncStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
  };

  return { refetchSyncStatus };
}
