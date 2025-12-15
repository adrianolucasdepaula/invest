import type { Metadata } from 'next';
import { DataManagementPageClient } from './_client';

export const metadata: Metadata = {
  title: 'Gestao de Dados | B3 AI Analysis',
  description: 'Sincronizacao e gestao de dados do sistema',
};

export default function DataManagementPage() {
  return <DataManagementPageClient />;
}
