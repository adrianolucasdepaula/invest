/**
 * FASE 35: Types para Sistema de Gerenciamento de Sync B3
 * Correspondente aos DTOs do backend
 */

/**
 * Status de sincronização de um ativo individual
 */
export enum AssetSyncStatus {
  SYNCED = 'SYNCED',     // ≥200 registros (pronto para análise técnica)
  PENDING = 'PENDING',   // 0 registros (nunca sincronizado)
  PARTIAL = 'PARTIAL',   // <200 registros (insuficiente para indicadores)
  FAILED = 'FAILED',     // Última tentativa de sync falhou
}

/**
 * Informações de status de sync de um ativo individual
 */
export interface AssetSyncStatusDto {
  ticker: string;
  name: string;
  recordsLoaded: number;
  oldestDate: string | null;
  newestDate: string | null;
  status: AssetSyncStatus;
  lastSyncAt: Date | null;
  lastSyncDuration: number | null; // segundos
}

/**
 * Resposta consolidada de status de sync (GET /sync-status)
 */
export interface SyncStatusResponseDto {
  assets: AssetSyncStatusDto[];
  summary: {
    total: number;
    synced: number;
    pending: number;
    failed: number;
  };
}

/**
 * Request para sincronização em massa (POST /sync-bulk)
 */
export interface SyncBulkRequestDto {
  tickers: string[];
  startYear: number; // 1986-2024
  endYear: number;   // 1986-2024
}

/**
 * Resposta de sincronização em massa (HTTP 202 Accepted)
 */
export interface SyncBulkResponseDto {
  message: string;
  totalTickers: number;
  estimatedMinutes: number | null;
  instructions: string;
}

/**
 * FASE 37: Request para sincronização individual (POST /sync-cotahist)
 */
export interface SyncIndividualRequestDto {
  ticker: string;
  startYear?: number; // 1986-2025 (default: 2020)
  endYear?: number;   // 1986-2025 (default: current year)
}

/**
 * FASE 37: Resposta de sincronização individual (HTTP 200 OK)
 */
export interface SyncIndividualResponseDto {
  totalRecords: number;
  yearsProcessed: number;
  processingTime: number;
  sources: {
    cotahist: number;
    brapi: number;
    merged: number;
  };
  period: {
    start: string;
    end: string;
  };
}

/**
 * Eventos WebSocket emitidos pelo SyncGateway
 */

export interface SyncStartedEvent {
  tickers: string[];
  totalAssets: number;
  startYear: number;
  endYear: number;
  timestamp: Date;
}

export interface SyncProgressEvent {
  ticker: string;
  current: number;         // Asset atual (ex: 3)
  total: number;           // Total de assets (ex: 20)
  percentage: number;      // Progresso percentual (ex: 15)
  status: 'processing' | 'success' | 'failed';
  recordsInserted?: number;
  duration?: number;       // Segundos
  error?: string;
  timestamp: Date;
}

export interface SyncCompletedEvent {
  totalAssets: number;
  successCount: number;
  failedCount: number;
  duration: number;        // Segundos totais
  failedTickers?: string[];
  timestamp: Date;
}

export interface SyncFailedEvent {
  error: string;
  tickers?: string[];
  timestamp: Date;
}

/**
 * Union type de todos os eventos WebSocket
 */
export type SyncWebSocketEvent =
  | { event: 'sync:started'; data: SyncStartedEvent }
  | { event: 'sync:progress'; data: SyncProgressEvent }
  | { event: 'sync:completed'; data: SyncCompletedEvent }
  | { event: 'sync:failed'; data: SyncFailedEvent };

/**
 * Estado local do componente de sync
 */
export interface SyncState {
  isRunning: boolean;
  currentTicker: string | null;
  progress: number;        // 0-100
  logs: SyncLogEntry[];
  results: {
    success: string[];
    failed: string[];
  };
}

export interface SyncLogEntry {
  timestamp: Date;
  ticker: string;
  status: 'processing' | 'success' | 'failed';
  message: string;
  duration?: number;
  recordsInserted?: number;
}

/**
 * Props para componentes de sync
 */
export interface SyncConfigFormData {
  selectedTickers: string[];
  startYear: number;
  endYear: number;
}

export interface SyncStatusTableFilters {
  status?: AssetSyncStatus | 'ALL';
  search?: string;
  sortBy?: 'ticker' | 'name' | 'recordsLoaded' | 'lastSyncAt';
  sortOrder?: 'asc' | 'desc';
}
