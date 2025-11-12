import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

/**
 * Tipo: Asset com status de análise
 */
export interface AssetWithAnalysisStatus {
  // Dados do ativo
  id: string;
  ticker: string;
  name: string;
  type: string;
  sector: string;
  currentPrice?: number;
  changePercent?: number;

  // Status da análise
  hasAnalysis: boolean;
  lastAnalysisDate?: string;
  lastAnalysisType?: string;
  lastAnalysisStatus?: string;
  lastAnalysisRecommendation?: string;
  lastAnalysisConfidence?: number;
  lastAnalysisSummary?: string;

  // Flags computadas
  isAnalysisRecent: boolean;
  isAnalysisOutdated: boolean;
  canRequestAnalysis: boolean;
  daysSinceLastAnalysis?: number;
}

/**
 * Hook: Buscar lista de ativos com status de análise
 */
export function useReportsAssets() {
  return useQuery<AssetWithAnalysisStatus[]>({
    queryKey: ['reports', 'assets-status'],
    queryFn: async () => {
      const response = await api.get('/api/v1/reports/assets-status');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Solicitar análise individual
 */
export function useRequestAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticker: string) => {
      const response = await api.post('/api/v1/analysis/complete', { ticker });
      return response.data;
    },
    onSuccess: (data, ticker) => {
      toast({
        title: 'Análise Solicitada',
        description: `Análise de ${ticker} iniciada com sucesso. Aguarde alguns minutos.`,
      });

      // Invalidar queries para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['reports', 'assets-status'] });
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
    },
    onError: (error: any, ticker) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        `Erro ao solicitar análise de ${ticker}`;

      toast({
        title: 'Erro ao Solicitar Análise',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Solicitar análise em massa
 */
export function useRequestBulkAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/v1/analysis/bulk/request', {
        type: 'complete',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const { total, requested, skipped } = data;

      toast({
        title: 'Análises Solicitadas em Massa',
        description: `${requested} análises iniciadas (${skipped} ignoradas, ${total} total). Aguarde alguns minutos.`,
      });

      // Invalidar queries para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['reports', 'assets-status'] });
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao solicitar análises em massa';

      toast({
        title: 'Erro ao Solicitar Análises',
        description: message,
        variant: 'destructive',
      });
    },
  });
}
