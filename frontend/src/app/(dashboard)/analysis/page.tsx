import type { Metadata } from 'next';
import { AnalysisPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Analises | B3 AI Analysis',
  description: 'Analises tecnicas e fundamentalistas dos ativos',
};

export default function AnalysisPage() {
  return <AnalysisPageClient />;
}
