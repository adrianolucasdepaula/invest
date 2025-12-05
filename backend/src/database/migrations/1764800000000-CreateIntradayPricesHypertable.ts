import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FASE 67: TimescaleDB + Dados Intraday
 *
 * Esta migração cria a tabela intraday_prices como uma TimescaleDB Hypertable
 * para suportar dados de alta frequência (1m, 5m, 15m, 30m, 1h, 4h).
 *
 * Benefícios do TimescaleDB:
 * - Particionamento automático por tempo (chunks)
 * - Compressão nativa (~10x redução de espaço)
 * - Continuous Aggregates para pré-calcular timeframes maiores
 * - Retenção automática de dados antigos
 * - Query performance otimizada para séries temporais
 */
export class CreateIntradayPricesHypertable1764800000000 implements MigrationInterface {
  name = 'CreateIntradayPricesHypertable1764800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar enum types
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intraday_timeframe_enum') THEN
          CREATE TYPE intraday_timeframe_enum AS ENUM ('1m', '5m', '15m', '30m', '1h', '4h');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intraday_source_enum') THEN
          CREATE TYPE intraday_source_enum AS ENUM ('yahoo', 'brapi', 'tradingview', 'b3');
        END IF;
      END
      $$;
    `);

    // 2. Criar tabela intraday_prices
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS intraday_prices (
        asset_id UUID NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        timeframe intraday_timeframe_enum NOT NULL,
        open DECIMAL(18, 4) NOT NULL,
        high DECIMAL(18, 4) NOT NULL,
        low DECIMAL(18, 4) NOT NULL,
        close DECIMAL(18, 4) NOT NULL,
        volume BIGINT NOT NULL,
        volume_financial DECIMAL(18, 2),
        number_of_trades INTEGER,
        vwap DECIMAL(18, 4),
        source intraday_source_enum NOT NULL,
        collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (asset_id, timestamp, timeframe)
      );
    `);

    // 3. Converter para Hypertable (particionamento por timestamp)
    // chunk_time_interval: 1 dia (ideal para dados intraday)
    await queryRunner.query(`
      SELECT create_hypertable(
        'intraday_prices',
        'timestamp',
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE
      );
    `);

    // 4. Criar índices para performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_intraday_asset_time
      ON intraday_prices (asset_id, timestamp DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_intraday_timeframe
      ON intraday_prices (timeframe, timestamp DESC);
    `);

    // 5. Criar Continuous Aggregates para timeframes maiores
    // Aggregate: 1 hora a partir de dados de 1 minuto
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS intraday_1h
      WITH (timescaledb.continuous) AS
      SELECT
        asset_id,
        time_bucket('1 hour', timestamp) AS bucket,
        first(open, timestamp) AS open,
        max(high) AS high,
        min(low) AS low,
        last(close, timestamp) AS close,
        sum(volume) AS volume,
        sum(volume_financial) AS volume_financial,
        sum(number_of_trades) AS number_of_trades,
        '1h'::intraday_timeframe_enum AS timeframe
      FROM intraday_prices
      WHERE timeframe = '1m'
      GROUP BY asset_id, bucket
      WITH NO DATA;
    `);

    // Aggregate: 4 horas a partir de dados de 1 hora
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS intraday_4h
      WITH (timescaledb.continuous) AS
      SELECT
        asset_id,
        time_bucket('4 hours', timestamp) AS bucket,
        first(open, timestamp) AS open,
        max(high) AS high,
        min(low) AS low,
        last(close, timestamp) AS close,
        sum(volume) AS volume,
        sum(volume_financial) AS volume_financial,
        sum(number_of_trades) AS number_of_trades,
        '4h'::intraday_timeframe_enum AS timeframe
      FROM intraday_prices
      WHERE timeframe = '1m'
      GROUP BY asset_id, bucket
      WITH NO DATA;
    `);

    // Aggregate: Diário a partir de dados de 1 minuto (para comparação com asset_prices)
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS intraday_1d
      WITH (timescaledb.continuous) AS
      SELECT
        asset_id,
        time_bucket('1 day', timestamp) AS bucket,
        first(open, timestamp) AS open,
        max(high) AS high,
        min(low) AS low,
        last(close, timestamp) AS close,
        sum(volume) AS volume,
        sum(volume_financial) AS volume_financial,
        sum(number_of_trades) AS number_of_trades
      FROM intraday_prices
      WHERE timeframe = '1m'
      GROUP BY asset_id, bucket
      WITH NO DATA;
    `);

    // 6. Configurar refresh policies para continuous aggregates
    // Refresh a cada 1 hora, mantendo dados dos últimos 7 dias
    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy('intraday_1h',
        start_offset => INTERVAL '7 days',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour',
        if_not_exists => TRUE
      );
    `);

    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy('intraday_4h',
        start_offset => INTERVAL '14 days',
        end_offset => INTERVAL '4 hours',
        schedule_interval => INTERVAL '4 hours',
        if_not_exists => TRUE
      );
    `);

    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy('intraday_1d',
        start_offset => INTERVAL '30 days',
        end_offset => INTERVAL '1 day',
        schedule_interval => INTERVAL '1 day',
        if_not_exists => TRUE
      );
    `);

    // 7. Configurar compressão para dados mais antigos (após 7 dias)
    await queryRunner.query(`
      ALTER TABLE intraday_prices SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'asset_id, timeframe'
      );
    `);

    await queryRunner.query(`
      SELECT add_compression_policy('intraday_prices',
        INTERVAL '7 days',
        if_not_exists => TRUE
      );
    `);

    // 8. Configurar retenção de dados (manter 90 dias de dados granulares)
    await queryRunner.query(`
      SELECT add_retention_policy('intraday_prices',
        INTERVAL '90 days',
        if_not_exists => TRUE
      );
    `);

    // 9. Foreign key para assets (verificação loose devido ao particionamento)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_intraday_asset'
        ) THEN
          ALTER TABLE intraday_prices
          ADD CONSTRAINT fk_intraday_asset
          FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover policies
    await queryRunner.query(`
      SELECT remove_retention_policy('intraday_prices', if_exists => TRUE);
    `);

    await queryRunner.query(`
      SELECT remove_compression_policy('intraday_prices', if_exists => TRUE);
    `);

    // Remover continuous aggregates
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS intraday_1d CASCADE;`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS intraday_4h CASCADE;`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS intraday_1h CASCADE;`);

    // Remover tabela (hypertable)
    await queryRunner.query(`DROP TABLE IF EXISTS intraday_prices CASCADE;`);

    // Remover enum types
    await queryRunner.query(`DROP TYPE IF EXISTS intraday_source_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS intraday_timeframe_enum;`);
  }
}
