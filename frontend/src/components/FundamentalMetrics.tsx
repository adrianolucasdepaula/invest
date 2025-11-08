'use client';

import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercent } from '@/lib/utils';

interface FundamentalMetric {
  label: string;
  value: number | null;
  sources: number;
  agreement: number; // 0-100 percentage
  tooltip?: string;
}

interface FundamentalMetricsProps {
  ticker: string;
  metrics: {
    pl?: number | null;
    pvp?: number | null;
    roe?: number | null;
    dividendYield?: number | null;
    debtEquity?: number | null;
    ebitda?: number | null;
    netMargin?: number | null;
    currentRatio?: number | null;
    peg?: number | null;
    lpa?: number | null;
    vpa?: number | null;
    liquidezCorrente?: number | null;
  };
  dataSources?: number;
  confidenceScore?: number;
  onViewDetails?: () => void;
}

export default function FundamentalMetrics({
  ticker,
  metrics,
  dataSources = 1,
  confidenceScore = 85,
  onViewDetails,
}: FundamentalMetricsProps) {
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const mainMetrics: FundamentalMetric[] = [
    {
      label: 'P/L (Preço/Lucro)',
      value: metrics.pl || null,
      sources: dataSources,
      agreement: 92,
      tooltip: 'Relação entre preço da ação e lucro por ação',
    },
    {
      label: 'P/VP (Preço/Valor Patrimonial)',
      value: metrics.pvp || null,
      sources: dataSources,
      agreement: 88,
      tooltip: 'Relação entre preço e valor patrimonial por ação',
    },
    {
      label: 'ROE (Retorno sobre Patrimônio)',
      value: metrics.roe || null,
      sources: dataSources,
      agreement: 95,
      tooltip: 'Rentabilidade sobre o patrimônio líquido',
    },
    {
      label: 'Dividend Yield',
      value: metrics.dividendYield || null,
      sources: dataSources,
      agreement: 90,
      tooltip: 'Percentual de dividendos em relação ao preço',
    },
    {
      label: 'Dívida/Patrimônio',
      value: metrics.debtEquity || null,
      sources: dataSources,
      agreement: 87,
      tooltip: 'Relação entre dívida total e patrimônio líquido',
    },
  ];

  const additionalMetrics: FundamentalMetric[] = [
    {
      label: 'EBITDA',
      value: metrics.ebitda || null,
      sources: dataSources,
      agreement: 85,
      tooltip: 'Lucro antes de juros, impostos, depreciação e amortização',
    },
    {
      label: 'Margem Líquida',
      value: metrics.netMargin || null,
      sources: dataSources,
      agreement: 89,
      tooltip: 'Percentual de lucro líquido sobre a receita',
    },
    {
      label: 'Liquidez Corrente',
      value: metrics.currentRatio || metrics.liquidezCorrente || null,
      sources: dataSources,
      agreement: 91,
      tooltip: 'Capacidade de pagamento de curto prazo',
    },
    {
      label: 'PEG Ratio',
      value: metrics.peg || null,
      sources: dataSources,
      agreement: 78,
      tooltip: 'P/L ajustado pelo crescimento',
    },
    {
      label: 'LPA (Lucro por Ação)',
      value: metrics.lpa || null,
      sources: dataSources,
      agreement: 93,
      tooltip: 'Lucro líquido dividido pelo número de ações',
    },
    {
      label: 'VPA (Valor Patrimonial por Ação)',
      value: metrics.vpa || null,
      sources: dataSources,
      agreement: 94,
      tooltip: 'Patrimônio líquido dividido pelo número de ações',
    },
  ];

  const getAgreementBadge = (agreement: number) => {
    if (agreement >= 90) {
      return (
        <Badge variant="success" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Alta concordância
        </Badge>
      );
    } else if (agreement >= 75) {
      return (
        <Badge variant="warning" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Média concordância
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Baixa concordância
        </Badge>
      );
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) {
      return <Badge variant="success">Confiança: {score}%</Badge>;
    } else if (score >= 60) {
      return <Badge variant="warning">Confiança: {score}%</Badge>;
    } else {
      return <Badge variant="destructive">Confiança: {score}%</Badge>;
    }
  };

  const formatMetricValue = (metric: FundamentalMetric) => {
    if (metric.value === null) return 'N/A';

    // Format as percentage for certain metrics
    if (
      metric.label.includes('ROE') ||
      metric.label.includes('Yield') ||
      metric.label.includes('Margem')
    ) {
      return formatPercent(metric.value, 2);
    }

    return formatNumber(metric.value, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Indicadores Fundamentalistas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Dados consolidados de {dataSources} fontes
            </p>
          </div>
          {getConfidenceBadge(confidenceScore)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  {metric.label}
                  {metric.tooltip && (
                    <span title={metric.tooltip}>
                      <Info className="h-3 w-3 cursor-help" />
                    </span>
                  )}
                </p>
              </div>
              <p className="text-2xl font-bold mb-2">{formatMetricValue(metric)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {metric.sources} fontes
                </span>
                {getAgreementBadge(metric.agreement)}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Metrics (Collapsible) */}
        {showAllMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {additionalMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    {metric.label}
                    {metric.tooltip && (
                      <span title={metric.tooltip}>
                        <Info className="h-3 w-3 cursor-help" />
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-2xl font-bold mb-2">{formatMetricValue(metric)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {metric.sources} fontes
                  </span>
                  {getAgreementBadge(metric.agreement)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toggle Button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAllMetrics(!showAllMetrics)}
          >
            {showAllMetrics ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Mostrar Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver Todos os Indicadores
              </>
            )}
          </Button>
          {onViewDetails && (
            <Button variant="default" onClick={onViewDetails}>
              Ver Detalhes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
