import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertsTable1765800000000 implements MigrationInterface {
  name = 'CreateAlertsTable1765800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "alert_type_enum" AS ENUM (
          'price_above',
          'price_below',
          'price_change_percent',
          'volume_above',
          'rsi_above',
          'rsi_below',
          'indicator_change'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "alert_status_enum" AS ENUM (
          'active',
          'triggered',
          'paused',
          'expired',
          'disabled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create alerts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "asset_id" uuid,
        "ticker" character varying(20),
        "type" "alert_type_enum" NOT NULL,
        "status" "alert_status_enum" NOT NULL DEFAULT 'active',
        "name" character varying(255) NOT NULL,
        "description" text,
        "targetValue" numeric(18,4) NOT NULL,
        "currentValue" numeric(18,4),
        "notificationChannels" text NOT NULL DEFAULT 'websocket',
        "message" text,
        "triggeredAt" TIMESTAMP,
        "last_checked_at" TIMESTAMP,
        "trigger_count" integer NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP,
        "isRecurring" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alerts" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alerts_user_status" ON "alerts" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alerts_asset_status" ON "alerts" ("asset_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alerts_status_type" ON "alerts" ("status", "type")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "alerts"
      ADD CONSTRAINT "FK_alerts_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "alerts"
      ADD CONSTRAINT "FK_alerts_asset"
      FOREIGN KEY ("asset_id") REFERENCES "assets"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "alerts" DROP CONSTRAINT IF EXISTS "FK_alerts_asset"
    `);

    await queryRunner.query(`
      ALTER TABLE "alerts" DROP CONSTRAINT IF EXISTS "FK_alerts_user"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alerts_status_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alerts_asset_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alerts_user_status"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "alerts"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "alert_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alert_type_enum"`);
  }
}
