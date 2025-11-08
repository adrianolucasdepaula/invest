import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  async getAllAssets(@Query('type') type?: string) {
    return this.assetsService.findAll(type);
  }

  @Get(':ticker')
  @ApiOperation({ summary: 'Get asset by ticker' })
  async getAsset(@Param('ticker') ticker: string) {
    return this.assetsService.findByTicker(ticker);
  }

  @Get(':ticker/price-history')
  @ApiOperation({ summary: 'Get asset price history' })
  async getPriceHistory(
    @Param('ticker') ticker: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.assetsService.getPriceHistory(ticker, startDate, endDate);
  }

  @Get(':ticker/prices')
  @ApiOperation({ summary: 'Get asset price history (alias for /price-history)' })
  async getPricesAlias(
    @Param('ticker') ticker: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.assetsService.getPriceHistory(ticker, startDate, endDate);
  }

  @Post(':ticker/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync asset data from sources' })
  async syncAsset(@Param('ticker') ticker: string) {
    return this.assetsService.syncAsset(ticker);
  }
}
