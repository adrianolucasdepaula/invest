import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: 'fundamental' | 'technical' | 'options' | 'prices' | 'news' | 'ai' | 'market_data' | 'crypto' | 'macro';
  status: 'active' | 'inactive' | 'error';
  lastTest: string | null;
  lastTestSuccess: boolean | null; // FASE 90
  lastSync: string | null;
  lastSyncSuccess: boolean | null; // FASE 90
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requiresAuth: boolean;
  runtime: 'typescript' | 'python';
  category: string;
  description?: string;
  errorMessage?: string;
}

// FASE 4: Quality Stats interfaces
export interface ScraperQualityStats {
  id: string;
  name: string;
  avgConsensus: number;
  totalFieldsTracked: number;
  fieldsWithDiscrepancy: number;
  assetsAnalyzed: number;
  lastUpdate: string | null;
}

export interface QualityStatsResponse {
  scrapers: ScraperQualityStats[];
  overall: {
    avgConsensus: number;
    totalDiscrepancies: number;
    totalAssetsAnalyzed: number;
    totalFieldsTracked: number;
    scrapersActive: number;
  };
}

// FASE 5: Discrepancy interfaces
export interface DivergentSource {
  source: string;
  value: number;
  deviation: number;
}

export interface Discrepancy {
  ticker: string;
  field: string;
  fieldLabel: string;
  consensusValue: number;
  consensusPercentage: number;
  divergentSources: DivergentSource[];
  severity: 'high' | 'medium' | 'low';
  lastUpdate: string;
}

export interface DiscrepanciesResponse {
  discrepancies: Discrepancy[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// FASE 70: Discrepancy Stats interfaces
export interface TopAssetDiscrepancy {
  ticker: string;
  assetName: string;
  count: number;
  avgDeviation: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface TopFieldDiscrepancy {
  field: string;
  fieldLabel: string;
  count: number;
  avgDeviation: number;
}

export interface DiscrepancyStatsResponse {
  topAssets: TopAssetDiscrepancy[];
  topFields: TopFieldDiscrepancy[];
  timeline: Array<{
    date: string;
    high: number;
    medium: number;
    low: number;
    total: number;
  }>;
}

export function useDataSources() {
  return useQuery<DataSource[]>({
    queryKey: ['data-sources'],
    queryFn: async () => {
      const response = await api.get('/scrapers/status');
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para buscar estatísticas de qualidade dos scrapers
 * FASE 4 - Dashboard de Qualidade
 */
export function useScrapersQualityStats() {
  return useQuery<QualityStatsResponse>({
    queryKey: ['scrapers-quality-stats'],
    queryFn: () => api.getScrapersQualityStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para buscar discrepâncias de dados
 * FASE 5 - Alertas de Discrepância
 * FASE 70 - Dashboard de Discrepâncias (expanded)
 */
export function useScrapersDiscrepancies(params?: {
  limit?: number;
  severity?: 'all' | 'high' | 'medium' | 'low';
  field?: string;
  ticker?: string;
  page?: number;
  pageSize?: number;
  orderBy?: 'severity' | 'deviation' | 'ticker' | 'field' | 'date';
  orderDirection?: 'asc' | 'desc';
}) {
  return useQuery<DiscrepanciesResponse>({
    queryKey: ['scrapers-discrepancies', params],
    queryFn: () => api.getScrapersDiscrepancies(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para buscar estatísticas agregadas de discrepâncias
 * FASE 70 - Dashboard de Discrepâncias
 */
export function useDiscrepancyStats(params?: { topLimit?: number }) {
  return useQuery<DiscrepancyStatsResponse>({
    queryKey: ['discrepancy-stats', params],
    queryFn: () => api.getDiscrepancyStats(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// ========================================
// FASE 90: Discrepancy Resolution Interfaces
// ========================================

export interface DiscrepancyDetail {
  ticker: string;
  assetName: string;
  fieldName: string;
  fieldLabel: string;
  currentValue: number | null;
  currentSource: string;
  consensus: number;
  hasDiscrepancy: boolean;
  severity: 'high' | 'medium' | 'low';
  maxDeviation: number;
  sourceValues: Array<{
    source: string;
    value: number | null;
    deviation: number | null;
    isConsensus: boolean;
    priority: number;
    scrapedAt: string;
  }>;
  resolutionHistory: ResolutionHistoryItem[];
  recommendedValue: number | null;
  recommendedSource: string | null;
  recommendedReason: string;
}

export interface ResolutionResult {
  ticker: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: number | null;
  newValue: number;
  selectedSource: string;
  method: 'manual' | 'auto_consensus' | 'auto_priority';
  severity: 'high' | 'medium' | 'low';
}

export interface AutoResolveResult {
  resolved: number;
  skipped: number;
  errors: number;
  results: ResolutionResult[];
}

/**
 * FASE 90.1: Interface para item do histórico de resolução
 */
export interface ResolutionHistoryItem {
  id: string;
  assetId: string;
  ticker: string;
  fieldName: string;
  fieldLabel: string | null;
  oldValue: number | null;
  newValue: number | null;
  selectedSource: string | null;
  resolutionMethod: 'manual' | 'auto_consensus' | 'auto_priority';
  resolvedBy: string | null;
  notes: string | null;
  sourceValuesSnapshot: Record<string, number | null>;
  severity: 'high' | 'medium' | 'low' | null;
  maxDeviation: number | null;
  fundamentalDataId: string | null;
  createdAt: string;
}

// ========================================
// FASE 90: Discrepancy Resolution Hooks
// ========================================

/**
 * Hook para obter detalhes de uma discrepância específica
 */
export function useDiscrepancyDetail(ticker: string | null, field: string | null) {
  return useQuery<DiscrepancyDetail>({
    queryKey: ['discrepancy-detail', ticker, field],
    queryFn: () => api.getDiscrepancyDetail(ticker!, field!),
    enabled: !!ticker && !!field,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para resolução manual de discrepância
 */
export function useResolveDiscrepancy() {
  const queryClient = useQueryClient();

  return useMutation<
    ResolutionResult,
    Error,
    {
      ticker: string;
      field: string;
      data: {
        selectedValue: number;
        selectedSource?: string;
        notes?: string;
      };
    }
  >({
    mutationFn: ({ ticker, field, data }) => api.resolveDiscrepancy(ticker, field, data),
    onSuccess: (result) => {
      // Invalidar queries relacionadas para refresh
      queryClient.invalidateQueries({ queryKey: ['scrapers-discrepancies'] });
      queryClient.invalidateQueries({ queryKey: ['discrepancy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['discrepancy-detail', result.ticker, result.fieldName] });
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
    },
  });
}

/**
 * Hook para auto-resolução de discrepâncias em lote
 */
export function useAutoResolveDiscrepancies() {
  const queryClient = useQueryClient();

  return useMutation<
    AutoResolveResult,
    Error,
    {
      method: 'consensus' | 'priority';
      severity?: 'all' | 'high' | 'medium' | 'low';
      tickerFilter?: string;
      fieldFilter?: string;
      dryRun?: boolean;
    }
  >({
    mutationFn: (data) => api.autoResolveDiscrepancies(data),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['scrapers-discrepancies'] });
      queryClient.invalidateQueries({ queryKey: ['discrepancy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scrapers-quality-stats'] });
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
    },
  });
}

/**
 * Hook para obter histórico de resoluções
 */
export function useResolutionHistory(params?: {
  ticker?: string;
  limit?: number;
  method?: 'manual' | 'auto_consensus' | 'auto_priority';
}) {
  return useQuery<ResolutionHistoryItem[]>({
    queryKey: ['resolution-history', params],
    queryFn: () => api.getResolutionHistory(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
