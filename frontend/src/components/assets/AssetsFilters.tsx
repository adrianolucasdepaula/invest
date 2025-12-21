'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Layers } from 'lucide-react';

export type ViewMode = 'all' | 'sector' | 'type' | 'type-sector';

interface AssetsFiltersProps {
  showOnlyOptions: boolean;
  setShowOnlyOptions: (value: boolean) => void;
  showOnlyIdiv: boolean;
  setShowOnlyIdiv: (value: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
}

/**
 * FASE Marcação IDIV + FASE 133: Componente de filtros com Radix UI
 *
 * Componente separado para evitar hydration errors causados por:
 * - React 19.2 mudança no prefix do useId()
 * - Radix UI Issue #3700: https://github.com/radix-ui/primitives/issues/3700
 *
 * Importado com next/dynamic + ssr: false em _client.tsx
 * Padrão baseado em ClientOnlySidebar (commit 45a8dd6)
 */
export function AssetsFilters({
  showOnlyOptions,
  setShowOnlyOptions,
  showOnlyIdiv,
  setShowOnlyIdiv,
  viewMode,
  setViewMode,
}: AssetsFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Checkbox: Com Opções */}
      <div className="mr-4 flex items-center space-x-2">
        <Checkbox
          id="options-mode"
          checked={showOnlyOptions}
          onCheckedChange={checked => {
            console.log('[CHECKBOX] Com Opções changed to:', checked);
            setShowOnlyOptions(checked === true);
          }}
        />
        <Label htmlFor="options-mode" className="cursor-pointer">
          Com Opções
        </Label>
      </div>

      {/* Checkbox: Somente IDIV - FASE Marcação IDIV */}
      <div className="mr-4 flex items-center space-x-2">
        <Checkbox
          id="idiv-filter"
          checked={showOnlyIdiv}
          onCheckedChange={checked => {
            console.log('[IDIV CHECKBOX] Changed to:', checked);
            setShowOnlyIdiv(checked === true);
          }}
        />
        <Label htmlFor="idiv-filter" className="cursor-pointer">
          Somente IDIV
        </Label>
      </div>

      {/* Select: View Mode */}
      <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <SelectTrigger id="view-mode" className="w-[180px]">
          <SelectValue placeholder="Visualização" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Todos
            </div>
          </SelectItem>
          <SelectItem value="type">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Por Tipo
            </div>
          </SelectItem>
          <SelectItem value="sector">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Por Setor
            </div>
          </SelectItem>
          <SelectItem value="type-sector">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Por Tipo e Setor
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
