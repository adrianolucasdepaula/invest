/**
 * symbolFormatter - B3 Symbol Formatting Utilities
 *
 * Convert between B3 ticker formats and TradingView format.
 *
 * @module tradingview/utils/symbolFormatter
 * @version 1.0.0
 * @created 2025-11-20
 */

import type { B3Symbol, B3SymbolOptions, TradingViewSymbol } from '../types';
import { B3_EXCHANGE } from '../constants';

// ============================================================================
// SYMBOL FORMATTING
// ============================================================================

/**
 * Format B3 ticker to TradingView format
 *
 * @example
 * ```ts
 * formatB3ToTradingView('PETR4') // "BMFBOVESPA:PETR4"
 * formatB3ToTradingView('PETR4', { exchange: 'BMFBOVESPA' }) // "BMFBOVESPA:PETR4"
 * formatB3ToTradingView('PETR4', { includeExchange: false }) // "PETR4"
 * ```
 */
export function formatB3ToTradingView(
  ticker: string,
  options: Partial<B3SymbolOptions> = {}
): string {
  const {
    exchange = B3_EXCHANGE,
    includeExchange = true,
  } = options;

  if (!ticker) {
    throw new Error('[symbolFormatter] ticker is required');
  }

  // Clean ticker (remove spaces, convert to uppercase)
  const cleanTicker = ticker.trim().toUpperCase();

  // Return with or without exchange
  return includeExchange ? `${exchange}:${cleanTicker}` : cleanTicker;
}

/**
 * Parse TradingView symbol to B3 ticker
 *
 * @example
 * ```ts
 * parseTradingViewToB3('BMFBOVESPA:PETR4') // "PETR4"
 * parseTradingViewToB3('PETR4') // "PETR4"
 * ```
 */
export function parseTradingViewToB3(symbol: string): string {
  if (!symbol) {
    throw new Error('[symbolFormatter] symbol is required');
  }

  // Split by colon
  const parts = symbol.split(':');

  // Return ticker (last part)
  return parts[parts.length - 1].trim().toUpperCase();
}

/**
 * Create TradingViewSymbol from B3 ticker
 *
 * @example
 * ```ts
 * createTradingViewSymbol('PETR4', 'Petrobras')
 * // { proName: 'BMFBOVESPA:PETR4', title: 'Petrobras' }
 * ```
 */
export function createTradingViewSymbol(
  ticker: string,
  title?: string
): TradingViewSymbol {
  return {
    proName: formatB3ToTradingView(ticker),
    title: title || ticker,
  };
}

/**
 * Create B3Symbol from ticker with metadata
 *
 * @example
 * ```ts
 * createB3Symbol('PETR4', {
 *   name: 'Petrobras PN',
 *   sector: 'Petróleo, Gás e Biocombustíveis',
 * })
 * ```
 */
export function createB3Symbol(
  ticker: string,
  metadata: Partial<Omit<B3Symbol, 'proName' | 'ticker'>>
): B3Symbol {
  return {
    proName: formatB3ToTradingView(ticker),
    ticker: ticker.toUpperCase(),
    title: metadata.title || ticker,
    name: metadata.name || ticker,
    sector: metadata.sector,
    segment: metadata.segment,
    isIndex: metadata.isIndex,
    marketCap: metadata.marketCap,
  };
}

/**
 * Batch convert B3 tickers to TradingView format
 *
 * @example
 * ```ts
 * batchFormatB3ToTradingView(['PETR4', 'VALE3', 'ITUB4'])
 * // ['BMFBOVESPA:PETR4', 'BMFBOVESPA:VALE3', 'BMFBOVESPA:ITUB4']
 * ```
 */
export function batchFormatB3ToTradingView(
  tickers: string[],
  options: Partial<B3SymbolOptions> = {}
): string[] {
  return tickers.map((ticker) => formatB3ToTradingView(ticker, options));
}

/**
 * Batch create TradingViewSymbol from B3 tickers
 *
 * @example
 * ```ts
 * batchCreateTradingViewSymbols([
 *   { ticker: 'PETR4', title: 'Petrobras' },
 *   { ticker: 'VALE3', title: 'Vale' },
 * ])
 * ```
 */
export function batchCreateTradingViewSymbols(
  items: Array<{ ticker: string; title?: string }>
): TradingViewSymbol[] {
  return items.map(({ ticker, title }) => createTradingViewSymbol(ticker, title));
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate B3 ticker format (basic validation)
 *
 * @example
 * ```ts
 * isValidB3Ticker('PETR4') // true
 * isValidB3Ticker('VALE3') // true
 * isValidB3Ticker('INVALID') // false (too short)
 * ```
 */
export function isValidB3Ticker(ticker: string): boolean {
  if (!ticker || typeof ticker !== 'string') {
    return false;
  }

  const cleanTicker = ticker.trim().toUpperCase();

  // B3 tickers are typically 4-6 characters (e.g., PETR4, ITUB4, ABEV3)
  // Some indices are 4 chars (e.g., IBOV, IFIX)
  return /^[A-Z]{4,6}[0-9]{0,2}$/.test(cleanTicker);
}

/**
 * Validate TradingView symbol format
 *
 * @example
 * ```ts
 * isValidTradingViewSymbol('BMFBOVESPA:PETR4') // true
 * isValidTradingViewSymbol('PETR4') // true
 * isValidTradingViewSymbol('INVALID:') // false
 * ```
 */
export function isValidTradingViewSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }

  const cleanSymbol = symbol.trim();

  // Format: EXCHANGE:TICKER or just TICKER
  const parts = cleanSymbol.split(':');

  if (parts.length === 1) {
    // Just ticker (e.g., "PETR4")
    return /^[A-Z0-9_-]+$/.test(parts[0]);
  } else if (parts.length === 2) {
    // Exchange + ticker (e.g., "BMFBOVESPA:PETR4")
    return (
      /^[A-Z0-9_-]+$/.test(parts[0]) &&
      /^[A-Z0-9_-]+$/.test(parts[1])
    );
  }

  return false;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Extract exchange from TradingView symbol
 *
 * @example
 * ```ts
 * getExchangeFromSymbol('BMFBOVESPA:PETR4') // "BMFBOVESPA"
 * getExchangeFromSymbol('PETR4') // null
 * ```
 */
export function getExchangeFromSymbol(symbol: string): string | null {
  const parts = symbol.split(':');
  return parts.length === 2 ? parts[0] : null;
}

/**
 * Extract ticker from TradingView symbol
 *
 * @example
 * ```ts
 * getTickerFromSymbol('BMFBOVESPA:PETR4') // "PETR4"
 * getTickerFromSymbol('PETR4') // "PETR4"
 * ```
 */
export function getTickerFromSymbol(symbol: string): string {
  return parseTradingViewToB3(symbol);
}

/**
 * Compare two symbols (ignores exchange prefix)
 *
 * @example
 * ```ts
 * areSymbolsEqual('BMFBOVESPA:PETR4', 'PETR4') // true
 * areSymbolsEqual('PETR4', 'VALE3') // false
 * ```
 */
export function areSymbolsEqual(symbol1: string, symbol2: string): boolean {
  const ticker1 = getTickerFromSymbol(symbol1);
  const ticker2 = getTickerFromSymbol(symbol2);
  return ticker1 === ticker2;
}

/**
 * Normalize symbol (always include exchange prefix)
 *
 * @example
 * ```ts
 * normalizeSymbol('PETR4') // "BMFBOVESPA:PETR4"
 * normalizeSymbol('BMFBOVESPA:PETR4') // "BMFBOVESPA:PETR4"
 * ```
 */
export function normalizeSymbol(symbol: string, exchange: string = B3_EXCHANGE): string {
  // Check if already has exchange prefix
  if (symbol.includes(':')) {
    return symbol;
  }

  // Add exchange prefix
  return `${exchange}:${symbol}`;
}

// ============================================================================
// EXPORT
// ============================================================================

const symbolFormatterUtils = {
  formatB3ToTradingView,
  parseTradingViewToB3,
  createTradingViewSymbol,
  createB3Symbol,
  batchFormatB3ToTradingView,
  batchCreateTradingViewSymbols,
  isValidB3Ticker,
  isValidTradingViewSymbol,
  getExchangeFromSymbol,
  getTickerFromSymbol,
  areSymbolsEqual,
  normalizeSymbol,
};

export default symbolFormatterUtils;
