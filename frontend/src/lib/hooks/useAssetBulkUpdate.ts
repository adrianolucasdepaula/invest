/**
 * WebSocket Hook para eventos de atualização em massa de ativos
 * Conecta ao namespace padrão do backend (AppWebSocketGateway)
 *
 * ✅ UPDATED: Agora captura logs individuais (asset_update_*) para exibição em tempo real
 * ✅ FIX: Changed to static import to fix browser module resolution
 * ✅ FIX: Persiste estado após page refresh verificando queue status via API
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3101';

// Types
// ✅ FIX FASE 114: Added batchId to all batch events to prevent race condition
export interface BatchUpdateStartedEvent {
  batchId: string;
  portfolioId?: string;
  totalAssets: number;
  tickers: string[];
  timestamp: Date;
}

export interface BatchUpdateProgressEvent {
  batchId: string;
  portfolioId?: string;
  current: number;
  total: number;
  currentTicker: string;
  timestamp: Date;
}

export interface BatchUpdateCompletedEvent {
  batchId: string;
  portfolioId?: string;
  totalAssets: number;
  successCount: number;
  failedCount: number;
  duration: number;
  timestamp: Date;
}

// ✅ NEW: Individual asset update events
export interface AssetUpdateStartedEvent {
  assetId: string;
  ticker: string;
  updateLogId: string;
  triggeredBy: string;
  timestamp: Date;
}

export interface AssetUpdateCompletedEvent {
  assetId: string;
  ticker: string;
  updateLogId: string;
  status: string;
  duration: number;
  metadata?: any;
  timestamp: Date;
}

export interface AssetUpdateFailedEvent {
  assetId: string;
  ticker: string;
  updateLogId: string;
  error: string;
  duration: number;
  timestamp: Date;
}

// ✅ NEW: Log entry type for UI
export interface AssetUpdateLogEntry {
  timestamp: Date;
  ticker: string;
  status: 'processing' | 'success' | 'failed' | 'system';
  message: string;
  duration?: number;
}

export interface AssetBulkUpdateState {
  isRunning: boolean;
  wasCancelled: boolean; // ✅ FIX: Flag para evitar polling restaurar estado após cancel
  currentBatchId: string | null; // ✅ FIX FASE 114: Track current batch to filter stale events
  currentTicker: string | null;
  progress: number; // 0-100
  current: number;
  total: number;
  successCount: number;
  failedCount: number;
  logs: AssetUpdateLogEntry[]; // ✅ NEW: Array de logs para exibição
}

// ✅ FIX: Limite de logs para evitar memory leak
const MAX_LOG_ENTRIES = 1000;

/**
 * Hook para gerenciar conexão WebSocket e eventos de atualização em massa de ativos
 *
 * Eventos suportados (namespace padrão):
 * - batch_update_started - Atualização em massa iniciada
 * - batch_update_progress - Progresso da atualização
 * - batch_update_completed - Atualização concluída
 *
 * @param options.onUpdateComplete - Callback ao completar atualização
 * @param options.onUpdateStarted - Callback ao iniciar atualização
 *
 * @example
 * const { state, isConnected } = useAssetBulkUpdate({
 *   onUpdateComplete: () => {
 *     toast.success('Atualização concluída!');
 *     refetch();
 *   }
 * });
 */
export function useAssetBulkUpdate(options?: {
  onUpdateComplete?: () => void;
  onUpdateStarted?: () => void;
}) {
  // ✅ FIX: Use mounted state to prevent SSR issues and hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<AssetBulkUpdateState>({
    isRunning: false,
    wasCancelled: false, // ✅ FIX: Inicializar flag de cancelamento
    currentBatchId: null, // ✅ FIX FASE 114: Track current batch
    currentTicker: null,
    progress: 0,
    current: 0,
    total: 0,
    successCount: 0,
    failedCount: 0,
    logs: [],
  });

  const socketRef = useRef<Socket | null>(null);
  // ✅ FIX: Store total assets count dynamically (fetched from API)
  const totalAssetsRef = useRef<number>(0);
  // ✅ FIX: Use ref for cancel flag to ensure immediate (synchronous) updates
  // setState is asynchronous and can cause race conditions with polling
  const wasCancelledRef = useRef<boolean>(false);
  // ✅ FIX FASE 114.6: Use ref for individual update flag to prevent React state batching race condition
  // When asset_update_started arrives, we set this ref SYNCHRONOUSLY before the batch_update_started
  // handler can check it - this prevents cron job batch events from overwriting individual update state
  const individualUpdateActiveRef = useRef<boolean>(false);

  // ✅ FIX: Use refs for callbacks to prevent reconnection on every render
  const onUpdateCompleteRef = useRef(options?.onUpdateComplete);
  const onUpdateStartedRef = useRef(options?.onUpdateStarted);

  // ✅ FASE 86: React Query integration for real-time table updates
  const queryClient = useQueryClient();

  // ✅ CRITICAL: Set mounted state only on client after hydration
  useEffect(() => {
    console.log('[ASSET BULK WS] Component mounted on CLIENT! Setting isMounted = true');
    setIsMounted(true);
  }, []);

  // ✅ FIX: Fetch total assets count dynamically (no hardcoded 861)
  useEffect(() => {
    if (!isMounted) return;

    const fetchTotalAssets = async () => {
      try {
        // Fetch all assets to get the count (API returns array directly)
        const assets = await api.getAssets();
        // API returns array directly, use length
        const count = Array.isArray(assets) ? assets.length : (assets.total || assets.length || 0);
        totalAssetsRef.current = count;
        console.log(`[ASSET BULK WS] Total assets fetched from API: ${count}`);
      } catch (error) {
        console.log('[ASSET BULK WS] Could not fetch total assets:', error);
        // Fallback: use 0, will be updated when batch starts via WebSocket
        totalAssetsRef.current = 0;
      }
    };

    fetchTotalAssets();
  }, [isMounted]);

  // ✅ FIX: Check queue status on mount to restore state after page refresh
  // Also poll periodically to keep state in sync
  useEffect(() => {
    console.log('[ASSET BULK WS] Queue status useEffect triggered! isMounted:', isMounted);
    if (!isMounted) return;

    const checkQueueStatus = async () => {
      try {
        console.log('[ASSET BULK WS] Checking queue status...');
        const queueStats = await api.getBulkUpdateStatus();
        console.log('[ASSET BULK WS] Queue stats:', JSON.stringify(queueStats));

        // If there are active or waiting jobs, restore running state
        const activeCount = queueStats.active || 0;
        const waitingCount = queueStats.waiting || 0;
        const totalPending = activeCount + waitingCount;

        console.log(`[ASSET BULK WS] Active: ${activeCount}, Waiting: ${waitingCount}, Total Pending: ${totalPending}`);

        if (totalPending > 0) {
          // Get current ticker from active jobs if available
          const currentTicker = queueStats.jobs?.active?.[0]?.data?.ticker || null;

          // ✅ FIX: Check ref BEFORE entering setState callback to avoid race conditions
          // The ref is updated synchronously, while setState is asynchronous
          if (wasCancelledRef.current) {
            console.log('[ASSET BULK WS] Ignorando jobs pendentes - cancelamento ativo (ref check)');
            return;
          }

          setState((prev) => {
            // ✅ FIX: Double-check both ref and state for extra safety
            if (prev.wasCancelled || wasCancelledRef.current) {
              console.log('[ASSET BULK WS] Ignorando jobs pendentes - cancelamento ativo');
              return prev;
            }

            // ✅ FIX FASE 114: Detectar atualização individual após batch
            // Se temos poucos jobs pendentes (1-5) mas o total anterior era maior (batch),
            // isso indica uma NOVA atualização individual - resetar estado
            const isNewIndividualUpdate = totalPending <= 5 && prev.total > totalPending && !prev.currentBatchId;

            // ✅ FIX FASE 86: Auto-restaurar estado quando há jobs pendentes
            // Isso permite que o card de progresso (com botões Cancelar/Pausar) apareça após refresh
            if (!prev.isRunning || isNewIndividualUpdate) {
              if (isNewIndividualUpdate) {
                console.log(`[ASSET BULK WS] Nova atualização individual detectada: ${totalPending} jobs (anterior: ${prev.total})`);
              } else {
                console.log(`[ASSET BULK WS] Restaurando estado: ${totalPending} jobs pendentes na fila`);
              }

              // ✅ FIX: Usar totalPending como total quando detectamos jobs via polling
              // Isso corrige a discrepância quando usuário atualiza um único ativo
              // (antes mostrava "1/22" do batch anterior, agora mostra "0/1" corretamente)
              return {
                ...prev,
                isRunning: true, // ← CRÍTICO: Ativa o card de progresso com botões Cancelar/Pausar
                wasCancelled: false, // ✅ FIX: Limpar flag ao restaurar
                currentBatchId: null, // ✅ FIX FASE 114: Limpar batchId para atualização individual
                currentTicker,
                total: totalPending, // ✅ FIX: Usar jobs pendentes como total (não preservar total antigo)
                current: 0, // ✅ FIX: Começar do zero (não sabemos quantos já completaram nesta sessão)
                progress: 0,
                successCount: 0,
                failedCount: 0,
                logs: isNewIndividualUpdate ? [
                  {
                    timestamp: new Date(),
                    ticker: 'SYSTEM',
                    status: 'system' as const,
                    message: `Iniciando atualização de ${totalPending} ativo(s)...`,
                  },
                ] : [
                  {
                    timestamp: new Date(),
                    ticker: 'SYSTEM',
                    status: 'system' as const,
                    message: `Reconectando... ${totalPending} jobs pendentes na fila`,
                  },
                ],
              };
            }

            // Already running (user clicked the button) - update progress
            console.log(`[ASSET BULK WS] Updating progress: ${totalPending} pending jobs`);

            // ✅ FIX FASE 114.4: Detect individual update when we have few jobs but large prev.total
            // This happens when:
            // 1. A batch finished (prev.total was 56, prev.isRunning=true from last poll)
            // 2. User clicks "Atualizar Dados" for single asset (totalPending=1)
            // 3. Without this fix, it would show "55/56" instead of "0/1"
            const isIndividualAfterBatch = totalPending <= 5 && prev.total > 10 && !prev.currentBatchId;

            if (isIndividualAfterBatch) {
              console.log(`[ASSET BULK WS] Individual update detected after batch: ${totalPending} jobs (prev.total was ${prev.total}) - resetting state`);
              return {
                ...prev,
                currentBatchId: null,
                currentTicker,
                total: totalPending,
                current: 0,
                progress: 0,
                successCount: 0,
                failedCount: 0,
                logs: [
                  {
                    timestamp: new Date(),
                    ticker: 'SYSTEM',
                    status: 'system' as const,
                    message: `Iniciando atualização de ${totalPending} ativo(s)...`,
                  },
                ],
              };
            }

            // ✅ FIX FASE 114.5: For small updates (1-5 jobs), always use totalPending as total
            // This prevents stale prev.total from batch updates overwriting individual update state
            // The issue was: polling runs multiple times, and after first run sets total=1,
            // subsequent runs would see prev.total=1 and not trigger isIndividualAfterBatch,
            // falling through to this else branch which could use wrong estimatedTotal
            const isSmallUpdate = totalPending <= 5;

            // ✅ FIX FASE 132+: Detect new larger batch to prevent negative progress
            // Bug: If prev.total=1 (from retry) and totalPending=861 (new batch),
            // currentProcessed = 1 - 861 = -860 (NEGATIVE!)
            // Solution: Reset estimatedTotal when totalPending >> prev.total
            const isNewLargerBatch = prev.total > 0 && totalPending > prev.total * 2;

            // For small updates (likely individual), use totalPending directly
            // For new larger batches, use totalPending (reset prev.total)
            // For larger updates, use existing total or estimate
            const estimatedTotal = isSmallUpdate
              ? totalPending
              : isNewLargerBatch
                ? Math.max(totalPending, totalAssetsRef.current || totalPending)
                : (prev.total > 0 ? prev.total : Math.max(totalPending, totalAssetsRef.current || totalPending));

            // Calculate current progress based on remaining jobs
            // ✅ FIX: Ensure non-negative values with Math.max(0, ...)
            const currentProcessed = Math.max(0, estimatedTotal - totalPending);
            const progress = estimatedTotal > 0 ? Math.round((currentProcessed / estimatedTotal) * 100) : 0;

            console.log(`[ASSET BULK WS] Updating progress: totalPending=${totalPending}, isSmallUpdate=${isSmallUpdate}, isNewLargerBatch=${isNewLargerBatch}, estimatedTotal=${estimatedTotal}, currentProcessed=${currentProcessed}`);

            return {
              ...prev,
              currentTicker,
              total: estimatedTotal,
              current: currentProcessed,
              progress,
            };
          });
        } else {
          // No pending jobs - limpar estados
          // ✅ FIX: Reset ref synchronously when queue is empty
          wasCancelledRef.current = false;
          setState((prev) => {
            if (prev.isRunning || prev.wasCancelled) {
              console.log('[ASSET BULK WS] No pending jobs, marking as completed and clearing cancel flag');
              return {
                ...prev,
                isRunning: false,
                wasCancelled: false, // ✅ FIX: Limpar flag quando fila esvazia
                progress: prev.isRunning ? 100 : prev.progress,
              };
            }
            return prev;
          });
        }
      } catch (error) {
        console.log('[ASSET BULK WS] Could not check queue status:', error);
      }
    };

    // Check immediately on mount
    checkQueueStatus();

    // Also poll every 10 seconds to keep state in sync (useful after refresh)
    const pollInterval = setInterval(checkQueueStatus, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isMounted]);

  // Keep refs updated
  useEffect(() => {
    onUpdateCompleteRef.current = options?.onUpdateComplete;
    onUpdateStartedRef.current = options?.onUpdateStarted;
  }, [options?.onUpdateComplete, options?.onUpdateStarted]);

  // Conectar ao namespace padrão - ONLY after client mount
  useEffect(() => {
    console.log('[ASSET BULK WS] Connection useEffect triggered! isMounted:', isMounted, 'window:', typeof window);

    // ✅ CRITICAL: Only connect after component is mounted on client (after hydration)
    if (!isMounted) {
      console.log('[ASSET BULK WS] Skipping - component not mounted yet (SSR or pre-hydration)');
      return;
    }

    console.log('[ASSET BULK WS] Component is mounted on CLIENT! Connecting to:', WS_URL);

    // ✅ FIX: Use static import (already imported at top of file)
    const socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    console.log('[ASSET BULK WS] Socket created, waiting for connection...');

      // Connection handlers
      socket.on('connect', () => {
        console.log('[ASSET BULK WS] Conectado ao WebSocket');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('[ASSET BULK WS] Desconectado');
        setIsConnected(false);
      });

      socket.on('error', (error: any) => {
        console.error('[ASSET BULK WS] Erro:', error);
      });

      // Event: batch_update_started
      // ✅ FIX FASE 114: Now stores batchId to filter subsequent events
      // ✅ FIX FASE 114.3: Ignore stale events when in individual update mode
      socket.on('batch_update_started', (data: BatchUpdateStartedEvent) => {
        console.log('[ASSET BULK WS] Batch update started:', data.batchId, data);

        // ✅ FIX FASE 114.6: Check ref SYNCHRONOUSLY before entering setState callback
        // This prevents race condition when asset_update_started arrives just before batch_update_started
        // The ref is set synchronously in asset_update_started handler, while setState is async
        if (individualUpdateActiveRef.current) {
          console.log(`[ASSET BULK WS] Ignoring batch_update_started: ${data.batchId.slice(-8)} - individual update in progress (ref check)`);
          return;
        }

        setState((prev) => {
          // ✅ FIX FASE 114.3: Detect stale batch events when in individual update mode
          // If polling has already detected an individual update (1-5 jobs) and set currentBatchId to null,
          // ignore batch_update_started events from old batches
          const isIndividualUpdateMode = !prev.currentBatchId && prev.isRunning && prev.total <= 5;

          if (isIndividualUpdateMode) {
            console.log(`[ASSET BULK WS] Ignoring stale batch_update_started: ${data.batchId.slice(-8)} (individual update mode, total: ${prev.total})`);
            return prev;
          }

          // ✅ FIX: Reset ref synchronously when new update starts
          wasCancelledRef.current = false;

          return {
            isRunning: true,
            wasCancelled: false, // ✅ FIX: Limpar flag ao iniciar nova atualização
            currentBatchId: data.batchId, // ✅ FIX FASE 114: Store batchId
            currentTicker: null,
            progress: 0,
            current: 0,
            total: data.totalAssets,
            successCount: 0,
            failedCount: 0,
            logs: [
              {
                timestamp: new Date(data.timestamp),
                ticker: 'SYSTEM',
                status: 'system',
                message: `Iniciando atualização de ${data.totalAssets} ativos... (batch: ${data.batchId.slice(-8)})`,
              },
            ],
          };
        });

        // Callback onUpdateStarted (use ref)
        if (onUpdateStartedRef.current) {
          onUpdateStartedRef.current();
        }
      });

      // ✅ NEW: Event: asset_update_started (individual asset)
      // ✅ FIX FASE 114: Reset state when individual update starts without batch_update_started
      // ✅ FIX FASE 114.2: Always ensure currentBatchId=null for individual updates
      //    even when polling has already set isRunning=true
      socket.on('asset_update_started', (data: AssetUpdateStartedEvent) => {
        console.log('[ASSET BULK WS] Asset update started:', data.ticker);

        // ✅ FIX FASE 114.6: Set ref SYNCHRONOUSLY before setState to prevent race condition
        // This ensures that if batch_update_started arrives right after this event,
        // it will see the ref=true and skip overwriting our state
        // We check if this looks like an individual update (no batch context)
        // Note: We set the ref here and clear it when the update completes
        individualUpdateActiveRef.current = true;
        console.log('[ASSET BULK WS] individualUpdateActiveRef set to TRUE');

        setState((prev) => {
          // ✅ FIX FASE 114.2: Detect individual update by checking:
          // 1. No currentBatchId set (polling restored state without batch info)
          // 2. Total is small (1-5 assets = individual/small update)
          // 3. Not currently in a batch (no batch_update_started event received)
          const isIndividualUpdate = !prev.currentBatchId && prev.total <= 5;

          // ✅ FIX FASE 114.6: If this asset is part of a batch, clear the ref
          // (batch_update_started would have already set currentBatchId)
          if (prev.currentBatchId) {
            individualUpdateActiveRef.current = false;
            console.log('[ASSET BULK WS] individualUpdateActiveRef set to FALSE (part of batch)');
          }

          // ✅ FIX: If not running OR if this is an individual update (polling may have set isRunning=true),
          // reset state to show this is a new 1-asset update
          // This fixes the bug where status showed "55/56" instead of "0/1" for individual updates
          if (!prev.isRunning || isIndividualUpdate) {
            if (isIndividualUpdate && prev.isRunning) {
              console.log(`[ASSET BULK WS] Individual update detected for ${data.ticker} (polling already running) - forcing reset`);
            } else {
              console.log(`[ASSET BULK WS] Individual update detected for ${data.ticker} - resetting state`);
            }
            return {
              ...prev,
              isRunning: true,
              wasCancelled: false,
              currentBatchId: null, // Individual update has no batch - CRITICAL for filtering
              currentTicker: data.ticker,
              progress: 0,
              current: 0,
              total: 1, // Single asset update
              successCount: 0,
              failedCount: 0,
              logs: [
                {
                  timestamp: new Date(data.timestamp),
                  ticker: data.ticker,
                  status: 'processing',
                  message: `Processando ${data.ticker}...`,
                },
              ],
            };
          }

          // Already running as part of a batch (currentBatchId is set), just update ticker and add log
          console.log(`[ASSET BULK WS] Asset ${data.ticker} is part of batch ${prev.currentBatchId?.slice(-8)}`);
          return {
            ...prev,
            currentTicker: data.ticker,
            logs: [
              ...prev.logs,
              {
                timestamp: new Date(data.timestamp),
                ticker: data.ticker,
                status: 'processing',
                message: `Processando ${data.ticker}...`,
              },
            ],
          };
        });
      });

      // ✅ NEW: Event: asset_update_completed (individual asset)
      // ✅ FIX: Now also updates current and progress to show real-time progress
      // ✅ FASE 86: Invalidate React Query cache for real-time "Última Atualização" updates
      // ✅ FIX FASE 114: Mark isRunning=false when individual update completes
      socket.on('asset_update_completed', (data: AssetUpdateCompletedEvent) => {
        console.log('[ASSET BULK WS] Asset update completed:', data.ticker);

        // ✅ FASE 86: Invalidate assets cache to refresh "Última Atualização" column in real-time
        queryClient.invalidateQueries({ queryKey: ['assets'] });

        setState((prev) => {
          const newSuccessCount = prev.successCount + 1;
          const newCurrent = prev.current + 1;
          const newProgress = prev.total > 0 ? Math.round((newCurrent / prev.total) * 100) : 0;

          // ✅ FIX FASE 114: If this was an individual update (no batch), mark as completed
          const isIndividualUpdateComplete = !prev.currentBatchId && newCurrent >= prev.total;

          // ✅ FIX FASE 114.6: Clear individual update ref when completed
          if (isIndividualUpdateComplete) {
            individualUpdateActiveRef.current = false;
            console.log('[ASSET BULK WS] individualUpdateActiveRef set to FALSE (update completed)');
          }

          return {
            ...prev,
            isRunning: isIndividualUpdateComplete ? false : prev.isRunning,
            successCount: newSuccessCount,
            current: newCurrent,
            progress: newProgress,
            logs: [
              ...prev.logs,
              {
                timestamp: new Date(data.timestamp),
                ticker: data.ticker,
                status: 'success',
                message: `✅ ${data.ticker} atualizado com sucesso`,
                duration: data.duration / 1000, // Convert ms to seconds
              },
            ],
          };
        });
      });

      // ✅ NEW: Event: asset_update_failed (individual asset)
      // ✅ FIX: Now also updates current and progress to show real-time progress
      // ✅ FIX FASE 114: Mark isRunning=false when individual update fails
      socket.on('asset_update_failed', (data: AssetUpdateFailedEvent) => {
        console.log('[ASSET BULK WS] Asset update failed:', data.ticker, data.error);
        setState((prev) => {
          const newFailedCount = prev.failedCount + 1;
          const newCurrent = prev.current + 1;
          const newProgress = prev.total > 0 ? Math.round((newCurrent / prev.total) * 100) : 0;

          // ✅ FIX FASE 114: If this was an individual update (no batch), mark as completed
          const isIndividualUpdateComplete = !prev.currentBatchId && newCurrent >= prev.total;

          // ✅ FIX FASE 114.6: Clear individual update ref when completed (even on failure)
          if (isIndividualUpdateComplete) {
            individualUpdateActiveRef.current = false;
            console.log('[ASSET BULK WS] individualUpdateActiveRef set to FALSE (update failed)');
          }

          return {
            ...prev,
            isRunning: isIndividualUpdateComplete ? false : prev.isRunning,
            failedCount: newFailedCount,
            current: newCurrent,
            progress: newProgress,
            logs: [
              ...prev.logs,
              {
                timestamp: new Date(data.timestamp),
                ticker: data.ticker,
                status: 'failed',
                message: `❌ ${data.ticker} falhou: ${data.error}`,
                duration: data.duration / 1000,
              },
            ],
          };
        });
      });

      // Event: batch_update_progress
      // ✅ FIX FASE 114: Now filters events by batchId to prevent race condition
      socket.on('batch_update_progress', (data: BatchUpdateProgressEvent) => {
        console.log('[ASSET BULK WS] Batch update progress:', data.batchId, data);

        setState((prev) => {
          // ✅ FIX FASE 114: Ignore events from different batches OR when we don't have a batch
          // Critical: When currentBatchId is null (individual update), ignore ALL batch events
          // This prevents stale events from overwriting individual update state
          if (!prev.currentBatchId || data.batchId !== prev.currentBatchId) {
            const reason = !prev.currentBatchId
              ? 'no current batch (individual update mode)'
              : `different batch (current: ${prev.currentBatchId.slice(-8)})`;
            console.log(`[ASSET BULK WS] Ignoring batch progress event: ${reason}`);
            return prev;
          }

          const progressPercentage = Math.round((data.current / data.total) * 100);
          return {
            ...prev,
            currentTicker: data.currentTicker,
            progress: progressPercentage,
            current: data.current,
            total: data.total,
          };
        });
      });

      // Event: batch_update_completed
      // ✅ FIX FASE 114: Now filters events by batchId to prevent race condition
      socket.on('batch_update_completed', (data: BatchUpdateCompletedEvent) => {
        console.log('[ASSET BULK WS] Batch update completed:', data.batchId, data);

        setState((prev) => {
          // ✅ FIX FASE 114: Ignore completion events from different batches OR when in individual mode
          // Exception: Allow "cancelled-*" events which reset state
          const isCancellation = data.batchId.startsWith('cancelled-');

          // When currentBatchId is null (individual update mode), ignore ALL batch completion events
          // unless it's a cancellation event (which should always be processed)
          if (!isCancellation && (!prev.currentBatchId || data.batchId !== prev.currentBatchId)) {
            const reason = !prev.currentBatchId
              ? 'no current batch (individual update mode)'
              : `different batch (current: ${prev.currentBatchId.slice(-8)})`;
            console.log(`[ASSET BULK WS] Ignoring batch completion event: ${reason}`);
            return prev;
          }

          const durationMinutes = Math.round(data.duration / 60000);
          return {
            ...prev,
            isRunning: false,
            currentBatchId: null, // ✅ FIX FASE 114: Clear batchId on completion
            currentTicker: null,
            progress: 100,
            successCount: data.successCount,
            failedCount: data.failedCount,
            logs: [
              ...prev.logs,
              {
                timestamp: new Date(data.timestamp),
                ticker: 'SYSTEM',
                status: 'system' as const,
                message: isCancellation
                  ? `⛔ Atualização cancelada`
                  : `✅ Atualização concluída: ${data.successCount}/${data.totalAssets} sucesso, ${data.failedCount} falhas (${durationMinutes}min)`,
                duration: data.duration / 1000,
              },
            ],
          };
        });

        // Callback onUpdateComplete (use ref)
        if (onUpdateCompleteRef.current) {
          onUpdateCompleteRef.current();
        }
      });

    // Cleanup ao desmontar
    return () => {
      console.log('[ASSET BULK WS] Disconnecting socket...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isMounted, queryClient]); // ✅ FIX: Depend on isMounted to trigger connection after client hydration

  /**
   * Resetar estado
   */
  const resetState = useCallback(() => {
    // ✅ FIX: Reset ref synchronously
    wasCancelledRef.current = false;
    setState({
      isRunning: false,
      wasCancelled: false, // ✅ FIX: Incluir flag de cancelamento
      currentBatchId: null, // ✅ FIX FASE 114: Reset batchId
      currentTicker: null,
      progress: 0,
      current: 0,
      total: 0,
      successCount: 0,
      failedCount: 0,
      logs: [],
    });
  }, []);

  /**
   * ✅ NEW: Limpar apenas os logs (manter outros estados)
   */
  const clearLogs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logs: [],
    }));
  }, []);

  /**
   * ✅ FIX: Cancelar atualização em andamento
   * Define wasCancelled=true para impedir que polling restaure isRunning
   * Uses ref for immediate (synchronous) update to avoid race conditions with polling
   */
  const cancelUpdate = useCallback(() => {
    // ✅ FIX: Set ref FIRST (synchronous) before setState (asynchronous)
    // This ensures polling immediately sees the cancellation
    wasCancelledRef.current = true;
    console.log('[ASSET BULK WS] Cancel requested - wasCancelledRef set to true');

    setState((prev) => ({
      ...prev,
      isRunning: false,
      wasCancelled: true,
      logs: [
        ...prev.logs.slice(-(MAX_LOG_ENTRIES - 1)), // Manter limite de logs
        {
          timestamp: new Date(),
          ticker: 'SYSTEM',
          status: 'system' as const,
          message: '⛔ Atualização cancelada pelo usuário',
        },
      ],
    }));
  }, []);

  return {
    isConnected,
    state,
    resetState,
    clearLogs,
    cancelUpdate, // ✅ FIX: Exportar função de cancelamento
  };
}
