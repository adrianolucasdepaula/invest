/**
 * Component: ScraperList
 *
 * Lista de scrapers com funcionalidades de bulk selection e actions.
 *
 * FASE 5: Frontend UI Components
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScraperCard } from './ScraperCard';
import { useBulkToggle } from '@/lib/hooks/useScraperConfig';
import type { ScraperConfig } from '@/types/scraper-config';

interface ScraperListProps {
  configs: ScraperConfig[];
  category: string;
}

export function ScraperList({ configs, category }: ScraperListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const bulkToggleMutation = useBulkToggle();

  const sortedConfigs = [...configs].sort((a, b) => a.priority - b.priority);

  const handleSelectAll = () => {
    if (selectedIds.size === configs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(configs.map((c) => c.id)));
    }
  };

  const handleBulkEnable = () => {
    const scraperIds = Array.from(selectedIds).map(
      (id) => configs.find((c) => c.id === id)!.scraperId,
    );
    bulkToggleMutation.mutate({ scraperIds, enabled: true });
    setSelectedIds(new Set());
  };

  const handleBulkDisable = () => {
    const scraperIds = Array.from(selectedIds).map(
      (id) => configs.find((c) => c.id === id)!.scraperId,
    );
    bulkToggleMutation.mutate({ scraperIds, enabled: false });
    setSelectedIds(new Set());
  };

  const enabledCount = configs.filter((c) => c.isEnabled).length;
  const allSelected = selectedIds.size === configs.length && configs.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < configs.length;

  if (configs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum scraper encontrado nesta categoria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {allSelected ? 'Desselecionar Todos' : 'Selecionar Todos'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEnable}
            disabled={selectedIds.size === 0 || bulkToggleMutation.isPending}
          >
            Ativar Selecionados ({selectedIds.size})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDisable}
            disabled={selectedIds.size === 0 || bulkToggleMutation.isPending}
          >
            Desativar Selecionados ({selectedIds.size})
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {enabledCount} de {configs.length} ativos
        </div>
      </div>

      {/* Scraper Cards */}
      <div className="space-y-2">
        {sortedConfigs.map((config, index) => (
          <ScraperCard
            key={config.id}
            config={config}
            index={index}
            isSelected={selectedIds.has(config.id)}
            onSelectChange={(selected) => {
              const newSelected = new Set(selectedIds);
              if (selected) {
                newSelected.add(config.id);
              } else {
                newSelected.delete(config.id);
              }
              setSelectedIds(newSelected);
            }}
          />
        ))}
      </div>
    </div>
  );
}
