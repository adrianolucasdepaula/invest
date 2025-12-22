import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * FASE: Fallback Exaustivo - 2025-12-22
 *
 * Cria tabela scraper_errors para rastrear TODOS os erros de scrapers
 * durante desenvolvimento. Usado para debug e identificação de bugs.
 *
 * SEM circuit breaker - queremos VER todos os erros, não escondê-los!
 */
export class CreateScraperErrors1766426400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scraper_errors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'ticker',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'scraper_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'ID do scraper que falhou (ex: FUNDAMENTUS, GRIFFIN, etc.)',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'error_stack',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'timeout, network_error, validation_failed, navigation_error, etc.',
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 1,
            isNullable: false,
            comment: 'Número de tentativas (retries) antes de falhar definitivamente',
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
            comment: 'Contexto adicional: params, response, timing, etc.',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Índice para queries por scraper + data
    await queryRunner.createIndex(
      'scraper_errors',
      new TableIndex({
        name: 'idx_scraper_errors_scraper_date',
        columnNames: ['scraper_id', 'created_at'],
      }),
    );

    // Índice para queries por ticker
    await queryRunner.createIndex(
      'scraper_errors',
      new TableIndex({
        name: 'idx_scraper_errors_ticker',
        columnNames: ['ticker'],
      }),
    );

    // Índice para queries por tipo de erro
    await queryRunner.createIndex(
      'scraper_errors',
      new TableIndex({
        name: 'idx_scraper_errors_type_date',
        columnNames: ['error_type', 'created_at'],
      }),
    );

    // Índice composto para análise de padrões
    await queryRunner.createIndex(
      'scraper_errors',
      new TableIndex({
        name: 'idx_scraper_errors_scraper_type',
        columnNames: ['scraper_id', 'error_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scraper_errors');
  }
}
