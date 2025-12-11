'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  AlertCircle,
  Loader2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import DiscrepancyResolutionModal from '@/components/DiscrepancyResolutionModal';
import { cn } from '@/lib/utils';
import {
  useScrapersDiscrepancies,
  useDiscrepancyStats,
} from '@/lib/hooks/useDataSources';
import type { Discrepancy, TopAssetDiscrepancy, TopFieldDiscrepancy } from '@/lib/hooks/useDataSources';

// Severity helpers
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

const getSeverityBadgeVariant = (
  severity: 'high' | 'medium' | 'low'
): 'destructive' | 'secondary' | 'default' => {
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
      return 'Alta';
    case 'medium':
      return 'Media';
    case 'low':
      return 'Baixa';
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

type OrderBy = 'severity' | 'deviation' | 'ticker' | 'field' | 'date';
type OrderDirection = 'asc' | 'desc';

export default function DiscrepanciesPage() {
  // Filters
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [tickerFilter, setTickerFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<OrderBy>('severity');
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('desc');
  const pageSize = 25;

  // FASE 90.1: Modal de resolucao
  const [resolutionModal, setResolutionModal] = useState<{
    ticker: string;
    field: string;
  } | null>(null);

  // Data fetching
  const {
    data: discrepanciesData,
    isLoading: isLoadingDiscrepancies,
    error: errorDiscrepancies,
  } = useScrapersDiscrepancies({
    severity: severityFilter,
    ticker: tickerFilter || undefined,
    field: fieldFilter !== 'all' ? fieldFilter : undefined,
    page,
    pageSize,
    orderBy,
    orderDirection,
  });

  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useDiscrepancyStats({ topLimit: 10 });

  // Get unique fields for filter dropdown
  const availableFields = useMemo(() => {
    if (!statsData?.topFields) return [];
    return statsData.topFields.map((f) => ({
      value: f.field,
      label: f.fieldLabel,
    }));
  }, [statsData]);

  // Sorting handler
  const handleSort = (column: OrderBy) => {
    if (orderBy === column) {
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(column);
      setOrderDirection('desc');
    }
    setPage(1);
  };

  // Render sort icon
  const SortIcon = ({ column }: { column: OrderBy }) => {
    if (orderBy !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return orderDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  // Loading state
  if (isLoadingDiscrepancies && isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">
          Carregando discrepancias...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard de Discrepancias
        </h1>
        <p className="text-muted-foreground">
          Visualize e analise discrepancias de dados entre fontes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-muted/10 p-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">
                {discrepanciesData?.summary.total ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alta Severidade</p>
              <p className="text-2xl font-bold text-destructive">
                {discrepanciesData?.summary.high ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-warning/10 p-3">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Media Severidade</p>
              <p className="text-2xl font-bold text-warning">
                {discrepanciesData?.summary.medium ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-blue-500/10 p-3">
              <AlertCircle className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Baixa Severidade</p>
              <p className="text-2xl font-bold text-blue-500">
                {discrepanciesData?.summary.low ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Section */}
      {statsData && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Top Assets */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Top 10 Ativos com Discrepancias</h3>
            </div>
            <div className="space-y-3">
              {statsData.topAssets.slice(0, 10).map((asset: TopAssetDiscrepancy) => (
                <div
                  key={asset.ticker}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/assets/${asset.ticker}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {asset.ticker}
                    </Link>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {asset.assetName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {asset.count} disc.
                    </Badge>
                    {asset.highCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {asset.highCount} alta
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Fields */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Top 10 Campos com Discrepancias</h3>
            </div>
            <div className="space-y-3">
              {statsData.topFields.slice(0, 10).map((field: TopFieldDiscrepancy) => (
                <div
                  key={field.field}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">{field.fieldLabel}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {field.count} disc.
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {field.avgDeviation.toFixed(1)}% desvio medio
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Ticker Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ticker..."
              value={tickerFilter}
              onChange={(e) => {
                setTickerFilter(e.target.value.toUpperCase());
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* Severity Filter */}
          <Select
            value={severityFilter}
            onValueChange={(v) => {
              setSeverityFilter(v as 'all' | 'high' | 'medium' | 'low');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          {/* Field Filter */}
          <Select
            value={fieldFilter}
            onValueChange={(v) => {
              setFieldFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os campos</SelectItem>
              {availableFields.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(tickerFilter || severityFilter !== 'all' || fieldFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTickerFilter('');
                setSeverityFilter('all');
                setFieldFilter('all');
                setPage(1);
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Discrepancies Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center">
                  Severidade
                  <SortIcon column="severity" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('ticker')}
              >
                <div className="flex items-center">
                  Ativo
                  <SortIcon column="ticker" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('field')}
              >
                <div className="flex items-center">
                  Campo
                  <SortIcon column="field" />
                </div>
              </TableHead>
              <TableHead>Valor Consenso</TableHead>
              <TableHead>Fontes Divergentes</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('deviation')}
              >
                <div className="flex items-center">
                  Max Desvio
                  <SortIcon column="deviation" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Atualizado
                  <SortIcon column="date" />
                </div>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingDiscrepancies ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : discrepanciesData?.discrepancies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma discrepancia encontrada com os filtros atuais
                </TableCell>
              </TableRow>
            ) : (
              discrepanciesData?.discrepancies.map((d: Discrepancy, idx: number) => {
                const maxDeviation = Math.max(
                  ...d.divergentSources.map((s) => s.deviation)
                );
                return (
                  <TableRow key={`${d.ticker}-${d.field}-${idx}`}>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(d.severity)}>
                        {getSeverityLabel(d.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{d.ticker}</TableCell>
                    <TableCell>{d.fieldLabel}</TableCell>
                    <TableCell>
                      {typeof d.consensusValue === 'number'
                        ? d.consensusValue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : d.consensusValue}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {d.divergentSources.length} fonte(s)
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <div className="space-y-1">
                              {d.divergentSources.map((s) => (
                                <div key={s.source} className="flex justify-between gap-4">
                                  <span>{getSourceLabel(s.source)}:</span>
                                  <span className={cn('font-medium', getSeverityColor(d.severity))}>
                                    {s.value.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                    <span className="text-xs ml-1">
                                      ({s.deviation.toFixed(1)}%)
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className={getSeverityColor(d.severity)}>
                      {maxDeviation.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.lastUpdate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setResolutionModal({ ticker: d.ticker, field: d.field })}
                              >
                                <Wrench className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Resolver discrepancia</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/assets/${d.ticker}`}>
                                <Button variant="ghost" size="icon">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalhes do ativo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {discrepanciesData?.pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando{' '}
              {(discrepanciesData.pagination.page - 1) * discrepanciesData.pagination.pageSize + 1}
              {' '}-{' '}
              {Math.min(
                discrepanciesData.pagination.page * discrepanciesData.pagination.pageSize,
                discrepanciesData.pagination.totalItems
              )}{' '}
              de {discrepanciesData.pagination.totalItems} discrepancias
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {discrepanciesData.pagination.page} de{' '}
                {discrepanciesData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= discrepanciesData.pagination.totalPages}
              >
                Proxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* FASE 90.1: Modal de Resolucao */}
      {resolutionModal && (
        <DiscrepancyResolutionModal
          ticker={resolutionModal.ticker}
          field={resolutionModal.field}
          onClose={() => setResolutionModal(null)}
          onResolved={() => {
            // Refetch discrepancies after resolution
            setResolutionModal(null);
          }}
        />
      )}
    </div>
  );
}
