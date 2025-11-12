'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssetUpdates } from '@/hooks/useAssetUpdates';

interface UpdateProgressBarProps {
  className?: string;
  showDetails?: boolean;
}

export function UpdateProgressBar({
  className,
  showDetails = true,
}: UpdateProgressBarProps) {
  const {
    isBatchUpdating,
    currentTicker,
    batchProgress,
    updateResults,
  } = useAssetUpdates();

  const [isVisible, setIsVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Show/hide logic
  useEffect(() => {
    if (isBatchUpdating) {
      setIsVisible(true);
      // Clear any existing timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        setHideTimeout(null);
      }
    } else if (batchProgress.total > 0) {
      // Keep visible for 3 seconds after completion
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      setHideTimeout(timeout);
    }

    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isBatchUpdating, batchProgress.total]);

  if (!isVisible) return null;

  const percentage =
    batchProgress.total > 0
      ? (batchProgress.current / batchProgress.total) * 100
      : 0;

  const successCount = updateResults.filter((r) => r.success).length;
  const failedCount = updateResults.filter((r) => !r.success).length;

  return (
    <Card className={cn('border-2', className)}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw
              className={cn(
                'h-4 w-4 text-primary',
                isBatchUpdating && 'animate-spin'
              )}
            />
            <span className="font-medium text-sm">
              {isBatchUpdating
                ? 'Atualizando ativos...'
                : 'Atualização concluída!'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {batchProgress.current} / {batchProgress.total}
          </span>
        </div>

        {/* Progress bar */}
        <Progress value={percentage} className="h-2" />

        {/* Current ticker */}
        {isBatchUpdating && currentTicker && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Atualizando:</span>
            <span className="font-mono font-semibold text-primary">
              {currentTicker}
            </span>
          </div>
        )}

        {/* Details */}
        {showDetails && updateResults.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{successCount} sucesso</span>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-1.5 text-red-600">
                <XCircle className="h-3.5 w-3.5" />
                <span>{failedCount} falhas</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
