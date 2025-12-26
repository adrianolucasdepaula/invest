import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateScraperConfigAudit
 *
 * GAP-006: Cria tabela de auditoria para rastrear todas as mudancas
 * em configuracoes de scrapers.
 *
 * Compliance: Requerido para sistemas financeiros
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\prancy-napping-stroustrup.md - GAP-006
 */
export class CreateScraperConfigAudit1766716800000 implements MigrationInterface {
  name = 'CreateScraperConfigAudit1766716800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para acoes
    await queryRunner.query(`
      CREATE TYPE "scraper_config_audit_action_enum" AS ENUM (
        'CREATE',
        'UPDATE',
        'DELETE',
        'TOGGLE',
        'BULK_TOGGLE',
        'APPLY_PROFILE',
        'UPDATE_PRIORITY'
      )
    `);

    // Criar tabela de auditoria
    await queryRunner.createTable(
      new Table({
        name: 'scraper_config_audit',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'action',
            type: 'scraper_config_audit_action_enum',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'scraperId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'profileId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Criar indexes para queries de auditoria comuns
    await queryRunner.createIndex(
      'scraper_config_audit',
      new TableIndex({
        name: 'IDX_audit_scraper_created',
        columnNames: ['scraperId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_config_audit',
      new TableIndex({
        name: 'IDX_audit_user_created',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_config_audit',
      new TableIndex({
        name: 'IDX_audit_action_created',
        columnNames: ['action', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover indexes
    await queryRunner.dropIndex('scraper_config_audit', 'IDX_audit_action_created');
    await queryRunner.dropIndex('scraper_config_audit', 'IDX_audit_user_created');
    await queryRunner.dropIndex('scraper_config_audit', 'IDX_audit_scraper_created');

    // Remover tabela
    await queryRunner.dropTable('scraper_config_audit');

    // Remover enum
    await queryRunner.query(`DROP TYPE "scraper_config_audit_action_enum"`);
  }
}
