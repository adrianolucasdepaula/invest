import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../api/auth/guards/jwt-auth.guard';
import { AlertsService, CreateAlertDto, UpdateAlertDto } from './alerts.service';
import { AlertStatus } from '../../database/entities';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  async create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List alerts for a user' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async findByUser(
    @Query('userId') userId: string,
    @Query('status') status?: AlertStatus,
  ) {
    return this.alertsService.findByUser(userId, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiResponse({ status: 200, description: 'Alert statistics' })
  async getStats(@Query('userId') userId?: string) {
    return this.alertsService.getStats(userId);
  }

  @Get('asset/:assetId')
  @ApiOperation({ summary: 'List alerts for an asset' })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiResponse({ status: 200, description: 'List of alerts for the asset' })
  async findByAsset(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('status') status?: AlertStatus,
  ) {
    return this.alertsService.findByAsset(assetId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert details' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an alert' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alertsService.update(id, dto);
  }

  @Put(':id/pause')
  @ApiOperation({ summary: 'Pause an alert' })
  @ApiResponse({ status: 200, description: 'Alert paused' })
  async pause(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.pauseAlert(id);
  }

  @Put(':id/resume')
  @ApiOperation({ summary: 'Resume a paused alert' })
  @ApiResponse({ status: 200, description: 'Alert resumed' })
  async resume(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.resumeAlert(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.alertsService.delete(id);
    return { success: true, message: 'Alert deleted' };
  }

  @Post('check/:assetId')
  @ApiOperation({ summary: 'Check price alerts for an asset' })
  @ApiQuery({ name: 'price', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Alert check results' })
  async checkPriceAlerts(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('price') price: number,
  ) {
    return this.alertsService.checkPriceAlerts(assetId, price);
  }
}
