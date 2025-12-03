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
import { api } from '@/lib/api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3101';

// Types
export interface BatchUpdateStartedEvent {
  portfolioId?: string;
  totalAssets: number;
  tickers: string[];
  timestamp: Date;
}

export interface BatchUpdateProgressEvent {
  portfolioId?: string;
  current: number;
  total: number;
  currentTicker: string;
  timestamp: Date;
}

export interface BatchUpdateCompletedEvent {
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
  currentTicker: string | null;
  progress: number; // 0-100
  current: number;
  total: number;
  successCount: number;
  failedCount: number;
  logs: AssetUpdateLogEntry[]; // ✅ NEW: Array de logs para exibição
}

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
    currentTicker: null,
    progress: 0,
    current: 0,
    total: 0,
    successCount: 0,
    failedCount: 0,
    logs: [], // ✅ NEW: Initialize empty logs array
  });

  const socketRef = useRef<Socket | null>(null);
  // ✅ FIX: Store total assets count dynamically (fetched from API)
  const totalAssetsRef = useRef<number>(0);

  // ✅ FIX: Use refs for callbacks to prevent reconnection on every render
  const onUpdateCompleteRef = useRef(options?.onUpdateComplete);
  const onUpdateStartedRef = useRef(options?.onUpdateStarted);

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
          console.log(`[ASSET BULK WS] Found ${totalPending} pending jobs, restoring/updating running state`);

          // Get current ticker from active jobs if available
          const currentTicker = queueStats.jobs?.active?.[0]?.data?.ticker || null;

          setState((prev) => {
            // ✅ FIX: If already running with a higher total, keep the existing total
            // This prevents resetting progress when polling updates
            const shouldUpdateTotal = !prev.isRunning || prev.total === 0;

            // ✅ FIX: Use dynamic total from API instead of hardcoded 861
            // Use existing total if we have one, otherwise use fetched total or queue count
            const estimatedTotal = shouldUpdateTotal
              ? Math.max(totalPending, totalAssetsRef.current || totalPending)
              : prev.total;

            // Calculate current progress based on remaining jobs
            const currentProcessed = estimatedTotal - totalPending;
            const progress = estimatedTotal > 0 ? Math.round((currentProcessed / estimatedTotal) * 100) : 0;

            // Only add system log on first detection (when not already running)
            const newLogs = prev.isRunning
              ? prev.logs
              : [
                  {
                    timestamp: new Date(),
                    ticker: 'SYSTEM',
                    status: 'system' as const,
                    message: `Atualização em andamento: ${totalPending} ativos pendentes...`,
                  },
                ];

            return {
              ...prev,
              isRunning: true,
              currentTicker,
              total: estimatedTotal,
              current: currentProcessed,
              progress,
              // Keep existing success/failed counts if already running
              successCount: prev.isRunning ? prev.successCount : 0,
              failedCount: prev.isRunning ? prev.failedCount : 0,
              logs: newLogs,
            };
          });
        } else {
          // No pending jobs - if we were running, mark as completed
          setState((prev) => {
            if (prev.isRunning) {
              console.log('[ASSET BULK WS] No pending jobs, marking as completed');
              return {
                ...prev,
                isRunning: false,
                progress: 100,
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
      socket.on('batch_update_started', (data: BatchUpdateStartedEvent) => {
        console.log('[ASSET BULK WS] Batch update started:', data);
        setState({
          isRunning: true,
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
              message: `Iniciando atualização de ${data.totalAssets} ativos...`,
            },
          ],
        });

        // Callback onUpdateStarted (use ref)
        if (onUpdateStartedRef.current) {
          onUpdateStartedRef.current();
        }
      });

      // ✅ NEW: Event: asset_update_started (individual asset)
      socket.on('asset_update_started', (data: AssetUpdateStartedEvent) => {
        console.log('[ASSET BULK WS] Asset update started:', data.ticker);
        setState((prev) => ({
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
        }));
      });

      // ✅ NEW: Event: asset_update_completed (individual asset)
      // ✅ FIX: Now also updates current and progress to show real-time progress
      socket.on('asset_update_completed', (data: AssetUpdateCompletedEvent) => {
        console.log('[ASSET BULK WS] Asset update completed:', data.ticker);
        setState((prev) => {
          const newSuccessCount = prev.successCount + 1;
          const newCurrent = prev.current + 1;
          const newProgress = prev.total > 0 ? Math.round((newCurrent / prev.total) * 100) : 0;

          return {
            ...prev,
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
      socket.on('asset_update_failed', (data: AssetUpdateFailedEvent) => {
        console.log('[ASSET BULK WS] Asset update failed:', data.ticker, data.error);
        setState((prev) => {
          const newFailedCount = prev.failedCount + 1;
          const newCurrent = prev.current + 1;
          const newProgress = prev.total > 0 ? Math.round((newCurrent / prev.total) * 100) : 0;

          return {
            ...prev,
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
      socket.on('batch_update_progress', (data: BatchUpdateProgressEvent) => {
        console.log('[ASSET BULK WS] Batch update progress:', data);
        const progressPercentage = Math.round((data.current / data.total) * 100);

        setState((prev) => ({
          ...prev,
          currentTicker: data.currentTicker,
          progress: progressPercentage,
          current: data.current,
          total: data.total,
        }));
      });

      // Event: batch_update_completed
      socket.on('batch_update_completed', (data: BatchUpdateCompletedEvent) => {
        console.log('[ASSET BULK WS] Batch update completed:', data);
        const durationMinutes = Math.round(data.duration / 60000);
        setState((prev) => ({
          ...prev,
          isRunning: false,
          currentTicker: null,
          progress: 100,
          successCount: data.successCount,
          failedCount: data.failedCount,
          logs: [
            ...prev.logs,
            {
              timestamp: new Date(data.timestamp),
              ticker: 'SYSTEM',
              status: 'system',
              message: `✅ Atualização concluída: ${data.successCount}/${data.totalAssets} sucesso, ${data.failedCount} falhas (${durationMinutes}min)`,
              duration: data.duration / 1000,
            },
          ],
        }));

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
  }, [isMounted]); // ✅ FIX: Depend on isMounted to trigger connection after client hydration

  /**
   * Resetar estado
   */
  const resetState = useCallback(() => {
    setState({
      isRunning: false,
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

  return {
    isConnected,
    state,
    resetState,
    clearLogs, // ✅ NEW: Export clearLogs function
  };
}
