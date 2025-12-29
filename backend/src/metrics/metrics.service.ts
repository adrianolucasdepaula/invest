import { Injectable, OnModuleInit } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: promClient.Registry;

  // Custom metrics
  private readonly httpRequestsTotal: promClient.Counter<string>;
  private readonly httpRequestDuration: promClient.Histogram<string>;
  private readonly activeConnections: promClient.Gauge<string>;
  private readonly scraperExecutions: promClient.Counter<string>;
  private readonly scraperDuration: promClient.Histogram<string>;
  private readonly queueJobsTotal: promClient.Counter<string>;
  private readonly queueJobsActive: promClient.Gauge<string>;
  private readonly databaseQueryDuration: promClient.Histogram<string>;
  private readonly cacheOperations: promClient.Counter<string>;
  private readonly assetsTotal: promClient.Gauge<string>;
  private readonly pricesTotal: promClient.Gauge<string>;

  // FASE 117: Circuit Breaker metrics
  private readonly circuitBreakerState: promClient.Gauge<string>;
  private readonly circuitBreakerFailures: promClient.Counter<string>;

  // FASE 117: Dead Letter Queue metrics
  private readonly deadLetterJobsTotal: promClient.Gauge<string>;
  private readonly deadLetterJobsProcessed: promClient.Counter<string>;

  // FASE 145: Data Cleanup metrics
  private readonly cleanupRecordsDeleted: promClient.Counter<string>;
  private readonly cleanupJobDuration: promClient.Histogram<string>;
  private readonly cleanupJobResult: promClient.Counter<string>;

  constructor() {
    // Create a new registry
    this.registry = new promClient.Registry();

    // Add default Node.js metrics (memory, CPU, event loop, etc.)
    promClient.collectDefaultMetrics({
      register: this.registry,
      prefix: 'invest_',
    });

    // HTTP Request metrics
    this.httpRequestsTotal = new promClient.Counter({
      name: 'invest_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'invest_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.activeConnections = new promClient.Gauge({
      name: 'invest_active_connections',
      help: 'Number of active HTTP connections',
      registers: [this.registry],
    });

    // Scraper metrics
    this.scraperExecutions = new promClient.Counter({
      name: 'invest_scraper_executions_total',
      help: 'Total number of scraper executions',
      labelNames: ['scraper', 'status'],
      registers: [this.registry],
    });

    this.scraperDuration = new promClient.Histogram({
      name: 'invest_scraper_duration_seconds',
      help: 'Duration of scraper executions in seconds',
      labelNames: ['scraper'],
      buckets: [1, 5, 10, 30, 60, 120, 300],
      registers: [this.registry],
    });

    // Queue metrics
    this.queueJobsTotal = new promClient.Counter({
      name: 'invest_queue_jobs_total',
      help: 'Total number of queue jobs processed',
      labelNames: ['queue', 'status'],
      registers: [this.registry],
    });

    this.queueJobsActive = new promClient.Gauge({
      name: 'invest_queue_jobs_active',
      help: 'Number of active jobs in queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    // Database metrics
    this.databaseQueryDuration = new promClient.Histogram({
      name: 'invest_database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    // Cache metrics
    this.cacheOperations = new promClient.Counter({
      name: 'invest_cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'result'],
      registers: [this.registry],
    });

    // Business metrics
    this.assetsTotal = new promClient.Gauge({
      name: 'invest_assets_total',
      help: 'Total number of assets in the system',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.pricesTotal = new promClient.Gauge({
      name: 'invest_prices_total',
      help: 'Total number of price records in the system',
      registers: [this.registry],
    });

    // FASE 117: Circuit Breaker metrics
    this.circuitBreakerState = new promClient.Gauge({
      name: 'invest_circuit_breaker_state',
      help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
      labelNames: ['scraper'],
      registers: [this.registry],
    });

    this.circuitBreakerFailures = new promClient.Counter({
      name: 'invest_circuit_breaker_failures_total',
      help: 'Total number of circuit breaker failures',
      labelNames: ['scraper'],
      registers: [this.registry],
    });

    // FASE 117: Dead Letter Queue metrics
    this.deadLetterJobsTotal = new promClient.Gauge({
      name: 'invest_dead_letter_jobs_total',
      help: 'Total number of jobs in dead letter queue',
      labelNames: ['status', 'original_queue'],
      registers: [this.registry],
    });

    this.deadLetterJobsProcessed = new promClient.Counter({
      name: 'invest_dead_letter_jobs_processed_total',
      help: 'Total number of dead letter jobs processed (retried or cleared)',
      labelNames: ['action'],
      registers: [this.registry],
    });

    // FASE 145: Data Cleanup metrics
    this.cleanupRecordsDeleted = new promClient.Counter({
      name: 'invest_cleanup_records_deleted_total',
      help: 'Total number of records deleted by cleanup jobs',
      labelNames: ['entity'],
      registers: [this.registry],
    });

    this.cleanupJobDuration = new promClient.Histogram({
      name: 'invest_cleanup_job_duration_seconds',
      help: 'Duration of cleanup jobs in seconds',
      labelNames: ['entity'],
      buckets: [1, 5, 10, 30, 60, 120, 300, 600],
      registers: [this.registry],
    });

    this.cleanupJobResult = new promClient.Counter({
      name: 'invest_cleanup_job_result_total',
      help: 'Result of cleanup jobs (success, failure, partial_failure)',
      labelNames: ['entity', 'result'],
      registers: [this.registry],
    });
  }

  async onModuleInit() {
    // Initialize with some default values
    this.activeConnections.set(0);
  }

  /**
   * Get all metrics in Prometheus text format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get content type for Prometheus metrics
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  // HTTP Metrics methods
  incrementHttpRequests(method: string, path: string, statusCode: number): void {
    this.httpRequestsTotal.inc({
      method,
      path: this.normalizePath(path),
      status_code: statusCode.toString(),
    });
  }

  observeHttpDuration(
    method: string,
    path: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    this.httpRequestDuration.observe(
      {
        method,
        path: this.normalizePath(path),
        status_code: statusCode.toString(),
      },
      durationSeconds,
    );
  }

  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  incrementActiveConnections(): void {
    this.activeConnections.inc();
  }

  decrementActiveConnections(): void {
    this.activeConnections.dec();
  }

  // Scraper Metrics methods
  incrementScraperExecution(scraper: string, status: 'success' | 'failure'): void {
    this.scraperExecutions.inc({ scraper, status });
  }

  observeScraperDuration(scraper: string, durationSeconds: number): void {
    this.scraperDuration.observe({ scraper }, durationSeconds);
  }

  // Queue Metrics methods
  incrementQueueJob(queue: string, status: 'completed' | 'failed'): void {
    this.queueJobsTotal.inc({ queue, status });
  }

  setActiveQueueJobs(queue: string, count: number): void {
    this.queueJobsActive.set({ queue }, count);
  }

  // Database Metrics methods
  observeDatabaseQuery(
    operation: string,
    table: string,
    durationSeconds: number,
  ): void {
    this.databaseQueryDuration.observe({ operation, table }, durationSeconds);
  }

  // Cache Metrics methods
  incrementCacheHit(): void {
    this.cacheOperations.inc({ operation: 'get', result: 'hit' });
  }

  incrementCacheMiss(): void {
    this.cacheOperations.inc({ operation: 'get', result: 'miss' });
  }

  incrementCacheSet(): void {
    this.cacheOperations.inc({ operation: 'set', result: 'success' });
  }

  // Business Metrics methods
  setAssetsCount(type: string, count: number): void {
    this.assetsTotal.set({ type }, count);
  }

  setPricesCount(count: number): void {
    this.pricesTotal.set(count);
  }

  // FASE 117: Circuit Breaker Metrics methods
  setCircuitBreakerState(scraper: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.circuitBreakerState.set({ scraper }, stateValue);
  }

  incrementCircuitBreakerFailure(scraper: string): void {
    this.circuitBreakerFailures.inc({ scraper });
  }

  // FASE 117: Dead Letter Queue Metrics methods
  setDeadLetterJobsCount(status: 'waiting' | 'completed' | 'failed', originalQueue: string, count: number): void {
    this.deadLetterJobsTotal.set({ status, original_queue: originalQueue }, count);
  }

  incrementDeadLetterProcessed(action: 'retried' | 'cleared'): void {
    this.deadLetterJobsProcessed.inc({ action });
  }

  // FASE 145: Data Cleanup Metrics methods
  recordCleanup(entity: string, count: number): void {
    this.cleanupRecordsDeleted.inc({ entity }, count);
  }

  recordCleanupDuration(entity: string, durationSeconds: number): void {
    this.cleanupJobDuration.observe({ entity }, durationSeconds);
  }

  recordCleanupResult(entity: string, result: 'success' | 'failure' | 'partial_failure'): void {
    this.cleanupJobResult.inc({ entity, result });
  }

  /**
   * Normalize path to prevent high cardinality
   * e.g., /api/v1/assets/PETR4 -> /api/v1/assets/:ticker
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/api\/v1\/assets\/[A-Z0-9]+/g, '/api/v1/assets/:ticker')
      .replace(/\/api\/v1\/portfolios\/[0-9a-f-]+/g, '/api/v1/portfolios/:id')
      .replace(/\/api\/v1\/analysis\/[0-9a-f-]+/g, '/api/v1/analysis/:id')
      .replace(/\/api\/v1\/market-data\/[A-Z0-9]+/g, '/api/v1/market-data/:ticker')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:uuid');
  }
}
