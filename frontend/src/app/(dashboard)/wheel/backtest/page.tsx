import type { Metadata } from 'next';
import { BacktestPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Backtest WHEEL | B3 AI Analysis',
  description: 'Backtesting da estratégia WHEEL Turbinada - 60 meses de simulação',
};

export default function BacktestPage() {
  return <BacktestPageClient />;
}
