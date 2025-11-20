/**
 * TradingView Widgets - Type Definitions
 *
 * Complete TypeScript interfaces for all 22 TradingView free widgets.
 * Based on official TradingView documentation:
 * - https://www.tradingview.com/widget-docs/
 *
 * @module tradingview/types
 * @version 1.0.0
 * @created 2025-11-20
 */

// ============================================================================
// COMMON TYPES (Shared across all widgets)
// ============================================================================

/**
 * Theme for TradingView widgets
 */
export type TradingViewTheme = 'light' | 'dark';

/**
 * Locale for TradingView widgets (internationalization)
 */
export type TradingViewLocale =
  | 'en'
  | 'pt_BR'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'zh_CN'
  | 'zh_TW';

/**
 * Color theme options for charts
 */
export type ColorTheme =
  | 'light'
  | 'dark';

/**
 * Interval/Timeframe for charts
 */
export type ChartInterval =
  | '1'
  | '3'
  | '5'
  | '15'
  | '30'
  | '60'
  | '120'
  | '180'
  | 'D'
  | 'W'
  | 'M';

/**
 * Chart type/style
 */
export type ChartStyle =
  | 0 // Bars
  | 1 // Candles
  | 2 // Line
  | 3 // Area
  | 4 // Heiken Ashi
  | 8 // Hollow Candles
  | 9; // Baseline

/**
 * Range for charts
 */
export type ChartRange =
  | '1D'
  | '5D'
  | '1M'
  | '3M'
  | '6M'
  | 'YTD'
  | '12M'
  | '60M'
  | 'ALL';

/**
 * Symbol for TradingView (exchange:ticker format)
 */
export interface TradingViewSymbol {
  /** Symbol in format "EXCHANGE:TICKER" (e.g., "BMFBOVESPA:PETR4") */
  proName: string;
  /** Display description/title (optional) - TradingView API uses "description" */
  description?: string;
}

/**
 * Market (exchange) filter
 */
export type MarketType =
  | 'stock'
  | 'futures'
  | 'forex'
  | 'crypto'
  | 'index'
  | 'bonds'
  | 'commodity';

/**
 * Base props for all TradingView widgets
 */
export interface BaseTradingViewProps {
  /** Theme (light/dark) - synced with next-themes */
  theme?: TradingViewTheme;
  /** Locale for internationalization */
  locale?: TradingViewLocale;
  /** Enable autosize */
  autosize?: boolean;
  /** Width (if not autosize) */
  width?: number | string;
  /** Height (if not autosize) */
  height?: number | string;
  /** Container ID (auto-generated if not provided) */
  container_id?: string;
  /** Enable lazy loading */
  lazyLoad?: boolean;
}

// ============================================================================
// 1. TICKER TAPE
// ============================================================================

export interface TickerTapeSymbol {
  proName: string;
  title?: string;
}

export interface TickerTapeProps extends BaseTradingViewProps {
  /** Array of symbols to display */
  symbols: TickerTapeSymbol[];
  /** Show symbol logos */
  showSymbolLogo?: boolean;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
  /** Display mode */
  displayMode?: 'adaptive' | 'regular' | 'compact';
  /** Enable scroll */
  largeChartUrl?: string;
}

// ============================================================================
// 2. MARKET OVERVIEW
// ============================================================================

export interface MarketOverviewTab {
  title: string;
  symbols: TradingViewSymbol[];
  originalTitle?: string;
}

export interface MarketOverviewProps extends BaseTradingViewProps {
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Date range */
  dateRange?: '1D' | '1M' | '3M' | '12M' | '60M' | 'ALL';
  /** Show chart */
  showChart?: boolean;
  /** Locale */
  locale?: TradingViewLocale;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Large chart URL */
  largeChartUrl?: string;
  /** Is transparent */
  isTransparent?: boolean;
  /** Show symbol logo */
  showSymbolLogo?: boolean;
  /** Show floating tooltip */
  showFloatingTooltip?: boolean;
  /** Plot line color type */
  plotLineColorType?: 'gradient' | 'solid';
  /** Grid line color */
  gridLineColor?: string;
  /** Scaling */
  scaleFontColor?: string;
  /** Tabs */
  tabs?: MarketOverviewTab[];
}

// ============================================================================
// 3. SCREENER
// ============================================================================

export type ScreenerMarket =
  | 'america'
  | 'brazil'
  | 'uk'
  | 'india'
  | 'vietnam'
  | 'crypto'
  | 'forex';

export interface ScreenerProps extends BaseTradingViewProps {
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Default column (sort by) */
  defaultColumn?: string;
  /** Default screen */
  defaultScreen?: string;
  /** Market */
  market?: ScreenerMarket;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Locale */
  locale?: TradingViewLocale;
  /** Is transparent */
  isTransparent?: boolean;
}

// ============================================================================
// 4. ADVANCED CHART (ADVANCED REAL-TIME CHART)
// ============================================================================

export interface AdvancedChartProps extends BaseTradingViewProps {
  /** Symbol */
  symbol?: string;
  /** Interval */
  interval?: ChartInterval;
  /** Timezone */
  timezone?: string;
  /** Theme */
  theme?: TradingViewTheme;
  /** Style */
  style?: ChartStyle;
  /** Locale */
  locale?: TradingViewLocale;
  /** Toolbar background color */
  toolbar_bg?: string;
  /** Enable publishing */
  enable_publishing?: boolean;
  /** Allow symbol change */
  allow_symbol_change?: boolean;
  /** Watchlist */
  watchlist?: string[];
  /** Details */
  details?: boolean;
  /** Hotlist */
  hotlist?: boolean;
  /** Calendar */
  calendar?: boolean;
  /** Studies */
  studies?: string[];
  /** Show popup button */
  show_popup_button?: boolean;
  /** Popup width */
  popup_width?: number | string;
  /** Popup height */
  popup_height?: number | string;
  /** Support host */
  support_host?: string;
  /** Container ID */
  container_id?: string;
  /** Hide top toolbar */
  hide_top_toolbar?: boolean;
  /** Hide legend */
  hide_legend?: boolean;
  /** Save image */
  save_image?: boolean;
  /** Range */
  range?: ChartRange;
  /** Studies overrides */
  studies_overrides?: Record<string, any>;
  /** Overrides */
  overrides?: Record<string, any>;
  /** Enabled features */
  enabled_features?: string[];
  /** Disabled features */
  disabled_features?: string[];
}

// ============================================================================
// 5. TECHNICAL ANALYSIS
// ============================================================================

export type TechnicalAnalysisInterval =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '1D'
  | '1W'
  | '1M';

export interface TechnicalAnalysisProps extends BaseTradingViewProps {
  /** Interval */
  interval?: TechnicalAnalysisInterval;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Is transparent */
  isTransparent?: boolean;
  /** Symbol */
  symbol?: string;
  /** Show interval tabs */
  showIntervalTabs?: boolean;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 6. ECONOMIC CALENDAR
// ============================================================================

export type EconomicCalendarImportance = '-1' | '0' | '1';

export interface EconomicCalendarProps extends BaseTradingViewProps {
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Importance filter */
  importanceFilter?: EconomicCalendarImportance;
  /** Country filter (ISO 3166-1 alpha-2) */
  countryFilter?: string;
  /** UTC offset */
  utcOffset?: string;
}

// ============================================================================
// 7. SYMBOL OVERVIEW
// ============================================================================

export interface SymbolOverviewProps extends BaseTradingViewProps {
  /** Symbols */
  symbols?: TradingViewSymbol[][];
  /** Chart only */
  chartOnly?: boolean;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Grid line color */
  gridLineColor?: string;
  /** Font color */
  fontColor?: string;
  /** Is transparent */
  isTransparent?: boolean;
  /** Show symbol logo */
  showSymbolLogo?: boolean;
  /** Show floating tooltip */
  showFloatingTooltip?: boolean;
  /** Date range */
  dateRange?: '1D' | '1M' | '3M' | '12M' | '60M' | 'ALL';
  /** Line color */
  lineColor?: string;
  /** Top color */
  topColor?: string;
  /** Bottom color */
  bottomColor?: string;
  /** Line width */
  lineWidth?: number;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 8. MINI CHART
// ============================================================================

export interface MiniChartProps extends BaseTradingViewProps {
  /** Symbol */
  symbol?: string;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Date range */
  dateRange?: '1D' | '1M' | '3M' | '12M' | '60M' | 'ALL';
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Trendline color */
  trendLineColor?: string;
  /** Under line color */
  underLineColor?: string;
  /** Under line bottom color */
  underLineBottomColor?: string;
  /** Is transparent */
  isTransparent?: boolean;
  /** Autosize */
  autosize?: boolean;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 9. STOCK MARKET (MARKET DATA)
// ============================================================================

export interface StockMarketProps extends BaseTradingViewProps {
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Symbols */
  symbols?: TradingViewSymbol[];
  /** Show symbol logo */
  showSymbolLogo?: boolean;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
  /** Locale */
  locale?: TradingViewLocale;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 10. MARKET QUOTES (MARKET DATA - Compact)
// ============================================================================

export interface MarketQuotesProps extends BaseTradingViewProps {
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Symbols */
  symbols?: TradingViewSymbol[];
  /** Show symbol logo */
  showSymbolLogo?: boolean;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
  /** Locale */
  locale?: TradingViewLocale;
}

// ============================================================================
// 11. TICKER (SINGLE TICKER)
// ============================================================================

export interface TickerProps extends BaseTradingViewProps {
  /** Symbol */
  symbol?: string;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
  /** Show symbol logo */
  showSymbolLogo?: boolean;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 12. SINGLE TICKER (MINI TICKER)
// ============================================================================

export interface SingleTickerProps extends BaseTradingViewProps {
  /** Symbol */
  symbol?: string;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
}

// ============================================================================
// 13-17. HEATMAPS (5 variations)
// ============================================================================

export type HeatmapDataMode = 'STOCKS' | 'CRYPTO' | 'ETF' | 'FOREX';
export type HeatmapBlockSize = 'large' | 'medium' | 'small' | 'tiny';
export type HeatmapBlockColor = 'change' | 'Perf.1D' | 'Perf.1W' | 'Perf.1M' | 'volume';
export type HeatmapGrouping = 'sector' | 'asset_type' | 'exchange' | 'no_group';

export interface HeatmapProps extends BaseTradingViewProps {
  /** Data mode */
  dataMode?: HeatmapDataMode;
  /** Exchange (for stocks) */
  exchanges?: string[];
  /** Block size */
  blockSize?: HeatmapBlockSize;
  /** Block color */
  blockColor?: HeatmapBlockColor;
  /** Grouping */
  grouping?: HeatmapGrouping;
  /** Has top bar */
  hasTopBar?: boolean;
  /** Is data set enabled */
  isDataSetEnabled?: boolean;
  /** Is zoom enabled */
  isZoomEnabled?: boolean;
  /** Is value absolute */
  isValueAbsolute?: boolean;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Symbol URL */
  symbolUrl?: string;
}

// Specific Heatmap types
export interface StockHeatmapProps extends HeatmapProps {
  dataMode: 'STOCKS';
  exchanges?: string[];
}

export interface CryptoHeatmapProps extends HeatmapProps {
  dataMode: 'CRYPTO';
}

export interface ETFHeatmapProps extends HeatmapProps {
  dataMode: 'ETF';
}

export interface ForexHeatmapProps extends HeatmapProps {
  dataMode: 'FOREX';
}

export interface ForexCrossRatesProps extends BaseTradingViewProps {
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Currencies */
  currencies?: string[];
  /** Is transparent */
  isTransparent?: boolean;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Locale */
  locale?: TradingViewLocale;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 18. SYMBOL INFO (SYMBOL PROFILE)
// ============================================================================

export interface SymbolInfoProps extends BaseTradingViewProps {
  /** Symbol */
  symbol?: string;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
}

// ============================================================================
// 19. FUNDAMENTAL DATA
// ============================================================================

export interface FundamentalDataProps extends BaseTradingViewProps {
  /** Symbol */
  symbol?: string;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
  /** Display mode */
  displayMode?: 'regular' | 'compact';
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 20. COMPANY PROFILE
// ============================================================================

export interface CompanyProfileProps extends BaseTradingViewProps {
  /** Symbol */
  symbol?: string;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Is transparent */
  isTransparent?: boolean;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 21. TOP STORIES (NEWS)
// ============================================================================

export interface TopStoriesProps extends BaseTradingViewProps {
  /** Feed mode */
  feedMode?: 'all_symbols' | 'market' | 'symbol';
  /** Market (if feedMode = 'market') */
  market?: MarketType;
  /** Symbol (if feedMode = 'symbol') */
  symbol?: string;
  /** Is transparent */
  isTransparent?: boolean;
  /** Display mode */
  displayMode?: 'regular' | 'compact';
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Locale */
  locale?: TradingViewLocale;
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Large chart URL */
  largeChartUrl?: string;
}

// ============================================================================
// 22. CRYPTO MARKET SCREENER
// ============================================================================

export interface CryptoMarketScreenerProps extends BaseTradingViewProps {
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Default column */
  defaultColumn?: string;
  /** Screener type */
  screener_type?: 'crypto_mkt';
  /** Display currency */
  displayCurrency?: 'USD' | 'BTC';
  /** Color theme */
  colorTheme?: ColorTheme;
  /** Locale */
  locale?: TradingViewLocale;
  /** Is transparent */
  isTransparent?: boolean;
}

// ============================================================================
// WIDGET LIFECYCLE & PERFORMANCE
// ============================================================================

/**
 * Widget loading status
 */
export type WidgetLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Widget performance metrics
 */
export interface WidgetPerformanceMetrics {
  /** Widget name */
  widgetName: string;
  /** Load start time */
  loadStart: number;
  /** Load end time */
  loadEnd?: number;
  /** Load duration (ms) */
  loadDuration?: number;
  /** Error (if any) */
  error?: Error;
  /** Timestamp */
  timestamp: number;
}

/**
 * Widget state for lazy loading
 */
export interface WidgetLazyLoadState {
  /** Is widget visible */
  isVisible: boolean;
  /** Has widget been loaded */
  hasLoaded: boolean;
  /** Loading status */
  status: WidgetLoadingStatus;
}

// ============================================================================
// B3 (BOVESPA) SPECIFIC TYPES
// ============================================================================

/**
 * B3 Symbol formatter options
 */
export interface B3SymbolOptions {
  /** Ticker (e.g., "PETR4") */
  ticker: string;
  /** Exchange (default: "BMFBOVESPA") */
  exchange?: string;
  /** Include exchange prefix (default: true) */
  includeExchange?: boolean;
}

/**
 * B3 Popular symbols categories
 */
export type B3SymbolCategory =
  | 'blue_chips'       // PETR4, VALE3, ITUB4, etc.
  | 'high_liquidity'   // Top 20 most traded
  | 'indices'          // IBOV, IFIX, SMLL, etc.
  | 'sectors'          // By sector (finance, energy, etc.)
  | 'all';

/**
 * B3 Symbol metadata
 */
export interface B3Symbol extends TradingViewSymbol {
  /** Ticker (e.g., "PETR4") */
  ticker: string;
  /** Full name */
  name: string;
  /** Sector */
  sector?: string;
  /** Segment */
  segment?: string;
  /** Is index */
  isIndex?: boolean;
  /** Market cap (if available) */
  marketCap?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Widget configuration builder options
 */
export interface WidgetConfigOptions {
  /** Base props */
  baseProps: BaseTradingViewProps;
  /** Custom props (widget-specific) */
  customProps?: Record<string, any>;
  /** Override container ID */
  containerId?: string;
}

/**
 * Symbol navigation options
 */
export interface SymbolNavigationOptions {
  /** Current symbol */
  currentSymbol: string;
  /** Available symbols */
  symbols: string[];
  /** On symbol change callback */
  onSymbolChange?: (symbol: string) => void;
  /** Enable keyboard navigation */
  enableKeyboard?: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for TradingViewSymbol
 */
export function isTradingViewSymbol(obj: any): obj is TradingViewSymbol {
  return obj && typeof obj === 'object' && typeof obj.proName === 'string';
}

/**
 * Type guard for B3Symbol
 */
export function isB3Symbol(obj: any): obj is B3Symbol {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.proName === 'string' &&
    typeof obj.ticker === 'string' &&
    typeof obj.name === 'string'
  );
}

// ============================================================================
// END OF TYPE DEFINITIONS
// ============================================================================

/**
 * All types are exported above using `export interface` and `export type`.
 * No need for re-exports.
 *
 * Total: 22+ interfaces for all TradingView widgets + utilities + B3-specific types.
 */
