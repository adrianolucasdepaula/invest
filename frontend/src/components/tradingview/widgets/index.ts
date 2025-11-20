/**
 * TradingView Widgets - Index
 *
 * Centralized exports for all TradingView widgets (6 widgets - MVP).
 *
 * @module tradingview/widgets
 * @version 1.0.0
 * @created 2025-11-20
 */

// ============================================================================
// WIDGETS (6 - MVP COMPLETE)
// ============================================================================

// 1. TickerTape - IBOV + 10 Blue Chips running ticker
export { TickerTape, default as TickerTapeDefault } from './TickerTape';
export type { TickerTapeComponentProps } from './TickerTape';

// 2. MarketOverview - Multi-tab market overview (B3, Forex, Crypto)
export { MarketOverview, default as MarketOverviewDefault } from './MarketOverview';
export type { MarketOverviewComponentProps } from './MarketOverview';

// 3. AdvancedChart - Full-featured interactive chart with studies
export { AdvancedChart, default as AdvancedChartDefault } from './AdvancedChart';
export type { AdvancedChartComponentProps } from './AdvancedChart';

// 4. Screener - Filterable stock screener table
export { Screener, default as ScreenerDefault } from './Screener';
export type { ScreenerComponentProps } from './Screener';

// 5. TechnicalAnalysis - Aggregated buy/sell signals
export { TechnicalAnalysis, default as TechnicalAnalysisDefault } from './TechnicalAnalysis';
export type { TechnicalAnalysisComponentProps } from './TechnicalAnalysis';

// 6. SymbolOverview - Compact symbol overview with mini-chart
export { SymbolOverview, default as SymbolOverviewDefault } from './SymbolOverview';
export type { SymbolOverviewComponentProps } from './SymbolOverview';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example
 * ```tsx
 * // Import individual widget
 * import { TickerTape } from '@/components/tradingview/widgets';
 *
 * // Use in component
 * <TickerTape />
 * ```
 *
 * @example
 * ```tsx
 * // Import multiple widgets
 * import { MarketOverview, AdvancedChart } from '@/components/tradingview/widgets';
 *
 * // Dashboard layout
 * <div>
 *   <MarketOverview />
 *   <AdvancedChart symbol="PETR4" />
 * </div>
 * ```
 */
