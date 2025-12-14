'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  RefreshCw,
  Loader2,
  Clock,
  Database,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FASE 115: Modal para configurar atualização de dados fundamentalistas
 * Permite escolher: Todos os ativos, Apenas com opções, ou Seleção manual
 */

export type UpdateMode = 'all' | 'with_options' | 'selected';

export interface AssetUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: {
    mode: UpdateMode;
    tickers?: string[];
  }) => void;
  isSubmitting?: boolean;
  assets: Array<{ ticker: string; name: string; hasOptions: boolean }>;
  assetsWithOptionsCount: number;
}

export function AssetUpdateModal({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  assets,
  assetsWithOptionsCount,
}: AssetUpdateModalProps) {
  // State
  const [mode, setMode] = useState<UpdateMode>('all');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMode('all');
      setSelectedTickers([]);
      setSearchQuery('');
    }
  }, [open]);

  // Filter assets by search query
  const filteredAssets = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return assets.filter(
      (asset) =>
        asset.ticker.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  // Calculate total assets for current mode
  const totalAssetsForMode = useMemo(() => {
    switch (mode) {
      case 'all':
        return assets.length;
      case 'with_options':
        return assetsWithOptionsCount;
      case 'selected':
        return selectedTickers.length;
      default:
        return 0;
    }
  }, [mode, assets.length, assetsWithOptionsCount, selectedTickers.length]);

  // Calculate estimated time (1 second per asset, show in minutes)
  const estimatedMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(totalAssetsForMode / 60));
  }, [totalAssetsForMode]);

  // Handle ticker selection toggle
  const handleToggleTicker = (ticker: string) => {
    setSelectedTickers((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  };

  // Check if all filtered assets are selected
  const allFilteredSelected = useMemo(
    () =>
      filteredAssets.length > 0 &&
      filteredAssets.every((asset) => selectedTickers.includes(asset.ticker)),
    [filteredAssets, selectedTickers]
  );

  // Handle select all tickers
  const handleSelectAll = () => {
    if (allFilteredSelected) {
      // Remove only filtered assets from selection
      setSelectedTickers((prev) =>
        prev.filter((ticker) => !filteredAssets.some((a) => a.ticker === ticker))
      );
    } else {
      // Add all filtered assets to selection
      setSelectedTickers((prev) => [
        ...new Set([...prev, ...filteredAssets.map((a) => a.ticker)]),
      ]);
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    if (mode === 'selected' && selectedTickers.length === 0) {
      return; // Don't allow empty selection
    }

    onConfirm({
      mode,
      tickers: mode === 'selected' ? selectedTickers : undefined,
    });
  };

  // Validation
  const isValid = mode !== 'selected' || selectedTickers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Configurar Atualização de Dados
          </DialogTitle>
          <DialogDescription>
            Selecione quais ativos deseja atualizar os dados fundamentalistas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-6 py-4">
          {/* Update Mode Selection */}
          <div className="space-y-4">
            <Label>Modo de Atualização</Label>
            <RadioGroup
              value={mode}
              onValueChange={(value: string) => setMode(value as UpdateMode)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="all" id="mode-all" />
                <Label htmlFor="mode-all" className="flex-1 cursor-pointer">
                  <div className="font-medium">Todos os ativos</div>
                  <div className="text-sm text-muted-foreground">
                    Atualizar todos os {assets.length} ativos ativos
                  </div>
                </Label>
                <Badge variant="secondary">{assets.length}</Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="with_options" id="mode-options" />
                <Label htmlFor="mode-options" className="flex-1 cursor-pointer">
                  <div className="font-medium">Apenas ativos com opções</div>
                  <div className="text-sm text-muted-foreground">
                    Atualizar apenas ativos que possuem opções negociáveis
                  </div>
                </Label>
                <Badge variant="secondary">{assetsWithOptionsCount}</Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="selected" id="mode-selected" />
                <Label htmlFor="mode-selected" className="flex-1 cursor-pointer">
                  <div className="font-medium">Selecionar manualmente</div>
                  <div className="text-sm text-muted-foreground">
                    Escolher quais ativos atualizar
                  </div>
                </Label>
                {mode === 'selected' && (
                  <Badge variant="default">{selectedTickers.length}</Badge>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Manual Selection - Only visible when mode is 'selected' */}
          {mode === 'selected' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ativos ({selectedTickers.length} selecionados)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isSubmitting}
                >
                  {allFilteredSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ticker ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-9"
                />
              </div>

              {/* Asset List */}
              <ScrollArea className="h-[250px] rounded-md border p-3">
                <div className="space-y-2">
                  {filteredAssets.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Nenhum ativo encontrado
                    </div>
                  ) : (
                    filteredAssets.map((asset) => {
                      const isSelected = selectedTickers.includes(asset.ticker);
                      return (
                        <div
                          key={asset.ticker}
                          className={cn(
                            'flex items-center space-x-3 p-2 rounded-lg border cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-primary/5 border-primary'
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => handleToggleTicker(asset.ticker)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleTicker(asset.ticker)}
                            disabled={isSubmitting}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{asset.ticker}</span>
                              {asset.hasOptions && (
                                <Badge variant="outline" className="text-xs">
                                  Opções
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {asset.name}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Estimated Time */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Tempo estimado</span>
            </div>
            <span className="font-medium">
              ~{estimatedMinutes} {estimatedMinutes === 1 ? 'minuto' : 'minutos'}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Iniciar Atualização ({totalAssetsForMode})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
