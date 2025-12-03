import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: 'fundamental' | 'technical' | 'options' | 'prices' | 'news';
  status: 'active' | 'inactive' | 'error';
  lastSync: string | null;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requiresAuth: boolean;
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
 */
export function useScrapersDiscrepancies(params?: {
  limit?: number;
  severity?: 'all' | 'high' | 'medium' | 'low';
  field?: string;
}) {
  return useQuery<DiscrepanciesResponse>({
    queryKey: ['scrapers-discrepancies', params],
    queryFn: () => api.getScrapersDiscrepancies(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
