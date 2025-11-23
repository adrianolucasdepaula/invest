import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintAssetPrices1763331503585 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove existing non-unique index on (asset_id, date)
    await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_4e333ca2ad0689d3b419a011da";
        `);

    // Create UNIQUE constraint on (asset_id, date)
    // Required for ON CONFLICT in batch UPSERT operations (COTAHIST sync)
    await queryRunner.query(`
            ALTER TABLE "asset_prices"
            ADD CONSTRAINT "UQ_asset_prices_asset_id_date"
            UNIQUE ("asset_id", "date");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove UNIQUE constraint
    await queryRunner.query(`
            ALTER TABLE "asset_prices"
            DROP CONSTRAINT IF EXISTS "UQ_asset_prices_asset_id_date";
        `);

    // Recreate non-unique index
    await queryRunner.query(`
            CREATE INDEX "IDX_4e333ca2ad0689d3b419a011da"
            ON "asset_prices" ("asset_id", "date");
        `);
  }
}
