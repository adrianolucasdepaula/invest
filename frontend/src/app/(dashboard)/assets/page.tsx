import type { Metadata } from 'next';
import { AssetsPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Ativos | B3 AI Analysis',
  description: 'Explore e analise os principais ativos da B3',
};

export default function AssetsPage() {
  return <AssetsPageClient />;
}
