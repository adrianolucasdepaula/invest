import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * GlobalExceptionFilter - FASE 76 (Observabilidade)
 *
 * Captura TODAS as exceções não tratadas e:
 * 1. Loga com contexto completo (stack trace, request info)
 * 2. Retorna resposta padronizada ao cliente
 * 3. Classifica erros por categoria para métricas
 *
 * @see CLAUDE.md - Development Principle #5: Observabilidade e Rastreabilidade
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine HTTP status code
    const status = this.getHttpStatus(exception);

    // Extract error details
    const errorDetails = this.extractErrorDetails(exception);

    // Generate correlation ID for request tracing
    const correlationId = this.getCorrelationId(request);

    // Log the exception with full context
    this.logException(exception, request, status, correlationId, errorDetails);

    // Send standardized error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      error: errorDetails.type,
      message: errorDetails.message,
      // Only include details in development
      ...(process.env.NODE_ENV !== 'production' && {
        details: errorDetails.details,
        stack: errorDetails.stack,
      }),
    });
  }

  /**
   * Determines the HTTP status code based on exception type
   */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof QueryFailedError) {
      // Database constraint violations
      const message = (exception as QueryFailedError).message || '';
      if (message.includes('duplicate key') || message.includes('unique constraint')) {
        return HttpStatus.CONFLICT;
      }
      if (message.includes('foreign key constraint')) {
        return HttpStatus.BAD_REQUEST;
      }
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extracts structured error details from exception
   */
  private extractErrorDetails(exception: unknown): {
    type: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  } {
    // HttpException (NestJS standard)
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as Record<string, unknown>).message || exception.message;

      return {
        type: exception.name,
        message: Array.isArray(message) ? message.join(', ') : String(message),
        details: typeof response === 'object' ? (response as Record<string, unknown>) : undefined,
        stack: exception.stack,
      };
    }

    // TypeORM QueryFailedError
    if (exception instanceof QueryFailedError) {
      return {
        type: 'DatabaseError',
        message: 'Database operation failed',
        details: {
          query: (exception as QueryFailedError & { query?: string }).query,
          parameters: (exception as QueryFailedError & { parameters?: unknown[] }).parameters,
          driverError: (exception as QueryFailedError).message,
        },
        stack: exception.stack,
      };
    }

    // Standard Error
    if (exception instanceof Error) {
      return {
        type: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    // Unknown error type
    return {
      type: 'UnknownError',
      message: 'An unexpected error occurred',
      details: { raw: String(exception) },
    };
  }

  /**
   * Gets or generates correlation ID for request tracing
   */
  private getCorrelationId(request: Request): string {
    // Check if correlation ID was passed in header
    const existingId = request.headers['x-correlation-id'] as string;
    if (existingId) {
      return existingId;
    }

    // Generate new correlation ID
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Logs exception with full context for troubleshooting
   */
  private logException(
    exception: unknown,
    request: Request,
    status: number,
    correlationId: string,
    errorDetails: {
      type: string;
      message: string;
      details?: Record<string, unknown>;
      stack?: string;
    },
  ): void {
    const logContext = {
      correlationId,
      method: request.method,
      url: request.url,
      path: request.path,
      params: request.params,
      query: request.query,
      body: this.sanitizeBody(request.body),
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: (request as Request & { user?: { id: string } }).user?.id || 'anonymous',
      statusCode: status,
      errorType: errorDetails.type,
    };

    // Log level based on status code
    if (status >= 500) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} - ${status} - ${errorDetails.message}`,
        errorDetails.stack,
        JSON.stringify(logContext, null, 2),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${correlationId}] ${request.method} ${request.url} - ${status} - ${errorDetails.message}`,
        JSON.stringify(logContext),
      );
    } else {
      this.logger.log(
        `[${correlationId}] ${request.method} ${request.url} - ${status} - ${errorDetails.message}`,
      );
    }
  }

  /**
   * Removes sensitive data from request body before logging
   */
  private sanitizeBody(
    body: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!body) return undefined;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
