import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollectedAtToAssetPrices1762889210960 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "asset_prices"
      ADD COLUMN "collected_at" TIMESTAMP
    `);

    // Set collected_at = created_at for existing records
    await queryRunner.query(`
      UPDATE "asset_prices"
      SET "collected_at" = "created_at"
      WHERE "collected_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "asset_prices"
      DROP COLUMN "collected_at"
    `);
  }
}
