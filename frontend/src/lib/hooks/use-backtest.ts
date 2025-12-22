'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBacktestApi,
  getBacktestsApi,
  getBacktestApi,
  getBacktestProgressApi,
  deleteBacktestApi,
  compareBacktestsApi,
} from '@/lib/api/backtest-api';
import { useToast } from '@/components/ui/use-toast';

// Types
export interface BacktestConfig {
  initialCapital: number;
  targetDelta: number;
  minROE: number;
  minDividendYield: number;
  maxDebtEbitda: number;
  minMargemLiquida?: number;
  expirationDays?: number;
  weeklyDistribution: boolean;
  maxWeeklyAllocation?: number;
  reinvestDividends: boolean;
  includeLendingIncome: boolean;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

export interface SimulatedTrade {
  date: string;
  type: 'sell_put' | 'sell_call' | 'exercise_put' | 'exercise_call';
  strike: number;
  premium: number;
  expiration: string;
  result: 'win' | 'loss' | 'exercise';
  pnl: number;
}

export interface RiskMetrics {
  cagr: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDays: number;
  winRate: number;
  profitFactor: number;
  calmarRatio?: number;
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  exercises: number;
  averageProfit: number;
  averageLoss: number;
  maxProfit: number;
  maxLoss: number;
}

export interface IncomeBreakdown {
  premiumIncome: number;
  dividendIncome: number;
  lendingIncome: number;
  selicIncome: number;
  total: number;
  premiumPercent: number;
  dividendPercent: number;
  lendingPercent: number;
  selicPercent: number;
}

export interface BenchmarkComparison {
  name: string;
  totalReturn: number;
  cagr: number;
  volatility?: number;
}

export interface BacktestResult {
  id: string;
  userId: string;
  assetId: string;
  ticker: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  config: BacktestConfig;
  riskMetrics: RiskMetrics;
  tradeStats: TradeStats;
  incomeBreakdown: IncomeBreakdown;
  benchmarks?: BenchmarkComparison[];
  equityCurve?: EquityCurvePoint[];
  simulatedTrades?: SimulatedTrade[];
  executionTime?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BacktestSummary {
  id: string;
  name: string;
  ticker: string;
  status: 'running' | 'completed' | 'failed';
  period: string;
  initialCapital: number;
  finalCapital: number;
  totalReturnPercent: number;
  cagr: number;
  sharpeRatio: number;
  maxDrawdown: number;
  createdAt: Date;
}

export interface BacktestCreated {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
  createdAt: Date;
}

export interface CreateBacktestInput {
  assetId: string;
  name: string;
  startDate: string;
  endDate: string;
  config: BacktestConfig;
}

// Query Keys
export const backtestKeys = {
  all: ['backtest'] as const,
  lists: () => [...backtestKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...backtestKeys.lists(), filters] as const,
  details: () => [...backtestKeys.all, 'detail'] as const,
  detail: (id: string) => [...backtestKeys.details(), id] as const,
  progress: (id: string) => [...backtestKeys.all, 'progress', id] as const,
  compare: (id1: string, id2: string) => [...backtestKeys.all, 'compare', id1, id2] as const,
};

// Hooks

/**
 * Hook para listar backtests do usuário
 */
export function useBacktests(filters?: {
  assetId?: string;
  status?: 'running' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: backtestKeys.list(filters),
    queryFn: async () => {
      const response = await getBacktestsApi(filters);
      return response as BacktestSummary[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook para buscar um backtest específico
 */
export function useBacktest(id: string) {
  return useQuery({
    queryKey: backtestKeys.detail(id),
    queryFn: async () => {
      const response = await getBacktestApi(id);
      return response as BacktestResult;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
    // Poll while running
    refetchInterval: (query) => {
      const data = query.state.data as BacktestResult | undefined;
      return data?.status === 'running' ? 5000 : false;
    },
  });
}

/**
 * Hook para monitorar progresso de um backtest
 */
export function useBacktestProgress(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: backtestKeys.progress(id),
    queryFn: async () => {
      const response = await getBacktestProgressApi(id);
      return response as { id: string; status: string; progress: number };
    },
    enabled: !!id && enabled,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

/**
 * Hook para comparar dois backtests
 */
export function useBacktestComparison(id1: string, id2: string) {
  return useQuery({
    queryKey: backtestKeys.compare(id1, id2),
    queryFn: async () => {
      const response = await compareBacktestsApi(id1, id2);
      return response as {
        backtest1: BacktestSummary;
        backtest2: BacktestSummary;
        comparison: {
          cagrDiff: number;
          sharpeDiff: number;
          maxDrawdownDiff: number;
          winner: 'backtest1' | 'backtest2' | 'tie';
        };
      };
    },
    enabled: !!id1 && !!id2,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations

/**
 * Hook para criar um novo backtest
 */
export function useCreateBacktest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateBacktestInput) => {
      const response = await createBacktestApi(data);
      return response as BacktestCreated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backtestKeys.lists() });
      toast({
        title: 'Backtest iniciado',
        description: `Backtest criado com ID ${data.id}. Tempo estimado: ${Math.ceil(data.estimatedTime / 60)} minutos.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar backtest',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar um backtest
 */
export function useDeleteBacktest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteBacktestApi(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: backtestKeys.lists() });
      queryClient.removeQueries({ queryKey: backtestKeys.detail(id) });
      toast({
        title: 'Backtest removido',
        description: 'O backtest foi removido com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover backtest',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Utility functions

/**
 * Formata valor monetário em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata percentual com precisão
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Retorna cor baseada no valor (positivo=verde, negativo=vermelho)
 */
export function getValueColor(value: number): string {
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

/**
 * Retorna cor para status do backtest
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

/**
 * Retorna label para status do backtest
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'running':
      return 'Em execução';
    case 'completed':
      return 'Concluído';
    case 'failed':
      return 'Falhou';
    default:
      return status;
  }
}
