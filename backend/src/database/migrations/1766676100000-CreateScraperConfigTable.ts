import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migration: Create scraper_configs table
 *
 * Tabela para configuração dinâmica de scrapers individuais.
 * Permite controle de quais scrapers executar, ordem de prioridade, e parâmetros.
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md
 */
export class CreateScraperConfigTable1766676100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar ENUMs para runtime e category
    await queryRunner.query(`
      CREATE TYPE "scraper_configs_runtime_enum" AS ENUM ('typescript', 'python')
    `);

    await queryRunner.query(`
      CREATE TYPE "scraper_configs_category_enum" AS ENUM (
        'fundamental',
        'technical',
        'news',
        'ai',
        'market_data',
        'crypto',
        'options',
        'macro'
      )
    `);

    // Criar tabela scraper_configs
    await queryRunner.createTable(
      new Table({
        name: 'scraper_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'scraperId',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'scraperName',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'runtime',
            type: 'enum',
            enum: ['typescript', 'python'],
            enumName: 'scraper_configs_runtime_enum',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'fundamental',
              'technical',
              'news',
              'ai',
              'market_data',
              'crypto',
              'options',
              'macro',
            ],
            enumName: 'scraper_configs_category_enum',
            isNullable: false,
          },
          {
            name: 'isEnabled',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'enabledFor',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'parameters',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'successRate',
            type: 'float',
            default: 0,
            isNullable: false,
          },
          {
            name: 'avgResponseTime',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'lastSuccess',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastError',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requiresAuth',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'authType',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_scraper_config_enabled" ON "scraper_configs" ("isEnabled")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_scraper_config_priority" ON "scraper_configs" ("priority")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_scraper_config_category" ON "scraper_configs" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_scraper_config_runtime" ON "scraper_configs" ("runtime")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table (cascades indexes)
    await queryRunner.dropTable('scraper_configs', true);

    // Drop ENUMs
    await queryRunner.query(`DROP TYPE IF EXISTS "scraper_configs_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "scraper_configs_runtime_enum"`);
  }
}
