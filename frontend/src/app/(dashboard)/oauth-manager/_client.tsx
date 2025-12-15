'use client';

import { useState } from 'react';
import { useOAuthSession } from '@/hooks/useOAuthSession';
import { VncViewer } from './components/VncViewer';
import { OAuthProgress } from './components/OAuthProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayCircle, CheckCircle, XCircle, SkipForward, Save, AlertCircle, ArrowLeft, Navigation, Play, StopCircle } from 'lucide-react';

export function OAuthManagerPageClient() {
  const {
    session,
    isLoading,
    error,
    vncUrl,
    startSession,
    confirmLogin,
    skipSite,
    saveCookies,
    cancelSession,
    goBack,
    navigateToSite,
    clearError,
    currentSite,
    isSessionActive,
    canProceed,
    canGoBack,
  } = useOAuthSession();

  const handleStart = async () => {
    await startSession();
  };

  const handleConfirm = async () => {
    await confirmLogin();
  };

  const handleSkip = async () => {
    await skipSite('Usuário optou por pular');
  };

  const handleSave = async () => {
    await saveCookies();
  };

  const handleCancel = async () => {
    if (confirm('Tem certeza que deseja encerrar a sessão? Os cookies já coletados foram salvos automaticamente.')) {
      await cancelSession();
    }
  };

  const handleGoBack = async () => {
    await goBack();
  };

  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  const handleNavigateToSite = async () => {
    if (selectedSiteId) {
      await navigateToSite(selectedSiteId);
      setSelectedSiteId(''); // Reset selection
    }
  };

  const handleAutoProcess = async () => {
    setIsAutoProcessing(true);

    try {
      // Loop até processar todos os sites ou usuário cancelar
      while (session && session.current_site_index < session.total_sites - 1) {
        // Aguardar botão "Confirmar Login" estar habilitado (max 90s)
        const maxWait = 90000; // 90 segundos
        const startTime = Date.now();

        while (!canProceed && Date.now() - startTime < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s

          if (!isAutoProcessing) {
            // Usuário cancelou
            return;
          }
        }

        if (canProceed) {
          // Clicar em "Confirmar Login"
          await confirmLogin();

          // Aguardar 5s antes do próximo site
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          // Timeout - pular site
          await skipSite('Timeout - mais de 90 segundos aguardando login');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Processar último site
      if (canProceed) {
        await confirmLogin();
      }
    } finally {
      setIsAutoProcessing(false);
    }
  };

  const handleStopAutoProcess = () => {
    setIsAutoProcessing(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento OAuth</h1>
        <p className="text-muted-foreground mt-2">
          Renove os cookies de autenticação dos 21 sites de forma integrada via interface web
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sessão ativa órfã (backend tem sessão mas frontend não detectou) */}
      {error && error.includes('Já existe uma sessão OAuth ativa') && (
        <Card>
          <CardHeader>
            <CardTitle>Sessão OAuth Ativa Detectada</CardTitle>
            <CardDescription>
              Existe uma sessão OAuth ativa no backend. Você pode cancelá-la para iniciar uma nova ou reconectar-se a ela.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Se a sessão anterior foi interrompida, cancele-a para começar do zero.
                Se ainda está em andamento, recarregue a página para reconectar.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  await cancelSession();
                  clearError();
                }}
                disabled={isLoading}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Cancelar Sessão Existente
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nenhuma sessão - Iniciar nova */}
      {!isSessionActive && !session && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Renovação de Cookies</CardTitle>
            <CardDescription>
              Este processo irá abrir um navegador Chrome via VNC e guiá-lo através do login em 21 sites.
              Tempo estimado: 18-22 minutos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleStart}
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Iniciar Renovação
            </Button>
          </CardContent>
        </Card>
      )}

      {isSessionActive && vncUrl && session && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* VNC Viewer - 2/3 da largura */}
          <div className="lg:col-span-2 space-y-4">
            {/* Processamento Automático */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processamento Automático</CardTitle>
                <CardDescription>
                  Processa todos os 21 sites automaticamente. Aguarda 90s por site e pula em caso de timeout.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isAutoProcessing ? (
                  <Button
                    onClick={handleAutoProcess}
                    disabled={isLoading || !canProceed}
                    size="lg"
                    className="w-full"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Processar Todos Automaticamente
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopAutoProcess}
                    variant="destructive"
                    size="lg"
                    className="w-full"
                  >
                    <StopCircle className="mr-2 h-5 w-5" />
                    Parar Processamento Automático
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Seletor de Site Individual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navegação Manual</CardTitle>
                <CardDescription>
                  Selecione um site específico para processar manualmente (útil quando ocorrem erros)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um site..." />
                    </SelectTrigger>
                    <SelectContent>
                      {session.sites_progress.map((site) => (
                        <SelectItem key={site.site_id} value={site.site_id}>
                          {site.site_name} {site.status === 'completed' && '✓'} {site.status === 'failed' && '✗'} {site.status === 'skipped' && '⊘'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleNavigateToSite}
                    disabled={!selectedSiteId || isLoading || isAutoProcessing}
                    size="default"
                  >
                    <Navigation className="mr-2 h-4 w-4" />
                    Ir para Site
                  </Button>
                </div>
              </CardContent>
            </Card>

            <VncViewer
              vncUrl={vncUrl}
              currentSiteName={currentSite?.site_name}
              instructions={currentSite?.user_action_required ? 'Faça login no site e clique em "Confirmar Login" abaixo' : undefined}
            />

            {/* Botões de ação */}
            <div className="mt-4 space-y-3">
              {/* Linha 1: Voltar */}
              {canGoBack && (
                <Button
                  onClick={handleGoBack}
                  disabled={isLoading || isAutoProcessing}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar ao Site Anterior
                </Button>
              )}

              {/* Linha 2: Confirmar e Pular */}
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirm}
                  disabled={!canProceed || isLoading || isAutoProcessing}
                  size="lg"
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Confirmar Login {isAutoProcessing && '(Automático)'}
                </Button>

                <Button
                  onClick={handleSkip}
                  disabled={!canProceed || isLoading || isAutoProcessing}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <SkipForward className="mr-2 h-5 w-5" />
                  Pular Site
                </Button>
              </div>
            </div>

            {/* Botão Concluir Renovação - Cookies já salvos automaticamente */}
            <div className="mt-4 space-y-2">
              <Alert className="bg-muted border-muted-foreground/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  💾 Cookies salvos automaticamente após cada site
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                size="lg"
                className="w-full"
                variant="default"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Concluir Renovação
                {session.completed_sites > 0 && ` (${session.completed_sites}/${session.total_sites} sites)`}
              </Button>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Sessão
              </Button>
            </div>
          </div>

          {/* Progresso - 1/3 da largura */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso</CardTitle>
                <CardDescription>
                  {session.completed_sites} de {session.total_sites} sites concluídos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OAuthProgress
                  sites={session.sites_progress}
                  currentIndex={session.current_site_index}
                  progressPercentage={session.progress_percentage}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {session && session.status === 'completed' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Cookies salvos com sucesso! {session.total_cookies} cookies de {session.completed_sites} sites foram salvos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
