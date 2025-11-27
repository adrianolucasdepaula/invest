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
import type { AssetUpdateLogEntry } from '@/lib/hooks/useAssetBulkUpdate';

/**
 * Props for AssetUpdateLogsPanel
 */
export interface AssetUpdateLogsPanelProps {
  logs: AssetUpdateLogEntry[];
  onClearLogs: () => void;
  isRunning: boolean;
  className?: string;
  maxHeight?: number;
  autoScroll?: boolean;
}

/**
 * Helper: Get icon for log status
 */
const getLogIcon = (status: AssetUpdateLogEntry['status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'system':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

/**
 * Helper: Get badge color for log status
 */
const getLogBadgeColor = (status: AssetUpdateLogEntry['status']): string => {
  switch (status) {
    case 'success':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'failed':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'processing':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'system':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
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
 * Component: AssetUpdateLogsPanel
 *
 * Real-time logs panel for asset update operations.
 * Features:
 * - Display update logs in real-time
 * - Auto-scroll to latest log (optional)
 * - Status badges (success, failed, processing, system)
 * - Timestamps
 * - Clear logs button
 * - Empty state
 */
export function AssetUpdateLogsPanel({
  logs,
  onClearLogs,
  isRunning,
  className,
  maxHeight = 300,
  autoScroll = true,
}: AssetUpdateLogsPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Logs de Atualização</h3>
          <Badge variant="outline" className="text-xs">
            {logs.length} {logs.length === 1 ? 'entrada' : 'entradas'}
          </Badge>
        </div>

        {/* Clear Logs Button */}
        {logs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearLogs}
            disabled={isRunning}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Logs
          </Button>
        )}
      </div>

      {/* Logs List */}
      <ScrollArea
        ref={scrollAreaRef}
        className="rounded-md border"
        style={{ height: maxHeight }}
      >
        <div className="p-4 space-y-2">
          {logs.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 opacity-50 mb-4" />
              <p className="text-lg font-medium">Nenhum log disponível</p>
              <p className="text-sm mt-1">
                Os logs de atualização aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            /* Log Entries */
            logs.map((log, index) => (
              <div
                key={`${new Date(log.timestamp).getTime()}-${index}`}
                className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                  log.status === 'processing'
                    ? 'bg-primary/5 border-primary/20'
                    : 'hover:bg-muted/50'
                )}
              >
                {/* Icon */}
                <div className="mt-0.5">{getLogIcon(log.status)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {/* Ticker Badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-mono text-xs',
                        getLogBadgeColor(log.status)
                      )}
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
                        {log.duration.toFixed(1)}s
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
