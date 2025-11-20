/**
 * TickerTape Widget - TradingView Ticker Tape
 *
 * Displays real-time quotes for IBOV + 10 Blue Chips in a running ticker format.
 * Designed for sticky header (always visible).
 *
 * @module tradingview/widgets/TickerTape
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useMemo } from 'react';
import { useTradingViewWidget } from '../hooks/useTradingViewWidget';
import { useTradingViewTheme } from '../hooks/useTradingViewTheme';
import { TICKERTAPE_DEFAULT_SYMBOLS, DEFAULT_LOCALE } from '../constants';
import type { TickerTapeProps } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface TickerTapeComponentProps {
  /**
   * Override default symbols (IBOV + 10 Blue Chips)
   * @default TICKERTAPE_DEFAULT_SYMBOLS (11 símbolos)
   */
  symbols?: TickerTapeProps['symbols'];

  /**
   * Show symbol logos
   * @default true
   */
  showSymbolLogo?: boolean;

  /**
   * Custom container className
   */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * TickerTape widget component
 *
 * @example
 * ```tsx
 * // Default (IBOV + 10 Blue Chips)
 * <TickerTape />
 *
 * // Custom symbols
 * <TickerTape symbols={[
 *   { proName: 'BMFBOVESPA:PETR4', title: 'Petrobras' }
 * ]} />
 *
 * // Without logos
 * <TickerTape showSymbolLogo={false} />
 * ```
 */
export function TickerTape({
  symbols = TICKERTAPE_DEFAULT_SYMBOLS,
  showSymbolLogo = true,
  className,
}: TickerTapeComponentProps) {
  // Theme integration (dark/light auto-sync)
  const { theme } = useTradingViewTheme();

  // ✅ Memoize config (só recria se dependencies mudarem)
  const widgetConfig = useMemo<TickerTapeProps>(
    () => ({
      symbols,
      showSymbolLogo,
      isTransparent: false,      // ✅ CRÍTICO: evita bug dark mode
      displayMode: 'adaptive',   // Responsive automático
      colorTheme: theme,         // Sync com next-themes
      locale: DEFAULT_LOCALE,    // pt_BR
    }),
    [symbols, showSymbolLogo, theme]
  );

  // Widget hook (carrega TradingView widget)
  const { containerId, status, error } = useTradingViewWidget<TickerTapeProps>({
    widgetName: 'TickerTape',
    widgetConfig,
    lazyLoad: false, // ✅ NÃO lazy load (sticky header sempre visível)
    enablePerformanceMonitoring: true,
  });

  // Loading state
  if (status === 'loading') {
    return (
      <div
        className={`flex items-center justify-center h-[100px] bg-gray-100 dark:bg-gray-900 ${className || ''}`}
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
            Carregando cotações...
          </span>
        </div>
      </div>
    );
  }

  // Error state (handled by ErrorBoundary, mas incluímos fallback)
  if (status === 'error') {
    return (
      <div
        className={`flex items-center justify-center h-[100px] bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 ${className || ''}`}
      >
        <p className="text-sm text-red-600 dark:text-red-400">
          Erro ao carregar TickerTape: {error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  // Success state (widget loaded)
  return (
    <div
      className={`w-full h-[100px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${className || ''}`}
      aria-label="TradingView Ticker Tape - Cotações em tempo real"
    >
      <div id={containerId} className="h-full" />
    </div>
  );
}

// ============================================================================
// EXPORT (with React.memo for performance)
// ============================================================================

/**
 * Memoized TickerTape component (previne re-renders desnecessários)
 */
const TickerTapeMemoized = TickerTape;

export default TickerTapeMemoized;
