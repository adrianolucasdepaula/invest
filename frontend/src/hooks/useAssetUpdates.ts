import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100/api/v1';

const createAuthAxios = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });
  instance.interceptors.request.use((config) => {
    const token = Cookies.get('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};

export interface UpdateResult {
  success: boolean;
  assetId: string;
  ticker: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  error?: string;
  duration?: number;
  metadata?: {
    sources?: string[];
    sourcesCount?: number;
    confidence?: number;
    dataPoints?: number;
    discrepancies?: any[];
  };
}

export interface BatchUpdateResult {
  totalAssets: number;
  successCount: number;
  failedCount: number;
  results: UpdateResult[];
  duration: number;
}

export interface OutdatedAsset {
  id: string;
  ticker: string;
  name: string;
  lastUpdated: string | null;
  lastUpdateStatus: 'success' | 'failed' | 'pending' | 'outdated' | null;
  lastUpdateError: string | null;
  updateRetryCount: number;
}

interface AssetUpdateEvent {
  assetId: string;
  ticker: string;
  updateLogId: string;
  triggeredBy: string;
  timestamp: Date;
}

interface AssetUpdateCompletedEvent extends AssetUpdateEvent {
  status: string;
  duration: number;
  metadata?: any;
}

interface AssetUpdateFailedEvent extends AssetUpdateEvent {
  error: string;
  duration: number;
}

interface BatchUpdateEvent {
  portfolioId?: string;
  totalAssets: number;
  tickers: string[];
  timestamp: Date;
}

interface BatchUpdateProgressEvent {
  portfolioId?: string;
  current: number;
  total: number;
  currentTicker: string;
  timestamp: Date;
}

interface BatchUpdateCompletedEvent {
  portfolioId?: string;
  totalAssets: number;
  successCount: number;
  failedCount: number;
  duration: number;
  timestamp: Date;
}

export function useAssetUpdates() {
  const socket = useSocket();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [currentTicker, setCurrentTicker] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  /**
   * Atualizar um único ativo
   */
  const updateSingleAsset = useCallback(
    async (ticker: string, userId?: string) => {
      setIsUpdating(true);
      setCurrentTicker(ticker);

      try {
        const api = createAuthAxios();
        const response = await api.post<UpdateResult>('/assets/updates/single', {
          ticker,
          userId,
          triggeredBy: 'manual',
        });

        if (response.data.success) {
          toast.success(`✅ ${ticker} atualizado com sucesso!`, {
            description: `${response.data.metadata?.sourcesCount || 0} fontes, confiança ${((response.data.metadata?.confidence || 0) * 100).toFixed(0)}%`,
          });
        } else {
          toast.error(`❌ Falha ao atualizar ${ticker}`, {
            description: response.data.error || 'Erro desconhecido',
          });
        }

        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Erro ao atualizar ativo';
        toast.error(`❌ Erro ao atualizar ${ticker}`, {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsUpdating(false);
        setCurrentTicker(null);
      }
    },
    []
  );

  /**
   * Atualizar múltiplos ativos
   */
  const updateMultipleAssets = useCallback(
    async (tickers: string[], userId?: string) => {
      setIsBatchUpdating(true);
      setBatchProgress({ current: 0, total: tickers.length });
      setUpdateResults([]);

      try {
        const api = createAuthAxios();
        const response = await api.post<BatchUpdateResult>('/assets/updates/batch', {
          tickers,
          userId,
          triggeredBy: 'manual',
        });

        toast.success(`✅ Atualização concluída!`, {
          description: `${response.data.successCount}/${response.data.totalAssets} ativos atualizados com sucesso`,
        });

        setUpdateResults(response.data.results);
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Erro ao atualizar ativos';
        toast.error(`❌ Erro na atualização em lote`, {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsBatchUpdating(false);
        setBatchProgress({ current: 0, total: 0 });
      }
    },
    []
  );

  /**
   * Atualizar todos os ativos de um portfólio
   */
  const updatePortfolioAssets = useCallback(
    async (portfolioId: string, userId: string) => {
      setIsBatchUpdating(true);
      setUpdateResults([]);

      try {
        const api = createAuthAxios();
        const response = await api.post<BatchUpdateResult>('/assets/updates/portfolio', {
          portfolioId,
          userId,
        });

        toast.success(`✅ Portfólio atualizado!`, {
          description: `${response.data.successCount}/${response.data.totalAssets} ativos atualizados`,
        });

        setUpdateResults(response.data.results);
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Erro ao atualizar portfólio';
        toast.error(`❌ Erro ao atualizar portfólio`, {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsBatchUpdating(false);
      }
    },
    []
  );

  /**
   * Buscar ativos desatualizados
   */
  const getOutdatedAssets = useCallback(async (portfolioId?: string) => {
    try {
      const api = createAuthAxios();
      const params = portfolioId ? `?portfolioId=${portfolioId}` : '';
      const response = await api.get<OutdatedAsset[]>(`/assets/updates/outdated${params}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao buscar ativos desatualizados';
      toast.error(`❌ Erro ao buscar ativos desatualizados`, {
        description: errorMessage,
      });
      throw error;
    }
  }, []);

  /**
   * Atualizar ativos por setor
   */
  const updateAssetsBySector = useCallback(
    async (sector: string, userId?: string) => {
      setIsBatchUpdating(true);
      setUpdateResults([]);

      try {
        const api = createAuthAxios();
        const response = await api.post<BatchUpdateResult>('/assets/updates/sector', {
          sector,
          userId,
        });

        toast.success(`✅ Setor "${sector}" atualizado!`, {
          description: `${response.data.successCount}/${response.data.totalAssets} ativos atualizados`,
        });

        setUpdateResults(response.data.results);
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Erro ao atualizar setor';
        toast.error(`❌ Erro ao atualizar setor`, {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsBatchUpdating(false);
      }
    },
    []
  );

  // ============================================================================
  // WEBSOCKET EVENT LISTENERS
  // ============================================================================

  useEffect(() => {
    if (!socket) return;

    // Single asset update started
    const handleAssetUpdateStarted = (data: AssetUpdateEvent) => {
      console.log('[WS] Asset update started:', data);
      setCurrentTicker(data.ticker);
    };

    // Single asset update completed
    const handleAssetUpdateCompleted = (data: AssetUpdateCompletedEvent) => {
      console.log('[WS] Asset update completed:', data);
      setCurrentTicker(null);
    };

    // Single asset update failed
    const handleAssetUpdateFailed = (data: AssetUpdateFailedEvent) => {
      console.log('[WS] Asset update failed:', data);
      setCurrentTicker(null);
      toast.error(`❌ Falha ao atualizar ${data.ticker}`, {
        description: data.error,
      });
    };

    // Batch update started
    const handleBatchUpdateStarted = (data: BatchUpdateEvent) => {
      console.log('[WS] Batch update started:', data);
      setBatchProgress({ current: 0, total: data.totalAssets });
    };

    // Batch update progress
    const handleBatchUpdateProgress = (data: BatchUpdateProgressEvent) => {
      console.log('[WS] Batch update progress:', data);
      setBatchProgress({ current: data.current, total: data.total });
      setCurrentTicker(data.currentTicker);
    };

    // Batch update completed
    const handleBatchUpdateCompleted = (data: BatchUpdateCompletedEvent) => {
      console.log('[WS] Batch update completed:', data);
      setBatchProgress({ current: 0, total: 0 });
      setCurrentTicker(null);
    };

    // Subscribe to events
    socket.on('asset_update_started', handleAssetUpdateStarted);
    socket.on('asset_update_completed', handleAssetUpdateCompleted);
    socket.on('asset_update_failed', handleAssetUpdateFailed);
    socket.on('batch_update_started', handleBatchUpdateStarted);
    socket.on('batch_update_progress', handleBatchUpdateProgress);
    socket.on('batch_update_completed', handleBatchUpdateCompleted);

    // Cleanup
    return () => {
      socket.off('asset_update_started', handleAssetUpdateStarted);
      socket.off('asset_update_completed', handleAssetUpdateCompleted);
      socket.off('asset_update_failed', handleAssetUpdateFailed);
      socket.off('batch_update_started', handleBatchUpdateStarted);
      socket.off('batch_update_progress', handleBatchUpdateProgress);
      socket.off('batch_update_completed', handleBatchUpdateCompleted);
    };
  }, [socket]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    isUpdating,
    isBatchUpdating,
    currentTicker,
    batchProgress,
    updateResults,

    // API Methods
    updateSingleAsset,
    updateMultipleAssets,
    updatePortfolioAssets,
    getOutdatedAssets,
    updateAssetsBySector,
  };
}
