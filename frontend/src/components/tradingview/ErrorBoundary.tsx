/**
 * WidgetErrorBoundary - Error boundary for TradingView widgets
 *
 * Wraps individual widgets to prevent widget failures from breaking the entire app.
 *
 * @module tradingview/ErrorBoundary
 * @version 1.0.0
 * @created 2025-11-20
 */

'use client';

import { Component, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface WidgetErrorBoundaryProps {
  /** Widget name (for error reporting) */
  widgetName: string;
  /** Children to wrap */
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: (error: Error, widgetName: string) => ReactNode;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface WidgetErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error object (if any) */
  error?: Error;
  /** Error info from React */
  errorInfo?: React.ErrorInfo;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error boundary for TradingView widgets
 *
 * @example
 * ```tsx
 * <WidgetErrorBoundary widgetName="TickerTape">
 *   <TickerTape symbols={symbols} />
 * </WidgetErrorBoundary>
 * ```
 *
 * @example Custom fallback
 * ```tsx
 * <WidgetErrorBoundary
 *   widgetName="MarketOverview"
 *   fallback={(error, name) => (
 *     <div>Custom error UI for {name}: {error.message}</div>
 *   )}
 * >
 *   <MarketOverview />
 * </WidgetErrorBoundary>
 * ```
 */
export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error to console and call custom error handler
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { widgetName, onError } = this.props;

    // Log to console
    console.error(`[TradingView] ${widgetName} crashed:`, error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  /**
   * Render fallback UI or children
   */
  render(): ReactNode {
    const { hasError, error } = this.state;
    const { widgetName, children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, widgetName);
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[100px] p-4 border border-red-500 rounded-md bg-red-50 dark:bg-red-950">
          <div className="text-center">
            <div className="mb-2">
              <svg
                className="inline-block w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
              Widget &quot;{widgetName}&quot; falhou ao carregar
            </p>
            <p className="text-sm text-red-500 dark:text-red-300 max-w-md">
              {error.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 text-sm text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default WidgetErrorBoundary;
