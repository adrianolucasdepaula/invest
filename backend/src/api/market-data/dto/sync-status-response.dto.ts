import { ApiProperty } from '@nestjs/swagger';

/**
 * Status de sincronização de um ativo individual
 *
 * - SYNCED: Dados carregados e suficientes para análise (≥200 registros)
 * - PENDING: Nunca sincronizado (0 registros)
 * - PARTIAL: Dados insuficientes para análise técnica (<200 registros)
 * - FAILED: Última tentativa de sync falhou
 */
export enum AssetSyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

/**
 * DTO para status de sync de um ativo individual
 * FASE 35 - Sistema de Gerenciamento de Sync B3
 */
export class AssetSyncStatusDto {
  @ApiProperty({
    example: 'VALE3',
    description: 'Código do ativo (ticker)'
  })
  ticker: string;

  @ApiProperty({
    example: 'Vale ON',
    description: 'Nome do ativo'
  })
  name: string;

  @ApiProperty({
    example: 2514,
    description: 'Quantidade de registros carregados no database'
  })
  recordsLoaded: number;

  @ApiProperty({
    example: '2015-01-02',
    description: 'Data do registro mais antigo',
    nullable: true
  })
  oldestDate: string | null;

  @ApiProperty({
    example: '2025-11-20',
    description: 'Data do registro mais recente',
    nullable: true
  })
  newestDate: string | null;

  @ApiProperty({
    example: AssetSyncStatus.SYNCED,
    enum: AssetSyncStatus,
    description: 'Status de sincronização do ativo'
  })
  status: AssetSyncStatus;

  @ApiProperty({
    example: '2025-11-20T12:30:00Z',
    description: 'Data/hora da última sincronização',
    nullable: true
  })
  lastSyncAt: Date | null;

  @ApiProperty({
    example: 224.5,
    description: 'Duração da última sincronização (segundos)',
    nullable: true
  })
  lastSyncDuration: number | null;
}

/**
 * DTO para resposta de status de sync consolidado
 * Retorna lista completa de todos os ativos B3 com seus respectivos status
 *
 * Uso: GET /api/v1/market-data/sync-status
 */
export class SyncStatusResponseDto {
  @ApiProperty({
    type: [AssetSyncStatusDto],
    description: 'Lista de todos os ativos com status de sync'
  })
  assets: AssetSyncStatusDto[];

  @ApiProperty({
    example: { total: 55, synced: 44, pending: 8, failed: 3 },
    description: 'Resumo consolidado dos status de sync'
  })
  summary: {
    total: number;
    synced: number;
    pending: number;
    failed: number;
  };
}
