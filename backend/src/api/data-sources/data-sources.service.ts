import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from '@database/entities';

@Injectable()
export class DataSourcesService {
  constructor(
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
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
}
