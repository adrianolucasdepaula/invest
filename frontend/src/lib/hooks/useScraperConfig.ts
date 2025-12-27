/**
 * Hooks React Query para Scraper Configuration
 *
 * Hooks para interagir com API de configuração de scrapers.
 * Usa React Query para cache, refetch automático, e otimistic updates.
 *
 * FASE 4: Frontend Hooks & API Client
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type {
  ScraperConfig,
  ScraperExecutionProfile,
  UpdateScraperConfigDto,
  BulkToggleDto,
  UpdatePriorityDto,
  PreviewImpactDto,
  ImpactAnalysis,
  CreateProfileDto,
  UpdateProfileDto,
} from '@/types/scraper-config';
import * as scraperConfigApi from '../api/scraper-config.api';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Interface para erros da API
 * Zero Tolerance: Substituir error: any por tipo específico
 */
interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
  details?: Record<string, any>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  scraperConfigs: ['scraper-configs'] as const,
  scraperConfig: (id: string) => ['scraper-config', id] as const,
  executionProfiles: ['execution-profiles'] as const,
  impactPreview: (scraperIds: string[]) => ['impact-preview', scraperIds] as const,
};

// ============================================================================
// QUERIES (GET)
// ============================================================================

/**
 * Hook: Lista todos os scrapers com configurações
 *
 * @example
 * const { data: configs, isLoading } = useScraperConfigs();
 */
export function useScraperConfigs() {
  return useQuery({
    queryKey: QUERY_KEYS.scraperConfigs,
    queryFn: scraperConfigApi.getScraperConfigs,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook: Busca detalhes de um scraper
 *
 * @example
 * const { data: config } = useScraperConfig(scraperId);
 */
export function useScraperConfig(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.scraperConfig(id),
    queryFn: () => scraperConfigApi.getScraperConfig(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Lista todos os perfis de execução
 *
 * @example
 * const { data: profiles } = useExecutionProfiles();
 */
export function useExecutionProfiles() {
  return useQuery({
    queryKey: QUERY_KEYS.executionProfiles,
    queryFn: scraperConfigApi.getExecutionProfiles,
    staleTime: 10 * 60 * 1000, // 10 minutos (perfis mudam raramente)
  });
}

/**
 * Hook: Análise de impacto em tempo real
 *
 * @example
 * const { data: impact } = useImpactPreview(['fundamentus', 'brapi']);
 */
export function useImpactPreview(scraperIds: string[]) {
  return useQuery({
    queryKey: QUERY_KEYS.impactPreview(scraperIds),
    queryFn: () =>
      scraperConfigApi.previewConfigImpact({
        enabledScrapers: scraperIds,
      }),
    enabled: scraperIds.length > 0,
    staleTime: 60 * 1000, // 1 minuto
  });
}

// ============================================================================
// MUTATIONS (POST/PUT/PATCH/DELETE)
// ============================================================================

/**
 * Hook: Atualiza configuração de um scraper
 *
 * @example
 * const updateMutation = useUpdateScraperConfig();
 * updateMutation.mutate({ id: 'fundamentus', data: { timeout: 120000 } });
 */
export function useUpdateScraperConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScraperConfigDto }) =>
      scraperConfigApi.updateScraperConfig(id, data),
    onSuccess: (updatedConfig) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraperConfigs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraperConfig(updatedConfig.id) });

      toast.success(`Scraper ${updatedConfig.scraperName} atualizado com sucesso`);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao atualizar scraper';
      toast.error(message);
    },
  });
}

/**
 * Hook: Toggle ON/OFF de um scraper
 *
 * @example
 * const toggleMutation = useToggleScraperEnabled();
 * toggleMutation.mutate(scraperId);
 */
export function useToggleScraperEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scraperConfigApi.toggleScraperEnabled,
    onSuccess: (updatedConfig) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraperConfigs });

      const status = updatedConfig.isEnabled ? 'ativado' : 'desativado';
      toast.success(`Scraper ${updatedConfig.scraperName} ${status}`);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao alternar scraper';
      toast.error(message);
    },
  });
}

/**
 * Hook: Toggle em lote de múltiplos scrapers
 *
 * @example
 * const bulkToggleMutation = useBulkToggle();
 * bulkToggleMutation.mutate({ scraperIds: ['fundamentus', 'brapi'], enabled: true });
 */
export function useBulkToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scraperConfigApi.bulkToggleScrapers,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraperConfigs });

      const status = variables.enabled ? 'ativados' : 'desativados';
      toast.success(`${response.updated} scrapers ${status}`);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao atualizar scrapers em lote';
      toast.error(message);
    },
  });
}

/**
 * Hook: Atualiza prioridades (drag & drop)
 *
 * @example
 * const priorityMutation = useUpdatePriorities();
 * priorityMutation.mutate({ priorities: [{scraperId: 'brapi', priority: 1}, ...] });
 */
export function useUpdatePriorities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scraperConfigApi.updateScraperPriorities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraperConfigs });
      toast.success('Prioridades atualizadas');
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao atualizar prioridades';
      toast.error(message);
    },
  });
}

/**
 * Hook: Cria perfil de execução customizado
 *
 * @example
 * const createMutation = useCreateProfile();
 * createMutation.mutate({ name: 'custom', ... });
 */
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scraperConfigApi.createExecutionProfile,
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executionProfiles });
      toast.success(`Perfil "${newProfile.displayName}" criado com sucesso`);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao criar perfil';
      toast.error(message);
    },
  });
}

/**
 * Hook: Atualiza perfil de execução existente
 * GAP-001: Frontend integration para PUT /profiles/:id
 *
 * @example
 * const updateProfile = useUpdateProfile();
 * updateProfile.mutate({ id: '123', data: { displayName: 'Novo Nome', ... } });
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileDto }) =>
      scraperConfigApi.updateExecutionProfile(id, data),
    onSuccess: (updated) => {
      // Invalidar cache de perfis
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executionProfiles });

      toast.success(`Perfil "${updated.displayName}" atualizado com sucesso`);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(message);
    },
  });
}

/**
 * Hook: Deleta perfil customizado
 *
 * @example
 * const deleteMutation = useDeleteProfile();
 * deleteMutation.mutate(profileId);
 */
export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scraperConfigApi.deleteExecutionProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executionProfiles });
      toast.success('Perfil deletado');
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao deletar perfil';
      toast.error(message);
    },
  });
}

/**
 * Hook: Aplica perfil de execução
 *
 * CRÍTICO: Este é o hook principal usado na UI para trocar perfis
 *
 * @example
 * const applyMutation = useApplyProfile();
 * applyMutation.mutate(profileId);
 */
export function useApplyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scraperConfigApi.applyExecutionProfile,
    onSuccess: (response) => {
      // Invalidate configs (scrapers ativos mudaram)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraperConfigs });

      toast.success(response.message);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError?.response?.data?.message || 'Erro ao aplicar perfil';
      toast.error(message);
    },
  });
}
