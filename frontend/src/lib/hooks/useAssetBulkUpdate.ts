/**
 * WebSocket Hook para eventos de atualização em massa de ativos
 * Conecta ao namespace padrão do backend (AppWebSocketGateway)
 *
 * ✅ UPDATED: Agora captura logs individuais (asset_update_*) para exibição em tempo real
 */

import { useEffect, useState, useCallback, useRef } from 'react';

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

  const socketRef = useRef<any>(null);

  // ✅ FIX: Use refs for callbacks to prevent reconnection on every render
  const onUpdateCompleteRef = useRef(options?.onUpdateComplete);
  const onUpdateStartedRef = useRef(options?.onUpdateStarted);

  // ✅ CRITICAL: Set mounted state only on client after hydration
  useEffect(() => {
    console.log('[ASSET BULK WS] Component mounted on CLIENT! Setting isMounted = true');
    setIsMounted(true);
  }, []);

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

    // Use dynamic import to avoid SSR issues
    let socket: any = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      const { io } = await import('socket.io-client');

      console.log('[ASSET BULK WS] Socket.io loaded, creating connection...');

      socket = io(WS_URL, {
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
      socket.on('asset_update_completed', (data: AssetUpdateCompletedEvent) => {
        console.log('[ASSET BULK WS] Asset update completed:', data.ticker);
        setState((prev) => ({
          ...prev,
          successCount: prev.successCount + 1,
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
        }));
      });

      // ✅ NEW: Event: asset_update_failed (individual asset)
      socket.on('asset_update_failed', (data: AssetUpdateFailedEvent) => {
        console.log('[ASSET BULK WS] Asset update failed:', data.ticker, data.error);
        setState((prev) => ({
          ...prev,
          failedCount: prev.failedCount + 1,
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
        }));
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
