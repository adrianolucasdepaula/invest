-- Migration: Create Job Scheduling Tables
-- Description: Creates tables for job scheduling and execution tracking
-- Date: 2025-11-07

-- Schedule executions table
-- Tracks when scheduled jobs were executed
CREATE TABLE IF NOT EXISTS schedule_executions (
    id SERIAL PRIMARY KEY,
    schedule_name VARCHAR(255) NOT NULL,
    scraper_name VARCHAR(255) NOT NULL,
    tickers TEXT NOT NULL,  -- JSON array of tickers
    job_ids TEXT NOT NULL,  -- JSON array of job IDs created
    executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    INDEX idx_schedule_name (schedule_name),
    INDEX idx_scraper_name (scraper_name),
    INDEX idx_executed_at (executed_at)
);

-- Scraper results table
-- Stores results from scraper job executions
CREATE TABLE IF NOT EXISTS scraper_results (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL UNIQUE,  -- UUID
    scraper_name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB,  -- Scraped data
    error TEXT,  -- Error message if failed
    response_time FLOAT,  -- Execution time in seconds
    executed_at TIMESTAMP NOT NULL,
    metadata JSONB,  -- Additional metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    INDEX idx_job_id (job_id),
    INDEX idx_scraper_name (scraper_name),
    INDEX idx_ticker (ticker),
    INDEX idx_success (success),
    INDEX idx_executed_at (executed_at)
);

-- Create index on JSONB data for faster queries
CREATE INDEX IF NOT EXISTS idx_scraper_results_data ON scraper_results USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_scraper_results_metadata ON scraper_results USING GIN (metadata);

-- Add comments
COMMENT ON TABLE schedule_executions IS 'Tracks scheduled job executions';
COMMENT ON TABLE scraper_results IS 'Stores scraper job execution results';

COMMENT ON COLUMN schedule_executions.schedule_name IS 'Name of the schedule from config';
COMMENT ON COLUMN schedule_executions.scraper_name IS 'Name of the scraper executed';
COMMENT ON COLUMN schedule_executions.tickers IS 'JSON array of tickers processed';
COMMENT ON COLUMN schedule_executions.job_ids IS 'JSON array of job IDs created';

COMMENT ON COLUMN scraper_results.job_id IS 'Unique job identifier (UUID)';
COMMENT ON COLUMN scraper_results.scraper_name IS 'Name of the scraper that executed';
COMMENT ON COLUMN scraper_results.ticker IS 'Stock ticker symbol';
COMMENT ON COLUMN scraper_results.success IS 'Whether the scrape was successful';
COMMENT ON COLUMN scraper_results.data IS 'Scraped data in JSON format';
COMMENT ON COLUMN scraper_results.error IS 'Error message if scrape failed';
COMMENT ON COLUMN scraper_results.response_time IS 'Execution time in seconds';
COMMENT ON COLUMN scraper_results.metadata IS 'Additional job metadata in JSON format';
