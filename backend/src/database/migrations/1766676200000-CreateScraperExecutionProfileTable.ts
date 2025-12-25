import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migration: Create scraper_execution_profiles table
 *
 * Tabela para perfis pré-definidos de execução de scrapers.
 * Permite aplicar configurações completas com 1 clique.
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md
 */
export class CreateScraperExecutionProfileTable1766676200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela scraper_execution_profiles
    await queryRunner.createTable(
      new Table({
        name: 'scraper_execution_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'isSystem',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: false,
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
      CREATE INDEX "IDX_profile_default" ON "scraper_execution_profiles" ("isDefault")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_profile_system" ON "scraper_execution_profiles" ("isSystem")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table (cascades indexes)
    await queryRunner.dropTable('scraper_execution_profiles', true);
  }
}
