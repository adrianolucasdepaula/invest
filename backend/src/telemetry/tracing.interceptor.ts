import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TelemetryService } from './telemetry.service';
import { MetricsService } from '../metrics/metrics.service';

/**
 * TracingInterceptor - Interceptor para tracing automático de requisições
 *
 * FASE 76.3: Distributed Tracing Completo
 * FASE 130.1: Prometheus Metrics Integration
 *
 * Funcionalidades:
 * - Cria spans para cada requisição HTTP (OpenTelemetry)
 * - Registra métricas Prometheus (prom-client com prefixo invest_)
 * - Registra duração e status
 * - Adiciona atributos de contexto (user, route, method)
 * - Registra erros automaticamente
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly metricsService: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, route, user } = request;
    const routePath = route?.path || url;
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;

    const spanName = `${method} ${routePath}`;
    const startTime = Date.now();

    // Adiciona atributos ao span atual (criado pela auto-instrumentação HTTP)
    this.telemetryService.addSpanAttributes({
      'http.route': routePath,
      'http.method': method,
      'http.url': url,
      'controller.name': controllerName,
      'handler.name': handlerName,
      'user.id': user?.id,
      'user.email': user?.email,
    });

    this.telemetryService.addSpanEvent('request.start', {
      controller: controllerName,
      handler: handlerName,
    });

    // Increment active connections for Prometheus
    this.metricsService.incrementActiveConnections();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        const durationSeconds = duration / 1000;
        const statusCode = context.switchToHttp().getResponse().statusCode;

        // Registrar métricas OpenTelemetry (OTLP)
        this.telemetryService.recordRequest(method, routePath, statusCode);
        this.telemetryService.recordRequestDuration(method, routePath, duration);

        // Registrar métricas Prometheus (prom-client com prefixo invest_)
        this.metricsService.incrementHttpRequests(method, routePath, statusCode);
        this.metricsService.observeHttpDuration(method, routePath, statusCode, durationSeconds);
        this.metricsService.decrementActiveConnections();

        // Adicionar evento de conclusão
        this.telemetryService.addSpanEvent('request.complete', {
          duration_ms: duration,
          status_code: statusCode,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const durationSeconds = duration / 1000;
        const statusCode = error.status || 500;

        // Registrar erro OpenTelemetry
        this.telemetryService.recordError(error);
        this.telemetryService.recordRequest(method, routePath, statusCode);
        this.telemetryService.recordRequestDuration(method, routePath, duration);

        // Registrar erro Prometheus
        this.metricsService.incrementHttpRequests(method, routePath, statusCode);
        this.metricsService.observeHttpDuration(method, routePath, statusCode, durationSeconds);
        this.metricsService.decrementActiveConnections();

        this.telemetryService.addSpanEvent('request.error', {
          duration_ms: duration,
          error_name: error.name,
          error_message: error.message,
        });

        throw error;
      }),
    );
  }
}
