'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User,
  Bell,
  Database,
  Shield,
  Palette,
  Save,
  Mail,
  Key,
} from 'lucide-react';

export function SettingsPageClient() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'api' | 'security'>('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da plataforma
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="space-y-2">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('profile')}
          >
            <User className="mr-2 h-4 w-4" />
            Perfil
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </Button>
          <Button
            variant={activeTab === 'api' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('api')}
          >
            <Database className="mr-2 h-4 w-4" />
            Integrações API
          </Button>
          <Button
            variant={activeTab === 'security' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('security')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Segurança
          </Button>
        </div>

        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações do Perfil</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome</label>
                        <Input placeholder="Seu nome completo" defaultValue="Usuário" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          defaultValue="user@example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Biografia</label>
                      <textarea
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Conte um pouco sobre você..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Preferências de Exibição</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Tema Escuro</label>
                        <p className="text-sm text-muted-foreground">
                          Ativar tema escuro na interface
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Modo Compacto</label>
                        <p className="text-sm text-muted-foreground">
                          Reduzir espaçamento entre elementos
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notificações por Email</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Relatórios Prontos</label>
                        <p className="text-sm text-muted-foreground">
                          Receber email quando relatórios forem gerados
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Análises Concluídas</label>
                        <p className="text-sm text-muted-foreground">
                          Notificar quando análises forem finalizadas
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Alertas de Preço</label>
                        <p className="text-sm text-muted-foreground">
                          Alertas quando ativos atingirem preços alvo
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" defaultChecked />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Notificações por Telegram</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bot Token</label>
                      <Input placeholder="Cole aqui o token do seu bot do Telegram" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chat ID</label>
                      <Input placeholder="Cole aqui o ID do chat" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Ativar Telegram</label>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações via Telegram
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Chaves de API</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">OpenAI API Key</label>
                      <Input type="password" placeholder="sk-..." />
                      <p className="text-xs text-muted-foreground">
                        Necessária para geração de relatórios com IA
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BRAPI Token</label>
                      <Input type="password" placeholder="Cole aqui seu token da BRAPI" />
                      <p className="text-xs text-muted-foreground">
                        Token para acessar dados da BRAPI
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Credenciais de Fontes</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status Invest - Email</label>
                        <Input type="email" placeholder="seu@email.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status Invest - Senha</label>
                        <Input type="password" placeholder="********" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Investidor10 - Email</label>
                        <Input type="email" placeholder="seu@email.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Investidor10 - Senha</label>
                        <Input type="password" placeholder="********" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Credenciais
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Alterar Senha</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Senha Atual</label>
                      <Input type="password" placeholder="********" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nova Senha</label>
                      <Input type="password" placeholder="********" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirmar Nova Senha</label>
                      <Input type="password" placeholder="********" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Autenticação em Dois Fatores</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Ativar 2FA</label>
                        <p className="text-sm text-muted-foreground">
                          Adicionar camada extra de segurança
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Sessões Ativas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Chrome - Windows</p>
                        <p className="text-xs text-muted-foreground">
                          São Paulo, Brasil • Última atividade: Agora
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Encerrar
                      </Button>
                    </div>
                  </div>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
