/**
 * FASE 35: API Client para Sistema de Gerenciamento de Sync B3
 * Funções específicas para endpoints de sincronização
 */

import { api } from '../api';
import type {
  SyncStatusResponseDto,
  SyncBulkRequestDto,
  SyncBulkResponseDto,
} from '../types/data-sync';

/**
 * Obter status de sincronização de todos os ativos B3
 *
 * @returns Status consolidado de 55 ativos com resumo
 * @throws AxiosError se requisição falhar
 *
 * @example
 * const status = await getSyncStatus();
 * console.log(status.summary); // { total: 55, synced: 6, pending: 2, failed: 0 }
 */
export async function getSyncStatus(): Promise<SyncStatusResponseDto> {
  const response = await api.get('/market-data/sync-status');
  return response.data;
}

/**
 * Iniciar sincronização em massa de múltiplos ativos
 *
 * @param request Objeto com tickers, startYear e endYear
 * @returns HTTP 202 Accepted com estimativa de tempo
 * @throws AxiosError se validação falhar (400) ou erro de servidor (500)
 *
 * Padrão Assíncrono:
 * 1. Endpoint retorna imediatamente (HTTP 202 Accepted)
 * 2. Processamento continua em background (sequencial)
 * 3. Progresso enviado via WebSocket (namespace /sync)
 *
 * @example
 * const response = await startBulkSync({
 *   tickers: ['VALE3', 'PETR4', 'ABEV3'],
 *   startYear: 2020,
 *   endYear: 2024
 * });
 * console.log(response.estimatedMinutes); // 8 (3 × 2.5min)
 */
export async function startBulkSync(
  request: SyncBulkRequestDto
): Promise<SyncBulkResponseDto> {
  const response = await api.post('/market-data/sync-bulk', request);
  return response.data;
}

/**
 * Helper: Obter apenas ativos com status específico
 *
 * @param status Status desejado (SYNCED, PENDING, PARTIAL, FAILED)
 * @returns Lista filtrada de ativos
 *
 * @example
 * const pending = await getAssetsByStatus('PENDING');
 * console.log(pending.map(a => a.ticker)); // ['CCRO3', 'JBSS3']
 */
export async function getAssetsByStatus(status: string) {
  const allStatus = await getSyncStatus();
  return allStatus.assets.filter((asset) => asset.status === status);
}

/**
 * Helper: Validar se tickers existem antes de sync
 *
 * @param tickers Lista de tickers para validar
 * @returns { valid: string[], invalid: string[] }
 *
 * @example
 * const validation = await validateTickers(['VALE3', 'INVALID123']);
 * console.log(validation.invalid); // ['INVALID123']
 */
export async function validateTickers(tickers: string[]) {
  const allStatus = await getSyncStatus();
  const validTickers = new Set(allStatus.assets.map((a) => a.ticker));

  const valid = tickers.filter((t) => validTickers.has(t));
  const invalid = tickers.filter((t) => !validTickers.has(t));

  return { valid, invalid };
}

/**
 * Helper: Obter estatísticas de sincronização
 *
 * @returns Estatísticas consolidadas e métricas
 *
 * @example
 * const stats = await getSyncStats();
 * console.log(stats.coverage); // 10.9% (6/55 ativos SYNCED)
 */
export async function getSyncStats() {
  const status = await getSyncStatus();
  const { summary, assets } = status;

  // Calcular métricas adicionais
  const totalRecords = assets.reduce((sum, a) => sum + a.recordsLoaded, 0);
  const avgRecordsPerAsset = Math.round(totalRecords / summary.total);
  const coverage = ((summary.synced / summary.total) * 100).toFixed(1);

  // Identificar ativos com mais/menos dados
  const mostData = [...assets]
    .sort((a, b) => b.recordsLoaded - a.recordsLoaded)
    .slice(0, 5);
  const leastData = [...assets]
    .filter((a) => a.recordsLoaded > 0)
    .sort((a, b) => a.recordsLoaded - b.recordsLoaded)
    .slice(0, 5);

  return {
    summary,
    metrics: {
      totalRecords,
      avgRecordsPerAsset,
      coverage: `${coverage}%`,
    },
    topAssets: {
      mostData: mostData.map((a) => ({ ticker: a.ticker, records: a.recordsLoaded })),
      leastData: leastData.map((a) => ({ ticker: a.ticker, records: a.recordsLoaded })),
    },
  };
}
