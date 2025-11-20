/**
 * TechnicalAnalysis Widget - TradingView Technical Analysis
 *
 * Displays aggregated technical analysis summary (Buy/Sell/Neutral signals)
 * from moving averages, oscillators, and pivot points.
 *
 * @module tradingview/widgets/TechnicalAnalysis
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useMemo } from 'react';
import { useTradingViewWidget } from '../hooks/useTradingViewWidget';
import { useTradingViewTheme } from '../hooks/useTradingViewTheme';
import { DEFAULT_LOCALE, B3_EXCHANGE } from '../constants';
import type { TechnicalAnalysisProps, TechnicalAnalysisInterval } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface TechnicalAnalysisComponentProps {
  /**
   * Symbol to analyze (format: "TICKER" or "EXCHANGE:TICKER")
   * @default "BMFBOVESPA:IBOV"
   * @example "PETR4" or "BMFBOVESPA:PETR4"
   */
  symbol?: string;

  /**
   * Analysis interval
   * @default '1D' (daily)
   */
  interval?: TechnicalAnalysisInterval;

  /**
   * Show interval tabs (allows user to switch timeframes)
   * @default true
   */
  showIntervalTabs?: boolean;

  /**
   * Custom container className
   */
  className?: string;

  /**
   * Widget height
   * @default 450
   */
  height?: number | string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formata símbolo para TradingView (garante formato EXCHANGE:TICKER)
 */
function formatSymbol(symbol: string, exchange: string = B3_EXCHANGE): string {
  // Se já tem exchange prefix, retorna como está
  if (symbol.includes(':')) {
    return symbol;
  }

  // Adiciona exchange prefix
  return `${exchange}:${symbol}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * TechnicalAnalysis widget component
 *
 * @example
 * ```tsx
 * // Default (IBOV daily)
 * <TechnicalAnalysis />
 *
 * // PETR4 with 1-hour interval
 * <TechnicalAnalysis symbol="PETR4" interval="1h" />
 *
 * // Without interval tabs (fixed timeframe)
 * <TechnicalAnalysis symbol="VALE3" showIntervalTabs={false} />
 * ```
 */
export function TechnicalAnalysis({
  symbol = 'BMFBOVESPA:IBOV',
  interval = '1D',
  showIntervalTabs = true,
  className,
  height = 450,
}: TechnicalAnalysisComponentProps) {
  // Theme integration (dark/light auto-sync)
  const { theme } = useTradingViewTheme();

  // ✅ Memoize config (só recria se dependencies mudarem)
  const widgetConfig = useMemo<TechnicalAnalysisProps>(
    () => ({
      symbol: formatSymbol(symbol),
      interval,
      showIntervalTabs,
      width: '100%',
      height,
      colorTheme: theme, // Sync com next-themes
      isTransparent: false, // ✅ CRÍTICO: evita bug dark mode
      locale: DEFAULT_LOCALE, // br (TradingView standard)
    }),
    [symbol, interval, showIntervalTabs, theme, height]
  );

  // Widget hook (carrega TradingView widget)
  const { containerId, status, error } = useTradingViewWidget<TechnicalAnalysisProps>({
    widgetName: 'TechnicalAnalysis',
    widgetConfig,
    lazyLoad: true, // ✅ Lazy load (pode estar below-fold)
    enablePerformanceMonitoring: true,
  });

  // Loading state
  if (status === 'loading') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-900 ${className || ''}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Carregando análise técnica...
          </span>
        </div>
      </div>
    );
  }

  // Error state (handled by ErrorBoundary, mas incluímos fallback)
  if (status === 'error') {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 ${className || ''}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <p className="text-sm text-red-600 dark:text-red-400">
          Erro ao carregar análise técnica: {error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  // Success state (widget loaded)
  return (
    <div
      className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden ${className || ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-label={`TradingView Technical Analysis - ${formatSymbol(symbol)}`}
    >
      <div id={containerId} className="h-full" />
    </div>
  );
}

// ============================================================================
// EXPORT (with React.memo for performance)
// ============================================================================

/**
 * Memoized TechnicalAnalysis component (previne re-renders desnecessários)
 */
const TechnicalAnalysisMemoized = TechnicalAnalysis;

export default TechnicalAnalysisMemoized;
