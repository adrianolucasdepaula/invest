import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function useAnalysis(ticker: string, type?: 'fundamental' | 'technical' | 'complete') {
  return useQuery({
    queryKey: ['analysis', ticker, type],
    queryFn: () => api.getAnalysis(ticker, type),
    enabled: !!ticker,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAnalyses(params?: { ticker?: string; type?: string; limit?: number }) {
  return useQuery({
    queryKey: ['analyses', params],
    queryFn: () => api.listAnalyses(params),
  });
}

export function useRequestAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticker, type }: { ticker: string; type: 'fundamental' | 'technical' | 'complete' }) =>
      api.requestAnalysis(ticker, type),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analysis', variables.ticker] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}
