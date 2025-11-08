import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { DataSource } from '@database/entities';
import axios from 'axios';

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

  async findOne(id: string) {
    const source = await this.dataSourceRepository.findOne({ where: { id } });
    if (!source) {
      throw new Error(`Data source with id ${id} not found`);
    }
    return source;
  }

  async update(id: string, updateData: Partial<DataSource>) {
    const source = await this.findOne(id);

    // Merge update data
    Object.assign(source, updateData);

    return this.dataSourceRepository.save(source);
  }

  async testConnection(id: string) {
    const source = await this.findOne(id);

    const startTime = Date.now();
    let success = false;
    let error: string | null = null;
    let statusCode: number | null = null;

    try {
      const response = await axios.get(source.url, {
        timeout: 10000, // 10 seconds timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      statusCode = response.status;
      success = statusCode >= 200 && statusCode < 400;

      if (!success) {
        error = `HTTP ${statusCode}: ${response.statusText || 'Unknown error'}`;
      }
    } catch (err: any) {
      success = false;
      if (err.code === 'ECONNABORTED') {
        error = 'Connection timeout';
      } else if (err.code === 'ENOTFOUND') {
        error = 'DNS resolution failed';
      } else if (err.response) {
        statusCode = err.response.status;
        error = `HTTP ${statusCode}: ${err.response.statusText || 'Unknown error'}`;
      } else {
        error = err.message || 'Unknown error';
      }
    }

    const responseTime = Date.now() - startTime;

    // Update source statistics
    if (success) {
      source.lastSuccessAt = new Date();
      source.successCount += 1;
    } else {
      source.lastErrorAt = new Date();
      source.errorCount += 1;
    }

    // Update average response time
    if (source.averageResponseTime) {
      source.averageResponseTime = Math.round(
        (source.averageResponseTime + responseTime) / 2,
      );
    } else {
      source.averageResponseTime = responseTime;
    }

    await this.dataSourceRepository.save(source);

    return {
      success,
      dataSource: {
        id: source.id,
        name: source.name,
        code: source.code,
        url: source.url,
        status: source.status,
      },
      test: {
        responseTime,
        statusCode,
        error,
        timestamp: new Date(),
      },
      statistics: {
        successCount: source.successCount,
        errorCount: source.errorCount,
        lastSuccessAt: source.lastSuccessAt,
        lastErrorAt: source.lastErrorAt,
        averageResponseTime: source.averageResponseTime,
      },
    };
  }
}
