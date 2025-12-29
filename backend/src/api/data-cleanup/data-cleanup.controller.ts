import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DataCleanupService, CleanupStats } from '../../queue/jobs/data-cleanup.service';

/**
 * FASE 145: Data Cleanup Manual Trigger Controller
 *
 * Provides admin endpoints for triggering cleanup jobs manually
 * for testing and debugging purposes.
 *
 * SECURITY: All endpoints require JWT authentication
 */
@Controller('admin/data-cleanup')
@UseGuards(JwtAuthGuard)
export class DataCleanupController {
  constructor(private readonly dataCleanupService: DataCleanupService) {}

  /**
   * Trigger scraped data cleanup manually
   *
   * @returns Cleanup result with stats
   */
  @Post('trigger/scraped-data')
  async triggerScrapedDataCleanup(): Promise<{ success: boolean; message: string; stats: CleanupStats }> {
    return this.dataCleanupService.triggerCleanupManually();
  }

  /**
   * Trigger scraper metrics cleanup manually
   *
   * @returns Cleanup result with stats
   */
  @Post('trigger/scraper-metrics')
  async triggerScraperMetricsCleanup(): Promise<{ success: boolean; message: string; stats: CleanupStats }> {
    const stats = await this.dataCleanupService.cleanupScraperMetrics();
    return {
      success: true,
      message: `Cleanup completed: ${stats.deleted} metrics deleted`,
      stats,
    };
  }

  /**
   * Trigger news cleanup manually
   *
   * @returns Cleanup result with stats
   */
  @Post('trigger/news')
  async triggerNewsCleanup(): Promise<{ success: boolean; message: string; stats: CleanupStats }> {
    const stats = await this.dataCleanupService.cleanupNews();
    return {
      success: true,
      message: `Cleanup completed: ${stats.archived} news archived, ${stats.deleted} deleted`,
      stats,
    };
  }

  /**
   * Trigger update logs cleanup manually
   *
   * @returns Cleanup result with stats
   */
  @Post('trigger/update-logs')
  async triggerUpdateLogsCleanup(): Promise<{ success: boolean; message: string; stats: CleanupStats }> {
    const stats = await this.dataCleanupService.cleanupUpdateLogs();
    return {
      success: true,
      message: `Cleanup completed: ${stats.archived} logs archived, ${stats.deleted} deleted`,
      stats,
    };
  }

  /**
   * Trigger sync history cleanup manually
   *
   * @returns Cleanup result with stats
   */
  @Post('trigger/sync-history')
  async triggerSyncHistoryCleanup(): Promise<{ success: boolean; message: string; stats: CleanupStats }> {
    const stats = await this.dataCleanupService.cleanupSyncHistory();
    return {
      success: true,
      message: `Cleanup completed: ${stats.archived} records archived, ${stats.deleted} deleted`,
      stats,
    };
  }

  /**
   * Get cleanup status (dry-run mode, retention periods, etc.)
   *
   * @returns Current cleanup configuration
   */
  @Get('status')
  async getCleanupStatus() {
    return {
      enabled: process.env.CLEANUP_ENABLED === 'true',
      dryRun: process.env.CLEANUP_DRY_RUN === 'true',
      retentionDays: {
        scrapedData: parseInt(process.env.CLEANUP_SCRAPED_DATA_RETENTION_DAYS || '30', 10),
        analyses: parseInt(process.env.CLEANUP_ANALYSES_RETENTION_DAYS || '90', 10),
        // FASE 145 - Fase 2
        scraperMetrics: parseInt(process.env.CLEANUP_SCRAPER_METRICS_RETENTION_DAYS || '30', 10),
        news: parseInt(process.env.CLEANUP_NEWS_RETENTION_DAYS || '180', 10),
        updateLogs: parseInt(process.env.CLEANUP_UPDATE_LOGS_RETENTION_DAYS || '365', 10),
        syncHistory: parseInt(process.env.CLEANUP_SYNC_HISTORY_RETENTION_DAYS || '1095', 10),
      },
      minioLifecycle: {
        enabled: process.env.MINIO_LIFECYCLE_ENABLED === 'true',
        scrapedHtmlDays: parseInt(process.env.MINIO_LIFECYCLE_SCRAPED_HTML_DAYS || '30', 10),
        reportsDays: parseInt(process.env.MINIO_LIFECYCLE_REPORTS_DAYS || '90', 10),
        exportsDays: parseInt(process.env.MINIO_LIFECYCLE_EXPORTS_DAYS || '14', 10),
      },
    };
  }
}
