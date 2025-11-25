'use client';

// Updated with new columns
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MoreVertical, RefreshCw, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';

interface Asset {
  ticker: string;
  name: string;
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
  hasOptions?: boolean;
}

interface AssetTableProps {
  assets: Asset[];
  isLoading?: boolean;
  onAssetClick?: (ticker: string) => void;
  onSyncAsset?: (ticker: string) => void;
}

export function AssetTable({
  assets,
  isLoading = false,
  onAssetClick,
  onSyncAsset,
}: AssetTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ativos</CardTitle>
        </CardHeader>
        <CardContent>
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
      <CardHeader>
        <CardTitle>Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Ticker</th>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-right font-medium">Preço</th>
                <th className="px-4 py-3 text-right font-medium">Variação</th>
                <th className="px-4 py-3 text-right font-medium">Volume</th>
                {assets.some(a => a.marketCap) && (
                  <th className="px-4 py-3 text-right font-medium">Market Cap</th>
                )}
                <th className="px-4 py-3 text-center font-medium">Opções</th>
                <th className="px-4 py-3 text-right font-medium">Última Atualização</th>
                <th className="w-20 px-4 py-3 text-center font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => {
                const collectedAt = asset.currentPrice?.collectedAt;
                const isStale = isDataStale(collectedAt);

                return (
                  <tr
                    key={asset.ticker}
                    className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
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
                    {asset.marketCap && (
                      <td
                        className="cursor-pointer px-4 py-3 text-right text-sm"
                        onClick={() => onAssetClick?.(asset.ticker)}
                      >
                        {formatCurrency(asset.marketCap)}
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
                                {formatRelativeTime(collectedAt)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{collectedAt ? formatDateTime(collectedAt) : 'Nunca atualizado'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAssetClick?.(asset.ticker)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSyncAsset?.(asset.ticker)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Atualizar Dados
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {assets.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">Nenhum ativo encontrado</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
