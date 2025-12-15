'use client';

import { memo, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PriceChartProps {
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

// FASE 122: Memoize static objects to prevent recreation
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
} as const;

const TICK_STYLE = { fill: 'hsl(var(--muted-foreground))' };

/**
 * FASE 122: Memoized PriceChart component
 * - React.memo prevents unnecessary re-renders
 * - useMemo for Intl formatters (expensive to create)
 * - useCallback for stable formatter references
 */
function PriceChartComponent({ data }: PriceChartProps) {
  // FASE 122: Memoize Intl formatters
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    []
  );

  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
      }),
    []
  );

  const numberFormatter = useMemo(() => new Intl.NumberFormat('pt-BR'), []);

  // FASE 122: Memoize tick formatters
  const priceTickFormatter = useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter]
  );

  const volumeTickFormatter = useCallback(
    (value: number) => compactFormatter.format(value),
    [compactFormatter]
  );

  // FASE 122: Memoize tooltip formatter
  const tooltipFormatter = useCallback(
    (value: number, name: string) => {
      if (name === 'volume') {
        return numberFormatter.format(value);
      }
      return currencyFormatter.format(value);
    },
    [currencyFormatter, numberFormatter]
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" tick={TICK_STYLE} />
        <YAxis
          yAxisId="price"
          className="text-xs"
          tick={TICK_STYLE}
          tickFormatter={priceTickFormatter}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          className="text-xs"
          tick={TICK_STYLE}
          tickFormatter={volumeTickFormatter}
        />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} formatter={tooltipFormatter} />
        <Legend />
        <Bar
          yAxisId="volume"
          dataKey="volume"
          fill="hsl(var(--muted))"
          opacity={0.3}
          name="Volume"
        />
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="close"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          name="Fechamento"
        />
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="high"
          stroke="hsl(var(--success))"
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
          name="Máxima"
        />
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="low"
          stroke="hsl(var(--destructive))"
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
          name="Mínima"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// FASE 122: Export memoized component
export const PriceChart = memo(PriceChartComponent);
