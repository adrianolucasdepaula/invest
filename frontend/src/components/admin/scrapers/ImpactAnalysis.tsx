/**
 * Component: ImpactAnalysis
 *
 * Exibe análise de impacto em tempo real das mudanças de configuração.
 * Mostra estimativas de duração, memória, CPU e nível de confiança.
 *
 * FASE 5: Frontend UI Components
 */

'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useImpactPreview } from '@/lib/hooks/useScraperConfig';
import type { ScraperConfig } from '@/types/scraper-config';

interface ImpactAnalysisProps {
  configs: ScraperConfig[];
}

export function ImpactAnalysis({ configs }: ImpactAnalysisProps) {
  const scraperIds = configs.map((c) => c.scraperId);
  const { data: impact, isLoading } = useImpactPreview(scraperIds);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!impact) return null;

  const confidenceBadgeVariant =
    impact.confidenceLevel === 'high'
      ? 'default'
      : impact.confidenceLevel === 'medium'
        ? 'secondary'
        : 'destructive';

  const confidenceLabel =
    impact.confidenceLevel === 'high'
      ? 'Alto'
      : impact.confidenceLevel === 'medium'
        ? 'Médio'
        : 'Baixo';

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Análise de Impacto</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Duração Estimada */}
        <div>
          <label className="text-sm text-muted-foreground">Duração Estimada</label>
          <div className="text-2xl font-bold mt-1">{impact.estimatedDuration}s</div>
          <Progress
            value={(impact.estimatedDuration / 180) * 100}
            className="mt-2"
            aria-label={`Duração: ${impact.estimatedDuration}s de 180s máximo`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {impact.estimatedDuration > 180 ? 'Acima do recomendado' : 'Dentro do recomendado'}
          </p>
        </div>

        {/* Memória Estimada */}
        <div>
          <label className="text-sm text-muted-foreground">Uso de Memória</label>
          <div className="text-2xl font-bold mt-1">{impact.estimatedMemory}MB</div>
          <Progress
            value={(impact.estimatedMemory / 4000) * 100}
            className="mt-2"
            aria-label={`Memória: ${impact.estimatedMemory}MB de 4000MB limite`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {impact.estimatedMemory > 2000 ? 'Alto consumo' : 'Consumo normal'}
          </p>
        </div>

        {/* CPU Estimado */}
        <div>
          <label className="text-sm text-muted-foreground">Uso de CPU</label>
          <div className="text-2xl font-bold mt-1">{impact.estimatedCPU}%</div>
          <Progress
            value={impact.estimatedCPU}
            className="mt-2"
            aria-label={`CPU: ${impact.estimatedCPU}%`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {impact.estimatedCPU > 70 ? 'Alto consumo' : 'Consumo normal'}
          </p>
        </div>

        {/* Nível de Confiança */}
        <div>
          <label className="text-sm text-muted-foreground">Nível de Confiança</label>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={confidenceBadgeVariant} className="text-base">
              {confidenceLabel}
            </Badge>
            <span className="text-sm text-muted-foreground">({impact.minSources} fontes)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {impact.confidenceLevel === 'high' && 'Máxima qualidade de dados'}
            {impact.confidenceLevel === 'medium' && 'Boa qualidade de dados'}
            {impact.confidenceLevel === 'low' && 'Qualidade mínima (2 fontes)'}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {impact.warnings.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {impact.warnings.map((warning, i) => (
                <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
