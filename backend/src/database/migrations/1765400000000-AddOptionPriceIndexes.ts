import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FASE 111: Add indexes to option_prices table for WHEEL candidates query optimization
 *
 * Problem: The /wheel/candidates endpoint was taking 77+ seconds due to:
 * - Missing index on (underlying_asset_id, updated_at) for latest option lookup
 * - Missing index on (underlying_asset_id) for WHERE clause filtering
 *
 * Solution: Add composite index to support both filtering and ordering efficiently
 */
export class AddOptionPriceIndexes1765400000000 implements MigrationInterface {
  name = 'AddOptionPriceIndexes1765400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if index already exists to make migration idempotent
    const indexExists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_option_price_underlying_updated'
    `);

    if (indexExists.length === 0) {
      // Composite index for WHEEL candidates query:
      // - Supports: WHERE underlying_asset_id IN (...) ORDER BY updated_at DESC
      // - Allows efficient subquery: SELECT MAX(updated_at) WHERE underlying_asset_id = ?
      await queryRunner.query(`
        CREATE INDEX idx_option_price_underlying_updated
        ON option_prices(underlying_asset_id, updated_at DESC)
      `);

      console.log('Created index: idx_option_price_underlying_updated');
    } else {
      console.log('Index idx_option_price_underlying_updated already exists, skipping');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_option_price_underlying_updated
    `);
    console.log('Dropped index: idx_option_price_underlying_updated');
  }
}
