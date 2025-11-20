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

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useId } from 'react';
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
// SCRIPT LOADING (Next.js gerencia via beforeInteractive)
// ============================================================================

/**
 * Verificar se TradingView script está disponível
 * (carregado via next/script no layout.tsx com strategy="beforeInteractive")
 */
function loadTradingViewScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Script já carregado via Next.js (beforeInteractive)
    if (typeof window !== 'undefined' && (window as any).TradingView) {
      resolve();
      return;
    }

    // Aguardar até 5 segundos (caso script esteja carregando)
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error(ERROR_MESSAGES.SCRIPT_LOAD_FAILED));
    }, 5000);

    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve();
      }
    }, 100); // Check a cada 100ms
  });
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

  // Generate unique container ID if not provided (SSR-safe with useId)
  const reactId = useId();
  const containerId = providedContainerId || `tradingview-widget-${widgetName}-${reactId.replace(/:/g, '')}`;

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
    /**
     * Wait for container to be available in DOM
     * (fixes race condition between React render and widget creation)
     * Next.js SSR: Hydration pode levar até 2-3s, então damos timeout generoso
     */
    const waitForContainer = (id: string, maxAttempts = 60, interval = 100): Promise<HTMLElement> => {
      return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkContainer = () => {
          const container = document.getElementById(id);

          if (container) {
            resolve(container);
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error(`Container #${id} not found after ${maxAttempts * interval}ms`));
            return;
          }

          setTimeout(checkContainer, interval);
        };

        checkContainer();
      });
    };

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

      // ✅ FIX: Wait for container to exist in DOM (retry logic)
      const container = await waitForContainer(containerId);

      // Create widget (with timeout)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error(ERROR_MESSAGES.TIMEOUT));
        }, WIDGET_LOAD_TIMEOUT);
      });

      const widgetPromise = new Promise((resolve) => {
        // ✅ TICKER TAPE: Use script embed approach (official TradingView method)
        if (widgetName === 'TickerTape') {
          const script = document.createElement('script');
          script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
          script.type = 'text/javascript';
          script.async = true;

          // Type assertion for Ticker Tape specific config
          const config = widgetConfig as any;
          script.innerHTML = JSON.stringify({
            symbols: config.symbols,
            showSymbolLogo: config.showSymbolLogo,
            colorTheme: config.colorTheme,
            isTransparent: config.isTransparent,
            displayMode: config.displayMode,
            locale: config.locale,
          });

          // Clear container and append script
          const containerEl = document.getElementById(containerId);
          if (containerEl) {
            containerEl.innerHTML = '';
            containerEl.appendChild(script);
          }

          // Store reference (script element, not widget instance)
          widgetRef.current = script as any;
          setTimeout(resolve, 100);
        }
        // ✅ OTHER WIDGETS: Use constructor approach
        else {
          const TradingView = (window as any).TradingView;
          widgetRef.current = new TradingView.widget({
            ...widgetConfig,
            container_id: containerId,
          });

          setTimeout(resolve, 100);
        }
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
  // ✅ useLayoutEffect garante que DOM está pronto (container existe)
  // ⏱️ Delay de 150ms para Next.js hydration completar (SSR)
  useLayoutEffect(() => {
    if (!lazyLoad) {
      const timer = setTimeout(() => {
        createWidget();
      }, 150); // Aguarda hydration Next.js

      return () => {
        clearTimeout(timer);
        destroyWidget();
      };
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
