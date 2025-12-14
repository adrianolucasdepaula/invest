'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useWheelStrategy,
  useWheelTrades,
  useWheelPutRecommendations,
  useWheelCallRecommendations,
  useWheelWeeklySchedule,
  useWheelAnalytics,
  useWheelCashYield,
  useUpdateWheelStrategy,
  useCreateWheelTrade,
  useCloseWheelTrade,
  type OptionRecommendation,
  type WheelTrade,
  type WeeklySchedule,
} from '@/lib/hooks/use-wheel';
import { useWheelRecommendationUpdates, useOptionExpirationAlerts } from '@/lib/hooks/use-option-prices';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  RefreshCw,
  Plus,
  Play,
  Pause,
  PiggyBank,
  BarChart3,
  Percent,
  Bell,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function WheelStrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptionRecommendation | null>(null);
  const [isCloseTradeDialogOpen, setIsCloseTradeDialogOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<WheelTrade | null>(null);
  const [closeTradeForm, setCloseTradeForm] = useState({
    exitPrice: '',
    underlyingPriceAtExit: '',
    status: 'CLOSED' as 'CLOSED' | 'EXERCISED' | 'EXPIRED',
  });

  // Queries
  const { data: strategy, isLoading: loadingStrategy } = useWheelStrategy(strategyId);
  const { data: trades, isLoading: loadingTrades } = useWheelTrades(strategyId);
  const { data: putRecommendations, isLoading: loadingPuts } = useWheelPutRecommendations(strategyId);
  const { data: callRecommendations, isLoading: loadingCalls } = useWheelCallRecommendations(strategyId);
  const { data: weeklySchedule, isLoading: loadingSchedule } = useWheelWeeklySchedule(strategyId);
  const { data: analytics, isLoading: loadingAnalytics } = useWheelAnalytics(strategyId);
  // FASE 109.1: useWheelCashYield agora aceita principal (number), não strategyId
  const { data: cashYield } = useWheelCashYield(strategy?.availableCapital || 0, 30);

  // FASE 110: Real-time option price updates - auto-invalidates recommendations on WebSocket events
  const { lastUpdate: realtimeUpdate } = useWheelRecommendationUpdates(strategyId);
  // FASE 110.2: Pass ticker to hook for proper WebSocket subscription
  const { alerts: expirationAlerts, dismissAlert } = useOptionExpirationAlerts(strategy?.asset?.ticker);

  // Toast for notifications
  const { toast } = useToast();
  // FASE 110.2: Track shown updates to prevent duplicates
  const lastShownUpdateRef = useRef<string | null>(null);

  // FASE 110.1: Show toast notification when real-time recommendations update
  // FASE 110.2: Fixed - use ref to track shown updates and avoid toast dependency
  useEffect(() => {
    if (realtimeUpdate && strategy) {
      const updateKey = `${realtimeUpdate.ticker}-${realtimeUpdate.type}-${new Date(realtimeUpdate.timestamp).getTime()}`;
      if (lastShownUpdateRef.current !== updateKey) {
        lastShownUpdateRef.current = updateKey;
        toast({
          title: 'Recomendações Atualizadas',
          description: `${realtimeUpdate.recommendations.length} novas recomendações de ${realtimeUpdate.type} para ${realtimeUpdate.ticker}`,
        });
      }
    }
  }, [realtimeUpdate, strategy, toast]);

  // Filter expiration alerts for this strategy's ticker
  const strategyAlerts = strategy?.asset?.ticker
    ? expirationAlerts.filter((a) => a.ticker === strategy.asset?.ticker)
    : [];

  // Mutations
  const updateStrategy = useUpdateWheelStrategy();
  const createTrade = useCreateWheelTrade();
  const closeTrade = useCloseWheelTrade();

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'selling_puts': return 'Vendendo PUTs';
      case 'holding_shares': return 'Segurando Ações';
      case 'selling_calls': return 'Vendendo CALLs';
      default: return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'selling_puts': return 'bg-blue-500';
      case 'holding_shares': return 'bg-yellow-500';
      case 'selling_calls': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTradeStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="default">Aberto</Badge>;
      case 'CLOSED': return <Badge variant="secondary">Fechado</Badge>;
      case 'EXERCISED': return <Badge className="bg-yellow-500">Exercido</Badge>;
      case 'EXPIRED': return <Badge variant="outline">Expirado</Badge>;
      case 'ASSIGNED': return <Badge className="bg-orange-500">Atribuído</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleToggleStatus = () => {
    if (!strategy) return;
    const newStatus = strategy.status === 'active' ? 'paused' : 'active';
    updateStrategy.mutate({ id: strategyId, data: { status: newStatus } });
  };

  const handleCreateTrade = (recommendation: OptionRecommendation) => {
    if (!strategy) return;

    createTrade.mutate({
      strategyId: strategy.id,
      tradeType: recommendation.type === 'PUT' ? 'SELL_PUT' : 'SELL_CALL',
      optionSymbol: recommendation.symbol,
      underlyingTicker: strategy.asset?.ticker || '',
      optionType: recommendation.type,
      strike: recommendation.strike,
      expiration: recommendation.expiration,
      contracts: 1,
      entryPrice: recommendation.premium,
      underlyingPriceAtEntry: recommendation.strike * (1 + recommendation.distancePercent / 100),
      delta: recommendation.delta,
      gamma: recommendation.gamma,
      theta: recommendation.theta,
      vega: recommendation.vega,
      ivAtEntry: recommendation.iv,
      ivRankAtEntry: recommendation.ivRank,
    });

    setIsTradeDialogOpen(false);
    setSelectedRecommendation(null);
  };

  const handleCloseTrade = () => {
    if (!selectedTrade) return;

    const exitPrice = parseFloat(closeTradeForm.exitPrice);
    const underlyingPriceAtExit = parseFloat(closeTradeForm.underlyingPriceAtExit);

    if (isNaN(exitPrice) || isNaN(underlyingPriceAtExit)) {
      return;
    }

    closeTrade.mutate({
      tradeId: selectedTrade.id,
      strategyId: strategyId,
      data: {
        exitPrice,
        underlyingPriceAtExit,
        status: closeTradeForm.status,
      },
    });

    setIsCloseTradeDialogOpen(false);
    setSelectedTrade(null);
    setCloseTradeForm({
      exitPrice: '',
      underlyingPriceAtExit: '',
      status: 'CLOSED',
    });
  };

  const openCloseTradeDialog = (trade: WheelTrade) => {
    setSelectedTrade(trade);
    setCloseTradeForm({
      exitPrice: '',
      underlyingPriceAtExit: '',
      status: 'CLOSED',
    });
    setIsCloseTradeDialogOpen(true);
  };

  if (loadingStrategy) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Estratégia não encontrada</p>
        <Button onClick={() => router.push('/wheel')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/wheel')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {strategy.asset?.ticker || strategy.assetId}
              </h1>
              <Badge className={getPhaseColor(strategy.phase)}>
                {getPhaseLabel(strategy.phase)}
              </Badge>
              <Badge className={getStatusColor(strategy.status)}>
                {strategy.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {strategy.name || strategy.asset?.name || 'Estratégia WHEEL'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleToggleStatus}>
            {strategy.status === 'active' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Ativar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* FASE 110.1: Expiration Alerts Banner */}
      {strategyAlerts.length > 0 && (
        <div className="space-y-2">
          {strategyAlerts.map((alert) => (
            <Alert
              // FASE 110.2: Added timestamp for better key uniqueness
              key={`${alert.optionTicker}-${alert.expiration}-${new Date(alert.timestamp).getTime()}`}
              variant={alert.daysToExpiration <= 3 ? 'destructive' : 'default'}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {alert.daysToExpiration <= 3 ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}
                <div>
                  <AlertTitle className="mb-0">
                    {alert.optionTicker} expira em {alert.daysToExpiration} dia(s)
                  </AlertTitle>
                  <AlertDescription>
                    Strike R$ {alert.strike.toFixed(2)} - {alert.type} -{' '}
                    {alert.inTheMoney ? (
                      <span className="font-semibold text-yellow-600">ITM (In The Money)</span>
                    ) : (
                      <span className="text-green-600">OTM (Out of The Money)</span>
                    )}
                  </AlertDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dismissAlert(alert.optionTicker)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notional</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {strategy.notional?.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">capital total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponível</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {strategy.availableCapital?.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {cashYield ? `+R$ ${cashYield.expectedYield.toFixed(2)}/mês` : 'em Tesouro Selic'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strategy.sharesHeld}</div>
            <p className="text-xs text-muted-foreground">
              {strategy.averagePrice ? `PM: R$ ${Number(strategy.averagePrice).toFixed(2)}` : 'em carteira'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L Realizado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${strategy.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {strategy.realizedPnL?.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">prêmios e exercícios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L Não Realizado</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${strategy.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {strategy.unrealizedPnL?.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">posições abertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="puts">Vender PUTs</TabsTrigger>
          <TabsTrigger value="calls">Vender CALLs</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="schedule">Cronograma</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Analytics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Performance da estratégia</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <Skeleton className="h-48 w-full" />
                ) : analytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Premium Recebido</p>
                        <p className="text-xl font-bold text-green-600">
                          R$ {analytics.totalPremiumReceived.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Retorno Total</p>
                        <p className={`text-xl font-bold ${analytics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.totalReturn.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-xl font-bold">{analytics.winRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa de Exercício</p>
                        <p className="text-xl font-bold">{analytics.exerciseRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-2">Retorno Anualizado</p>
                      <p className={`text-3xl font-bold ${analytics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analytics.annualizedReturn.toFixed(2)}% a.a.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sem dados de analytics</p>
                )}
              </CardContent>
            </Card>

            {/* Cash Yield Card */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimento Tesouro Selic</CardTitle>
                <CardDescription>Capital não alocado (30 dias)</CardDescription>
              </CardHeader>
              <CardContent>
                {cashYield ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa Selic</p>
                        <p className="text-xl font-bold">{cashYield.selicRate.toFixed(2)}% a.a.</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa Diária</p>
                        <p className="text-xl font-bold">{cashYield.dailyRate.toFixed(4)}%</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Principal</span>
                        <span>R$ {cashYield.principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Rendimento (30d)</span>
                        <span className="font-bold">
                          +R$ {cashYield.expectedYield.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Calculando rendimento...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Trades */}
          <Card>
            <CardHeader>
              <CardTitle>Trades Recentes</CardTitle>
              <CardDescription>Últimos 5 trades da estratégia</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrades ? (
                <Skeleton className="h-48 w-full" />
              ) : trades && trades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opção</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Strike</TableHead>
                      <TableHead>Venc.</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.slice(0, 5).map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.optionSymbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.optionType === 'PUT' ? 'default' : 'secondary'}>
                            {trade.optionType}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {trade.strike.toFixed(2)}</TableCell>
                        <TableCell>
                          {format(new Date(trade.expiration), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>R$ {trade.entryPrice.toFixed(2)}</TableCell>
                        <TableCell>{getTradeStatusBadge(trade.status)}</TableCell>
                        <TableCell className={`text-right font-medium ${trade.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {trade.realizedPnL.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum trade registrado ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PUTs Tab */}
        <TabsContent value="puts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recomendações de PUT</CardTitle>
              <CardDescription>
                PUTs OTM ordenadas por score (delta ~15, IV alto, boa liquidez)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPuts ? (
                <Skeleton className="h-64 w-full" />
              ) : putRecommendations && putRecommendations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opção</TableHead>
                      <TableHead>Strike</TableHead>
                      <TableHead>Venc.</TableHead>
                      <TableHead>DTE</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Delta</TableHead>
                      <TableHead>IV</TableHead>
                      <TableHead>Retorno</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {putRecommendations.map((rec) => (
                      <TableRow key={rec.symbol}>
                        <TableCell className="font-medium">{rec.symbol}</TableCell>
                        <TableCell>R$ {rec.strike.toFixed(2)}</TableCell>
                        <TableCell>
                          {format(new Date(rec.expiration), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{rec.daysToExpiration}d</TableCell>
                        <TableCell>R$ {rec.premium.toFixed(2)}</TableCell>
                        <TableCell>{rec.delta.toFixed(2)}</TableCell>
                        <TableCell>{rec.iv.toFixed(1)}%</TableCell>
                        <TableCell className="text-green-600">
                          {rec.annualizedReturn.toFixed(1)}% a.a.
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${rec.score >= 70 ? 'text-green-600' : rec.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {rec.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => {
                            setSelectedRecommendation(rec);
                            setIsTradeDialogOpen(true);
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma recomendação de PUT disponível
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CALLs Tab */}
        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recomendações de CALL Coberta</CardTitle>
              <CardDescription>
                {strategy.sharesHeld > 0
                  ? `CALLs para ${strategy.sharesHeld} ações em carteira`
                  : 'Você precisa ter ações em carteira para vender CALLs cobertas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategy.sharesHeld === 0 ? (
                <div className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Sem ações em carteira. Venda PUTs e seja exercido para começar a vender CALLs.
                  </p>
                </div>
              ) : loadingCalls ? (
                <Skeleton className="h-64 w-full" />
              ) : callRecommendations && callRecommendations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opção</TableHead>
                      <TableHead>Strike</TableHead>
                      <TableHead>Venc.</TableHead>
                      <TableHead>DTE</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Delta</TableHead>
                      <TableHead>IV</TableHead>
                      <TableHead>Retorno</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callRecommendations.map((rec) => (
                      <TableRow key={rec.symbol}>
                        <TableCell className="font-medium">{rec.symbol}</TableCell>
                        <TableCell>R$ {rec.strike.toFixed(2)}</TableCell>
                        <TableCell>
                          {format(new Date(rec.expiration), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{rec.daysToExpiration}d</TableCell>
                        <TableCell>R$ {rec.premium.toFixed(2)}</TableCell>
                        <TableCell>{rec.delta.toFixed(2)}</TableCell>
                        <TableCell>{rec.iv.toFixed(1)}%</TableCell>
                        <TableCell className="text-green-600">
                          {rec.annualizedReturn.toFixed(1)}% a.a.
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${rec.score >= 70 ? 'text-green-600' : rec.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {rec.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => {
                            setSelectedRecommendation(rec);
                            setIsTradeDialogOpen(true);
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma recomendação de CALL disponível
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Trades</CardTitle>
              <CardDescription>Todos os trades da estratégia</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrades ? (
                <Skeleton className="h-64 w-full" />
              ) : trades && trades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Opção</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Strike</TableHead>
                      <TableHead>Venc.</TableHead>
                      <TableHead>Contratos</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          {format(new Date(trade.openedAt), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{trade.optionSymbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.optionType === 'PUT' ? 'default' : 'secondary'}>
                            {trade.tradeType}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {trade.strike.toFixed(2)}</TableCell>
                        <TableCell>
                          {format(new Date(trade.expiration), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{trade.contracts}</TableCell>
                        <TableCell>R$ {trade.entryPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          {trade.exitPrice ? `R$ ${trade.exitPrice.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>{getTradeStatusBadge(trade.status)}</TableCell>
                        <TableCell className={`text-right font-medium ${trade.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {trade.realizedPnL.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {trade.status === 'OPEN' && (
                            <Button size="sm" variant="outline" onClick={() => openCloseTradeDialog(trade)}>
                              Fechar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum trade registrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma Semanal de PUTs</CardTitle>
              <CardDescription>
                Distribuição do capital em 4 semanas para reduzir risco de timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSchedule ? (
                <Skeleton className="h-64 w-full" />
              ) : weeklySchedule && weeklySchedule.length > 0 ? (
                <div className="space-y-6">
                  {weeklySchedule.map((week) => (
                    <div key={week.week} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                            S{week.week}
                          </div>
                          <div>
                            <p className="font-medium">Semana {week.week}</p>
                            <p className="text-sm text-muted-foreground">
                              Venc: {format(new Date(week.targetExpiration), 'dd/MM/yyyy', { locale: ptBR })}
                              {' '}({week.daysToExpiration} dias)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            R$ {week.capitalToAllocate.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {week.suggestedContracts} contrato(s)
                          </p>
                        </div>
                      </div>
                      {week.recommendations.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Opções Recomendadas:</p>
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {week.recommendations.slice(0, 3).map((rec) => (
                              <div key={rec.symbol} className="rounded border p-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">{rec.symbol}</span>
                                  <span className="text-green-600">{rec.annualizedReturn.toFixed(0)}% a.a.</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Strike: R$ {rec.strike.toFixed(2)}</span>
                                  <span>Delta: {rec.delta.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum cronograma disponível
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Trade Dialog - Shared for PUT and CALL */}
      <Dialog open={isTradeDialogOpen} onOpenChange={(open) => {
        setIsTradeDialogOpen(open);
        if (!open) setSelectedRecommendation(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirmar Venda de {selectedRecommendation?.type || 'Opção'}
            </DialogTitle>
            <DialogDescription>
              Registrar venda de {selectedRecommendation?.symbol}
            </DialogDescription>
          </DialogHeader>
          {selectedRecommendation && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Strike</Label>
                  <p className="text-lg font-medium">R$ {selectedRecommendation.strike.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Prêmio</Label>
                  <p className="text-lg font-medium">R$ {selectedRecommendation.premium.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Vencimento</Label>
                  <p className="text-lg font-medium">
                    {format(new Date(selectedRecommendation.expiration), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label>Delta</Label>
                  <p className="text-lg font-medium">{selectedRecommendation.delta.toFixed(2)}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  {selectedRecommendation.type === 'PUT' ? 'Capital necessário (1 contrato)' : 'Ações cobertas (1 contrato)'}
                </p>
                <p className="text-2xl font-bold">
                  {selectedRecommendation.type === 'PUT'
                    ? `R$ ${(selectedRecommendation.strike * 100).toLocaleString('pt-BR')}`
                    : '100 ações'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTradeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedRecommendation && handleCreateTrade(selectedRecommendation)}
              disabled={!selectedRecommendation}
            >
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Trade Dialog */}
      <Dialog open={isCloseTradeDialogOpen} onOpenChange={(open) => {
        setIsCloseTradeDialogOpen(open);
        if (!open) {
          setSelectedTrade(null);
          setCloseTradeForm({ exitPrice: '', underlyingPriceAtExit: '', status: 'CLOSED' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Trade</DialogTitle>
            <DialogDescription>
              {selectedTrade && `Fechar ${selectedTrade.optionSymbol} - ${selectedTrade.tradeType}`}
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Strike</Label>
                  <p className="text-lg font-medium">R$ {selectedTrade.strike.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Entrada</Label>
                  <p className="text-lg font-medium">R$ {selectedTrade.entryPrice.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitPrice">Preço de Saída</Label>
                <Input
                  id="exitPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={closeTradeForm.exitPrice}
                  onChange={(e) => setCloseTradeForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="underlyingPrice">Preço do Ativo</Label>
                <Input
                  id="underlyingPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={closeTradeForm.underlyingPriceAtExit}
                  onChange={(e) => setCloseTradeForm(prev => ({ ...prev, underlyingPriceAtExit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status de Saída</Label>
                <Select
                  value={closeTradeForm.status}
                  onValueChange={(value: 'CLOSED' | 'EXERCISED' | 'EXPIRED') =>
                    setCloseTradeForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLOSED">Fechado (recompra)</SelectItem>
                    <SelectItem value="EXERCISED">Exercido</SelectItem>
                    <SelectItem value="EXPIRED">Expirado sem valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseTradeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCloseTrade}
              disabled={!closeTradeForm.exitPrice || !closeTradeForm.underlyingPriceAtExit}
            >
              Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
