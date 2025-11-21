import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AssetsUpdateService } from './assets-update.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdateSingleAssetDto,
  UpdateMultipleAssetsDto,
  UpdatePortfolioAssetsDto,
  UpdateAssetsBySectorDto,
  GetOutdatedAssetsDto,
} from './dto/update-asset.dto';

@ApiTags('Assets - Updates')
@Controller('assets/updates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetsUpdateController {
  constructor(private readonly assetsUpdateService: AssetsUpdateService) {}

  /**
   * ENDPOINT 1: Atualizar um único ativo
   * POST /api/v1/assets/updates/single
   */
  @Post('single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a single asset',
    description:
      'Scrapes and updates fundamental data for a single asset. Returns update status, metadata, and duration. Used for manual updates or API triggers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset updated successfully',
    schema: {
      example: {
        success: true,
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        ticker: 'PETR4',
        status: 'success',
        duration: 3245,
        metadata: {
          sources: ['Fundamentus', 'BRAPI', 'StatusInvest', 'Investidor10'],
          sourcesCount: 4,
          confidence: 0.95,
          dataPoints: 35,
          discrepancies: [],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async updateSingle(@Body() dto: UpdateSingleAssetDto) {
    return this.assetsUpdateService.updateSingleAsset(dto.ticker, dto.userId, dto.triggeredBy);
  }

  /**
   * ENDPOINT 2: Atualizar múltiplos ativos
   * POST /api/v1/assets/updates/batch
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update multiple assets',
    description:
      'Scrapes and updates fundamental data for multiple assets in batch. Returns summary statistics and individual results. Rate-limited to prevent API abuse.',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch update completed',
    schema: {
      example: {
        totalAssets: 5,
        successCount: 4,
        failedCount: 1,
        duration: 15234,
        results: [
          {
            success: true,
            assetId: '123e4567-e89b-12d3-a456-426614174000',
            ticker: 'PETR4',
            status: 'success',
            duration: 3245,
          },
          {
            success: false,
            assetId: '223e4567-e89b-12d3-a456-426614174000',
            ticker: 'INVALID',
            status: 'failed',
            error: 'Asset not found',
            duration: 145,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (empty tickers array)',
  })
  async updateMultiple(@Body() dto: UpdateMultipleAssetsDto) {
    return this.assetsUpdateService.updateMultipleAssets(dto.tickers, dto.userId, dto.triggeredBy);
  }

  /**
   * ENDPOINT 3: Atualizar todos os ativos de um portfólio
   * POST /api/v1/assets/updates/portfolio
   */
  @Post('portfolio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update all assets in a portfolio',
    description:
      'Scrapes and updates fundamental data for all assets in a user portfolio. Verifies portfolio ownership. Returns batch update results.',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio assets updated',
    schema: {
      example: {
        totalAssets: 8,
        successCount: 8,
        failedCount: 0,
        duration: 24567,
        results: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found or unauthorized',
  })
  async updatePortfolio(@Body() dto: UpdatePortfolioAssetsDto) {
    return this.assetsUpdateService.updatePortfolioAssets(dto.portfolioId, dto.userId);
  }

  /**
   * ENDPOINT 4: Atualizar ativos por setor
   * POST /api/v1/assets/updates/sector
   */
  @Post('sector')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update all assets in a sector',
    description:
      'Scrapes and updates fundamental data for all active assets in a specific sector. Useful for thematic updates (e.g., "update all banks").',
  })
  @ApiResponse({
    status: 200,
    description: 'Sector assets updated',
  })
  @ApiResponse({
    status: 404,
    description: 'No active assets found for sector',
  })
  async updateBySector(@Body() dto: UpdateAssetsBySectorDto) {
    return this.assetsUpdateService.updateAssetsBySector(dto.sector, dto.userId);
  }

  /**
   * ENDPOINT 5: Buscar ativos desatualizados
   * GET /api/v1/assets/updates/outdated
   */
  @Get('outdated')
  @ApiOperation({
    summary: 'Get outdated assets',
    description:
      'Returns list of assets that need updates (not updated in last 7 days or failed last update). Can be filtered by portfolio.',
  })
  @ApiQuery({
    name: 'portfolioId',
    required: false,
    description: 'Filter by portfolio ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of outdated assets',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          ticker: 'PETR4',
          name: 'Petrobras PN',
          lastUpdated: '2025-11-02T10:30:00.000Z',
          lastUpdateStatus: 'failed',
          lastUpdateError: 'Timeout',
          updateRetryCount: 2,
        },
      ],
    },
  })
  async getOutdated(@Query() dto: GetOutdatedAssetsDto) {
    return this.assetsUpdateService.getOutdatedAssets(dto.portfolioId);
  }

  /**
   * ENDPOINT 6: Reprocessar ativos com falha
   * POST /api/v1/assets/updates/retry
   */
  @Post('retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry failed asset updates',
    description:
      "Automatically retries updates for all assets with failed status that haven't reached max retry count. Used by cron jobs.",
  })
  @ApiResponse({
    status: 200,
    description: 'Retry completed',
  })
  async retryFailed() {
    return this.assetsUpdateService.retryFailedAssets();
  }

  /**
   * ENDPOINT 7 (BONUS): Atualizar ativo específico por ticker (simplificado)
   * POST /api/v1/assets/updates/:ticker
   */
  @Post(':ticker')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update asset by ticker (simplified endpoint)',
    description:
      'Simplified endpoint to update a single asset using ticker in URL. Automatically uses MANUAL trigger.',
  })
  @ApiParam({
    name: 'ticker',
    description: 'Asset ticker symbol',
    example: 'PETR4',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async updateByTicker(@Param('ticker') ticker: string, @Body('userId') userId?: string) {
    return this.assetsUpdateService.updateSingleAsset(ticker, userId);
  }
}
