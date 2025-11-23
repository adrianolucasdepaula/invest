'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, TrendingUp } from 'lucide-react';
import { useStartIndividualSync } from '@/lib/hooks/useDataSync';
import { useToast } from '@/components/ui/use-toast';
import { useSyncWebSocket } from '@/lib/hooks/useSyncWebSocket';

interface IndividualSyncModalProps {
  ticker: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FASE 37: Modal para configurar período de sincronização individual
 *
 * Features:
 * - Ticker exibido (readonly)
 * - Campos startYear e endYear editáveis
 * - Validação: 1986-2025, startYear ≤ endYear
 * - Botão com loading state durante sincronização
 * - Toast notifications (sucesso + erro)
 * - Fecha automaticamente após sucesso
 *
 * @example
 * <IndividualSyncModal
 *   ticker="ABEV3"
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 * />
 */
export function IndividualSyncModal({
  ticker,
  isOpen,
  onClose,
}: IndividualSyncModalProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(2020); // Default: últimos 5 anos
  const [endYear, setEndYear] = useState(currentYear);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSyncStarted, setIsSyncStarted] = useState(false);

  const syncMutation = useStartIndividualSync();
  const { toast } = useToast();
  const { state: wsState } = useSyncWebSocket();

  /**
   * BUGFIX DEFINITIVO 2025-11-22: Fechar modal após sync:started (não após HTTP 200)
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

      // Toast de sucesso (início confirmado)
      toast({
        title: 'Sincronização iniciada',
        description: `${ticker}: Processamento em andamento. Acompanhe o progresso abaixo.`,
        variant: 'default',
      });

      // Fechar modal (reset do formulário acontece no useEffect de !isOpen)
      onClose();

      // Navegar para página principal
      router.push('/data-management');
    }
  }, [wsState.isRunning, syncMutation.isPending, isSyncStarted, ticker, toast, onClose, router]);

  /**
   * Reset isSyncStarted quando modal fecha
   */
  useEffect(() => {
    if (!isOpen) {
      setIsSyncStarted(false);
    }
  }, [isOpen]);

  /**
   * Validate year inputs
   */
  const validateInputs = (): boolean => {
    if (startYear < 1986 || startYear > 2025) {
      setValidationError('Ano inicial deve estar entre 1986 e 2025');
      return false;
    }
    if (endYear < 1986 || endYear > 2025) {
      setValidationError('Ano final deve estar entre 1986 e 2025');
      return false;
    }
    if (startYear > endYear) {
      setValidationError('Ano inicial não pode ser maior que ano final');
      return false;
    }
    setValidationError(null);
    return true;
  };

  /**
   * Handle sync button click
   *
   * BUGFIX DEFINITIVO 2025-11-22: Não aguarda conclusão HTTP 200
   * - Inicia mutation (React Query)
   * - WebSocket useEffect detecta sync:started e fecha modal
   * - HTTP 200 retorna em background e invalida cache
   * - Se erro acontecer, exibe toast (mutation não foi iniciada)
   */
  const handleSync = async () => {
    if (!ticker) return;
    if (!validateInputs()) return;

    try {
      // Iniciar mutation (não aguarda conclusão)
      // WebSocket useEffect detectará sync:started e fechará modal automaticamente
      syncMutation.mutate({
        ticker,
        startYear,
        endYear,
      });
    } catch (error: any) {
      console.error(`[SYNC ERROR] ${ticker}:`, error);
      toast({
        title: 'Erro ao iniciar sincronização',
        description: error?.response?.data?.message || `Falha ao iniciar sincronização de ${ticker}`,
        variant: 'destructive',
      });
    }
  };

  /**
   * Reset form when modal closes
   */
  const handleClose = () => {
    setStartYear(2020);
    setEndYear(currentYear);
    setValidationError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Sincronização Individual</span>
          </DialogTitle>
          <DialogDescription>
            Configure o período de sincronização para o ativo <strong>{ticker}</strong>.
            Os dados serão buscados do COTAHIST B3 (fonte oficial).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ticker (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="ticker">Ativo</Label>
            <Input
              id="ticker"
              value={ticker || ''}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          {/* Start Year */}
          <div className="space-y-2">
            <Label htmlFor="startYear" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Ano Inicial</span>
            </Label>
            <Input
              id="startYear"
              type="number"
              min={1986}
              max={2025}
              value={startYear}
              onChange={(e) => {
                setStartYear(parseInt(e.target.value) || 1986);
                setValidationError(null);
              }}
              placeholder="2020"
            />
            <p className="text-xs text-muted-foreground">
              Entre 1986 e 2025 (início do COTAHIST até atual)
            </p>
          </div>

          {/* End Year */}
          <div className="space-y-2">
            <Label htmlFor="endYear" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Ano Final</span>
            </Label>
            <Input
              id="endYear"
              type="number"
              min={1986}
              max={2025}
              value={endYear}
              onChange={(e) => {
                setEndYear(parseInt(e.target.value) || currentYear);
                setValidationError(null);
              }}
              placeholder={currentYear.toString()}
            />
            <p className="text-xs text-muted-foreground">
              Entre 1986 e {currentYear} (ano atual)
            </p>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          )}

          {/* Info Card */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="text-sm font-medium">Informações da Sincronização</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Período: {startYear} - {endYear} ({endYear - startYear + 1} anos)</li>
              <li>• Fonte: COTAHIST B3 (dados oficiais)</li>
              <li>• Duração estimada: ~10-15 segundos</li>
              <li>• Registros esperados: ~{(endYear - startYear + 1) * 240} pontos</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={syncMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending || !ticker}
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              'Iniciar Sincronização'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
