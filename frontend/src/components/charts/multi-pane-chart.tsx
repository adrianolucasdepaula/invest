'use client';

import { useEffect, useRef, memo, useMemo } from 'react';
import { CandlestickChartWithOverlays } from './candlestick-chart-with-overlays';
import { RsiChart } from './rsi-chart';
import { MacdChart } from './macd-chart';
import { StochasticChart } from './stochastic-chart';

interface MultiPaneChartProps {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  indicators: {
    // Overlays
    sma20?: number[];
    sma50?: number[];
    sma200?: number[];
    ema9?: number[];
    ema21?: number[];
    bollinger?: {
      upper: number[];
      middle: number[];
      lower: number[];
    };
    pivotPoints?: {
      r2: number[];
      r1: number[];
      p: number[];
      s1: number[];
      s2: number[];
    };
    // RSI
    rsi?: number[];
    // MACD
    macd?: {
      line: number[];
      signal: number[];
      histogram: number[];
    };
    // Stochastic
    stochastic?: {
      k: number[];
      d: number[];
    };
  };
  showIndicators?: {
    sma20?: boolean;
    sma50?: boolean;
    sma200?: boolean;
    ema9?: boolean;
    ema21?: boolean;
    bollinger?: boolean;
    pivotPoints?: boolean;
    rsi?: boolean;
    macd?: boolean;
    stochastic?: boolean;
  };
}

/**
 * FASE 122: Memoized MultiPaneChart component
 * - React.memo prevents unnecessary re-renders
 * - useMemo for visibility flags
 */
function MultiPaneChartComponent({
  data,
  indicators,
  showIndicators,
}: MultiPaneChartProps) {
  // Refs para cada chart
  const candlestickChartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const stochasticChartRef = useRef<any>(null);

  // FASE 122: Memoize visibility checks
  const showRsi = useMemo(
    () => Boolean(showIndicators?.rsi && indicators?.rsi),
    [showIndicators?.rsi, indicators?.rsi]
  );

  const showMacd = useMemo(
    () => Boolean(showIndicators?.macd && indicators?.macd),
    [showIndicators?.macd, indicators?.macd]
  );

  const showStochastic = useMemo(
    () => Boolean(showIndicators?.stochastic && indicators?.stochastic),
    [showIndicators?.stochastic, indicators?.stochastic]
  );

  // Sincronizar crosshair entre charts
  useEffect(() => {
    // TODO: Implementar sincronização de crosshair
    // Usar subscribeCrosshairMove de cada chart
  }, []);

  // Sincronizar zoom/scroll entre charts
  useEffect(() => {
    // TODO: Implementar sincronização de timeRange
    // Usar subscribeVisibleTimeRangeChange de cada chart
  }, []);

  return (
    <div className="space-y-0 border rounded-lg overflow-hidden">
      {/* PANE 1: Candlestick + Overlays + Volume */}
      <div className="h-[500px] border-b">
        <CandlestickChartWithOverlays
          data={data}
          indicators={indicators}
          showIndicators={showIndicators}
        />
      </div>

      {/* PANE 2: RSI */}
      {showRsi && (
        <div className="h-[150px] border-b">
          <RsiChart
            ref={rsiChartRef}
            data={data}
            rsiValues={indicators.rsi!}
          />
        </div>
      )}

      {/* PANE 3: MACD */}
      {showMacd && (
        <div className="h-[200px] border-b">
          <MacdChart
            ref={macdChartRef}
            data={data}
            macdValues={indicators.macd!}
          />
        </div>
      )}

      {/* PANE 4: Stochastic */}
      {showStochastic && (
        <div className="h-[150px]">
          <StochasticChart
            ref={stochasticChartRef}
            data={data}
            stochasticValues={indicators.stochastic!}
          />
        </div>
      )}
    </div>
  );
}

// FASE 122: Export memoized component
export const MultiPaneChart = memo(MultiPaneChartComponent);
