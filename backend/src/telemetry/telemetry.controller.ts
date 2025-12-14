import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TelemetryService } from './telemetry.service';

/**
 * DTO for frontend log context
 */
class LogContextDto {
  [key: string]: unknown;
}

/**
 * DTO for frontend error/log entry
 */
class FrontendLogDto {
  @IsString()
  level: 'error' | 'warn' | 'info' | 'debug';

  @IsString()
  message: string;

  @IsString()
  timestamp: string;

  @IsOptional()
  @IsObject()
  context?: LogContextDto;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

/**
 * DTO for batch of frontend logs
 */
class FrontendLogBatchDto {
  @ValidateNested({ each: true })
  @Type(() => FrontendLogDto)
  logs: FrontendLogDto[];
}

/**
 * TelemetryController - Receives frontend errors and logs
 *
 * FASE 76.4: Frontend Error Reporting
 *
 * Endpoints:
 * - POST /api/v1/telemetry/frontend-error - Single error
 * - POST /api/v1/telemetry/frontend-logs - Batch of logs
 */
@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * Receive a single frontend error
   */
  @Post('frontend-error')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Report frontend error',
    description: 'Receives and logs a single error from the frontend application',
  })
  @ApiBody({ type: FrontendLogDto })
  @ApiResponse({ status: 202, description: 'Error accepted for processing' })
  async reportFrontendError(@Body() errorDto: FrontendLogDto): Promise<{ status: string }> {
    this.logger.warn(`[FRONTEND ${errorDto.level.toUpperCase()}] ${errorDto.message}`, {
      page: errorDto.page,
      userAgent: errorDto.userAgent,
      context: errorDto.context,
      timestamp: errorDto.timestamp,
    });

    // Record metric for frontend errors
    if (errorDto.level === 'error') {
      this.telemetryService.addSpanEvent('frontend_error', {
        message: errorDto.message,
        page: errorDto.page || 'unknown',
        ...this.sanitizeContext(errorDto.context),
      });
    }

    return { status: 'accepted' };
  }

  /**
   * Receive batch of frontend logs
   */
  @Post('frontend-logs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Report frontend logs batch',
    description: 'Receives and logs a batch of logs from the frontend application',
  })
  @ApiBody({ type: FrontendLogBatchDto })
  @ApiResponse({ status: 202, description: 'Logs accepted for processing' })
  async reportFrontendLogs(@Body() batchDto: FrontendLogBatchDto): Promise<{ status: string; count: number }> {
    const { logs } = batchDto;

    for (const log of logs) {
      const logMethod = this.getLogMethod(log.level);
      logMethod.call(this.logger, `[FRONTEND ${log.level.toUpperCase()}] ${log.message}`, {
        page: log.page,
        context: log.context,
        timestamp: log.timestamp,
      });
    }

    const errorCount = logs.filter((l) => l.level === 'error').length;
    if (errorCount > 0) {
      this.telemetryService.addSpanEvent('frontend_errors_batch', {
        total: logs.length,
        errors: errorCount,
      });
    }

    return { status: 'accepted', count: logs.length };
  }

  /**
   * Get the appropriate logger method based on level
   */
  private getLogMethod(level: string): (...args: unknown[]) => void {
    switch (level) {
      case 'error':
        return this.logger.error.bind(this.logger);
      case 'warn':
        return this.logger.warn.bind(this.logger);
      case 'debug':
        return this.logger.debug.bind(this.logger);
      default:
        return this.logger.log.bind(this.logger);
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context?: LogContextDto): Record<string, unknown> {
    if (!context) return {};

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard', 'cvv', 'ssn'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
