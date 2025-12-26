import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add UNIQUE constraint to scraper_configs.priority
 *
 * BUG-003: Entity comenta "CONSTRAINT: Deve ser única" mas migration não criou
 *
 * Problema:
 * - Múltiplos scrapers podem ter mesma prioridade
 * - Ordenação de execução fica incerta
 * - Drag & drop não funciona corretamente
 *
 * Solução:
 * - Adicionar UNIQUE constraint em priority
 * - Antes, garantir que não há duplicatas existentes
 *
 * FASE: Dynamic Scraper Configuration - Code Review Batch 1
 * REF: C:\Users\adria\.claude\plans\prancy-napping-stroustrup.md
 */
export class AddUniquePriorityConstraint1766680100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Identificar e corrigir duplicatas existentes
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          priority,
          ROW_NUMBER() OVER (PARTITION BY priority ORDER BY "createdAt", id) as row_num
        FROM scraper_configs
      )
      UPDATE scraper_configs sc
      SET priority = (
        SELECT MAX(priority) + (row_num - 1)
        FROM scraper_configs
      )
      FROM ranked r
      WHERE sc.id = r.id
        AND r.row_num > 1
    `);

    // 2. Adicionar constraint UNIQUE
    await queryRunner.query(`
      ALTER TABLE scraper_configs
      ADD CONSTRAINT UQ_scraper_config_priority UNIQUE (priority)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE scraper_configs
      DROP CONSTRAINT IF EXISTS UQ_scraper_config_priority
    `);
  }
}
