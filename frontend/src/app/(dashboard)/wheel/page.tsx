import type { Metadata } from 'next';
import { WheelPageClient } from './_client';

export const metadata: Metadata = {
  title: 'WHEEL Strategy | B3 AI Analysis',
  description: 'Gestao de estrategias WHEEL para opcoes',
};

export default function WheelPage() {
  return <WheelPageClient />;
}
