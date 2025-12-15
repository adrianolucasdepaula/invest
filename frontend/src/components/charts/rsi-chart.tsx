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

const CHART_ID = 'rsi-indicator';

interface RsiChartProps {
  data: Array<{ date: string }>;
  rsiValues: number[];
}

export const RsiChart = forwardRef<any, RsiChartProps>(
  ({ data, rsiValues }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

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

      // RSI Line Series
      const rsiSeries = chart.addSeries(LineSeries, {
        color: '#a855f7', // purple-500
        lineWidth: 2,
        title: 'RSI (14)',
      });
      rsiSeriesRef.current = rsiSeries;

      const sortedData = [...data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const rsiData: LineData[] = rsiValues.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      rsiSeries.setData(rsiData);

      // Add overbought/oversold lines (70 and 30)
      const overboughtSeries = chart.addSeries(LineSeries, {
        color: '#ef4444', // red-500
        lineWidth: 1,
        lineStyle: 1, // Dotted
        title: 'Overbought (70)',
      });

      const overboughtData: LineData[] = sortedData.map((d) => ({
        time: d.date as Time,
        value: 70,
      }));

      overboughtSeries.setData(overboughtData);

      const oversoldSeries = chart.addSeries(LineSeries, {
        color: '#22c55e', // green-500
        lineWidth: 1,
        lineStyle: 1, // Dotted
        title: 'Oversold (30)',
      });

      const oversoldData: LineData[] = sortedData.map((d) => ({
        time: d.date as Time,
        value: 30,
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
    }, [data, rsiValues, chartSync]);

    return (
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ position: 'relative' }}
      />
    );
  }
);

RsiChart.displayName = 'RsiChart';
