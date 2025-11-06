'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  RefreshCw,
  Play,
} from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';

const mockAnalyses = [
  {
    id: '1',
    ticker: 'PETR4',
    assetName: 'Petrobras PN',
    type: 'complete',
    createdAt: '2024-01-15T10:30:00',
    technicalSignal: 'BUY',
    technicalScore: 78,
    fundamentalScore: 72,
    rsi: 62.5,
    pl: 8.5,
    roe: 18.5,
    status: 'completed',
  },
  {
    id: '2',
    ticker: 'VALE3',
    assetName: 'Vale ON',
    type: 'technical',
    createdAt: '2024-01-14T15:45:00',
    technicalSignal: 'HOLD',
    technicalScore: 55,
    rsi: 48.2,
    status: 'completed',
  },
  {
    id: '3',
    ticker: 'ITUB4',
    assetName: 'Itaú Unibanco PN',
    type: 'fundamental',
    createdAt: '2024-01-13T09:15:00',
    fundamentalScore: 85,
    pl: 7.2,
    roe: 22.3,
    status: 'completed',
  },
  {
    id: '4',
    ticker: 'WEGE3',
    assetName: 'WEG ON',
    type: 'complete',
    createdAt: '2024-01-12T14:20:00',
    technicalSignal: 'STRONG_BUY',
    technicalScore: 88,
    fundamentalScore: 92,
    rsi: 68.4,
    pl: 32.5,
    roe: 28.7,
    status: 'completed',
  },
  {
    id: '5',
    ticker: 'MGLU3',
    assetName: 'Magazine Luiza ON',
    type: 'complete',
    createdAt: '2024-01-11T11:00:00',
    technicalSignal: 'SELL',
    technicalScore: 35,
    fundamentalScore: 28,
    rsi: 32.1,
    pl: -15.2,
    roe: -8.5,
    status: 'completed',
  },
];

const getSignalColor = (signal?: string) => {
  switch (signal) {
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

const getSignalLabel = (signal?: string) => {
  switch (signal) {
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
      return 'N/A';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
};

export default function AnalysisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fundamental' | 'technical' | 'complete'>('all');

  const filteredAnalyses = mockAnalyses.filter((analysis) => {
    const matchesSearch =
      analysis.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.assetName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || analysis.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground">
            Análises técnicas e fundamentalistas dos ativos
          </p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Nova Análise
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Card className="flex-1 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar análises por ticker ou ativo..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>
        <div className="flex items-center space-x-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            Todas
          </Button>
          <Button
            variant={filterType === 'fundamental' ? 'default' : 'outline'}
            onClick={() => setFilterType('fundamental')}
          >
            Fundamentalista
          </Button>
          <Button
            variant={filterType === 'technical' ? 'default' : 'outline'}
            onClick={() => setFilterType('technical')}
          >
            Técnica
          </Button>
          <Button
            variant={filterType === 'complete' ? 'default' : 'outline'}
            onClick={() => setFilterType('complete')}
          >
            Completa
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAnalyses.map((analysis) => (
          <Card key={analysis.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-xl font-semibold">{analysis.ticker}</h3>
                    <p className="text-sm text-muted-foreground">{analysis.assetName}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1">
                    <span className="text-sm font-medium text-primary capitalize">
                      {analysis.type === 'complete' ? 'Completa' : analysis.type === 'fundamental' ? 'Fundamentalista' : 'Técnica'}
                    </span>
                  </div>
                  {analysis.technicalSignal && (
                    <div
                      className={cn(
                        'flex items-center space-x-2 rounded-full border px-3 py-1',
                        getSignalColor(analysis.technicalSignal),
                      )}
                    >
                      {analysis.technicalSignal.includes('BUY') ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : analysis.technicalSignal === 'HOLD' ? (
                        <Activity className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">
                        {getSignalLabel(analysis.technicalSignal)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-4">
                  {analysis.technicalScore !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Score Técnico</p>
                      <p className={cn('text-2xl font-bold', getScoreColor(analysis.technicalScore))}>
                        {analysis.technicalScore}
                      </p>
                    </div>
                  )}
                  {analysis.fundamentalScore !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Score Fundamentalista</p>
                      <p className={cn('text-2xl font-bold', getScoreColor(analysis.fundamentalScore))}>
                        {analysis.fundamentalScore}
                      </p>
                    </div>
                  )}
                  {analysis.rsi !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">RSI</p>
                      <p className="text-lg font-semibold">{analysis.rsi.toFixed(1)}</p>
                    </div>
                  )}
                  {analysis.pl !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">P/L</p>
                      <p className="text-lg font-semibold">{analysis.pl.toFixed(1)}</p>
                    </div>
                  )}
                  {analysis.roe !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">ROE</p>
                      <p className="text-lg font-semibold">{formatPercent(analysis.roe)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Realizada em</p>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button variant="outline" size="sm">
                  Ver Detalhes
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredAnalyses.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Activity className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold">Nenhuma análise encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Tente buscar por outro termo ou solicite uma nova análise
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
