'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent, cn, getChangeColor } from '@/lib/utils'

interface Asset {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
}

interface AssetTableProps {
  assets: Asset[]
  isLoading?: boolean
  onAssetClick?: (ticker: string) => void
}

export function AssetTable({ assets, isLoading = false, onAssetClick }: AssetTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
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
                <th className="text-left py-3 px-4 font-medium">Ticker</th>
                <th className="text-left py-3 px-4 font-medium">Nome</th>
                <th className="text-right py-3 px-4 font-medium">Preço</th>
                <th className="text-right py-3 px-4 font-medium">Variação</th>
                <th className="text-right py-3 px-4 font-medium">Volume</th>
                {assets.some((a) => a.marketCap) && (
                  <th className="text-right py-3 px-4 font-medium">Market Cap</th>
                )}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.ticker}
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => onAssetClick?.(asset.ticker)}
                >
                  <td className="py-3 px-4 font-semibold">{asset.ticker}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{asset.name}</td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(asset.price)}
                  </td>
                  <td className={cn('py-3 px-4 text-right font-medium', getChangeColor(asset.changePercent))}>
                    <div className="flex flex-col items-end">
                      <span>{formatPercent(asset.changePercent)}</span>
                      <span className="text-xs">({formatCurrency(asset.change)})</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm">
                    {asset.volume.toLocaleString('pt-BR')}
                  </td>
                  {asset.marketCap && (
                    <td className="py-3 px-4 text-right text-sm">
                      {formatCurrency(asset.marketCap)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {assets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum ativo encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
