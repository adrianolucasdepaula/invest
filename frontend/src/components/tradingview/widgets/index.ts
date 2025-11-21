/**
 * TradingView Widgets - Index
 *
 * Centralized exports for TradingView widgets (2 widgets em produção).
 *
 * @module tradingview/widgets
 * @version 2.0.0
 * @updated 2025-11-20
 */

// ============================================================================
// WIDGETS (2 - PRODUCTION)
// ============================================================================

// 1. TickerTape - IBOV + 10 Blue Chips running ticker (Header sticky)
export { TickerTape, default as TickerTapeDefault } from './TickerTape';
export type { TickerTapeComponentProps } from './TickerTape';

// 2. AdvancedChart - Full-featured interactive chart with studies (Asset details page)
export { AdvancedChart, default as AdvancedChartDefault } from './AdvancedChart';
export type { AdvancedChartComponentProps } from './AdvancedChart';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example
 * ```tsx
 * // TickerTape - Header sticky
 * import { TickerTape } from '@/components/tradingview/widgets';
 *
 * <div className="sticky top-0 z-50">
 *   <TickerTape />
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // AdvancedChart - Asset details page
 * import { AdvancedChart } from '@/components/tradingview/widgets';
 *
 * <AdvancedChart
 *   symbol={`BMFBOVESPA:${ticker.toUpperCase()}`}
 *   interval="D"
 *   range="12M"
 *   height={610}
 * />
 * ```
 */
