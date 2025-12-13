import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOptionPricesTable1765300000001 implements MigrationInterface {
  name = 'CreateOptionPricesTable1765300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "option_type_enum" AS ENUM ('call', 'put')
    `);

    await queryRunner.query(`
      CREATE TYPE "option_style_enum" AS ENUM ('american', 'european')
    `);

    await queryRunner.query(`
      CREATE TYPE "option_status_enum" AS ENUM ('active', 'expired', 'exercised')
    `);

    // Create option_prices table
    await queryRunner.query(`
      CREATE TABLE "option_prices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticker" varchar(20) NOT NULL,
        "underlying_asset_id" uuid NOT NULL,
        "type" "option_type_enum" NOT NULL,
        "style" "option_style_enum" NOT NULL DEFAULT 'american',
        "status" "option_status_enum" NOT NULL DEFAULT 'active',
        "strike" decimal(18,8) NOT NULL,
        "expiration_date" date NOT NULL,
        "lastPrice" decimal(18,8),
        "bid" decimal(18,8),
        "ask" decimal(18,8),
        "volume" bigint,
        "open_interest" bigint,
        "implied_volatility" decimal(10,6),
        "delta" decimal(10,8),
        "gamma" decimal(10,8),
        "theta" decimal(10,8),
        "vega" decimal(10,8),
        "rho" decimal(10,8),
        "underlying_price" decimal(18,8),
        "intrinsic_value" decimal(18,8),
        "extrinsic_value" decimal(18,8),
        "days_to_expiration" integer,
        "in_the_money" boolean NOT NULL DEFAULT false,
        "source" varchar(50),
        "quote_time" timestamp,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "metadata" jsonb,
        CONSTRAINT "PK_option_prices" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_option_prices_underlying_expiration_type"
      ON "option_prices" ("underlying_asset_id", "expiration_date", "type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_option_prices_ticker"
      ON "option_prices" ("ticker")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_option_prices_expiration"
      ON "option_prices" ("expiration_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_option_prices_strike_type"
      ON "option_prices" ("strike", "type")
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "option_prices"
      ADD CONSTRAINT "FK_option_prices_asset"
      FOREIGN KEY ("underlying_asset_id")
      REFERENCES "assets"("id")
      ON DELETE CASCADE
    `);

    console.log('FASE 107: Created option_prices table with indexes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "option_prices" DROP CONSTRAINT "FK_option_prices_asset"`);
    await queryRunner.query(`DROP INDEX "IDX_option_prices_strike_type"`);
    await queryRunner.query(`DROP INDEX "IDX_option_prices_expiration"`);
    await queryRunner.query(`DROP INDEX "IDX_option_prices_ticker"`);
    await queryRunner.query(`DROP INDEX "IDX_option_prices_underlying_expiration_type"`);
    await queryRunner.query(`DROP TABLE "option_prices"`);
    await queryRunner.query(`DROP TYPE "option_status_enum"`);
    await queryRunner.query(`DROP TYPE "option_style_enum"`);
    await queryRunner.query(`DROP TYPE "option_type_enum"`);
  }
}
