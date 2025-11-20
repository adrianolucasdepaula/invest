/**
 * useTradingViewWidget - Generic Hook for TradingView Widgets
 *
 * Reusable hook for loading and managing all TradingView widgets.
 *
 * Features:
 * - Automatic script loading (singleton pattern)
 * - Widget lifecycle management (create/destroy)
 * - Performance monitoring
 * - Error handling
 * - SSR-safe (Next.js)
 *
 * @module tradingview/hooks/useTradingViewWidget
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WidgetLoadingStatus, WidgetPerformanceMetrics } from '../types';
import {
  TRADINGVIEW_SCRIPT_URL,
  WIDGET_LOAD_TIMEOUT,
  ERROR_MESSAGES,
} from '../constants';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Hook configuration options
 */
export interface UseTradingViewWidgetOptions<TConfig = any> {
  /** Widget name (for logging/debugging) */
  widgetName: string;
  /** Container ID (auto-generated if not provided) */
  containerId?: string;
  /** Widget configuration object */
  widgetConfig: TConfig;
  /** Enable lazy loading (widget won't load until visible) */
  lazyLoad?: boolean;
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom load success handler */
  onLoad?: () => void;
}

/**
 * Hook return value
 */
export interface UseTradingViewWidgetReturn {
  /** Container ID for the widget */
  containerId: string;
  /** Loading status */
  status: WidgetLoadingStatus;
  /** Error (if any) */
  error: Error | null;
  /** Performance metrics (if enabled) */
  metrics: WidgetPerformanceMetrics | null;
  /** Reload widget manually */
  reload: () => void;
}

// ============================================================================
// SCRIPT LOADING (SINGLETON)
// ============================================================================

let scriptLoadingPromise: Promise<void> | null = null;
let scriptLoaded = false;

/**
 * Load TradingView script (singleton pattern - only loads once)
 */
function loadTradingViewScript(): Promise<void> {
  if (scriptLoaded) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      `script[src="${TRADINGVIEW_SCRIPT_URL}"]`
    );

    if (existingScript) {
      // Script already added by another instance
      if ((window as any).TradingView) {
        scriptLoaded = true;
        resolve();
      } else {
        // Wait for script to load
        existingScript.addEventListener('load', () => {
          scriptLoaded = true;
          resolve();
        });
        existingScript.addEventListener('error', () => {
          reject(new Error(ERROR_MESSAGES.SCRIPT_LOAD_FAILED));
        });
      }
      return;
    }

    // Create and inject script
    const script = document.createElement('script');
    script.src = TRADINGVIEW_SCRIPT_URL;
    script.async = true;
    script.type = 'text/javascript';

    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };

    script.onerror = () => {
      scriptLoadingPromise = null; // Reset so we can retry
      reject(new Error(ERROR_MESSAGES.SCRIPT_LOAD_FAILED));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Generic hook for TradingView widgets
 *
 * @example
 * ```tsx
 * const { containerId, status, error } = useTradingViewWidget({
 *   widgetName: 'TickerTape',
 *   widgetConfig: {
 *     symbols: [{ proName: 'BMFBOVESPA:PETR4', title: 'Petrobras' }],
 *     colorTheme: 'dark',
 *     isTransparent: false,
 *   },
 * });
 *
 * return <div id={containerId} />;
 * ```
 */
export function useTradingViewWidget<TConfig = any>(
  options: UseTradingViewWidgetOptions<TConfig>
): UseTradingViewWidgetReturn {
  const {
    widgetName,
    containerId: providedContainerId,
    widgetConfig,
    lazyLoad = false,
    enablePerformanceMonitoring = false,
    onError,
    onLoad,
  } = options;

  // Generate unique container ID if not provided
  const containerIdRef = useRef(
    providedContainerId || `tradingview-widget-${widgetName}-${Math.random().toString(36).substr(2, 9)}`
  );
  const containerId = containerIdRef.current;

  // State
  const [status, setStatus] = useState<WidgetLoadingStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<WidgetPerformanceMetrics | null>(null);

  // Refs
  const widgetRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadStartRef = useRef<number>(0);

  /**
   * Create widget instance
   */
  const createWidget = useCallback(async () => {
    try {
      // Start performance monitoring
      if (enablePerformanceMonitoring) {
        loadStartRef.current = performance.now();
      }

      setStatus('loading');
      setError(null);

      // Load TradingView script
      await loadTradingViewScript();

      // Check if TradingView is available
      if (!(window as any).TradingView) {
        throw new Error(ERROR_MESSAGES.SCRIPT_LOAD_FAILED);
      }

      // Check if container exists
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container #${containerId} not found`);
      }

      // Create widget (with timeout)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error(ERROR_MESSAGES.TIMEOUT));
        }, WIDGET_LOAD_TIMEOUT);
      });

      const widgetPromise = new Promise((resolve) => {
        // Create widget instance
        widgetRef.current = new (window as any).TradingView.widget({
          ...widgetConfig,
          container_id: containerId,
        });

        // Resolve immediately (TradingView widgets don't have onLoad callback)
        // We rely on timeout to catch failures
        setTimeout(resolve, 100);
      });

      await Promise.race([widgetPromise, timeoutPromise]);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Update status
      setStatus('loaded');

      // Performance metrics
      if (enablePerformanceMonitoring) {
        const loadEnd = performance.now();
        const loadDuration = loadEnd - loadStartRef.current;

        setMetrics({
          widgetName,
          loadStart: loadStartRef.current,
          loadEnd,
          loadDuration,
          timestamp: Date.now(),
        });
      }

      // Call onLoad callback
      if (onLoad) {
        onLoad();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(ERROR_MESSAGES.WIDGET_LOAD_FAILED);

      setStatus('error');
      setError(error);

      // Performance metrics (with error)
      if (enablePerformanceMonitoring) {
        const loadEnd = performance.now();
        const loadDuration = loadEnd - loadStartRef.current;

        setMetrics({
          widgetName,
          loadStart: loadStartRef.current,
          loadEnd,
          loadDuration,
          error,
          timestamp: Date.now(),
        });
      }

      // Call onError callback
      if (onError) {
        onError(error);
      }

      console.error(`[TradingView] Failed to load ${widgetName} widget:`, error);
    }
  }, [widgetName, containerId, widgetConfig, enablePerformanceMonitoring, onError, onLoad]);

  /**
   * Destroy widget instance
   */
  const destroyWidget = useCallback(() => {
    if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
      try {
        widgetRef.current.remove();
      } catch (err) {
        console.warn(`[TradingView] Failed to remove ${widgetName} widget:`, err);
      }
      widgetRef.current = null;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [widgetName]);

  /**
   * Reload widget (public method)
   */
  const reload = useCallback(() => {
    destroyWidget();
    createWidget();
  }, [destroyWidget, createWidget]);

  // Effect: Create/destroy widget
  useEffect(() => {
    if (!lazyLoad) {
      createWidget();
    }

    return () => {
      destroyWidget();
    };
  }, [createWidget, destroyWidget, lazyLoad]);

  return {
    containerId,
    status,
    error,
    metrics,
    reload,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default useTradingViewWidget;
