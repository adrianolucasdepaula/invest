import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintAssetPrices1763513145845 implements MigrationInterface {
  name = 'AddUniqueConstraintAssetPrices1763513145845';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT '0.5'`,
    );
    // Only create if no unique constraint exists on (asset_id, date)
    const constraintExists = await queryRunner.query(`
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'asset_prices'
      AND c.contype = 'u'
      AND c.conname IN ('UQ_4e333ca2ad0689d3b419a011da9', 'UQ_asset_prices_asset_id_date')
    `);
    if (!constraintExists || constraintExists.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "asset_prices" ADD CONSTRAINT "UQ_4e333ca2ad0689d3b419a011da9" UNIQUE ("asset_id", "date")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_prices" DROP CONSTRAINT "UQ_4e333ca2ad0689d3b419a011da9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT 0.5`,
    );
  }
}
