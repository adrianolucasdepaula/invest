import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent, cn, getChangeColor } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  isLoading?: boolean
  format?: 'currency' | 'percent' | 'number'
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  prefix = '',
  suffix = '',
  icon,
  isLoading = false,
  format,
}: StatCardProps) {
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percent':
        return formatPercent(value)
      case 'number':
        return value.toLocaleString('pt-BR')
      default:
        return value
    }
  }, [value, format])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {prefix}
              {formattedValue}
              {suffix}
            </div>
            {change !== undefined && (
              <div className={cn('text-xs flex items-center gap-1 mt-1', getChangeColor(change))}>
                {change > 0 ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : change < 0 ? (
                  <ArrowDownIcon className="h-3 w-3" />
                ) : null}
                <span>
                  {formatPercent(Math.abs(change))}
                  {changeLabel && ` ${changeLabel}`}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
