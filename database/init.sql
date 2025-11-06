-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create timescaledb_toolkit extension for advanced analytics
CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;

-- Create pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE invest_db TO invest_user;

-- Note: The tables will be created automatically by TypeORM migrations
-- This script just ensures the necessary extensions are installed

-- After TypeORM creates the asset_prices table, we'll convert it to a hypertable
-- This will be done in a separate migration file
