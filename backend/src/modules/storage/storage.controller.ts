import { Controller, Get, Query, Param, Logger, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('api/v1/storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get storage statistics',
    description: 'Returns statistics about all storage buckets',
  })
  @ApiResponse({ status: 200, description: 'Storage statistics' })
  async getStats() {
    return this.storageService.getStats();
  }

  @Get('buckets/:bucket')
  @ApiOperation({
    summary: 'List objects in bucket',
    description: 'Lists all objects in a storage bucket',
  })
  @ApiParam({ name: 'bucket', description: 'Bucket name' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Object prefix filter' })
  @ApiResponse({ status: 200, description: 'List of objects' })
  async listObjects(
    @Param('bucket') bucket: string,
    @Query('prefix') prefix?: string,
  ) {
    this.logger.log(`Listing objects in bucket: ${bucket}, prefix: ${prefix || 'none'}`);
    const objects = await this.storageService.listObjects(bucket, prefix);
    return {
      bucket,
      prefix: prefix || null,
      count: objects.length,
      objects,
    };
  }

  @Get('buckets/:bucket/download/:objectName(*)')
  @ApiOperation({
    summary: 'Get presigned download URL',
    description: 'Returns a presigned URL for downloading an object',
  })
  @ApiParam({ name: 'bucket', description: 'Bucket name' })
  @ApiParam({ name: 'objectName', description: 'Object name (can include path)' })
  @ApiQuery({ name: 'expiry', required: false, description: 'URL expiry in seconds (default: 3600)' })
  @ApiResponse({ status: 200, description: 'Presigned URL' })
  async getDownloadUrl(
    @Param('bucket') bucket: string,
    @Param('objectName') objectName: string,
    @Query('expiry') expiry?: number,
  ) {
    const url = await this.storageService.getPresignedUrl(
      bucket,
      objectName,
      expiry || 3600,
    );

    return {
      bucket,
      objectName,
      url,
      expiresIn: expiry || 3600,
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Check storage health',
    description: 'Returns health status of MinIO storage',
  })
  @ApiResponse({ status: 200, description: 'Health status' })
  async checkHealth() {
    const healthy = await this.storageService.isHealthy();
    return {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
}
