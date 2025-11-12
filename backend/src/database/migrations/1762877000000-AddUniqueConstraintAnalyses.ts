import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintAnalyses1762877000000 implements MigrationInterface {
  name = 'AddUniqueConstraintAnalyses1762877000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove duplicates first - keep only the most recent analysis for each user+asset+type combination
    await queryRunner.query(`
      DELETE FROM analyses a1
      USING analyses a2
      WHERE a1.id < a2.id
        AND a1.user_id = a2.user_id
        AND a1.asset_id = a2.asset_id
        AND a1.type = a2.type
        AND a1.user_id IS NOT NULL;
    `);

    // Add unique constraint to prevent duplicates
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_analyses_user_asset_type"
      ON "analyses" ("user_id", "asset_id", "type")
      WHERE "user_id" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_analyses_user_asset_type";
    `);
  }
}
