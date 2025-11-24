import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../common/services/cache.service';
import { BrapiService } from '../../integrations/brapi/brapi.service';
import { EconomicIndicator } from '../../database/entities/economic-indicator.entity';
import { GetIndicatorsDto } from './dto/get-indicators.dto';
import {
  IndicatorsListResponseDto,
  IndicatorResponseDto,
  LatestIndicatorResponseDto,
  LatestWithAccumulatedResponseDto,
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
   * Get latest indicator with 12-month accumulated value
   * UPDATED FASE 1.2: For IPCA, fetches accumulated 12m from BC Série 13522 (official calculation)
   * @param type Indicator type
   * @returns LatestWithAccumulatedResponseDto
   */
  async getLatestWithAccumulated(type: string): Promise<LatestWithAccumulatedResponseDto> {
    try {
      const cacheKey = `indicators:accumulated:${type}`;

      // Try cache first
      const cached = await this.cacheService.get<LatestWithAccumulatedResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch latest record for current value
      const latest = await this.getLatestByType(type);

      let accumulated12Months: number;
      let monthsCount: number;

      // Special handling for IPCA: use official BC calculation (Série 13522)
      if (type === 'IPCA') {
        const ipcaAccumData = await this.indicatorRepository.findOne({
          where: { indicatorType: 'IPCA_ACUM_12M' },
          order: { referenceDate: 'DESC' },
        });

        if (ipcaAccumData) {
          accumulated12Months = Number(ipcaAccumData.value);
          monthsCount = 12; // Always 12 months for BC official calculation
          this.logger.log(`Using official BC IPCA accumulated 12m: ${accumulated12Months}%`);
        } else {
          // Fallback: calculate if Série 13522 data not available
          this.logger.warn('IPCA_ACUM_12M not found, falling back to calculation');
          const historicalData = await this.indicatorRepository.find({
            where: { indicatorType: type },
            order: { referenceDate: 'DESC' },
            take: 12,
          });
          accumulated12Months = historicalData.reduce(
            (sum, indicator) => sum + Number(indicator.value),
            0,
          );
          monthsCount = historicalData.length;
        }
      } else {
        // For other indicators (SELIC, CDI): use sum calculation
        const historicalData = await this.indicatorRepository.find({
          where: { indicatorType: type },
          order: { referenceDate: 'DESC' },
          take: 12,
        });

        accumulated12Months = historicalData.reduce((sum, indicator) => {
          return sum + Number(indicator.value);
        }, 0);
        monthsCount = historicalData.length;
      }

      const response: LatestWithAccumulatedResponseDto = {
        ...latest,
        accumulated12Months: Number(accumulated12Months.toFixed(4)),
        monthsCount,
      };

      // Cache for 1 minute
      await this.cacheService.set(cacheKey, response, CACHE_TTL.LATEST);

      this.logger.log(
        `${type} with accumulated: current=${response.currentValue}%, 12mo=${response.accumulated12Months}% (${response.monthsCount} months)`,
      );

      return response;
    } catch (error) {
      this.logger.error(`getLatestWithAccumulated failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync indicators from BRAPI (SELIC, IPCA, CDI, IPCA_ACUM_12M, IPCA-15, IDP/IDE, Ouro)
   * UPDATED FASE 1.1: Fetches last 13 months of data for accurate accumulated calculations
   * UPDATED FASE 1.2: Added IPCA accumulated 12m from BC Série 13522 (official calculation)
   * UPDATED FASE 1.4: Added 5 new indicators (IPCA-15, IDP Ingressos, IDE Saídas, IDP Líquido, Ouro Monetário)
   * Uses upsert logic (insert or update based on indicatorType + referenceDate)
   */
  async syncFromBrapi(): Promise<void> {
    try {
      this.logger.log('Starting sync from Banco Central API (13 months - 9 indicators)...');

      const syncResults = {
        selic: { synced: 0, failed: 0 },
        ipca: { synced: 0, failed: 0 },
        ipcaAccum12m: { synced: 0, failed: 0 },
        cdi: { synced: 0, failed: 0 },
        ipca15: { synced: 0, failed: 0 },
        idpIngressos: { synced: 0, failed: 0 },
        ideSaidas: { synced: 0, failed: 0 },
        idpLiquido: { synced: 0, failed: 0 },
        ouroMonetario: { synced: 0, failed: 0 },
      };

      // 1. Sync SELIC (last 13 months to ensure we have complete 12-month rolling window)
      try {
        const selicDataArray = await this.brapiService.getSelic(13);
        this.logger.log(`Fetched ${selicDataArray.length} SELIC records from Banco Central`);

        for (const selicData of selicDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'SELIC',
              value: selicData.value,
              referenceDate: selicData.date,
              source: 'BRAPI',
              metadata: {
                unit: '% a.a.',
                period: 'annual',
                description: 'Taxa básica de juros (Banco Central)',
              },
            });
            syncResults.selic.synced++;
          } catch (error) {
            this.logger.error(`SELIC upsert failed for ${selicData.date}: ${error.message}`);
            syncResults.selic.failed++;
          }
        }
        this.logger.log(
          `SELIC sync: ${syncResults.selic.synced} synced, ${syncResults.selic.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`SELIC sync failed: ${error.message}`);
      }

      // 2. Sync IPCA (last 13 months to ensure we have complete 12-month rolling window)
      try {
        const ipcaDataArray = await this.brapiService.getInflation(13);
        this.logger.log(`Fetched ${ipcaDataArray.length} IPCA records from Banco Central`);

        for (const ipcaData of ipcaDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'IPCA',
              value: ipcaData.value,
              referenceDate: ipcaData.date,
              source: 'BRAPI',
              metadata: {
                unit: '% a.a.',
                period: 'annual',
                description: 'Índice de Preços ao Consumidor Amplo (IBGE)',
              },
            });
            syncResults.ipca.synced++;
          } catch (error) {
            this.logger.error(`IPCA upsert failed for ${ipcaData.date}: ${error.message}`);
            syncResults.ipca.failed++;
          }
        }
        this.logger.log(
          `IPCA sync: ${syncResults.ipca.synced} synced, ${syncResults.ipca.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`IPCA sync failed: ${error.message}`);
      }

      // 3. Sync IPCA Accumulated 12 months (last 13 months - Série 13522 from BC)
      try {
        const ipcaAccumDataArray = await this.brapiService.getIPCAAccumulated12m(13);
        this.logger.log(
          `Fetched ${ipcaAccumDataArray.length} IPCA accumulated 12m records from Banco Central`,
        );

        for (const ipcaAccumData of ipcaAccumDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'IPCA_ACUM_12M',
              value: ipcaAccumData.value,
              referenceDate: ipcaAccumData.date,
              source: 'BRAPI',
              metadata: {
                unit: '%',
                period: '12 months',
                description: 'IPCA acumulado 12 meses (calculado pelo BC - Série 13522)',
              },
            });
            syncResults.ipcaAccum12m.synced++;
          } catch (error) {
            this.logger.error(
              `IPCA accumulated 12m upsert failed for ${ipcaAccumData.date}: ${error.message}`,
            );
            syncResults.ipcaAccum12m.failed++;
          }
        }
        this.logger.log(
          `IPCA accumulated 12m sync: ${syncResults.ipcaAccum12m.synced} synced, ${syncResults.ipcaAccum12m.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`IPCA accumulated 12m sync failed: ${error.message}`);
      }

      // 4. Sync CDI (last 13 months - calculated from SELIC)
      try {
        const cdiDataArray = await this.brapiService.getCDI(13);
        this.logger.log(`Calculated ${cdiDataArray.length} CDI records from SELIC`);

        for (const cdiData of cdiDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'CDI',
              value: cdiData.value,
              referenceDate: cdiData.date,
              source: 'BRAPI (calculated)',
              metadata: {
                unit: '% a.a.',
                period: 'annual',
                description: 'Certificado de Depósito Interbancário (calculado ~SELIC - 0.10%)',
              },
            });
            syncResults.cdi.synced++;
          } catch (error) {
            this.logger.error(`CDI upsert failed for ${cdiData.date}: ${error.message}`);
            syncResults.cdi.failed++;
          }
        }
        this.logger.log(
          `CDI sync: ${syncResults.cdi.synced} synced, ${syncResults.cdi.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`CDI sync failed: ${error.message}`);
      }

      // 5. Sync IPCA-15 (last 13 months - Série 7478 from BC)
      try {
        const ipca15DataArray = await this.brapiService.getIPCA15(13);
        this.logger.log(`Fetched ${ipca15DataArray.length} IPCA-15 records from Banco Central`);

        for (const ipca15Data of ipca15DataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'IPCA_15',
              value: ipca15Data.value,
              referenceDate: ipca15Data.date,
              source: 'BRAPI',
              metadata: {
                unit: '% a.m.',
                period: 'monthly',
                description: 'IPCA-15 - Prévia da Inflação (IBGE)',
              },
            });
            syncResults.ipca15.synced++;
          } catch (error) {
            this.logger.error(`IPCA-15 upsert failed for ${ipca15Data.date}: ${error.message}`);
            syncResults.ipca15.failed++;
          }
        }
        this.logger.log(
          `IPCA-15 sync: ${syncResults.ipca15.synced} synced, ${syncResults.ipca15.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`IPCA-15 sync failed: ${error.message}`);
      }

      // 6. Sync IDP Ingressos (last 13 months - Série 22886 from BC)
      try {
        const idpIngressosDataArray = await this.brapiService.getIDPIngressos(13);
        this.logger.log(
          `Fetched ${idpIngressosDataArray.length} IDP Ingressos records from Banco Central`,
        );

        for (const idpIngressosData of idpIngressosDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'IDP_INGRESSOS',
              value: idpIngressosData.value,
              referenceDate: idpIngressosData.date,
              source: 'BRAPI',
              metadata: {
                unit: 'US$ milhões',
                period: 'monthly',
                description: 'Investimento Direto no País - Ingressos (BC)',
              },
            });
            syncResults.idpIngressos.synced++;
          } catch (error) {
            this.logger.error(
              `IDP Ingressos upsert failed for ${idpIngressosData.date}: ${error.message}`,
            );
            syncResults.idpIngressos.failed++;
          }
        }
        this.logger.log(
          `IDP Ingressos sync: ${syncResults.idpIngressos.synced} synced, ${syncResults.idpIngressos.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`IDP Ingressos sync failed: ${error.message}`);
      }

      // 7. Sync IDE Saídas (last 13 months - Série 22867 from BC)
      try {
        const ideSaidasDataArray = await this.brapiService.getIDESaidas(13);
        this.logger.log(
          `Fetched ${ideSaidasDataArray.length} IDE Saídas records from Banco Central`,
        );

        for (const ideSaidasData of ideSaidasDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'IDE_SAIDAS',
              value: ideSaidasData.value,
              referenceDate: ideSaidasData.date,
              source: 'BRAPI',
              metadata: {
                unit: 'US$ milhões',
                period: 'monthly',
                description: 'Investimento Direto no Exterior - Saídas (BC)',
              },
            });
            syncResults.ideSaidas.synced++;
          } catch (error) {
            this.logger.error(
              `IDE Saídas upsert failed for ${ideSaidasData.date}: ${error.message}`,
            );
            syncResults.ideSaidas.failed++;
          }
        }
        this.logger.log(
          `IDE Saídas sync: ${syncResults.ideSaidas.synced} synced, ${syncResults.ideSaidas.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`IDE Saídas sync failed: ${error.message}`);
      }

      // 8. Sync IDP Líquido (last 13 months - Série 22888 from BC)
      try {
        const idpLiquidoDataArray = await this.brapiService.getIDPLiquido(13);
        this.logger.log(
          `Fetched ${idpLiquidoDataArray.length} IDP Líquido records from Banco Central`,
        );

        for (const idpLiquidoData of idpLiquidoDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'IDP_LIQUIDO',
              value: idpLiquidoData.value,
              referenceDate: idpLiquidoData.date,
              source: 'BRAPI',
              metadata: {
                unit: 'US$ milhões',
                period: 'monthly',
                description: 'Investimento Direto no País - Líquido (BC)',
              },
            });
            syncResults.idpLiquido.synced++;
          } catch (error) {
            this.logger.error(
              `IDP Líquido upsert failed for ${idpLiquidoData.date}: ${error.message}`,
            );
            syncResults.idpLiquido.failed++;
          }
        }
        this.logger.log(
          `IDP Líquido sync: ${syncResults.idpLiquido.synced} synced, ${syncResults.idpLiquido.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`IDP Líquido sync failed: ${error.message}`);
      }

      // 9. Sync Ouro Monetário (last 13 months - Série 23044 from BC)
      try {
        const ouroMonetarioDataArray = await this.brapiService.getOuroMonetario(13);
        this.logger.log(
          `Fetched ${ouroMonetarioDataArray.length} Ouro Monetário records from Banco Central`,
        );

        for (const ouroMonetarioData of ouroMonetarioDataArray) {
          try {
            await this.upsertIndicator({
              indicatorType: 'OURO_MONETARIO',
              value: ouroMonetarioData.value,
              referenceDate: ouroMonetarioData.date,
              source: 'BRAPI',
              metadata: {
                unit: 'US$ milhões',
                period: 'monthly',
                description: 'Ouro Monetário - Reservas em Ouro (BC)',
              },
            });
            syncResults.ouroMonetario.synced++;
          } catch (error) {
            this.logger.error(
              `Ouro Monetário upsert failed for ${ouroMonetarioData.date}: ${error.message}`,
            );
            syncResults.ouroMonetario.failed++;
          }
        }
        this.logger.log(
          `Ouro Monetário sync: ${syncResults.ouroMonetario.synced} synced, ${syncResults.ouroMonetario.failed} failed`,
        );
      } catch (error) {
        this.logger.error(`Ouro Monetário sync failed: ${error.message}`);
      }

      // Clear cache after sync
      await this.cacheService.del('indicators:*');

      const totalSynced =
        syncResults.selic.synced +
        syncResults.ipca.synced +
        syncResults.ipcaAccum12m.synced +
        syncResults.cdi.synced +
        syncResults.ipca15.synced +
        syncResults.idpIngressos.synced +
        syncResults.ideSaidas.synced +
        syncResults.idpLiquido.synced +
        syncResults.ouroMonetario.synced;
      const totalFailed =
        syncResults.selic.failed +
        syncResults.ipca.failed +
        syncResults.ipcaAccum12m.failed +
        syncResults.cdi.failed +
        syncResults.ipca15.failed +
        syncResults.idpIngressos.failed +
        syncResults.ideSaidas.failed +
        syncResults.idpLiquido.failed +
        syncResults.ouroMonetario.failed;

      this.logger.log(
        `Sync completed: ${totalSynced} records synced, ${totalFailed} failed - ${JSON.stringify(syncResults)}`,
      );
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
