/**
 * API Client para Scraper Configuration
 *
 * Funções para interagir com endpoints de configuração de scrapers.
 *
 * FASE 4: Frontend Hooks & API Client
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md
 */

import { api } from '../api';
import type {
  ScraperConfig,
  ScraperExecutionProfile,
  UpdateScraperConfigDto,
  BulkToggleDto,
  BulkToggleResponse,
  UpdatePriorityDto,
  PreviewImpactDto,
  ImpactAnalysis,
  CreateProfileDto,
  UpdateProfileDto,
  ApplyProfileResponse,
} from '@/types/scraper-config';

const BASE_PATH = '/scraper-config';

// ============================================================================
// CRUD DE SCRAPERS
// ============================================================================

/**
 * Lista todos os scrapers com configurações
 */
export async function getScraperConfigs(): Promise<ScraperConfig[]> {
  const response = await api.get(BASE_PATH);
  return response.data;
}

/**
 * Busca detalhes de um scraper
 */
export async function getScraperConfig(id: string): Promise<ScraperConfig> {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data;
}

/**
 * Atualiza configuração de um scraper
 */
export async function updateScraperConfig(
  id: string,
  data: UpdateScraperConfigDto,
): Promise<ScraperConfig> {
  const response = await api.put(`${BASE_PATH}/${id}`, data);
  return response.data;
}

/**
 * Toggle ON/OFF de um scraper
 */
export async function toggleScraperEnabled(id: string): Promise<ScraperConfig> {
  const response = await api.patch(`${BASE_PATH}/${id}/toggle`);
  return response.data;
}

/**
 * Toggle em lote de múltiplos scrapers
 */
export async function bulkToggleScrapers(data: BulkToggleDto): Promise<BulkToggleResponse> {
  const response = await api.patch(`${BASE_PATH}/bulk/toggle`, data);
  return response.data;
}

/**
 * Atualiza prioridades de múltiplos scrapers (drag & drop)
 */
export async function updateScraperPriorities(data: UpdatePriorityDto): Promise<void> {
  await api.put(`${BASE_PATH}/bulk/priority`, data);
}

// ============================================================================
// PERFIS DE EXECUÇÃO
// ============================================================================

/**
 * Lista todos os perfis de execução
 */
export async function getExecutionProfiles(): Promise<ScraperExecutionProfile[]> {
  const response = await api.get(`${BASE_PATH}/profiles`);
  return response.data;
}

/**
 * Cria perfil de execução customizado
 */
export async function createExecutionProfile(
  data: CreateProfileDto,
): Promise<ScraperExecutionProfile> {
  const response = await api.post(`${BASE_PATH}/profiles`, data);
  return response.data;
}

/**
 * Atualiza perfil de execução customizado
 * GAP-001: Implementação frontend para PUT /profiles/:id
 *
 * @param id - ID do perfil a atualizar
 * @param data - Dados do perfil (UpdateProfileDto)
 * @returns Perfil atualizado
 * @throws Error se perfil não existe ou é system profile
 */
export async function updateExecutionProfile(
  id: string,
  data: UpdateProfileDto,
): Promise<ScraperExecutionProfile> {
  const response = await api.put(`${BASE_PATH}/profiles/${id}`, data);
  return response.data;
}

/**
 * Deleta perfil customizado (system profiles não podem ser deletados)
 */
export async function deleteExecutionProfile(id: string): Promise<void> {
  await api.delete(`${BASE_PATH}/profiles/${id}`);
}

/**
 * Aplica perfil (desativa todos, ativa apenas do perfil, atualiza prioridades)
 */
export async function applyExecutionProfile(id: string): Promise<ApplyProfileResponse> {
  const response = await api.post(`${BASE_PATH}/profiles/${id}/apply`);
  return response.data;
}

// ============================================================================
// ANÁLISE DE IMPACTO
// ============================================================================

/**
 * Análise de impacto antes de aplicar mudanças
 */
export async function previewConfigImpact(data: PreviewImpactDto): Promise<ImpactAnalysis> {
  const response = await api.post(`${BASE_PATH}/preview-impact`, data);
  return response.data;
}
