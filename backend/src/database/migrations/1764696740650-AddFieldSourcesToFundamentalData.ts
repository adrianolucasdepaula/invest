import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddFieldSourcesToFundamentalData
 *
 * FASE 1.1 - Sistema de Rastreamento de Origem por Campo
 *
 * Adiciona coluna JSONB para rastrear a origem de cada campo fundamental.
 * Estrutura:
 * {
 *   "pl": {
 *     "values": [
 *       {"source": "fundamentus", "value": 5.42, "scrapedAt": "2025-12-02T10:30:00Z"},
 *       {"source": "statusinvest", "value": 5.45, "scrapedAt": "2025-12-02T10:30:00Z"}
 *     ],
 *     "finalValue": 5.42,
 *     "finalSource": "fundamentus",
 *     "sourcesCount": 2,
 *     "variance": 0.012
 *   }
 * }
 */
export class AddFieldSourcesToFundamentalData1764696740650 implements MigrationInterface {
  name = 'AddFieldSourcesToFundamentalData1764696740650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna field_sources como JSONB
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      ADD COLUMN "field_sources" JSONB DEFAULT '{}'
    `);

    // 2. Criar índice GIN para queries eficientes no JSONB
    await queryRunner.query(`
      CREATE INDEX "idx_fundamental_data_field_sources"
      ON "fundamental_data"
      USING GIN ("field_sources")
    `);

    // 3. Adicionar comentário explicativo
    await queryRunner.query(`
      COMMENT ON COLUMN "fundamental_data"."field_sources"
      IS 'JSONB contendo a origem de cada campo: {campo: {values: [{source, value, scrapedAt}], finalValue, finalSource, sourcesCount, variance}}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_fundamental_data_field_sources"
    `);

    // 2. Remover coluna
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      DROP COLUMN IF EXISTS "field_sources"
    `);
  }
}
