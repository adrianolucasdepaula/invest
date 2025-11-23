'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useStartBulkSync } from '@/lib/hooks/useDataSync';
import { useSyncWebSocket } from '@/lib/hooks/useSyncWebSocket';
import { SyncConfigModal } from './SyncConfigModal';

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
  const { toast } = useToast();
  const syncMutation = useStartBulkSync();
  const { state: wsState } = useSyncWebSocket();

  /**
   * BUGFIX 2025-11-23: Fechar modal após sync:started (não após HTTP 200)
   * MESMA CORREÇÃO aplicada em IndividualSyncModal (commit 465664d)
   *
   * Comportamento correto (feedback do usuário):
   * 1. Usuário clica "Iniciar Sincronização"
   * 2. Backend emite evento WebSocket 'sync:started'
   * 3. Modal fecha automaticamente
   * 4. Navega para /data-management
   * 5. Progresso exibido em tempo real na página principal
   * 6. HTTP 200 retorna em background (invalida cache React Query)
   */
  useEffect(() => {
    // Detectar quando sync iniciou (WebSocket) E mutation está rodando E ainda não fechou modal
    if (wsState.isRunning && syncMutation.isPending && !isSyncStarted) {
      setIsSyncStarted(true);

      // Capturar valores ANTES de fechar modal (evita bug toast)
      const tickersCount = syncMutation.variables?.tickers?.length || 0;

      // Toast de sucesso (início confirmado)
      toast({
        title: 'Sincronização iniciada',
        description: `${tickersCount} ativo(s) em processamento. Acompanhe o progresso abaixo.`,
        variant: 'default',
      });

      // Fechar modal (reset do formulário acontece no useEffect de !modalOpen)
      setModalOpen(false);

      // Navegar para página principal
      router.push('/data-management');

      // Callback
      if (onSyncStarted) {
        onSyncStarted();
      }
    }
  }, [wsState.isRunning, syncMutation.isPending, isSyncStarted, syncMutation.variables, toast, onSyncStarted, router]);

  /**
   * Reset isSyncStarted quando modal fecha
   */
  useEffect(() => {
    if (!modalOpen) {
      setIsSyncStarted(false);
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
    if (!syncMutation.isPending) {
      setModalOpen(false);
    }
  };

  /**
   * Handle sync confirmation
   *
   * BUGFIX 2025-11-23: Não aguarda conclusão HTTP 200
   * - Inicia mutation (React Query)
   * - WebSocket useEffect detecta sync:started e fecha modal
   * - HTTP 200 retorna em background e invalida cache
   * - Se erro acontecer, exibe toast (mutation não foi iniciada)
   */
  const handleConfirm = (config: {
    tickers: string[];
    startDate: string;
    endDate: string;
  }) => {
    try {
      // Convert dates to years for API compatibility
      const startYear = parseInt(config.startDate.split('-')[0], 10);
      const endYear = parseInt(config.endDate.split('-')[0], 10);

      // ✅ CORREÇÃO: mutate (não mutateAsync) - não aguarda HTTP 200
      // WebSocket useEffect detectará sync:started e fechará modal automaticamente
      syncMutation.mutate({
        tickers: config.tickers,
        startYear,
        endYear,
      });

      // ❌ REMOVIDO: setModalOpen(false) - será fechado pelo useEffect
      // ❌ REMOVIDO: toast(...) - será mostrado pelo useEffect
      // ❌ REMOVIDO: if (onSyncStarted) - será chamado pelo useEffect
    } catch (error: any) {
      // Erro só acontece se validação falhar (não erro HTTP)
      console.error('[BULK SYNC ERROR]:', error);
      toast({
        title: 'Erro ao iniciar sincronização',
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
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
        isSubmitting={syncMutation.isPending}
      />
    </>
  );
}
