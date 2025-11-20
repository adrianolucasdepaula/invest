/**
 * Screener Widget - TradingView Stock Screener
 *
 * Filterable table of stocks with sorting, filtering, and advanced criteria.
 * Displays key metrics: price, change%, volume, market cap, P/E, etc.
 *
 * @module tradingview/widgets/Screener
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useMemo } from 'react';
import { useTradingViewWidget } from '../hooks/useTradingViewWidget';
import { useTradingViewTheme } from '../hooks/useTradingViewTheme';
import { DEFAULT_LOCALE } from '../constants';
import type { ScreenerProps, ScreenerMarket } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ScreenerComponentProps {
  /**
   * Market to screen
   * @default 'brazil' (B3)
   */
  market?: ScreenerMarket;

  /**
   * Default column to sort by
   * @default 'change'
   */
  defaultColumn?: string;

  /**
   * Default screen (preset filter)
   * @default 'general'
   */
  defaultScreen?: string;

  /**
   * Show toolbar
   * @default true
   */
  showToolbar?: boolean;

  /**
   * Custom container className
   */
  className?: string;

  /**
   * Widget height
   * @default 490
   */
  height?: number | string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Screener widget component
 *
 * @example
 * ```tsx
 * // Default (Brazil market)
 * <Screener />
 *
 * // US market with custom sorting
 * <Screener market="america" defaultColumn="volume" />
 *
 * // Crypto screener
 * <Screener market="crypto" defaultColumn="market_cap_calc" />
 * ```
 */
export function Screener({
  market = 'brazil',
  defaultColumn = 'change',
  defaultScreen = 'general',
  showToolbar = true,
  className,
  height = 490,
}: ScreenerComponentProps) {
  // Theme integration (dark/light auto-sync)
  const { theme } = useTradingViewTheme();

  // ✅ Memoize config (só recria se dependencies mudarem)
  const widgetConfig = useMemo<ScreenerProps>(
    () => ({
      width: '100%',
      height,
      defaultColumn,
      defaultScreen,
      market,
      showToolbar,
      colorTheme: theme, // Sync com next-themes
      locale: DEFAULT_LOCALE, // br (TradingView standard)
      isTransparent: false, // ✅ CRÍTICO: evita bug dark mode
    }),
    [defaultColumn, defaultScreen, market, showToolbar, theme, height]
  );

  // Widget hook (carrega TradingView widget)
  const { containerId, status, error } = useTradingViewWidget<ScreenerProps>({
    widgetName: 'Screener',
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
            Carregando Screener...
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
          Erro ao carregar Screener: {error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  // Success state (widget loaded)
  return (
    <div
      className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden ${className || ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-label={`TradingView Screener - ${market}`}
    >
      <div id={containerId} className="h-full" />
    </div>
  );
}

// ============================================================================
// EXPORT (with React.memo for performance)
// ============================================================================

/**
 * Memoized Screener component (previne re-renders desnecessários)
 */
const ScreenerMemoized = Screener;

export default ScreenerMemoized;
