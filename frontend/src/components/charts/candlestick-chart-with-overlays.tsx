'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  Time,
} from 'lightweight-charts';

interface CandlestickChartWithOverlaysProps {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  indicators?: {
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
  };
  showIndicators?: {
    sma20?: boolean;
    sma50?: boolean;
    sma200?: boolean;
    ema9?: boolean;
    ema21?: boolean;
    bollinger?: boolean;
    pivotPoints?: boolean;
  };
}

export function CandlestickChartWithOverlays({
  data,
  indicators,
  showIndicators,
}: CandlestickChartWithOverlaysProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Refs para overlays
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart (igual ao existente)
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
      height: 500, // Aumentado para acomodar overlays
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

    // Add candlestick series (igual ao existente)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series (igual ao existente)
    const volumeSeries = chart.addHistogramSeries({
      color: '#3f3f46',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeriesRef.current = volumeSeries;

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Sort data
    const sortedData = [...data].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Set candlestick and volume data
    const candlestickData: CandlestickData[] = sortedData.map((d) => ({
      time: d.date as Time,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
    }));

    const volumeData: HistogramData[] = sortedData.map((d) => ({
      time: d.date as Time,
      value: Number(d.volume),
      color:
        Number(d.close) >= Number(d.open)
          ? 'rgba(34, 197, 94, 0.3)'
          : 'rgba(239, 68, 68, 0.3)',
    }));

    candlestickSeries.setData(candlestickData);
    volumeSeries.setData(volumeData);

    // ========================================
    // NOVOS OVERLAYS
    // ========================================

    // SMA 20 (azul claro)
    if (indicators?.sma20 && showIndicators?.sma20) {
      const sma20Series = chart.addLineSeries({
        color: '#3b82f6', // blue-500
        lineWidth: 2,
        title: 'SMA 20',
      });
      sma20SeriesRef.current = sma20Series;

      const sma20Data: LineData[] = indicators.sma20
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      sma20Series.setData(sma20Data);
    }

    // SMA 50 (laranja)
    if (indicators?.sma50 && showIndicators?.sma50) {
      const sma50Series = chart.addLineSeries({
        color: '#f97316', // orange-500
        lineWidth: 2,
        title: 'SMA 50',
      });
      sma50SeriesRef.current = sma50Series;

      const sma50Data: LineData[] = indicators.sma50
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      sma50Series.setData(sma50Data);
    }

    // SMA 200 (vermelho escuro)
    if (indicators?.sma200 && showIndicators?.sma200) {
      const sma200Series = chart.addLineSeries({
        color: '#dc2626', // red-600
        lineWidth: 2,
        title: 'SMA 200',
      });
      sma200SeriesRef.current = sma200Series;

      const sma200Data: LineData[] = indicators.sma200
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      sma200Series.setData(sma200Data);
    }

    // EMA 9 (roxo)
    if (indicators?.ema9 && showIndicators?.ema9) {
      const ema9Series = chart.addLineSeries({
        color: '#a855f7', // purple-500
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'EMA 9',
      });
      ema9SeriesRef.current = ema9Series;

      const ema9Data: LineData[] = indicators.ema9
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      ema9Series.setData(ema9Data);
    }

    // EMA 21 (rosa)
    if (indicators?.ema21 && showIndicators?.ema21) {
      const ema21Series = chart.addLineSeries({
        color: '#ec4899', // pink-500
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'EMA 21',
      });
      ema21SeriesRef.current = ema21Series;

      const ema21Data: LineData[] = indicators.ema21
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      ema21Series.setData(ema21Data);
    }

    // Bollinger Bands (3 linhas)
    if (indicators?.bollinger && showIndicators?.bollinger) {
      // Upper band (cinza claro)
      const upperSeries = chart.addLineSeries({
        color: '#71717a', // zinc-500
        lineWidth: 1,
        lineStyle: 1, // Dotted
        title: 'BB Upper',
      });
      bollingerUpperSeriesRef.current = upperSeries;

      const upperData: LineData[] = indicators.bollinger.upper
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      upperSeries.setData(upperData);

      // Middle band (amarelo)
      const middleSeries = chart.addLineSeries({
        color: '#eab308', // yellow-500
        lineWidth: 2,
        title: 'BB Middle',
      });
      bollingerMiddleSeriesRef.current = middleSeries;

      const middleData: LineData[] = indicators.bollinger.middle
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      middleSeries.setData(middleData);

      // Lower band (cinza claro)
      const lowerSeries = chart.addLineSeries({
        color: '#71717a', // zinc-500
        lineWidth: 1,
        lineStyle: 1, // Dotted
        title: 'BB Lower',
      });
      bollingerLowerSeriesRef.current = lowerSeries;

      const lowerData: LineData[] = indicators.bollinger.lower
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      lowerSeries.setData(lowerData);
    }

    // Pivot Points (5 linhas horizontais)
    if (indicators?.pivotPoints && showIndicators?.pivotPoints) {
      // R2 (resistência forte - vermelho forte)
      const r2Series = chart.addLineSeries({
        color: '#b91c1c', // red-700
        lineWidth: 1,
        lineStyle: 1,
        title: 'R2',
      });

      const r2Data: LineData[] = indicators.pivotPoints.r2
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      r2Series.setData(r2Data);

      // R1 (resistência - vermelho claro)
      const r1Series = chart.addLineSeries({
        color: '#ef4444', // red-500
        lineWidth: 1,
        lineStyle: 1,
        title: 'R1',
      });

      const r1Data: LineData[] = indicators.pivotPoints.r1
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      r1Series.setData(r1Data);

      // P (pivot - amarelo)
      const pSeries = chart.addLineSeries({
        color: '#eab308', // yellow-500
        lineWidth: 2,
        title: 'Pivot',
      });

      const pData: LineData[] = indicators.pivotPoints.p
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      pSeries.setData(pData);

      // S1 (suporte - verde claro)
      const s1Series = chart.addLineSeries({
        color: '#22c55e', // green-500
        lineWidth: 1,
        lineStyle: 1,
        title: 'S1',
      });

      const s1Data: LineData[] = indicators.pivotPoints.s1
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      s1Series.setData(s1Data);

      // S2 (suporte forte - verde forte)
      const s2Series = chart.addLineSeries({
        color: '#15803d', // green-700
        lineWidth: 1,
        lineStyle: 1,
        title: 'S2',
      });

      const s2Data: LineData[] = indicators.pivotPoints.s2
        .map((value, index) => ({
          time: sortedData[index].date as Time,
          value,
        }))
        .filter((d) => d.value !== null && !isNaN(d.value));

      s2Series.setData(s2Data);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, indicators, showIndicators]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full"
      style={{ position: 'relative' }}
    />
  );
}
