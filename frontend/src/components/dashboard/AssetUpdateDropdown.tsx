'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  Database,
  List,
  Settings2,
} from 'lucide-react';

/**
 * FASE 116: Dropdown para atualização de dados fundamentalistas
 *
 * Oferece 3 opções:
 * - Todos os Ativos: API direta (1 clique)
 * - Com Opções: API direta (1 clique)
 * - Selecionar Manualmente: Abre modal (2 cliques)
 *
 * NOTA: Usa DropdownMenu uncontrolled (sem open/onOpenChange)
 * para evitar hydration mismatch com SSR do Next.js.
 * Radix UI fecha automaticamente ao clicar em DropdownMenuItem.
 */

interface AssetUpdateDropdownProps {
  totalAssets: number;
  assetsWithOptionsCount: number;
  isUpdating: boolean;
  onUpdateAll: () => Promise<void>;
  onUpdateWithOptions: () => Promise<void>;
  onOpenManualSelect: () => void;
}

export function AssetUpdateDropdown({
  totalAssets,
  assetsWithOptionsCount,
  isUpdating,
  onUpdateAll,
  onUpdateWithOptions,
  onOpenManualSelect,
}: AssetUpdateDropdownProps) {
  // Handlers simplificados - Radix UI fecha o dropdown automaticamente
  const handleUpdateAll = () => {
    onUpdateAll();
  };

  const handleUpdateWithOptions = () => {
    onUpdateWithOptions();
  };

  const handleManualSelect = () => {
    onOpenManualSelect();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isUpdating} className="gap-2" aria-busy={isUpdating}>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isUpdating ? 'Atualizando...' : 'Atualizar'}
          {!isUpdating && <ChevronDown className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Atualizar Dados Fundamentalistas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Opção: Todos os Ativos */}
        <DropdownMenuItem
          onClick={handleUpdateAll}
          disabled={isUpdating}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Todos os Ativos</span>
          </div>
          <Badge variant="secondary">{totalAssets}</Badge>
        </DropdownMenuItem>

        {/* Opção: Com Opções */}
        <DropdownMenuItem
          onClick={handleUpdateWithOptions}
          disabled={isUpdating || assetsWithOptionsCount === 0}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span>Com Opções</span>
          </div>
          <Badge variant="secondary">{assetsWithOptionsCount}</Badge>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Opção: Seleção Manual */}
        <DropdownMenuItem
          onClick={handleManualSelect}
          disabled={isUpdating}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Settings2 className="h-4 w-4" />
          <span>Selecionar Manualmente...</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
