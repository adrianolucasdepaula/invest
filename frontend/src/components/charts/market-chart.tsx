'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data - substituir com dados reais da API
const mockData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }),
  value: 125000 + Math.random() * 5000 - 2500,
}));

export function MarketChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number) =>
            new Intl.NumberFormat('pt-BR', {
              style: 'decimal',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value)
          }
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
