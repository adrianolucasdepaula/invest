/**
 * performanceMonitor - Widget Performance Monitoring
 *
 * Track and analyze TradingView widget performance.
 *
 * @module tradingview/utils/performanceMonitor
 * @version 1.0.0
 * @created 2025-11-20
 */

import type { WidgetPerformanceMetrics } from '../types';
import { PERFORMANCE_THRESHOLDS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export type PerformanceLevel = 'good' | 'moderate' | 'poor' | 'critical';

export interface PerformanceReport {
  /** Widget name */
  widgetName: string;
  /** Load duration (ms) */
  loadDuration: number;
  /** Performance level */
  level: PerformanceLevel;
  /** Timestamp */
  timestamp: number;
  /** Additional metrics */
  metrics?: {
    /** Time to first byte (if available) */
    ttfb?: number;
    /** Memory usage (if available) */
    memory?: number;
  };
}

export interface PerformanceStats {
  /** Total widgets monitored */
  totalWidgets: number;
  /** Average load duration */
  avgLoadDuration: number;
  /** Slowest widget */
  slowest: PerformanceReport | null;
  /** Fastest widget */
  fastest: PerformanceReport | null;
  /** Performance distribution */
  distribution: {
    good: number;
    moderate: number;
    poor: number;
    critical: number;
  };
}

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

/**
 * Performance monitor for TradingView widgets
 *
 * @example
 * ```ts
 * const monitor = PerformanceMonitor.getInstance();
 *
 * // Record widget load
 * monitor.recordWidget({
 *   widgetName: 'TickerTape',
 *   loadStart: performance.now(),
 *   loadEnd: performance.now() + 1500,
 *   loadDuration: 1500,
 *   timestamp: Date.now(),
 * });
 *
 * // Get stats
 * const stats = monitor.getStats();
 * console.log('Average load:', stats.avgLoadDuration, 'ms');
 * ```
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: Map<string, WidgetPerformanceMetrics[]> = new Map();

  private constructor() {
    // Singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record widget performance metrics
   */
  recordWidget(metrics: WidgetPerformanceMetrics): void {
    const { widgetName } = metrics;

    if (!this.metrics.has(widgetName)) {
      this.metrics.set(widgetName, []);
    }

    this.metrics.get(widgetName)!.push(metrics);

    // Log if performance is poor/critical
    const level = this.getPerformanceLevel(metrics.loadDuration || 0);
    if (level === 'poor' || level === 'critical') {
      console.warn(
        `[PerformanceMonitor] ${widgetName} loaded slowly (${metrics.loadDuration}ms) - ${level}`
      );
    }
  }

  /**
   * Get metrics for a specific widget
   */
  getWidgetMetrics(widgetName: string): WidgetPerformanceMetrics[] {
    return this.metrics.get(widgetName) || [];
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, WidgetPerformanceMetrics[]> {
    return new Map(this.metrics);
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const allMetrics: WidgetPerformanceMetrics[] = [];
    const reports: PerformanceReport[] = [];

    // Flatten all metrics
    for (const [widgetName, metrics] of this.metrics.entries()) {
      allMetrics.push(...metrics);

      // Create reports (use latest metric for each widget)
      const latestMetric = metrics[metrics.length - 1];
      if (latestMetric && latestMetric.loadDuration) {
        reports.push({
          widgetName,
          loadDuration: latestMetric.loadDuration,
          level: this.getPerformanceLevel(latestMetric.loadDuration),
          timestamp: latestMetric.timestamp,
        });
      }
    }

    // Calculate stats
    const totalWidgets = reports.length;
    const avgLoadDuration =
      totalWidgets > 0
        ? reports.reduce((sum, r) => sum + r.loadDuration, 0) / totalWidgets
        : 0;

    // Find slowest/fastest
    const sorted = [...reports].sort((a, b) => a.loadDuration - b.loadDuration);
    const slowest = sorted[sorted.length - 1] || null;
    const fastest = sorted[0] || null;

    // Distribution
    const distribution = {
      good: reports.filter((r) => r.level === 'good').length,
      moderate: reports.filter((r) => r.level === 'moderate').length,
      poor: reports.filter((r) => r.level === 'poor').length,
      critical: reports.filter((r) => r.level === 'critical').length,
    };

    return {
      totalWidgets,
      avgLoadDuration,
      slowest,
      fastest,
      distribution,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for a specific widget
   */
  clearWidget(widgetName: string): void {
    this.metrics.delete(widgetName);
  }

  /**
   * Get performance level from load duration
   */
  getPerformanceLevel(loadDuration: number): PerformanceLevel {
    if (loadDuration < PERFORMANCE_THRESHOLDS.good) {
      return 'good';
    } else if (loadDuration < PERFORMANCE_THRESHOLDS.moderate) {
      return 'moderate';
    } else if (loadDuration < PERFORMANCE_THRESHOLDS.poor) {
      return 'poor';
    } else {
      return 'critical';
    }
  }

  /**
   * Export metrics as JSON (for debugging)
   */
  exportJSON(): string {
    const data = {
      timestamp: Date.now(),
      stats: this.getStats(),
      metrics: Array.from(this.metrics.entries()).map(([widgetName, metrics]) => ({
        widgetName,
        metrics,
      })),
    };

    return JSON.stringify(data, null, 2);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get singleton instance (convenience function)
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  return PerformanceMonitor.getInstance();
}

/**
 * Record widget performance (convenience function)
 */
export function recordWidgetPerformance(metrics: WidgetPerformanceMetrics): void {
  getPerformanceMonitor().recordWidget(metrics);
}

/**
 * Get performance stats (convenience function)
 */
export function getPerformanceStats(): PerformanceStats {
  return getPerformanceMonitor().getStats();
}

/**
 * Format duration to human-readable string
 *
 * @example
 * ```ts
 * formatDuration(1500) // "1.50s"
 * formatDuration(500) // "500ms"
 * ```
 */
export function formatDuration(durationMs: number): string {
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
  return `${Math.round(durationMs)}ms`;
}

/**
 * Get performance color for UI (based on level)
 */
export function getPerformanceColor(level: PerformanceLevel): string {
  const colors = {
    good: '#26a69a',
    moderate: '#ffa726',
    poor: '#ef6c00',
    critical: '#ef5350',
  };
  return colors[level];
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(report: PerformanceReport): void {
  const color = getPerformanceColor(report.level);
  const duration = formatDuration(report.loadDuration);

  console.log(
    `%c[Performance] ${report.widgetName}: ${duration} (${report.level})`,
    `color: ${color}; font-weight: bold;`
  );
}

/**
 * Log performance stats to console
 */
export function logPerformanceStats(): void {
  const stats = getPerformanceStats();

  console.group('[Performance Stats]');
  console.log('Total widgets:', stats.totalWidgets);
  console.log('Average load:', formatDuration(stats.avgLoadDuration));

  if (stats.slowest) {
    console.log(
      'Slowest:',
      stats.slowest.widgetName,
      formatDuration(stats.slowest.loadDuration)
    );
  }

  if (stats.fastest) {
    console.log(
      'Fastest:',
      stats.fastest.widgetName,
      formatDuration(stats.fastest.loadDuration)
    );
  }

  console.log('Distribution:', stats.distribution);
  console.groupEnd();
}

// ============================================================================
// EXPORT
// ============================================================================

const performanceMonitorUtils = {
  PerformanceMonitor,
  getPerformanceMonitor,
  recordWidgetPerformance,
  getPerformanceStats,
  formatDuration,
  getPerformanceColor,
  logPerformanceReport,
  logPerformanceStats,
};

export default performanceMonitorUtils;
