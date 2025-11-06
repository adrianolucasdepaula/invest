import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function useReports(params?: { ticker?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => api.getReports(params),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => api.getReport(id),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticker: string) => api.generateReport(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'pdf' | 'html' | 'json' }) =>
      api.downloadReport(id, format),
  });
}
