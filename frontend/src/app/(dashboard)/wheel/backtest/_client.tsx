'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useHydrated } from '@/hooks/useHydrated';
import {
  useBacktests,
  useBacktest,
  useCreateBacktest,
  useDeleteBacktest,
  formatCurrency,
  formatPercent,
  getValueColor,
  getStatusColor,
  getStatusLabel,
  type BacktestConfig,
  type BacktestResult,
  type BacktestSummary,
} from '@/lib/hooks/use-backtest';
import { useAssets } from '@/lib/hooks/use-assets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  RefreshCw,
  Plus,
  BarChart3,
  Loader2,
  Play,
  Trash2,
  ChevronRight,
  Activity,
  Target,
  AlertTriangle,
  PieChart,
  LineChart,
} from 'lucide-react';

// Simple equity chart using div bars (placeholder until full Recharts implementation)
function SimpleEquityChart({ data }: { data: { date: string; equity: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Sem dados de equity curve
      </div>
    );
  }

  const maxEquity = Math.max(...data.map((d) => d.equity));
  const minEquity = Math.min(...data.map((d) => d.equity));
  const range = maxEquity - minEquity;

  // Sample data to show at most 60 points
  const sampledData = data.length > 60
    ? data.filter((_, i) => i % Math.ceil(data.length / 60) === 0)
    : data;

  return (
    <div className="h-[200px] flex items-end gap-[1px]">
      {sampledData.map((point, i) => {
        const height = range > 0 ? ((point.equity - minEquity) / range) * 100 : 50;
        return (
          <div
            key={i}
            className="flex-1 bg-primary/60 hover:bg-primary transition-colors rounded-t"
            style={{ height: `${Math.max(height, 5)}%` }}
            title={`${point.date}: ${formatCurrency(point.equity)}`}
          />
        );
      })}
    </div>
  );
}

// Income breakdown pie chart placeholder
function IncomeBreakdownChart({ data }: { data: { premiumPercent: number; dividendPercent: number; lendingPercent: number; selicPercent: number } }) {
  const segments = [
    { label: 'Prêmios', percent: data.premiumPercent, color: 'bg-blue-500' },
    { label: 'Dividendos', percent: data.dividendPercent, color: 'bg-green-500' },
    { label: 'Aluguel', percent: data.lendingPercent, color: 'bg-yellow-500' },
    { label: 'Selic', percent: data.selicPercent, color: 'bg-purple-500' },
  ].filter((s) => s.percent > 0);

  return (
    <div className="space-y-3">
      {segments.map((seg) => (
        <div key={seg.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{seg.label}</span>
            <span className="font-medium">{seg.percent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${seg.color} rounded-full transition-all`}
              style={{ width: `${seg.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BacktestPageClient() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { toast } = useToast();

  // TEST: Confirm client-side JavaScript is executing
  useEffect(() => {
    if (typeof window !== 'undefined') {
    }
  }, []);
  const [activeTab, setActiveTab] = useState('history');
  const [selectedBacktestId, setSelectedBacktestId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    assetId: string;
    ticker: string;
    name: string;
    initialCapital: string;
    targetDelta: string;
    minROE: string;
    minDividendYield: string;
    maxDebtEbitda: string;
    minMargemLiquida: string;
    expirationDays: string;
    weeklyDistribution: boolean;
    maxWeeklyAllocation: string;
    reinvestDividends: boolean;
    includeLendingIncome: boolean;
    // Filter toggles
    filterROE: boolean;
    filterDY: boolean;
    filterDebt: boolean;
    filterMargin: boolean;
    filterHasOptions: boolean;
    filterIDIV: boolean;
  }>({
    assetId: '',
    ticker: '',
    name: '',
    initialCapital: '1000000',
    targetDelta: '0.15',
    minROE: '15',
    minDividendYield: '6',
    maxDebtEbitda: '2.0',
    minMargemLiquida: '10',
    expirationDays: '30',
    weeklyDistribution: true,
    maxWeeklyAllocation: '0.25',
    reinvestDividends: true,
    includeLendingIncome: true,
    // Filter toggles - all optional by default
    filterROE: false,
    filterDY: false,
    filterDebt: false,
    filterMargin: false,
    filterHasOptions: false,
    filterIDIV: false,
  });

  // Queries
  const { data: backtests, isLoading: loadingBacktests, refetch: refetchBacktests } = useBacktests();
  const { data: selectedBacktest, isLoading: loadingSelected } = useBacktest(selectedBacktestId || '');
  const { data: assetsData, isLoading: loadingAssets, error: assetsError } = useAssets({ limit: 1000 });

  // IMMEDIATE DEBUG - Runs on EVERY render
  if (typeof window !== 'undefined') {
  }

  // DEBUG: useEffect to track client-side data changes
  useEffect(() => {
    // ALERT DEBUG - This CANNOT be optimized away by bundlers
    if (typeof window !== 'undefined') {
      const msg = `ALERT DEBUG:\nassetsData: ${Array.isArray(assetsData) ? assetsData.length + ' items' : 'NOT ARRAY'}\nloading: ${loadingAssets}\nerror: ${assetsError ? 'YES' : 'NO'}`;
      window.alert(msg);
    }
  }, [assetsData, loadingAssets, assetsError]);

  // Mutations
  const createMutation = useCreateBacktest();
  const deleteMutation = useDeleteBacktest();

  // Define asset type for filtering
  interface AssetForBacktest {
    id: string;
    ticker: string;
    name: string;
    hasOptions?: boolean;
    currentIndexes?: string[];
    dividendYield?: number | null;
    // Add fundamental data fields if available
    roe?: number | null;
    debtEbitda?: number | null;
    margemLiquida?: number | null;
  }

  // Get all assets and apply optional filters
  const allAssets: AssetForBacktest[] = useMemo(() => {
    // API returns array directly, not {data: [...]}
    if (!assetsData || !Array.isArray(assetsData)) return [];
    return assetsData.map((asset: any) => ({
      id: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      hasOptions: asset.hasOptions,
      currentIndexes: asset.currentIndexes || [],
      dividendYield: asset.dividendYield,
      roe: asset.roe,
      debtEbitda: asset.debtEbitda,
      margemLiquida: asset.margemLiquida,
    }));
  }, [assetsData]);

  // Filter assets based on enabled filters
  const filteredAssets: AssetForBacktest[] = useMemo(() => {
    return allAssets.filter((asset) => {
      // Filter: Has Options
      if (formData.filterHasOptions && !asset.hasOptions) {
        return false;
      }

      // Filter: Is in IDIV
      if (formData.filterIDIV) {
        const isIDIV = asset.currentIndexes?.includes('IDIV');
        if (!isIDIV) return false;
      }

      // Filter: ROE Minimum (only if we have the data)
      if (formData.filterROE && asset.roe !== null && asset.roe !== undefined) {
        const minROE = parseFloat(formData.minROE) || 0;
        if (asset.roe < minROE) return false;
      }

      // Filter: DY Minimum (only if we have the data)
      if (formData.filterDY && asset.dividendYield !== null && asset.dividendYield !== undefined) {
        const minDY = parseFloat(formData.minDividendYield) || 0;
        if (asset.dividendYield < minDY) return false;
      }

      // Filter: Debt/EBITDA Maximum (only if we have the data)
      if (formData.filterDebt && asset.debtEbitda !== null && asset.debtEbitda !== undefined) {
        const maxDebt = parseFloat(formData.maxDebtEbitda) || 0;
        if (asset.debtEbitda > maxDebt) return false;
      }

      // Filter: Margem Liquida Minimum (only if we have the data)
      if (formData.filterMargin && asset.margemLiquida !== null && asset.margemLiquida !== undefined) {
        const minMargin = parseFloat(formData.minMargemLiquida) || 0;
        if (asset.margemLiquida < minMargin) return false;
      }

      return true;
    });
  }, [allAssets, formData]);
  const backtestList: BacktestSummary[] = backtests || [];

  // Calculate summary stats
  const completedBacktests = backtestList.filter((b) => b.status === 'completed');
  const runningBacktests = backtestList.filter((b) => b.status === 'running');
  const avgCAGR = completedBacktests.length > 0
    ? completedBacktests.reduce((sum, b) => sum + b.cagr, 0) / completedBacktests.length
    : 0;
  const avgSharpe = completedBacktests.length > 0
    ? completedBacktests.reduce((sum, b) => sum + b.sharpeRatio, 0) / completedBacktests.length
    : 0;

  // Handle create mutation success
  const { isSuccess: createSuccess, data: createdData, reset: resetCreate } = createMutation;
  useEffect(() => {
    if (createSuccess && createdData) {
      setIsCreateDialogOpen(false);
      setSelectedBacktestId(createdData.id);
      setActiveTab('results');
      resetCreate();
    }
  }, [createSuccess, createdData, resetCreate]);

  // Handle delete mutation success
  const { isSuccess: deleteSuccess, reset: resetDelete } = deleteMutation;
  useEffect(() => {
    if (deleteSuccess) {
      setDeleteId(null);
      if (selectedBacktestId === deleteId) {
        setSelectedBacktestId(null);
      }
      resetDelete();
    }
  }, [deleteSuccess, deleteId, selectedBacktestId, resetDelete]);

  const handleCreateBacktest = () => {
    if (!formData.assetId) {
      toast({
        title: 'Ativo não selecionado',
        description: 'Selecione um ativo para executar o backtest',
        variant: 'destructive',
      });
      return;
    }

    const initialCapital = parseFloat(formData.initialCapital);
    if (isNaN(initialCapital) || initialCapital < 10000) {
      toast({
        title: 'Capital inválido',
        description: 'O capital inicial deve ser no mínimo R$ 10.000',
        variant: 'destructive',
      });
      return;
    }

    // Calculate dates (60 months back)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 60);

    const config: BacktestConfig = {
      initialCapital,
      targetDelta: parseFloat(formData.targetDelta) || 0.15,
      minROE: parseFloat(formData.minROE) || 15,
      minDividendYield: parseFloat(formData.minDividendYield) || 6,
      maxDebtEbitda: parseFloat(formData.maxDebtEbitda) || 2.0,
      minMargemLiquida: parseFloat(formData.minMargemLiquida) || 10,
      expirationDays: parseInt(formData.expirationDays) || 30,
      weeklyDistribution: formData.weeklyDistribution,
      maxWeeklyAllocation: parseFloat(formData.maxWeeklyAllocation) || 0.25,
      reinvestDividends: formData.reinvestDividends,
      includeLendingIncome: formData.includeLendingIncome,
    };

    createMutation.mutate({
      assetId: formData.assetId,
      name: formData.name || `Backtest ${formData.ticker}`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      config,
    });
  };

  const handleDeleteBacktest = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const openCreateDialog = (asset?: AssetForBacktest) => {
    if (asset) {
      setFormData((prev) => ({
        ...prev,
        assetId: asset.id,
        ticker: asset.ticker,
        name: `Backtest ${asset.ticker} 60m`,
      }));
    }
    setIsCreateDialogOpen(true);
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backtest WHEEL [v3-TEST]</h1>
          <p className="text-muted-foreground">
            Simulação histórica da estratégia WHEEL Turbinada - 60 meses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchBacktests()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => openCreateDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Backtest
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backtests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backtestList.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedBacktests.length} completos, {runningBacktests.length} em execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAGR Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getValueColor(avgCAGR)}`}>
              {formatPercent(avgCAGR)}
            </div>
            <p className="text-xs text-muted-foreground">
              dos backtests completos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSharpe.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              risco-ajustado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Execução</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningBacktests.length}</div>
            <p className="text-xs text-muted-foreground">
              backtests processando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="results" disabled={!selectedBacktestId}>
            Resultados
          </TabsTrigger>
          <TabsTrigger value="candidates">Candidatos</TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Backtests</CardTitle>
              <CardDescription>
                Lista de todos os backtests executados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBacktests ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : backtestList.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum backtest executado ainda
                  </p>
                  <Button onClick={() => openCreateDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Backtest
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Retorno</TableHead>
                      <TableHead className="text-right">CAGR</TableHead>
                      <TableHead className="text-right">Sharpe</TableHead>
                      <TableHead className="text-right">Max DD</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backtestList.map((backtest) => (
                      <TableRow key={backtest.id}>
                        <TableCell className="font-medium">
                          {backtest.name}
                        </TableCell>
                        <TableCell>{backtest.ticker}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {backtest.period}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(backtest.status)}>
                            {getStatusLabel(backtest.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getValueColor(backtest.totalReturnPercent)}`}>
                          {backtest.status === 'completed' ? formatPercent(backtest.totalReturnPercent) : '-'}
                        </TableCell>
                        <TableCell className={`text-right ${getValueColor(backtest.cagr)}`}>
                          {backtest.status === 'completed' ? formatPercent(backtest.cagr) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {backtest.status === 'completed' ? backtest.sharpeRatio.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {backtest.status === 'completed' ? `-${backtest.maxDrawdown.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBacktestId(backtest.id);
                                setActiveTab('results');
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(backtest.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {loadingSelected ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
              <div className="grid gap-4 md:grid-cols-4">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[100px]" />
                ))}
              </div>
            </div>
          ) : selectedBacktest ? (
            <>
              {/* Progress Bar for Running Backtest */}
              {selectedBacktest.status === 'running' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Backtest em Execução
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={selectedBacktest.progress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Progresso: {selectedBacktest.progress.toFixed(0)}%
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Results Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedBacktest.name}</CardTitle>
                      <CardDescription>
                        {selectedBacktest.ticker} | {selectedBacktest.startDate} até {selectedBacktest.endDate}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(selectedBacktest.status)}>
                      {getStatusLabel(selectedBacktest.status)}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {selectedBacktest.status === 'completed' && (
                <>
                  {/* Metrics Cards */}
                  <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Capital Inicial</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {formatCurrency(selectedBacktest.initialCapital)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Capital Final</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-xl font-bold ${getValueColor(selectedBacktest.totalReturn)}`}>
                          {formatCurrency(selectedBacktest.finalCapital)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Retorno Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-xl font-bold ${getValueColor(selectedBacktest.totalReturnPercent)}`}>
                          {formatPercent(selectedBacktest.totalReturnPercent)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">CAGR</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-xl font-bold ${getValueColor(selectedBacktest.riskMetrics.cagr)}`}>
                          {formatPercent(selectedBacktest.riskMetrics.cagr)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sharpe Ratio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {selectedBacktest.riskMetrics.sharpeRatio.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sortino Ratio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {selectedBacktest.riskMetrics.sortinoRatio.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Risk Metrics */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Max Drawdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-red-600">
                          -{selectedBacktest.riskMetrics.maxDrawdown.toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedBacktest.riskMetrics.maxDrawdownDays} dias para recuperar
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Win Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {selectedBacktest.riskMetrics.winRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedBacktest.tradeStats.winningTrades} de {selectedBacktest.tradeStats.totalTrades} trades
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Profit Factor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {selectedBacktest.riskMetrics.profitFactor.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          lucro / perda
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Exercícios</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {selectedBacktest.tradeStats.exercises}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          de {selectedBacktest.tradeStats.totalTrades} trades
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LineChart className="h-5 w-5" />
                          Equity Curve
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SimpleEquityChart data={selectedBacktest.equityCurve || []} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Composição das Receitas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <IncomeBreakdownChart data={selectedBacktest.incomeBreakdown} />
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Prêmios</p>
                            <p className="font-bold">{formatCurrency(selectedBacktest.incomeBreakdown.premiumIncome)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Dividendos</p>
                            <p className="font-bold">{formatCurrency(selectedBacktest.incomeBreakdown.dividendIncome)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Aluguel</p>
                            <p className="font-bold">{formatCurrency(selectedBacktest.incomeBreakdown.lendingIncome)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Selic</p>
                            <p className="font-bold">{formatCurrency(selectedBacktest.incomeBreakdown.selicIncome)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Benchmarks */}
                  {selectedBacktest.benchmarks && selectedBacktest.benchmarks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Comparativo com Benchmarks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Benchmark</TableHead>
                              <TableHead className="text-right">Retorno Total</TableHead>
                              <TableHead className="text-right">CAGR</TableHead>
                              <TableHead className="text-right">Diferença</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">WHEEL Turbinada</TableCell>
                              <TableCell className={`text-right ${getValueColor(selectedBacktest.totalReturnPercent)}`}>
                                {formatPercent(selectedBacktest.totalReturnPercent)}
                              </TableCell>
                              <TableCell className={`text-right ${getValueColor(selectedBacktest.riskMetrics.cagr)}`}>
                                {formatPercent(selectedBacktest.riskMetrics.cagr)}
                              </TableCell>
                              <TableCell className="text-right">-</TableCell>
                            </TableRow>
                            {selectedBacktest.benchmarks.map((bm) => (
                              <TableRow key={bm.name}>
                                <TableCell>{bm.name}</TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(bm.totalReturn)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(bm.cagr)}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${getValueColor(selectedBacktest.riskMetrics.cagr - bm.cagr)}`}>
                                  {formatPercent(selectedBacktest.riskMetrics.cagr - bm.cagr)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {selectedBacktest.status === 'failed' && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Backtest Falhou</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {selectedBacktest.errorMessage || 'Erro desconhecido durante a execução do backtest'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Selecione um backtest no histórico para ver os resultados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Candidates Tab */}
        <TabsContent value="candidates" className="space-y-4">
          {/* DEBUG: Visual state indicator - REMOVE AFTER FIXING */}
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-500 rounded-md mb-4">
            <p className="font-bold text-yellow-800 dark:text-yellow-200">DEBUG STATE:</p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300">
              <li>loadingAssets: {String(loadingAssets)}</li>
              <li>assetsError: {assetsError ? String(assetsError) : 'null'}</li>
              <li>assetsData type: {typeof assetsData}</li>
              <li>assetsData isArray: {String(Array.isArray(assetsData))}</li>
              <li>assetsData length: {Array.isArray(assetsData) ? assetsData.length : 'N/A'}</li>
              <li>allAssets.length: {allAssets.length}</li>
              <li>filteredAssets.length: {filteredAssets.length}</li>
            </ul>
          </div>
          {/* Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Seleção</CardTitle>
              <CardDescription>
                Aplique filtros opcionais para encontrar os melhores ativos para backtest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tab-filterHasOptions"
                    checked={formData.filterHasOptions}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, filterHasOptions: checked === true }))
                    }
                  />
                  <Label htmlFor="tab-filterHasOptions" className="text-sm cursor-pointer">
                    Com Opções
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tab-filterIDIV"
                    checked={formData.filterIDIV}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, filterIDIV: checked === true }))
                    }
                  />
                  <Label htmlFor="tab-filterIDIV" className="text-sm cursor-pointer">
                    No IDIV
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tab-filterROE"
                    checked={formData.filterROE}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, filterROE: checked === true }))
                    }
                  />
                  <Label htmlFor="tab-filterROE" className="text-sm cursor-pointer">
                    ROE ≥ {formData.minROE}%
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tab-filterDY"
                    checked={formData.filterDY}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, filterDY: checked === true }))
                    }
                  />
                  <Label htmlFor="tab-filterDY" className="text-sm cursor-pointer">
                    DY ≥ {formData.minDividendYield}%
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tab-filterDebt"
                    checked={formData.filterDebt}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, filterDebt: checked === true }))
                    }
                  />
                  <Label htmlFor="tab-filterDebt" className="text-sm cursor-pointer">
                    Dív ≤ {formData.maxDebtEbitda}x
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tab-filterMargin"
                    checked={formData.filterMargin}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, filterMargin: checked === true }))
                    }
                  />
                  <Label htmlFor="tab-filterMargin" className="text-sm cursor-pointer">
                    Margem ≥ {formData.minMargemLiquida}%
                  </Label>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium">{filteredAssets.length}</span> ativos encontrados
                {allAssets.length > 0 && ` de ${allAssets.length} total`}
                {loadingAssets && ' (carregando...)'}
                {!loadingAssets && allAssets.length === 0 && ' [DEBUG: assetsData empty or not array]'}
              </p>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card>
            <CardHeader>
              <CardTitle>Candidatos para Backtest</CardTitle>
              <CardDescription>
                Selecione um ativo para executar um novo backtest WHEEL
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssets ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum ativo encontrado com os filtros selecionados
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Opções</TableHead>
                      <TableHead className="text-right">IDIV</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.slice(0, 20).map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          {asset.ticker}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {asset.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasOptions ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">Sim</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.currentIndexes?.includes('IDIV') ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">IDIV</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openCreateDialog(asset)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Backtest
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Backtest Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Backtest WHEEL</DialogTitle>
            <DialogDescription>
              {formData.ticker
                ? `Configure os parâmetros para o backtest de ${formData.ticker}`
                : 'Selecione um ativo e configure os parâmetros do backtest'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Asset Selection with Filters */}
            {!formData.ticker ? (
              <div className="space-y-4">
                {/* Filter Checkboxes */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Filtros (Opcionais)</Label>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filterHasOptions"
                        checked={formData.filterHasOptions}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, filterHasOptions: checked === true }))
                        }
                      />
                      <Label htmlFor="filterHasOptions" className="text-sm cursor-pointer">
                        Ativos com Opções
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filterIDIV"
                        checked={formData.filterIDIV}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, filterIDIV: checked === true }))
                        }
                      />
                      <Label htmlFor="filterIDIV" className="text-sm cursor-pointer">
                        Ativos no IDIV
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filterROE"
                        checked={formData.filterROE}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, filterROE: checked === true }))
                        }
                      />
                      <Label htmlFor="filterROE" className="text-sm cursor-pointer">
                        ROE mín. {formData.minROE}%
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filterDY"
                        checked={formData.filterDY}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, filterDY: checked === true }))
                        }
                      />
                      <Label htmlFor="filterDY" className="text-sm cursor-pointer">
                        DY mín. {formData.minDividendYield}%
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filterDebt"
                        checked={formData.filterDebt}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, filterDebt: checked === true }))
                        }
                      />
                      <Label htmlFor="filterDebt" className="text-sm cursor-pointer">
                        Dív/EBITDA máx. {formData.maxDebtEbitda}x
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filterMargin"
                        checked={formData.filterMargin}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, filterMargin: checked === true }))
                        }
                      />
                      <Label htmlFor="filterMargin" className="text-sm cursor-pointer">
                        Margem Liq. mín. {formData.minMargemLiquida}%
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredAssets.length} ativos encontrados {allAssets.length > 0 ? `de ${allAssets.length} total` : ''}
                  </p>
                </div>

                {/* Asset Select */}
                <div className="space-y-2">
                  <Label>Selecione um Ativo</Label>
                  <Select
                    value={formData.assetId}
                    onValueChange={(value) => {
                      const asset = filteredAssets.find((c) => c.id === value);
                      if (asset) {
                        setFormData((prev) => ({
                          ...prev,
                          assetId: asset.id,
                          ticker: asset.ticker,
                          name: `Backtest ${asset.ticker} 60m`,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingAssets ? "Carregando ativos..." : "Selecione um ativo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAssets.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.ticker} - {c.name}
                          {c.hasOptions && " 📊"}
                          {c.currentIndexes?.includes('IDIV') && " 💰"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Ativo selecionado</p>
                <p className="text-xl font-bold">{formData.ticker}</p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setFormData((prev) => ({ ...prev, assetId: '', ticker: '' }))}
                >
                  Trocar ativo
                </Button>
              </div>
            )}

            {/* Basic Config */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="backtest-name">Nome do Backtest</Label>
                <Input
                  id="backtest-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Backtest PETR4 60m"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-capital">Capital Inicial (R$)</Label>
                <Input
                  id="initial-capital"
                  type="number"
                  value={formData.initialCapital}
                  onChange={(e) => setFormData((prev) => ({ ...prev, initialCapital: e.target.value }))}
                  placeholder="1000000"
                />
              </div>
            </div>

            {/* Strategy Parameters */}
            <div className="space-y-2">
              <h4 className="font-medium">Parâmetros da Estratégia</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="target-delta">Target Delta</Label>
                  <Input
                    id="target-delta"
                    type="number"
                    step="0.01"
                    value={formData.targetDelta}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetDelta: e.target.value }))}
                    placeholder="0.15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration-days">Vencimento (dias)</Label>
                  <Input
                    id="expiration-days"
                    type="number"
                    value={formData.expirationDays}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expirationDays: e.target.value }))}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-weekly">Max Alocação Semanal</Label>
                  <Input
                    id="max-weekly"
                    type="number"
                    step="0.05"
                    value={formData.maxWeeklyAllocation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxWeeklyAllocation: e.target.value }))}
                    placeholder="0.25"
                  />
                </div>
              </div>
            </div>

            {/* Fundamental Filters */}
            <div className="space-y-2">
              <h4 className="font-medium">Filtros Fundamentalistas</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="min-roe">ROE Mínimo (%)</Label>
                  <Input
                    id="min-roe"
                    type="number"
                    value={formData.minROE}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minROE: e.target.value }))}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-dy">DY Mínimo (%)</Label>
                  <Input
                    id="min-dy"
                    type="number"
                    value={formData.minDividendYield}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minDividendYield: e.target.value }))}
                    placeholder="6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-debt">Dív/EBITDA Máx</Label>
                  <Input
                    id="max-debt"
                    type="number"
                    step="0.1"
                    value={formData.maxDebtEbitda}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxDebtEbitda: e.target.value }))}
                    placeholder="2.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-margin">Margem Mín (%)</Label>
                  <Input
                    id="min-margin"
                    type="number"
                    value={formData.minMargemLiquida}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minMargemLiquida: e.target.value }))}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <h4 className="font-medium">Opções Adicionais</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="weekly-dist">Distribuição Semanal</Label>
                    <p className="text-xs text-muted-foreground">Abrir posições semanalmente</p>
                  </div>
                  <Checkbox
                    id="weekly-dist"
                    checked={formData.weeklyDistribution}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setFormData((prev) => ({ ...prev, weeklyDistribution: checked === true }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="reinvest">Reinvestir Dividendos</Label>
                    <p className="text-xs text-muted-foreground">Dividendos voltam para capital</p>
                  </div>
                  <Checkbox
                    id="reinvest"
                    checked={formData.reinvestDividends}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setFormData((prev) => ({ ...prev, reinvestDividends: checked === true }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="lending">Incluir Aluguel</Label>
                    <p className="text-xs text-muted-foreground">Renda de aluguel de ações</p>
                  </div>
                  <Checkbox
                    id="lending"
                    checked={formData.includeLendingIncome}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setFormData((prev) => ({ ...prev, includeLendingIncome: checked === true }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setFormData({
                  assetId: '',
                  ticker: '',
                  name: '',
                  initialCapital: '1000000',
                  targetDelta: '0.15',
                  minROE: '15',
                  minDividendYield: '6',
                  maxDebtEbitda: '2.0',
                  minMargemLiquida: '10',
                  expirationDays: '30',
                  weeklyDistribution: true,
                  maxWeeklyAllocation: '0.25',
                  reinvestDividends: true,
                  includeLendingIncome: true,
                  // Reset filter toggles
                  filterROE: false,
                  filterDY: false,
                  filterDebt: false,
                  filterMargin: false,
                  filterHasOptions: false,
                  filterIDIV: false,
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateBacktest}
              disabled={!formData.assetId || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Executar Backtest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este backtest? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBacktest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
