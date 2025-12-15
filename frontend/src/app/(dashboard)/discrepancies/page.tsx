import type { Metadata } from 'next';
import { DiscrepanciesPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Discrepancias | B3 AI Analysis',
  description: 'Analise e resolucao de divergencias de dados',
};

export default function DiscrepanciesPage() {
  return <DiscrepanciesPageClient />;
}
