'use client';

import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OutdatedBadgeProps {
  lastUpdated: string | Date | null;
  lastUpdateStatus: 'success' | 'failed' | 'pending' | 'outdated' | null;
  lastUpdateError?: string | null;
  updateRetryCount?: number;
  className?: string;
  showIcon?: boolean;
  showTime?: boolean;
}

export function OutdatedBadge({
  lastUpdated,
  lastUpdateStatus,
  lastUpdateError,
  updateRetryCount = 0,
  className,
  showIcon = true,
  showTime = true,
}: OutdatedBadgeProps) {
  // Calculate if outdated (> 7 days)
  const isOutdated = lastUpdated
    ? new Date().getTime() - new Date(lastUpdated).getTime() > 7 * 24 * 60 * 60 * 1000
    : true;

  // Determine badge variant and icon
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  let icon = <Clock className="h-3 w-3" />;
  let label = 'Pendente';
  let tooltipText = 'Atualização pendente';

  if (lastUpdateStatus === 'success' && !isOutdated) {
    variant = 'default';
    icon = <CheckCircle2 className="h-3 w-3" />;
    label = 'Atualizado';
    tooltipText = lastUpdated
      ? `Atualizado ${formatDistanceToNow(new Date(lastUpdated), {
          addSuffix: true,
          locale: ptBR,
        })}`
      : 'Atualizado recentemente';
  } else if (lastUpdateStatus === 'success' && isOutdated) {
    variant = 'secondary';
    icon = <AlertCircle className="h-3 w-3" />;
    label = 'Desatualizado';
    tooltipText = lastUpdated
      ? `Última atualização ${formatDistanceToNow(new Date(lastUpdated), {
          addSuffix: true,
          locale: ptBR,
        })}`
      : 'Dados desatualizados';
  } else if (lastUpdateStatus === 'failed') {
    variant = 'destructive';
    icon = <XCircle className="h-3 w-3" />;
    label = `Falha (${updateRetryCount}x)`;
    tooltipText = lastUpdateError || 'Falha na atualização';
  } else if (lastUpdateStatus === 'pending') {
    variant = 'outline';
    icon = <Clock className="h-3 w-3 animate-pulse" />;
    label = 'Pendente';
    tooltipText = 'Atualização em andamento';
  } else if (lastUpdateStatus === 'outdated' || isOutdated) {
    variant = 'secondary';
    icon = <AlertCircle className="h-3 w-3" />;
    label = 'Desatualizado';
    tooltipText = 'Dados desatualizados ou nunca atualizados';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Badge
              variant={variant}
              className={cn('gap-1.5 text-xs', className)}
            >
              {showIcon && icon}
              <span>{label}</span>
              {showTime && lastUpdated && lastUpdateStatus === 'success' && (
                <span className="text-xs opacity-70">
                  · {formatDistanceToNow(new Date(lastUpdated), { locale: ptBR })}
                </span>
              )}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipText}</p>
          {lastUpdateError && (
            <p className="text-xs text-muted-foreground mt-1">{lastUpdateError}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
