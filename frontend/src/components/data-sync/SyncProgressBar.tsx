'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncWebSocket } from '@/lib/hooks/useSyncWebSocket';

/**
 * Props for SyncProgressBar
 */
export interface SyncProgressBarProps {
  onSyncComplete?: () => void;
  autoRefresh?: boolean;
  className?: string;
}

/**
 * Component: SyncProgressBar
 *
 * Real-time progress bar for bulk sync operations via WebSocket.
 * Features:
 * - Connect to WebSocket namespace /sync
 * - Display current ticker being processed
 * - Show progress percentage (0-100%)
 * - Update count (e.g., "15/55")
 * - Summary on completion (success/failed counts)
 * - Connection status indicator
 */
export function SyncProgressBar({
  onSyncComplete,
  autoRefresh = true,
  className,
}: SyncProgressBarProps) {
  const { isConnected, state } = useSyncWebSocket({
    autoRefresh,
    onSyncComplete,
  });

  // If not running and no recent completion, hide component
  if (!state.isRunning && state.progress === 0) {
    return null;
  }

  // Calculate success rate
  const totalProcessed = state.results.success.length + state.results.failed.length;
  const successRate =
    totalProcessed > 0
      ? Math.round((state.results.success.length / totalProcessed) * 100)
      : 0;

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {state.isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Sincronização em Andamento</h3>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h3 className="text-lg font-semibold">Sincronização Concluída</h3>
            </>
          )}
        </div>

        {/* Connection Status */}
        <Badge
          variant="outline"
          className={cn(
            'flex items-center space-x-1',
            isConnected
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          )}
        >
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-success' : 'bg-destructive'
            )}
          />
          <span className="text-xs">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </Badge>
      </div>

      {/* Current Ticker */}
      {state.isRunning && state.currentTicker && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>
            Processando: <span className="font-semibold text-foreground">{state.currentTicker}</span>
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold">{Math.round(state.progress)}%</span>
        </div>
        <Progress value={state.progress} className="h-2" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalProcessed}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-success/10 p-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sucesso</p>
            <p className="text-lg font-bold text-success">
              {state.results.success.length}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-destructive/10 p-2">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Falhas</p>
            <p className="text-lg font-bold text-destructive">
              {state.results.failed.length}
            </p>
          </div>
        </div>
      </div>

      {/* Success Rate (only when completed) */}
      {!state.isRunning && totalProcessed > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Taxa de Sucesso</span>
            </div>
            <div
              className={cn(
                'text-2xl font-bold',
                successRate >= 95
                  ? 'text-success'
                  : successRate >= 90
                  ? 'text-warning'
                  : 'text-destructive'
              )}
            >
              {successRate}%
            </div>
          </div>
        </div>
      )}

      {/* Warnings (if any failed) */}
      {state.results.failed.length > 0 && (
        <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning">
                {state.results.failed.length} ativo(s) falharam
              </p>
              <p className="text-xs text-warning/90 mt-1">
                Tickers: {state.results.failed.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
