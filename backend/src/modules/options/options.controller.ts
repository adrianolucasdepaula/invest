import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../api/auth/guards/jwt-auth.guard';
import { OptionsService, CreateOptionPriceDto, OptionChainFilter } from './options.service';
import { OptionType, OptionStatus } from '../../database/entities';

@ApiTags('Options')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update an option price' })
  @ApiResponse({ status: 201, description: 'Option created/updated successfully' })
  async upsert(@Body() dto: CreateOptionPriceDto) {
    return this.optionsService.upsertOption(dto);
  }

  @Get('chain/:assetId')
  @ApiOperation({ summary: 'Get option chain for an asset' })
  @ApiQuery({ name: 'expirationDate', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Option chain data' })
  async getOptionChain(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('expirationDate') expirationDate?: string,
  ) {
    const expDate = expirationDate ? new Date(expirationDate) : undefined;
    return this.optionsService.getOptionChain(assetId, expDate);
  }

  @Get('chain/:assetId/summary')
  @ApiOperation({ summary: 'Get option chain summary for an asset' })
  @ApiResponse({ status: 200, description: 'Option chain summary' })
  async getChainSummary(@Param('assetId', ParseUUIDPipe) assetId: string) {
    return this.optionsService.getChainSummary(assetId);
  }

  @Get('chain/:assetId/expirations')
  @ApiOperation({ summary: 'Get available expiration dates for an asset' })
  @ApiResponse({ status: 200, description: 'List of expiration dates' })
  async getExpirationDates(@Param('assetId', ParseUUIDPipe) assetId: string) {
    return this.optionsService.getExpirationDates(assetId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search options with filters' })
  @ApiQuery({ name: 'underlyingAssetId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: OptionType })
  @ApiQuery({ name: 'expirationDate', required: false })
  @ApiQuery({ name: 'minStrike', required: false, type: Number })
  @ApiQuery({ name: 'maxStrike', required: false, type: Number })
  @ApiQuery({ name: 'inTheMoney', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, enum: OptionStatus })
  @ApiResponse({ status: 200, description: 'Filtered options list' })
  async findOptions(
    @Query('underlyingAssetId') underlyingAssetId?: string,
    @Query('type') type?: OptionType,
    @Query('expirationDate') expirationDate?: string,
    @Query('minStrike') minStrike?: number,
    @Query('maxStrike') maxStrike?: number,
    @Query('inTheMoney') inTheMoney?: boolean,
    @Query('status') status?: OptionStatus,
  ) {
    const filter: OptionChainFilter = {
      underlyingAssetId,
      type,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      minStrike: minStrike ? Number(minStrike) : undefined,
      maxStrike: maxStrike ? Number(maxStrike) : undefined,
      inTheMoney,
      status,
    };
    return this.optionsService.findOptions(filter);
  }

  @Get('ticker/:ticker')
  @ApiOperation({ summary: 'Get option by ticker' })
  @ApiResponse({ status: 200, description: 'Option data' })
  async findByTicker(@Param('ticker') ticker: string) {
    return this.optionsService.findByTicker(ticker);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get option by ID' })
  @ApiResponse({ status: 200, description: 'Option details' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionsService.findById(id);
  }

  @Put(':id/greeks')
  @ApiOperation({ summary: 'Update option Greeks' })
  @ApiResponse({ status: 200, description: 'Greeks updated successfully' })
  async updateGreeks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() greeks: {
      delta?: number;
      gamma?: number;
      theta?: number;
      vega?: number;
      rho?: number;
      impliedVolatility?: number;
    },
  ) {
    return this.optionsService.updateGreeks(id, greeks);
  }

  @Post('expire')
  @ApiOperation({ summary: 'Expire old options' })
  @ApiResponse({ status: 200, description: 'Number of expired options' })
  async expireOptions() {
    const count = await this.optionsService.expireOptions();
    return { expired: count };
  }
}
