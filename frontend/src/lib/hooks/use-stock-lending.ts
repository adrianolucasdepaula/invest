'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

// Types
export interface StockLendingRate {
  id: string;
  assetId: string;
  ticker: string;
  taxaAluguelAno: number;
  taxaAluguelDia: number;
  taxaMin?: number;
  taxaMax?: number;
  quantidadeDisponivel?: number;
  quantidadeAlugada?: number;
  volumeFinanceiro?: number;
  dataReferencia: string;
  source: string;
  createdAt: Date;
}

export interface CurrentLendingRate {
  ticker: string;
  taxaAluguelAno: number;
  taxaAluguelDia: number;
  quantidadeDisponivel?: number;
  quantidadeAlugada?: number;
  dataReferencia: string;
  source: string;
}

export interface LendingRateStats {
  ticker: string;
  currentRate: CurrentLendingRate;
  historico: Array<{
    data: string;
    taxa: number;
  }>;
  estatisticas: {
    mediaUltimos30Dias: number;
    minimo30Dias: number;
    maximo30Dias: number;
    tendencia: 'alta' | 'baixa' | 'estavel';
  };
}

export interface LendingIncomeEstimate {
  ticker: string;
  quantidade: number;
  precoAtual: number;
  valorTotal: number;
  taxaAluguelAno: number;
  rendaDiaria: number;
  rendaMensal: number;
  rendaAnual: number;
  dataReferencia: string;
}

export interface StockLendingQueryFilters {
  assetId?: string;
  ticker?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  limit?: number;
  offset?: number;
}

export interface StockLendingSyncResponse {
  success: boolean;
  ticker: string;
  imported: number;
  skipped: number;
  errors?: string[];
  source: string;
  elapsedTime: number;
}

// Query Keys
export const stockLendingKeys = {
  all: ['stock-lending'] as const,
  lists: () => [...stockLendingKeys.all, 'list'] as const,
  list: (filters?: StockLendingQueryFilters) => [...stockLendingKeys.lists(), filters] as const,
  rates: (assetId: string, days?: number) => [...stockLendingKeys.all, 'rates', assetId, days] as const,
  estimate: (assetId: string, quantidade: number) =>
    [...stockLendingKeys.all, 'estimate', assetId, quantidade] as const,
};

// Hooks

/**
 * Hook para buscar taxas de aluguel com filtros
 */
export function useStockLendingRates(filters?: StockLendingQueryFilters) {
  return useQuery({
    queryKey: stockLendingKeys.list(filters),
    queryFn: async () => {
      const response = await api.get('/stock-lending', { params: filters });
      return response.data as {
        data: StockLendingRate[];
        pagination: { total: number; limit: number; offset: number; hasMore: boolean };
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para buscar estatisticas de taxa de aluguel de um ativo
 */
export function useStockLendingStats(assetId: string, days: number = 30) {
  return useQuery({
    queryKey: stockLendingKeys.rates(assetId, days),
    queryFn: async () => {
      const response = await api.get(`/stock-lending/rates/${assetId}`, {
        params: { days },
      });
      return response.data as LendingRateStats;
    },
    enabled: !!assetId,
    staleTime: 30 * 60 * 1000, // 30 minutes (rates don't change frequently)
  });
}

/**
 * Hook para calcular renda estimada de aluguel
 */
export function useLendingIncomeEstimate(assetId: string, quantidade: number) {
  return useQuery({
    queryKey: stockLendingKeys.estimate(assetId, quantidade),
    queryFn: async () => {
      const response = await api.get(`/stock-lending/estimate/${assetId}`, {
        params: { quantidade },
      });
      return response.data as LendingIncomeEstimate;
    },
    enabled: !!assetId && quantidade > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para sincronizar taxas de aluguel de um ticker
 */
export function useSyncStockLending() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ticker: string) => {
      const response = await api.post(`/stock-lending/sync/${ticker}`);
      return response.data as StockLendingSyncResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockLendingKeys.lists() });
      toast({
        title: 'Taxas de aluguel sincronizadas',
        description: `${data.ticker}: ${data.imported} importados, ${data.skipped} ignorados`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na sincronizacao',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Utility functions

/**
 * Formata taxa de aluguel como percentual
 */
export function formatLendingRate(rate: number): string {
  return `${rate.toFixed(2)}% a.a.`;
}

/**
 * Formata taxa diaria como percentual
 */
export function formatDailyRate(rate: number): string {
  return `${rate.toFixed(4)}% a.d.`;
}

/**
 * Formata valor monetario em BRL
 */
export function formatLendingCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata quantidade de acoes
 */
export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('pt-BR').format(quantity);
}

/**
 * Retorna cor baseada na tendencia
 */
export function getTrendColor(tendencia: 'alta' | 'baixa' | 'estavel'): string {
  switch (tendencia) {
    case 'alta':
      return 'text-green-600 dark:text-green-400';
    case 'baixa':
      return 'text-red-600 dark:text-red-400';
    case 'estavel':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Retorna icone baseado na tendencia
 */
export function getTrendIcon(tendencia: 'alta' | 'baixa' | 'estavel'): string {
  switch (tendencia) {
    case 'alta':
      return '↑';
    case 'baixa':
      return '↓';
    case 'estavel':
      return '→';
    default:
      return '→';
  }
}

/**
 * Retorna label para tendencia
 */
export function getTrendLabel(tendencia: 'alta' | 'baixa' | 'estavel'): string {
  switch (tendencia) {
    case 'alta':
      return 'Em alta';
    case 'baixa':
      return 'Em baixa';
    case 'estavel':
      return 'Estavel';
    default:
      return tendencia;
  }
}

/**
 * Calcula taxa de aluguel diaria a partir da anual
 * Usa 252 dias uteis por ano (padrao B3)
 */
export function calculateDailyRate(yearlyRate: number): number {
  return yearlyRate / 252;
}

/**
 * Calcula renda estimada para um periodo
 */
export function calculateEstimatedIncome(
  quantidade: number,
  precoAtual: number,
  taxaAnual: number,
  dias: number = 30
): number {
  const valorTotal = quantidade * precoAtual;
  const taxaDiaria = taxaAnual / 252 / 100;
  return valorTotal * taxaDiaria * dias;
}
