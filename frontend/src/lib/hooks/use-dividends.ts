'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

// Types
export enum DividendType {
  DIVIDENDO = 'dividendo',
  JCP = 'jcp',
  BONUS = 'bonus',
  RENDIMENTO = 'rendimento',
  FRACAO = 'fracao',
  SUBSCRICAO = 'subscricao',
}

export enum DividendStatus {
  ANUNCIADO = 'anunciado',
  PAGO = 'pago',
  PROJETADO = 'projetado',
}

export interface Dividend {
  id: string;
  assetId: string;
  ticker: string;
  tipo: DividendType;
  status: DividendStatus;
  valorBruto: number;
  valorLiquido: number;
  impostoRetido: number;
  dataEx: string;
  dataCom: string;
  dataPagamento: string;
  frequencia: string;
  source: string;
  createdAt: Date;
}

export interface DividendYieldSummary {
  ticker: string;
  dy12m: number;
  dy24m: number;
  totalPago12m: number;
  pagamentos12m: number;
  mediaPorPagamento: number;
  frequenciaPredominante: string;
  proximoProventoEstimado?: {
    dataEx: string;
    valorEstimado: number;
  };
}

export interface DividendQueryFilters {
  assetId?: string;
  ticker?: string;
  startDate?: string;
  endDate?: string;
  tipo?: DividendType;
  status?: DividendStatus;
  limit?: number;
  offset?: number;
}

export interface DividendSyncResponse {
  success: boolean;
  ticker: string;
  imported: number;
  skipped: number;
  errors?: string[];
  source: string;
  elapsedTime: number;
}

// Query Keys
export const dividendKeys = {
  all: ['dividends'] as const,
  lists: () => [...dividendKeys.all, 'list'] as const,
  list: (filters?: DividendQueryFilters) => [...dividendKeys.lists(), filters] as const,
  yield: (assetId: string, months?: number) => [...dividendKeys.all, 'yield', assetId, months] as const,
};

// Hooks

/**
 * Hook para buscar dividendos com filtros
 */
export function useDividends(filters?: DividendQueryFilters) {
  return useQuery({
    queryKey: dividendKeys.list(filters),
    queryFn: async () => {
      const response = await api.get('/dividends', { params: filters });
      return response.data as {
        data: Dividend[];
        pagination: { total: number; limit: number; offset: number; hasMore: boolean };
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para buscar dividend yield de um ativo
 */
export function useDividendYield(assetId: string, months: number = 12) {
  return useQuery({
    queryKey: dividendKeys.yield(assetId, months),
    queryFn: async () => {
      const response = await api.get(`/dividends/yield/${assetId}`, {
        params: { months },
      });
      return response.data as DividendYieldSummary;
    },
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para sincronizar dividendos de um ticker
 */
export function useSyncDividends() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ticker: string) => {
      const response = await api.post(`/dividends/sync/${ticker}`);
      return response.data as DividendSyncResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dividendKeys.lists() });
      toast({
        title: 'Dividendos sincronizados',
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
 * Formata valor de dividendo em BRL
 */
export function formatDividendValue(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

/**
 * Formata dividend yield como percentual
 */
export function formatDividendYield(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Retorna cor baseada no tipo de dividendo
 */
export function getDividendTypeColor(tipo: DividendType): string {
  switch (tipo) {
    case DividendType.DIVIDENDO:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case DividendType.JCP:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case DividendType.BONUS:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case DividendType.RENDIMENTO:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

/**
 * Retorna label para tipo de dividendo
 */
export function getDividendTypeLabel(tipo: DividendType): string {
  switch (tipo) {
    case DividendType.DIVIDENDO:
      return 'Dividendo';
    case DividendType.JCP:
      return 'JCP';
    case DividendType.BONUS:
      return 'Bonificacao';
    case DividendType.RENDIMENTO:
      return 'Rendimento';
    case DividendType.FRACAO:
      return 'Fracao';
    case DividendType.SUBSCRICAO:
      return 'Subscricao';
    default:
      return tipo;
  }
}

/**
 * Retorna cor baseada no status do dividendo
 */
export function getDividendStatusColor(status: DividendStatus): string {
  switch (status) {
    case DividendStatus.PAGO:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case DividendStatus.ANUNCIADO:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case DividendStatus.PROJETADO:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

/**
 * Retorna label para status do dividendo
 */
export function getDividendStatusLabel(status: DividendStatus): string {
  switch (status) {
    case DividendStatus.PAGO:
      return 'Pago';
    case DividendStatus.ANUNCIADO:
      return 'Anunciado';
    case DividendStatus.PROJETADO:
      return 'Projetado';
    default:
      return status;
  }
}
