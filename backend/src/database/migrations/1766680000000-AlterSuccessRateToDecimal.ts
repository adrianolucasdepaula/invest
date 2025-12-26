import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Alter successRate from FLOAT to NUMERIC(5,2)
 *
 * COMPLIANCE CRÍTICO (CLAUDE.md):
 * "❌ NUNCA Float para valores monetários/financeiros"
 * "✅ CORRETO: Decimal.js ou numeric/decimal"
 *
 * Taxa de sucesso (0-100%) é métrica crítica de qualidade de dados financeiros.
 * Float tem imprecisão inerente que pode causar cálculos incorretos.
 *
 * FASE: Dynamic Scraper Configuration - Code Review Batch 1
 * BUG-002: Float → Decimal (compliance financeiro)
 * REF: C:\Users\adria\.claude\plans\prancy-napping-stroustrup.md
 */
export class AlterSuccessRateToDecimal1766680000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar tipo da coluna de FLOAT para NUMERIC(5,2)
    // precision: 5 dígitos totais
    // scale: 2 decimais
    // Range: 0.00 - 100.00%
    await queryRunner.query(`
      ALTER TABLE scraper_configs
      ALTER COLUMN "successRate" TYPE NUMERIC(5,2)
      USING "successRate"::numeric(5,2)
    `);

    // Garantir que default é '0.00' (string) ao invés de 0 (number)
    await queryRunner.query(`
      ALTER TABLE scraper_configs
      ALTER COLUMN "successRate" SET DEFAULT '0.00'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Voltar para FLOAT (perda de precisão aceitável em rollback)
    await queryRunner.query(`
      ALTER TABLE scraper_configs
      ALTER COLUMN "successRate" TYPE REAL
      USING "successRate"::real
    `);

    await queryRunner.query(`
      ALTER TABLE scraper_configs
      ALTER COLUMN "successRate" SET DEFAULT 0
    `);
  }
}
