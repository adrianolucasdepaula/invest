import type { Metadata } from 'next';
import { HealthPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Health Check | B3 AI Analysis',
  description: 'Monitoramento de saude dos servicos',
};

export default function HealthPage() {
  return <HealthPageClient />;
}
