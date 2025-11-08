'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, AlertTriangle, CheckCircle2, RefreshCw, Info, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CookieStatus {
  exists: boolean;
  age?: number; // in days
  expiresIn?: number; // in days
  lastUpdated?: string;
  isExpired: boolean;
  needsRenewal: boolean;
}

export default function CookieStatusBanner() {
  const [cookieStatus, setCookieStatus] = useState<CookieStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchCookieStatus();
  }, []);

  const fetchCookieStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cookies/status');
      if (response.ok) {
        const data = await response.json();
        setCookieStatus(data);
      } else {
        // If endpoint doesn't exist, set default status
        setCookieStatus({
          exists: false,
          isExpired: true,
          needsRenewal: true,
        });
      }
    } catch (error) {
      console.error('Error fetching cookie status:', error);
      // Set default status on error
      setCookieStatus({
        exists: false,
        isExpired: true,
        needsRenewal: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verificando status dos cookies...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cookieStatus || dismissed) {
    return null;
  }

  const getStatusColor = () => {
    if (cookieStatus.isExpired) return 'bg-red-50 border-red-200';
    if (cookieStatus.needsRenewal) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (cookieStatus.isExpired) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (cookieStatus.needsRenewal) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  };

  const getStatusMessage = () => {
    if (cookieStatus.isExpired || !cookieStatus.exists) {
      return 'Cookies do Google OAuth expirados ou não encontrados';
    }
    if (cookieStatus.needsRenewal) {
      return 'Cookies do Google OAuth precisam ser renovados em breve';
    }
    return 'Cookies do Google OAuth válidos e atualizados';
  };

  return (
    <>
      <Card className={getStatusColor()}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon()}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Status dos Cookies OAuth</h3>
                  {cookieStatus.exists && !cookieStatus.isExpired && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Ativo
                    </Badge>
                  )}
                  {cookieStatus.isExpired && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                      Expirado
                    </Badge>
                  )}
                  {cookieStatus.needsRenewal && !cookieStatus.isExpired && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Renovar em breve
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
                {cookieStatus.exists && !cookieStatus.isExpired && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {cookieStatus.age !== undefined && (
                      <span>Idade: {cookieStatus.age} dias</span>
                    )}
                    {cookieStatus.expiresIn !== undefined && (
                      <span>Expira em: {cookieStatus.expiresIn} dias</span>
                    )}
                    {cookieStatus.lastUpdated && (
                      <span>Última atualização: {new Date(cookieStatus.lastUpdated).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructions(true)}
              >
                <Info className="h-4 w-4 mr-2" />
                Instruções
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchCookieStatus}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Modal */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Instruções de Renovação de Cookies OAuth
            </DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para renovar os cookies do Google OAuth e habilitar os scrapers que requerem autenticação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Overview Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Por que renovar cookies?</AlertTitle>
              <AlertDescription>
                {SCRAPERS.filter((s: any) => s.auth === 'oauth').length} dos {SCRAPERS.length} scrapers utilizam Google OAuth para autenticação.
                Os cookies precisam ser renovados periodicamente para manter o acesso a essas fontes de dados.
              </AlertDescription>
            </Alert>

            {/* Step-by-step instructions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Passo a Passo:</h3>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Acesse o container de scrapers</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
                      docker exec -it invest_scrapers bash
                    </pre>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Execute o script de renovação</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
                      python /app/save_google_cookies.py
                    </pre>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Faça login com sua conta Google</h4>
                    <p className="text-sm text-muted-foreground">
                      Uma janela do Chrome será aberta. Faça login com sua conta Google e autorize o acesso aos sites necessários.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Verifique o status</h4>
                    <p className="text-sm text-muted-foreground">
                      Após salvar os cookies, volte a esta página e clique no botão de atualização para verificar o novo status.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Affected Scrapers */}
            <div className="space-y-2">
              <h3 className="font-semibold">Scrapers afetados (OAuth):</h3>
              <div className="grid grid-cols-2 gap-2">
                {SCRAPERS.filter((s: any) => s.auth === 'oauth').map((scraper: any) => (
                  <div key={scraper.id} className="flex items-center gap-2 text-sm">
                    <Cookie className="h-3 w-3 text-muted-foreground" />
                    <span>{scraper.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Notas Importantes</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>• Os cookies precisam ser renovados a cada 30-60 dias</p>
                <p>• Certifique-se de que o container de scrapers está em execução</p>
                <p>• Use a mesma conta Google para todos os sites OAuth</p>
                <p>• Após renovar, teste os scrapers OAuth para confirmar funcionamento</p>
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowInstructions(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setShowInstructions(false);
              fetchCookieStatus();
            }}>
              Verificar Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Import scrapers list for instructions
const SCRAPERS = [
  { id: 'fundamentus', name: 'Fundamentus', category: 'fundamental', auth: 'public', status: 'implemented' },
  { id: 'investsite', name: 'Investsite', category: 'fundamental', auth: 'public', status: 'implemented' },
  { id: 'statusinvest', name: 'StatusInvest', category: 'fundamental', auth: 'oauth', status: 'implemented' },
  { id: 'fundamentei', name: 'Fundamentei', category: 'fundamental', auth: 'oauth', status: 'implemented' },
  { id: 'investidor10', name: 'Investidor10', category: 'fundamental', auth: 'oauth', status: 'implemented' },
  { id: 'investing', name: 'Investing.com', category: 'market', auth: 'oauth', status: 'implemented' },
  { id: 'advfn', name: 'ADVFN', category: 'market', auth: 'oauth', status: 'implemented' },
  { id: 'googlefinance', name: 'Google Finance', category: 'market', auth: 'oauth', status: 'implemented' },
  { id: 'tradingview', name: 'TradingView', category: 'market', auth: 'oauth', status: 'implemented' },
  { id: 'b3', name: 'B3', category: 'official', auth: 'public', status: 'implemented' },
  { id: 'bcb', name: 'BCB (Banco Central)', category: 'official', auth: 'public', status: 'implemented' },
  { id: 'griffin', name: 'Griffin', category: 'insider', auth: 'public', status: 'implemented' },
  { id: 'coinmarketcap', name: 'CoinMarketCap', category: 'crypto', auth: 'public', status: 'implemented' },
  { id: 'opcoes', name: 'Opcoes.net.br', category: 'options', auth: 'credentials', status: 'implemented' },
  { id: 'chatgpt', name: 'ChatGPT', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'gemini', name: 'Gemini', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'deepseek', name: 'DeepSeek', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'claude', name: 'Claude', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'grok', name: 'Grok', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'bloomberg', name: 'Bloomberg Línea', category: 'news', auth: 'public', status: 'implemented' },
  { id: 'googlenews', name: 'Google News', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'investing_news', name: 'Investing News', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'valor', name: 'Valor Econômico', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'exame', name: 'Exame', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'infomoney', name: 'InfoMoney', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'estadao', name: 'Estadão Investidor', category: 'institutional', auth: 'oauth', status: 'implemented' },
  { id: 'maisretorno', name: 'Mais Retorno', category: 'institutional', auth: 'oauth', status: 'implemented' },
];
