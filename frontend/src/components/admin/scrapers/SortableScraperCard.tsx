/**
 * Component: SortableScraperCard
 *
 * Wrapper do ScraperCard com funcionalidade de drag & drop
 * usando @dnd-kit/sortable
 *
 * GAP-001 Frontend: Drag & Drop Implementation
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ScraperCard } from './ScraperCard';
import type { ScraperConfig } from '@/types/scraper-config';

interface SortableScraperCardProps {
  config: ScraperConfig;
  index: number;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
}

export function SortableScraperCard({
  config,
  index,
  isSelected,
  onSelectChange,
}: SortableScraperCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle - Apenas visível quando habilitado */}
      {config.isEnabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 cursor-grab active:cursor-grabbing hover:bg-accent/50 rounded p-1 transition-colors"
          aria-label={`Arraste para reordenar ${config.scraperName}`}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <ScraperCard
        config={config}
        index={index}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
      />
    </div>
  );
}
