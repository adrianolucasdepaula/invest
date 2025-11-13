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
  lastSync: Date | null;
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
    const metric = this.scraperMetricsRepository.create({
      scraperId,
      operationType,
      ticker,
      success,
      responseTime,
      errorMessage,
    });

    const saved = await this.scraperMetricsRepository.save(metric);
    this.logger.log(
      `Metric saved: ${scraperId} ${operationType} ${ticker || 'general'} - ${success ? 'SUCCESS' : 'FAIL'} (${responseTime}ms)`,
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
        lastSync: null,
      };
    }

    // Calculate statistics
    const totalRequests = metrics.length;
    const successful = metrics.filter((m) => m.success).length;
    const failedRequests = totalRequests - successful;
    const successRate = (successful / totalRequests) * 100;

    // Calculate average response time (only successful requests)
    const successfulMetrics = metrics.filter((m) => m.success && m.responseTime !== null);
    const avgResponseTime =
      successfulMetrics.length > 0
        ? successfulMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / successfulMetrics.length
        : 0;

    // Get last test and last sync
    const lastTest = metrics.find((m) => m.operationType === 'test')?.createdAt || null;
    const lastSync = metrics.find((m) => m.operationType === 'sync')?.createdAt || null;

    return {
      scraperId,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      totalRequests,
      failedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      lastTest,
      lastSync,
    };
  }

  /**
   * Get metrics summaries for all scrapers
   */
  async getAllMetricsSummaries(): Promise<Map<string, ScraperMetricsSummary>> {
    const scraperIds = [
      'fundamentus',
      'brapi',
      'statusinvest',
      'investidor10',
      'fundamentei',
      'investsite',
    ];

    const summaries = new Map<string, ScraperMetricsSummary>();

    await Promise.all(
      scraperIds.map(async (scraperId) => {
        const summary = await this.getMetricsSummary(scraperId);
        summaries.set(scraperId, summary);
      }),
    );

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
