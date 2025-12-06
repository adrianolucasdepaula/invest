/**
 * Frontend Logger - Centralized logging utility
 *
 * FASE 76.2: Observabilidade Frontend
 *
 * Features:
 * - 4 log levels (error, warn, info, debug)
 * - Automatic context (timestamp, page, user agent)
 * - Console output in development
 * - Future: send critical errors to backend
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  page?: string;
  userAgent?: string;
}

class FrontendLogger {
  private static instance: FrontendLogger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): FrontendLogger {
    if (!FrontendLogger.instance) {
      FrontendLogger.instance = new FrontendLogger();
    }
    return FrontendLogger.instance;
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry = this.formatEntry(level, message, context);

    // Console output based on level
    if (typeof console !== 'undefined') {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';

      switch (level) {
        case 'error':
          console.error(`[${entry.timestamp}] ERROR: ${message}${contextStr}`);
          break;
        case 'warn':
          console.warn(`[${entry.timestamp}] WARN: ${message}${contextStr}`);
          break;
        case 'info':
          console.info(`[${entry.timestamp}] INFO: ${message}${contextStr}`);
          break;
        case 'debug':
          if (this.isDevelopment) {
            console.debug(`[${entry.timestamp}] DEBUG: ${message}${contextStr}`);
          }
          break;
      }
    }

    // Future: Send critical errors to backend
    if (level === 'error') {
      this.sendToBackend(entry).catch(() => {
        // Silently fail - don't create infinite loop
      });
    }
  }

  /**
   * Log error message (always shown, sent to backend)
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Log warning message (always shown)
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log info message (always shown)
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log API error with standardized format
   */
  apiError(
    method: string,
    url: string,
    error: unknown,
    context?: LogContext
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.error(`API ${method} ${url} failed: ${errorMessage}`, {
      ...context,
      method,
      url,
      stack: errorStack,
    });
  }

  /**
   * Log React Query error
   */
  queryError(queryKey: unknown, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.error(`Query failed: ${errorMessage}`, {
      queryKey: JSON.stringify(queryKey),
      error: errorMessage,
    });
  }

  /**
   * Log React Query mutation error
   */
  mutationError(mutationKey: unknown, error: unknown, variables?: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.error(`Mutation failed: ${errorMessage}`, {
      mutationKey: JSON.stringify(mutationKey),
      variables: variables ? JSON.stringify(variables) : undefined,
      error: errorMessage,
    });
  }

  /**
   * Send critical errors to backend (future implementation)
   * Currently a no-op, ready for backend integration
   */
  private async sendToBackend(entry: LogEntry): Promise<void> {
    // TODO: Implement when backend logging endpoint is available
    // Example:
    // await fetch('/api/v1/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry),
    // });

    // For now, just store in sessionStorage for debugging
    if (typeof sessionStorage !== 'undefined') {
      try {
        const errors = JSON.parse(sessionStorage.getItem('frontend_errors') || '[]');
        errors.push(entry);
        // Keep only last 50 errors
        if (errors.length > 50) {
          errors.shift();
        }
        sessionStorage.setItem('frontend_errors', JSON.stringify(errors));
      } catch {
        // Silently fail
      }
    }
  }

  /**
   * Get stored errors from sessionStorage (for debugging)
   */
  getStoredErrors(): LogEntry[] {
    if (typeof sessionStorage !== 'undefined') {
      try {
        return JSON.parse(sessionStorage.getItem('frontend_errors') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Clear stored errors
   */
  clearStoredErrors(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('frontend_errors');
    }
  }
}

// Export singleton instance
export const logger = FrontendLogger.getInstance();

// Export type for external use
export type { LogLevel, LogContext, LogEntry };
