import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { DataSource } from '@database/entities';

@Injectable()
export class DataSourcesService {
  constructor(
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
    @InjectQueue('scraping')
    private scrapingQueue: Queue,
  ) {}

  async findAll() {
    return this.dataSourceRepository.find({ order: { name: 'ASC' } });
  }

  async getStatus() {
    const sources = await this.findAll();
    return sources.map((source) => ({
      name: source.name,
      code: source.code,
      status: source.status,
      reliabilityScore: source.reliabilityScore,
      lastSuccessAt: source.lastSuccessAt,
      errorCount: source.errorCount,
    }));
  }

  async triggerScrape(ticker: string, type: 'fundamental' | 'technical' | 'options' = 'fundamental') {
    const job = await this.scrapingQueue.add(type, {
      ticker: ticker.toUpperCase(),
      type,
    });

    return {
      message: `Scraping job created for ${ticker}`,
      jobId: job.id,
      ticker: ticker.toUpperCase(),
      type,
      status: 'queued',
    };
  }
}
