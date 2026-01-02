import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { throwError } from 'rxjs';

/**
 * LoggingInterceptor - FASE 76 (Observabilidade)
 *
 * Intercepta TODAS as requisições HTTP e:
 * 1. Gera correlation ID para rastreabilidade
 * 2. Loga entrada da requisição
 * 3. Mede tempo de resposta
 * 4. Loga saída com métricas de performance
 *
 * @see CLAUDE.md - Development Principle #5: Observabilidade e Rastreabilidade
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate correlation ID
    const correlationId = this.getOrCreateCorrelationId(request);

    // Add correlation ID to response headers
    response.setHeader('X-Correlation-ID', correlationId);

    const { method, path } = request;
    const userAgent = request.headers['user-agent'] || 'unknown';
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userId = (request as Request & { user?: { id: string } }).user?.id || 'anonymous';

    const startTime = Date.now();

    // Log request entry
    this.logger.log(
      `[${correlationId}] --> ${method} ${path} | User: ${userId} | IP: ${ip} | UA: ${userAgent.substring(0, 50)}`,
    );

    // Log request body for non-GET requests (sanitized)
    if (method !== 'GET' && request.body && Object.keys(request.body).length > 0) {
      const sanitizedBody = this.sanitizeBody(request.body);
      this.logger.debug(`[${correlationId}] Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    // Log query params if present
    if (Object.keys(request.query).length > 0) {
      this.logger.debug(`[${correlationId}] Query Params: ${JSON.stringify(request.query)}`);
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log response with performance metrics
        const logMessage = `[${correlationId}] <-- ${method} ${path} | ${statusCode} | ${duration}ms`;

        // Warn if response is slow
        if (duration > 3000) {
          this.logger.warn(`${logMessage} [SLOW RESPONSE]`);
        } else if (duration > 1000) {
          this.logger.log(`${logMessage} [MODERATE]`);
        } else {
          this.logger.log(logMessage);
        }

        // Log response size for debugging
        if (data && typeof data === 'object') {
          const responseSize = this.getObjectSize(data);
          if (responseSize > 1000000) {
            // > 1MB
            this.logger.warn(
              `[${correlationId}] Large response: ${(responseSize / 1024 / 1024).toFixed(2)}MB`,
            );
          }
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Error is logged by GlobalExceptionFilter, just add timing here
        this.logger.debug(
          `[${correlationId}] <-- ${method} ${path} | ERROR | ${duration}ms | ${error.message}`,
        );

        return throwError(() => error);
      }),
    );
  }

  /**
   * Gets existing correlation ID from header or generates new one
   */
  private getOrCreateCorrelationId(request: Request): string {
    const existingId = request.headers['x-correlation-id'] as string;
    if (existingId) {
      return existingId;
    }

    // Generate new correlation ID: timestamp-random
    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Store in request for downstream use
    (request.headers as Record<string, string>)['x-correlation-id'] = newId;

    return newId;
  }

  /**
   * Removes sensitive data from request body before logging
   */
  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
      'creditCard',
      'cvv',
      'ssn',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Also check nested objects (one level deep)
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        const nested = sanitized[key] as Record<string, unknown>;
        for (const field of sensitiveFields) {
          if (nested[field]) {
            nested[field] = '[REDACTED]';
          }
        }
      }
    }

    return sanitized;
  }

  /**
   * Estimates object size in bytes (approximate)
   */
  private getObjectSize(obj: unknown): number {
    try {
      return JSON.stringify(obj).length;
    } catch {
      return 0;
    }
  }
}
