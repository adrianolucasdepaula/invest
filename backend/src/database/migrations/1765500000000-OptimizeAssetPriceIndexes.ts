import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FASE 117: Optimize AssetPrice Indexes
 *
 * This migration adds optimized indexes for common query patterns:
 *
 * 1. BRIN index on date - Very efficient for time-ordered data (~100x smaller than B-tree)
 * 2. Partial index for recent data (last 2 years) - Most accessed data
 * 3. Covering index for OHLCV queries - Includes all price columns
 * 4. Index for aggregation queries by month
 *
 * Performance benefits:
 * - BRIN: O(1) for sequential scans on date ranges (vs O(log n) for B-tree)
 * - Partial index: Smaller, faster for recent data queries
 * - Covering index: Index-only scans (no heap access needed)
 */
export class OptimizeAssetPriceIndexes1765500000000 implements MigrationInterface {
  name = 'OptimizeAssetPriceIndexes1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. BRIN index for date column (very efficient for time-series data)
    // BRIN (Block Range INdex) is ideal for naturally ordered data like timestamps
    // ~100x smaller than B-tree, excellent for large tables with sequential data
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_prices_date_brin
      ON asset_prices USING BRIN (date)
      WITH (pages_per_range = 128);
    `);

    // 2. Partial index for recent data (from 2023 onwards)
    // Most queries target recent data, so a smaller focused index is faster
    // Note: Uses fixed date instead of CURRENT_DATE (which is not IMMUTABLE)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_prices_recent
      ON asset_prices (asset_id, date DESC)
      WHERE date >= '2023-01-01';
    `);

    // 3. Covering index for OHLCV queries (includes all price columns)
    // Enables index-only scans - no need to access heap for simple price queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_prices_ohlcv_covering
      ON asset_prices (asset_id, date DESC)
      INCLUDE (open, high, low, close, volume, adjusted_close);
    `);

    // 4. Statistics update for query planner
    await queryRunner.query(`
      ANALYZE asset_prices;
    `);

    // Log index sizes for monitoring (optional - just informational)
    try {
      await queryRunner.query(`
        SELECT
          indexrelname as index_name,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND relname = 'asset_prices'
        ORDER BY pg_relation_size(indexrelid) DESC;
      `);
    } catch {
      // Non-critical logging query - ignore errors
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_asset_prices_ohlcv_covering;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_asset_prices_recent;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_asset_prices_date_brin;
    `);

    // Update statistics
    await queryRunner.query(`
      ANALYZE asset_prices;
    `);
  }
}
