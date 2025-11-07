'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Lock, Globe, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScraperCardProps {
  scraper: {
    id: string;
    name: string;
    category: string;
    auth: 'public' | 'oauth' | 'credentials';
    status: string;
  };
  status: 'tested' | 'not-tested' | 'failed';
  onClick: () => void;
  isSelected?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  fundamental: 'Fundamentalista',
  market: 'Mercado',
  official: 'Dados Oficiais',
  insider: 'Insider Trading',
  crypto: 'Cripto',
  options: 'Opções',
  ai: 'IA',
  news: 'Notícias',
  institutional: 'Institucional',
};

const CATEGORY_COLORS: Record<string, string> = {
  fundamental: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  market: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  official: 'bg-green-500/10 text-green-600 border-green-500/20',
  insider: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  crypto: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  options: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  ai: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  news: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  institutional: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const AUTH_ICONS = {
  public: Globe,
  oauth: Lock,
  credentials: Key,
};

const AUTH_LABELS = {
  public: 'Público',
  oauth: 'OAuth',
  credentials: 'Credenciais',
};

export default function ScraperCard({
  scraper,
  status,
  onClick,
  isSelected = false,
}: ScraperCardProps) {
  const AuthIcon = AUTH_ICONS[scraper.auth];
  const categoryColor = CATEGORY_COLORS[scraper.category] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        isSelected && 'border-primary shadow-md ring-2 ring-primary/20'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{scraper.name}</h3>
            <Badge
              variant="outline"
              className={cn('text-xs', categoryColor)}
            >
              {CATEGORY_LABELS[scraper.category]}
            </Badge>
          </div>

          {/* Status Badge */}
          <div className="ml-2">
            {status === 'tested' && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
            {status === 'failed' && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            )}
            {status === 'not-tested' && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500/10">
                <AlertCircle className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AuthIcon className="h-3.5 w-3.5" />
            <span>{AUTH_LABELS[scraper.auth]}</span>
          </div>

          {/* Status Text */}
          <span className="text-xs font-medium">
            {status === 'tested' && <span className="text-green-600">✓ Testado</span>}
            {status === 'failed' && <span className="text-red-600">✗ Falhou</span>}
            {status === 'not-tested' && <span className="text-gray-500">⚠ Não testado</span>}
          </span>
        </div>

        {/* Implementation Status */}
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                scraper.status === 'implemented'
                  ? 'bg-green-500/10 text-green-600 border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
              )}
            >
              {scraper.status === 'implemented' ? 'Implementado' : 'Planejado'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
