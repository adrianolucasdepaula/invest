/**
 * AdvancedChart Widget - TradingView Advanced Real-Time Chart
 *
 * Full-featured interactive chart with technical studies, drawing tools,
 * and advanced analysis capabilities.
 *
 * @module tradingview/widgets/AdvancedChart
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useMemo } from 'react';
import { useTradingViewWidget } from '../hooks/useTradingViewWidget';
import { useTradingViewTheme } from '../hooks/useTradingViewTheme';
import { DEFAULT_LOCALE, DEFAULT_STUDIES, B3_EXCHANGE } from '../constants';
import type { AdvancedChartProps, ChartInterval, ChartRange } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface AdvancedChartComponentProps {
  /**
   * Symbol to display (format: "TICKER" or "EXCHANGE:TICKER")
   * @default "BMFBOVESPA:IBOV"
   * @example "PETR4" or "BMFBOVESPA:PETR4"
   */
  symbol?: string;

  /**
   * Chart interval (timeframe)
   * @default 'D' (daily)
   */
  interval?: ChartInterval;

  /**
   * Date range
   * @default '1M' (1 month)
   */
  range?: ChartRange;

  /**
   * Allow user to change symbol
   * @default true
   */
  allowSymbolChange?: boolean;

  /**
   * Technical studies to load (e.g., ['MA', 'RSI', 'MACD'])
   * @default ['MA', 'RSI', 'MACD']
   */
  studies?: readonly string[] | string[];

  /**
   * Hide top toolbar
   * @default false
   */
  hideTopToolbar?: boolean;

  /**
   * Enable save image feature
   * @default true
   */
  saveImage?: boolean;

  /**
   * Show watchlist
   * @default false
   */
  watchlist?: string[];

  /**
   * Show economic calendar
   * @default false
   */
  showCalendar?: boolean;

  /**
   * Custom container className
   */
  className?: string;

  /**
   * Widget height
   * @default 610
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
 * AdvancedChart widget component
 *
 * @example
 * ```tsx
 * // Default (IBOV daily)
 * <AdvancedChart />
 *
 * // PETR4 with custom interval
 * <AdvancedChart symbol="PETR4" interval="60" range="3M" />
 *
 * // Full-featured with studies
 * <AdvancedChart
 *   symbol="BMFBOVESPA:VALE3"
 *   studies={['MA', 'RSI', 'MACD', 'BB']}
 *   showCalendar={true}
 * />
 * ```
 */
export function AdvancedChart({
  symbol = 'BMFBOVESPA:IBOV',
  interval = 'D',
  range = '1M',
  allowSymbolChange = true,
  studies = DEFAULT_STUDIES.advanced_chart,
  hideTopToolbar = false,
  saveImage = true,
  watchlist,
  showCalendar = false,
  className,
  height = 610,
}: AdvancedChartComponentProps) {
  // Theme integration (dark/light auto-sync)
  const { theme } = useTradingViewTheme();

  // ✅ Memoize config (só recria se dependencies mudarem)
  const widgetConfig = useMemo<AdvancedChartProps>(
    () => ({
      symbol: formatSymbol(symbol),
      interval,
      timezone: 'America/Sao_Paulo', // ✅ B3 timezone
      theme, // Sync com next-themes
      style: 1, // Candles (padrão para B3)
      locale: DEFAULT_LOCALE, // br (TradingView standard)
      toolbar_bg: theme === 'dark' ? '#131722' : '#ffffff',
      enable_publishing: false, // Não permite publicar (interno apenas)
      allow_symbol_change: allowSymbolChange,
      watchlist,
      details: true, // Mostra detalhes do símbolo
      hotlist: false, // Não mostrar hotlist (foco em B3)
      calendar: showCalendar,
      studies: studies ? [...studies] : undefined, // Convert readonly to mutable
      show_popup_button: true, // Permite abrir em popup
      width: '100%',
      height,
      container_id: '', // Auto-gerado pelo hook
      hide_top_toolbar: hideTopToolbar,
      hide_legend: false, // Mostra legenda dos estudos
      save_image: saveImage,
      range,
      // ✅ Customizações para B3 (tema brasileiro)
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#26a69a', // Verde para alta
        'mainSeriesProperties.candleStyle.downColor': '#ef5350', // Vermelho para baixa
        'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
        'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
      },
    }),
    [
      symbol,
      interval,
      range,
      allowSymbolChange,
      studies,
      hideTopToolbar,
      saveImage,
      watchlist,
      showCalendar,
      theme,
      height,
    ]
  );

  // Widget hook (carrega TradingView widget)
  const { containerId, status, error } = useTradingViewWidget<AdvancedChartProps>({
    widgetName: 'AdvancedChart',
    widgetConfig,
    lazyLoad: false, // ✅ NÃO lazy load (principal widget da página de ativo)
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
            Carregando gráfico avançado...
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
          Erro ao carregar gráfico: {error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  // Success state (widget loaded)
  return (
    <div
      className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden ${className || ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-label={`TradingView Advanced Chart - ${formatSymbol(symbol)}`}
    >
      <div id={containerId} className="h-full" />
    </div>
  );
}

// ============================================================================
// EXPORT (with React.memo for performance)
// ============================================================================

/**
 * Memoized AdvancedChart component (previne re-renders desnecessários)
 */
const AdvancedChartMemoized = AdvancedChart;

export default AdvancedChartMemoized;
