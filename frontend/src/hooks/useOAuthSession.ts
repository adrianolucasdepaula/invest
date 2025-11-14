'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export interface SiteProgress {
  site_id: string;
  site_name: string;
  status: 'pending' | 'in_progress' | 'waiting_user' | 'completed' | 'skipped' | 'failed';
  cookies_count: number;
  error_message?: string;
  user_action_required: boolean;
}

export interface OAuthSessionData {
  session_id: string;
  status: string;
  current_site_index: number;
  current_site: string | null;
  sites_progress: SiteProgress[];
  progress_percentage: number;
  total_sites: number;
  completed_sites: number;
  failed_sites: number;
  skipped_sites: number;
  total_cookies: number;
  vnc_url: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface UseOAuthSessionReturn {
  // State
  session: OAuthSessionData | null;
  isLoading: boolean;
  error: string | null;
  vncUrl: string | null;

  // Actions
  startSession: () => Promise<void>;
  confirmLogin: () => Promise<void>;
  skipSite: (reason?: string) => Promise<void>;
  saveCookies: () => Promise<void>;
  cancelSession: () => Promise<void>;
  refreshStatus: () => Promise<void>;

  // Computed
  currentSite: SiteProgress | null;
  isSessionActive: boolean;
  canProceed: boolean;
}

/**
 * Hook para gerenciar sessão OAuth
 *
 * Fornece estado e métodos para controlar o fluxo de renovação de cookies OAuth
 */
export function useOAuthSession(): UseOAuthSessionReturn {
  const [session, setSession] = useState<OAuthSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Iniciar nova sessão OAuth
   */
  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.oauth.startSession();

      if (result.success) {
        setSession(result.session);
        setVncUrl(result.session.vnc_url);

        toast({
          title: 'Sessão iniciada',
          description: result.message || 'Navegador Chrome aberto. Acesse o visualizador VNC.',
        });
      } else {
        throw new Error(result.error || 'Falha ao iniciar sessão');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Erro ao iniciar sessão';
      setError(errorMsg);

      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Atualizar status da sessão
   */
  const refreshStatus = useCallback(async () => {
    try {
      const result = await api.oauth.getSessionStatus();

      if (result.success && result.session) {
        setSession(result.session);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
    }
  }, []);

  /**
   * Confirmar login no site atual
   */
  const confirmLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.oauth.confirmLogin();

      if (result.success) {
        toast({
          title: 'Login confirmado',
          description: result.message || `${result.cookies_collected} cookies coletados`,
        });

        // Atualizar status
        await refreshStatus();

        // Se não há próximo site, avisar
        if (!result.has_next_site) {
          toast({
            title: 'Último site concluído',
            description: 'Todos os sites foram processados. Clique em "Salvar Cookies" para finalizar.',
          });
        }
      } else {
        throw new Error(result.error || 'Falha ao confirmar login');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Erro ao confirmar login';
      setError(errorMsg);

      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshStatus]);

  /**
   * Pular site atual
   */
  const skipSite = useCallback(
    async (reason?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await api.oauth.skipSite(reason);

        if (result.success) {
          toast({
            title: 'Site pulado',
            description: `${result.skipped_site} foi pulado`,
          });

          // Atualizar status
          await refreshStatus();

          // Se não há próximo site, avisar
          if (!result.has_next_site) {
            toast({
              title: 'Último site pulado',
              description: 'Todos os sites foram processados. Clique em "Salvar Cookies" para finalizar.',
            });
          }
        } else {
          throw new Error(result.error || 'Falha ao pular site');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || err.message || 'Erro ao pular site';
        setError(errorMsg);

        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, refreshStatus]
  );

  /**
   * Salvar cookies e finalizar sessão
   */
  const saveCookies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.oauth.saveCookies();

      if (result.success) {
        const summary = result.session_summary;

        toast({
          title: 'Cookies salvos com sucesso!',
          description: `${summary.total_cookies} cookies de ${summary.completed_sites} sites salvos`,
        });

        // Atualizar status final
        await refreshStatus();

        // Limpar sessão após 2 segundos
        setTimeout(() => {
          setSession(null);
          setVncUrl(null);
        }, 2000);
      } else {
        throw new Error(result.error || 'Falha ao salvar cookies');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Erro ao salvar cookies';
      setError(errorMsg);

      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshStatus]);

  /**
   * Cancelar sessão
   */
  const cancelSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.oauth.cancelSession();

      if (result.success) {
        toast({
          title: 'Sessão cancelada',
          description: 'A sessão OAuth foi cancelada',
        });

        setSession(null);
        setVncUrl(null);
      } else {
        throw new Error(result.error || 'Falha ao cancelar sessão');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Erro ao cancelar sessão';
      setError(errorMsg);

      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Computed properties
  const currentSite = session?.sites_progress[session.current_site_index] || null;

  const isSessionActive =
    session !== null &&
    !['completed', 'error', 'cancelled'].includes(session.status);

  const canProceed =
    isSessionActive &&
    currentSite !== null &&
    currentSite.status === 'waiting_user';

  // Carregar sessão existente ao montar componente
  useEffect(() => {
    let mounted = true;

    const loadExistingSession = async () => {
      try {
        const result = await api.oauth.getSessionStatus();

        if (mounted && result.success && result.session) {
          // Só atualiza se há uma sessão ativa no backend
          const activeStatuses = ['waiting_user', 'in_progress', 'processing'];
          if (activeStatuses.includes(result.session.status)) {
            setSession(result.session);
            setVncUrl(result.session.vnc_url);
          }
        }
      } catch (err) {
        // Ignora erro (não há sessão ativa)
      }
    };

    loadExistingSession();

    return () => {
      mounted = false;
    };
  }, []); // Executa apenas uma vez ao montar

  // Auto-refresh status quando sessão está ativa (após computed properties)
  useEffect(() => {
    if (!session || !isSessionActive) return;

    const interval = setInterval(async () => {
      await refreshStatus();
    }, 3000); // Refresh a cada 3 segundos

    return () => clearInterval(interval);
  }, [session, isSessionActive, refreshStatus]);

  return {
    // State
    session,
    isLoading,
    error,
    vncUrl,

    // Actions
    startSession,
    confirmLogin,
    skipSite,
    saveCookies,
    cancelSession,
    refreshStatus,

    // Computed
    currentSite,
    isSessionActive,
    canProceed,
  };
}
