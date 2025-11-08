'use client';

import { useState, useMemo } from 'react';
import { useAnalyses } from '@/lib/hooks/use-analysis';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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

  const { data: analyses, isLoading, error } = useAnalyses({
    type: filterType === 'all' ? undefined : filterType,
  });

  const filteredAnalyses = useMemo(() => {
    if (!analyses) return [];
    return analyses.filter((analysis: any) => {
      const matchesSearch =
        analysis.asset?.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [analyses, searchTerm]);

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

      {isLoading ? (
        <div className="grid gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </Card>
            ))}
        </div>
      ) : error ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Activity className="h-16 w-16 text-destructive/50" />
            <div>
              <h3 className="text-lg font-semibold text-destructive">Erro ao carregar análises</h3>
              <p className="text-sm text-muted-foreground">
                Verifique sua conexão e tente novamente
              </p>
            </div>
          </div>
        </Card>
      ) : filteredAnalyses.length === 0 ? (
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
      ) : (
        <div className="grid gap-4">
          {filteredAnalyses.map((analysis: any) => (
            <Card key={analysis.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-xl font-semibold">{analysis.asset?.ticker || 'N/A'}</h3>
                      <p className="text-sm text-muted-foreground">{analysis.asset?.name || 'N/A'}</p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1">
                      <span className="text-sm font-medium text-primary capitalize">
                        {analysis.type === 'complete' ? 'Completa' : analysis.type === 'fundamental' ? 'Fundamentalista' : 'Técnica'}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'rounded-full border px-3 py-1',
                        analysis.status === 'completed' ? 'bg-success/10 border-success/20 text-success' :
                        analysis.status === 'processing' ? 'bg-warning/10 border-warning/20 text-warning' :
                        analysis.status === 'failed' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                        'bg-muted/10 border-muted/20 text-muted-foreground'
                      )}
                    >
                      <span className="text-sm font-medium capitalize">
                        {analysis.status === 'completed' ? 'Concluída' :
                         analysis.status === 'processing' ? 'Processando' :
                         analysis.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </span>
                    </div>
                    {analysis.recommendation && (
                      <div
                        className={cn(
                          'flex items-center space-x-2 rounded-full border px-3 py-1',
                          getSignalColor(analysis.recommendation.toUpperCase()),
                        )}
                      >
                        {analysis.recommendation.includes('buy') ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : analysis.recommendation === 'hold' ? (
                          <Activity className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-semibold">
                          {getSignalLabel(analysis.recommendation.toUpperCase())}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-6 gap-4">
                    {analysis.confidenceScore && (
                      <div>
                        <p className="text-sm text-muted-foreground">Confiança</p>
                        <p className={cn('text-2xl font-bold', getScoreColor(analysis.confidenceScore * 100))}>
                          {(analysis.confidenceScore * 100).toFixed(0)}
                        </p>
                      </div>
                    )}
                    {analysis.sourcesCount > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fontes</p>
                        <p className="text-lg font-semibold">{analysis.sourcesCount}</p>
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

                  {analysis.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {analysis.summary}
                    </p>
                  )}
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
      )}
    </div>
  );
}
