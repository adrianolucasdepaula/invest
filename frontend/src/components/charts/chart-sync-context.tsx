'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { IChartApi, Time } from 'lightweight-charts';

/**
 * FASE 124: Chart Synchronization Context
 *
 * This context enables crosshair and time range synchronization
 * across multiple chart panes (candlestick, RSI, MACD, Stochastic).
 */

interface CrosshairPosition {
  time: Time | null;
  sourceChartId: string;
}

interface ChartSyncContextValue {
  // Crosshair sync
  crosshairPosition: CrosshairPosition;
  updateCrosshair: (time: Time | null, sourceChartId: string) => void;

  // Chart registration
  registerChart: (chartId: string, chart: IChartApi) => void;
  unregisterChart: (chartId: string) => void;

  // Time scale sync
  syncTimeScale: (sourceChartId: string, from: Time, to: Time) => void;
}

const ChartSyncContext = createContext<ChartSyncContextValue | null>(null);

interface ChartSyncProviderProps {
  children: ReactNode;
}

export function ChartSyncProvider({ children }: ChartSyncProviderProps) {
  const [crosshairPosition, setCrosshairPosition] = useState<CrosshairPosition>({
    time: null,
    sourceChartId: '',
  });

  // Store chart references for time scale sync
  const chartsRef = useMemo(() => new Map<string, IChartApi>(), []);

  const updateCrosshair = useCallback((time: Time | null, sourceChartId: string) => {
    setCrosshairPosition({ time, sourceChartId });
  }, []);

  const registerChart = useCallback((chartId: string, chart: IChartApi) => {
    chartsRef.set(chartId, chart);
  }, [chartsRef]);

  const unregisterChart = useCallback((chartId: string) => {
    chartsRef.delete(chartId);
  }, [chartsRef]);

  const syncTimeScale = useCallback((sourceChartId: string, from: Time, to: Time) => {
    chartsRef.forEach((chart, chartId) => {
      if (chartId !== sourceChartId) {
        try {
          chart.timeScale().setVisibleRange({ from, to });
        } catch {
          // Chart might not be ready yet
        }
      }
    });
  }, [chartsRef]);

  const value = useMemo<ChartSyncContextValue>(() => ({
    crosshairPosition,
    updateCrosshair,
    registerChart,
    unregisterChart,
    syncTimeScale,
  }), [crosshairPosition, updateCrosshair, registerChart, unregisterChart, syncTimeScale]);

  return (
    <ChartSyncContext.Provider value={value}>
      {children}
    </ChartSyncContext.Provider>
  );
}

export function useChartSync() {
  const context = useContext(ChartSyncContext);
  if (!context) {
    throw new Error('useChartSync must be used within ChartSyncProvider');
  }
  return context;
}

/**
 * Optional version that returns null when used outside provider
 * Allows charts to work both standalone and in synced mode
 */
export function useChartSyncOptional() {
  return useContext(ChartSyncContext);
}

/**
 * Hook to use in individual chart components
 * Handles crosshair subscription and broadcasting
 */
export function useChartCrosshairSync(chartId: string, chartRef: { current: IChartApi | null }) {
  const { crosshairPosition, updateCrosshair, registerChart, unregisterChart, syncTimeScale } = useChartSync();

  const setupCrosshairSync = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return () => {};

    // Register chart for time scale sync
    registerChart(chartId, chart);

    // Handler references for unsubscribe
    const crosshairHandler = (param: { time?: unknown; point?: unknown }) => {
      if (param.time && param.point) {
        updateCrosshair(param.time as Time, chartId);
      } else {
        updateCrosshair(null, chartId);
      }
    };

    const timeScaleHandler = (range: { from?: unknown; to?: unknown } | null) => {
      if (range && range.from && range.to) {
        syncTimeScale(chartId, range.from as Time, range.to as Time);
      }
    };

    // Subscribe to crosshair moves
    chart.subscribeCrosshairMove(crosshairHandler);

    // Subscribe to time scale changes
    chart.timeScale().subscribeVisibleTimeRangeChange(timeScaleHandler);

    return () => {
      chart.unsubscribeCrosshairMove(crosshairHandler);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(timeScaleHandler);
      unregisterChart(chartId);
    };
  }, [chartId, chartRef, registerChart, unregisterChart, updateCrosshair, syncTimeScale]);

  return {
    crosshairPosition,
    setupCrosshairSync,
    isSourceChart: crosshairPosition.sourceChartId === chartId,
  };
}
