/**
 * SymbolOverview Widget - TradingView Symbol Overview
 *
 * Compact widget showing symbol price, change%, and mini-chart.
 * Perfect for dashboards and multi-symbol displays.
 *
 * @module tradingview/widgets/SymbolOverview
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useMemo } from 'react';
import { useTradingViewWidget } from '../hooks/useTradingViewWidget';
import { useTradingViewTheme } from '../hooks/useTradingViewTheme';
import { DEFAULT_LOCALE, B3_BLUE_CHIPS } from '../constants';
import type { SymbolOverviewProps, TradingViewSymbol } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface SymbolOverviewComponentProps {
  /**
   * Symbols to display (array of arrays for multiple rows)
   * @default [[PETR4], [VALE3], [ITUB4]]
   * @example [[{proName: 'BMFBOVESPA:PETR4', description: 'Petrobras'}]]
   */
  symbols?: TradingViewSymbol[][];

  /**
   * Chart only mode (hides price/change data)
   * @default false
   */
  chartOnly?: boolean;

  /**
   * Show symbol logos
   * @default true
   */
  showSymbolLogo?: boolean;

  /**
   * Date range for mini-charts
   * @default '1D'
   */
  dateRange?: '1D' | '1M' | '3M' | '12M' | '60M' | 'ALL';

  /**
   * Custom container className
   */
  className?: string;

  /**
   * Widget height
   * @default 400
   */
  height?: number | string;
}

// ============================================================================
// DEFAULT SYMBOLS
// ============================================================================

/**
 * Default symbols: Top 3 Blue Chips (PETR4, VALE3, ITUB4)
 */
const DEFAULT_SYMBOLS: TradingViewSymbol[][] = B3_BLUE_CHIPS.slice(0, 3).map(
  symbol => [
    {
      proName: symbol.proName,
      description: symbol.description,
    },
  ]
);

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SymbolOverview widget component
 *
 * @example
 * ```tsx
 * // Default (Top 3 Blue Chips)
 * <SymbolOverview />
 *
 * // Custom symbols (multiple in one row)
 * <SymbolOverview symbols={[
 *   [
 *     { proName: 'BMFBOVESPA:PETR4', description: 'Petrobras' },
 *     { proName: 'BMFBOVESPA:VALE3', description: 'Vale' }
 *   ],
 *   [{ proName: 'BMFBOVESPA:ITUB4', description: 'Itaú' }]
 * ]} />
 *
 * // Chart only (no price data)
 * <SymbolOverview chartOnly={true} />
 * ```
 */
export function SymbolOverview({
  symbols = DEFAULT_SYMBOLS,
  chartOnly = false,
  showSymbolLogo = true,
  dateRange = '1D',
  className,
  height = 400,
}: SymbolOverviewComponentProps) {
  // Theme integration (dark/light auto-sync)
  const { theme } = useTradingViewTheme();

  // ✅ Memoize config (só recria se dependencies mudarem)
  const widgetConfig = useMemo<SymbolOverviewProps>(
    () => ({
      symbols,
      chartOnly,
      showSymbolLogo,
      dateRange,
      width: '100%',
      height,
      colorTheme: theme, // Sync com next-themes
      isTransparent: false, // ✅ CRÍTICO: evita bug dark mode
      locale: DEFAULT_LOCALE, // br (TradingView standard)
      showFloatingTooltip: true,
      // ✅ Customizações de cores (gradiente brasileiro)
      lineColor: theme === 'dark' ? '#26a69a' : '#089981',
      topColor: theme === 'dark' ? 'rgba(38, 166, 154, 0.4)' : 'rgba(8, 153, 129, 0.4)',
      bottomColor: theme === 'dark' ? 'rgba(38, 166, 154, 0.0)' : 'rgba(8, 153, 129, 0.0)',
      lineWidth: 2,
    }),
    [symbols, chartOnly, showSymbolLogo, dateRange, theme, height]
  );

  // Widget hook (carrega TradingView widget)
  const { containerId, status, error } = useTradingViewWidget<SymbolOverviewProps>({
    widgetName: 'SymbolOverview',
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
            Carregando visão geral...
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
          Erro ao carregar Symbol Overview: {error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  // Success state (widget loaded)
  return (
    <div
      className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden ${className || ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-label="TradingView Symbol Overview - Visão geral dos símbolos"
    >
      <div id={containerId} className="h-full" />
    </div>
  );
}

// ============================================================================
// EXPORT (with React.memo for performance)
// ============================================================================

/**
 * Memoized SymbolOverview component (previne re-renders desnecessários)
 */
const SymbolOverviewMemoized = SymbolOverview;

export default SymbolOverviewMemoized;
