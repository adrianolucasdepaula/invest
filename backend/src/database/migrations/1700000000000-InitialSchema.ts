import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying,
        "google_id" character varying,
        "first_name" character varying,
        "last_name" character varying,
        "avatar" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_email_verified" boolean NOT NULL DEFAULT false,
        "preferences" jsonb,
        "notifications" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_login" TIMESTAMP,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create assets table
    await queryRunner.query(`
      CREATE TYPE "assets_type_enum" AS ENUM('stock', 'fii', 'etf', 'bdr', 'option', 'future', 'crypto', 'fixed_income');

      CREATE TABLE "assets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticker" character varying NOT NULL,
        "name" character varying NOT NULL,
        "type" "assets_type_enum" NOT NULL,
        "sector" character varying,
        "subsector" character varying,
        "segment" character varying,
        "cnpj" character varying,
        "website" character varying,
        "description" text,
        "logo_url" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "listing_date" date,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_assets_ticker" UNIQUE ("ticker"),
        CONSTRAINT "PK_assets" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for assets
    await queryRunner.query(`CREATE INDEX "IDX_assets_ticker" ON "assets" ("ticker")`);
    await queryRunner.query(`CREATE INDEX "IDX_assets_type" ON "assets" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_assets_sector" ON "assets" ("sector")`);

    // Create asset_prices table
    await queryRunner.query(`
      CREATE TABLE "asset_prices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "asset_id" uuid NOT NULL,
        "date" date NOT NULL,
        "open" numeric(18,2) NOT NULL,
        "high" numeric(18,2) NOT NULL,
        "low" numeric(18,2) NOT NULL,
        "close" numeric(18,2) NOT NULL,
        "adjusted_close" numeric(18,2),
        "volume" bigint NOT NULL,
        "market_cap" numeric(18,2),
        "number_of_trades" integer,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_prices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_asset_prices_asset" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for asset_prices
    await queryRunner.query(
      `CREATE INDEX "IDX_asset_prices_asset_date" ON "asset_prices" ("asset_id", "date")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_asset_prices_date" ON "asset_prices" ("date")`);

    // Convert asset_prices to TimescaleDB hypertable
    await queryRunner.query(
      `SELECT create_hypertable('asset_prices', 'date', if_not_exists => TRUE)`,
    );

    // Create fundamental_data table
    await queryRunner.query(`
      CREATE TABLE "fundamental_data" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "asset_id" uuid NOT NULL,
        "reference_date" date NOT NULL,
        "pl" numeric(18,2),
        "pvp" numeric(18,2),
        "psr" numeric(18,2),
        "p_ativos" numeric(18,2),
        "p_capital_giro" numeric(18,2),
        "p_ebit" numeric(18,2),
        "ev_ebit" numeric(18,2),
        "ev_ebitda" numeric(18,2),
        "peg_ratio" numeric(18,2),
        "divida_liquida_patrimonio" numeric(18,2),
        "divida_liquida_ebitda" numeric(18,2),
        "divida_liquida_ebit" numeric(18,2),
        "patrimonio_liquido_ativos" numeric(18,2),
        "passivos_ativos" numeric(18,2),
        "margem_bruta" numeric(18,2),
        "margem_ebit" numeric(18,2),
        "margem_ebitda" numeric(18,2),
        "margem_liquida" numeric(18,2),
        "roe" numeric(18,2),
        "roa" numeric(18,2),
        "roic" numeric(18,2),
        "giro_ativos" numeric(18,2),
        "cagr_receitas_5anos" numeric(18,2),
        "cagr_lucros_5anos" numeric(18,2),
        "dividend_yield" numeric(18,2),
        "payout" numeric(18,2),
        "receita_liquida" numeric(18,2),
        "ebit" numeric(18,2),
        "ebitda" numeric(18,2),
        "lucro_liquido" numeric(18,2),
        "patrimonio_liquido" numeric(18,2),
        "ativo_total" numeric(18,2),
        "divida_bruta" numeric(18,2),
        "divida_liquida" numeric(18,2),
        "disponibilidades" numeric(18,2),
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fundamental_data" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fundamental_data_asset" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_fundamental_data_asset_date" ON "fundamental_data" ("asset_id", "reference_date")`,
    );

    // Create portfolios table
    await queryRunner.query(`
      CREATE TABLE "portfolios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "total_invested" numeric(18,2) NOT NULL DEFAULT 0,
        "current_value" numeric(18,2) NOT NULL DEFAULT 0,
        "profit" numeric(18,2) NOT NULL DEFAULT 0,
        "profit_percentage" numeric(10,4) NOT NULL DEFAULT 0,
        "settings" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolios" PRIMARY KEY ("id"),
        CONSTRAINT "FK_portfolios_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_portfolios_user" ON "portfolios" ("user_id")`);

    // Create portfolio_positions table
    await queryRunner.query(`
      CREATE TABLE "portfolio_positions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "portfolio_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "quantity" numeric(18,8) NOT NULL,
        "average_price" numeric(18,2) NOT NULL,
        "current_price" numeric(18,2),
        "total_invested" numeric(18,2) NOT NULL,
        "current_value" numeric(18,2),
        "profit" numeric(18,2),
        "profit_percentage" numeric(10,4),
        "first_buy_date" date,
        "last_update_date" date,
        "notes" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolio_positions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_portfolio_positions_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_portfolio_positions_asset" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_portfolio_positions_portfolio" ON "portfolio_positions" ("portfolio_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_portfolio_positions_asset" ON "portfolio_positions" ("asset_id")`,
    );

    // Create data_sources table
    await queryRunner.query(`
      CREATE TYPE "data_sources_type_enum" AS ENUM('fundamental', 'technical', 'news', 'options', 'macro', 'insider', 'report', 'ai', 'general');
      CREATE TYPE "data_sources_status_enum" AS ENUM('active', 'inactive', 'maintenance', 'error');

      CREATE TABLE "data_sources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "code" character varying NOT NULL,
        "url" character varying NOT NULL,
        "type" "data_sources_type_enum" NOT NULL,
        "status" "data_sources_status_enum" NOT NULL DEFAULT 'active',
        "description" text,
        "requires_login" boolean NOT NULL DEFAULT false,
        "login_type" character varying,
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_trusted" boolean NOT NULL DEFAULT false,
        "reliability_score" numeric(3,2) NOT NULL DEFAULT 0.5,
        "last_success_at" TIMESTAMP,
        "last_error_at" TIMESTAMP,
        "error_count" integer NOT NULL DEFAULT 0,
        "success_count" integer NOT NULL DEFAULT 0,
        "average_response_time" integer,
        "config" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_data_sources_code" UNIQUE ("code"),
        CONSTRAINT "PK_data_sources" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_data_sources_type" ON "data_sources" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_data_sources_status" ON "data_sources" ("status")`);

    // Create scraped_data table
    await queryRunner.query(`
      CREATE TABLE "scraped_data" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "asset_id" uuid NOT NULL,
        "data_source_id" uuid NOT NULL,
        "data_type" character varying NOT NULL,
        "data" jsonb NOT NULL,
        "reference_date" date,
        "scraped_at" TIMESTAMP NOT NULL,
        "response_time" integer,
        "is_valid" boolean NOT NULL DEFAULT true,
        "validation_errors" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scraped_data" PRIMARY KEY ("id"),
        CONSTRAINT "FK_scraped_data_asset" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_scraped_data_data_source" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_scraped_data_asset_source_type_date" ON "scraped_data" ("asset_id", "data_source_id", "data_type", "scraped_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_scraped_data_source" ON "scraped_data" ("data_source_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_scraped_data_scraped_at" ON "scraped_data" ("scraped_at")`,
    );

    // Create analyses table
    await queryRunner.query(`
      CREATE TYPE "analyses_type_enum" AS ENUM('fundamental', 'technical', 'macro', 'sentiment', 'correlation', 'options', 'risk', 'complete');
      CREATE TYPE "analyses_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed');
      CREATE TYPE "analyses_recommendation_enum" AS ENUM('strong_buy', 'buy', 'hold', 'sell', 'strong_sell');

      CREATE TABLE "analyses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "asset_id" uuid NOT NULL,
        "user_id" uuid,
        "type" "analyses_type_enum" NOT NULL,
        "status" "analyses_status_enum" NOT NULL DEFAULT 'pending',
        "recommendation" "analyses_recommendation_enum",
        "confidence_score" numeric(3,2),
        "summary" text,
        "analysis" jsonb,
        "indicators" jsonb,
        "risks" jsonb,
        "target_prices" jsonb,
        "data_sources" jsonb,
        "sources_count" integer NOT NULL DEFAULT 0,
        "ai_provider" character varying,
        "error_message" text,
        "processing_time" integer,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        CONSTRAINT "PK_analyses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_analyses_asset" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_analyses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_analyses_asset_type" ON "analyses" ("asset_id", "type")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_analyses_user" ON "analyses" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_analyses_status" ON "analyses" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_analyses_created_at" ON "analyses" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "analyses"`);
    await queryRunner.query(`DROP TYPE "analyses_type_enum"`);
    await queryRunner.query(`DROP TYPE "analyses_status_enum"`);
    await queryRunner.query(`DROP TYPE "analyses_recommendation_enum"`);
    await queryRunner.query(`DROP TABLE "scraped_data"`);
    await queryRunner.query(`DROP TABLE "data_sources"`);
    await queryRunner.query(`DROP TYPE "data_sources_type_enum"`);
    await queryRunner.query(`DROP TYPE "data_sources_status_enum"`);
    await queryRunner.query(`DROP TABLE "portfolio_positions"`);
    await queryRunner.query(`DROP TABLE "portfolios"`);
    await queryRunner.query(`DROP TABLE "fundamental_data"`);
    await queryRunner.query(`DROP TABLE "asset_prices"`);
    await queryRunner.query(`DROP TABLE "assets"`);
    await queryRunner.query(`DROP TYPE "assets_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
