import type { Metadata } from 'next';
import { PortfolioPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Portfolio | B3 AI Analysis',
  description: 'Gerencie suas posicoes e acompanhe seu desempenho',
};

export default function PortfolioPage() {
  return <PortfolioPageClient />;
}
