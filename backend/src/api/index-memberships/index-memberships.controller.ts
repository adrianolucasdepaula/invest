import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IndexMembershipsService } from './index-memberships.service';

@ApiTags('index-memberships')
@Controller('index-memberships')
export class IndexMembershipsController {
  private readonly logger = new Logger(IndexMembershipsController.name);

  constructor(
    private readonly indexMembershipsService: IndexMembershipsService,
  ) {}

  /**
   * POST /api/v1/index-memberships/sync/:indexName
   * Synchronize index composition from scraper
   */
  @Post('sync/:indexName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync index composition from scraper',
    description:
      'Fetches the latest index composition from the Python scraper and updates the database. ' +
      'Automatically invalidates previous periods and creates new memberships.',
  })
  @ApiParam({
    name: 'indexName',
    description: 'Index name (e.g., IDIV, IBOV, IFIX, SMLL)',
    example: 'IDIV',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync completed successfully',
    schema: {
      example: {
        success: true,
        count: 82,
        message: 'Successfully synced 82 assets for IDIV',
      },
    },
  })
  async syncComposition(@Param('indexName') indexName: string) {
    this.logger.log(`POST /sync/${indexName} - Starting composition sync`);
    return this.indexMembershipsService.syncComposition(indexName);
  }

  /**
   * GET /api/v1/index-memberships/:indexName/current
   * Get current (active) memberships for an index
   */
  @Get(':indexName/current')
  @ApiOperation({
    summary: 'Get current index composition',
    description:
      'Returns the current composition of the specified index (assets that are valid today). ' +
      'Includes participation percentages and theoretical quantities.',
  })
  @ApiParam({
    name: 'indexName',
    description: 'Index name (e.g., IDIV, IBOV, IFIX, SMLL)',
    example: 'IDIV',
  })
  @ApiResponse({
    status: 200,
    description: 'Current composition retrieved successfully',
    schema: {
      example: [
        {
          id: 'uuid',
          assetId: 'uuid',
          indexName: 'IDIV',
          participationPercent: 3.456789,
          theoreticalQuantity: 1000000,
          validFrom: '2025-01-01',
          validTo: '2025-04-30',
          metadata: {
            source: 'B3',
            scrapedAt: '2025-01-01T00:00:00',
            confidence: 100,
          },
          createdAt: '2025-01-01T00:00:00',
          updatedAt: '2025-01-01T00:00:00',
          asset: {
            id: 'uuid',
            ticker: 'PETR4',
            name: 'Petrobras PN',
            type: 'stock',
          },
        },
      ],
    },
  })
  async getCurrentComposition(@Param('indexName') indexName: string) {
    this.logger.log(`GET /${indexName}/current - Fetching current composition`);
    return this.indexMembershipsService.getCurrentMemberships(indexName);
  }

  /**
   * GET /api/v1/index-memberships/:indexName/history
   * Get historical memberships for an index
   */
  @Get(':indexName/history')
  @ApiOperation({
    summary: 'Get historical index composition',
    description:
      'Returns all historical compositions of the specified index, including past rebalancing periods. ' +
      'Ordered by validity period (most recent first).',
  })
  @ApiParam({
    name: 'indexName',
    description: 'Index name (e.g., IDIV, IBOV, IFIX, SMLL)',
    example: 'IDIV',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical composition retrieved successfully',
  })
  async getHistoricalComposition(@Param('indexName') indexName: string) {
    this.logger.log(`GET /${indexName}/history - Fetching historical composition`);
    return this.indexMembershipsService.getHistoricalMemberships(indexName);
  }

  /**
   * GET /api/v1/index-memberships/asset/:ticker
   * Get all index memberships for a specific asset
   */
  @Get('asset/:ticker')
  @ApiOperation({
    summary: 'Get index memberships for an asset',
    description:
      'Returns all index memberships (current and historical) for a specific asset ticker. ' +
      'Shows which indices the asset belongs/belonged to and its participation percentages.',
  })
  @ApiParam({
    name: 'ticker',
    description: 'Asset ticker (e.g., PETR4, VALE3)',
    example: 'PETR4',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset memberships retrieved successfully',
    schema: {
      example: [
        {
          id: 'uuid',
          assetId: 'uuid',
          indexName: 'IDIV',
          participationPercent: 3.456789,
          theoreticalQuantity: 1000000,
          validFrom: '2025-01-01',
          validTo: '2025-04-30',
          metadata: {
            source: 'B3',
            scrapedAt: '2025-01-01T00:00:00',
            confidence: 100,
          },
          createdAt: '2025-01-01T00:00:00',
          updatedAt: '2025-01-01T00:00:00',
        },
        {
          id: 'uuid',
          assetId: 'uuid',
          indexName: 'IBOV',
          participationPercent: 5.123456,
          theoreticalQuantity: 2000000,
          validFrom: '2025-01-01',
          validTo: null,
          metadata: {
            source: 'B3',
            scrapedAt: '2025-01-01T00:00:00',
            confidence: 100,
          },
          createdAt: '2025-01-01T00:00:00',
          updatedAt: '2025-01-01T00:00:00',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async getAssetMemberships(@Param('ticker') ticker: string) {
    this.logger.log(`GET /asset/${ticker} - Fetching asset memberships`);
    return this.indexMembershipsService.getAssetMemberships(ticker);
  }
}
