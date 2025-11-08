'use client';

import { SiteProgress } from '@/hooks/useOAuthSession';
import { CheckCircle2, Circle, XCircle, Loader2, SkipForward } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface OAuthProgressProps {
  sites: SiteProgress[];
  currentIndex: number;
  progressPercentage: number;
}

const statusIcons = {
  pending: <Circle className="w-5 h-5 text-muted-foreground" />,
  in_progress: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
  waiting_user: <Loader2 className="w-5 h-5 text-yellow-500 animate-pulse" />,
  completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  skipped: <SkipForward className="w-5 h-5 text-gray-400" />,
  failed: <XCircle className="w-5 h-5 text-red-500" />,
};

export function OAuthProgress({ sites, currentIndex, progressPercentage }: OAuthProgressProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Progresso Geral</span>
          <span className="text-muted-foreground">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sites.map((site, index) => (
          <div
            key={site.site_id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              index === currentIndex
                ? 'bg-primary/5 border-primary'
                : 'bg-card'
            }`}
          >
            {statusIcons[site.status]}

            <div className="flex-1">
              <div className="font-medium text-sm">{site.site_name}</div>
              {site.cookies_count > 0 && (
                <div className="text-xs text-muted-foreground">
                  {site.cookies_count} cookies
                </div>
              )}
              {site.error_message && (
                <div className="text-xs text-destructive">{site.error_message}</div>
              )}
            </div>

            {index === currentIndex && (
              <div className="text-xs font-medium text-primary">Atual</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
