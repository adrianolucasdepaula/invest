import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FASE 120: Asset Prices Archive Strategy
 *
 * Creates an archive table for historical asset prices (before 2020).
 * This improves query performance on the main table by:
 * - Keeping the main table smaller and more focused on recent data
 * - Maintaining historical data in a separate archive table
 * - Creating a unified view for when all data is needed
 *
 * Strategy:
 * 1. Create asset_prices_archive table with same structure
 * 2. Move records before 2020 to archive
 * 3. Create asset_prices_all view for unified access
 * 4. Add indexes optimized for each table's use case
 *
 * Benefits:
 * - Main table reduced from ~300K to ~200K rows
 * - Faster queries on recent data (most common use case)
 * - Historical data still accessible via view
 * - Compatible with TypeORM (unlike native partitioning)
 */
export class CreateAssetPricesArchive1765600000000 implements MigrationInterface {
  name = 'CreateAssetPricesArchive1765600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create archive table with same structure as asset_prices
    // Note: Using the same enum type as the main table for source column
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS asset_prices_archive (
        id UUID PRIMARY KEY,
        asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        open DECIMAL(18,4) NOT NULL,
        high DECIMAL(18,4) NOT NULL,
        low DECIMAL(18,4) NOT NULL,
        close DECIMAL(18,4) NOT NULL,
        adjusted_close DECIMAL(18,4),
        volume BIGINT NOT NULL,
        source asset_prices_source_enum NOT NULL,
        market_cap DECIMAL(18,2),
        change DECIMAL(18,2),
        change_percent DECIMAL(10,4),
        number_of_trades INTEGER,
        metadata JSONB,
        collected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        archived_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (asset_id, date)
      );
    `);

    // 2. Create indexes for archive table (optimized for historical queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_archive_asset_date
      ON asset_prices_archive (asset_id, date DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_archive_date_brin
      ON asset_prices_archive USING BRIN (date)
      WITH (pages_per_range = 32);
    `);

    // 3. Move records before 2020 to archive table
    await queryRunner.query(`
      INSERT INTO asset_prices_archive (
        id, asset_id, date, open, high, low, close, adjusted_close,
        volume, source, market_cap, change, change_percent,
        number_of_trades, metadata, collected_at, created_at
      )
      SELECT
        id, asset_id, date, open, high, low, close, adjusted_close,
        volume, source, market_cap, change, change_percent,
        number_of_trades, metadata, collected_at, created_at
      FROM asset_prices
      WHERE date < '2020-01-01'
      ON CONFLICT (asset_id, date) DO NOTHING;
    `);

    // 4. Delete archived records from main table
    await queryRunner.query(`
      DELETE FROM asset_prices
      WHERE date < '2020-01-01';
    `);

    // 5. Create unified view for when all data is needed
    await queryRunner.query(`
      CREATE OR REPLACE VIEW asset_prices_all AS
      SELECT
        id, asset_id, date, open, high, low, close, adjusted_close,
        volume, source, market_cap, change, change_percent,
        number_of_trades, metadata, collected_at, created_at,
        'current' as data_tier
      FROM asset_prices
      UNION ALL
      SELECT
        id, asset_id, date, open, high, low, close, adjusted_close,
        volume, source, market_cap, change, change_percent,
        number_of_trades, metadata, collected_at, created_at,
        'archive' as data_tier
      FROM asset_prices_archive;
    `);

    // 6. Update statistics for query planner
    await queryRunner.query(`ANALYZE asset_prices;`);
    await queryRunner.query(`ANALYZE asset_prices_archive;`);

    // 7. Log migration results
    const mainCount = await queryRunner.query(`SELECT COUNT(*) as count FROM asset_prices;`);
    const archiveCount = await queryRunner.query(`SELECT COUNT(*) as count FROM asset_prices_archive;`);

    console.log(`[MIGRATION] Asset prices archived:`);
    console.log(`  - Main table: ${mainCount[0].count} records (2020+)`);
    console.log(`  - Archive table: ${archiveCount[0].count} records (pre-2020)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the view first
    await queryRunner.query(`DROP VIEW IF EXISTS asset_prices_all;`);

    // 2. Restore archived records back to main table
    await queryRunner.query(`
      INSERT INTO asset_prices (
        id, asset_id, date, open, high, low, close, adjusted_close,
        volume, source, market_cap, change, change_percent,
        number_of_trades, metadata, collected_at, created_at
      )
      SELECT
        id, asset_id, date, open, high, low, close, adjusted_close,
        volume, source, market_cap, change, change_percent,
        number_of_trades, metadata, collected_at, created_at
      FROM asset_prices_archive
      ON CONFLICT (asset_id, date) DO NOTHING;
    `);

    // 3. Drop archive table
    await queryRunner.query(`DROP TABLE IF EXISTS asset_prices_archive;`);

    // 4. Update statistics
    await queryRunner.query(`ANALYZE asset_prices;`);
  }
}
