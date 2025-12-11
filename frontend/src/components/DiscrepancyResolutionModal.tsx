'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  History,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useDiscrepancyDetail,
  useResolveDiscrepancy,
  DiscrepancyDetail,
  ResolutionHistoryItem,
} from '@/lib/hooks/useDataSources';
import { cn } from '@/lib/utils';

interface DiscrepancyResolutionModalProps {
  ticker: string;
  field: string;
  onClose: () => void;
  onResolved?: () => void;
}

/**
 * FASE 90.1: Modal de Resolucao de Discrepancias
 *
 * Permite ao usuario visualizar detalhes de uma discrepancia
 * e selecionar o valor correto para resolver.
 */
export default function DiscrepancyResolutionModal({
  ticker,
  field,
  onClose,
  onResolved,
}: DiscrepancyResolutionModalProps) {
  const [activeTab, setActiveTab] = useState('sources');
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [customValue, setCustomValue] = useState('');

  // Fetch discrepancy details
  const { data: detail, isLoading, error } = useDiscrepancyDetail(ticker, field);

  // Mutation for resolving
  const resolveMutation = useResolveDiscrepancy();

  // Set initial selected value when data loads
  React.useEffect(() => {
    if (detail?.recommendedValue !== null && detail?.recommendedValue !== undefined) {
      setSelectedValue(detail.recommendedValue);
      setSelectedSource(detail.recommendedSource);
    }
  }, [detail]);

  const handleSelectSource = (source: string, value: number | null) => {
    if (value !== null) {
      setSelectedValue(value);
      setSelectedSource(source);
      setCustomValue('');
    }
  };

  const handleCustomValueChange = (value: string) => {
    setCustomValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      setSelectedValue(numValue);
      setSelectedSource('manual');
    }
  };

  const handleResolve = async () => {
    if (selectedValue === null) return;

    try {
      await resolveMutation.mutateAsync({
        ticker,
        field,
        data: {
          selectedValue,
          selectedSource: selectedSource || undefined,
          notes: notes || undefined,
        },
      });
      onResolved?.();
      onClose();
    } catch (err) {
      console.error('Failed to resolve discrepancy:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resolver Discrepancia: {ticker} - {detail?.fieldLabel || field}
          </DialogTitle>
          <DialogDescription>
            {detail && (
              <div className="flex items-center gap-4 mt-2">
                <Badge className={getSeverityColor(detail.severity)}>
                  {detail.severity === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {detail.severity.toUpperCase()}
                </Badge>
                <span>Desvio maximo: {formatValue(detail.maxDeviation)}%</span>
                <span>Consenso: {detail.consensus}%</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span>Erro ao carregar detalhes: {(error as Error).message}</span>
            </div>
          </div>
        )}

        {detail && (
          <div className="space-y-4">
            {/* Valor Recomendado */}
            {detail.recommendedValue !== null && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">Valor Recomendado</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-green-700">
                      {formatValue(detail.recommendedValue)}
                    </span>
                    <span className="ml-2 text-sm text-green-600">
                      via {detail.recommendedSource}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleSelectSource(detail.recommendedSource!, detail.recommendedValue!)
                    }
                    className={cn(
                      'border-green-300',
                      selectedValue === detail.recommendedValue &&
                        selectedSource === detail.recommendedSource &&
                        'bg-green-100 border-green-500',
                    )}
                  >
                    {selectedValue === detail.recommendedValue &&
                    selectedSource === detail.recommendedSource ? (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    ) : null}
                    Selecionar
                  </Button>
                </div>
                <p className="text-sm text-green-700 mt-2">{detail.recommendedReason}</p>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sources">Fontes ({detail.sourceValues.length})</TabsTrigger>
                <TabsTrigger value="history">
                  Historico ({detail.resolutionHistory.length})
                </TabsTrigger>
                <TabsTrigger value="custom">Valor Manual</TabsTrigger>
              </TabsList>

              {/* Sources Tab */}
              <TabsContent value="sources" className="mt-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {detail.sourceValues.map((sv) => (
                      <div
                        key={sv.source}
                        className={cn(
                          'p-3 rounded-lg border flex items-center justify-between',
                          sv.isConsensus && 'bg-green-50 border-green-200',
                          selectedValue === sv.value &&
                            selectedSource === sv.source &&
                            'ring-2 ring-primary',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                              sv.isConsensus ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600',
                            )}
                          >
                            {sv.priority}
                          </div>
                          <div>
                            <div className="font-medium">{sv.source}</div>
                            <div className="text-sm text-muted-foreground">
                              Atualizado: {formatDate(sv.scrapedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-mono text-lg">{formatValue(sv.value)}</div>
                            {sv.deviation !== null && sv.deviation > 0 && (
                              <div
                                className={cn(
                                  'text-sm',
                                  sv.deviation > 20
                                    ? 'text-red-600'
                                    : sv.deviation > 10
                                      ? 'text-yellow-600'
                                      : 'text-muted-foreground',
                                )}
                              >
                                {sv.deviation > 0 ? '+' : ''}
                                {formatValue(sv.deviation)}% desvio
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectSource(sv.source, sv.value)}
                            disabled={sv.value === null}
                            className={cn(
                              selectedValue === sv.value &&
                                selectedSource === sv.source &&
                                'bg-primary text-primary-foreground',
                            )}
                          >
                            {selectedValue === sv.value && selectedSource === sv.source ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              'Usar'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4">
                <ScrollArea className="h-[300px]">
                  {detail.resolutionHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma resolucao anterior</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detail.resolutionHistory.map((h: ResolutionHistoryItem) => (
                        <div key={h.id} className="p-3 rounded-lg border bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">
                              {h.resolutionMethod === 'manual'
                                ? 'Manual'
                                : h.resolutionMethod === 'auto_consensus'
                                  ? 'Auto (Consenso)'
                                  : 'Auto (Prioridade)'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(h.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {formatValue(h.oldValue)}
                            </span>
                            <span>→</span>
                            <span className="font-semibold">{formatValue(h.newValue)}</span>
                            <span className="text-muted-foreground">
                              via {h.selectedSource}
                            </span>
                          </div>
                          {h.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{h.notes}</p>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Por: {h.resolvedBy || 'Sistema'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Custom Value Tab */}
              <TabsContent value="custom" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customValue">Valor Personalizado</Label>
                    <Input
                      id="customValue"
                      type="number"
                      step="any"
                      placeholder="Digite um valor..."
                      value={customValue}
                      onChange={(e) => handleCustomValueChange(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Use esta opcao se nenhum dos valores das fontes estiver correto.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input
                id="notes"
                placeholder="Justificativa para a resolucao..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Selected Value Summary */}
            {selectedValue !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor Selecionado:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{formatValue(selectedValue)}</span>
                    <Badge variant="secondary">{selectedSource}</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleResolve}
            disabled={selectedValue === null || resolveMutation.isPending}
          >
            {resolveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resolvendo...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Resolver Discrepancia
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
