'use client';

import { useOAuthSession } from '@/hooks/useOAuthSession';
import { VncViewer } from './components/VncViewer';
import { OAuthProgress } from './components/OAuthProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlayCircle, CheckCircle, XCircle, SkipForward, Save, AlertCircle } from 'lucide-react';

export default function OAuthManagerPage() {
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
    currentSite,
    isSessionActive,
    canProceed,
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
    if (confirm('Tem certeza que deseja cancelar? Os cookies não serão salvos.')) {
      await cancelSession();
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento OAuth</h1>
        <p className="text-muted-foreground mt-2">
          Renove os cookies de autenticação dos 19 sites de forma integrada via interface web
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isSessionActive && !session && (
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Renovação de Cookies</CardTitle>
            <CardDescription>
              Este processo irá abrir um navegador Chrome via VNC e guiá-lo através do login em 19 sites.
              Tempo estimado: 15-20 minutos
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
          <div className="lg:col-span-2">
            <VncViewer
              vncUrl={vncUrl}
              currentSiteName={currentSite?.site_name}
              instructions={currentSite?.user_action_required ? 'Faça login no site e clique em "Confirmar Login" abaixo' : undefined}
            />

            {/* Botões de ação */}
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleConfirm}
                disabled={!canProceed || isLoading}
                size="lg"
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirmar Login
              </Button>

              <Button
                onClick={handleSkip}
                disabled={!canProceed || isLoading}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <SkipForward className="mr-2 h-5 w-5" />
                Pular Site
              </Button>
            </div>

            {session.progress_percentage === 100 && (
              <div className="mt-4">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                  variant="default"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Cookies e Finalizar
                </Button>
              </div>
            )}

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
