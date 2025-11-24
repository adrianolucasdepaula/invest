import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'invest_claude',
});

async function createTickerChangesTable() {
  try {
    await dataSource.initialize();
    console.log('✅ Connected to DB');

    console.log('1. Dropping existing table if exists...');
    await dataSource.query(`DROP TABLE IF EXISTS "ticker_changes" CASCADE`);

    console.log('2. Creating ticker_changes table...');
    await dataSource.query(`
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

    console.log('3. Creating indexes...');
    await dataSource.query(`
      CREATE UNIQUE INDEX "IDX_ticker_changes_old_new_v2" ON "ticker_changes" ("old_ticker", "new_ticker")
    `);
    await dataSource.query(`
      CREATE INDEX "IDX_ticker_changes_old_v2" ON "ticker_changes" ("old_ticker")
    `);
    await dataSource.query(`
      CREATE INDEX "IDX_ticker_changes_new_v2" ON "ticker_changes" ("new_ticker")
    `);

    console.log('4. Seeding initial data...');
    await dataSource.query(`
      INSERT INTO "ticker_changes" ("old_ticker", "new_ticker", "change_date", "reason", "ratio")
      VALUES ('ELET3', 'AXIA3', '2024-08-01', 'Rebranding', 1.0)
    `);
    await dataSource.query(`
      INSERT INTO "ticker_changes" ("old_ticker", "new_ticker", "change_date", "reason", "ratio")
      VALUES ('ARZZ3', 'AZZA3', '2024-06-15', 'Merger', 1.0)
    `);

    console.log('5. Registering migration...');
    await dataSource.query(`
      INSERT INTO "migrations" ("timestamp", "name")
      VALUES (1763800000000, 'CreateTickerChanges1763800000000')
    `);

    console.log(
      '✅ Table created, indexes added, data seeded, and migration registered successfully!',
    );

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

createTickerChangesTable();
