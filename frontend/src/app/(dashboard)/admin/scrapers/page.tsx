/**
 * Página: Admin - Configuração de Scrapers
 *
 * Interface para controle dinâmico de scrapers.
 * Permite selecionar quais scrapers executar, ordem de prioridade,
 * e parâmetros ajustáveis.
 *
 * Features:
 * - Perfis pré-definidos (Mínimo, Rápido, Alta Precisão)
 * - Tabs por categoria (Fundamental, News, AI, etc.)
 * - Drag & drop para prioridades
 * - Toggle individual e em lote
 * - Parâmetros avançados (timeout, retry, weight)
 * - Análise de impacto em tempo real
 *
 * FASE 5: Frontend UI Components
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileSelector } from '@/components/admin/scrapers/ProfileSelector';
import { ImpactAnalysis } from '@/components/admin/scrapers/ImpactAnalysis';
import { ScraperList } from '@/components/admin/scrapers/ScraperList';
import { useScraperConfigs, useExecutionProfiles } from '@/lib/hooks/useScraperConfig';
import type { ScraperCategory } from '@/types/scraper-config';

export default function ScrapersAdminPage() {
  const { data: configs, isLoading: configsLoading } = useScraperConfigs();
  const { data: profiles } = useExecutionProfiles();
  const [selectedTab, setSelectedTab] = useState<ScraperCategory | 'all'>('all');

  if (configsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const categories: Array<{ id: ScraperCategory | 'all'; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'fundamental', label: 'Fundamentalista' },
    { id: 'technical', label: 'Técnica' },
    { id: 'news', label: 'Notícias' },
    { id: 'ai', label: 'AI Analysis' },
    { id: 'market_data', label: 'Market Data' },
    { id: 'macro', label: 'Macro' },
    { id: 'options', label: 'Opções' },
    { id: 'crypto', label: 'Crypto' },
  ];

  const getConfigsByCategory = (category: ScraperCategory | 'all') => {
    if (!configs) return [];
    return category === 'all' ? configs : configs.filter((c) => c.category === category);
  };

  const filteredConfigs = getConfigsByCategory(selectedTab);
  const enabledCount = configs?.filter((c) => c.isEnabled).length || 0;
  const totalCount = configs?.length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Controle de Scrapers</h1>
          <p className="text-muted-foreground mt-2">
            Configure quais scrapers executar, ordem de prioridade e parâmetros avançados.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Ativos: <span className="font-semibold">{enabledCount}</span> de {totalCount} scrapers
          </p>
        </div>
      </div>

      {/* Profile Selector */}
      {profiles && (
        <Card className="p-4">
          <ProfileSelector profiles={profiles} />
        </Card>
      )}

      {/* Impact Analysis */}
      {configs && (
        <ImpactAnalysis configs={configs.filter((c) => c.isEnabled)} />
      )}

      {/* Tabs por Categoria */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-9 w-full">
          {categories.map((cat) => {
            const count = getConfigsByCategory(cat.id).length;
            const enabledInCategory = getConfigsByCategory(cat.id).filter((c) => c.isEnabled).length;

            return (
              <TabsTrigger key={cat.id} value={cat.id} className="relative">
                {cat.label}
                <span className="ml-2 text-xs opacity-70">
                  ({enabledInCategory}/{count})
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            <ScraperList
              configs={filteredConfigs}
              category={cat.id}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
