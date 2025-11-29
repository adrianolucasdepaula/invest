'use client';

import { useState, useMemo } from 'react';
import Cookies from 'js-cookie';
import { useAnalyses } from '@/lib/hooks/use-analysis';
import { useReportsAssets, useRequestAnalysis, useRequestBulkAnalysis } from '@/lib/hooks/use-reports-assets';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NewAnalysisDialog } from '@/components/analysis';
import { AddPositionDialog } from '@/components/portfolio/add-position-dialog';
import { MultiSourceTooltip } from '@/components/reports/MultiSourceTooltip';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  RefreshCw,
  Play,
  Trash2,
  AlertTriangle,
  BarChart3,
  PlayCircle,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Minus,
  FileText,
} from 'lucide-react';
import { cn, formatPercent, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Helpers para view "Por Ativo" (mesmo de /reports)
const getRecommendationColor = (recommendation: string) => {
  const rec = recommendation?.toUpperCase() || '';
  if (rec.includes('STRONG_BUY') || rec === 'BUY') {
    return 'text-green-600 bg-green-50 border-green-200';
  }
  if (rec.includes('HOLD')) {
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  }
  if (rec.includes('SELL')) {
    return 'text-red-600 bg-red-50 border-red-200';
  }
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

const getRecommendationLabel = (recommendation: string) => {
  const rec = recommendation?.toUpperCase() || '';
  if (rec.includes('STRONG_BUY') || rec === 'BUY') return 'Compra';
  if (rec.includes('HOLD')) return 'Manter';
  if (rec.includes('SELL')) return 'Venda';
  return recommendation || 'N/A';
};

const getRecommendationIcon = (recommendation: string) => {
  const rec = recommendation?.toUpperCase() || '';
  if (rec.includes('BUY')) return <TrendingUp className="h-4 w-4" />;
  if (rec.includes('HOLD')) return <Minus className="h-4 w-4" />;
  if (rec.includes('SELL')) return <TrendingDown className="h-4 w-4" />;
  return null;
};

const getConfidenceColor = (confidence?: number) => {
  if (!confidence) return 'text-gray-500';
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('by-analysis');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fundamental' | 'technical' | 'complete'>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestingBulk, setRequestingBulk] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [processingTicker, setProcessingTicker] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: analyses, isLoading, error, refetch } = useAnalyses({
    type: filterType === 'all' ? undefined : filterType,
  });

  // Hooks para view "Por Ativo"
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useReportsAssets();
  const requestAnalysis = useRequestAnalysis();
  const requestBulkAnalysis = useRequestBulkAnalysis();

  // Identificar análises duplicadas
  const duplicateMap = useMemo(() => {
    if (!analyses) return new Map();
    const map = new Map<string, any[]>();

    analyses.forEach((analysis: any) => {
      const key = `${analysis.asset?.ticker}-${analysis.type}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(analysis);
    });

    return map;
  }, [analyses]);

  const filteredAnalyses = useMemo(() => {
    if (!analyses) return [];
    return analyses.filter((analysis: any) => {
      const matchesSearch =
        analysis.asset?.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [analyses, searchTerm]);

  // Filtrar ativos para view "Por Ativo"
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) =>
      asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  const hasDuplicates = (analysis: any) => {
    const key = `${analysis.asset?.ticker}-${analysis.type}`;
    return (duplicateMap.get(key)?.length || 0) > 1;
  };

  const handleViewDetails = (analysis: any) => {
    setSelectedAnalysis(analysis);
    setIsDetailsOpen(true);
  };

  const handleRefreshAnalysis = async (analysis: any) => {
    setRefreshingId(analysis.id);
    try {
      // Buscar token do cookie
      const token = Cookies.get('access_token');
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
        // Capturar o corpo da resposta como texto primeiro
        const errorText = await response.text();
        console.error(`[Atualizar] Erro ${response.status}:`, errorText);

        let errorMessage = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch {
          errorMessage = errorText || `Erro ${response.status}`;
        }

        toast({
          title: `Erro ${response.status}`,
          description: errorMessage,
          variant: 'destructive',
        });
        return;
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

  const handleDeleteAnalysis = async (analysis: any) => {
    if (!confirm(`Tem certeza que deseja remover a análise ${analysis.type} de ${analysis.asset.ticker}?`)) {
      return;
    }

    setDeletingId(analysis.id);
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        toast({
          title: 'Não autorizado',
          description: 'Você precisa estar autenticado. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/${analysis.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch {
          errorMessage = errorText || `Erro ${response.status}`;
        }

        toast({
          title: `Erro ${response.status}`,
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Análise removida!',
        description: `A análise de ${analysis.asset.ticker} foi removida com sucesso.`,
      });

      // Refetch analyses
      refetch();
    } catch (error: any) {
      console.error('[Remover] Erro ao remover análise:', error);
      toast({
        title: 'Erro ao remover análise',
        description: error.message || 'Ocorreu um erro ao remover a análise. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Handlers para view "Por Ativo"
  const handleRequestAssetAnalysis = (ticker: string) => {
    setProcessingTicker(ticker);
    requestAnalysis.mutate(ticker, {
      onSettled: () => {
        setProcessingTicker(null);
      },
    });
  };

  const handleRequestBulkAssetAnalysis = () => {
    requestBulkAnalysis.mutate();
    setShowBulkDialog(false);
  };

  const handleRequestBulkAnalysis = async () => {
    const type = filterType === 'all' ? 'complete' : filterType;
    const typeLabel = type === 'complete' ? 'completa' : type === 'fundamental' ? 'fundamentalista' : 'técnica';

    const confirmMessage = `🔍 Solicitar Análise ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} em Massa\n\n` +
      `Esta ação irá:\n` +
      `✓ Analisar TODOS os ativos cadastrados\n` +
      `✓ Coletar dados de TODAS as fontes (Fundamentus, BRAPI, StatusInvest, Investidor10)\n` +
      `✓ Realizar validação cruzada para máxima precisão\n\n` +
      `⏱️ Tempo estimado: 5-10 minutos\n\n` +
      `Deseja continuar?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setRequestingBulk(true);
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        toast({
          title: 'Não autorizado',
          description: 'Você precisa estar autenticado. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/bulk/request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ type }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch {
          errorMessage = errorText || `Erro ${response.status}`;
        }

        toast({
          title: `Erro ${response.status}`,
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();

      toast({
        title: 'Análises solicitadas!',
        description: `${result.requested} análises foram solicitadas. ${result.skipped} foram ignoradas (análise recente existe).`,
      });

      // Refetch analyses after a delay
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      console.error('[Bulk] Erro ao solicitar análises em massa:', error);
      toast({
        title: 'Erro ao solicitar análises',
        description: error.message || 'Ocorreu um erro ao solicitar as análises. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRequestingBulk(false);
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
        <div className="flex items-center gap-2">
          {activeTab === 'by-asset' ? (
            <Button
              onClick={() => setShowBulkDialog(true)}
              disabled={requestBulkAnalysis.isPending}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              {requestBulkAnalysis.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Analisar Todos os Ativos
                </>
              )}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRequestBulkAnalysis}
                    disabled={requestingBulk}
                    variant="outline"
                    className="gap-2"
                  >
                    <BarChart3 className={cn('h-4 w-4', requestingBulk && 'animate-pulse')} />
                    {requestingBulk ? 'Solicitando...' : 'Solicitar Análises em Massa'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Análise em Massa com Multi-Fonte</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Coleta dados de <strong>6 fontes</strong> (Fundamentus, BRAPI, StatusInvest,
                    Investidor10, Fundamentei, InvestSite) e realiza validação cruzada para
                    garantir máxima precisão nas análises.
                  </p>
                  <div className="text-xs space-y-1 mt-2 pt-2 border-t border-border">
                    <p>✓ Cross-validation automática</p>
                    <p>✓ Detecção de discrepâncias</p>
                    <p>✓ Score de confiança baseado em concordância</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <NewAnalysisDialog />
        </div>
      </div>

      {/* Bulk Analysis Confirmation Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analisar Todos os Ativos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá solicitar análises completas para todos os ativos que não possuem análise recente (&lt;7 dias). Isso pode levar alguns minutos para completar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestBulkAssetAnalysis}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="by-analysis">Por Análise</TabsTrigger>
          <TabsTrigger value="by-asset">Por Ativo</TabsTrigger>
        </TabsList>

        <TabsContent value="by-analysis" className="space-y-4 mt-6">
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
                    {hasDuplicates(analysis) && (
                      <div className="flex items-center space-x-1 rounded-full bg-warning/10 border border-warning/20 px-3 py-1">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium text-warning">Duplicada</span>
                      </div>
                    )}
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-sm text-muted-foreground">Confiança</p>
                              <p className={cn('text-2xl font-bold', getScoreColor(analysis.confidenceScore * 100))}>
                                {(analysis.confidenceScore * 100).toFixed(0)}%
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="font-semibold mb-2">Como é calculado?</p>
                            <div className="text-xs space-y-1">
                              <p>✓ <strong>Fontes:</strong> {analysis.sourcesCount || 0} fontes consultadas</p>
                              <p>✓ <strong>Cross-Validation:</strong> Dados comparados entre fontes</p>
                              <p>✓ <strong>Concordância:</strong> {(analysis.confidenceScore * 100).toFixed(0)}% de concordância</p>
                              <p className="mt-2 pt-2 border-t border-border text-muted-foreground">
                                <strong>Metodologia:</strong> 6 fontes = 100%, penalidade apenas para
                                discrepâncias significativas (&gt;20%), mínimo 40% se ≥3 fontes.
                              </p>
                              {analysis.dataSources && analysis.dataSources.length > 0 && (
                                <p className="mt-2 pt-2 border-t border-border">
                                  <strong>Fontes usadas:</strong> {analysis.dataSources.join(', ')}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAnalysis(analysis)}
                    disabled={deletingId === analysis.id}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className={cn("mr-2 h-4 w-4", deletingId === analysis.id && "animate-pulse")} />
                    {deletingId === analysis.id ? 'Removendo...' : 'Remover'}
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
                      {/* Fundamental Data - Suporte para estrutura antiga e nova */}
                      {(() => {
                        // Suporte para estrutura nova (FASE 28+): analysis.fundamental.data
                        // Suporte para estrutura antiga (pré-FASE 28): analysis.cotacao, analysis.pl, etc.
                        const fundamentalData = selectedAnalysis.analysis.fundamental?.data || selectedAnalysis.analysis;

                        return (
                          <>
                            {/* Valuation */}
                            {(fundamentalData.cotacao || fundamentalData.pl || fundamentalData.pvp) && (
                              <div className="col-span-2 md:col-span-3">
                                <h5 className="text-xs font-semibold text-muted-foreground mb-2">Valuation</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fundamentalData.cotacao && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Cotação</p>
                                      <p className="font-medium">R$ {Number(fundamentalData.cotacao).toFixed(2)}</p>
                                    </div>
                                  )}
                                  {fundamentalData.pl && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">P/L</p>
                                      <p className="font-medium">{Number(fundamentalData.pl).toFixed(2)}</p>
                                    </div>
                                  )}
                                  {fundamentalData.pvp && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">P/VP</p>
                                      <p className="font-medium">{Number(fundamentalData.pvp).toFixed(2)}</p>
                                    </div>
                                  )}
                                  {fundamentalData.psr && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">P/SR</p>
                                      <p className="font-medium">{Number(fundamentalData.psr).toFixed(2)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Dividendos e Rentabilidade */}
                            {(fundamentalData.dividendYield || fundamentalData.roe || fundamentalData.roic) && (
                              <div className="col-span-2 md:col-span-3">
                                <h5 className="text-xs font-semibold text-muted-foreground mb-2">Rentabilidade</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fundamentalData.dividendYield && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Dividend Yield</p>
                                      <p className="font-medium">{Number(fundamentalData.dividendYield).toFixed(2)}%</p>
                                    </div>
                                  )}
                                  {fundamentalData.roe && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">ROE</p>
                                      <p className="font-medium">{Number(fundamentalData.roe).toFixed(2)}%</p>
                                    </div>
                                  )}
                                  {fundamentalData.roic && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">ROIC</p>
                                      <p className="font-medium">{Number(fundamentalData.roic).toFixed(2)}%</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Margens */}
                            {(fundamentalData.margemEbit || fundamentalData.margemLiquida) && (
                              <div className="col-span-2 md:col-span-3">
                                <h5 className="text-xs font-semibold text-muted-foreground mb-2">Margens</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fundamentalData.margemEbit && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Margem EBIT</p>
                                      <p className="font-medium">{Number(fundamentalData.margemEbit).toFixed(2)}%</p>
                                    </div>
                                  )}
                                  {fundamentalData.margemLiquida && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Margem Líquida</p>
                                      <p className="font-medium">{Number(fundamentalData.margemLiquida).toFixed(2)}%</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Indicadores de Valor */}
                            {(fundamentalData.evEbit || fundamentalData.pEbit) && (
                              <div className="col-span-2 md:col-span-3">
                                <h5 className="text-xs font-semibold text-muted-foreground mb-2">Múltiplos</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fundamentalData.evEbit && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">EV/EBIT</p>
                                      <p className="font-medium">{Number(fundamentalData.evEbit).toFixed(2)}</p>
                                    </div>
                                  )}
                                  {fundamentalData.evEbitda && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">EV/EBITDA</p>
                                      <p className="font-medium">{Number(fundamentalData.evEbitda).toFixed(2)}</p>
                                    </div>
                                  )}
                                  {fundamentalData.pEbit && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">P/EBIT</p>
                                      <p className="font-medium">{Number(fundamentalData.pEbit).toFixed(2)}</p>
                                    </div>
                                  )}
                                  {fundamentalData.pAtivo && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">P/Ativo</p>
                                      <p className="font-medium">{Number(fundamentalData.pAtivo).toFixed(2)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Dados Financeiros */}
                            {(fundamentalData.patrimonioLiquido || fundamentalData.dividaBruta || fundamentalData.disponibilidades) && (
                              <div className="col-span-2 md:col-span-3">
                                <h5 className="text-xs font-semibold text-muted-foreground mb-2">Dados Financeiros</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fundamentalData.patrimonioLiquido && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Patrimônio Líquido</p>
                                      <p className="font-medium">R$ {(Number(fundamentalData.patrimonioLiquido) / 1000000).toFixed(0)}M</p>
                                    </div>
                                  )}
                                  {fundamentalData.dividaBruta && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Dívida Bruta</p>
                                      <p className="font-medium">R$ {(Number(fundamentalData.dividaBruta) / 1000000).toFixed(0)}M</p>
                                    </div>
                                  )}
                                  {fundamentalData.disponibilidades && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Disponibilidades</p>
                                      <p className="font-medium">R$ {(Number(fundamentalData.disponibilidades) / 1000000).toFixed(0)}M</p>
                                    </div>
                                  )}
                                  {fundamentalData.lucroLiquido && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                                      <p className="font-medium">R$ {(Number(fundamentalData.lucroLiquido) / 1000000).toFixed(0)}M</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
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
        </TabsContent>

        {/* TAB: Por Ativo */}
        <TabsContent value="by-asset" className="space-y-4 mt-6">
          {/* Search Bar */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ticker ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Assets List */}
          {assetsLoading ? (
            <div className="grid gap-4">
              {Array(5).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <div className="grid grid-cols-4 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : assetsError ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Erro ao Carregar Ativos</h3>
                <p className="text-muted-foreground max-w-md">
                  {(assetsError as any)?.message || 'Erro desconhecido'}
                </p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
              </div>
            </Card>
          ) : filteredAssets.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Search className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Nenhum Resultado</h3>
                <p className="text-muted-foreground max-w-md">
                  Nenhum ativo encontrado com o termo &ldquo;{searchTerm}&rdquo;
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAssets.map((asset) => (
                <Card key={asset.id} className="p-6 hover:shadow-md transition-shadow">
                  {/* Asset Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{asset.ticker}</h3>
                        <Badge variant="outline" className="text-xs">
                          {asset.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{asset.sector}</p>
                    </div>

                    {/* Price Info */}
                    {asset.currentPrice && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {formatCurrency(asset.currentPrice)}
                        </p>
                        {asset.changePercent !== undefined && asset.changePercent !== null && (
                          <p
                            className={cn(
                              'text-sm font-medium',
                              asset.changePercent > 0
                                ? 'text-green-600'
                                : asset.changePercent < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            )}
                          >
                            {asset.changePercent > 0 ? '+' : ''}
                            {Number(asset.changePercent).toFixed(2)}%
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Analysis Status */}
                  {asset.hasAnalysis ? (
                    <div className="space-y-4">
                      {/* Analysis Summary */}
                      <div className="grid grid-cols-4 gap-4">
                        {/* Recommendation */}
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Recomendação
                          </span>
                          <Badge
                            className={cn(
                              'inline-flex items-center gap-1',
                              getRecommendationColor(
                                asset.lastAnalysisRecommendation || ''
                              )
                            )}
                          >
                            {getRecommendationIcon(asset.lastAnalysisRecommendation || '')}
                            {getRecommendationLabel(asset.lastAnalysisRecommendation || '')}
                          </Badge>
                        </div>

                        {/* Confidence */}
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Confiança
                          </span>
                          <span
                            className={cn(
                              'text-sm font-bold',
                              getConfidenceColor(asset.lastAnalysisConfidence)
                            )}
                          >
                            {asset.lastAnalysisConfidence
                              ? `${(asset.lastAnalysisConfidence * 100).toFixed(0)}%`
                              : 'N/A'}
                          </span>
                        </div>

                        {/* Last Analysis Date */}
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Última Análise
                          </span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {asset.lastAnalysisDate
                                ? formatDistanceToNow(new Date(asset.lastAnalysisDate), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Status</span>
                          {asset.isAnalysisRecent ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Recente
                            </Badge>
                          ) : asset.isAnalysisOutdated ? (
                            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Desatualizada
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Normal
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Summary Text */}
                      {asset.lastAnalysisSummary && (
                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                          {asset.lastAnalysisSummary}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* View Report */}
                        <Link href={`/reports/${asset.lastAnalysisId}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar Relatório
                          </Button>
                        </Link>

                        {/* Request New Analysis (if can) */}
                        {asset.canRequestAnalysis && (
                          <Button
                            variant="secondary"
                            onClick={() => handleRequestAssetAnalysis(asset.ticker)}
                            disabled={processingTicker === asset.ticker}
                          >
                            {processingTicker === asset.ticker ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Nova Análise
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* No Analysis Yet */
                    <div className="flex items-center justify-between bg-muted/30 p-4 rounded-md">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Nenhuma análise disponível para este ativo
                        </span>
                      </div>
                      <Button
                        variant="default"
                        onClick={() => handleRequestAssetAnalysis(asset.ticker)}
                        disabled={processingTicker === asset.ticker}
                      >
                        {processingTicker === asset.ticker ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Solicitar Análise
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
