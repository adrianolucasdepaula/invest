'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useStartBulkSync } from '@/lib/hooks/useDataSync';
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
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const syncMutation = useStartBulkSync();

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
   */
  const handleConfirm = async (config: {
    tickers: string[];
    startDate: string;
    endDate: string;
  }) => {
    try {
      // Convert dates to years for API compatibility
      const startYear = parseInt(config.startDate.split('-')[0], 10);
      const endYear = parseInt(config.endDate.split('-')[0], 10);

      // Call mutation
      const result = await syncMutation.mutateAsync({
        tickers: config.tickers,
        startYear,
        endYear,
      });

      // Close modal
      setModalOpen(false);

      // Show success toast
      toast({
        title: 'Sincronização iniciada',
        description: result.message || `${result.totalTickers} ativo(s) em processamento`,
        variant: 'default',
      });

      // Call callback
      if (onSyncStarted) {
        onSyncStarted();
      }
    } catch (error: any) {
      // Show error toast
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
