import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TelemetryService } from './telemetry.service';
import { SpanKind } from '@opentelemetry/api';

/**
 * TracingInterceptor - Interceptor para tracing automático de requisições
 *
 * FASE 76.3: Distributed Tracing Completo
 *
 * Funcionalidades:
 * - Cria spans para cada requisição HTTP
 * - Registra duração e status
 * - Adiciona atributos de contexto (user, route, method)
 * - Registra erros automaticamente
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private readonly telemetryService: TelemetryService) {}

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

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;

        // Registrar métricas
        this.telemetryService.recordRequest(method, routePath, statusCode);
        this.telemetryService.recordRequestDuration(method, routePath, duration);

        // Adicionar evento de conclusão
        this.telemetryService.addSpanEvent('request.complete', {
          duration_ms: duration,
          status_code: statusCode,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Registrar erro
        this.telemetryService.recordError(error);
        this.telemetryService.recordRequest(method, routePath, error.status || 500);
        this.telemetryService.recordRequestDuration(method, routePath, duration);

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
