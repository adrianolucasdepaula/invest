/**
 * Component: ScraperCard
 *
 * Card individual de scraper com:
 * - Toggle ON/OFF
 * - Indicador de prioridade
 * - Expand/collapse para parâmetros avançados
 * - Badges de status (runtime, auth required)
 * - Estatísticas (success rate, avg response time)
 *
 * FASE 5: Frontend UI Components
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, GripVertical, Lock } from 'lucide-react';
import { useToggleScraperEnabled, useUpdateScraperConfig } from '@/lib/hooks/useScraperConfig';
import type { ScraperConfig } from '@/types/scraper-config';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScraperCardProps {
  config: ScraperConfig;
  index: number;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
}

export function ScraperCard({ config, index, isSelected, onSelectChange }: ScraperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleMutation = useToggleScraperEnabled();
  const updateMutation = useUpdateScraperConfig();

  const handleToggle = () => {
    toggleMutation.mutate(config.id);
  };

  const handleParameterChange = (key: string, value: any) => {
    updateMutation.mutate({
      id: config.id,
      data: {
        parameters: {
          [key]: value,
        },
      },
    });
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        !config.isEnabled && 'opacity-60 bg-muted/30',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left: Checkbox + Priority + Info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Checkbox para seleção em lote */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange(checked as boolean)}
            aria-label={`Selecionar ${config.scraperName}`}
          />

          {/* Priority Number */}
          <div className="flex flex-col items-center min-w-[40px]">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
          </div>

          {/* Scraper Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{config.scraperName}</h4>

              <Badge variant={config.runtime === 'typescript' ? 'default' : 'secondary'}>
                {config.runtime}
              </Badge>

              {config.requiresAuth && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  {config.authType}
                </Badge>
              )}

              {!config.isEnabled && (
                <Badge variant="destructive" className="text-xs">
                  Desabilitado
                </Badge>
              )}
            </div>

            {config.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {config.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span>
                Taxa de Sucesso:{' '}
                <span
                  className={cn(
                    'font-semibold',
                    config.successRate >= 90
                      ? 'text-green-600 dark:text-green-400'
                      : config.successRate >= 70
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {config.successRate.toFixed(1)}%
                </span>
              </span>
              <span>Tempo Médio: {config.avgResponseTime}ms</span>
              {config.lastSuccess && (
                <span>
                  Último sucesso:{' '}
                  {formatDistanceToNow(new Date(config.lastSuccess), {
                    locale: ptBR,
                    addSuffix: true,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Switch */}
          <Switch
            checked={config.isEnabled}
            onCheckedChange={handleToggle}
            disabled={toggleMutation.isPending}
            aria-label={`${config.isEnabled ? 'Desabilitar' : 'Habilitar'} ${config.scraperName}`}
          />

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Recolher parâmetros' : 'Expandir parâmetros'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded: Advanced Parameters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <h5 className="font-semibold text-sm">Parâmetros Avançados</h5>

          <div className="grid grid-cols-2 gap-4">
            {/* Timeout */}
            <div>
              <Label htmlFor={`timeout-${config.id}`}>Timeout (ms)</Label>
              <Input
                id={`timeout-${config.id}`}
                type="number"
                value={config.parameters.timeout}
                onChange={(e) => handleParameterChange('timeout', Number(e.target.value))}
                min={10000}
                max={300000}
                step={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mín: 10s, Máx: 5min
              </p>
            </div>

            {/* Retry Attempts */}
            <div>
              <Label htmlFor={`retry-${config.id}`}>Tentativas de Retry</Label>
              <Input
                id={`retry-${config.id}`}
                type="number"
                value={config.parameters.retryAttempts}
                onChange={(e) => handleParameterChange('retryAttempts', Number(e.target.value))}
                min={0}
                max={10}
              />
            </div>

            {/* Validation Weight */}
            <div>
              <Label htmlFor={`weight-${config.id}`}>Peso na Validação (0-1)</Label>
              <Input
                id={`weight-${config.id}`}
                type="number"
                value={config.parameters.validationWeight}
                onChange={(e) => handleParameterChange('validationWeight', Number(e.target.value))}
                min={0}
                max={1}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                0.0 = sem peso, 1.0 = peso máximo
              </p>
            </div>

            {/* Wait Strategy */}
            <div>
              <Label htmlFor={`strategy-${config.id}`}>Estratégia de Espera</Label>
              <Select
                value={config.parameters.waitStrategy}
                onValueChange={(v) => handleParameterChange('waitStrategy', v)}
              >
                <SelectTrigger id={`strategy-${config.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="load">Load (Rápido)</SelectItem>
                  <SelectItem value="networkidle">Network Idle (Completo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cache Expiry */}
          <div>
            <Label htmlFor={`cache-${config.id}`}>Cache Expiry (segundos)</Label>
            <Input
              id={`cache-${config.id}`}
              type="number"
              value={config.parameters.cacheExpiry}
              onChange={(e) => handleParameterChange('cacheExpiry', Number(e.target.value))}
              min={0}
              max={86400}
              step={60}
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 = sem cache, 86400 = 24 horas
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
