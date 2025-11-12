import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

/**
 * Hook para buscar dados de um relatório de análise pelo ID
 *
 * @param id - ID do relatório/análise
 * @returns Query com dados do relatório
 */
export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });
}
