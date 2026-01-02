import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FASE 75: AI Sentiment Multi-Provider
 *
 * Esta migração cria as tabelas para o sistema de análise de sentimento:
 * - news: Notícias coletadas de 7 fontes
 * - news_analysis: Análises individuais por AI provider (6 providers)
 * - sentiment_consensus: Resultado consolidado após cross-validation
 * - economic_events: Calendário econômico (FASE 75.7)
 *
 * Fontes de Notícias:
 * - Google News, InfoMoney, Valor Econômico, Estadão, Exame, Bloomberg, Investing.com
 *
 * AI Providers (modelos Dez/2025):
 * - ChatGPT (GPT-5), Claude (Sonnet 4.5), Gemini (2.5 Pro)
 * - DeepSeek (V3.2), Grok (4.1), Perplexity (Sonar Pro)
 */
export class CreateNewsSentimentTables1765000000000 implements MigrationInterface {
  name = 'CreateNewsSentimentTables1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar enum types para News
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'news_source_enum') THEN
          CREATE TYPE news_source_enum AS ENUM (
            'google_news', 'infomoney', 'valor_economico', 'estadao',
            'exame', 'bloomberg', 'investing', 'rss', 'other'
          );
        END IF;
      END
      $$;
    `);

    // 2. Criar enum types para NewsAnalysis
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_provider_enum') THEN
          CREATE TYPE ai_provider_enum AS ENUM (
            'chatgpt', 'claude', 'gemini', 'deepseek', 'grok', 'perplexity'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'news_analysis_status_enum') THEN
          CREATE TYPE news_analysis_status_enum AS ENUM (
            'pending', 'processing', 'completed', 'failed', 'timeout'
          );
        END IF;
      END
      $$;
    `);

    // 3. Criar enum types para SentimentConsensus
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment_label_enum') THEN
          CREATE TYPE sentiment_label_enum AS ENUM (
            'very_bullish', 'bullish', 'slightly_bullish', 'neutral',
            'slightly_bearish', 'bearish', 'very_bearish'
          );
        END IF;
      END
      $$;
    `);

    // 4. Criar enum types para EconomicEvent
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_importance_enum') THEN
          CREATE TYPE event_importance_enum AS ENUM ('low', 'medium', 'high');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_category_enum') THEN
          CREATE TYPE event_category_enum AS ENUM (
            'interest_rate', 'inflation', 'employment', 'gdp', 'trade',
            'consumer', 'manufacturing', 'housing', 'central_bank', 'other'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_source_enum') THEN
          CREATE TYPE event_source_enum AS ENUM (
            'investing', 'fred', 'bcb', 'anbima', 'ibge', 'other'
          );
        END IF;
      END
      $$;
    `);

    // 5. Criar tabela news
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
        ticker VARCHAR(20) NOT NULL,
        title VARCHAR(500) NOT NULL,
        summary TEXT,
        content TEXT,
        url VARCHAR(2000) NOT NULL UNIQUE,
        source news_source_enum NOT NULL DEFAULT 'other',
        source_name VARCHAR(100),
        author VARCHAR(200),
        image_url VARCHAR(2000),
        published_at TIMESTAMPTZ NOT NULL,
        collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_analyzed BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Criar índices para news
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_news_ticker ON news(ticker);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_news_source ON news(source);`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_news_is_analyzed ON news(is_analyzed);`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_news_asset_id ON news(asset_id);`);

    // 7. Criar tabela news_analysis
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS news_analysis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
        provider ai_provider_enum NOT NULL,
        model_version VARCHAR(50),
        status news_analysis_status_enum NOT NULL DEFAULT 'pending',
        sentiment_score DECIMAL(5, 4),
        confidence DECIMAL(5, 4),
        analysis_text TEXT,
        key_factors JSONB,
        raw_response JSONB,
        processing_time INTEGER,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ,
        CONSTRAINT uq_news_provider UNIQUE (news_id, provider)
      );
    `);

    // 8. Criar índices para news_analysis
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_news_analysis_news_id ON news_analysis(news_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_news_analysis_provider ON news_analysis(provider);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_news_analysis_status ON news_analysis(status);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_news_analysis_created_at ON news_analysis(created_at DESC);`,
    );

    // 9. Criar tabela sentiment_consensus
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sentiment_consensus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        news_id UUID NOT NULL UNIQUE REFERENCES news(id) ON DELETE CASCADE,
        final_sentiment DECIMAL(5, 4) NOT NULL,
        sentiment_label sentiment_label_enum NOT NULL,
        confidence_score DECIMAL(5, 4) NOT NULL,
        providers_count INTEGER NOT NULL,
        agreement_count INTEGER NOT NULL,
        outliers_count INTEGER NOT NULL DEFAULT 0,
        consensus_details JSONB NOT NULL,
        is_high_confidence BOOLEAN NOT NULL DEFAULT FALSE,
        processing_time INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Criar índices para sentiment_consensus
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sentiment_consensus_news_id ON sentiment_consensus(news_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sentiment_consensus_final_sentiment ON sentiment_consensus(final_sentiment);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sentiment_consensus_label ON sentiment_consensus(sentiment_label);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sentiment_consensus_created_at ON sentiment_consensus(created_at DESC);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sentiment_consensus_high_confidence ON sentiment_consensus(is_high_confidence);`,
    );

    // 11. Criar tabela economic_events
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS economic_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(500) NOT NULL,
        name_en VARCHAR(500),
        country CHAR(3) NOT NULL,
        importance event_importance_enum NOT NULL DEFAULT 'medium',
        category event_category_enum NOT NULL DEFAULT 'other',
        event_date TIMESTAMPTZ NOT NULL,
        is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
        actual DECIMAL(15, 4),
        forecast DECIMAL(15, 4),
        previous DECIMAL(15, 4),
        unit VARCHAR(20),
        impact_direction VARCHAR(10),
        source event_source_enum NOT NULL DEFAULT 'other',
        source_id VARCHAR(100),
        source_url VARCHAR(2000),
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12. Criar índices para economic_events
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_economic_events_date ON economic_events(event_date);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_economic_events_country ON economic_events(country);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_economic_events_importance ON economic_events(importance);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_economic_events_category ON economic_events(category);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_economic_events_country_date ON economic_events(country, event_date);`,
    );

    // 13. Criar trigger para updated_at em sentiment_consensus
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_sentiment_consensus_updated_at ON sentiment_consensus;
      CREATE TRIGGER update_sentiment_consensus_updated_at
        BEFORE UPDATE ON sentiment_consensus
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_economic_events_updated_at ON economic_events;
      CREATE TRIGGER update_economic_events_updated_at
        BEFORE UPDATE ON economic_events
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_sentiment_consensus_updated_at ON sentiment_consensus;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_economic_events_updated_at ON economic_events;`,
    );

    // Drop tables (in reverse order due to foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS economic_events;`);
    await queryRunner.query(`DROP TABLE IF EXISTS sentiment_consensus;`);
    await queryRunner.query(`DROP TABLE IF EXISTS news_analysis;`);
    await queryRunner.query(`DROP TABLE IF EXISTS news;`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS event_source_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS event_category_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS event_importance_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS sentiment_label_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS news_analysis_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ai_provider_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS news_source_enum;`);
  }
}
