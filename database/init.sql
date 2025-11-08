-- B3 AI Analysis Platform Database Initialization
-- Este arquivo é executado automaticamente na primeira vez que o PostgreSQL inicia

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: The tables will be created automatically by TypeORM migrations
-- This script just ensures the necessary extensions are installed

-- After TypeORM creates the asset_prices table, we'll convert it to a hypertable
-- This will be done in a separate migration file

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'B3 AI Analysis Platform - Database initialized successfully';
END
$$;
