/**
 * MarketOverview Widget - TradingView Market Overview
 *
 * Displays market overview with tabs (B3 Stocks, Forex, Crypto).
 * Shows mini-charts for each symbol with price, change%, and sparkline.
 *
 * @module tradingview/widgets/MarketOverview
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useMemo } from 'react';
import { useTradingViewWidget } from '../hooks/useTradingViewWidget';
import { useTradingViewTheme } from '../hooks/useTradingViewTheme';
import {
  B3_BLUE_CHIPS,
  B3_INDICES,
  FOREX_POPULAR,
  CRYPTO_POPULAR,
  DEFAULT_LOCALE,
} from '../constants';
import type { MarketOverviewProps, MarketOverviewTab } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketOverviewComponentProps {
  /**
   * Custom tabs (override default B3/Forex/Crypto)
   * @default [B3 Tab, Forex Tab, Crypto Tab]
   */
  tabs?: MarketOverviewTab[];

  /**
   * Show mini-chart for each symbol
   * @default true
   */
  showChart?: boolean;

  /**
   * Date range for charts
   * @default '1D'
   */
  dateRange?: '1D' | '1M' | '3M' | '12M' | '60M' | 'ALL';

  /**
   * Show symbol logos
   * @default true
   */
  showSymbolLogo?: boolean;

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
// DEFAULT TABS
// ============================================================================

/**
 * Default tabs: B3, Forex, Crypto
 */
const DEFAULT_TABS: MarketOverviewTab[] = [
  // Tab 1: B3 (IBOV + Top 5 Blue Chips)
  {
    title: 'B3',
    symbols: [
      // IBOV first
      {
        proName: B3_INDICES[0].proName, // BMFBOVESPA:IBOV
        description: B3_INDICES[0].description, // Ibovespa
      },
      // Top 5 Blue Chips
      ...B3_BLUE_CHIPS.slice(0, 5).map(symbol => ({
        proName: symbol.proName,
        description: symbol.description,
      })),
    ],
  },

  // Tab 2: Forex
  {
    title: 'Forex',
    symbols: FOREX_POPULAR.map(symbol => ({
      proName: symbol.proName,
      description: symbol.description,
    })),
  },

  // Tab 3: Crypto
  {
    title: 'Crypto',
    symbols: CRYPTO_POPULAR.map(symbol => ({
      proName: symbol.proName,
      description: symbol.description,
    })),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * MarketOverview widget component
 *
 * @example
 * ```tsx
 * // Default (B3 + Forex + Crypto tabs)
 * <MarketOverview />
 *
 * // Custom tabs
 * <MarketOverview tabs={[
 *   {
 *     title: 'Energia',
 *     symbols: [{ proName: 'BMFBOVESPA:PETR4', description: 'Petrobras' }]
 *   }
 * ]} />
 *
 * // Without charts
 * <MarketOverview showChart={false} />
 * ```
 */
export function MarketOverview({
  tabs = DEFAULT_TABS,
  showChart = true,
  dateRange = '1D',
  showSymbolLogo = true,
  className,
  height = 400,
}: MarketOverviewComponentProps) {
  // Theme integration (dark/light auto-sync)
  const { theme } = useTradingViewTheme();

  // ✅ Memoize config (só recria se dependencies mudarem)
  const widgetConfig = useMemo<MarketOverviewProps>(
    () => ({
      tabs,
      showChart,
      dateRange,
      showSymbolLogo,
      colorTheme: theme, // Sync com next-themes
      isTransparent: false, // ✅ CRÍTICO: evita bug dark mode
      locale: DEFAULT_LOCALE, // br (TradingView standard)
      width: '100%',
      height,
      showFloatingTooltip: true,
      plotLineColorType: 'gradient',
    }),
    [tabs, showChart, dateRange, showSymbolLogo, theme, height]
  );

  // Widget hook (carrega TradingView widget)
  const { containerId, status, error } = useTradingViewWidget<MarketOverviewProps>({
    widgetName: 'MarketOverview',
    widgetConfig,
    lazyLoad: false, // ✅ NÃO lazy load (visível acima do fold)
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
            Carregando Market Overview...
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
          Erro ao carregar Market Overview: {error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  // Success state (widget loaded)
  return (
    <div
      className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden ${className || ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-label="TradingView Market Overview - Visão geral do mercado"
    >
      <div id={containerId} className="h-full" />
    </div>
  );
}

// ============================================================================
// EXPORT (with React.memo for performance)
// ============================================================================

/**
 * Memoized MarketOverview component (previne re-renders desnecessários)
 */
const MarketOverviewMemoized = MarketOverview;

export default MarketOverviewMemoized;
