'use client';

import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Trash2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncWebSocket } from '@/lib/hooks/useSyncWebSocket';
import type { SyncLogEntry } from '@/lib/types/data-sync';

/**
 * Props for AuditTrailPanel
 */
export interface AuditTrailPanelProps {
  className?: string;
  maxHeight?: number;
  autoScroll?: boolean;
}

/**
 * Helper: Get icon for log status
 * BUGFIX 2025-11-23: Checkmark azul para logs SYSTEM (conclusão de sync)
 */
const getLogIcon = (status: SyncLogEntry['status'], ticker?: string) => {
  switch (status) {
    case 'success':
      // Checkmark azul para logs SYSTEM (conclusão), verde para ativos individuais
      return <CheckCircle2 className={cn(
        "h-4 w-4",
        ticker === 'SYSTEM' ? 'text-primary' : 'text-success'
      )} />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

/**
 * Helper: Get badge color for log status
 */
const getLogBadgeColor = (status: SyncLogEntry['status']): string => {
  switch (status) {
    case 'success':
      return 'bg-success/10 text-success border-success/20';
    case 'failed':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'processing':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted/10 text-muted-foreground border-muted/20';
  }
};

/**
 * Helper: Format timestamp
 */
const formatTimestamp = (date: Date): string => {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Component: AuditTrailPanel
 *
 * Real-time audit trail panel for sync operations via WebSocket.
 * Features:
 * - Display sync logs from WebSocket
 * - Auto-scroll to latest log (optional)
 * - Status badges (success, failed, processing, system)
 * - Timestamps
 * - Clear logs button
 * - Empty state
 */
export function AuditTrailPanel({
  className,
  maxHeight = 400,
  autoScroll = true,
}: AuditTrailPanelProps) {
  const { state, clearLogs } = useSyncWebSocket({
    autoRefresh: false,
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [state.logs, autoScroll]);

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Logs de Sincronização</h3>
          <Badge variant="outline" className="text-xs">
            {state.logs.length} {state.logs.length === 1 ? 'entrada' : 'entradas'}
          </Badge>
        </div>

        {/* Clear Logs Button */}
        {state.logs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            disabled={state.isRunning}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Logs
          </Button>
        )}
      </div>

      {/* Logs List */}
      <ScrollArea ref={scrollAreaRef} className="rounded-md border" style={{ height: maxHeight }}>
        <div className="p-4 space-y-2">
          {state.logs.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 opacity-50 mb-4" />
              <p className="text-lg font-medium">Nenhum log disponível</p>
              <p className="text-sm mt-1">
                Os logs de sincronização aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            /* Log Entries */
            state.logs.map((log, index) => (
              <div
                key={`${log.timestamp.getTime()}-${index}`}
                className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                  log.status === 'processing' ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                )}
              >
                {/* Icon */}
                <div className="mt-0.5">{getLogIcon(log.status, log.ticker)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {/* Ticker Badge */}
                    <Badge
                      variant="outline"
                      className={cn('font-mono text-xs', getLogBadgeColor(log.status))}
                    >
                      {log.ticker}
                    </Badge>

                    {/* Timestamp */}
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>

                    {/* Duration (if available) */}
                    {log.duration !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {log.duration.toFixed(2)}s
                      </Badge>
                    )}

                    {/* Records Inserted (if available) */}
                    {log.recordsInserted !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {log.recordsInserted.toLocaleString('pt-BR')} registros
                      </Badge>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-sm break-words">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
