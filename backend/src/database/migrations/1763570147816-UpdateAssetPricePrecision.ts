import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssetPricePrecision1763570147816 implements MigrationInterface {
  name = 'UpdateAssetPricePrecision1763570147816';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "open" TYPE numeric(18,4)`);
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "high" TYPE numeric(18,4)`);
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "low" TYPE numeric(18,4)`);
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "close" TYPE numeric(18,4)`);
    await queryRunner.query(
      `ALTER TABLE "asset_prices" ALTER COLUMN "adjusted_close" TYPE numeric(18,4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT '0.5'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT 0.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_prices" ALTER COLUMN "adjusted_close" TYPE numeric(18,2)`,
    );
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "close" TYPE numeric(18,2)`);
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "low" TYPE numeric(18,2)`);
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "high" TYPE numeric(18,2)`);
    await queryRunner.query(`ALTER TABLE "asset_prices" ALTER COLUMN "open" TYPE numeric(18,2)`);
  }
}
