/**
 * useSymbolNavigation - Symbol Navigation Hook
 *
 * Manage dynamic symbol navigation for TradingView widgets.
 *
 * Features:
 * - Navigate between symbols (prev/next)
 * - Jump to specific symbol by index
 * - Keyboard navigation (arrow keys)
 * - Circular navigation (loop)
 * - Symbol search/filter
 *
 * @module tradingview/hooks/useSymbolNavigation
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { SymbolNavigationOptions } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseSymbolNavigationOptions {
  /** Array of symbols */
  symbols: string[];
  /** Initial symbol (default: first symbol) */
  initialSymbol?: string;
  /** Enable keyboard navigation (default: false) */
  enableKeyboard?: boolean;
  /** Circular navigation (loop back to start/end) (default: true) */
  circular?: boolean;
  /** Callback when symbol changes */
  onSymbolChange?: (symbol: string, index: number) => void;
}

export interface UseSymbolNavigationReturn {
  /** Current symbol */
  currentSymbol: string;
  /** Current index */
  currentIndex: number;
  /** Total symbols count */
  totalSymbols: number;
  /** Navigate to next symbol */
  next: () => void;
  /** Navigate to previous symbol */
  prev: () => void;
  /** Go to specific index */
  goTo: (index: number) => void;
  /** Go to specific symbol */
  goToSymbol: (symbol: string) => void;
  /** Can go to next */
  canGoNext: boolean;
  /** Can go to previous */
  canGoPrev: boolean;
  /** Is first symbol */
  isFirst: boolean;
  /** Is last symbol */
  isLast: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for dynamic symbol navigation in TradingView widgets
 *
 * @example
 * ```tsx
 * const { currentSymbol, next, prev, canGoNext, canGoPrev } = useSymbolNavigation({
 *   symbols: ['BMFBOVESPA:PETR4', 'BMFBOVESPA:VALE3', 'BMFBOVESPA:ITUB4'],
 *   initialSymbol: 'BMFBOVESPA:PETR4',
 *   enableKeyboard: true,
 *   onSymbolChange: (symbol) => console.log('Changed to:', symbol),
 * });
 *
 * return (
 *   <>
 *     <button onClick={prev} disabled={!canGoPrev}>Previous</button>
 *     <MiniChart symbol={currentSymbol} />
 *     <button onClick={next} disabled={!canGoNext}>Next</button>
 *   </>
 * );
 * ```
 */
export function useSymbolNavigation(
  options: UseSymbolNavigationOptions
): UseSymbolNavigationReturn {
  const {
    symbols,
    initialSymbol,
    enableKeyboard = false,
    circular = true,
    onSymbolChange,
  } = options;

  // Validate symbols array
  if (!symbols || symbols.length === 0) {
    throw new Error('[useSymbolNavigation] symbols array cannot be empty');
  }

  // Find initial index
  const initialIndex = useMemo(() => {
    if (initialSymbol) {
      const index = symbols.indexOf(initialSymbol);
      return index >= 0 ? index : 0;
    }
    return 0;
  }, [symbols, initialSymbol]);

  // State
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Current symbol
  const currentSymbol = symbols[currentIndex];

  // Total symbols
  const totalSymbols = symbols.length;

  // Computed: can go next/prev
  const canGoNext = circular || currentIndex < totalSymbols - 1;
  const canGoPrev = circular || currentIndex > 0;

  // Computed: is first/last
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSymbols - 1;

  /**
   * Go to specific index (with bounds checking)
   */
  const goTo = useCallback(
    (index: number) => {
      let newIndex = index;

      // Bounds checking
      if (circular) {
        // Circular: wrap around
        newIndex = ((index % totalSymbols) + totalSymbols) % totalSymbols;
      } else {
        // Non-circular: clamp
        newIndex = Math.max(0, Math.min(index, totalSymbols - 1));
      }

      // Update state
      setCurrentIndex(newIndex);

      // Call callback
      if (onSymbolChange) {
        onSymbolChange(symbols[newIndex], newIndex);
      }
    },
    [circular, totalSymbols, symbols, onSymbolChange]
  );

  /**
   * Navigate to next symbol
   */
  const next = useCallback(() => {
    if (canGoNext) {
      goTo(currentIndex + 1);
    }
  }, [currentIndex, canGoNext, goTo]);

  /**
   * Navigate to previous symbol
   */
  const prev = useCallback(() => {
    if (canGoPrev) {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, canGoPrev, goTo]);

  /**
   * Go to specific symbol
   */
  const goToSymbol = useCallback(
    (symbol: string) => {
      const index = symbols.indexOf(symbol);
      if (index >= 0) {
        goTo(index);
      } else {
        console.warn(`[useSymbolNavigation] Symbol "${symbol}" not found in symbols array`);
      }
    },
    [symbols, goTo]
  );

  /**
   * Keyboard navigation (arrow keys)
   */
  useEffect(() => {
    if (!enableKeyboard) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        return;
      }

      // Prevent default scrolling behavior
      event.preventDefault();

      if (event.key === 'ArrowLeft') {
        prev();
      } else if (event.key === 'ArrowRight') {
        next();
      }
    };

    // Attach listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboard, next, prev]);

  return {
    currentSymbol,
    currentIndex,
    totalSymbols,
    next,
    prev,
    goTo,
    goToSymbol,
    canGoNext,
    canGoPrev,
    isFirst,
    isLast,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default useSymbolNavigation;
