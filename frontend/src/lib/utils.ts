import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatPercent(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

export function formatCompactNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toFixed(0)
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-green-600 dark:text-green-300'
  if (value < 0) return 'text-red-600 dark:text-red-300'
  return 'text-muted-foreground'
}

export function getChangeBackgroundColor(value: number): string {
  if (value > 0) return 'bg-green-50 dark:bg-green-900/30'
  if (value < 0) return 'bg-red-50 dark:bg-red-900/30'
  return 'bg-muted'
}

export function getSignalColor(signal: 'BUY' | 'SELL' | 'NEUTRAL' | 'HOLD'): string {
  switch (signal) {
    case 'BUY':
      return 'text-green-600 dark:text-green-300'
    case 'SELL':
      return 'text-red-600 dark:text-red-300'
    case 'NEUTRAL':
    case 'HOLD':
      return 'text-yellow-600 dark:text-yellow-300'
    default:
      return 'text-muted-foreground'
  }
}

export function getSignalBadgeColor(signal: 'BUY' | 'SELL' | 'NEUTRAL' | 'HOLD'): string {
  switch (signal) {
    case 'BUY':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'SELL':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'NEUTRAL':
    case 'HOLD':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Nunca'

  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffSeconds < 30) return 'agora'
  if (diffMinutes < 1) return `${diffSeconds}s atrás`
  if (diffMinutes < 60) return `${diffMinutes}m atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  return `${diffDays}d atrás`
}

export function isDataStale(date: Date | string | null | undefined, thresholdHours: number = 1): boolean {
  if (!date) return true

  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()
  const diffHours = diffMs / 3600000

  return diffHours > thresholdHours
}
