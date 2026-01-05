/**
 * Observability-Driven Testing - Trace Assertions
 *
 * Provides assertions for distributed traces, enabling testing of
 * cross-service behavior, latency requirements, and system health.
 *
 * Integrates with:
 * - Jaeger (distributed tracing)
 * - Tempo (Grafana's trace backend)
 * - OpenTelemetry
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @license FREE (Apache 2.0)
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: number;  // microseconds
  duration: number;   // microseconds
  status: SpanStatus;
  tags: Record<string, string | number | boolean>;
  logs: SpanLog[];
}

export interface SpanLog {
  timestamp: number;
  fields: Record<string, string | number | boolean>;
}

export type SpanStatus = 'OK' | 'ERROR' | 'UNSET';

export interface Trace {
  traceId: string;
  spans: TraceSpan[];
  services: string[];
  startTime: number;
  endTime: number;
  duration: number;
}

export interface TraceConfig {
  jaegerEndpoint?: string;
  tempoEndpoint?: string;
  timeout?: number;  // ms
  pollInterval?: number;  // ms
}

export interface SpanAssertion {
  operationName?: string;
  serviceName?: string;
  minDuration?: number;  // ms
  maxDuration?: number;  // ms
  status?: SpanStatus;
  hasTag?: { key: string; value: string | number | boolean };
  hasError?: boolean;
}

export interface TraceAssertion {
  minSpans?: number;
  maxSpans?: number;
  containsService?: string;
  containsOperation?: string;
  maxDuration?: number;  // ms
  noErrors?: boolean;
}

// =============================================================================
// FINANCIAL SYSTEM SPECIFIC THRESHOLDS
// =============================================================================

/**
 * SLO thresholds for B3 AI Analysis Platform
 * Based on FASE 158 performance requirements
 */
export const FINANCIAL_SLO = {
  // API Response Times (p95)
  assets: {
    list: 300,      // GET /api/v1/assets
    detail: 400,    // GET /api/v1/assets/:ticker
    fundamentals: 500,
    prices: 600,
  },

  // Cross-validation (heavy operation)
  crossValidation: {
    single: 1000,   // Single ticker
    batch: 3000,    // Multiple tickers
  },

  // Database operations
  database: {
    simpleQuery: 50,
    complexQuery: 200,
    aggregation: 500,
  },

  // External service calls
  external: {
    scraper: 5000,  // Playwright scrapers
    apiCall: 2000,  // External APIs
    redis: 10,      // Cache operations
  },

  // WHEEL Strategy operations
  options: {
    chain: 600,
    greeks: 300,
    strategy: 1000,
  },
};

// =============================================================================
// TRACE CLIENT
// =============================================================================

class TraceClient {
  private config: Required<TraceConfig>;

  constructor(config: TraceConfig = {}) {
    this.config = {
      jaegerEndpoint: config.jaegerEndpoint || process.env.JAEGER_ENDPOINT || 'http://localhost:16686',
      tempoEndpoint: config.tempoEndpoint || process.env.TEMPO_ENDPOINT || 'http://localhost:3200',
      timeout: config.timeout || 30000,
      pollInterval: config.pollInterval || 1000,
    };
  }

  /**
   * Fetch trace by ID from Jaeger
   */
  async getTraceFromJaeger(traceId: string): Promise<Trace | null> {
    try {
      const response = await fetch(
        `${this.config.jaegerEndpoint}/api/traces/${traceId}`,
        { signal: AbortSignal.timeout(this.config.timeout) }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.parseJaegerTrace(data);
    } catch (error) {
      console.error(`Failed to fetch trace ${traceId} from Jaeger:`, error);
      return null;
    }
  }

  /**
   * Fetch trace by ID from Tempo
   */
  async getTraceFromTempo(traceId: string): Promise<Trace | null> {
    try {
      const response = await fetch(
        `${this.config.tempoEndpoint}/api/traces/${traceId}`,
        { signal: AbortSignal.timeout(this.config.timeout) }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.parseTempoTrace(data);
    } catch (error) {
      console.error(`Failed to fetch trace ${traceId} from Tempo:`, error);
      return null;
    }
  }

  /**
   * Search traces by service and operation
   */
  async searchTraces(params: {
    service: string;
    operation?: string;
    start?: Date;
    end?: Date;
    limit?: number;
  }): Promise<Trace[]> {
    const searchParams = new URLSearchParams({
      service: params.service,
      limit: String(params.limit || 20),
    });

    if (params.operation) {
      searchParams.set('operation', params.operation);
    }

    if (params.start) {
      searchParams.set('start', String(params.start.getTime() * 1000));
    }

    if (params.end) {
      searchParams.set('end', String(params.end.getTime() * 1000));
    }

    try {
      const response = await fetch(
        `${this.config.jaegerEndpoint}/api/traces?${searchParams}`,
        { signal: AbortSignal.timeout(this.config.timeout) }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data?.map((t: unknown) => this.parseJaegerTrace(t)) || [];
    } catch (error) {
      console.error('Failed to search traces:', error);
      return [];
    }
  }

  /**
   * Wait for trace to appear (eventually consistent)
   */
  async waitForTrace(
    traceId: string,
    timeout: number = this.config.timeout
  ): Promise<Trace | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const trace = await this.getTraceFromJaeger(traceId);
      if (trace && trace.spans.length > 0) {
        return trace;
      }
      await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
    }

    return null;
  }

  /**
   * Parse Jaeger trace format
   */
  private parseJaegerTrace(data: unknown): Trace {
    const jaegerData = data as { data: Array<{ traceID: string; spans: unknown[] }> };
    const traceData = jaegerData.data?.[0] || data;
    const jaegerTrace = traceData as {
      traceID: string;
      spans: Array<{
        spanID: string;
        parentSpanID?: string;
        operationName: string;
        startTime: number;
        duration: number;
        tags: Array<{ key: string; value: unknown }>;
        logs: Array<{ timestamp: number; fields: Array<{ key: string; value: unknown }> }>;
        processID: string;
      }>;
      processes: Record<string, { serviceName: string }>;
    };

    const spans: TraceSpan[] = (jaegerTrace.spans || []).map(s => ({
      traceId: jaegerTrace.traceID,
      spanId: s.spanID,
      parentSpanId: s.parentSpanID,
      operationName: s.operationName,
      serviceName: jaegerTrace.processes?.[s.processID]?.serviceName || 'unknown',
      startTime: s.startTime,
      duration: s.duration,
      status: this.getSpanStatus(s.tags),
      tags: this.parseTags(s.tags),
      logs: this.parseLogs(s.logs),
    }));

    const services = [...new Set(spans.map(s => s.serviceName))];
    const startTime = Math.min(...spans.map(s => s.startTime));
    const endTime = Math.max(...spans.map(s => s.startTime + s.duration));

    return {
      traceId: jaegerTrace.traceID,
      spans,
      services,
      startTime,
      endTime,
      duration: endTime - startTime,
    };
  }

  /**
   * Parse Tempo trace format (similar to Jaeger)
   */
  private parseTempoTrace(data: unknown): Trace {
    // Tempo uses similar format to Jaeger
    return this.parseJaegerTrace(data);
  }

  private getSpanStatus(tags: Array<{ key: string; value: unknown }>): SpanStatus {
    const errorTag = tags.find(t => t.key === 'error');
    if (errorTag && errorTag.value === true) {
      return 'ERROR';
    }

    const statusTag = tags.find(t => t.key === 'otel.status_code');
    if (statusTag) {
      return statusTag.value as SpanStatus;
    }

    return 'OK';
  }

  private parseTags(tags: Array<{ key: string; value: unknown }>): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    for (const tag of tags || []) {
      result[tag.key] = tag.value as string | number | boolean;
    }
    return result;
  }

  private parseLogs(logs: Array<{ timestamp: number; fields: Array<{ key: string; value: unknown }> }>): SpanLog[] {
    return (logs || []).map(log => ({
      timestamp: log.timestamp,
      fields: this.parseTags(log.fields),
    }));
  }
}

// =============================================================================
// TRACE ASSERTIONS CLASS
// =============================================================================

export class TraceAssertions {
  private client: TraceClient;

  constructor(config?: TraceConfig) {
    this.client = new TraceClient(config);
  }

  /**
   * Assert trace exists and matches criteria
   */
  async assertTrace(traceId: string, assertion: TraceAssertion): Promise<AssertionResult> {
    const trace = await this.client.waitForTrace(traceId);

    if (!trace) {
      return {
        passed: false,
        error: `Trace ${traceId} not found`,
        details: { traceId },
      };
    }

    const errors: string[] = [];

    if (assertion.minSpans !== undefined && trace.spans.length < assertion.minSpans) {
      errors.push(`Expected at least ${assertion.minSpans} spans, got ${trace.spans.length}`);
    }

    if (assertion.maxSpans !== undefined && trace.spans.length > assertion.maxSpans) {
      errors.push(`Expected at most ${assertion.maxSpans} spans, got ${trace.spans.length}`);
    }

    if (assertion.containsService && !trace.services.includes(assertion.containsService)) {
      errors.push(`Service ${assertion.containsService} not found in trace`);
    }

    if (assertion.containsOperation) {
      const hasOperation = trace.spans.some(s => s.operationName === assertion.containsOperation);
      if (!hasOperation) {
        errors.push(`Operation ${assertion.containsOperation} not found in trace`);
      }
    }

    if (assertion.maxDuration !== undefined) {
      const durationMs = trace.duration / 1000;
      if (durationMs > assertion.maxDuration) {
        errors.push(`Trace duration ${durationMs}ms exceeds max ${assertion.maxDuration}ms`);
      }
    }

    if (assertion.noErrors) {
      const errorSpans = trace.spans.filter(s => s.status === 'ERROR');
      if (errorSpans.length > 0) {
        errors.push(`Found ${errorSpans.length} spans with errors`);
      }
    }

    return {
      passed: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      details: {
        traceId,
        spanCount: trace.spans.length,
        services: trace.services,
        duration: trace.duration / 1000,
      },
    };
  }

  /**
   * Assert specific span matches criteria
   */
  async assertSpan(traceId: string, assertion: SpanAssertion): Promise<AssertionResult> {
    const trace = await this.client.waitForTrace(traceId);

    if (!trace) {
      return {
        passed: false,
        error: `Trace ${traceId} not found`,
        details: { traceId },
      };
    }

    // Find matching span
    let matchingSpans = trace.spans;

    if (assertion.operationName) {
      matchingSpans = matchingSpans.filter(s => s.operationName === assertion.operationName);
    }

    if (assertion.serviceName) {
      matchingSpans = matchingSpans.filter(s => s.serviceName === assertion.serviceName);
    }

    if (matchingSpans.length === 0) {
      return {
        passed: false,
        error: `No spans matching criteria found`,
        details: { assertion, availableSpans: trace.spans.map(s => s.operationName) },
      };
    }

    const span = matchingSpans[0];
    const errors: string[] = [];

    // Duration assertions
    const durationMs = span.duration / 1000;

    if (assertion.minDuration !== undefined && durationMs < assertion.minDuration) {
      errors.push(`Span duration ${durationMs}ms below min ${assertion.minDuration}ms`);
    }

    if (assertion.maxDuration !== undefined && durationMs > assertion.maxDuration) {
      errors.push(`Span duration ${durationMs}ms exceeds max ${assertion.maxDuration}ms`);
    }

    // Status assertion
    if (assertion.status !== undefined && span.status !== assertion.status) {
      errors.push(`Expected status ${assertion.status}, got ${span.status}`);
    }

    // Tag assertion
    if (assertion.hasTag) {
      const tagValue = span.tags[assertion.hasTag.key];
      if (tagValue !== assertion.hasTag.value) {
        errors.push(`Tag ${assertion.hasTag.key} expected ${assertion.hasTag.value}, got ${tagValue}`);
      }
    }

    // Error assertion
    if (assertion.hasError !== undefined) {
      const hasError = span.status === 'ERROR';
      if (assertion.hasError !== hasError) {
        errors.push(`Expected hasError=${assertion.hasError}, got ${hasError}`);
      }
    }

    return {
      passed: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      details: {
        spanId: span.spanId,
        operationName: span.operationName,
        duration: durationMs,
        status: span.status,
      },
    };
  }

  /**
   * Assert database query performance
   */
  async assertDatabaseQuery(
    traceId: string,
    queryType: keyof typeof FINANCIAL_SLO.database = 'simpleQuery'
  ): Promise<AssertionResult> {
    return this.assertSpan(traceId, {
      operationName: 'database.query',
      maxDuration: FINANCIAL_SLO.database[queryType],
    });
  }

  /**
   * Assert API endpoint performance against SLOs
   */
  async assertApiEndpoint(
    traceId: string,
    endpoint: 'assets.list' | 'assets.detail' | 'assets.fundamentals' | 'crossValidation.single'
  ): Promise<AssertionResult> {
    const [category, operation] = endpoint.split('.') as ['assets' | 'crossValidation', string];
    const threshold = (FINANCIAL_SLO[category] as Record<string, number>)[operation];

    return this.assertTrace(traceId, {
      maxDuration: threshold,
      noErrors: true,
    });
  }

  /**
   * Assert end-to-end flow
   */
  async assertE2EFlow(
    traceId: string,
    expectedServices: string[],
    maxDuration: number
  ): Promise<AssertionResult> {
    const trace = await this.client.waitForTrace(traceId);

    if (!trace) {
      return {
        passed: false,
        error: `Trace ${traceId} not found`,
        details: { traceId },
      };
    }

    const errors: string[] = [];

    // Check all expected services are present
    for (const service of expectedServices) {
      if (!trace.services.includes(service)) {
        errors.push(`Expected service ${service} not found in trace`);
      }
    }

    // Check duration
    const durationMs = trace.duration / 1000;
    if (durationMs > maxDuration) {
      errors.push(`E2E duration ${durationMs}ms exceeds max ${maxDuration}ms`);
    }

    // Check for errors
    const errorSpans = trace.spans.filter(s => s.status === 'ERROR');
    if (errorSpans.length > 0) {
      errors.push(`Found ${errorSpans.length} errors in E2E flow`);
    }

    return {
      passed: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      details: {
        traceId,
        services: trace.services,
        duration: durationMs,
        spanCount: trace.spans.length,
        errorCount: errorSpans.length,
      },
    };
  }

  /**
   * Get trace client for advanced queries
   */
  getClient(): TraceClient {
    return this.client;
  }
}

// =============================================================================
// ASSERTION RESULT
// =============================================================================

export interface AssertionResult {
  passed: boolean;
  error?: string;
  details: Record<string, unknown>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create trace assertions instance with default config
 */
export function createTraceAssertions(config?: TraceConfig): TraceAssertions {
  return new TraceAssertions(config);
}

/**
 * Extract trace ID from response header
 */
export function extractTraceId(headers: Headers | Record<string, string>): string | null {
  const headerMap = headers instanceof Headers
    ? Object.fromEntries(headers.entries())
    : headers;

  // Try various trace ID header formats
  const traceIdHeaders = [
    'x-trace-id',
    'traceparent',
    'x-b3-traceid',
    'uber-trace-id',
  ];

  for (const header of traceIdHeaders) {
    const value = headerMap[header.toLowerCase()];
    if (value) {
      // Parse W3C traceparent format: version-traceId-spanId-flags
      if (header === 'traceparent') {
        const parts = value.split('-');
        return parts[1] || null;
      }
      return value;
    }
  }

  return null;
}

/**
 * Generate test assertion summary
 */
export function generateAssertionSummary(results: AssertionResult[]): {
  total: number;
  passed: number;
  failed: number;
  errors: string[];
} {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const errors = results
    .filter(r => !r.passed && r.error)
    .map(r => r.error as string);

  return {
    total: results.length,
    passed,
    failed,
    errors,
  };
}

// =============================================================================
// VITEST/JEST MATCHERS
// =============================================================================

/**
 * Custom matcher for trace assertions
 * Usage: expect(traceId).toHaveValidTrace({ maxDuration: 500 })
 */
export const traceMatchers = {
  async toHaveValidTrace(
    received: string,
    assertion: TraceAssertion
  ): Promise<{ pass: boolean; message: () => string }> {
    const assertions = new TraceAssertions();
    const result = await assertions.assertTrace(received, assertion);

    return {
      pass: result.passed,
      message: () =>
        result.passed
          ? `Trace ${received} passed all assertions`
          : `Trace ${received} failed: ${result.error}`,
    };
  },

  async toHaveValidSpan(
    received: string,
    assertion: SpanAssertion
  ): Promise<{ pass: boolean; message: () => string }> {
    const assertions = new TraceAssertions();
    const result = await assertions.assertSpan(received, assertion);

    return {
      pass: result.passed,
      message: () =>
        result.passed
          ? `Span in trace ${received} passed all assertions`
          : `Span in trace ${received} failed: ${result.error}`,
    };
  },

  async toMeetSLO(
    received: string,
    endpoint: 'assets.list' | 'assets.detail' | 'assets.fundamentals' | 'crossValidation.single'
  ): Promise<{ pass: boolean; message: () => string }> {
    const assertions = new TraceAssertions();
    const result = await assertions.assertApiEndpoint(received, endpoint);

    return {
      pass: result.passed,
      message: () =>
        result.passed
          ? `Trace ${received} meets SLO for ${endpoint}`
          : `Trace ${received} fails SLO for ${endpoint}: ${result.error}`,
    };
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  TraceClient,
};

export default TraceAssertions;
