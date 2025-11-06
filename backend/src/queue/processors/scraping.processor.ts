import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScrapersService } from '@scrapers/scrapers.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, ScrapedData, DataSource } from '@database/entities';

export interface ScrapingJob {
  ticker: string;
  type: 'fundamental' | 'technical' | 'options';
  sources?: string[];
}

@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(
    private scrapersService: ScrapersService,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(ScrapedData)
    private scrapedDataRepository: Repository<ScrapedData>,
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
  ) {}

  @OnQueueActive()
  onActive(job: Job<ScrapingJob>) {
    this.logger.log(`Processing job ${job.id} for ${job.data.ticker} (${job.data.type})`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ScrapingJob>, result: any) {
    this.logger.log(`Job ${job.id} completed for ${job.data.ticker}`);
  }

  @OnQueueFailed()
  onFailed(job: Job<ScrapingJob>, error: Error) {
    this.logger.error(`Job ${job.id} failed for ${job.data.ticker}: ${error.message}`);
  }

  @Process('fundamental')
  async processFundamentalScraping(job: Job<ScrapingJob>) {
    const { ticker } = job.data;

    try {
      this.logger.log(`Scraping fundamental data for ${ticker}`);

      // Get or create asset
      let asset = await this.assetRepository.findOne({
        where: { ticker: ticker.toUpperCase() },
      });

      if (!asset) {
        asset = await this.assetRepository.save({
          ticker: ticker.toUpperCase(),
          name: ticker.toUpperCase(),
          type: 'stock',
          isActive: true,
        });
      }

      // Scrape from multiple sources
      const result = await this.scrapersService.scrapeFundamentalData(ticker);

      // Save scraped data
      if (result.isValid && result.data) {
        for (const source of result.sources) {
          const dataSource = await this.dataSourceRepository.findOne({
            where: { code: source },
          });

          if (dataSource) {
            await this.scrapedDataRepository.save({
              assetId: asset.id,
              dataSourceId: dataSource.id,
              dataType: 'fundamental',
              data: result.data,
              scrapedAt: new Date(),
              isValid: true,
            });

            // Update data source stats
            dataSource.lastSuccessAt = new Date();
            dataSource.successCount += 1;
            await this.dataSourceRepository.save(dataSource);
          }
        }
      }

      return {
        success: true,
        ticker,
        sourcesCount: result.sourcesCount,
        confidence: result.confidence,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape fundamental data for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  @Process('options')
  async processOptionsScraping(job: Job<ScrapingJob>) {
    const { ticker } = job.data;

    try {
      this.logger.log(`Scraping options data for ${ticker}`);

      const asset = await this.assetRepository.findOne({
        where: { ticker: ticker.toUpperCase() },
      });

      if (!asset) {
        throw new Error(`Asset ${ticker} not found`);
      }

      // Scrape options data
      const result = await this.scrapersService.scrapeOptionsData(ticker);

      if (result.success && result.data) {
        const dataSource = await this.dataSourceRepository.findOne({
          where: { code: 'opcoes' },
        });

        if (dataSource) {
          await this.scrapedDataRepository.save({
            assetId: asset.id,
            dataSourceId: dataSource.id,
            dataType: 'options',
            data: result.data,
            scrapedAt: new Date(),
            isValid: true,
          });

          dataSource.lastSuccessAt = new Date();
          dataSource.successCount += 1;
          await this.dataSourceRepository.save(dataSource);
        }
      }

      return {
        success: true,
        ticker,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape options data for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  @Process('bulk-scraping')
  async processBulkScraping(job: Job<{ tickers: string[] }>) {
    const { tickers } = job.data;

    this.logger.log(`Processing bulk scraping for ${tickers.length} tickers`);

    const results = [];

    for (const ticker of tickers) {
      try {
        await this.processFundamentalScraping({
          data: { ticker, type: 'fundamental' },
        } as Job<ScrapingJob>);

        results.push({ ticker, success: true });
      } catch (error) {
        results.push({ ticker, success: false, error: error.message });
      }

      // Wait a bit between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return {
      total: tickers.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
