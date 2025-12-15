'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  HistogramData,
  Time,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { useChartSyncOptional } from './chart-sync-context';

const CHART_ID = 'macd-indicator';

interface MacdChartProps {
  data: Array<{ date: string }>;
  macdValues: {
    line: number[];
    signal: number[];
    histogram: number[];
  };
}

export const MacdChart = forwardRef<any, MacdChartProps>(
  ({ data, macdValues }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // FASE 124: Chart sync context
    const chartSync = useChartSyncOptional();

    useImperativeHandle(ref, () => ({
      getChart: () => chartRef.current,
    }));

    useEffect(() => {
      if (!chartContainerRef.current || data.length === 0) return;

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#a1a1aa',
        },
        grid: {
          vertLines: { color: '#27272a' },
          horzLines: { color: '#27272a' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 200,
        timeScale: {
          borderColor: '#27272a',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#27272a',
        },
        crosshair: {
          mode: 1,
        },
      });

      chartRef.current = chart;

      const sortedData = [...data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // MACD Histogram (verde/vermelho)
      const histogramSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      });

      const histogramData: HistogramData[] = macdValues.histogram.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
        color: value >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
      })).filter((d) => d.value !== null && !isNaN(d.value));

      histogramSeries.setData(histogramData);

      // MACD Line (azul)
      const macdLineSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6', // blue-500
        lineWidth: 2,
        title: 'MACD',
      });

      const macdLineData: LineData[] = macdValues.line.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      macdLineSeries.setData(macdLineData);

      // Signal Line (laranja)
      const signalSeries = chart.addSeries(LineSeries, {
        color: '#f97316', // orange-500
        lineWidth: 2,
        title: 'Signal',
      });

      const signalData: LineData[] = macdValues.signal.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      signalSeries.setData(signalData);

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // FASE 124: Setup crosshair and time scale sync
      let crosshairHandler: ((param: { time?: unknown; point?: unknown }) => void) | undefined;
      let timeScaleHandler: ((range: { from?: unknown; to?: unknown } | null) => void) | undefined;

      if (chartSync) {
        chartSync.registerChart(CHART_ID, chart);

        crosshairHandler = (param) => {
          if (param.time && param.point) {
            chartSync.updateCrosshair(param.time as Time, CHART_ID);
          } else {
            chartSync.updateCrosshair(null, CHART_ID);
          }
        };

        timeScaleHandler = (range) => {
          if (range && range.from && range.to) {
            chartSync.syncTimeScale(CHART_ID, range.from as Time, range.to as Time);
          }
        };

        chart.subscribeCrosshairMove(crosshairHandler);
        chart.timeScale().subscribeVisibleTimeRangeChange(timeScaleHandler);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        if (crosshairHandler) {
          chart.unsubscribeCrosshairMove(crosshairHandler);
        }
        if (timeScaleHandler) {
          chart.timeScale().unsubscribeVisibleTimeRangeChange(timeScaleHandler);
        }
        if (chartSync) {
          chartSync.unregisterChart(CHART_ID);
        }
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }, [data, macdValues, chartSync]);

    return (
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ position: 'relative' }}
      />
    );
  }
);

MacdChart.displayName = 'MacdChart';
