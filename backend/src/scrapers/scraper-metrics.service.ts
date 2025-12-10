import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScraperMetric } from '@database/entities';

export interface ScraperMetricsSummary {
  scraperId: string;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  lastTest: Date | null;
  lastTestSuccess: boolean | null; // FASE 90: resultado do último teste
  lastSync: Date | null;
  lastSyncSuccess: boolean | null; // FASE 90: resultado do último sync
  lastErrorMessage: string | null; // FASE 90: última mensagem de erro
}

@Injectable()
export class ScraperMetricsService {
  private readonly logger = new Logger(ScraperMetricsService.name);

  constructor(
    @InjectRepository(ScraperMetric)
    private scraperMetricsRepository: Repository<ScraperMetric>,
  ) {}

  /**
   * Save a metric record for a scraper operation
   */
  async saveMetric(
    scraperId: string,
    operationType: 'test' | 'sync',
    ticker: string | null,
    success: boolean,
    responseTime: number | null,
    errorMessage: string | null = null,
  ): Promise<ScraperMetric> {
    // Validate responseTime - should not be negative
    const validResponseTime = responseTime !== null && responseTime < 0 ? null : responseTime;

    if (responseTime !== null && responseTime < 0) {
      this.logger.warn(
        `Invalid negative response time (${responseTime}ms) for ${scraperId} - setting to null`,
      );
    }

    const metric = this.scraperMetricsRepository.create({
      scraperId,
      operationType,
      ticker,
      success,
      responseTime: validResponseTime,
      errorMessage,
    });

    const saved = await this.scraperMetricsRepository.save(metric);
    this.logger.log(
      `Metric saved: ${scraperId} ${operationType} ${ticker || 'general'} - ${success ? 'SUCCESS' : 'FAIL'} (${validResponseTime}ms)`,
    );
    return saved;
  }

  /**
   * Get metrics summary for a specific scraper
   */
  async getMetricsSummary(scraperId: string): Promise<ScraperMetricsSummary> {
    // Get all metrics for this scraper (limit to last 30 days for performance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await this.scraperMetricsRepository
      .createQueryBuilder('metric')
      .where('metric.scraper_id = :scraperId', { scraperId })
      .andWhere('metric.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .orderBy('metric.created_at', 'DESC')
      .getMany();

    if (metrics.length === 0) {
      return {
        scraperId,
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        lastTest: null,
        lastTestSuccess: null,
        lastSync: null,
        lastSyncSuccess: null,
        lastErrorMessage: null,
      };
    }

    // Calculate statistics
    const totalRequests = metrics.length;
    const successful = metrics.filter((m) => m.success).length;
    const failedRequests = totalRequests - successful;
    const successRate = (successful / totalRequests) * 100;

    // Calculate average response time (only successful requests, filter outliers)
    const responseTimes = metrics
      .filter((m) => m.success && m.responseTime !== null)
      .map((m) => m.responseTime)
      .filter((time) => time > 0 && time < 60000) // Filter outliers: must be > 0ms and < 60s
      .sort((a, b) => a - b);

    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
        : 0;

    // Get last test and last sync WITH success status
    const lastTestMetric = metrics.find((m) => m.operationType === 'test');
    const lastSyncMetric = metrics.find((m) => m.operationType === 'sync');

    // Get last error message (from most recent failed operation)
    const lastFailedMetric = metrics.find((m) => !m.success && m.errorMessage);
    const lastErrorMessage = lastFailedMetric?.errorMessage || null;

    return {
      scraperId,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      totalRequests,
      failedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      lastTest: lastTestMetric?.createdAt || null,
      lastTestSuccess: lastTestMetric?.success ?? null,
      lastSync: lastSyncMetric?.createdAt || null,
      lastSyncSuccess: lastSyncMetric?.success ?? null,
      lastErrorMessage,
    };
  }

  /**
   * FASE 90: Get all distinct scraper IDs from the database
   *
   * Descobre DINAMICAMENTE todos os scrapers que já gravaram métricas,
   * eliminando a necessidade de manter uma lista hardcoded.
   */
  async getAllScraperIds(): Promise<string[]> {
    this.logger.debug('[METRICS] Querying all distinct scraper IDs from database');

    try {
      const result = await this.scraperMetricsRepository
        .createQueryBuilder('metric')
        .select('DISTINCT metric.scraper_id', 'scraperId')
        .orderBy('metric.scraper_id', 'ASC')
        .getRawMany();

      const scraperIds = result.map((r) => r.scraperId);

      this.logger.debug(
        `[METRICS] Found ${scraperIds.length} distinct scrapers: ${scraperIds.join(', ')}`,
      );

      return scraperIds;
    } catch (error) {
      this.logger.error(`[METRICS] Failed to get scraper IDs: ${error.message}`);
      // Fallback para lista mínima conhecida em caso de erro
      return [
        'fundamentus',
        'brapi',
        'statusinvest',
        'investidor10',
        'fundamentei',
        'investsite',
        'opcoes',
      ];
    }
  }

  /**
   * Get metrics summaries for ALL scrapers (dynamic discovery)
   *
   * FASE 90: Descobre scrapers dinamicamente do banco,
   * incluindo tanto TypeScript quanto Python scrapers.
   */
  async getAllMetricsSummaries(): Promise<Map<string, ScraperMetricsSummary>> {
    this.logger.log('[METRICS] Fetching metrics for all scrapers (dynamic discovery)');

    // Busca DINÂMICA de todos os scrapers com métricas no banco
    const scraperIds = await this.getAllScraperIds();

    // Se não encontrou nenhum, inclui lista mínima de TypeScript scrapers
    if (scraperIds.length === 0) {
      this.logger.warn('[METRICS] No scraper metrics found in database, using TypeScript defaults');
      scraperIds.push(
        'fundamentus',
        'brapi',
        'statusinvest',
        'investidor10',
        'fundamentei',
        'investsite',
        'opcoes',
      );
    }

    const summaries = new Map<string, ScraperMetricsSummary>();

    // Busca métricas em paralelo para performance
    await Promise.all(
      scraperIds.map(async (scraperId) => {
        const summary = await this.getMetricsSummary(scraperId);
        summaries.set(scraperId, summary);
      }),
    );

    this.logger.log(`[METRICS] Loaded metrics for ${summaries.size} scrapers`);
    return summaries;
  }

  /**
   * Get recent metrics for a scraper (for debugging/display)
   */
  async getRecentMetrics(scraperId: string, limit: number = 10): Promise<ScraperMetric[]> {
    return this.scraperMetricsRepository.find({
      where: { scraperId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Delete old metrics (cleanup job - keep last 90 days)
   */
  async cleanupOldMetrics(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.scraperMetricsRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old metrics (older than ${daysToKeep} days)`);
    return result.affected || 0;
  }
}
