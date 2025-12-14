'use client';

// Updated with new columns
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatCurrency,
  formatPercent,
  cn,
  getChangeColor,
  formatRelativeTime,
  isDataStale,
  formatDateTime,
} from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, RefreshCw, AlertTriangle, Eye, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface Asset {
  ticker: string;
  name: string;
  type?: string;
  sector?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  currentPrice?: {
    date: string;
    close: number;
    collectedAt: string | null;
  };
  lastUpdated?: string | null; // Data da última atualização completa (scrapers)
  hasOptions?: boolean;
}

interface AssetTableProps {
  assets: Asset[];
  isLoading?: boolean;
  onAssetClick?: (ticker: string) => void;
  onSyncAsset?: (ticker: string) => void;
  syncingAsset?: string | null;
  // Selection mode props
  selectedAssets?: string[];
  onSelectAsset?: (ticker: string) => void;
  onSelectAll?: (checked: boolean) => void;
}

type SortColumn = 'ticker' | 'name' | 'sector' | 'price' | 'changePercent' | 'volume' | 'marketCap';
type SortDirection = 'asc' | 'desc' | null;

export function AssetTable({
  assets,
  isLoading = false,
  onAssetClick,
  onSyncAsset,
  syncingAsset,
  selectedAssets = [],
  onSelectAsset,
  onSelectAll,
}: AssetTableProps) {
  const [sortColumn, setSortColumn] = React.useState<SortColumn>('ticker');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null -> asc
      setSortDirection(prev => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
      });
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAssets = React.useMemo(() => {
    if (!sortDirection) return assets;

    return [...assets].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'ticker':
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'sector':
          aValue = a.sector || 'Sem Setor';
          bValue = b.sector || 'Sem Setor';
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'changePercent':
          aValue = a.changePercent || 0;
          bValue = b.changePercent || 0;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [assets, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {onSelectAsset && (
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      checked={selectedAssets.length > 0 && selectedAssets.length === sortedAssets.length}
                      onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                      aria-label="Selecionar todos"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium">
                  <button
                    onClick={() => handleSort('ticker')}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Ticker
                    <SortIcon column="ticker" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Nome
                    <SortIcon column="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <button
                    onClick={() => handleSort('sector')}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Setor
                    <SortIcon column="sector" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button
                    onClick={() => handleSort('price')}
                    className="ml-auto flex items-center hover:text-primary transition-colors"
                  >
                    Preço
                    <SortIcon column="price" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button
                    onClick={() => handleSort('changePercent')}
                    className="ml-auto flex items-center hover:text-primary transition-colors"
                  >
                    Variação
                    <SortIcon column="changePercent" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button
                    onClick={() => handleSort('volume')}
                    className="ml-auto flex items-center hover:text-primary transition-colors"
                  >
                    Volume
                    <SortIcon column="volume" />
                  </button>
                </th>
                {sortedAssets.some(a => a.marketCap) && (
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      onClick={() => handleSort('marketCap')}
                      className="ml-auto flex items-center hover:text-primary transition-colors"
                    >
                      Market Cap
                      <SortIcon column="marketCap" />
                    </button>
                  </th>
                )}
                <th className="px-4 py-3 text-center font-medium">Opções</th>
                <th className="px-4 py-3 text-right font-medium">Última Atualização</th>
                <th className="w-20 px-4 py-3 text-center font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map(asset => {
                // Usar lastUpdated (atualização completa via scrapers) ao invés de collectedAt (apenas preço)
                const lastUpdateDate = asset.lastUpdated;
                const isStale = isDataStale(lastUpdateDate);

                return (
                  <tr
                    key={asset.ticker}
                    className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {onSelectAsset && (
                      <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedAssets.includes(asset.ticker)}
                          onCheckedChange={() => onSelectAsset(asset.ticker)}
                          aria-label={`Selecionar ${asset.ticker}`}
                        />
                      </td>
                    )}
                    <td
                      className="cursor-pointer px-4 py-3 font-semibold"
                      onClick={() => onAssetClick?.(asset.ticker)}
                    >
                      {asset.ticker}
                    </td>
                    <td
                      className="cursor-pointer px-4 py-3 text-sm text-muted-foreground"
                      onClick={() => onAssetClick?.(asset.ticker)}
                    >
                      {asset.name}
                    </td>
                    <td
                      className="cursor-pointer px-4 py-3 text-sm"
                      onClick={() => onAssetClick?.(asset.ticker)}
                    >
                      {asset.sector || (
                        <span className="text-muted-foreground italic">Sem Setor</span>
                      )}
                    </td>
                    <td
                      className="cursor-pointer px-4 py-3 text-right font-medium"
                      onClick={() => onAssetClick?.(asset.ticker)}
                    >
                      {formatCurrency(asset.price)}
                    </td>
                    <td
                      className={cn(
                        'cursor-pointer px-4 py-3 text-right font-medium',
                        getChangeColor(asset.changePercent)
                      )}
                      onClick={() => onAssetClick?.(asset.ticker)}
                    >
                      <div className="flex flex-col items-end">
                        <span>{formatPercent(asset.changePercent)}</span>
                        <span className="text-xs">({formatCurrency(asset.change)})</span>
                      </div>
                    </td>
                    <td
                      className="cursor-pointer px-4 py-3 text-right text-sm"
                      onClick={() => onAssetClick?.(asset.ticker)}
                    >
                      {asset.volume ? asset.volume.toLocaleString('pt-BR') : '-'}
                    </td>
                    {sortedAssets.some(a => a.marketCap) && (
                      <td
                        className="cursor-pointer px-4 py-3 text-right text-sm"
                        onClick={() => onAssetClick?.(asset.ticker)}
                      >
                        {asset.marketCap ? formatCurrency(asset.marketCap) : '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      {asset.hasOptions && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Possui opções líquidas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-end gap-1">
                              {isStale && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                              <span
                                className={cn(
                                  isStale
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {formatRelativeTime(lastUpdateDate)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{lastUpdateDate ? formatDateTime(lastUpdateDate) : 'Nunca atualizado'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      {syncingAsset === asset.ticker ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Atualizando dados...</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssetClick?.(asset.ticker);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onSyncAsset?.(asset.ticker);
                              }}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Atualizar Dados
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedAssets.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">Nenhum ativo encontrado</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
