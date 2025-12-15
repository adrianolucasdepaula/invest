import type { Metadata } from 'next';
import { ReportsPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Relatorios | B3 AI Analysis',
  description: 'Relatorios de analise multi-fonte com cross-validation',
};

export default function ReportsPage() {
  return <ReportsPageClient />;
}
