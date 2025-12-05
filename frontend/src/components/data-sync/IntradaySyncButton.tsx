'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Loader2 } from 'lucide-react';
import { useStartIntradaySync } from '@/lib/hooks/useDataSync';
import { SyncIntradayTimeframe, SyncIntradayRange } from '@/lib/types/data-sync';

/**
 * Props for IntradaySyncButton
 */
export interface IntradaySyncButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSyncStarted?: () => void;
  onSyncCompleted?: (recordsSynced: number) => void;
}

/**
 * Component: IntradaySyncButton
 *
 * Button to sync intraday data from BRAPI to TimescaleDB.
 * Features:
 * - Opens modal to configure ticker, timeframe, and range
 * - Calls POST /market-data/sync-intraday
 * - Shows toast notifications (success/error)
 * - Disabled state while sync is running
 */
export function IntradaySyncButton({
  variant = 'outline',
  size = 'default',
  className,
  onSyncStarted,
  onSyncCompleted,
}: IntradaySyncButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [ticker, setTicker] = useState('PETR4');
  const [timeframe, setTimeframe] = useState<SyncIntradayTimeframe>(SyncIntradayTimeframe.H1);
  const [range, setRange] = useState<SyncIntradayRange>(SyncIntradayRange.D5);

  const { toast } = useToast();
  const syncMutation = useStartIntradaySync();

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!syncMutation.isPending) {
      setModalOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!ticker.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um ticker válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      onSyncStarted?.();

      const result = await syncMutation.mutateAsync({
        ticker: ticker.toUpperCase(),
        timeframe,
        range,
      });

      toast({
        title: 'Sync Intraday Concluído',
        description: `${result.recordsSynced} registros sincronizados para ${result.ticker} (${result.timeframe})`,
        variant: 'default',
      });

      setModalOpen(false);
      onSyncCompleted?.(result.recordsSynced);
    } catch (error: any) {
      console.error('[INTRADAY SYNC ERROR]:', error);
      toast({
        title: 'Erro ao sincronizar',
        description: error.response?.data?.message || error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenModal}
        disabled={syncMutation.isPending}
      >
        {syncMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Sync Intraday
          </>
        )}
      </Button>

      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sincronizar Dados Intraday</DialogTitle>
            <DialogDescription>
              Busca dados de alta frequência (1m a 4h) da BRAPI e armazena no TimescaleDB.
              Limite FREE: 3 meses de histórico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Ticker Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticker" className="text-right">
                Ticker
              </Label>
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="PETR4"
                className="col-span-3"
                disabled={syncMutation.isPending}
              />
            </div>

            {/* Timeframe Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeframe" className="text-right">
                Timeframe
              </Label>
              <Select
                value={timeframe}
                onValueChange={(v) => setTimeframe(v as SyncIntradayTimeframe)}
                disabled={syncMutation.isPending}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SyncIntradayTimeframe.M1}>1 minuto</SelectItem>
                  <SelectItem value={SyncIntradayTimeframe.M5}>5 minutos</SelectItem>
                  <SelectItem value={SyncIntradayTimeframe.M15}>15 minutos</SelectItem>
                  <SelectItem value={SyncIntradayTimeframe.M30}>30 minutos</SelectItem>
                  <SelectItem value={SyncIntradayTimeframe.H1}>1 hora</SelectItem>
                  <SelectItem value={SyncIntradayTimeframe.H4}>4 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Range Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="range" className="text-right">
                Período
              </Label>
              <Select
                value={range}
                onValueChange={(v) => setRange(v as SyncIntradayRange)}
                disabled={syncMutation.isPending}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SyncIntradayRange.D1}>1 dia</SelectItem>
                  <SelectItem value={SyncIntradayRange.D5}>5 dias</SelectItem>
                  <SelectItem value={SyncIntradayRange.MO1}>1 mês</SelectItem>
                  <SelectItem value={SyncIntradayRange.MO3}>3 meses (máx FREE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={syncMutation.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Sincronizar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
