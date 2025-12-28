import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FASE 144: Add UNIQUE constraint to fundamental_data
 *
 * BUGFIX: Previne duplicatas em (asset_id, reference_date)
 * - Limpa duplicatas existentes (mantém a mais recente)
 * - Adiciona UNIQUE constraint
 * - Converte INSERT para UPSERT behavior
 */
export class AddUniqueFundamentalData1735408200000 implements MigrationInterface {
  name = 'AddUniqueFundamentalData1735408200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Remover duplicatas (manter apenas a row mais recente por asset_id + reference_date)
    await queryRunner.query(`
      WITH RankedData AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY asset_id, reference_date
            ORDER BY updated_at DESC, created_at DESC
          ) as rn
        FROM fundamental_data
      )
      DELETE FROM fundamental_data
      WHERE id IN (
        SELECT id FROM RankedData WHERE rn > 1
      );
    `);

    // Step 2: Adicionar UNIQUE constraint
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      ADD CONSTRAINT "UQ_fundamental_data_asset_date"
      UNIQUE ("asset_id", "reference_date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover UNIQUE constraint
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      DROP CONSTRAINT "UQ_fundamental_data_asset_date";
    `);

    // Nota: Não podemos restaurar duplicatas removidas
  }
}
