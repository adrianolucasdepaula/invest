'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import {
  FileText,
  Eye,
  Clock,
  Search,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  useReportsAssets,
  useRequestAnalysis,
  useRequestBulkAnalysis,
} from '@/lib/hooks/use-reports-assets';
import { MultiSourceTooltip } from '@/components/reports/MultiSourceTooltip';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ========================================
// HELPERS
// ========================================

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

// ========================================
// MAIN COMPONENT
// ========================================

export function ReportsPageClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [processingTicker, setProcessingTicker] = useState<string | null>(null);

  // Hooks
  const { data: assets, isLoading, error } = useReportsAssets();
  const requestAnalysis = useRequestAnalysis();
  const requestBulkAnalysis = useRequestBulkAnalysis();

  // Filtrar ativos
  const filteredAssets = (assets || []).filter(
    (asset) =>
      asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handlers
  const handleRequestAnalysis = (ticker: string) => {
    setProcessingTicker(ticker);
    requestAnalysis.mutate(ticker, {
      onSettled: () => {
        setProcessingTicker(null);
      },
    });
  };

  const handleRequestBulkAnalysis = () => {
    requestBulkAnalysis.mutate();
    setShowBulkDialog(false);
  };

  // ========================================
  // LOADING STATE
  // ========================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
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
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios de Análise</h1>
            <p className="text-muted-foreground">
              Análises completas de todos os ativos
            </p>
          </div>
        </div>

        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-xl font-semibold">Erro ao Carregar Ativos</h3>
            <p className="text-muted-foreground max-w-md">
              {(error as any)?.message || 'Erro desconhecido'}
            </p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ========================================
  // EMPTY STATE
  // ========================================
  if (!assets || assets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios de Análise</h1>
            <p className="text-muted-foreground">
              Análises completas de todos os ativos
            </p>
          </div>
        </div>

        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Nenhum Ativo Encontrado</h3>
            <p className="text-muted-foreground max-w-md">
              Não há ativos disponíveis. Sincronize os ativos na página de Ativos.
            </p>
            <Link href="/assets">
              <Button>Ir para Ativos</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios de Análise</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Análises completas multi-fonte com cross-validation
            </p>
            <MultiSourceTooltip />
          </div>
        </div>

        {/* Bulk Analysis Button */}
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
      </div>

      {/* Bulk Analysis Confirmation Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analisar Todos os Ativos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá solicitar análises completas para todos os ativos que não
              possuem análise recente ({'<'}7 dias). Isso pode levar alguns minutos para
              completar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestBulkAnalysis}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ticker ou nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
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
                              : 'text-gray-600',
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
                            asset.lastAnalysisRecommendation || '',
                          ),
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
                          getConfidenceColor(asset.lastAnalysisConfidence),
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
                          <AlertCircle className="h-3 w-3 mr-1" />
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
                        onClick={() => handleRequestAnalysis(asset.ticker)}
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
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Nenhuma análise disponível para este ativo
                    </span>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => handleRequestAnalysis(asset.ticker)}
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
    </div>
  );
}
