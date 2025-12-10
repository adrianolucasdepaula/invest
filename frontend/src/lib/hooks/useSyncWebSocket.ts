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
  SyncConfig,
} from '../types/data-sync';

// Storage keys for sync state persistence (FASE 88)
const SYNC_CONFIG_KEY = 'currentSyncConfig';
const ACTIVE_SYNC_STATE_KEY = 'activeSyncState';
const SYNC_STATE_MAX_AGE_HOURS = 2; // Max age before considering state stale

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
    config: null,
  });

  const socketRef = useRef<Socket | null>(null);

  /**
   * FASE 88: Read sync config from sessionStorage
   * Config is stored by BulkSyncButton before starting sync
   */
  const getSyncConfigFromStorage = useCallback((): SyncConfig | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(SYNC_CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored) as SyncConfig;
      }
    } catch (e) {
      console.warn('[SYNC WS] Failed to read sync config from sessionStorage:', e);
    }
    return null;
  }, []);

  /**
   * FASE 88: Save active sync state to localStorage for persistence across refresh
   */
  const saveActiveSyncState = useCallback((syncState: Partial<SyncState> & { startedAt: string }) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_SYNC_STATE_KEY, JSON.stringify(syncState));
      console.log('[SYNC WS] Saved active sync state to localStorage');
    } catch (e) {
      console.warn('[SYNC WS] Failed to save sync state to localStorage:', e);
    }
  }, []);

  /**
   * FASE 88: Clear active sync state from localStorage (on completion/failure)
   */
  const clearActiveSyncState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ACTIVE_SYNC_STATE_KEY);
      sessionStorage.removeItem(SYNC_CONFIG_KEY);
      console.log('[SYNC WS] Cleared sync state from storage');
    } catch (e) {
      console.warn('[SYNC WS] Failed to clear sync state from storage:', e);
    }
  }, []);

  /**
   * FASE 88: Restore active sync state from localStorage on mount
   * Checks if state is not too old (max 2 hours)
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedState = localStorage.getItem(ACTIVE_SYNC_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const startedAt = new Date(parsed.startedAt);
        const hoursSinceStart = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceStart < SYNC_STATE_MAX_AGE_HOURS) {
          console.log('[SYNC WS] Restored sync state from localStorage:', parsed);
          setState((prev) => ({
            ...prev,
            isRunning: true,
            config: parsed.config || null,
            logs: parsed.logs || [
              {
                timestamp: new Date(),
                ticker: 'SYSTEM',
                status: 'processing' as const,
                message: 'Sincronização em andamento (restaurada)...',
              },
            ],
          }));
        } else {
          console.log('[SYNC WS] Saved sync state too old, clearing');
          localStorage.removeItem(ACTIVE_SYNC_STATE_KEY);
        }
      }
    } catch (e) {
      console.warn('[SYNC WS] Failed to restore sync state from localStorage:', e);
    }
  }, []);

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

      // FASE 88: Read config from sessionStorage (stored by BulkSyncButton)
      const config = getSyncConfigFromStorage();

      const newState = {
        isRunning: true,
        progress: 0,
        currentTicker: null,
        logs: [
          {
            timestamp: new Date(data.timestamp),
            ticker: 'SYSTEM',
            status: 'processing' as const,
            message: `Iniciando sync de ${data.totalAssets} ativos (${data.startYear}-${data.endYear})`,
          },
        ],
        results: { success: [], failed: [] },
        config: config,
      };

      setState((prev) => ({
        ...prev,
        ...newState,
      }));

      // FASE 88: Save state to localStorage for persistence across refresh
      saveActiveSyncState({
        ...newState,
        startedAt: new Date().toISOString(),
      });
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
        // BUGFIX 2025-11-23: Substituir logs antigos por apenas log de conclusão
        // Remove entradas "Iniciando sync..." e "Processando..." obsoletas
        logs: [
          {
            timestamp: new Date(data.timestamp),
            ticker: 'SYSTEM',
            status: 'success',
            message: `✅ Sync concluído: ${data.successCount}/${data.totalAssets} successful (${Math.round(data.duration / 60)}min)`,
            duration: data.duration,
          },
        ],
        config: null, // FASE 88: Clear config on completion
      }));

      // FASE 88: Clear localStorage on completion
      clearActiveSyncState();

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
        config: null, // FASE 88: Clear config on failure
      }));

      // FASE 88: Clear localStorage on failure
      clearActiveSyncState();
    });

    // Cleanup ao desmontar
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.autoRefresh, options?.onSyncComplete, getSyncConfigFromStorage, saveActiveSyncState, clearActiveSyncState]); // Include FASE 88 storage functions

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
