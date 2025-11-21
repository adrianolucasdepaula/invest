import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CacheService } from '../../common/services/cache.service';
import { BrapiService } from '../../integrations/brapi/brapi.service';
import { EconomicIndicator } from '../../database/entities/economic-indicator.entity';
import { GetIndicatorsDto } from './dto/get-indicators.dto';
import {
  IndicatorsListResponseDto,
  IndicatorResponseDto,
  LatestIndicatorResponseDto,
} from './dto/indicator-response.dto';

const CACHE_TTL = {
  LIST: 300, // 5 minutes
  LATEST: 60, // 1 minute
};

/**
 * EconomicIndicatorsService - Serviço de Indicadores Macroeconômicos
 *
 * Gerencia indicadores econômicos brasileiros (SELIC, IPCA, CDI, PIB, etc)
 * com cache e sincronização automática via BRAPI.
 *
 * @created 2025-11-21 - FASE 2 (Backend Economic Indicators)
 */
@Injectable()
export class EconomicIndicatorsService {
  private readonly logger = new Logger(EconomicIndicatorsService.name);

  constructor(
    @InjectRepository(EconomicIndicator)
    private readonly indicatorRepository: Repository<EconomicIndicator>,
    private readonly cacheService: CacheService,
    private readonly brapiService: BrapiService,
  ) {}

  /**
   * Get all indicators with filters
   * @param dto Query filters (type, startDate, endDate, limit)
   * @returns IndicatorsListResponseDto
   */
  async getAll(dto: GetIndicatorsDto): Promise<IndicatorsListResponseDto> {
    try {
      const cacheKey = `indicators:list:${JSON.stringify(dto)}`;

      // Try cache first
      const cached = await this.cacheService.get<IndicatorsListResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query
      const query = this.indicatorRepository.createQueryBuilder('indicator');

      // Filter by type (if not ALL)
      if (dto.type && dto.type !== 'ALL') {
        query.andWhere('indicator.indicatorType = :type', { type: dto.type });
      }

      // Filter by date range
      if (dto.startDate && dto.endDate) {
        query.andWhere('indicator.referenceDate BETWEEN :startDate AND :endDate', {
          startDate: dto.startDate,
          endDate: dto.endDate,
        });
      } else if (dto.startDate) {
        query.andWhere('indicator.referenceDate >= :startDate', {
          startDate: dto.startDate,
        });
      } else if (dto.endDate) {
        query.andWhere('indicator.referenceDate <= :endDate', {
          endDate: dto.endDate,
        });
      }

      // Order by newest first
      query.orderBy('indicator.referenceDate', 'DESC');

      // Limit results
      if (dto.limit) {
        query.limit(dto.limit);
      }

      // Execute query
      const [indicators, total] = await query.getManyAndCount();

      const response: IndicatorsListResponseDto = {
        indicators: indicators.map((i) => this.mapToResponseDto(i)),
        total,
        updatedAt: new Date(),
      };

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, response, CACHE_TTL.LIST);

      this.logger.log(`Fetched ${indicators.length} indicators (total: ${total})`);

      return response;
    } catch (error) {
      this.logger.error(`getAll failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get latest indicator by type (SELIC, IPCA, CDI, etc)
   * @param type Indicator type
   * @returns LatestIndicatorResponseDto
   */
  async getLatestByType(type: string): Promise<LatestIndicatorResponseDto> {
    try {
      const cacheKey = `indicators:latest:${type}`;

      // Try cache first
      const cached = await this.cacheService.get<LatestIndicatorResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch latest 2 records (current + previous)
      const indicators = await this.indicatorRepository.find({
        where: { indicatorType: type },
        order: { referenceDate: 'DESC' },
        take: 2,
      });

      if (indicators.length === 0) {
        throw new NotFoundException(`No data found for indicator type: ${type}`);
      }

      const current = indicators[0];
      const previous = indicators[1];

      // Calculate change
      const change = previous ? Number((current.value - previous.value).toFixed(4)) : undefined;

      const response: LatestIndicatorResponseDto = {
        type: current.indicatorType,
        currentValue: Number(current.value),
        previousValue: previous ? Number(previous.value) : undefined,
        change,
        referenceDate: current.referenceDate,
        source: current.source || 'Unknown',
        unit: current.metadata?.unit || '% a.a.',
      };

      // Cache for 1 minute
      await this.cacheService.set(cacheKey, response, CACHE_TTL.LATEST);

      this.logger.log(`Latest ${type}: ${response.currentValue} (change: ${change || 'N/A'})`);

      return response;
    } catch (error) {
      this.logger.error(`getLatestByType failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync indicators from BRAPI (SELIC, IPCA, CDI)
   * Uses upsert logic (insert or update based on indicatorType + referenceDate)
   */
  async syncFromBrapi(): Promise<void> {
    try {
      this.logger.log('Starting sync from Banco Central API...');

      const syncResults = {
        selic: false,
        ipca: false,
        cdi: false,
      };

      // 1. Sync SELIC
      try {
        const selicData = await this.brapiService.getSelic();
        await this.upsertIndicator({
          indicatorType: 'SELIC',
          value: selicData.value,
          referenceDate: selicData.date, // Already a Date from parseBCBDate()
          source: 'BRAPI',
          metadata: {
            unit: '% a.a.',
            period: 'annual',
            description: 'Taxa básica de juros (Banco Central)',
          },
        });
        syncResults.selic = true;
        this.logger.log(`SELIC synced: ${selicData.value}%`);
      } catch (error) {
        this.logger.error(`SELIC sync failed: ${error.message}`);
      }

      // 2. Sync IPCA
      try {
        const ipcaData = await this.brapiService.getInflation('brazil');
        await this.upsertIndicator({
          indicatorType: 'IPCA',
          value: ipcaData.value,
          referenceDate: ipcaData.date, // Already a Date from parseBCBDate()
          source: 'BRAPI',
          metadata: {
            unit: '% a.a.',
            period: 'annual',
            description: 'Índice de Preços ao Consumidor Amplo (IBGE)',
          },
        });
        syncResults.ipca = true;
        this.logger.log(`IPCA synced: ${ipcaData.value}%`);
      } catch (error) {
        this.logger.error(`IPCA sync failed: ${error.message}`);
      }

      // 3. Sync CDI
      try {
        const cdiData = await this.brapiService.getCDI();
        await this.upsertIndicator({
          indicatorType: 'CDI',
          value: cdiData.value,
          referenceDate: cdiData.date, // Already a Date from parseBCBDate()
          source: 'BRAPI (calculated)',
          metadata: {
            unit: '% a.a.',
            period: 'annual',
            description: 'Certificado de Depósito Interbancário (calculado ~SELIC - 0.10%)',
          },
        });
        syncResults.cdi = true;
        this.logger.log(`CDI synced: ${cdiData.value}%`);
      } catch (error) {
        this.logger.error(`CDI sync failed: ${error.message}`);
      }

      // Clear cache after sync
      await this.cacheService.del('indicators:*');

      this.logger.log(`Sync completed: ${JSON.stringify(syncResults)}`);
    } catch (error) {
      this.logger.error(`syncFromBrapi failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upsert indicator (insert or update based on unique constraint)
   * Unique constraint: indicatorType + referenceDate
   */
  private async upsertIndicator(data: Partial<EconomicIndicator>): Promise<void> {
    try {
      const existing = await this.indicatorRepository.findOne({
        where: {
          indicatorType: data.indicatorType,
          referenceDate: data.referenceDate,
        },
      });

      if (existing) {
        // Update existing
        await this.indicatorRepository.update(existing.id, {
          value: data.value,
          source: data.source,
          metadata: data.metadata,
        });
        this.logger.debug(`Updated ${data.indicatorType} for ${data.referenceDate}`);
      } else {
        // Insert new
        await this.indicatorRepository.save(data);
        this.logger.debug(`Inserted ${data.indicatorType} for ${data.referenceDate}`);
      }
    } catch (error) {
      this.logger.error(`upsertIndicator failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Map EconomicIndicator entity to DTO
   */
  private mapToResponseDto(indicator: EconomicIndicator): IndicatorResponseDto {
    return {
      id: indicator.id,
      indicatorType: indicator.indicatorType,
      value: Number(indicator.value),
      referenceDate: indicator.referenceDate,
      source: indicator.source,
      metadata: indicator.metadata,
      createdAt: indicator.createdAt,
      updatedAt: indicator.updatedAt,
    };
  }
}
