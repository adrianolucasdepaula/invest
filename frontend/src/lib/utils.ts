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
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

export function getChangeBackgroundColor(value: number): string {
  if (value > 0) return 'bg-green-50 dark:bg-green-900/20'
  if (value < 0) return 'bg-red-50 dark:bg-red-900/20'
  return 'bg-gray-50 dark:bg-gray-900/20'
}

export function getSignalColor(signal: 'BUY' | 'SELL' | 'NEUTRAL' | 'HOLD'): string {
  switch (signal) {
    case 'BUY':
      return 'text-green-600 dark:text-green-400'
    case 'SELL':
      return 'text-red-600 dark:text-red-400'
    case 'NEUTRAL':
    case 'HOLD':
      return 'text-yellow-600 dark:text-yellow-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

export function getSignalBadgeColor(signal: 'BUY' | 'SELL' | 'NEUTRAL' | 'HOLD'): string {
  switch (signal) {
    case 'BUY':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'SELL':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'NEUTRAL':
    case 'HOLD':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}
