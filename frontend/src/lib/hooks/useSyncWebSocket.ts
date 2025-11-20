/**
 * FASE 35: WebSocket Hook para eventos de sincronização em tempo real
 * Conecta ao namespace /sync do backend (SyncGateway)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  SyncStartedEvent,
  SyncProgressEvent,
  SyncCompletedEvent,
  SyncFailedEvent,
  SyncState,
  SyncLogEntry,
} from '../types/data-sync';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3101';

/**
 * Hook para gerenciar conexão WebSocket e eventos de sincronização
 *
 * Eventos suportados (namespace /sync):
 * - sync:started - Sync bulk iniciado
 * - sync:progress - Progresso de sync individual
 * - sync:completed - Sync bulk concluído
 * - sync:failed - Sync falhou (validação ou erro crítico)
 *
 * @param options.autoRefresh - Se true, invalida cache React Query automaticamente
 * @param options.onSyncComplete - Callback ao completar sync
 *
 * @example
 * const { state, isConnected, clearLogs } = useSyncWebSocket({
 *   autoRefresh: true,
 *   onSyncComplete: () => toast.success('Sync concluído!')
 * });
 *
 * <SyncProgressBar progress={state.progress} currentTicker={state.currentTicker} />
 * <SyncLogsList logs={state.logs} />
 */
export function useSyncWebSocket(options?: {
  autoRefresh?: boolean;
  onSyncComplete?: () => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<SyncState>({
    isRunning: false,
    currentTicker: null,
    progress: 0,
    logs: [],
    results: { success: [], failed: [] },
  });

  const socketRef = useRef<Socket | null>(null);

  // Conectar ao namespace /sync
  useEffect(() => {
    const socket = io(`${WS_URL}/sync`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('[SYNC WS] Conectado ao namespace /sync');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[SYNC WS] Desconectado');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('[SYNC WS] Erro:', error);
    });

    // Event: sync:started
    socket.on('sync:started', (data: SyncStartedEvent) => {
      console.log('[SYNC WS] Sync started:', data);
      setState((prev) => ({
        ...prev,
        isRunning: true,
        progress: 0,
        currentTicker: null,
        logs: [
          {
            timestamp: new Date(data.timestamp),
            ticker: 'SYSTEM',
            status: 'processing',
            message: `Iniciando sync de ${data.totalAssets} ativos (${data.startYear}-${data.endYear})`,
          },
        ],
        results: { success: [], failed: [] },
      }));
    });

    // Event: sync:progress
    socket.on('sync:progress', (data: SyncProgressEvent) => {
      console.log('[SYNC WS] Sync progress:', data);
      setState((prev) => {
        const newLogs: SyncLogEntry[] = [...prev.logs];

        if (data.status === 'processing') {
          newLogs.push({
            timestamp: new Date(data.timestamp),
            ticker: data.ticker,
            status: 'processing',
            message: `Processando ${data.ticker} (${data.current}/${data.total})...`,
          });
        } else if (data.status === 'success') {
          newLogs.push({
            timestamp: new Date(data.timestamp),
            ticker: data.ticker,
            status: 'success',
            message: `✅ ${data.ticker} sincronizado - ${data.recordsInserted} registros em ${data.duration}s`,
            duration: data.duration,
            recordsInserted: data.recordsInserted,
          });
        } else if (data.status === 'failed') {
          newLogs.push({
            timestamp: new Date(data.timestamp),
            ticker: data.ticker,
            status: 'failed',
            message: `❌ ${data.ticker} falhou - ${data.error}`,
            duration: data.duration,
          });
        }

        return {
          ...prev,
          currentTicker: data.ticker,
          progress: data.percentage,
          logs: newLogs,
          results: {
            success:
              data.status === 'success'
                ? [...prev.results.success, data.ticker]
                : prev.results.success,
            failed:
              data.status === 'failed'
                ? [...prev.results.failed, data.ticker]
                : prev.results.failed,
          },
        };
      });
    });

    // Event: sync:completed
    socket.on('sync:completed', (data: SyncCompletedEvent) => {
      console.log('[SYNC WS] Sync completed:', data);
      setState((prev) => ({
        ...prev,
        isRunning: false,
        currentTicker: null,
        progress: 100,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date(data.timestamp),
            ticker: 'SYSTEM',
            status: 'success',
            message: `✅ Sync concluído: ${data.successCount}/${data.totalAssets} successful (${Math.round(data.duration / 60)}min)`,
            duration: data.duration,
          },
        ],
      }));

      // Callback onSyncComplete
      if (options?.onSyncComplete) {
        options.onSyncComplete();
      }

      // Auto-refresh cache (opcional)
      if (options?.autoRefresh) {
        // Será implementado com useSyncHelpers().refetchSyncStatus() no componente
      }
    });

    // Event: sync:failed
    socket.on('sync:failed', (data: SyncFailedEvent) => {
      console.error('[SYNC WS] Sync failed:', data);
      setState((prev) => ({
        ...prev,
        isRunning: false,
        currentTicker: null,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date(data.timestamp),
            ticker: 'SYSTEM',
            status: 'failed',
            message: `❌ Sync falhou: ${data.error}`,
          },
        ],
      }));
    });

    // Cleanup ao desmontar
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [options?.autoRefresh, options?.onSyncComplete]);

  /**
   * Limpar logs e resetar estado
   */
  const clearLogs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logs: [],
      results: { success: [], failed: [] },
    }));
  }, []);

  /**
   * Obter log mais recente
   */
  const getLatestLog = useCallback(() => {
    return state.logs[state.logs.length - 1] || null;
  }, [state.logs]);

  return {
    isConnected,
    state,
    clearLogs,
    getLatestLog,
  };
}
