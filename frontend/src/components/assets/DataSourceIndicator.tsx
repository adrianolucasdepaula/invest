'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

/**
 * Valor de uma fonte específica
 */
interface FieldSourceValue {
  source: string;
  value: number | null;
  scrapedAt: string;
}

/**
 * Fonte divergente
 */
interface DivergentSource {
  source: string;
  value: number;
  deviation: number;
}

/**
 * Informações do campo
 */
interface FieldSourceInfo {
  values: FieldSourceValue[];
  finalValue: number | null;
  finalSource: string;
  sourcesCount: number;
  agreementCount: number;
  consensus: number;
  hasDiscrepancy: boolean;
  divergentSources?: DivergentSource[];
}

interface DataSourceIndicatorProps {
  fieldName: string;
  fieldInfo: FieldSourceInfo;
  showDetails?: boolean;
}

/**
 * Formata número para exibição
 */
function formatValue(value: number | null): string {
  if (value === null) return '-';
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * Formata nome da fonte para exibição
 */
function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    fundamentus: 'Fundamentus',
    statusinvest: 'Status Invest',
    investidor10: 'Investidor 10',
    brapi: 'BRAPI',
    investsite: 'Invest Site',
    fundamentei: 'Fundamentei',
  };
  return names[source] || source;
}

/**
 * Componente que exibe indicador de consenso de fontes para um campo
 *
 * Mostra:
 * - Badge colorido indicando nível de consenso
 * - Tooltip com detalhes de cada fonte
 * - Ícone de alerta para discrepâncias
 */
export function DataSourceIndicator({
  fieldName,
  fieldInfo,
  showDetails = true,
}: DataSourceIndicatorProps) {
  const { consensus, sourcesCount, hasDiscrepancy, values, finalSource, divergentSources } =
    fieldInfo;

  // Determinar variante do badge baseado no consenso
  const getBadgeVariant = () => {
    if (consensus >= 80) return 'success';
    if (consensus >= 50) return 'warning';
    return 'destructive';
  };

  // Ícone baseado no status
  const StatusIcon = () => {
    if (consensus >= 80) {
      return <CheckCircle2 className="h-3 w-3 mr-1" />;
    }
    if (hasDiscrepancy) {
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    }
    return <Info className="h-3 w-3 mr-1" />;
  };

  // Fontes com valor válido
  const validSources = values.filter((v) => v.value !== null);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center cursor-help">
            <Badge variant={getBadgeVariant()} className="text-[10px] px-1.5 py-0.5">
              <StatusIcon />
              {sourcesCount} {sourcesCount === 1 ? 'fonte' : 'fontes'}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-72 p-3" side="left">
          <div className="space-y-2">
            <div className="font-semibold text-sm border-b pb-1">{fieldName}</div>

            {/* Consenso */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Consenso:</span>
              <span
                className={
                  consensus >= 80
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : consensus >= 50
                      ? 'text-yellow-600 dark:text-yellow-400 font-medium'
                      : 'text-red-600 dark:text-red-400 font-medium'
                }
              >
                {consensus}%
              </span>
            </div>

            {/* Fonte selecionada */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Fonte final:</span>
              <span className="font-medium">{formatSourceName(finalSource)}</span>
            </div>

            {/* Lista de valores por fonte */}
            {showDetails && validSources.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Valores por fonte:</div>
                <div className="space-y-1">
                  {values.map((v) => (
                    <div
                      key={v.source}
                      className={`flex justify-between items-center text-xs ${
                        v.source === finalSource
                          ? 'font-medium text-primary'
                          : v.value === null
                            ? 'text-muted-foreground/50'
                            : ''
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {v.source === finalSource && (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        {formatSourceName(v.source)}
                      </span>
                      <span>{formatValue(v.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discrepâncias */}
            {hasDiscrepancy && divergentSources && divergentSources.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Fontes divergentes:
                </div>
                <div className="space-y-1">
                  {divergentSources.map((d) => (
                    <div key={d.source} className="flex justify-between items-center text-xs">
                      <span>{formatSourceName(d.source)}</span>
                      <span className="text-muted-foreground">
                        {formatValue(d.value)} ({d.deviation.toFixed(1)}% desvio)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Componente de resumo de qualidade de dados
 */
interface DataQualitySummaryProps {
  overallConfidence: number;
  totalFieldsTracked: number;
  fieldsWithDiscrepancy: number;
  fieldsWithHighConsensus: number;
  sourcesUsed: string[];
}

export function DataQualitySummary({
  overallConfidence,
  totalFieldsTracked,
  fieldsWithDiscrepancy,
  fieldsWithHighConsensus,
  sourcesUsed,
}: DataQualitySummaryProps) {
  const confidencePercent = Math.round(overallConfidence * 100);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={
                confidencePercent >= 80
                  ? 'success'
                  : confidencePercent >= 50
                    ? 'warning'
                    : 'destructive'
              }
              className="cursor-help"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {confidencePercent}% confianca
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confianca geral baseada no consenso entre fontes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="cursor-help">
              {sourcesUsed.length} fontes
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold mb-1">Fontes utilizadas:</p>
            {sourcesUsed.map((s) => (
              <p key={s}>{formatSourceName(s)}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="info" className="cursor-help">
              {totalFieldsTracked} campos
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{fieldsWithHighConsensus} campos com alto consenso</p>
            <p>{fieldsWithDiscrepancy} campos com discrepancia</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {fieldsWithDiscrepancy > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="warning" className="cursor-help">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {fieldsWithDiscrepancy} discrepancias
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Campos onde as fontes divergem significativamente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
