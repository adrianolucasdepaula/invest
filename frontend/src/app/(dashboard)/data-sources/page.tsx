import type { Metadata } from 'next';
import { DataSourcesPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Fontes de Dados | B3 AI Analysis',
  description: 'Status e configuracao das fontes de coleta',
};

export default function DataSourcesPage() {
  return <DataSourcesPageClient />;
}
