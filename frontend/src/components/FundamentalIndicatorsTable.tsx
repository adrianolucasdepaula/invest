'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercent } from '@/lib/utils';
import type { FieldSourceInfo } from '@/lib/hooks/use-assets';

// Props interface
interface FundamentalIndicatorsTableProps {
  ticker: string;
  fields: Record<string, FieldSourceInfo>;
  sourcesUsed?: string[];
  overallConfidence?: number;
  lastUpdate?: string | null;
}

// Indicator definition
interface IndicatorDef {
  key: string;
  label: string;
  tooltip: string;
  format: 'number' | 'percent' | 'currency' | 'ratio';
  decimals?: number;
}

// Category definition
interface CategoryDef {
  name: string;
  indicators: IndicatorDef[];
}

// All indicator categories
const INDICATOR_CATEGORIES: CategoryDef[] = [
  {
    name: 'Valuation',
    indicators: [
      { key: 'pl', label: 'P/L', tooltip: 'Preço/Lucro - Relação entre preço da ação e lucro por ação', format: 'ratio' },
      { key: 'pvp', label: 'P/VP', tooltip: 'Preço/Valor Patrimonial - Relação entre preço e valor patrimonial por ação', format: 'ratio' },
      { key: 'psr', label: 'PSR', tooltip: 'Price/Sales Ratio - Preço sobre Receita Líquida', format: 'ratio' },
      { key: 'pAtivos', label: 'P/Ativos', tooltip: 'Preço sobre Ativos Totais', format: 'ratio' },
      { key: 'pCapitalGiro', label: 'P/Cap. Giro', tooltip: 'Preço sobre Capital de Giro', format: 'ratio' },
      { key: 'pEbit', label: 'P/EBIT', tooltip: 'Preço sobre EBIT', format: 'ratio' },
      { key: 'evEbit', label: 'EV/EBIT', tooltip: 'Enterprise Value sobre EBIT', format: 'ratio' },
      { key: 'evEbitda', label: 'EV/EBITDA', tooltip: 'Enterprise Value sobre EBITDA', format: 'ratio' },
      { key: 'pegRatio', label: 'PEG', tooltip: 'P/L ajustado pelo crescimento', format: 'ratio' },
    ],
  },
  {
    name: 'Rentabilidade',
    indicators: [
      { key: 'roe', label: 'ROE', tooltip: 'Return on Equity - Retorno sobre Patrimônio Líquido', format: 'percent' },
      { key: 'roic', label: 'ROIC', tooltip: 'Return on Invested Capital - Retorno sobre Capital Investido', format: 'percent' },
      { key: 'roa', label: 'ROA', tooltip: 'Return on Assets - Retorno sobre Ativos', format: 'percent' },
      { key: 'giroAtivos', label: 'Giro Ativos', tooltip: 'Giro dos Ativos - Eficiência no uso de ativos', format: 'ratio' },
    ],
  },
  {
    name: 'Margens',
    indicators: [
      { key: 'margemBruta', label: 'Margem Bruta', tooltip: 'Lucro Bruto / Receita Líquida', format: 'percent' },
      { key: 'margemEbit', label: 'Margem EBIT', tooltip: 'EBIT / Receita Líquida', format: 'percent' },
      { key: 'margemEbitda', label: 'Margem EBITDA', tooltip: 'EBITDA / Receita Líquida', format: 'percent' },
      { key: 'margemLiquida', label: 'Margem Líquida', tooltip: 'Lucro Líquido / Receita Líquida', format: 'percent' },
    ],
  },
  {
    name: 'Endividamento',
    indicators: [
      { key: 'dividaLiquidaPatrimonio', label: 'Dív. Líq./PL', tooltip: 'Dívida Líquida sobre Patrimônio Líquido', format: 'ratio' },
      { key: 'dividaLiquidaEbit', label: 'Dív. Líq./EBIT', tooltip: 'Dívida Líquida sobre EBIT', format: 'ratio' },
      { key: 'dividaLiquidaEbitda', label: 'Dív. Líq./EBITDA', tooltip: 'Dívida Líquida sobre EBITDA', format: 'ratio' },
      { key: 'patrimonioLiquidoAtivos', label: 'PL/Ativos', tooltip: 'Patrimônio Líquido sobre Ativos Totais', format: 'percent' },
      { key: 'passivosAtivos', label: 'Passivos/Ativos', tooltip: 'Passivos Totais sobre Ativos Totais', format: 'percent' },
    ],
  },
  {
    name: 'Por Ação',
    indicators: [
      { key: 'lpa', label: 'LPA', tooltip: 'Lucro por Ação - Lucro líquido dividido pelo número de ações', format: 'currency', decimals: 2 },
      { key: 'vpa', label: 'VPA', tooltip: 'Valor Patrimonial por Ação - Patrimônio líquido dividido pelo número de ações', format: 'currency', decimals: 2 },
    ],
  },
  {
    name: 'Dividendos',
    indicators: [
      { key: 'dividendYield', label: 'Dividend Yield', tooltip: 'Dividendos pagos / Preço da ação', format: 'percent' },
      { key: 'payout', label: 'Payout', tooltip: 'Percentual do lucro distribuído como dividendos', format: 'percent' },
    ],
  },
  {
    name: 'Crescimento',
    indicators: [
      { key: 'cagrReceitas5anos', label: 'CAGR Receita 5a', tooltip: 'Taxa de crescimento anual composta da receita nos últimos 5 anos', format: 'percent' },
      { key: 'cagrLucros5anos', label: 'CAGR Lucro 5a', tooltip: 'Taxa de crescimento anual composta do lucro nos últimos 5 anos', format: 'percent' },
    ],
  },
  {
    name: 'Liquidez',
    indicators: [
      { key: 'liquidezCorrente', label: 'Liquidez Corrente', tooltip: 'Ativo Circulante / Passivo Circulante - Capacidade de pagamento de curto prazo', format: 'ratio' },
    ],
  },
  {
    name: 'Balanço',
    indicators: [
      { key: 'receitaLiquida', label: 'Receita Líquida', tooltip: 'Receita Líquida (em milhões)', format: 'currency', decimals: 0 },
      { key: 'ebit', label: 'EBIT', tooltip: 'Lucro antes de juros e impostos (em milhões)', format: 'currency', decimals: 0 },
      { key: 'ebitda', label: 'EBITDA', tooltip: 'Lucro antes de juros, impostos, depreciação e amortização (em milhões)', format: 'currency', decimals: 0 },
      { key: 'lucroLiquido', label: 'Lucro Líquido', tooltip: 'Lucro líquido do período (em milhões)', format: 'currency', decimals: 0 },
      { key: 'patrimonioLiquido', label: 'Patrimônio Líquido', tooltip: 'Patrimônio líquido total (em milhões)', format: 'currency', decimals: 0 },
      { key: 'ativoTotal', label: 'Ativo Total', tooltip: 'Ativo total da empresa (em milhões)', format: 'currency', decimals: 0 },
      { key: 'dividaBruta', label: 'Dívida Bruta', tooltip: 'Dívida bruta total (em milhões)', format: 'currency', decimals: 0 },
      { key: 'dividaLiquida', label: 'Dívida Líquida', tooltip: 'Dívida bruta menos disponibilidades (em milhões)', format: 'currency', decimals: 0 },
      { key: 'disponibilidades', label: 'Disponibilidades', tooltip: 'Caixa e equivalentes de caixa (em milhões)', format: 'currency', decimals: 0 },
    ],
  },
];

export default function FundamentalIndicatorsTable({
  ticker,
  fields,
  sourcesUsed = [],
  overallConfidence = 0,
  lastUpdate,
}: FundamentalIndicatorsTableProps) {
  // State for collapsed sections (all expanded by default for first 3 categories)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Valuation', 'Rentabilidade', 'Margens'])
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const formatValue = (value: number | null, format: string, decimals = 2): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (format) {
      case 'percent':
        return formatPercent(value, decimals);
      case 'currency':
        if (Math.abs(value) >= 1000000) {
          return `R$ ${formatNumber(value / 1000000, 1)}M`;
        } else if (Math.abs(value) >= 1000) {
          return `R$ ${formatNumber(value / 1000, 1)}K`;
        }
        return `R$ ${formatNumber(value, decimals)}`;
      case 'ratio':
      case 'number':
      default:
        return formatNumber(value, decimals);
    }
  };

  const getConsensusBadge = (consensus: number, hasDiscrepancy: boolean) => {
    if (hasDiscrepancy) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          {consensus.toFixed(0)}%
        </Badge>
      );
    }
    if (consensus >= 90) {
      return (
        <Badge variant="success" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {consensus.toFixed(0)}%
        </Badge>
      );
    }
    if (consensus >= 75) {
      return (
        <Badge variant="warning" className="text-xs">
          {consensus.toFixed(0)}%
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs">
        {consensus.toFixed(0)}%
      </Badge>
    );
  };

  const getConfidenceBadge = (score: number) => {
    const displayScore = Math.round(score * 100);
    if (displayScore >= 80) {
      return <Badge variant="success">Confiança: {displayScore}%</Badge>;
    }
    if (displayScore >= 60) {
      return <Badge variant="warning">Confiança: {displayScore}%</Badge>;
    }
    return <Badge variant="destructive">Confiança: {displayScore}%</Badge>;
  };

  // Count how many indicators have data in each category
  const getCategoryStats = (category: CategoryDef) => {
    let total = 0;
    let withData = 0;
    for (const indicator of category.indicators) {
      total++;
      const field = fields[indicator.key];
      if (field?.finalValue !== null && field?.finalValue !== undefined) {
        withData++;
      }
    }
    return { total, withData };
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Indicadores Fundamentalistas</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Dados consolidados de {sourcesUsed.length} fontes
                {lastUpdate && ` - Atualizado em ${new Date(lastUpdate).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
            {getConfidenceBadge(overallConfidence)}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {INDICATOR_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.name);
            const stats = getCategoryStats(category);

            return (
              <div key={category.name} className="border rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({stats.withData}/{stats.total} indicadores)
                    </span>
                  </div>
                </button>

                {/* Category Table */}
                {isExpanded && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Indicador</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Fonte</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Consenso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.indicators.map((indicator) => {
                        const field = fields[indicator.key];
                        const value = field?.finalValue ?? null;
                        const source = field?.finalSource || '-';
                        const consensus = field?.consensus ?? 0;
                        const hasDiscrepancy = field?.hasDiscrepancy ?? false;

                        return (
                          <TableRow key={indicator.key}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{indicator.label}</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{indicator.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={cn(
                                  'font-mono',
                                  value === null ? 'text-muted-foreground' : ''
                                )}
                              >
                                {formatValue(value, indicator.format, indicator.decimals)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <span className="text-xs text-muted-foreground capitalize">
                                {source || '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              {value !== null ? (
                                getConsensusBadge(consensus, hasDiscrepancy)
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            );
          })}

          {/* Sources footer */}
          {sourcesUsed.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Fontes:</strong> {sourcesUsed.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
