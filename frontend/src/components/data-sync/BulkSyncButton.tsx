'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useStartBulkSync, useStartIntradayBulkSync } from '@/lib/hooks/useDataSync';
import { useSyncWebSocket } from '@/lib/hooks/useSyncWebSocket';
import { SyncConfigModal } from './SyncConfigModal';
import { SyncIntradayTimeframe, SyncIntradayRange } from '@/lib/types/data-sync';

/**
 * Props for BulkSyncButton
 */
export interface BulkSyncButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSyncStarted?: () => void;
}

/**
 * Component: BulkSyncButton
 *
 * Primary action button to trigger bulk sync operations.
 * Features:
 * - Opens SyncConfigModal on click
 * - Calls useStartBulkSync() mutation
 * - Shows toast notifications (success/error)
 * - Disabled state while sync is running
 * - Callback when sync starts successfully
 */
export function BulkSyncButton({
  variant = 'default',
  size = 'default',
  className,
  onSyncStarted,
}: BulkSyncButtonProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSyncStarted, setIsSyncStarted] = useState(false);
  // FIX: Local state to track if we are waiting for sync to start (persists after HTTP 202)
  const [waitingForSyncStart, setWaitingForSyncStart] = useState(false);

  const { toast } = useToast();
  const syncMutation = useStartBulkSync();
  const intradaySyncMutation = useStartIntradayBulkSync();
  const { state: wsState } = useSyncWebSocket();

  // Check if any mutation is pending (needed for UI state)
  const isPending = syncMutation.isPending || intradaySyncMutation.isPending;

  /**
   * BUGFIX DEFINITIVO 2025-11-23: Race Condition Fix
   *
   * Problema anterior: `startBulkSync` retorna HTTP 202 (Accepted) imediatamente,
   * fazendo `syncMutation.isPending` virar false ANTES do evento WebSocket `sync:started` chegar.
   * Isso impedia o fechamento do modal.
   *
   * Solução: Usar `waitingForSyncStart` que é setado true no clique e só vira false
   * quando o WebSocket confirma o início.
   */
  useEffect(() => {
    // Debug logs
    if (waitingForSyncStart || wsState.isRunning) {
      console.log('[BULK SYNC] State update:', {
        waitingForSyncStart,
        wsRunning: wsState.isRunning,
        mutationPending: syncMutation.isPending,
        isSyncStarted,
      });
    }

    // Se estamos aguardando início E o WebSocket confirmou que está rodando
    if (wsState.isRunning && waitingForSyncStart && !isSyncStarted) {
      console.log('[BULK SYNC] Sync started confirmed via WebSocket!');
      setIsSyncStarted(true);
      setWaitingForSyncStart(false);

      // Capturar valores
      const tickersCount = syncMutation.variables?.tickers?.length || 0;

      // Toast de sucesso
      toast({
        title: 'Sincronização iniciada',
        description: `${tickersCount} ativo(s) em processamento. Acompanhe o progresso abaixo.`,
        variant: 'default',
      });

      // Fechar modal e navegar
      setModalOpen(false);
      router.push('/data-management');

      // Callback
      if (onSyncStarted) {
        onSyncStarted();
      }
    }
  }, [
    wsState.isRunning,
    waitingForSyncStart,
    isSyncStarted,
    syncMutation.variables,
    syncMutation.isPending,
    toast,
    onSyncStarted,
    router,
  ]);

  /**
   * Reset states quando modal fecha ou abre
   */
  useEffect(() => {
    if (!modalOpen) {
      setIsSyncStarted(false);
      setWaitingForSyncStart(false);
    }
  }, [modalOpen]);

  /**
   * Handle modal open
   */
  const handleOpenModal = () => {
    setModalOpen(true);
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    if (!isPending && !waitingForSyncStart) {
      setModalOpen(false);
    }
  };

  /**
   * Handle sync confirmation
   */
  const handleConfirm = (config: { tickers: string[]; startDate: string; endDate: string }) => {
    try {
      const startYear = parseInt(config.startDate.split('-')[0], 10);
      const endYear = parseInt(config.endDate.split('-')[0], 10);

      // Set waiting flag BEFORE mutation
      setWaitingForSyncStart(true);

      console.log('[BULK SYNC] Payload:', { tickers: config.tickers, startYear, endYear });

      syncMutation.mutate(
        {
          tickers: config.tickers,
          startYear,
          endYear,
        },
        {
          onError: (error: any) => {
            console.error('[BULK SYNC ERROR]:', error);
            setWaitingForSyncStart(false); // Reset on error
            toast({
              title: 'Erro ao iniciar sincronização',
              description: error.message || 'Ocorreu um erro inesperado.',
              variant: 'destructive',
            });
          },
        }
      );
    } catch (error: any) {
      console.error('[BULK SYNC ERROR]:', error);
      setWaitingForSyncStart(false);
      toast({
        title: 'Erro ao iniciar sincronização',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle intraday sync confirmation
   */
  const handleConfirmIntraday = (config: {
    tickers: string[];
    timeframe: SyncIntradayTimeframe;
    range: SyncIntradayRange;
  }) => {
    try {
      // Set waiting flag BEFORE mutation
      setWaitingForSyncStart(true);

      console.log('[INTRADAY BULK SYNC] Payload:', config);

      intradaySyncMutation.mutate(
        {
          tickers: config.tickers,
          timeframe: config.timeframe,
          range: config.range,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Sincronização Intraday iniciada',
              description: `${config.tickers.length} ativo(s) em processamento.`,
              variant: 'default',
            });
            setModalOpen(false);
            setWaitingForSyncStart(false);
            router.push('/data-management');
            if (onSyncStarted) {
              onSyncStarted();
            }
          },
          onError: (error: any) => {
            console.error('[INTRADAY BULK SYNC ERROR]:', error);
            setWaitingForSyncStart(false);
            toast({
              title: 'Erro ao iniciar sincronização intraday',
              description: error.message || 'Ocorreu um erro inesperado.',
              variant: 'destructive',
            });
          },
        }
      );
    } catch (error: any) {
      console.error('[INTRADAY BULK SYNC ERROR]:', error);
      setWaitingForSyncStart(false);
      toast({
        title: 'Erro ao iniciar sincronização intraday',
        description: error.message || 'Ocorreu um erro inesperado.',
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
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar em Massa
          </>
        )}
      </Button>

      <SyncConfigModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        onConfirmIntraday={handleConfirmIntraday}
        isSubmitting={isPending}
      />
    </>
  );
}
