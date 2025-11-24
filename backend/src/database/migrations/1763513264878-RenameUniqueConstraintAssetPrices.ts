import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUniqueConstraintAssetPrices1763513264878 implements MigrationInterface {
  name = 'RenameUniqueConstraintAssetPrices1763513264878';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_prices" DROP CONSTRAINT "UQ_4e333ca2ad0689d3b419a011da9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT '0.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_prices" ADD CONSTRAINT "UQ_asset_prices_asset_id_date" UNIQUE ("asset_id", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_prices" DROP CONSTRAINT "UQ_asset_prices_asset_id_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT 0.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_prices" ADD CONSTRAINT "UQ_4e333ca2ad0689d3b419a011da9" UNIQUE ("asset_id", "date")`,
    );
  }
}
