'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWheelCandidatesApi,
  getWheelStrategiesApi,
  getWheelStrategyApi,
  createWheelStrategyApi,
  updateWheelStrategyApi,
  deleteWheelStrategyApi,
  getWheelPutRecommendationsApi,
  getWheelCallRecommendationsApi,
  getWheelTradesApi,
  createWheelTradeApi,
  closeWheelTradeApi,
  calculateCashYieldApi,
  getWheelWeeklyScheduleApi,
  getWheelAnalyticsApi,
} from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

// Types
export interface WheelCandidate {
  id: string;
  ticker: string;
  name: string;
  currentPrice: number;
  roe?: number;
  dividendYield?: number;
  dividaEbitda?: number;
  margemLiquida?: number;
  pl?: number;
  ivRank?: number;
  hasOptions: boolean;
  wheelScore: number;
  scoreBreakdown: {
    fundamentalScore: number;
    liquidityScore: number;
    volatilityScore: number;
  };
}

export interface WheelStrategy {
  id: string;
  assetId: string;
  name?: string;
  status: 'active' | 'paused' | 'closed';
  phase: 'selling_puts' | 'holding_shares' | 'selling_calls';
  notional: number;
  availableCapital: number;
  sharesHeld: number;
  averagePrice?: number;
  realizedPnL: number;
  unrealizedPnL: number;
  createdAt: string;
  updatedAt: string;
  config?: WheelConfig;
  asset?: {
    id: string;
    ticker: string;
    name: string;
  };
}

export interface WheelConfig {
  targetDelta: number;
  minIVRank: number;
  minROE: number;
  minDividendYield: number;
  maxDividaEbitda: number;
  weeklyDistribution: boolean;
  acceptExercise: boolean;
  autoLendShares: boolean;
}

export interface WheelTrade {
  id: string;
  strategyId: string;
  tradeType: 'SELL_PUT' | 'SELL_CALL' | 'BUY_TO_CLOSE' | 'EXERCISE' | 'ASSIGNMENT';
  status: 'OPEN' | 'CLOSED' | 'EXERCISED' | 'EXPIRED' | 'ASSIGNED';
  optionSymbol: string;
  underlyingTicker: string;
  optionType: 'CALL' | 'PUT';
  strike: number;
  expiration: string;
  contracts: number;
  entryPrice: number;
  exitPrice?: number;
  underlyingPriceAtEntry: number;
  underlyingPriceAtExit?: number;
  premiumReceived: number;
  realizedPnL: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  ivAtEntry?: number;
  ivRankAtEntry?: number;
  distributionWeek?: number;
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

export interface OptionRecommendation {
  symbol: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiration: string;
  daysToExpiration: number;
  premium: number;
  bid: number;
  ask: number;
  delta: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  iv: number;
  ivRank?: number;
  volume: number;
  openInterest: number;
  premiumReturnPercent: number;
  annualizedReturn: number;
  moneyness: 'ITM' | 'ATM' | 'OTM';
  distancePercent: number;
  score: number;
}

export interface WeeklySchedule {
  week: number;
  capitalToAllocate: number;
  suggestedContracts: number;
  targetExpiration: string;
  daysToExpiration: number;
  recommendations: OptionRecommendation[];
}

export interface CashYield {
  principal: number;
  days: number;
  selicRate: number;
  expectedYield: number;
  effectiveRate: number;
  dailyRate: number;
  finalAmount: number;
}

export interface StrategyAnalytics {
  strategyId: string;
  totalCapital: number;
  allocatedCapital: number;
  availableCapital: number;
  sharesValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPremiumReceived: number;
  totalPremiumPaid: number;
  cashYield: number;
  dividendsReceived: number;
  totalReturn: number;
  annualizedReturn: number;
  winRate: number;
  exerciseRate: number;
  cashYieldProjection?: CashYield;
}

// Query Keys
export const wheelKeys = {
  all: ['wheel'] as const,
  candidates: (filters?: Record<string, unknown>) => [...wheelKeys.all, 'candidates', filters] as const,
  strategies: () => [...wheelKeys.all, 'strategies'] as const,
  strategy: (id: string) => [...wheelKeys.all, 'strategy', id] as const,
  trades: (strategyId: string) => [...wheelKeys.all, 'trades', strategyId] as const,
  putRecommendations: (strategyId: string) => [...wheelKeys.all, 'put-recommendations', strategyId] as const,
  callRecommendations: (strategyId: string) => [...wheelKeys.all, 'call-recommendations', strategyId] as const,
  weeklySchedule: (strategyId: string) => [...wheelKeys.all, 'weekly-schedule', strategyId] as const,
  analytics: (strategyId: string) => [...wheelKeys.all, 'analytics', strategyId] as const,
  cashYield: (strategyId: string, days?: number) => [...wheelKeys.all, 'cash-yield', strategyId, days] as const,
};

// Hooks

/**
 * Hook para buscar candidatos WHEEL com filtros
 */
export function useWheelCandidates(filters?: {
  minROE?: number;
  minDividendYield?: number;
  maxDividaEbitda?: number;
  minIVRank?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: wheelKeys.candidates(filters),
    queryFn: async () => {
      const response = await getWheelCandidatesApi(filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para buscar todas as estratégias do usuário
 */
export function useWheelStrategies() {
  return useQuery({
    queryKey: wheelKeys.strategies(),
    queryFn: async () => {
      const response = await getWheelStrategiesApi();
      return response as WheelStrategy[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook para buscar uma estratégia específica
 */
export function useWheelStrategy(id: string) {
  return useQuery({
    queryKey: wheelKeys.strategy(id),
    queryFn: async () => {
      const response = await getWheelStrategyApi(id);
      return response as WheelStrategy;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para buscar trades de uma estratégia
 */
export function useWheelTrades(strategyId: string) {
  return useQuery({
    queryKey: wheelKeys.trades(strategyId),
    queryFn: async () => {
      const response = await getWheelTradesApi(strategyId);
      return response as WheelTrade[];
    },
    enabled: !!strategyId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para buscar recomendações de PUT
 */
export function useWheelPutRecommendations(strategyId: string) {
  return useQuery({
    queryKey: wheelKeys.putRecommendations(strategyId),
    queryFn: async () => {
      const response = await getWheelPutRecommendationsApi(strategyId);
      return response as OptionRecommendation[];
    },
    enabled: !!strategyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar recomendações de CALL
 */
export function useWheelCallRecommendations(strategyId: string) {
  return useQuery({
    queryKey: wheelKeys.callRecommendations(strategyId),
    queryFn: async () => {
      const response = await getWheelCallRecommendationsApi(strategyId);
      return response as OptionRecommendation[];
    },
    enabled: !!strategyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar schedule semanal de PUTs
 */
export function useWheelWeeklySchedule(strategyId: string) {
  return useQuery({
    queryKey: wheelKeys.weeklySchedule(strategyId),
    queryFn: async () => {
      const response = await getWheelWeeklyScheduleApi(strategyId);
      return response as WeeklySchedule[];
    },
    enabled: !!strategyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar analytics de uma estratégia
 */
export function useWheelAnalytics(strategyId: string) {
  return useQuery({
    queryKey: wheelKeys.analytics(strategyId),
    queryFn: async () => {
      const response = await getWheelAnalyticsApi(strategyId);
      return response as StrategyAnalytics;
    },
    enabled: !!strategyId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para buscar projeção de cash yield
 * FASE 109.1: Corrigido para aceitar principal como parâmetro (não hardcoded 0)
 */
export function useWheelCashYield(principal: number, days?: number) {
  return useQuery({
    queryKey: wheelKeys.cashYield(principal.toString(), days),
    queryFn: async () => {
      const response = await calculateCashYieldApi(principal, days);
      return response as CashYield;
    },
    enabled: principal > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations

/**
 * Hook para criar uma nova estratégia
 */
export function useCreateWheelStrategy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      assetId: string;
      name?: string;
      notional: number;
      config?: Partial<WheelConfig>;
    }) => {
      const response = await createWheelStrategyApi(data);
      return response as WheelStrategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wheelKeys.strategies() });
      toast({
        title: 'Estratégia criada',
        description: 'Sua estratégia WHEEL foi criada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar estratégia',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para atualizar uma estratégia
 */
export function useUpdateWheelStrategy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        status: 'active' | 'paused' | 'closed';
        phase: 'selling_puts' | 'holding_shares' | 'selling_calls';
        notional: number;
        config: Partial<WheelConfig>;
      }>;
    }) => {
      const response = await updateWheelStrategyApi(id, data);
      return response as WheelStrategy;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wheelKeys.strategies() });
      queryClient.invalidateQueries({ queryKey: wheelKeys.strategy(data.id) });
      toast({
        title: 'Estratégia atualizada',
        description: 'Sua estratégia foi atualizada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar estratégia',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar uma estratégia
 */
export function useDeleteWheelStrategy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteWheelStrategyApi(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wheelKeys.strategies() });
      toast({
        title: 'Estratégia removida',
        description: 'Sua estratégia foi removida com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover estratégia',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para criar um novo trade
 */
export function useCreateWheelTrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      strategyId: string;
      // FASE 109.1: Padronizado para UPPERCASE (compatível com backend enums)
      tradeType: 'SELL_PUT' | 'SELL_CALL' | 'BUY_TO_CLOSE' | 'EXERCISE' | 'ASSIGNMENT';
      optionSymbol: string;
      underlyingTicker: string;
      optionType: string;
      strike: number;
      expiration: string;
      contracts: number;
      entryPrice: number;
      underlyingPriceAtEntry: number;
      delta?: number;
      gamma?: number;
      theta?: number;
      vega?: number;
      ivAtEntry?: number;
      ivRankAtEntry?: number;
      distributionWeek?: number;
      notes?: string;
    }) => {
      const response = await createWheelTradeApi(data as unknown as Parameters<typeof createWheelTradeApi>[0]);
      return response as WheelTrade;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wheelKeys.trades(data.strategyId) });
      queryClient.invalidateQueries({ queryKey: wheelKeys.strategy(data.strategyId) });
      queryClient.invalidateQueries({ queryKey: wheelKeys.analytics(data.strategyId) });
      toast({
        title: 'Trade registrado',
        description: `Trade de ${data.optionSymbol} registrado com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar trade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para fechar um trade
 */
export function useCloseWheelTrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      tradeId,
      data,
    }: {
      tradeId: string;
      strategyId: string;
      data: {
        exitPrice: number;
        underlyingPriceAtExit: number;
        // FASE 109.1: Padronizado para UPPERCASE
        status: 'CLOSED' | 'EXERCISED' | 'EXPIRED' | 'ASSIGNED';
        commission?: number;
        b3Fees?: number;
        notes?: string;
      };
    }) => {
      const response = await closeWheelTradeApi(tradeId, data as Parameters<typeof closeWheelTradeApi>[1]);
      return response as WheelTrade;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: wheelKeys.trades(variables.strategyId) });
      queryClient.invalidateQueries({ queryKey: wheelKeys.strategy(variables.strategyId) });
      queryClient.invalidateQueries({ queryKey: wheelKeys.analytics(variables.strategyId) });
      toast({
        title: 'Trade fechado',
        description: `Trade fechado com P&L de R$ ${data.realizedPnL.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao fechar trade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
