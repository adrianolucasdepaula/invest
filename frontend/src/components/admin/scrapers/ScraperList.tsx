/**
 * Component: ScraperList
 *
 * Lista de scrapers com funcionalidades de bulk selection e actions.
 * GAP-001 Frontend: Drag & Drop com @dnd-kit/sortable
 *
 * FASE 5: Frontend UI Components
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { SortableScraperCard } from './SortableScraperCard';
import { useBulkToggle, useUpdatePriorities } from '@/lib/hooks/useScraperConfig';
import type { ScraperConfig } from '@/types/scraper-config';

interface ScraperListProps {
  configs: ScraperConfig[];
  category: string;
}

export function ScraperList({ configs, category }: ScraperListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const bulkToggleMutation = useBulkToggle();
  const updatePrioritiesMutation = useUpdatePriorities();

  // GAP-001: Estado local para drag & drop
  const [items, setItems] = useState(
    [...configs].sort((a, b) => a.priority - b.priority)
  );

  const sortedConfigs = items;

  // GAP-001: Sensores de drag (mouse + keyboard para a11y)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // GAP-001: Handler de drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Atualizar priorities no backend
      const priorities = newItems.map((item, index) => ({
        scraperId: item.scraperId,
        priority: index + 1,
      }));

      updatePrioritiesMutation.mutate({ priorities });
    }
  }

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

      {/* Scraper Cards - GAP-001: Drag & Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedConfigs.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pl-8">
            {sortedConfigs.map((config, index) => (
              <SortableScraperCard
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
        </SortableContext>
      </DndContext>
    </div>
  );
}
