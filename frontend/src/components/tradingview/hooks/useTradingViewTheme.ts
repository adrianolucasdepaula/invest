/**
 * useTradingViewTheme - Theme Synchronization Hook
 *
 * Integrates TradingView widgets with next-themes for automatic dark/light mode.
 *
 * Features:
 * - Auto-sync with system theme (next-themes)
 * - Manual theme override
 * - SSR-safe
 * - Type-safe
 *
 * @module tradingview/hooks/useTradingViewTheme
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import type { TradingViewTheme } from '../types';
import { DEFAULT_THEME } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UseTradingViewThemeOptions {
  /** Override theme (ignores system theme if set) */
  overrideTheme?: TradingViewTheme;
  /** Default theme (used until next-themes is ready) */
  defaultTheme?: TradingViewTheme;
}

export interface UseTradingViewThemeReturn {
  /** Current theme for TradingView widgets */
  theme: TradingViewTheme;
  /** Is theme ready (next-themes mounted) */
  isReady: boolean;
  /** Manually set theme */
  setTheme: (theme: TradingViewTheme) => void;
  /** Toggle between light/dark */
  toggleTheme: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for TradingView theme synchronization with next-themes
 *
 * @example
 * ```tsx
 * const { theme, isReady } = useTradingViewTheme();
 *
 * return (
 *   <TickerTape
 *     symbols={symbols}
 *     colorTheme={theme}
 *   />
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Manual override
 * const { theme } = useTradingViewTheme({
 *   overrideTheme: 'dark', // Always use dark mode
 * });
 * ```
 */
export function useTradingViewTheme(
  options: UseTradingViewThemeOptions = {}
): UseTradingViewThemeReturn {
  const { overrideTheme, defaultTheme = DEFAULT_THEME } = options;

  // Get next-themes hook (may be undefined during SSR)
  const nextTheme = useTheme();

  // Local state for manual override
  const [manualTheme, setManualTheme] = useState<TradingViewTheme | null>(null);

  // Compute current theme
  const [theme, setTheme] = useState<TradingViewTheme>(defaultTheme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Priority:
    // 1. Manual override (via setTheme)
    // 2. Props override (overrideTheme)
    // 3. next-themes (system preference)
    // 4. Default theme

    let computedTheme: TradingViewTheme = defaultTheme;

    if (manualTheme) {
      // Manual override (highest priority)
      computedTheme = manualTheme;
    } else if (overrideTheme) {
      // Props override
      computedTheme = overrideTheme;
    } else if (nextTheme?.theme) {
      // next-themes system preference
      computedTheme = (nextTheme.theme === 'dark' ? 'dark' : 'light') as TradingViewTheme;
    }

    setTheme(computedTheme);
    setIsReady(nextTheme?.theme !== undefined);
  }, [manualTheme, overrideTheme, nextTheme?.theme, defaultTheme]);

  /**
   * Manually set theme (overrides system preference)
   */
  const handleSetTheme = (newTheme: TradingViewTheme) => {
    setManualTheme(newTheme);
  };

  /**
   * Toggle between light/dark
   */
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    handleSetTheme(newTheme);
  };

  return {
    theme,
    isReady,
    setTheme: handleSetTheme,
    toggleTheme,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default useTradingViewTheme;
