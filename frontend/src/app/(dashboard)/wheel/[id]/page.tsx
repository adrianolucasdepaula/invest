import type { Metadata } from 'next';
import { WheelStrategyDetailPageClient } from './_client';

export const metadata: Metadata = {
  title: 'WHEEL Strategy Detail | B3 AI Analysis',
  description: 'Detalhes da estrategia WHEEL - trades, recomendacoes e analytics',
};

export default function WheelStrategyDetailPage() {
  return <WheelStrategyDetailPageClient />;
}
