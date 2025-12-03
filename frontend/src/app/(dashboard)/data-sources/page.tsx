'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Play,
  TrendingUp,
  Loader2,
  BarChart3,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataSources, useScrapersQualityStats, useScrapersDiscrepancies } from '@/lib/hooks/useDataSources';
import type { Discrepancy } from '@/lib/hooks/useDataSources';
import { useToast } from '@/components/ui/use-toast';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'error':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5" />;
    case 'error':
      return <XCircle className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'fundamental':
      return 'Fundamentalista';
    case 'technical':
      return 'Técnica';
    case 'options':
      return 'Opções';
    case 'prices':
      return 'Preços';
    case 'news':
      return 'Notícias';
    default:
      return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'fundamental':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'technical':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'options':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'prices':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'news':
      return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
    default:
      return 'bg-muted/10 text-muted-foreground border-muted/20';
  }
};

const getConsensusColor = (consensus: number) => {
  if (consensus >= 80) return 'text-success';
  if (consensus >= 50) return 'text-warning';
  return 'text-destructive';
};

const getConsensusBadgeVariant = (consensus: number): 'default' | 'secondary' | 'destructive' => {
  if (consensus >= 80) return 'default';
  if (consensus >= 50) return 'secondary';
  return 'destructive';
};

// FASE 5: Severity helpers
const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high':
      return 'text-destructive';
    case 'medium':
      return 'text-warning';
    case 'low':
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
};

const getSeverityBadgeVariant = (severity: 'high' | 'medium' | 'low'): 'destructive' | 'secondary' | 'default' => {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
};

const getSeverityLabel = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Médio';
    case 'low':
      return 'Baixo';
    default:
      return severity;
  }
};

const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    fundamentus: 'Fundamentus',
    brapi: 'BRAPI',
    statusinvest: 'Status Invest',
    investidor10: 'Investidor10',
    fundamentei: 'Fundamentei',
    investsite: 'Investsite',
  };
  return labels[source] || source;
};

export default function DataSourcesPage() {
  const [filter, setFilter] = useState<'all' | 'fundamental' | 'technical' | 'options' | 'prices'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const { data: dataSources, isLoading: isLoadingStatus, error: errorStatus, refetch } = useDataSources();
  const { data: qualityStats, isLoading: isLoadingQuality, error: errorQuality } = useScrapersQualityStats();
  const { data: discrepanciesData, isLoading: isLoadingDiscrepancies, error: errorDiscrepancies } = useScrapersDiscrepancies({ limit: 100, severity: severityFilter });
  const { toast } = useToast();

  // FIX: Move toast() to useEffect to prevent infinite loop
  useEffect(() => {
    if (errorStatus) {
      toast({
        title: 'Erro ao carregar fontes de dados',
        description: 'Não foi possível carregar o status das fontes de dados.',
        variant: 'destructive',
      });
    }
  }, [errorStatus, toast]);

  useEffect(() => {
    if (errorQuality) {
      toast({
        title: 'Erro ao carregar estatísticas de qualidade',
        description: 'Não foi possível carregar as estatísticas de qualidade.',
        variant: 'destructive',
      });
    }
  }, [errorQuality, toast]);

  useEffect(() => {
    if (errorDiscrepancies) {
      toast({
        title: 'Erro ao carregar discrepâncias',
        description: 'Não foi possível carregar as discrepâncias de dados.',
        variant: 'destructive',
      });
    }
  }, [errorDiscrepancies, toast]);

  const sources = (dataSources ?? []) as any[];

  const filteredSources = sources.filter(
    (source: any) => filter === 'all' || source.type === filter,
  );

  const stats = {
    total: sources.length,
    active: sources.filter((s) => s.status === 'active').length,
    avgSuccessRate: sources.length > 0
      ? (sources.reduce((acc, s) => acc + s.successRate, 0) / sources.length).toFixed(1)
      : '0.0',
  };

  const handleTest = async (scraperId: string) => {
    setTestingId(scraperId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scrapers/test/${scraperId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao testar scraper');
      }

      toast({
        title: data.success ? 'Teste concluído com sucesso' : 'Teste concluído com falha',
        description: `${data.message}`,
        variant: data.success ? 'default' : 'destructive',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao testar scraper',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSettings = (scraperId: string) => {
    toast({
      title: 'Configurações',
      description: `Configurações para ${scraperId} em desenvolvimento`,
    });
  };

  if (isLoadingStatus && isLoadingQuality) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Carregando fontes de dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fontes de Dados</h1>
        <p className="text-muted-foreground">
          Gerencie e monitore as fontes de dados do sistema
        </p>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Qualidade
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            {discrepanciesData?.summary?.high ? (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                {discrepanciesData.summary.high}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* TAB: STATUS */}
        <TabsContent value="status" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Fontes</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fontes Ativas</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso Média</p>
                  <p className="text-2xl font-bold">{stats.avgSuccessRate}%</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'fundamental' ? 'default' : 'outline'}
              onClick={() => setFilter('fundamental')}
            >
              Fundamentalista
            </Button>
            <Button
              variant={filter === 'options' ? 'default' : 'outline'}
              onClick={() => setFilter('options')}
            >
              Opções
            </Button>
            <Button
              variant={filter === 'prices' ? 'default' : 'outline'}
              onClick={() => setFilter('prices')}
            >
              Preços
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredSources.map((source) => (
              <Card key={source.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className={cn('flex items-center space-x-2', getStatusColor(source.status))}>
                        {getStatusIcon(source.status)}
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{source.name}</h3>
                          <p className="text-sm text-muted-foreground">{source.url}</p>
                        </div>
                      </div>
                      <div className={cn('rounded-full border px-3 py-1', getTypeColor(source.type))}>
                        <span className="text-sm font-medium">{getTypeLabel(source.type)}</span>
                      </div>
                      {source.requiresAuth && (
                        <div className="rounded-full bg-muted px-3 py-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            Requer Autenticação
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                        <p
                          className={cn(
                            'text-xl font-bold',
                            source.successRate >= 95
                              ? 'text-success'
                              : source.successRate >= 90
                              ? 'text-warning'
                              : 'text-destructive',
                          )}
                        >
                          {source.successRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Requisições</p>
                        <p className="text-xl font-bold">
                          {new Intl.NumberFormat('pt-BR').format(source.totalRequests)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Falhas</p>
                        <p className="text-xl font-bold text-destructive">
                          {new Intl.NumberFormat('pt-BR').format(source.failedRequests)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Médio</p>
                        <p className="text-xl font-bold">{source.avgResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Último Teste</p>
                        <p className="text-sm font-medium">
                          {source.lastTest ? new Date(source.lastTest).toLocaleString('pt-BR') : 'Nunca testado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTest(source.id)}
                            disabled={testingId === source.id}
                          >
                            {testingId === source.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="mr-2 h-4 w-4" />
                            )}
                            Testar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Testa a conexão com a fonte e coleta dados de PETR4 para validar o funcionamento do scraper</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettings(source.id)}
                      disabled={testingId === source.id}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: QUALIDADE */}
        <TabsContent value="quality" className="space-y-6 mt-6">
          {isLoadingQuality ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg text-muted-foreground">Carregando estatísticas de qualidade...</span>
            </div>
          ) : qualityStats ? (
            <>
              {/* Overall Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Consenso Médio</p>
                      <p className={cn('text-2xl font-bold', getConsensusColor(qualityStats.overall.avgConsensus))}>
                        {qualityStats.overall.avgConsensus}%
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-warning/10 p-3">
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Discrepâncias</p>
                      <p className="text-2xl font-bold">{qualityStats.overall.totalDiscrepancies}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-success/10 p-3">
                      <Database className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ativos Analisados</p>
                      <p className="text-2xl font-bold">{qualityStats.overall.totalAssetsAnalyzed}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-blue-500/10 p-3">
                      <Activity className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Campos Rastreados</p>
                      <p className="text-2xl font-bold">{qualityStats.overall.totalFieldsTracked}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Scraper Quality Cards */}
              <div className="grid gap-4">
                {qualityStats.scrapers.map((scraper) => (
                  <Card key={scraper.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-xl font-semibold">{scraper.name}</h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={getConsensusBadgeVariant(scraper.avgConsensus)}>
                                  {scraper.avgConsensus}% consenso
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Média de consenso entre fontes para dados coletados por este scraper</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {scraper.fieldsWithDiscrepancy > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {scraper.fieldsWithDiscrepancy} discrepâncias
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Número de campos com valores divergentes entre fontes</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Campos Rastreados</p>
                            <p className="text-xl font-bold">{scraper.totalFieldsTracked}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ativos Analisados</p>
                            <p className="text-xl font-bold">{scraper.assetsAnalyzed}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Discrepâncias</p>
                            <p className={cn('text-xl font-bold', scraper.fieldsWithDiscrepancy > 0 ? 'text-warning' : 'text-success')}>
                              {scraper.fieldsWithDiscrepancy}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Última Atualização</p>
                            <p className="text-sm font-medium">
                              {scraper.lastUpdate
                                ? new Date(scraper.lastUpdate).toLocaleString('pt-BR')
                                : 'Nunca'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Nenhuma estatística de qualidade disponível. Execute a coleta de dados fundamentalistas primeiro.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* TAB: ALERTAS */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          {isLoadingDiscrepancies ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg text-muted-foreground">Carregando alertas de discrepância...</span>
            </div>
          ) : discrepanciesData ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-muted/10 p-3">
                      <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Alertas</p>
                      <p className="text-2xl font-bold">{discrepanciesData.summary.total}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-destructive/10 p-3">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Severidade Alta</p>
                      <p className="text-2xl font-bold text-destructive">{discrepanciesData.summary.high}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-warning/10 p-3">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Severidade Média</p>
                      <p className="text-2xl font-bold text-warning">{discrepanciesData.summary.medium}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-blue-500/10 p-3">
                      <AlertCircle className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Severidade Baixa</p>
                      <p className="text-2xl font-bold text-blue-500">{discrepanciesData.summary.low}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={severityFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSeverityFilter('all')}
                  size="sm"
                >
                  Todos
                </Button>
                <Button
                  variant={severityFilter === 'high' ? 'destructive' : 'outline'}
                  onClick={() => setSeverityFilter('high')}
                  size="sm"
                >
                  Alta ({discrepanciesData.summary.high})
                </Button>
                <Button
                  variant={severityFilter === 'medium' ? 'secondary' : 'outline'}
                  onClick={() => setSeverityFilter('medium')}
                  size="sm"
                >
                  Média ({discrepanciesData.summary.medium})
                </Button>
                <Button
                  variant={severityFilter === 'low' ? 'default' : 'outline'}
                  onClick={() => setSeverityFilter('low')}
                  size="sm"
                >
                  Baixa ({discrepanciesData.summary.low})
                </Button>
              </div>

              {/* Discrepancy List */}
              <div className="grid gap-4">
                {discrepanciesData.discrepancies.length > 0 ? (
                  discrepanciesData.discrepancies.map((discrepancy: Discrepancy, index: number) => (
                    <Card key={`${discrepancy.ticker}-${discrepancy.field}-${index}`} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-4">
                            <Badge variant={getSeverityBadgeVariant(discrepancy.severity)} className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {getSeverityLabel(discrepancy.severity)}
                            </Badge>
                            <span className="text-xl font-bold">{discrepancy.ticker}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium">{discrepancy.fieldLabel}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline">{discrepancy.consensusPercentage}% consenso</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Porcentagem de fontes que concordam com o valor de consenso</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Valor de Consenso</p>
                              <p className="text-lg font-bold text-success">
                                {typeof discrepancy.consensusValue === 'number'
                                  ? discrepancy.consensusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : discrepancy.consensusValue}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Fontes Divergentes</p>
                              <div className="space-y-1">
                                {discrepancy.divergentSources.map((source) => (
                                  <div key={source.source} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{getSourceLabel(source.source)}:</span>
                                    <span className={cn('font-medium', getSeverityColor(discrepancy.severity))}>
                                      {source.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      <span className="text-xs ml-1">({source.deviation.toFixed(1)}% desvio)</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Última atualização: {new Date(discrepancy.lastUpdate).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6">
                    <p className="text-center text-muted-foreground">
                      {severityFilter === 'all'
                        ? 'Nenhuma discrepância encontrada. Os dados estão consistentes entre as fontes.'
                        : `Nenhuma discrepância de severidade "${getSeverityLabel(severityFilter)}" encontrada.`}
                    </p>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Nenhum alerta disponível. Execute a coleta de dados fundamentalistas primeiro.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
