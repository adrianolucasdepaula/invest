import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateScraperMetrics1762906000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scraper_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'scraper_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'operation_type',
            type: 'varchar',
            length: '10',
            isNullable: false,
            comment: 'test or sync',
          },
          {
            name: 'ticker',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Ticker being tested/synced (null for general operations)',
          },
          {
            name: 'success',
            type: 'boolean',
            isNullable: false,
          },
          {
            name: 'response_time',
            type: 'integer',
            isNullable: true,
            comment: 'Response time in milliseconds',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'scraper_metrics',
      new TableIndex({
        name: 'IDX_scraper_metrics_scraper_id',
        columnNames: ['scraper_id'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_metrics',
      new TableIndex({
        name: 'IDX_scraper_metrics_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_metrics',
      new TableIndex({
        name: 'IDX_scraper_metrics_scraper_operation',
        columnNames: ['scraper_id', 'operation_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('scraper_metrics', 'IDX_scraper_metrics_scraper_operation');
    await queryRunner.dropIndex('scraper_metrics', 'IDX_scraper_metrics_created_at');
    await queryRunner.dropIndex('scraper_metrics', 'IDX_scraper_metrics_scraper_id');
    await queryRunner.dropTable('scraper_metrics');
  }
}
