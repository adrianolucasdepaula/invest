'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Play,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataSources } from '@/lib/hooks/useDataSources';
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

export default function DataSourcesPage() {
  const [filter, setFilter] = useState<'all' | 'fundamental' | 'technical' | 'options' | 'prices'>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const { data: dataSources, isLoading, error, refetch } = useDataSources();
  const { toast } = useToast();

  if (error) {
    toast({
      title: 'Erro ao carregar fontes de dados',
      description: 'Não foi possível carregar o status das fontes de dados.',
      variant: 'destructive',
    });
  }

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
        title: 'Teste concluído com sucesso',
        description: `${data.message}. Fontes: ${data.sourcesCount}, Confiança: ${(data.confidence * 100).toFixed(1)}%`,
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

  const handleSync = async (scraperId: string) => {
    setSyncingId(scraperId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scrapers/sync/${scraperId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao sincronizar scraper');
      }

      toast({
        title: 'Sincronização concluída',
        description: `${data.message}. Processados: ${data.tickersProcessed}, Sucesso: ${data.successful}, Falhas: ${data.failed}`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao sincronizar scraper',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSettings = (scraperId: string) => {
    toast({
      title: 'Configurações',
      description: `Configurações para ${scraperId} em desenvolvimento`,
    });
  };

  if (isLoading) {
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
                    <p className="text-sm text-muted-foreground">Última Sincronização</p>
                    <p className="text-sm font-medium">
                      {new Date(source.lastSync).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(source.id)}
                  disabled={testingId === source.id || syncingId === source.id}
                >
                  {testingId === source.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Testar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(source.id)}
                  disabled={testingId === source.id || syncingId === source.id}
                >
                  {syncingId === source.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSettings(source.id)}
                  disabled={testingId === source.id || syncingId === source.id}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
