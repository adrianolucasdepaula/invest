# PLANO DETALHADO - FASE 29: Gráficos Avançados e Indicadores Técnicos

**Data:** 2025-11-15
**Versão:** 1.0.0
**Estimativa Total:** 18-24 horas
**Tecnologia:** lightweight-charts 4.1.3 (estável)

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Decisões Técnicas](#decisões-técnicas)
3. [FASE 29.1: Expandir Candlestick Chart](#fase-291-expandir-candlestick-chart)
4. [FASE 29.2: Criar Multi-Pane Chart](#fase-292-criar-multi-pane-chart)
5. [FASE 29.3: Criar Página Técnica Avançada](#fase-293-criar-página-técnica-avançada)
6. [FASE 29.4: Validação MCP Triplo](#fase-294-validação-mcp-triplo)
7. [FASE 29.5: Documentação](#fase-295-documentação)
8. [FASE 29.6: Commit e Push](#fase-296-commit-e-push)

---

## 🎯 VISÃO GERAL

### Objetivo

Implementar gráficos financeiros avançados com:
- ✅ Overlays (SMA, EMA, Bollinger Bands, Pivot Points) no candlestick
- ✅ Multi-Pane Chart com 4 painéis sincronizados
- ✅ Página dedicada para análise técnica avançada
- ✅ Integração com Python Service para cálculo de indicadores

### Estrutura de Componentes

```
frontend/src/components/charts/
├── candlestick-chart.tsx (EXISTENTE - expandir)
├── candlestick-chart-with-overlays.tsx (NOVO - FASE 29.1)
├── multi-pane-chart.tsx (NOVO - FASE 29.2)
├── rsi-chart.tsx (NOVO - FASE 29.2)
├── macd-chart.tsx (NOVO - FASE 29.2)
└── stochastic-chart.tsx (NOVO - FASE 29.2)

frontend/src/app/(dashboard)/assets/[ticker]/technical/
└── page.tsx (NOVO - FASE 29.3)
```

---

## 🔧 DECISÕES TÉCNICAS

### 1. Versão lightweight-charts

**Decisão:** MANTER lightweight-charts 4.1.3
**Motivo:**
- ✅ Estável e testado em produção
- ✅ Versão 5.0+ tem múltiplos painéis nativos, MAS:
  - ❌ Ainda em versão inicial (possíveis bugs)
  - ❌ Breaking changes significativos
  - ❌ Documentação limitada para v5

**Alternativa para Multi-Pane:**
- Criar múltiplos `<div>` containers
- Criar chart separado para cada painel
- Sincronizar crosshair e zoom/scroll manualmente

### 2. Cálculo de Indicadores

**Decisão:** Usar Python Service (já implementado na FASE 28)
**Motivo:**
- ✅ 10-50x mais rápido que TypeScript
- ✅ 200+ indicadores disponíveis (pandas_ta_classic)
- ✅ 100% preciso (bibliotecas validadas)
- ✅ Fallback automático para TypeScript

**Endpoint:**
```typescript
GET http://localhost:8001/technical-analysis/indicators
Body: {
  prices: OHLCVData[],
  indicators: {
    sma: [20, 50, 200],
    ema: [9, 21],
    rsi: { period: 14 },
    macd: { fast: 12, slow: 26, signal: 9 },
    bollinger: { period: 20, std: 2 },
    stochastic: { k_period: 14, d_period: 3 },
    pivot_points: { type: 'standard' }
  }
}
```

### 3. Overlays vs Painéis Separados

**Overlays (mesmo painel do candlestick):**
- SMA (20, 50, 200) - LineSeries
- EMA (9, 21) - LineSeries
- Bollinger Bands (upper, middle, lower) - 3x LineSeries
- Pivot Points (R2, R1, P, S1, S2) - 5x LineSeries

**Painéis Separados:**
- RSI (painel 2) - LineSeries + AreaSeries (zonas)
- MACD (painel 3) - 2x LineSeries + HistogramSeries
- Stochastic (painel 4) - 2x LineSeries (%K, %D)

### 4. Sincronização entre Painéis

**Crosshair Sync:**
```typescript
chart1.subscribeCrosshairMove((param) => {
  if (param.time) {
    chart2.setCrosshairPosition(param.seriesData.values().next().value.value, param.time, chart2Series);
    chart3.setCrosshairPosition(...);
    chart4.setCrosshairPosition(...);
  }
});
```

**Zoom/Scroll Sync:**
```typescript
chart1.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
  chart2.timeScale().setVisibleRange(timeRange);
  chart3.timeScale().setVisibleRange(timeRange);
  chart4.timeScale().setVisibleRange(timeRange);
});
```

---

## 📊 FASE 29.1: Expandir Candlestick Chart

**Estimativa:** 4 horas
**Arquivo:** `frontend/src/components/charts/candlestick-chart-with-overlays.tsx`

### Props Interface

```typescript
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
```

### Exemplo de Implementação

```typescript
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

      const sma20Data: LineData[] = indicators.sma20.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

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

      const sma50Data: LineData[] = indicators.sma50.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

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

      const sma200Data: LineData[] = indicators.sma200.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

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

      const ema9Data: LineData[] = indicators.ema9.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

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

      const ema21Data: LineData[] = indicators.ema21.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

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

      const upperData: LineData[] = indicators.bollinger.upper.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      upperSeries.setData(upperData);

      // Middle band (amarelo)
      const middleSeries = chart.addLineSeries({
        color: '#eab308', // yellow-500
        lineWidth: 2,
        title: 'BB Middle',
      });
      bollingerMiddleSeriesRef.current = middleSeries;

      const middleData: LineData[] = indicators.bollinger.middle.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      middleSeries.setData(middleData);

      // Lower band (cinza claro)
      const lowerSeries = chart.addLineSeries({
        color: '#71717a', // zinc-500
        lineWidth: 1,
        lineStyle: 1, // Dotted
        title: 'BB Lower',
      });
      bollingerLowerSeriesRef.current = lowerSeries;

      const lowerData: LineData[] = indicators.bollinger.lower.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

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

      const r2Data: LineData[] = indicators.pivotPoints.r2.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      r2Series.setData(r2Data);

      // R1 (resistência - vermelho claro)
      const r1Series = chart.addLineSeries({
        color: '#ef4444', // red-500
        lineWidth: 1,
        lineStyle: 1,
        title: 'R1',
      });

      const r1Data: LineData[] = indicators.pivotPoints.r1.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      r1Series.setData(r1Data);

      // P (pivot - amarelo)
      const pSeries = chart.addLineSeries({
        color: '#eab308', // yellow-500
        lineWidth: 2,
        title: 'Pivot',
      });

      const pData: LineData[] = indicators.pivotPoints.p.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      pSeries.setData(pData);

      // S1 (suporte - verde claro)
      const s1Series = chart.addLineSeries({
        color: '#22c55e', // green-500
        lineWidth: 1,
        lineStyle: 1,
        title: 'S1',
      });

      const s1Data: LineData[] = indicators.pivotPoints.s1.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

      s1Series.setData(s1Data);

      // S2 (suporte forte - verde forte)
      const s2Series = chart.addLineSeries({
        color: '#15803d', // green-700
        lineWidth: 1,
        lineStyle: 1,
        title: 'S2',
      });

      const s2Data: LineData[] = indicators.pivotPoints.s2.map((value, index) => ({
        time: sortedData[index].date as Time,
        value,
      })).filter((d) => d.value !== null && !isNaN(d.value));

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
      className="w-full"
      style={{ position: 'relative' }}
    />
  );
}
```

### Checklist FASE 29.1

- [ ] Criar `candlestick-chart-with-overlays.tsx`
- [ ] Adicionar LineSeries para SMA 20 (azul #3b82f6)
- [ ] Adicionar LineSeries para SMA 50 (laranja #f97316)
- [ ] Adicionar LineSeries para SMA 200 (vermelho #dc2626)
- [ ] Adicionar LineSeries para EMA 9 (roxo #a855f7, dashed)
- [ ] Adicionar LineSeries para EMA 21 (rosa #ec4899, dashed)
- [ ] Adicionar 3 LineSeries para Bollinger Bands (upper, middle, lower)
- [ ] Adicionar 5 LineSeries para Pivot Points (R2, R1, P, S1, S2)
- [ ] TypeScript 0 erros
- [ ] Build Success

---

## 📊 FASE 29.2: Criar Multi-Pane Chart

**Estimativa:** 8 horas
**Arquivos:**
- `frontend/src/components/charts/multi-pane-chart.tsx` (orquestrador)
- `frontend/src/components/charts/rsi-chart.tsx`
- `frontend/src/components/charts/macd-chart.tsx`
- `frontend/src/components/charts/stochastic-chart.tsx`

### Estrutura Multi-Pane

```
┌────────────────────────────────────────┐
│  PANE 1: Candlestick + Overlays        │ 50% altura
│  (Volume no mesmo painel, 20% embaixo) │
├────────────────────────────────────────┤
│  PANE 2: RSI (14)                      │ 15% altura
├────────────────────────────────────────┤
│  PANE 3: MACD (12, 26, 9)              │ 20% altura
├────────────────────────────────────────┤
│  PANE 4: Stochastic (14, 3)            │ 15% altura
└────────────────────────────────────────┘
```

### MultiPaneChart Component

```typescript
'use client';

import { useEffect, useRef } from 'react';
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
    rsi?: boolean;
    macd?: boolean;
    stochastic?: boolean;
  };
}

export function MultiPaneChart({
  data,
  indicators,
  showIndicators,
}: MultiPaneChartProps) {
  // Refs para cada chart
  const candlestickChartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const stochasticChartRef = useRef<any>(null);

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
          ref={candlestickChartRef}
          data={data}
          indicators={indicators}
          showIndicators={showIndicators}
        />
      </div>

      {/* PANE 2: RSI */}
      {showIndicators?.rsi && indicators?.rsi && (
        <div className="h-[150px] border-b">
          <RsiChart
            ref={rsiChartRef}
            data={data}
            rsiValues={indicators.rsi}
          />
        </div>
      )}

      {/* PANE 3: MACD */}
      {showIndicators?.macd && indicators?.macd && (
        <div className="h-[200px] border-b">
          <MacdChart
            ref={macdChartRef}
            data={data}
            macdValues={indicators.macd}
          />
        </div>
      )}

      {/* PANE 4: Stochastic */}
      {showIndicators?.stochastic && indicators?.stochastic && (
        <div className="h-[150px]">
          <StochasticChart
            ref={stochasticChartRef}
            data={data}
            stochasticValues={indicators.stochastic}
          />
        </div>
      )}
    </div>
  );
}
```

### RSI Chart Component

```typescript
'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
} from 'lightweight-charts';

interface RsiChartProps {
  data: Array<{ date: string }>;
  rsiValues: number[];
}

export const RsiChart = forwardRef<any, RsiChartProps>(
  ({ data, rsiValues }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

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
      const rsiSeries = chart.addLineSeries({
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
      const overboughtSeries = chart.addLineSeries({
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

      const oversoldSeries = chart.addLineSeries({
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

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }, [data, rsiValues]);

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
```

### MACD Chart Component

```typescript
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
} from 'lightweight-charts';

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
      const histogramSeries = chart.addHistogramSeries({
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
      const macdLineSeries = chart.addLineSeries({
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
      const signalSeries = chart.addLineSeries({
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

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }, [data, macdValues]);

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
```

### Stochastic Chart Component

```typescript
'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
} from 'lightweight-charts';

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
      const kSeries = chart.addLineSeries({
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
      const dSeries = chart.addLineSeries({
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
      const overboughtSeries = chart.addLineSeries({
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

      const oversoldSeries = chart.addLineSeries({
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

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }, [data, stochasticValues]);

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
```

### Checklist FASE 29.2

- [ ] Criar `multi-pane-chart.tsx` (orquestrador)
- [ ] Criar `rsi-chart.tsx` (RSI + linhas 70/30)
- [ ] Criar `macd-chart.tsx` (MACD Line + Signal + Histogram)
- [ ] Criar `stochastic-chart.tsx` (%K + %D + linhas 80/20)
- [ ] Implementar `forwardRef` e `useImperativeHandle` em cada sub-chart
- [ ] Implementar sincronização de crosshair entre painéis
- [ ] Implementar sincronização de zoom/scroll entre painéis
- [ ] TypeScript 0 erros
- [ ] Build Success

---

## 📄 FASE 29.3: Criar Página Técnica Avançada

**Estimativa:** 4 horas
**Arquivo:** `frontend/src/app/(dashboard)/assets/[ticker]/technical/page.tsx`

### Estrutura da Página

```
┌─────────────────────────────────────────────┐
│  Breadcrumb: Home > Assets > VALE3 > Technical
├─────────────────────────────────────────────┤
│  Header: VALE3 - Análise Técnica Avançada   │
│  Preço: R$ 65,27 (+0.65%)                   │
├─────────────────────────────────────────────┤
│  Seletor de Timeframe: [1D] 1MO 3MO 6MO...  │
├─────────────────────────────────────────────┤
│  Toggle de Indicadores (Checkboxes):        │
│  [ ] SMA 20  [ ] SMA 50  [ ] SMA 200        │
│  [ ] EMA 9   [ ] EMA 21                     │
│  [ ] Bollinger Bands  [ ] Pivot Points      │
│  [ ] RSI  [ ] MACD  [ ] Stochastic          │
├─────────────────────────────────────────────┤
│  Multi-Pane Chart (ajusta altura dinamicamente)
└─────────────────────────────────────────────┘
```

### Implementação da Página

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiPaneChart } from '@/components/charts/multi-pane-chart';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function TechnicalAnalysisPage() {
  const params = useParams();
  const ticker = params.ticker as string;

  const [timeframe, setTimeframe] = useState('1D');
  const [priceData, setPriceData] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    sma50: true,
    sma200: false,
    ema9: false,
    ema21: false,
    bollinger: false,
    pivotPoints: false,
    rsi: true,
    macd: true,
    stochastic: false,
  });

  // Fetch price data
  useEffect(() => {
    const fetchPriceData = async () => {
      setIsLoading(true);
      try {
        // Determinar período baseado no timeframe
        const periodMap: { [key: string]: number } = {
          '1D': 1,
          '1MO': 30,
          '3MO': 90,
          '6MO': 180,
          '1Y': 365,
          '2Y': 730,
          '5Y': 1825,
          'MAX': 3650,
        };

        const days = periodMap[timeframe] || 30;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/market-data/${ticker}/prices?days=${days}`
        );

        if (!response.ok) throw new Error('Failed to fetch price data');

        const data = await response.json();
        setPriceData(data);

        // Set current price and change
        if (data.length > 0) {
          const latest = data[data.length - 1];
          const previous = data[data.length - 2];
          setCurrentPrice(latest.close);
          if (previous) {
            const change = ((latest.close - previous.close) / previous.close) * 100;
            setPriceChange(change);
          }
        }

        // Fetch indicators from Python Service
        await fetchIndicators(data);
      } catch (error) {
        console.error('Error fetching price data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceData();
  }, [ticker, timeframe]);

  const fetchIndicators = async (prices: any[]) => {
    try {
      const response = await fetch('http://localhost:8001/technical-analysis/indicators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prices: prices.map((p) => ({
            date: p.date,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.close,
            volume: p.volume,
          })),
          indicators: {
            sma: [20, 50, 200],
            ema: [9, 21],
            rsi: { period: 14 },
            macd: { fast: 12, slow: 26, signal: 9 },
            bollinger: { period: 20, std: 2 },
            stochastic: { k_period: 14, d_period: 3 },
            pivot_points: { type: 'standard' },
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch indicators');

      const data = await response.json();
      setIndicators(data);
    } catch (error) {
      console.error('Error fetching indicators:', error);
    }
  };

  const handleIndicatorToggle = (indicator: string) => {
    setShowIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/assets" className="hover:text-foreground">Ativos</Link>
        <span>/</span>
        <Link href={`/assets/${ticker}`} className="hover:text-foreground">{ticker}</Link>
        <span>/</span>
        <span className="text-foreground">Análise Técnica</span>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <Link href={`/assets/${ticker}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{ticker}</h1>
                <p className="text-muted-foreground">Análise Técnica Avançada</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">R$ {currentPrice.toFixed(2)}</div>
            <div className={`flex items-center justify-end space-x-1 text-sm ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeframe Selector */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          {['1D', '1MO', '3MO', '6MO', '1Y', '2Y', '5Y', 'MAX'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </Card>

      {/* Indicator Toggles */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Indicadores</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(showIndicators).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={() => handleIndicatorToggle(key)}
              />
              <label
                htmlFor={key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Multi-Pane Chart */}
      {priceData.length > 0 && indicators && (
        <Card className="p-0 overflow-hidden">
          <MultiPaneChart
            data={priceData}
            indicators={indicators}
            showIndicators={showIndicators}
          />
        </Card>
      )}
    </div>
  );
}
```

### Checklist FASE 29.3

- [ ] Criar `/assets/[ticker]/technical/page.tsx`
- [ ] Breadcrumb navigation
- [ ] Header com ticker, preço atual, variação
- [ ] Seletor de timeframe (8 opções)
- [ ] Toggle de indicadores (10 checkboxes)
- [ ] Integração com Python Service (`/technical-analysis/indicators`)
- [ ] MultiPaneChart integration
- [ ] Loading states (Skeleton)
- [ ] TypeScript 0 erros
- [ ] Build Success

---

## 🧪 FASE 29.4: Validação MCP Triplo

**Estimativa:** 2 horas

### Playwright Tests

```typescript
// frontend/tests/technical-analysis.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Technical Analysis Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3100/login');
    await page.fill('input[type="email"]', 'admin@invest.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should navigate to technical analysis page', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await expect(page.locator('h1')).toContainText('VALE3');
    await expect(page.locator('text=Análise Técnica Avançada')).toBeVisible();
  });

  test('should display multi-pane chart', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await page.waitForTimeout(3000); // Wait for charts to load

    // Check candlestick pane
    await expect(page.locator('canvas').first()).toBeVisible();

    // Check RSI pane (if enabled)
    const rsiCheckbox = page.locator('input[id="rsi"]');
    if (await rsiCheckbox.isChecked()) {
      await expect(page.locator('canvas').nth(1)).toBeVisible();
    }
  });

  test('should toggle indicators', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');

    // Toggle SMA 200
    const sma200Checkbox = page.locator('input[id="sma200"]');
    const initialState = await sma200Checkbox.isChecked();
    await sma200Checkbox.click();
    await expect(sma200Checkbox).toBeChecked(!initialState);
  });

  test('should change timeframe', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');

    // Click 1MO timeframe
    await page.click('button:has-text("1MO")');
    await expect(page.locator('button:has-text("1MO")')).toHaveClass(/default/);
  });

  test('should display price and change', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');

    // Check price is displayed
    await expect(page.locator('text=/R\\$ \\d+\\.\\d{2}/')).toBeVisible();

    // Check price change is displayed
    await expect(page.locator('text=/[+-]?\\d+\\.\\d{2}%/')).toBeVisible();
  });
});
```

### Chrome DevTools Validation

```typescript
// Manual validation checklist using Chrome DevTools MCP
- [ ] Take snapshot of page structure
- [ ] Verify all chart canvases are rendered
- [ ] Check console for 0 errors
- [ ] Verify network requests to Python Service
- [ ] Take screenshot of full page
- [ ] Verify crosshair synchronization (manual test)
- [ ] Verify zoom/scroll synchronization (manual test)
```

### Checklist FASE 29.4

- [ ] Criar `frontend/tests/technical-analysis.spec.ts`
- [ ] Test 1: Navigation to technical page
- [ ] Test 2: Multi-pane chart display
- [ ] Test 3: Indicator toggles
- [ ] Test 4: Timeframe changes
- [ ] Test 5: Price display
- [ ] Execute Playwright tests (all passing)
- [ ] Chrome DevTools validation (7 checks)
- [ ] Screenshots captured

---

## 📝 FASE 29.5: Documentação

**Estimativa:** 2 horas

### Arquivos a Criar/Atualizar

1. **FASE_29_GRAFICOS_AVANCADOS_2025-11-15.md** (novo, ~800 linhas)
   - Problema resolvido
   - Solução implementada
   - Arquivos criados/modificados
   - Exemplos de código
   - Screenshots
   - Validação completa
   - Lições aprendidas

2. **ROADMAP.md** (atualizar)
   - Adicionar FASE 29 com detalhes completos
   - Arquivos modificados
   - Commits
   - Status: ✅ 100% COMPLETO

3. **README.md** (atualizar)
   - Adicionar prints da página de análise técnica
   - Atualizar features list

4. **ARCHITECTURE.md** (atualizar)
   - Documentar componentes de charts
   - Sincronização entre painéis
   - Integração com Python Service

### Checklist FASE 29.5

- [ ] Criar `FASE_29_GRAFICOS_AVANCADOS_2025-11-15.md`
- [ ] Atualizar `ROADMAP.md`
- [ ] Atualizar `README.md`
- [ ] Atualizar `ARCHITECTURE.md`
- [ ] Screenshots adicionados ao `/validation-screenshots`
- [ ] Documentação revisada e validada

---

## 🚀 FASE 29.6: Commit e Push

**Estimativa:** 1 hora

### Estrutura do Commit

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: Implementar gráficos avançados e análise técnica multi-pane (FASE 29)

**Problema:**
- ❌ Gráficos candlestick básicos sem overlays
- ❌ Falta de indicadores técnicos visuais (RSI, MACD, Stochastic)
- ❌ Não havia página dedicada para análise técnica avançada

**Solução Implementada:**

**FASE 29.1: Candlestick com Overlays** ✅
- ✅ LineSeries para SMA 20, 50, 200
- ✅ LineSeries para EMA 9, 21
- ✅ 3 LineSeries para Bollinger Bands (upper, middle, lower)
- ✅ 5 LineSeries para Pivot Points (R2, R1, P, S1, S2)
- ✅ Cores distintas e line styles (solid, dashed, dotted)

**FASE 29.2: Multi-Pane Chart** ✅
- ✅ 4 painéis sincronizados (Candlestick, RSI, MACD, Stochastic)
- ✅ Sincronização de crosshair entre painéis
- ✅ Sincronização de zoom/scroll entre painéis
- ✅ RSI Chart com linhas overbought (70) e oversold (30)
- ✅ MACD Chart com Line, Signal e Histogram
- ✅ Stochastic Chart com %K, %D e linhas 80/20

**FASE 29.3: Página Técnica Avançada** ✅
- ✅ Route: /assets/[ticker]/technical
- ✅ Seletor de timeframe (1D, 1MO, 3MO, 6MO, 1Y, 2Y, 5Y, MAX)
- ✅ Toggle de indicadores (10 checkboxes)
- ✅ Integração com Python Service para cálculo de indicadores
- ✅ Breadcrumb navigation
- ✅ Header com preço atual e variação

**Arquivos Criados (7):**
- frontend/src/components/charts/candlestick-chart-with-overlays.tsx
- frontend/src/components/charts/multi-pane-chart.tsx
- frontend/src/components/charts/rsi-chart.tsx
- frontend/src/components/charts/macd-chart.tsx
- frontend/src/components/charts/stochastic-chart.tsx
- frontend/src/app/(dashboard)/assets/[ticker]/technical/page.tsx
- frontend/tests/technical-analysis.spec.ts

**Arquivos de Documentação (4):**
- PLANO_FASE_29_GRAFICOS_AVANCADOS.md (este arquivo)
- FASE_29_GRAFICOS_AVANCADOS_2025-11-15.md
- ROADMAP.md (atualizado)
- ARCHITECTURE.md (atualizado)

**Validação (Metodologia Zero Tolerance):**
- ✅ TypeScript: 0 erros (frontend)
- ✅ Build: Success (18 páginas compiladas)
- ✅ Playwright Tests: 5/5 passing
- ✅ Chrome DevTools: 7/7 checks passing
- ✅ Console: 0 erros, 0 warnings
- ✅ Screenshots: 10+ capturas documentadas

**Tecnologia:**
- lightweight-charts 4.1.3 (mantido por estabilidade)
- Python Service para cálculo de indicadores (10-50x mais rápido)
- Next.js 14 App Router
- Shadcn/ui components

**Impacto:**
- Gráficos profissionais comparáveis ao TradingView
- 15+ indicadores técnicos disponíveis
- Análise técnica avançada em página dedicada
- Multi-pane sincronizado para análise completa

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Checklist FASE 29.6

- [ ] `git add .`
- [ ] Commit com mensagem detalhada
- [ ] `git push origin main`
- [ ] Verificar push bem-sucedido
- [ ] Atualizar issue/PR se houver

---

## 📊 RESUMO FINAL

### Total de Horas Estimadas: 18-24 horas

| Fase | Estimativa | Descrição |
|------|------------|-----------|
| 29.0 | 2h | Pesquisa e planejamento |
| 29.1 | 4h | Candlestick com overlays |
| 29.2 | 8h | Multi-pane chart (4 painéis) |
| 29.3 | 4h | Página técnica avançada |
| 29.4 | 2h | Validação MCP Triplo |
| 29.5 | 2h | Documentação |
| 29.6 | 1h | Commit e push |
| **TOTAL** | **23h** | |

### Arquivos Totais

- **Criados:** 11 (7 código + 4 documentação)
- **Modificados:** 3 (ROADMAP.md, README.md, ARCHITECTURE.md)
- **Linhas Adicionadas:** ~3.500

---

## 🎯 PRÓXIMAS FASES (FUTURO)

### FASE 30: Relatórios Avançados
- Relatórios PDF com gráficos
- Export Excel com dados + indicadores
- Agendamento de relatórios

### FASE 31: Alertas e Notificações
- Alertas de preço
- Alertas de indicadores (RSI > 70, MACD cruzamento)
- Notificações push/email

### FASE 32: Backtesting
- Testar estratégias com dados históricos
- Métricas de performance (Sharpe, Sortino, Max Drawdown)
- Comparação de estratégias

---

**Fim do PLANO FASE 29**

*Criado em: 2025-11-15*
*Última Atualização: 2025-11-15*
