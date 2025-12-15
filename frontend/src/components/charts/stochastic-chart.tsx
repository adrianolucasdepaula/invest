'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
  LineSeries,
} from 'lightweight-charts';
import { useChartSyncOptional } from './chart-sync-context';

const CHART_ID = 'stochastic-indicator';

interface StochasticChartProps {
  data: Array<{ date: string }>;
  stochasticValues: {
    k: number[];
    d: number[];
  };
}

export const StochasticChart = forwardRef<any, StochasticChartProps>(
  ({ data, stochasticValues }, ref) => {
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
        height: 150,
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

      // %K Line (azul)
      const kSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6', // blue-500
        lineWidth: 2,
        title: '%K',
      });

      const kData: LineData[] = stochasticValues.k.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      kSeries.setData(kData);

      // %D Line (laranja)
      const dSeries = chart.addSeries(LineSeries, {
        color: '#f97316', // orange-500
        lineWidth: 2,
        title: '%D',
      });

      const dData: LineData[] = stochasticValues.d.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      dSeries.setData(dData);

      // Add overbought/oversold lines (80 and 20)
      const overboughtSeries = chart.addSeries(LineSeries, {
        color: '#ef4444', // red-500
        lineWidth: 1,
        lineStyle: 1,
        title: 'Overbought (80)',
      });

      const overboughtData: LineData[] = sortedData.map((d) => ({
        time: d.date as Time,
        value: 80,
      }));

      overboughtSeries.setData(overboughtData);

      const oversoldSeries = chart.addSeries(LineSeries, {
        color: '#22c55e', // green-500
        lineWidth: 1,
        lineStyle: 1,
        title: 'Oversold (20)',
      });

      const oversoldData: LineData[] = sortedData.map((d) => ({
        time: d.date as Time,
        value: 20,
      }));

      oversoldSeries.setData(oversoldData);

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
    }, [data, stochasticValues, chartSync]);

    return (
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ position: 'relative' }}
      />
    );
  }
);

StochasticChart.displayName = 'StochasticChart';
