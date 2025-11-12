import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.getPortfolios(),
    staleTime: 0, // Always fetch fresh data to ensure firstBuyDate is up-to-date
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => api.getPortfolio(id),
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.createPortfolio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updatePortfolio(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deletePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, data }: { portfolioId: string; data: any }) =>
      api.addPosition(portfolioId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, positionId, data }: { portfolioId: string; positionId: string; data: any }) =>
      api.updatePosition(portfolioId, positionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, positionId }: { portfolioId: string; positionId: string }) =>
      api.deletePosition(portfolioId, positionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useImportPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, source }: { file: File; source: 'b3' | 'kinvo' | 'myprofit' | 'nuinvest' }) =>
      api.importPortfolio(file, source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}
