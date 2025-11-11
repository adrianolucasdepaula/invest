'use client';

import { useState, useMemo } from 'react';
import { useAnalyses } from '@/lib/hooks/use-analysis';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NewAnalysisDialog } from '@/components/analysis';
import { AddPositionDialog } from '@/components/portfolio/add-position-dialog';
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
import { useToast } from '@/components/ui/use-toast';

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
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: analyses, isLoading, error, refetch } = useAnalyses({
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

  const handleViewDetails = (analysis: any) => {
    setSelectedAnalysis(analysis);
    setIsDetailsOpen(true);
  };

  const handleRefreshAnalysis = async (analysis: any) => {
    setRefreshingId(analysis.id);
    try {
      // Buscar token
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Não autorizado',
          description: 'Você precisa estar autenticado. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/analysis/${analysis.asset.ticker}/${analysis.type}`;
      console.log('[Atualizar] Requesting URL:', apiUrl);
      console.log('[Atualizar] Token:', token ? 'exists' : 'missing');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[Atualizar] Response status:', response.status);
      console.log('[Atualizar] Response URL:', response.url);

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Sessão expirada',
            description: 'Sua sessão expirou. Por favor, faça login novamente.',
            variant: 'destructive',
          });
          // Limpar token e redirecionar
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
          return;
        }

        if (response.status === 404) {
          const errorText = await response.text();
          console.error('[Atualizar] 404 Error details:', errorText);
          toast({
            title: 'Erro 404 - Rota não encontrada',
            description: `A rota de análise não foi encontrada. Verifique a configuração do backend.`,
            variant: 'destructive',
          });
          return;
        }

        const error = await response.json().catch(() => ({ message: 'Falha ao atualizar análise' }));
        throw new Error(error.message || 'Falha ao atualizar análise');
      }

      toast({
        title: 'Análise atualizada!',
        description: `A análise de ${analysis.asset.ticker} foi atualizada com sucesso.`,
      });

      // Refetch analyses after a short delay to allow processing
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      console.error('[Atualizar] Erro ao atualizar análise:', error);
      toast({
        title: 'Erro ao atualizar análise',
        description: error.message || 'Ocorreu um erro ao atualizar a análise. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground">
            Análises técnicas e fundamentalistas dos ativos
          </p>
        </div>
        <NewAnalysisDialog />
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(analysis)}
                  >
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshAnalysis(analysis)}
                    disabled={refreshingId === analysis.id}
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshingId === analysis.id && "animate-spin")} />
                    {refreshingId === analysis.id ? 'Atualizando...' : 'Atualizar'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Análise - {selectedAnalysis?.asset?.ticker}
            </DialogTitle>
            <DialogDescription>
              {selectedAnalysis?.asset?.name} | {' '}
              {selectedAnalysis?.type === 'complete' ? 'Análise Completa' : selectedAnalysis?.type === 'fundamental' ? 'Análise Fundamentalista' : 'Análise Técnica'}
            </DialogDescription>
          </DialogHeader>

          {selectedAnalysis && (
            <div className="space-y-6 py-4">
              {/* Overview Section */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">{selectedAnalysis.status === 'completed' ? 'Concluída' : selectedAnalysis.status === 'processing' ? 'Processando' : selectedAnalysis.status === 'failed' ? 'Falhou' : 'Pendente'}</p>
                </Card>
                {selectedAnalysis.recommendation && (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Recomendação</p>
                    <p className="text-lg font-semibold">{getSignalLabel(selectedAnalysis.recommendation.toUpperCase())}</p>
                  </Card>
                )}
                {selectedAnalysis.confidenceScore && (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Confiança</p>
                    <p className={cn('text-lg font-semibold', getScoreColor(selectedAnalysis.confidenceScore * 100))}>
                      {(selectedAnalysis.confidenceScore * 100).toFixed(0)}%
                    </p>
                  </Card>
                )}
              </div>

              {/* Analysis Data */}
              {selectedAnalysis.analysis && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Dados da Análise</h4>
                  <Card className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Valuation */}
                      {(selectedAnalysis.analysis.cotacao || selectedAnalysis.analysis.pl || selectedAnalysis.analysis.pvp) && (
                        <div className="col-span-2 md:col-span-3">
                          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Valuation</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {selectedAnalysis.analysis.cotacao && (
                              <div>
                                <p className="text-xs text-muted-foreground">Cotação</p>
                                <p className="font-medium">R$ {Number(selectedAnalysis.analysis.cotacao).toFixed(2)}</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.pl && (
                              <div>
                                <p className="text-xs text-muted-foreground">P/L</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.pl).toFixed(2)}</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.pvp && (
                              <div>
                                <p className="text-xs text-muted-foreground">P/VP</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.pvp).toFixed(2)}</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.psr && (
                              <div>
                                <p className="text-xs text-muted-foreground">P/SR</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.psr).toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dividendos e Rentabilidade */}
                      {(selectedAnalysis.analysis.dividendYield || selectedAnalysis.analysis.roe || selectedAnalysis.analysis.roic) && (
                        <div className="col-span-2 md:col-span-3">
                          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Rentabilidade</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {selectedAnalysis.analysis.dividendYield && (
                              <div>
                                <p className="text-xs text-muted-foreground">Dividend Yield</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.dividendYield).toFixed(2)}%</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.roe && (
                              <div>
                                <p className="text-xs text-muted-foreground">ROE</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.roe).toFixed(2)}%</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.roic && (
                              <div>
                                <p className="text-xs text-muted-foreground">ROIC</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.roic).toFixed(2)}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Margens */}
                      {(selectedAnalysis.analysis.margemEbit || selectedAnalysis.analysis.margemLiquida) && (
                        <div className="col-span-2 md:col-span-3">
                          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Margens</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {selectedAnalysis.analysis.margemEbit && (
                              <div>
                                <p className="text-xs text-muted-foreground">Margem EBIT</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.margemEbit).toFixed(2)}%</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.margemLiquida && (
                              <div>
                                <p className="text-xs text-muted-foreground">Margem Líquida</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.margemLiquida).toFixed(2)}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Indicadores de Valor */}
                      {(selectedAnalysis.analysis.evEbit || selectedAnalysis.analysis.pEbit) && (
                        <div className="col-span-2 md:col-span-3">
                          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Múltiplos</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {selectedAnalysis.analysis.evEbit && (
                              <div>
                                <p className="text-xs text-muted-foreground">EV/EBIT</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.evEbit).toFixed(2)}</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.evEbitda && (
                              <div>
                                <p className="text-xs text-muted-foreground">EV/EBITDA</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.evEbitda).toFixed(2)}</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.pEbit && (
                              <div>
                                <p className="text-xs text-muted-foreground">P/EBIT</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.pEbit).toFixed(2)}</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.pAtivo && (
                              <div>
                                <p className="text-xs text-muted-foreground">P/Ativo</p>
                                <p className="font-medium">{Number(selectedAnalysis.analysis.pAtivo).toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dados Financeiros */}
                      {(selectedAnalysis.analysis.patrimonioLiquido || selectedAnalysis.analysis.dividaBruta || selectedAnalysis.analysis.disponibilidades) && (
                        <div className="col-span-2 md:col-span-3">
                          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Dados Financeiros</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {selectedAnalysis.analysis.patrimonioLiquido && (
                              <div>
                                <p className="text-xs text-muted-foreground">Patrimônio Líquido</p>
                                <p className="font-medium">R$ {(Number(selectedAnalysis.analysis.patrimonioLiquido) / 1000000).toFixed(0)}M</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.dividaBruta && (
                              <div>
                                <p className="text-xs text-muted-foreground">Dívida Bruta</p>
                                <p className="font-medium">R$ {(Number(selectedAnalysis.analysis.dividaBruta) / 1000000).toFixed(0)}M</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.disponibilidades && (
                              <div>
                                <p className="text-xs text-muted-foreground">Disponibilidades</p>
                                <p className="font-medium">R$ {(Number(selectedAnalysis.analysis.disponibilidades) / 1000000).toFixed(0)}M</p>
                              </div>
                            )}
                            {selectedAnalysis.analysis.lucroLiquido && (
                              <div>
                                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                                <p className="font-medium">R$ {(Number(selectedAnalysis.analysis.lucroLiquido) / 1000000).toFixed(0)}M</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* JSON completo em collapse */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Ver dados completos (JSON)
                      </summary>
                      <pre className="text-xs overflow-auto max-h-60 mt-2 p-2 bg-muted rounded">
                        {JSON.stringify(selectedAnalysis.analysis, null, 2)}
                      </pre>
                    </details>
                  </Card>
                </div>
              )}

              {/* Indicators */}
              {selectedAnalysis.indicators && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Indicadores</h4>
                  <Card className="p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedAnalysis.indicators, null, 2)}
                    </pre>
                  </Card>
                </div>
              )}

              {/* Data Sources */}
              {selectedAnalysis.dataSources && selectedAnalysis.dataSources.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Fontes de Dados ({selectedAnalysis.sourcesCount})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnalysis.dataSources.map((source: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{new Date(selectedAnalysis.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                {selectedAnalysis.completedAt && (
                  <div>
                    <p className="text-muted-foreground">Concluído em</p>
                    <p className="font-medium">{new Date(selectedAnalysis.completedAt).toLocaleString('pt-BR')}</p>
                  </div>
                )}
                {selectedAnalysis.processingTime && (
                  <div>
                    <p className="text-muted-foreground">Tempo de processamento</p>
                    <p className="font-medium">{selectedAnalysis.processingTime}ms</p>
                  </div>
                )}
              </div>

              {selectedAnalysis.errorMessage && (
                <Card className="p-4 border-destructive">
                  <p className="text-sm font-semibold text-destructive">Erro:</p>
                  <p className="text-sm text-muted-foreground">{selectedAnalysis.errorMessage}</p>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
