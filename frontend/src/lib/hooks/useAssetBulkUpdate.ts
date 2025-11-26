/**
 * WebSocket Hook para eventos de atualização em massa de ativos
 * Conecta ao namespace padrão do backend (AppWebSocketGateway)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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

export interface AssetBulkUpdateState {
  isRunning: boolean;
  currentTicker: string | null;
  progress: number; // 0-100
  current: number;
  total: number;
  successCount: number;
  failedCount: number;
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
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<AssetBulkUpdateState>({
    isRunning: false,
    currentTicker: null,
    progress: 0,
    current: 0,
    total: 0,
    successCount: 0,
    failedCount: 0,
  });

  const socketRef = useRef<Socket | null>(null);

  // Conectar ao namespace padrão
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('[ASSET BULK WS] Conectado ao WebSocket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[ASSET BULK WS] Desconectado');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
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
      });

      // Callback onUpdateStarted
      if (options?.onUpdateStarted) {
        options.onUpdateStarted();
      }
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
      setState((prev) => ({
        ...prev,
        isRunning: false,
        currentTicker: null,
        progress: 100,
        successCount: data.successCount,
        failedCount: data.failedCount,
      }));

      // Callback onUpdateComplete
      if (options?.onUpdateComplete) {
        options.onUpdateComplete();
      }
    });

    // Cleanup ao desmontar
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [options?.onUpdateComplete, options?.onUpdateStarted]);

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
    });
  }, []);

  return {
    isConnected,
    state,
    resetState,
  };
}
