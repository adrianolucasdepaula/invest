'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Função de pseudo-random determinístico para evitar hydration mismatch
// Usa seed fixo baseado no dia para gerar valores consistentes
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function MarketChart() {
  // Gerar dados com useMemo para evitar recriação e garantir consistência
  // Usar data fixa (início do dia atual) como seed para valores determinísticos
  const mockData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const baseSeed = today.getTime();

    return Array.from({ length: 30 }, (_, i) => {
      // Seed determinístico baseado no dia e índice
      const seed = baseSeed + i * 1000;
      const randomValue = seededRandom(seed) * 5000 - 2500;
      const value = 125000 + randomValue;

      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));

      return {
        date: date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        value: Math.round(value * 100) / 100,
      };
    });
  }, []);

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
