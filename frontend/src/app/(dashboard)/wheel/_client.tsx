'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, calculateCashYieldApi } from '@/lib/api';
import { useHydrated } from '@/hooks/useHydrated';
import {
  useWheelCandidates,
  useWheelStrategies,
  useCreateWheelStrategy,
  // FASE 109.1: Importar types do hook (DRY principle)
  type WheelCandidate,
  type WheelStrategy,
  type CashYield,
} from '@/lib/hooks/use-wheel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
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
import { Label } from '@/components/ui/label';
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Search,
  RefreshCw,
  Plus,
  Calculator,
  PiggyBank,
  BarChart3,
  Loader2,
} from 'lucide-react';

// FASE 109.1: Types removidos - agora importados de use-wheel.ts (DRY)

export function WheelPageClient() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('candidates');
  const [searchTerm, setSearchTerm] = useState('');
  const [cashYield, setCashYield] = useState<CashYield | null>(null);
  const [cashPrincipal, setCashPrincipal] = useState('100000');
  const [cashDays, setCashDays] = useState('30');
  const [isCalculating, setIsCalculating] = useState(false);

  // Create Strategy Dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStrategyForm, setNewStrategyForm] = useState({
    assetId: '',
    ticker: '',
    name: '',
    notional: '100000',
  });

  // Filters
  const [minROE, setMinROE] = useState('15');
  const [minDY, setMinDY] = useState('6');
  const [maxDebt, setMaxDebt] = useState('2');

  // FASE 109: useMemo para evitar infinite re-renders
  const filters = useMemo(() => ({
    minROE: parseFloat(minROE) || undefined,
    minDividendYield: parseFloat(minDY) || undefined,
    maxDividaEbitda: parseFloat(maxDebt) || undefined,
    limit: 50,
  }), [minROE, minDY, maxDebt]);

  // FASE 109: React Query hooks (substituem useState + useEffect + loadData)
  const {
    data: candidatesData,
    isLoading: loadingCandidates,
    refetch: refetchCandidates,
  } = useWheelCandidates(filters);

  const {
    data: strategiesData,
    isLoading: loadingStrategies,
    refetch: refetchStrategies,
  } = useWheelStrategies();

  // FASE 109: Mutation para criar estratégia
  const createMutation = useCreateWheelStrategy();

  // Derived state (with explicit types for TypeScript)
  const candidates: WheelCandidate[] = candidatesData?.candidates || [];
  const strategies: WheelStrategy[] = strategiesData || [];
  const isLoading = activeTab === 'candidates' ? loadingCandidates : loadingStrategies;

  // Refetch based on active tab
  const handleRefresh = () => {
    if (activeTab === 'candidates') {
      refetchCandidates();
    } else if (activeTab === 'strategies') {
      refetchStrategies();
    }
  };

  const calculateCashYield = async () => {
    setIsCalculating(true);
    try {
      const principal = parseFloat(cashPrincipal);
      const days = parseInt(cashDays);

      if (isNaN(principal) || principal <= 0) {
        toast({
          title: 'Valor inválido',
          description: 'Digite um valor válido para o principal',
          variant: 'destructive',
        });
        return;
      }

      if (isNaN(days) || days <= 0) {
        toast({
          title: 'Período inválido',
          description: 'Selecione um período válido',
          variant: 'destructive',
        });
        return;
      }

      const data = await calculateCashYieldApi(principal, days);
      setCashYield(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao calcular',
        description: error.message || 'Erro ao calcular rendimento',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // FASE 109.1: handleCreateStrategy - callbacks removidos (hook já tem toast)
  const handleCreateStrategy = () => {
    if (!newStrategyForm.assetId) {
      toast({
        title: 'Ativo não selecionado',
        description: 'Selecione um candidato para criar a estratégia',
        variant: 'destructive',
      });
      return;
    }

    const notional = parseFloat(newStrategyForm.notional);
    if (isNaN(notional) || notional <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor válido para o notional',
        variant: 'destructive',
      });
      return;
    }

    // FASE 109.1: Removidos onSuccess/onError inline (evita toasts duplicados)
    // Hook useCreateWheelStrategy já tem toast no onSuccess/onError
    createMutation.mutate({
      assetId: newStrategyForm.assetId,
      name: newStrategyForm.name || `WHEEL ${newStrategyForm.ticker}`,
      notional,
    });
  };

  // FASE 109.1: useEffect para UI updates após mutation success
  // Using destructured isSuccess to avoid dependency on entire mutation object
  const { isSuccess: mutationSuccess, reset: resetMutation } = createMutation;
  useEffect(() => {
    if (mutationSuccess) {
      setIsCreateDialogOpen(false);
      setNewStrategyForm({ assetId: '', ticker: '', name: '', notional: '100000' });
      setActiveTab('strategies');
      // Reset mutation state para próximo uso
      resetMutation();
    }
  }, [mutationSuccess, resetMutation]);

  const openCreateDialogWithCandidate = (candidate: WheelCandidate) => {
    setNewStrategyForm({
      assetId: candidate.id,
      ticker: candidate.ticker,
      name: `WHEEL ${candidate.ticker}`,
      notional: '100000',
    });
    setIsCreateDialogOpen(true);
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'selling_puts':
        return 'Vendendo PUTs';
      case 'holding_shares':
        return 'Segurando Ações';
      case 'selling_calls':
        return 'Vendendo CALLs';
      default:
        return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'selling_puts':
        return 'bg-blue-500';
      case 'holding_shares':
        return 'bg-yellow-500';
      case 'selling_calls':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // FASE 109.1: Hydration check para prevenir SSR mismatch
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
          <h1 className="text-3xl font-bold tracking-tight">Estratégia WHEEL</h1>
          <p className="text-muted-foreground">
            Gerencie suas estratégias de venda de opções com a metodologia WHEEL
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Estratégia
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estratégias Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {strategies.filter((s) => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {strategies.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Alocado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {strategies.reduce((sum, s) => sum + (s.notional - s.availableCapital), 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">em opções e ações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L Realizado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${strategies.reduce((sum, s) => sum + s.realizedPnL, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {strategies.reduce((sum, s) => sum + s.realizedPnL, 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">prêmios e exercícios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatos WHEEL</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.length}</div>
            <p className="text-xs text-muted-foreground">ativos com score &gt; 60</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="candidates">Candidatos</TabsTrigger>
          <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          <TabsTrigger value="calculator">Calculadora Selic</TabsTrigger>
        </TabsList>

        {/* Candidates Tab */}
        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Seleção</CardTitle>
              <CardDescription>
                Defina os critérios fundamentalistas para encontrar bons candidatos WHEEL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="wheel-search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="wheel-search"
                      name="wheel-search"
                      placeholder="Ticker ou nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-roe">ROE Mínimo (%)</Label>
                  <Input
                    id="min-roe"
                    name="min-roe"
                    type="number"
                    value={minROE}
                    onChange={(e) => setMinROE(e.target.value)}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-dy">DY Mínimo (%)</Label>
                  <Input
                    id="min-dy"
                    name="min-dy"
                    type="number"
                    value={minDY}
                    onChange={(e) => setMinDY(e.target.value)}
                    placeholder="6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-debt">Dív/EBITDA Máx</Label>
                  <Input
                    id="max-debt"
                    name="max-debt"
                    type="number"
                    value={maxDebt}
                    onChange={(e) => setMaxDebt(e.target.value)}
                    placeholder="2.0"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => refetchCandidates()} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidatos WHEEL</CardTitle>
              <CardDescription>
                Ativos com bons fundamentos e liquidez em opções para a estratégia WHEEL
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum candidato encontrado com os filtros atuais
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">ROE</TableHead>
                      <TableHead className="text-right">DY</TableHead>
                      <TableHead className="text-right">Dív/EBITDA</TableHead>
                      <TableHead className="text-right">IV Rank</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">
                          {candidate.ticker}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {candidate.name}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {candidate.currentPrice?.toFixed(2) || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {candidate.roe?.toFixed(1) || '-'}%
                        </TableCell>
                        <TableCell className="text-right">
                          {candidate.dividendYield?.toFixed(1) || '-'}%
                        </TableCell>
                        <TableCell className="text-right">
                          {candidate.dividaEbitda?.toFixed(2) || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {candidate.ivRank !== undefined ? (
                            <Badge variant={candidate.ivRank >= 50 ? 'default' : 'secondary'}>
                              {candidate.ivRank.toFixed(0)}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${getScoreColor(candidate.wheelScore)}`}>
                            {candidate.wheelScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/assets/${candidate.ticker}`)}
                            >
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openCreateDialogWithCandidate(candidate)}
                            >
                              WHEEL
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

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Estratégias WHEEL</CardTitle>
              <CardDescription>
                Gerencie suas estratégias ativas de venda de opções
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : strategies.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Você ainda não tem estratégias WHEEL ativas
                  </p>
                  <Button onClick={() => {
                    setActiveTab('candidates');
                    toast({
                      title: 'Selecione um candidato',
                      description: 'Escolha um ativo na lista de candidatos para criar sua estratégia WHEEL',
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Estratégia
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Fase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Notional</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell className="font-medium">
                          {strategy.asset?.ticker || strategy.assetId}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPhaseColor(strategy.phase)}>
                            {getPhaseLabel(strategy.phase)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                            {strategy.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {strategy.notional?.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {strategy.availableCapital?.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          {strategy.sharesHeld}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${strategy.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {strategy.realizedPnL?.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/wheel/${strategy.id}`)}
                          >
                            Detalhes
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

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculadora Tesouro Selic
                </CardTitle>
                <CardDescription>
                  Calcule o rendimento do capital não alocado em opções
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cash-principal">Valor Principal (R$)</Label>
                  <Input
                    id="cash-principal"
                    name="cash-principal"
                    type="number"
                    value={cashPrincipal}
                    onChange={(e) => setCashPrincipal(e.target.value)}
                    placeholder="100000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cash-days">Período (dias)</Label>
                  <Select value={cashDays} onValueChange={setCashDays}>
                    <SelectTrigger id="cash-days">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias (1 mês)</SelectItem>
                      <SelectItem value="60">60 dias (2 meses)</SelectItem>
                      <SelectItem value="90">90 dias (3 meses)</SelectItem>
                      <SelectItem value="180">180 dias (6 meses)</SelectItem>
                      <SelectItem value="365">365 dias (1 ano)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={calculateCashYield} className="w-full" disabled={isCalculating}>
                  {isCalculating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="mr-2 h-4 w-4" />
                  )}
                  Calcular Rendimento
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Resultado da Projeção
                </CardTitle>
                <CardDescription>
                  Rendimento estimado do Tesouro Selic
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cashYield ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Taxa Selic Atual</p>
                        <p className="text-2xl font-bold">{cashYield.selicRate.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">ao ano</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Taxa Diária</p>
                        <p className="text-2xl font-bold">{cashYield.dailyRate.toFixed(4)}%</p>
                        <p className="text-xs text-muted-foreground">por dia útil</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal</span>
                        <span className="font-medium">
                          R$ {cashYield.principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Período</span>
                        <span className="font-medium">{cashYield.days} dias</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Rendimento Esperado</span>
                        <span className="font-bold">
                          + R$ {cashYield.expectedYield.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <hr className="border-muted-foreground/20" />
                      <div className="flex justify-between text-lg">
                        <span className="font-medium">Valor Final</span>
                        <span className="font-bold text-green-600">
                          R$ {cashYield.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      Taxa efetiva anualizada: <span className="font-medium">{cashYield.effectiveRate.toFixed(2)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <PiggyBank className="mx-auto h-12 w-12 mb-4" />
                    <p>Preencha os campos e clique em calcular</p>
                    <p className="text-sm mt-2">
                      O dinheiro não alocado em opções deve render em Tesouro Selic
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sobre a Estratégia WHEEL</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-blue-600 mb-2">1. Venda de PUTs</h4>
                  <p className="text-sm text-muted-foreground">
                    Venda PUTs em ativos com bons fundamentos. O dinheiro não alocado rende em Tesouro Selic.
                    Use delta 15 como referência para strikes OTM.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-yellow-600 mb-2">2. Exercício Aceito</h4>
                  <p className="text-sm text-muted-foreground">
                    Se exercido, você compra as ações no strike. As ações compradas devem ir para aluguel
                    automaticamente para gerar renda adicional.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-green-600 mb-2">3. Venda de CALLs</h4>
                  <p className="text-sm text-muted-foreground">
                    Com ações em carteira, venda CALLs cobertas. Se em lucro, venda ATM/ITM.
                    Se em prejuízo, venda acima do preço médio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Strategy Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Estratégia WHEEL</DialogTitle>
            <DialogDescription>
              {newStrategyForm.ticker
                ? `Configure a estratégia WHEEL para ${newStrategyForm.ticker}`
                : 'Selecione um candidato na lista ou configure manualmente'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {newStrategyForm.ticker ? (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Ativo selecionado</p>
                <p className="text-xl font-bold">{newStrategyForm.ticker}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Selecione um Candidato</Label>
                <Select
                  value={newStrategyForm.assetId}
                  onValueChange={(value) => {
                    const candidate = candidates.find(c => c.id === value);
                    if (candidate) {
                      setNewStrategyForm({
                        assetId: candidate.id,
                        ticker: candidate.ticker,
                        name: `WHEEL ${candidate.ticker}`,
                        notional: newStrategyForm.notional,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.ticker} - {c.name} (Score: {c.wheelScore})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="strategyName">Nome da Estratégia</Label>
              <Input
                id="strategyName"
                value={newStrategyForm.name}
                onChange={(e) => setNewStrategyForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: WHEEL PETR4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notional">Capital (Notional)</Label>
              <Input
                id="notional"
                type="number"
                value={newStrategyForm.notional}
                onChange={(e) => setNewStrategyForm(prev => ({ ...prev, notional: e.target.value }))}
                placeholder="100000"
              />
              <p className="text-xs text-muted-foreground">
                Capital máximo a ser alocado na estratégia
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setNewStrategyForm({ assetId: '', ticker: '', name: '', notional: '100000' });
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateStrategy}
              disabled={!newStrategyForm.assetId || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Criar Estratégia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
