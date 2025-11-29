/**
 * useWidgetLazyLoad - Lazy Loading Hook with Intersection Observer
 *
 * Automatically load TradingView widgets only when visible in viewport.
 *
 * Features:
 * - Intersection Observer API
 * - Configurable threshold and margins
 * - SSR-safe
 * - Performance optimization
 *
 * @module tradingview/hooks/useWidgetLazyLoad
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WidgetLazyLoadState } from '../types';
import { LAZY_LOAD_OPTIONS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UseWidgetLazyLoadOptions {
  /** Enable lazy loading (default: true) */
  enabled?: boolean;
  /** Root margin for Intersection Observer (default: '50px') */
  rootMargin?: string;
  /** Threshold for Intersection Observer (default: 0.1) */
  threshold?: number | number[];
  /** Root element (default: viewport) */
  root?: Element | null;
  /** Callback when widget becomes visible */
  onVisible?: () => void;
  /** Callback when widget becomes hidden */
  onHidden?: () => void;
}

export interface UseWidgetLazyLoadReturn {
  /** Ref to attach to widget container */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Is widget visible */
  isVisible: boolean;
  /** Has widget been loaded at least once */
  hasLoaded: boolean;
  /** Should load widget (visible or already loaded) */
  shouldLoad: boolean;
  /** Lazy load state */
  state: WidgetLazyLoadState;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for lazy loading TradingView widgets with Intersection Observer
 *
 * @example
 * ```tsx
 * const { ref, shouldLoad } = useWidgetLazyLoad({
 *   onVisible: () => console.log('Widget is now visible!'),
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {shouldLoad && <TickerTape symbols={symbols} />}
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Disabled lazy loading (always load)
 * const { ref, shouldLoad } = useWidgetLazyLoad({ enabled: false });
 * // shouldLoad will always be true
 * ```
 */
export function useWidgetLazyLoad(
  options: UseWidgetLazyLoadOptions = {}
): UseWidgetLazyLoadReturn {
  const {
    enabled = true,
    rootMargin = LAZY_LOAD_OPTIONS.rootMargin,
    threshold = LAZY_LOAD_OPTIONS.threshold,
    root = LAZY_LOAD_OPTIONS.root,
    onVisible,
    onHidden,
  } = options;

  // Ref for the widget container
  const ref = useRef<HTMLDivElement>(null);

  // State
  const [isVisible, setIsVisible] = useState(!enabled); // If disabled, consider always visible
  const [hasLoaded, setHasLoaded] = useState(!enabled); // If disabled, consider already loaded

  // Computed: should load widget
  const shouldLoad = !enabled || isVisible || hasLoaded;

  // Lazy load state
  const state: WidgetLazyLoadState = {
    isVisible,
    hasLoaded,
    status: !enabled
      ? 'loaded' // Disabled = always loaded
      : hasLoaded
      ? 'loaded'
      : isVisible
      ? 'loading'
      : 'idle',
  };

  // Callback refs to avoid recreating observer
  const onVisibleRef = useRef(onVisible);
  const onHiddenRef = useRef(onHidden);

  useEffect(() => {
    onVisibleRef.current = onVisible;
    onHiddenRef.current = onHidden;
  }, [onVisible, onHidden]);

  // Intersection Observer
  useEffect(() => {
    // Skip if lazy loading is disabled
    if (!enabled) {
      return;
    }

    // Skip if no ref or IntersectionObserver not supported
    if (!ref.current || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: load immediately
      setIsVisible(true);
      setHasLoaded(true);
      return;
    }

    const element = ref.current;

    // Create observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const nowVisible = entry.isIntersecting;

          setIsVisible(nowVisible);

          if (nowVisible) {
            // Widget became visible
            setHasLoaded(true); // Mark as loaded (won't unload even if scrolled away)

            // Call onVisible callback
            if (onVisibleRef.current) {
              onVisibleRef.current();
            }
          } else {
            // Widget became hidden
            if (onHiddenRef.current) {
              onHiddenRef.current();
            }
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    // Observe element
    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [enabled, root, rootMargin, threshold]);

  return {
    ref,
    isVisible,
    hasLoaded,
    shouldLoad,
    state,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default useWidgetLazyLoad;
