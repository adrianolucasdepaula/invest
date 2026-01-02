import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DataSourcesService } from './data-sources.service';
import { CircuitBreakerService } from '../../scrapers/circuit-breaker.service';
import { DeadLetterService } from '../../queue/jobs/dead-letter.service';

/**
 * FASE 117: Data Sources Controller with Health Check Endpoints
 *
 * Provides monitoring endpoints for:
 * - Data sources status
 * - Circuit breaker states
 * - Dead letter queue statistics
 */
@ApiTags('data-sources')
@Controller('data-sources')
export class DataSourcesController {
  private readonly logger = new Logger(DataSourcesController.name);

  constructor(
    private readonly dataSourcesService: DataSourcesService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly deadLetterService: DeadLetterService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all data sources' })
  async getAllDataSources() {
    return this.dataSourcesService.findAll();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get data sources status' })
  async getDataSourcesStatus() {
    return this.dataSourcesService.getStatus();
  }

  // ==================== HEALTH CHECK ENDPOINTS ====================

  @Get('health')
  @ApiOperation({ summary: 'Get overall health status of data collection system' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getOverallHealth() {
    const [circuitBreakers, deadLetterStats] = await Promise.all([
      this.circuitBreakerService.getAllStates(),
      this.deadLetterService.getStats(),
    ]);

    const openCircuits = circuitBreakers.filter((cb) => cb.state === 'OPEN');
    const isHealthy = openCircuits.length === 0 && deadLetterStats.waiting < 10;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      circuitBreakers: {
        total: circuitBreakers.length,
        open: openCircuits.length,
        circuits: circuitBreakers,
      },
      deadLetterQueue: {
        waiting: deadLetterStats.waiting,
        completed: deadLetterStats.completed,
        failed: deadLetterStats.failed,
        byOriginalQueue: deadLetterStats.byOriginalQueue,
      },
      thresholds: {
        maxOpenCircuits: 0,
        maxDeadLetterWaiting: 10,
      },
    };
  }

  @Get('health/circuit-breakers')
  @ApiOperation({ summary: 'Get circuit breaker states for all scrapers' })
  @ApiResponse({ status: 200, description: 'Circuit breaker states retrieved successfully' })
  async getCircuitBreakerStates() {
    const states = this.circuitBreakerService.getAllStates();

    this.logger.log(`[HEALTH] Circuit breaker states queried: ${states.length} circuits`);

    return {
      timestamp: new Date().toISOString(),
      totalCircuits: states.length,
      summary: {
        closed: states.filter((s) => s.state === 'CLOSED').length,
        open: states.filter((s) => s.state === 'OPEN').length,
        halfOpen: states.filter((s) => s.state === 'HALF_OPEN').length,
      },
      circuits: states.map((s) => ({
        ...s,
        lastFailureAgo: s.lastFailure
          ? `${Math.round((Date.now() - s.lastFailure) / 1000)}s ago`
          : 'never',
      })),
    };
  }

  @Post('health/circuit-breakers/:key/reset')
  @ApiOperation({ summary: 'Reset a specific circuit breaker' })
  @ApiParam({ name: 'key', description: 'Circuit breaker key (scraper name)' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reset successfully' })
  async resetCircuitBreaker(@Param('key') key: string) {
    this.circuitBreakerService.reset(key);

    this.logger.log(`[HEALTH] Circuit breaker manually reset: ${key}`);

    return {
      success: true,
      message: `Circuit breaker '${key}' reset to CLOSED state`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('health/circuit-breakers/reset-all')
  @ApiOperation({ summary: 'Reset all circuit breakers' })
  @ApiResponse({ status: 200, description: 'All circuit breakers reset successfully' })
  async resetAllCircuitBreakers() {
    this.circuitBreakerService.resetAll();

    this.logger.log(`[HEALTH] All circuit breakers manually reset`);

    return {
      success: true,
      message: 'All circuit breakers reset to CLOSED state',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/dead-letter')
  @ApiOperation({ summary: 'Get dead letter queue statistics' })
  @ApiResponse({ status: 200, description: 'Dead letter queue stats retrieved successfully' })
  async getDeadLetterStats() {
    const stats = await this.deadLetterService.getStats();

    this.logger.log(
      `[HEALTH] Dead letter queue stats: ${stats.waiting} waiting, ${stats.failed} failed`,
    );

    return {
      timestamp: new Date().toISOString(),
      ...stats,
      alertLevel: stats.waiting > 10 ? 'warning' : stats.waiting > 50 ? 'critical' : 'normal',
    };
  }

  @Post('health/dead-letter/:queueName/retry-all')
  @ApiOperation({ summary: 'Retry all dead letter jobs from a specific original queue' })
  @ApiParam({ name: 'queueName', description: 'Original queue name (scraping, analysis, etc.)' })
  @ApiResponse({ status: 200, description: 'Jobs retried successfully' })
  async retryDeadLetterJobs(@Param('queueName') queueName: string) {
    const result = await this.deadLetterService.retryAllFromQueue(queueName);

    this.logger.log(
      `[HEALTH] Dead letter retry for ${queueName}: ${result.retried} retried, ${result.failed} failed`,
    );

    return {
      success: true,
      queueName,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('health/dead-letter/clear-completed')
  @ApiOperation({ summary: 'Clear completed dead letter jobs' })
  @ApiResponse({ status: 200, description: 'Completed jobs cleared successfully' })
  async clearCompletedDeadLetterJobs() {
    const cleared = await this.deadLetterService.clearCompleted();

    this.logger.log(`[HEALTH] Cleared ${cleared} completed dead letter jobs`);

    return {
      success: true,
      cleared,
      timestamp: new Date().toISOString(),
    };
  }
}
