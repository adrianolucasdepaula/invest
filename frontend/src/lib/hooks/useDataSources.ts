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
