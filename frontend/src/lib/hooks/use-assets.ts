import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function useAssets(params?: { search?: string; type?: string; limit?: number }) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => api.getAssets(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAsset(ticker: string) {
  return useQuery({
    queryKey: ['asset', ticker],
    queryFn: () => api.getAsset(ticker),
    enabled: !!ticker,
  });
}

export function useAssetPrices(
  ticker: string,
  params?: { range?: string; startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: ['asset-prices', ticker, params],
    queryFn: () => api.getAssetPrices(ticker, params),
    enabled: !!ticker,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useMarketDataPrices(
  ticker: string,
  params?: { timeframe?: string; range?: string; days?: number; unified?: boolean }
) {
  return useQuery({
    queryKey: ['market-data-prices', ticker, params],
    queryFn: () => api.getMarketDataPrices(ticker, params),
    enabled: !!ticker,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAssetFundamentals(ticker: string) {
  return useQuery({
    queryKey: ['asset-fundamentals', ticker],
    queryFn: () => api.getAssetFundamentals(ticker),
    enabled: !!ticker,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export interface FieldSourceValue {
  value: number | string | null;
  tolerance: number;
}

export interface DivergentSource {
  source: string;
  value: number | string | null;
}

export interface FieldSourceInfo {
  fieldName: string;
  consensusValue: number | string | null;
  sources: Record<string, FieldSourceValue>;
  hasDiscrepancy: boolean;
  divergentSources: DivergentSource[];
  sourcesCount: number;
  consensusPercentage: number;
}

export interface AssetDataSourcesResponse {
  ticker: string;
  assetName: string;
  lastUpdate: string | null;
  overallConfidence: number;
  sourcesUsed: string[];
  totalSourcesQueried: number;
  totalSourcesSuccessful: number;
  totalFieldsTracked: number;
  fieldsWithDiscrepancy: number;
  fieldsWithHighConsensus: number;
  fields: Record<string, FieldSourceInfo>;
}

export function useAssetDataSources(ticker: string) {
  return useQuery<AssetDataSourcesResponse>({
    queryKey: ['asset-data-sources', ticker],
    queryFn: () => api.getAssetDataSources(ticker),
    enabled: !!ticker,
    staleTime: 30 * 60 * 1000, // 30 minutes - same as fundamentals
  });
}
