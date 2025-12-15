import type { Metadata } from 'next';
import { DashboardPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Dashboard | B3 AI Analysis',
  description: 'Visao geral do mercado brasileiro e do seu portfolio de investimentos',
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
