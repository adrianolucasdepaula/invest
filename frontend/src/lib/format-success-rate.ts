/**
 * Utility: Format Success Rate
 *
 * Centraliza formatação de successRate para lidar com serialização Decimal do backend.
 * Backend envia Decimal como string "0.00", frontend espera number.
 *
 * BUG-002 FIX: Handle Decimal serialization
 */

export function formatSuccessRate(rate: number | string): string {
  const numericRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  return numericRate.toFixed(1);
}

export function getSuccessRateColor(rate: number | string): string {
  const numericRate = typeof rate === 'string' ? parseFloat(rate) : rate;

  if (numericRate >= 90) {
    return 'text-green-600 dark:text-green-400';
  }

  if (numericRate >= 70) {
    return 'text-yellow-600 dark:text-yellow-400';
  }

  return 'text-red-600 dark:text-red-400';
}
