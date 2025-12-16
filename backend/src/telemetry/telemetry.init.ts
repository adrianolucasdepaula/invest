/**
 * OpenTelemetry SDK Initialization
 *
 * FASE 76.3: Distributed Tracing Completo
 *
 * IMPORTANTE: Este arquivo DEVE ser importado ANTES de qualquer outro código
 * para garantir que a instrumentação capture todas as requisições.
 *
 * Funcionalidades:
 * - Traces (distributed tracing)
 * - Metrics (métricas de aplicação)
 * - Logs (com correlação de traces)
 * - Auto-instrumentação (HTTP, Express, PostgreSQL, Redis)
 * - Exporters OTLP (compatível com Jaeger, Tempo, Grafana)
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import {
  TraceIdRatioBasedSampler,
  AlwaysOnSampler,
  ParentBasedSampler,
} from '@opentelemetry/sdk-trace-base';

// Configuração de debug (apenas em desenvolvimento)
if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Configuração do Resource (identifica a aplicação)
const resource = resourceFromAttributes({
  [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'invest-backend',
  [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

// Endpoint OTLP (Jaeger, Tempo, ou collector)
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

// PERFORMANCE OPTIMIZATION: Configure trace sampling
// Development: 10% sampling to reduce CPU overhead
// Production: 100% sampling for complete observability
const samplingRatio = process.env.NODE_ENV === 'production'
  ? 1.0  // 100% in production
  : parseFloat(process.env.OTEL_SAMPLING_RATIO || '0.1');  // 10% default in dev

const sampler = new ParentBasedSampler({
  root: samplingRatio >= 1.0
    ? new AlwaysOnSampler()
    : new TraceIdRatioBasedSampler(samplingRatio),
});

// Trace Exporter
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
    : {},
});

// Metrics Exporter
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
    : {},
});

// Log Exporter
const logExporter = new OTLPLogExporter({
  url: `${otlpEndpoint}/v1/logs`,
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
    : {},
});

// SDK Node com configuração completa
const sdk = new NodeSDK({
  resource,
  sampler, // PERFORMANCE: Use sampling to reduce CPU overhead
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export metrics every 60 seconds
  }),
  logRecordProcessor: new BatchLogRecordProcessor(logExporter),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Configurações específicas por instrumentação
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (request) => {
          // Ignorar health checks e métricas
          const url = request.url || '';
          return url.includes('/health') || url.includes('/metrics') || url.includes('/favicon');
        },
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
        enhancedDatabaseReporting: true, // Include query parameters
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Desabilitar file system (muito ruidoso)
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false, // Desabilitar DNS (ruidoso)
      },
    }),
  ],
});

// Flag para verificar se telemetria está habilitada
export const isTelemetryEnabled = process.env.OTEL_ENABLED !== 'false';

// Inicializar SDK
export function initTelemetry(): void {
  if (!isTelemetryEnabled) {
    console.log('[Telemetry] OpenTelemetry DISABLED (OTEL_ENABLED=false)');
    return;
  }

  try {
    sdk.start();
    console.log('[Telemetry] OpenTelemetry SDK started successfully');
    console.log(`[Telemetry] Service: ${process.env.OTEL_SERVICE_NAME || 'invest-backend'}`);
    console.log(`[Telemetry] Exporting to: ${otlpEndpoint}`);
    console.log(`[Telemetry] Sampling ratio: ${(samplingRatio * 100).toFixed(0)}%`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('[Telemetry] SDK shut down successfully'))
        .catch((error) => console.error('[Telemetry] Error shutting down SDK', error))
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.error('[Telemetry] Failed to start OpenTelemetry SDK', error);
  }
}

// Exportar SDK para shutdown manual se necessário
export { sdk };
