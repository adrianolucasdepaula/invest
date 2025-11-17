import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add source column to asset_prices for data traceability
 *
 * Objective: Resolve FINRA Rule 6140 compliance violation (missing traceability)
 *
 * Changes:
 * 1. Create enum type: price_source_enum ('cotahist' | 'brapi')
 * 2. Add column: source (price_source_enum, NOT NULL)
 * 3. Populate existing records with 'cotahist' (safe default)
 * 4. Create index: IDX_asset_prices_source (optimize queries by source)
 *
 * Rollback: Fully reversible (down() method)
 *
 * Related:
 * - Entity: asset-price.entity.ts (PriceSource enum)
 * - Service: market-data.service.ts (merge logic with source)
 * - FASE 34.1: Add Source Column for Data Traceability
 */
export class AddSourceToAssetPrices1763500000000 implements MigrationInterface {
  name = 'AddSourceToAssetPrices1763500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create enum type for data source
    await queryRunner.query(`
      CREATE TYPE "public"."price_source_enum" AS ENUM('cotahist', 'brapi')
    `);

    // 2. Add source column (nullable initially to allow data population)
    await queryRunner.query(`
      ALTER TABLE "asset_prices"
      ADD COLUMN "source" "public"."price_source_enum"
    `);

    // 3. Populate existing records with 'cotahist' as safe default
    // Reasoning: All existing data came from COTAHIST integration (FASE 33)
    await queryRunner.query(`
      UPDATE "asset_prices"
      SET "source" = 'cotahist'
      WHERE "source" IS NULL
    `);

    // 4. Make column NOT NULL (after populating existing data)
    await queryRunner.query(`
      ALTER TABLE "asset_prices"
      ALTER COLUMN "source" SET NOT NULL
    `);

    // 5. Create index for performance (queries filtering by source)
    await queryRunner.query(`
      CREATE INDEX "IDX_asset_prices_source"
      ON "asset_prices" ("source")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback in reverse order

    // 1. Drop index
    await queryRunner.query(`
      DROP INDEX "public"."IDX_asset_prices_source"
    `);

    // 2. Drop source column
    await queryRunner.query(`
      ALTER TABLE "asset_prices"
      DROP COLUMN "source"
    `);

    // 3. Drop enum type
    await queryRunner.query(`
      DROP TYPE "public"."price_source_enum"
    `);
  }
}
