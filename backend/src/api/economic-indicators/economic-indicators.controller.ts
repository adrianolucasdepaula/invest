import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EconomicIndicatorsService } from './economic-indicators.service';
import { GetIndicatorsDto } from './dto/get-indicators.dto';
import {
  IndicatorsListResponseDto,
  LatestIndicatorResponseDto,
  LatestWithAccumulatedResponseDto,
} from './dto/indicator-response.dto';
import { CacheInterceptor } from '@common/interceptors/cache.interceptor';
import { CacheKey } from '@common/decorators/cache.decorator';

/**
 * EconomicIndicatorsController - Controller de Indicadores Macroeconômicos
 *
 * Endpoints REST para consulta e sincronização de indicadores econômicos.
 *
 * @created 2025-11-21 - FASE 2 (Backend Economic Indicators)
 */
@ApiTags('Economic Indicators')
@Controller('economic-indicators')
export class EconomicIndicatorsController {
  private readonly logger = new Logger(EconomicIndicatorsController.name);

  constructor(private readonly indicatorsService: EconomicIndicatorsService) {}

  /**
   * GET /economic-indicators
   * Lista todos os indicadores com filtros opcionais
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('economic-indicators:list', 300) // 5 minutes cache (monthly data)
  @ApiOperation({
    summary: 'List all economic indicators',
    description: 'Get all indicators with optional filters (type, date range, limit)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['SELIC', 'IPCA', 'CDI', 'PIB', 'IGPM', 'DI', 'POUPANCA', 'ALL'],
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-11-21' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Indicators list retrieved successfully',
    type: IndicatorsListResponseDto,
  })
  async getAll(@Query() dto: GetIndicatorsDto): Promise<IndicatorsListResponseDto> {
    this.logger.log(`GET /economic-indicators - Filters: ${JSON.stringify(dto)}`);
    return this.indicatorsService.getAll(dto);
  }

  /**
   * POST /economic-indicators/sync
   * Trigger manual sync from BRAPI
   * TODO: Add admin authentication in future phases
   *
   * IMPORTANT: This route must come BEFORE the `:type` GET route to avoid conflicts
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger manual sync from BRAPI',
    description: 'Manually sync SELIC, IPCA, and CDI from BRAPI (admin only - auth pending)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync completed successfully',
    schema: {
      example: {
        message: 'Sync completed',
        timestamp: '2025-11-21T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 502,
    description: 'BRAPI service unavailable',
  })
  async syncFromBrapi(): Promise<{ message: string; timestamp: Date }> {
    try {
      this.logger.log('POST /economic-indicators/sync - Manual sync triggered');
      this.logger.debug('Calling indicatorsService.syncFromBrapi()');

      await this.indicatorsService.syncFromBrapi();

      this.logger.debug('Service returned successfully');

      const result = {
        message: 'Sync completed',
        timestamp: new Date(),
      };

      this.logger.log(`Sync completed at ${result.timestamp.toISOString()}`);
      return result;
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /economic-indicators/:type
   * Retorna o último valor de um indicador específico
   *
   * IMPORTANT: This route must come AFTER the POST /sync route to avoid conflicts
   */
  @Get(':type')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('economic-indicators:type', 300) // 5 minutes cache
  @ApiOperation({
    summary: 'Get latest indicator by type',
    description: 'Retrieve the most recent value for a specific indicator (SELIC, IPCA, CDI, etc)',
  })
  @ApiParam({
    name: 'type',
    description: 'Indicator type',
    enum: ['SELIC', 'IPCA', 'CDI', 'PIB', 'IGPM', 'DI', 'POUPANCA'],
    example: 'SELIC',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest indicator value retrieved successfully',
    type: LatestIndicatorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No data found for this indicator type',
  })
  async getLatestByType(@Param('type') type: string): Promise<LatestIndicatorResponseDto> {
    this.logger.log(`GET /economic-indicators/${type}`);
    return this.indicatorsService.getLatestByType(type.toUpperCase());
  }

  /**
   * GET /economic-indicators/:type/accumulated
   * Retorna o último valor + acumulado 12 meses
   */
  @Get(':type/accumulated')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('economic-indicators:accumulated', 300) // 5 minutes cache
  @ApiOperation({
    summary: 'Get latest indicator with 12-month accumulated',
    description: 'Retrieve current monthly value + 12-month accumulated sum',
  })
  @ApiParam({
    name: 'type',
    description: 'Indicator type',
    enum: ['SELIC', 'IPCA', 'CDI'],
    example: 'SELIC',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest indicator with accumulated retrieved successfully',
    type: LatestWithAccumulatedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No data found for this indicator type',
  })
  async getLatestWithAccumulated(
    @Param('type') type: string,
  ): Promise<LatestWithAccumulatedResponseDto> {
    this.logger.log(`GET /economic-indicators/${type}/accumulated`);
    return this.indicatorsService.getLatestWithAccumulated(type.toUpperCase());
  }
}
