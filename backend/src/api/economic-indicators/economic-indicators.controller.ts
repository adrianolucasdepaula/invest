import { Controller, Get, Post, Query, Param, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EconomicIndicatorsService } from './economic-indicators.service';
import { GetIndicatorsDto } from './dto/get-indicators.dto';
import {
  IndicatorsListResponseDto,
  LatestIndicatorResponseDto,
} from './dto/indicator-response.dto';

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
      console.log('============ CONTROLLER METHOD CALLED ============');
      this.logger.log('POST /economic-indicators/sync - Manual sync triggered');

      console.log('============ CALLING SERVICE ============');
      await this.indicatorsService.syncFromBrapi();
      console.log('============ SERVICE RETURNED ============');

      const result = {
        message: 'Sync completed',
        timestamp: new Date(),
      };

      console.log('============ RETURNING:', JSON.stringify(result), '============');
      return result;
    } catch (error) {
      console.log('============ ERROR CAUGHT:', error.message, '============');
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
}
