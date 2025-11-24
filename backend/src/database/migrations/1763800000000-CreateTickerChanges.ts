import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTickerChanges1763800000000 implements MigrationInterface {
  name = 'CreateTickerChanges1763800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticker_changes_old_new"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticker_changes_old"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticker_changes_new"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticker_changes" CASCADE`);

    await queryRunner.query(`
      CREATE TABLE "ticker_changes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "old_ticker" character varying(10) NOT NULL,
        "new_ticker" character varying(10) NOT NULL,
        "change_date" date NOT NULL,
        "reason" character varying(50),
        "ratio" numeric(10,6) NOT NULL DEFAULT '1.000000',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticker_changes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ticker_changes_old_new_v2" ON "ticker_changes" ("old_ticker", "new_ticker")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ticker_changes_old_v2" ON "ticker_changes" ("old_ticker")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ticker_changes_new_v2" ON "ticker_changes" ("new_ticker")
    `);

    // Seed initial data
    await queryRunner.query(`
      INSERT INTO "ticker_changes" ("old_ticker", "new_ticker", "change_date", "reason", "ratio")
      VALUES 
        ('ELET3', 'AXIA3', '2024-06-10', 'REBRANDING', 1.0),
        ('ARZZ3', 'AZZA3', '2024-07-01', 'MERGER', 1.0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ticker_changes_new_v2"`);
    await queryRunner.query(`DROP INDEX "IDX_ticker_changes_old_v2"`);
    await queryRunner.query(`DROP INDEX "IDX_ticker_changes_old_new_v2"`);
    await queryRunner.query(`DROP TABLE "ticker_changes"`);
  }
}
