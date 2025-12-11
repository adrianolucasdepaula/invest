/**
 * FASE 93.12: Isolated Discrepancy Hooks
 *
 * These hooks are completely isolated from api.ts to bypass
 * Turbopack HMR module resolution bugs.
 *
 * DO NOT import anything from api.ts in this file!
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

// ========================================
// Types (duplicated to avoid imports)
// ========================================

export interface SourceValue {
  source: string;
  value: number | null;
  scrapedAt: string;
  priority: number;
  isConsensus: boolean;
  deviation: number | null;
}

export interface ResolutionHistoryItem {
  id: string;
  oldValue: number | null;
  newValue: number;
  selectedSource: string;
  resolutionMethod: string;
  resolvedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DiscrepancyDetail {
  ticker: string;
  field: string;
  fieldLabel: string;
  severity: 'low' | 'medium' | 'high';
  sourceValues: SourceValue[];
  consensusValue: number | null;
  maxDeviation: number;
  consensus: number;
  recommendedValue: number | null;
  recommendedSource: string | null;
  recommendedReason: string;
  resolutionHistory: ResolutionHistoryItem[];
}

// ========================================
// API Configuration (inline, no imports)
// ========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api/v1';

// Module load logging
console.log('%c[FASE 93.12] useDiscrepancyHooks.ts loaded - ISOLATED MODULE',
  'background: #ff6600; color: white; font-size: 16px; font-weight: bold;',
  { API_BASE_URL, timestamp: new Date().toISOString() }
);

/**
 * Create inline axios client - completely isolated from api.ts
 */
function createDiscrepancyClient(): AxiosInstance {
  console.log('%c[FASE 93.12] createDiscrepancyClient called',
    'background: #009900; color: white;',
    { baseURL: API_BASE_URL }
  );

  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(config => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('%c[FASE 93.12] Request interceptor',
      'background: #0066cc; color: white;',
      { url: config.url, hasToken: !!token }
    );
    return config;
  });

  return client;
}

// ========================================
// API Functions (inline implementations)
// ========================================

/**
 * Fetch discrepancy detail - inline implementation
 */
async function fetchDiscrepancyDetailInline(ticker: string, field: string): Promise<DiscrepancyDetail> {
  console.log('%c[FASE 93.12] fetchDiscrepancyDetailInline CALLED',
    'background: #00cc00; color: white; font-size: 14px; font-weight: bold;',
    { ticker, field }
  );

  const client = createDiscrepancyClient();
  const url = `/scrapers/discrepancies/${ticker}/${field}`;

  console.log('%c[FASE 93.12] Making GET request',
    'background: #6600cc; color: white;',
    { url }
  );

  const response = await client.get<DiscrepancyDetail>(url);

  console.log('%c[FASE 93.12] Response received',
    'background: #00cc66; color: white;',
    { ticker, field, dataKeys: Object.keys(response.data || {}) }
  );

  return response.data;
}

/**
 * Resolve discrepancy - inline implementation
 */
async function resolveDiscrepancyInline(
  ticker: string,
  field: string,
  data: {
    selectedValue: number;
    selectedSource?: string;
    notes?: string;
  }
): Promise<void> {
  console.log('%c[FASE 93.12] resolveDiscrepancyInline CALLED',
    'background: #0099ff; color: white; font-size: 14px; font-weight: bold;',
    { ticker, field, data }
  );

  const client = createDiscrepancyClient();
  await client.post(`/scrapers/discrepancies/${ticker}/${field}/resolve`, data);

  console.log('%c[FASE 93.12] Resolve successful',
    'background: #00cc66; color: white;',
    { ticker, field }
  );
}

// ========================================
// React Query Hooks
// ========================================

/**
 * Hook para buscar detalhes de uma discrepancia especifica
 * FASE 93.12: Completely isolated from api.ts
 */
export function useDiscrepancyDetailIsolated(ticker: string | null, field: string | null) {
  console.log('%c[FASE 93.12] useDiscrepancyDetailIsolated hook called',
    'background: #9900cc; color: white; font-size: 14px;',
    { ticker, field, enabled: !!ticker && !!field }
  );

  return useQuery<DiscrepancyDetail>({
    queryKey: ['discrepancy-detail-isolated', ticker, field],
    queryFn: () => {
      console.log('%c[FASE 93.12] queryFn executing',
        'background: #ff9900; color: black; font-size: 14px;',
        { ticker, field }
      );
      return fetchDiscrepancyDetailInline(ticker!, field!);
    },
    enabled: !!ticker && !!field,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para resolver uma discrepancia manualmente
 * FASE 93.12: Completely isolated from api.ts
 */
export function useResolveDiscrepancyIsolated() {
  const queryClient = useQueryClient();

  console.log('%c[FASE 93.12] useResolveDiscrepancyIsolated hook initialized',
    'background: #cc0099; color: white;'
  );

  return useMutation({
    mutationKey: ['resolve-discrepancy-isolated'],
    mutationFn: ({
      ticker,
      field,
      data,
    }: {
      ticker: string;
      field: string;
      data: {
        selectedValue: number;
        selectedSource?: string;
        notes?: string;
      };
    }) => {
      console.log('%c[FASE 93.12] mutationFn executing',
        'background: #ff6600; color: white; font-size: 14px;',
        { ticker, field, data }
      );
      return resolveDiscrepancyInline(ticker, field, data);
    },
    onSuccess: (_, variables) => {
      console.log('%c[FASE 93.12] Mutation success, invalidating queries',
        'background: #00cc00; color: white;',
        { ticker: variables.ticker, field: variables.field }
      );
      // Invalidate related queries - FASE 93.13: Use correct query keys
      queryClient.invalidateQueries({ queryKey: ['discrepancy-detail-isolated'] });
      queryClient.invalidateQueries({ queryKey: ['scrapers-discrepancies'] }); // Main discrepancies list
      queryClient.invalidateQueries({ queryKey: ['discrepancy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scrapers-quality-stats'] });
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
    },
  });
}
