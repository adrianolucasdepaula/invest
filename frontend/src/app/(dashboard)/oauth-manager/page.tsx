import type { Metadata } from 'next';
import { OAuthManagerPageClient } from './_client';

export const metadata: Metadata = {
  title: 'OAuth Manager | B3 AI Analysis',
  description: 'Gerencie autenticacao OAuth para fontes de dados',
};

export default function OAuthManagerPage() {
  return <OAuthManagerPageClient />;
}
