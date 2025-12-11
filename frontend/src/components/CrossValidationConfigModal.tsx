'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCrossValidationConfig,
  useUpdateCrossValidationConfig,
  usePreviewConfigImpact,
  CrossValidationConfig,
  ImpactPreview,
} from '@/lib/hooks/useDataSources';
import { useToast } from '@/components/ui/use-toast';

interface CrossValidationConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Field labels for display
const fieldLabels: Record<string, string> = {
  pl: 'P/L',
  pvp: 'P/VP',
  dy: 'Dividend Yield',
  roe: 'ROE',
  roic: 'ROIC',
  margemBruta: 'Margem Bruta',
  margemEbit: 'Margem EBIT',
  margemLiquida: 'Margem Líquida',
  dividaLiquidaEbitda: 'Dívida Líquida/EBITDA',
  dividaLiquidaPl: 'Dívida Líquida/PL',
  lpa: 'LPA',
  vpa: 'VPA',
  psr: 'PSR',
  evEbit: 'EV/EBIT',
  evEbitda: 'EV/EBITDA',
  pAtivo: 'P/Ativo',
  pCapGiro: 'P/Cap. Giro',
  pAtivCircLiq: 'P/Ativ. Circ. Líq.',
  default: 'Padrão',
};

// Source labels for display
const sourceLabels: Record<string, string> = {
  fundamentus: 'Fundamentus',
  statusinvest: 'Status Invest',
  investidor10: 'Investidor10',
  fundamentei: 'Fundamentei',
  investsite: 'Investsite',
  brapi: 'BRAPI',
  tradingview: 'TradingView',
  googlefinance: 'Google Finance',
  yahoofinance: 'Yahoo Finance',
};

export function CrossValidationConfigModal({
  open,
  onOpenChange,
}: CrossValidationConfigModalProps) {
  const { data: config, isLoading: isLoadingConfig } = useCrossValidationConfig();
  const updateConfigMutation = useUpdateCrossValidationConfig();
  const previewMutation = usePreviewConfigImpact();
  const { toast } = useToast();

  // Local state for form
  const [localConfig, setLocalConfig] = useState<Partial<CrossValidationConfig> | null>(null);
  const [preview, setPreview] = useState<ImpactPreview | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Initialize local config when data loads
  useEffect(() => {
    if (config && !localConfig) {
      setLocalConfig({
        minSources: config.minSources,
        severityThresholdHigh: config.severityThresholdHigh,
        severityThresholdMedium: config.severityThresholdMedium,
        sourcePriority: [...config.sourcePriority],
        fieldTolerances: {
          default: config.fieldTolerances.default,
          byField: { ...config.fieldTolerances.byField },
        },
      });
    }
  }, [config, localConfig]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setLocalConfig(null);
      setPreview(null);
      setActiveTab('general');
    }
  }, [open]);

  const handlePreview = async () => {
    if (!localConfig) return;

    try {
      const result = await previewMutation.mutateAsync(localConfig);
      setPreview(result);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao calcular preview',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!localConfig) return;

    try {
      await updateConfigMutation.mutateAsync(localConfig);
      toast({
        title: 'Configuração salva',
        description: 'As regras de validação cruzada foram atualizadas.',
      });
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao salvar configuração',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const moveSourceUp = (index: number) => {
    if (!localConfig?.sourcePriority || index === 0) return;
    const newPriority = [...localConfig.sourcePriority];
    [newPriority[index - 1], newPriority[index]] = [newPriority[index], newPriority[index - 1]];
    setLocalConfig({ ...localConfig, sourcePriority: newPriority });
    setPreview(null); // Clear preview when config changes
  };

  const moveSourceDown = (index: number) => {
    if (!localConfig?.sourcePriority || index === localConfig.sourcePriority.length - 1) return;
    const newPriority = [...localConfig.sourcePriority];
    [newPriority[index], newPriority[index + 1]] = [newPriority[index + 1], newPriority[index]];
    setLocalConfig({ ...localConfig, sourcePriority: newPriority });
    setPreview(null);
  };

  const updateFieldTolerance = (field: string, value: number) => {
    if (!localConfig?.fieldTolerances) return;

    if (field === 'default') {
      setLocalConfig({
        ...localConfig,
        fieldTolerances: {
          ...localConfig.fieldTolerances,
          default: value,
        },
      });
    } else {
      setLocalConfig({
        ...localConfig,
        fieldTolerances: {
          ...localConfig.fieldTolerances,
          byField: {
            ...localConfig.fieldTolerances.byField,
            [field]: value,
          },
        },
      });
    }
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração de Validação Cruzada
          </DialogTitle>
          <DialogDescription>
            Configure as regras para detecção de discrepâncias entre fontes de dados
          </DialogDescription>
        </DialogHeader>

        {isLoadingConfig || !localConfig ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando configuração...</span>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="tolerances">Tolerâncias</TabsTrigger>
                <TabsTrigger value="priority">Prioridade</TabsTrigger>
              </TabsList>

              {/* Tab: General Settings */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <Card className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-sources">Mínimo de Fontes para Consenso</Label>
                    <Input
                      id="min-sources"
                      type="number"
                      min={2}
                      max={10}
                      value={localConfig.minSources ?? 3}
                      onChange={(e) => {
                        setLocalConfig({ ...localConfig, minSources: parseInt(e.target.value) || 3 });
                        setPreview(null);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Número mínimo de fontes necessárias para calcular o consenso
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold-high">Threshold Severidade Alta (%)</Label>
                    <Input
                      id="threshold-high"
                      type="number"
                      min={10}
                      max={100}
                      step={5}
                      value={localConfig.severityThresholdHigh ?? 20}
                      onChange={(e) => {
                        setLocalConfig({ ...localConfig, severityThresholdHigh: parseInt(e.target.value) || 20 });
                        setPreview(null);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Desvio acima deste valor é considerado severidade ALTA
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold-medium">Threshold Severidade Média (%)</Label>
                    <Input
                      id="threshold-medium"
                      type="number"
                      min={5}
                      max={50}
                      step={5}
                      value={localConfig.severityThresholdMedium ?? 10}
                      onChange={(e) => {
                        setLocalConfig({ ...localConfig, severityThresholdMedium: parseInt(e.target.value) || 10 });
                        setPreview(null);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Desvio acima deste valor é considerado severidade MÉDIA (abaixo é BAIXA)
                    </p>
                  </div>
                </Card>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm text-blue-500">
                    Valores mais baixos geram mais discrepâncias. Recomendado: Alta ≥20%, Média ≥10%
                  </p>
                </div>
              </TabsContent>

              {/* Tab: Field Tolerances */}
              <TabsContent value="tolerances" className="space-y-4 mt-4">
                <Card className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-tolerance">Tolerância Padrão (%)</Label>
                    <Input
                      id="default-tolerance"
                      type="number"
                      min={1}
                      max={50}
                      step={1}
                      value={localConfig.fieldTolerances?.default ?? 5}
                      onChange={(e) => updateFieldTolerance('default', parseInt(e.target.value) || 5)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tolerância padrão aplicada a todos os campos sem configuração específica
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Tolerâncias por Campo</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(localConfig.fieldTolerances?.byField ?? {}).map(([field, value]) => (
                        <div key={field} className="flex items-center gap-2">
                          <Label className="min-w-[120px] text-xs">{fieldLabels[field] || field}</Label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            step={1}
                            value={value}
                            onChange={(e) => updateFieldTolerance(field, parseInt(e.target.value) || 5)}
                            className="w-20 h-8 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <p className="text-sm text-yellow-500">
                    Tolerâncias maiores reduzem discrepâncias, mas podem mascarar erros reais nos dados
                  </p>
                </div>
              </TabsContent>

              {/* Tab: Source Priority */}
              <TabsContent value="priority" className="space-y-4 mt-4">
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-3">Prioridade das Fontes</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Em caso de empate no consenso, a fonte com maior prioridade (topo) é preferida
                  </p>
                  <div className="space-y-2">
                    {localConfig.sourcePriority?.map((source, index) => (
                      <div
                        key={source}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="min-w-[24px] justify-center">
                          {index + 1}
                        </Badge>
                        <span className="flex-1 text-sm font-medium">
                          {sourceLabels[source] || source}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => moveSourceUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => moveSourceDown(index)}
                            disabled={index === (localConfig.sourcePriority?.length ?? 0) - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Impact Preview Section */}
            {preview && (
              <Card className="p-4 space-y-4 border-primary/50">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Preview de Impacto
                </h4>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Atual</p>
                    <p className="text-xl font-bold">{preview.currentTotal}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Novo Total</p>
                    <p className="text-xl font-bold">{preview.newTotal}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Variação</p>
                    <p className={cn(
                      'text-xl font-bold',
                      preview.delta > 0 ? 'text-destructive' : preview.delta < 0 ? 'text-success' : ''
                    )}>
                      {preview.delta > 0 ? '+' : ''}{preview.delta}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Ativos Afetados</p>
                    <p className="text-xl font-bold">{preview.affectedAssets.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center p-2 rounded-lg bg-destructive/10">
                    <p className="text-xs text-destructive">Alta</p>
                    <p className="text-sm font-bold">
                      {preview.bySeverity.high.current} → {preview.bySeverity.high.new}
                      <span className={cn(
                        'text-xs ml-1',
                        preview.bySeverity.high.delta > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        ({preview.bySeverity.high.delta > 0 ? '+' : ''}{preview.bySeverity.high.delta})
                      </span>
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-warning/10">
                    <p className="text-xs text-warning">Média</p>
                    <p className="text-sm font-bold">
                      {preview.bySeverity.medium.current} → {preview.bySeverity.medium.new}
                      <span className={cn(
                        'text-xs ml-1',
                        preview.bySeverity.medium.delta > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        ({preview.bySeverity.medium.delta > 0 ? '+' : ''}{preview.bySeverity.medium.delta})
                      </span>
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-500/10">
                    <p className="text-xs text-blue-500">Baixa</p>
                    <p className="text-sm font-bold">
                      {preview.bySeverity.low.current} → {preview.bySeverity.low.new}
                      <span className={cn(
                        'text-xs ml-1',
                        preview.bySeverity.low.delta > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        ({preview.bySeverity.low.delta > 0 ? '+' : ''}{preview.bySeverity.low.delta})
                      </span>
                    </p>
                  </div>
                </div>

                {preview.sampleChanges.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Exemplos de mudanças:</p>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto">
                      {preview.sampleChanges.slice(0, 5).map((change, i) => (
                        <div key={i} className="text-xs flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">{change.ticker}</Badge>
                          <span className="text-muted-foreground">{change.field}:</span>
                          <span>{change.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  'Ver Impacto'
                )}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateConfigMutation.isPending}
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configuração'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
