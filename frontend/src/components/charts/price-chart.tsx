'use client';

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

export function PriceChart({ data }: PriceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          yAxisId="price"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value)
          }
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
            }).format(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'volume') {
              return new Intl.NumberFormat('pt-BR').format(value);
            }
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value);
          }}
        />
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
