'use client';

import { use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

// Mock data - substituir com useReport(id)
const mockReport = {
  id: '1',
  ticker: 'PETR4',
  assetName: 'Petrobras PN',
  createdAt: '2024-01-15T10:30:00',
  recommendation: {
    action: 'STRONG_BUY',
    confidence: 85,
    reasoning:
      'A empresa apresenta fundamentos sólidos, com ROE acima de 18% e P/L atrativo em 8.5x. A análise técnica indica tendência de alta com suporte bem definido. O cenário macroeconômico favorável para petróleo adiciona perspectiva positiva.',
  },
  targetPrices: {
    conservative: 42.0,
    moderate: 45.0,
    optimistic: 50.0,
  },
  currentPrice: 38.45,
  fundamentalAnalysis: {
    summary: 'Fundamentos sólidos com valuation atrativo',
    indicators: {
      pl: 8.5,
      pvp: 1.2,
      roe: 18.5,
      roic: 15.2,
      dividendYield: 12.3,
      debtEquity: 0.45,
      currentRatio: 1.8,
      grossMargin: 42.5,
      netMargin: 15.2,
    },
    strengths: [
      'ROE acima da média do setor (18.5%)',
      'Dividend Yield atrativo (12.3%)',
      'Baixo endividamento (D/E = 0.45)',
      'Margens de lucro saudáveis',
    ],
    weaknesses: [
      'Exposição a volatilidade do petróleo',
      'Riscos regulatórios e políticos',
    ],
  },
  technicalAnalysis: {
    summary: 'Tendência de alta confirmada com indicadores positivos',
    signal: 'BUY',
    strength: 78,
    indicators: {
      rsi: 62.5,
      macd: 'Compra',
      sma20: 37.8,
      sma50: 36.5,
      sma200: 35.2,
      bollingerPosition: 'Acima da média',
    },
    supportLevels: [36.5, 35.2, 33.8],
    resistanceLevels: [39.5, 41.2, 43.0],
    patterns: ['Golden Cross (SMA20 > SMA50)', 'Tendência de alta definida'],
  },
  riskAnalysis: {
    riskLevel: 'Médio',
    factors: [
      {
        type: 'Mercado',
        description: 'Volatilidade do preço do petróleo',
        impact: 'Alto',
      },
      {
        type: 'Político',
        description: 'Interferência governamental',
        impact: 'Médio',
      },
      {
        type: 'Cambial',
        description: 'Exposição ao dólar',
        impact: 'Médio',
      },
    ],
    mitigation: [
      'Diversificar exposição ao setor',
      'Manter horizonte de longo prazo',
      'Acompanhar notícias e indicadores macroeconômicos',
    ],
  },
  keyPoints: [
    'Valuation atrativo com P/L de 8.5x',
    'ROE consistente acima de 18%',
    'Dividend Yield de 12.3% ao ano',
    'Tendência técnica de alta confirmada',
    'Suporte bem definido em R$ 36.50',
  ],
  warnings: [
    'Exposição a volatilidade do petróleo',
    'Riscos políticos e regulatórios',
    'Dependência de cenário macroeconômico',
  ],
  opportunities: [
    'Potencial de alta de 17% (cenário conservador)',
    'Possibilidade de dividendos elevados',
    'Recuperação do setor de O&G',
  ],
};

const getRecommendationColor = (action: string) => {
  switch (action) {
    case 'STRONG_BUY':
    case 'BUY':
      return 'text-success bg-success/10 border-success/20';
    case 'HOLD':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'SELL':
    case 'STRONG_SELL':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    default:
      return 'text-muted-foreground bg-muted/10 border-muted/20';
  }
};

const getRecommendationLabel = (action: string) => {
  switch (action) {
    case 'STRONG_BUY':
      return 'Compra Forte';
    case 'BUY':
      return 'Compra';
    case 'HOLD':
      return 'Manter';
    case 'SELL':
      return 'Venda';
    case 'STRONG_SELL':
      return 'Venda Forte';
    default:
      return action;
  }
};

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Relatório: {mockReport.ticker}
            </h1>
            <p className="text-muted-foreground">{mockReport.assetName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button>Gerar Novo Relatório</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Recomendação</p>
            <div
              className={cn(
                'inline-flex items-center space-x-2 rounded-full border px-4 py-2',
                getRecommendationColor(mockReport.recommendation.action),
              )}
            >
              {mockReport.recommendation.action.includes('BUY') ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span className="text-lg font-semibold">
                {getRecommendationLabel(mockReport.recommendation.action)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Confiança: {mockReport.recommendation.confidence}%
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Preço Atual</p>
            <p className="text-3xl font-bold">
              {formatCurrency(mockReport.currentPrice)}
            </p>
            <p className="text-xs text-muted-foreground">
              Gerado em {new Date(mockReport.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Preço Alvo (Moderado)</p>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(mockReport.targetPrices.moderate)}
            </p>
            <p className="text-xs text-success">
              Potencial de{' '}
              {formatPercent(
                ((mockReport.targetPrices.moderate - mockReport.currentPrice) /
                  mockReport.currentPrice) *
                  100,
              )}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="fundamental">Fundamentalista</TabsTrigger>
            <TabsTrigger value="technical">Técnica</TabsTrigger>
            <TabsTrigger value="risks">Riscos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Recomendação</h3>
              <p className="text-muted-foreground">
                {mockReport.recommendation.reasoning}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center">
                  <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                  Pontos Chave
                </h4>
                <ul className="space-y-2 text-sm">
                  {mockReport.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-success">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                  Atenção
                </h4>
                <ul className="space-y-2 text-sm">
                  {mockReport.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-destructive">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center">
                  <Target className="mr-2 h-4 w-4 text-blue-500" />
                  Oportunidades
                </h4>
                <ul className="space-y-2 text-sm">
                  {mockReport.opportunities.map((opp, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-success">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border p-6">
              <h4 className="text-lg font-semibold mb-4">Preços Alvo</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Conservador</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(mockReport.targetPrices.conservative)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(
                      ((mockReport.targetPrices.conservative - mockReport.currentPrice) /
                        mockReport.currentPrice) *
                        100,
                    )}
                  </p>
                </div>
                <div className="text-center border-x">
                  <p className="text-sm text-muted-foreground mb-1">Moderado</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(mockReport.targetPrices.moderate)}
                  </p>
                  <p className="text-xs text-success">
                    {formatPercent(
                      ((mockReport.targetPrices.moderate - mockReport.currentPrice) /
                        mockReport.currentPrice) *
                        100,
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Otimista</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(mockReport.targetPrices.optimistic)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(
                      ((mockReport.targetPrices.optimistic - mockReport.currentPrice) /
                        mockReport.currentPrice) *
                        100,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fundamental" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Análise Fundamentalista</h3>
              <p className="text-muted-foreground mb-4">
                {mockReport.fundamentalAnalysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(mockReport.fundamentalAnalysis.indicators).map(([key, value]) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-2xl font-bold">
                    {typeof value === 'number'
                      ? key.includes('Yield') || key.includes('Margin') || key.includes('roe') || key.includes('roic')
                        ? formatPercent(value)
                        : value.toFixed(2)
                      : value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-3 text-success">Forças</h4>
                <ul className="space-y-2 text-sm">
                  {mockReport.fundamentalAnalysis.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-success">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-3 text-destructive">Fraquezas</h4>
                <ul className="space-y-2 text-sm">
                  {mockReport.fundamentalAnalysis.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-destructive">✗</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Análise Técnica</h3>
              <p className="text-muted-foreground mb-4">
                {mockReport.technicalAnalysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(mockReport.technicalAnalysis.indicators).map(([key, value]) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xl font-bold">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-3">Suportes</h4>
                <div className="space-y-2">
                  {mockReport.technicalAnalysis.supportLevels.map((level, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">Suporte {i + 1}</span>
                      <span className="font-semibold">{formatCurrency(level)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-3">Resistências</h4>
                <div className="space-y-2">
                  {mockReport.technicalAnalysis.resistanceLevels.map((level, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">Resistência {i + 1}</span>
                      <span className="font-semibold">{formatCurrency(level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3">Padrões Identificados</h4>
              <ul className="space-y-2 text-sm">
                {mockReport.technicalAnalysis.patterns.map((pattern, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <div className="rounded-lg border-2 border-orange-500/20 bg-orange-500/5 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold">
                  Nível de Risco: {mockReport.riskAnalysis.riskLevel}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Avalie cuidadosamente os riscos antes de investir
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Fatores de Risco</h4>
              <div className="space-y-3">
                {mockReport.riskAnalysis.factors.map((factor, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium">{factor.type}</h5>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          factor.impact === 'Alto'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700',
                        )}
                      >
                        {factor.impact}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {factor.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3">Estratégias de Mitigação</h4>
              <ul className="space-y-2 text-sm">
                {mockReport.riskAnalysis.mitigation.map((strategy, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-primary">→</span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
