'use client';

import { useState, useEffect } from 'react';
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
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  Database,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/lib/hooks/useDataSync';
import type { AssetSyncStatusDto } from '@/lib/types/data-sync';

/**
 * Props for SyncConfigModal
 */
export interface SyncConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: {
    tickers: string[];
    startDate: string;
    endDate: string;
  }) => void;
  isSubmitting?: boolean;
}

/**
 * Predefined time periods
 */
type PredefinedPeriod = 'full' | 'recent' | 'ytd' | 'custom';

// Helper functions for date calculations
const getCurrentDate = () => new Date().toISOString().split('T')[0];
const getFiveYearsAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 5);
  return date.toISOString().split('T')[0];
};
const getYearStart = () => `${new Date().getFullYear()}-01-01`;

const MIN_DATE = '1986-01-02'; // Início COTAHIST
const currentDate = getCurrentDate();

const PERIODS = {
  full: { label: 'Histórico Completo', startDate: MIN_DATE, endDate: currentDate },
  recent: { label: 'Últimos 5 Anos', startDate: getFiveYearsAgo(), endDate: currentDate },
  ytd: { label: 'Ano Atual (YTD)', startDate: getYearStart(), endDate: currentDate },
  custom: { label: 'Período Customizado', startDate: '2020-01-01', endDate: currentDate },
};

/**
 * Component: SyncConfigModal
 *
 * Modal for configuring bulk sync operations.
 * Features:
 * - Multi-select tickers (checkbox list with search)
 * - Predefined periods (Full, Recent 5Y, YTD, Custom)
 * - Date range inputs (startDate, endDate) in format YYYY-MM-DD
 * - Validation (1-20 tickers, valid dates 1986-01-02 to current date)
 * - Real-time error messages
 */
export function SyncConfigModal({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: SyncConfigModalProps) {
  const { data: syncStatus } = useSyncStatus();
  const assets = (syncStatus?.assets ?? []) as AssetSyncStatusDto[];

  // State
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [period, setPeriod] = useState<PredefinedPeriod>('recent');
  const [startDate, setStartDate] = useState(PERIODS.recent.startDate);
  const [endDate, setEndDate] = useState(PERIODS.recent.endDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedTickers([]);
      setPeriod('recent');
      setStartDate(PERIODS.recent.startDate);
      setEndDate(PERIODS.recent.endDate);
      setSearchQuery('');
      setErrors([]);
    }
  }, [open]);

  // Filter assets by search query
  const filteredAssets = assets.filter((asset) => {
    const query = searchQuery.toLowerCase();
    return (
      asset.ticker.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query)
    );
  });

  // Handle ticker selection toggle
  const handleToggleTicker = (ticker: string) => {
    setSelectedTickers((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  };

  // Handle select all tickers
  const handleSelectAll = () => {
    if (selectedTickers.length === filteredAssets.length) {
      setSelectedTickers([]);
    } else {
      setSelectedTickers(filteredAssets.map((a) => a.ticker));
    }
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: PredefinedPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setStartDate(PERIODS[newPeriod].startDate);
      setEndDate(PERIODS[newPeriod].endDate);
    }
  };

  // Format date for display (DD/MM/YYYY)
  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validate tickers count
    if (selectedTickers.length === 0) {
      newErrors.push('Selecione pelo menos 1 ativo');
    } else if (selectedTickers.length > 20) {
      newErrors.push('Máximo de 20 ativos por sincronização');
    }

    // Validate date range
    if (startDate < MIN_DATE || startDate > currentDate) {
      newErrors.push(`Data inicial deve estar entre ${formatDate(MIN_DATE)} e ${formatDate(currentDate)}`);
    }
    if (endDate < MIN_DATE || endDate > currentDate) {
      newErrors.push(`Data final deve estar entre ${formatDate(MIN_DATE)} e ${formatDate(currentDate)}`);
    }
    if (endDate < startDate) {
      newErrors.push('Data final deve ser maior ou igual à data inicial');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!validateForm()) return;

    onConfirm({
      tickers: selectedTickers,
      startDate,
      endDate,
    });
  };

  // Calculate estimated duration
  const estimatedMinutes = Math.round(selectedTickers.length * 2.5);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Configurar Sincronização em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione os ativos e o período para sincronizar dados históricos.
            <br />
            <span className="text-xs text-muted-foreground">
              {selectedTickers.length} ativo(s) selecionado(s) • Tempo estimado: {estimatedMinutes} min
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-6 py-4">
          {/* Period Selection */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Período
            </Label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(PERIODS) as PredefinedPeriod[]).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant={period === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(key)}
                  disabled={isSubmitting}
                >
                  {PERIODS[key].label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                min={MIN_DATE}
                max={currentDate}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriod('custom');
                }}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                min={MIN_DATE}
                max={currentDate}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriod('custom');
                }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Ticker Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ativos ({selectedTickers.length} selecionados)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={isSubmitting}
              >
                {selectedTickers.length === filteredAssets.length
                  ? 'Desmarcar Todos'
                  : 'Selecionar Todos'}
              </Button>
            </div>

            {/* Search */}
            <Input
              placeholder="Buscar por ticker ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSubmitting}
            />

            {/* Asset List */}
            <ScrollArea className="h-[300px] rounded-md border p-4">
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
                          'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
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
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{asset.ticker}</span>
                            <Badge variant="outline" className="text-xs">
                              {asset.recordsLoaded.toLocaleString('pt-BR')} registros
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                        {asset.status === 'SYNCED' ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Corrija os seguintes erros:
                  </p>
                  <ul className="list-disc list-inside text-sm text-destructive/90 mt-2 space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Iniciar Sincronização
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
