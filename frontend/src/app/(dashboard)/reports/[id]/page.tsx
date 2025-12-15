import type { Metadata } from 'next';
import { ReportDetailPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Relatorio de Analise | B3 AI Analysis',
  description: 'Relatorio detalhado de analise fundamentalista e tecnica do ativo',
};

export default function ReportDetailPage() {
  return <ReportDetailPageClient />;
}
