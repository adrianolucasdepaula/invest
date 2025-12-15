import type { Metadata } from 'next';
import { AssetDetailPageClient } from './_client';

type Props = {
  params: Promise<{ ticker: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  return {
    title: `${ticker.toUpperCase()} | B3 AI Analysis`,
    description: `Analise detalhada do ativo ${ticker.toUpperCase()} - cotacao, indicadores fundamentalistas e tecnicos`,
  };
}

export default function AssetDetailPage({ params }: Props) {
  return <AssetDetailPageClient params={params} />;
}
