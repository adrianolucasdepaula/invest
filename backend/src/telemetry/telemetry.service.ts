import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  trace,
  context,
  SpanStatusCode,
  Span,
  SpanKind,
  Attributes,
  Tracer,
  metrics,
  Counter,
  Histogram,
  Gauge,
} from '@opentelemetry/api';
import { isTelemetryEnabled } from './telemetry.init';

/**
 * TelemetryService - Serviço para traces e métricas customizados
 *
 * FASE 76.3: Distributed Tracing Completo
 *
 * Funcionalidades:
 * - Criação de spans customizados
 * - Métricas de negócio (contadores, histogramas, gauges)
 * - Context propagation
 * - Error recording
 */
@Injectable()
export class TelemetryService implements OnModuleInit {
  private tracer: Tracer;

  // Métricas de negócio
  private requestCounter: Counter;
  private requestDuration: Histogram;
  private activeRequests: Gauge;
  private analysisCounter: Counter;
  private scraperDuration: Histogram;
  private queueJobsCounter: Counter;
  private dbQueryDuration: Histogram;
  private cacheHitCounter: Counter;
  private cacheMissCounter: Counter;

  onModuleInit(): void {
    if (!isTelemetryEnabled) {
      return;
    }

    // Inicializar tracer
    this.tracer = trace.getTracer('invest-backend', '1.0.0');

    // Inicializar métricas
    const meter = metrics.getMeter('invest-backend', '1.0.0');

    // Request metrics
    this.requestCounter = meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    });

    this.requestDuration = meter.createHistogram('http_request_duration_ms', {
      description: 'HTTP request duration in milliseconds',
      unit: 'ms',
    });

    this.activeRequests = meter.createGauge('http_active_requests', {
      description: 'Number of active HTTP requests',
    });

    // Business metrics
    this.analysisCounter = meter.createCounter('analysis_total', {
      description: 'Total number of analyses performed',
    });

    this.scraperDuration = meter.createHistogram('scraper_duration_ms', {
      description: 'Scraper execution duration in milliseconds',
      unit: 'ms',
    });

    this.queueJobsCounter = meter.createCounter('queue_jobs_total', {
      description: 'Total number of queue jobs processed',
    });

    // Database metrics
    this.dbQueryDuration = meter.createHistogram('db_query_duration_ms', {
      description: 'Database query duration in milliseconds',
      unit: 'ms',
    });

    // Cache metrics
    this.cacheHitCounter = meter.createCounter('cache_hits_total', {
      description: 'Total number of cache hits',
    });

    this.cacheMissCounter = meter.createCounter('cache_misses_total', {
      description: 'Total number of cache misses',
    });
  }

  /**
   * Cria um span para rastrear uma operação
   */
  startSpan(
    name: string,
    options?: {
      kind?: SpanKind;
      attributes?: Attributes;
    },
  ): Span {
    if (!isTelemetryEnabled) {
      return trace.getTracer('noop').startSpan('noop');
    }

    return this.tracer.startSpan(name, {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    });
  }

  /**
   * Executa uma função dentro de um span
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: {
      kind?: SpanKind;
      attributes?: Attributes;
    },
  ): Promise<T> {
    if (!isTelemetryEnabled) {
      return fn(trace.getTracer('noop').startSpan('noop'));
    }

    const span = this.startSpan(name, options);

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return fn(span);
      });
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Adiciona atributos ao span atual
   */
  addSpanAttributes(attributes: Attributes): void {
    if (!isTelemetryEnabled) return;

    const span = trace.getSpan(context.active());
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Registra um evento no span atual
   */
  addSpanEvent(name: string, attributes?: Attributes): void {
    if (!isTelemetryEnabled) return;

    const span = trace.getSpan(context.active());
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Marca o span atual como erro
   */
  recordError(error: Error): void {
    if (!isTelemetryEnabled) return;

    const span = trace.getSpan(context.active());
    if (span) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Obtém o trace ID atual
   */
  getCurrentTraceId(): string | undefined {
    if (!isTelemetryEnabled) return undefined;

    const span = trace.getSpan(context.active());
    return span?.spanContext().traceId;
  }

  /**
   * Obtém o span ID atual
   */
  getCurrentSpanId(): string | undefined {
    if (!isTelemetryEnabled) return undefined;

    const span = trace.getSpan(context.active());
    return span?.spanContext().spanId;
  }

  // =============== Métricas de Request ===============

  recordRequest(method: string, route: string, statusCode: number): void {
    if (!isTelemetryEnabled) return;

    this.requestCounter.add(1, {
      method,
      route,
      status_code: statusCode.toString(),
    });
  }

  recordRequestDuration(method: string, route: string, durationMs: number): void {
    if (!isTelemetryEnabled) return;

    this.requestDuration.record(durationMs, {
      method,
      route,
    });
  }

  setActiveRequests(count: number): void {
    if (!isTelemetryEnabled) return;

    this.activeRequests.record(count);
  }

  // =============== Métricas de Negócio ===============

  recordAnalysis(type: string, ticker: string, status: 'success' | 'failure'): void {
    if (!isTelemetryEnabled) return;

    this.analysisCounter.add(1, {
      type,
      ticker,
      status,
    });
  }

  recordScraperDuration(source: string, durationMs: number, status: 'success' | 'failure'): void {
    if (!isTelemetryEnabled) return;

    this.scraperDuration.record(durationMs, {
      source,
      status,
    });
  }

  recordQueueJob(queue: string, job: string, status: 'completed' | 'failed'): void {
    if (!isTelemetryEnabled) return;

    this.queueJobsCounter.add(1, {
      queue,
      job,
      status,
    });
  }

  // =============== Métricas de Database ===============

  recordDbQuery(operation: string, table: string, durationMs: number): void {
    if (!isTelemetryEnabled) return;

    this.dbQueryDuration.record(durationMs, {
      operation,
      table,
    });
  }

  // =============== Métricas de Cache ===============

  recordCacheHit(cache: string, key: string): void {
    if (!isTelemetryEnabled) return;

    this.cacheHitCounter.add(1, {
      cache,
      key_pattern: this.normalizeKeyPattern(key),
    });
  }

  recordCacheMiss(cache: string, key: string): void {
    if (!isTelemetryEnabled) return;

    this.cacheMissCounter.add(1, {
      cache,
      key_pattern: this.normalizeKeyPattern(key),
    });
  }

  private normalizeKeyPattern(key: string): string {
    // Remove IDs específicos para agrupar métricas
    return key.replace(/[a-f0-9-]{36}/gi, '{id}').replace(/\d+/g, '{n}');
  }
}
