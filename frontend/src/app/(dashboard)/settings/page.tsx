import type { Metadata } from 'next';
import { SettingsPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Configuracoes | B3 AI Analysis',
  description: 'Configure suas preferencias e conta',
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
