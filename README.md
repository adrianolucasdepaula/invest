# B3 AI Analysis Platform

[![Playwright Tests](https://github.com/adrianolucasdepaula/invest/actions/workflows/playwright.yml/badge.svg)](https://github.com/adrianolucasdepaula/invest/actions/workflows/playwright.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)

Plataforma completa de análise de investimentos B3 com Inteligência Artificial para análise fundamentalista, técnica, macroeconômica e gestão de portfólio.

---

## 🚀 Características

### Análises Disponíveis
- **Análise Fundamentalista**: Indicadores de valuation, endividamento, eficiência, rentabilidade e crescimento
- **Análise Técnica/Gráfica**: Indicadores técnicos, padrões gráficos e análise de tendências
- **Análise Macroeconômica**: Impactos macroeconômicos nos ativos
- **Análise de Sentimento**: Análise de notícias e sentimento do mercado
- **Análise de Correlações**: Correlações entre ativos e índices
- **Análise de Opções**: Vencimentos, volatilidade implícita, IV Rank, prêmios
- **Análise de Insiders**: Movimentações de insiders
- **Análise de Dividendos**: Calendário de dividendos e impactos
- **Análise de Riscos**: Avaliação completa de riscos

### Funcionalidades
- ✅ Coleta de dados em tempo real de múltiplas fontes
- ✅ Validação cruzada de dados (mínimo 3 fontes)
- ✅ Armazenamento histórico de dados
- ✅ Dashboard interativo para tomada de decisão
- ✅ Geração de relatórios completos com IA
- ✅ Gerenciamento de portfólio multi-ativos
- ✅ Importação de portfólios (Kinvo, Investidor10, B3, MyProfit, NuInvest, Binance)
- ✅ Sugestões de compra/venda com IA
- ✅ Alertas e notificações personalizadas

### Fontes de Dados (6 Implementadas + 25 Planejadas)

**Análise Fundamentalista (6 implementadas):**
- ✅ Fundamentus (público)
- ✅ BRAPI (API pública)
- ✅ StatusInvest (OAuth Google)
- ✅ Investidor10 (OAuth Google)
- ✅ Fundamentei (OAuth Google)
- ✅ Investsite (público)

**Outras Categorias (25 planejadas):**
- Mercado Geral: Investing.com, ADVFN, Google Finance
- Análise Técnica: TradingView
- Opções: Opcoes.net.br
- Criptomoedas: CoinMarketCap
- Insiders: Griffin
- Relatórios: BTG, XP, Estadão, Mais Retorno
- Dados Oficiais: B3, Banco Central
- IA: ChatGPT, DeepSeek, Gemini, Claude, Grok
- Notícias: Google News, Bloomberg, Investing, Valor, Exame, InfoMoney

📚 **Documentação completa:** Ver `ARCHITECTURE.md` seção "Fontes de Dados" para detalhes.

---

## 🏗️ Arquitetura

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │ ←──→ │   NestJS    │ ←──→ │ PostgreSQL  │
│  Frontend   │      │   Backend   │      │  Database   │
│   :3100     │      │    :3101    │      │   :5532     │
└─────────────┘      └─────────────┘      └─────────────┘
                            ↓
                     ┌─────────────┐
                     │   BullMQ    │
                     │   + Redis   │
                     │    :6479    │
                     └─────────────┘
                            ↓
                     ┌─────────────┐
                     │  Python     │
                     │  Scrapers   │
                     │  (Selenium) │
                     └─────────────┘
```

📚 **Arquitetura detalhada:** Ver `ARCHITECTURE.md` para stack completa, estrutura de pastas e fluxos de dados.

---

## 📚 Documentação Técnica

Para informações detalhadas sobre o projeto, consulte:

- **`INSTALL.md`** - Guia completo de instalação e configuração (portas, serviços, variáveis de ambiente)
- **`ARCHITECTURE.md`** - Arquitetura completa, stack tecnológica e fluxos de dados
- **`DATABASE_SCHEMA.md`** - Schema do banco de dados, relacionamentos e indexes
- **`ROADMAP.md`** - Histórico de desenvolvimento (53 fases, 98.1% completo)
- **`TROUBLESHOOTING.md`** - Guia de resolução de problemas (16+ soluções)
- **`CONTRIBUTING.md`** - Convenções de código, Git workflow e como contribuir
- **`CHECKLIST_TODO_MASTER.md`** - Checklist e TODO master (obrigatório antes de cada fase)
- **`claude.md`** - Instruções para Claude Code (metodologia e padrões)
- **`MCPS_ANTI_TRUNCAMENTO_GUIA.md`** - Guia completo MCPs (Playwright, Chrome DevTools) - Configuração 200k tokens
- **`.claude/agents/README.md`** - Sub-agents especializados (Backend, Frontend, Scrapers, Charts, TypeScript)

---

## 🛠️ Tecnologias

### Backend
- **NestJS 10.x** - Framework Node.js
- **TypeScript 5.x** - Tipagem estática
- **PostgreSQL 16** - Banco de dados relacional
- **TypeORM 0.3.x** - ORM
- **BullMQ** - Sistema de filas
- **Redis 7.x** - Cache e filas
- **Python 3.11** - Scrapers com Playwright

### Frontend
- **Next.js 14** - Framework React (App Router)
- **TypeScript 5.x** - Tipagem estática
- **TailwindCSS 3.x** - Framework CSS
- **Shadcn/UI** - Componentes UI
- **React Query** - Gerenciamento de estado
- **Recharts** - Gráficos e visualizações
- **Socket.io** - Real-time updates

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **GitHub Actions** - CI/CD (planejado)

---

## 🚀 Getting Started

### Pré-requisitos
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Instalação Rápida (Docker)

```bash
# 1. Clone o repositório
git clone https://github.com/adrianolucasdepaula/invest.git invest-claude-web
cd invest-claude-web

# 2. Inicie os serviços com Docker
docker-compose up -d

# 3. Aguarde inicialização (30-60 segundos)
# Backend: http://localhost:3101/api/v1
# Frontend: http://localhost:3100
```

📚 **Guia completo:** Ver `INSTALL.md` para instalação detalhada, troubleshooting e configuração avançada.

### Acessar a Aplicação

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend** | http://localhost:3100 | - |
| **Backend API** | http://localhost:3101/api/v1 | - |
| **PgAdmin** | http://localhost:5150 | admin@invest.com / admin |
| **Redis Commander** | http://localhost:8181 | - |

---

## 📊 Uso

### Dashboard Principal
Acesse http://localhost:3100 para visualizar:
- Resumo do portfólio
- Análises recentes
- Alertas e notificações
- Gráficos e indicadores

### Análise de Ativos
1. Navegue para `/analysis`
2. Clique em "Nova Análise"
3. Selecione o ativo (ex: PETR4)
4. Escolha o tipo de análise:
   - Fundamentalista
   - Técnica
   - Completa (ambas)
5. Aguarde coleta de dados de múltiplas fontes
6. Visualize relatório completo com:
   - Recomendação (Compra/Manter/Venda)
   - Score de confiança (baseado em consenso)
   - Indicadores fundamentalistas
   - Análise de riscos

### Gerenciar Portfólio
1. Navegue para `/portfolio`
2. Crie novo portfólio
3. Adicione posições (ticker, quantidade, preço médio)
4. Acompanhe:
   - Valor total
   - Lucro/Prejuízo
   - Distribuição por ativo
   - Performance histórica

### Gerar Relatórios
1. Navegue para `/reports`
2. Selecione ativos para análise
3. Clique em "Solicitar Análise" ou "Analisar Todos"
4. Aguarde processamento
5. Baixe relatório em PDF ou JSON

### OAuth Manager - Renovação de Sessões
Gerenciamento visual de sessões OAuth para sites que requerem autenticação.

**Acesso:** Navegue para `/oauth-manager`

**Funcionalidades:**
1. ✅ **Renovação de Cookies (19 sites OAuth):**
   - Google
   - Fundamentei
   - Investidor10
   - StatusInvest
   - Investsite
   - ADVFN
   - BTG
   - XP
   - Bloomberg
   - Valor Econômico
   - TradingView
   - +8 outros

2. ✅ **VNC Viewer Integrado:**
   - Visualização em tempo real do navegador Chrome
   - Login manual quando necessário
   - Progress bar com 19 sites
   - Status visual (✓ completo, ✗ falha, ⊘ pulado)

3. ✅ **5 Melhorias de Controle (2025-11-15):**
   - **Salvar Cookies Parciais**: Aceita progresso parcial (ex: 17/19 sites)
   - **Botão "Voltar"**: Retornar ao site anterior para reprocessamento
   - **Seletor Individual**: Pular diretamente para site específico
   - **Processamento Automático**: Loop inteligente com timeout de 90s/site
   - **Detecção de Sessão Órfã**: Cancelar ou continuar sessões ativas

4. ✅ **Auto-Recovery:**
   - Reconexão automática a sessões interrompidas
   - Botão "Cancelar Sessão" sempre acessível
   - Toast notifications de progresso

**Como Usar:**
1. Clique em "Iniciar Renovação" (ou "Continuar Sessão" se houver sessão ativa)
2. **Automático:** Clique "Processar Todos Automaticamente" (aguarda 90s por site)
3. **Manual:** Realize login no VNC viewer quando necessário
4. **Navegação:** Use "Voltar ao Site Anterior" ou dropdown para pular sites
5. Clique "Confirmar Login" após autenticação manual
6. Salve cookies parciais a qualquer momento (não precisa completar 19/19)

📚 **Documentação técnica completa:** `OAUTH_MANAGER_MELHORIAS_2025-11-15.md`

---

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Senhas com bcrypt (salt rounds: 10)
- ✅ Validação de inputs (class-validator)
- ✅ Rate limiting em APIs
- ✅ CORS configurado
- ✅ Variáveis de ambiente (.env)

---

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Leia `CONTRIBUTING.md` para convenções de código e Git workflow
2. Leia `claude.md` se for trabalhar com Claude Code
3. Fork o projeto
4. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
5. Commit suas mudanças (`git commit -m 'feat: Adicionar MinhaFeature'`)
6. Push para a branch (`git push origin feature/MinhaFeature`)
7. Abra um Pull Request

**Padrões Obrigatórios:**
- TypeScript: 0 erros
- Build: 0 erros
- Conventional Commits
- Testes passando (quando aplicável)
- Documentação atualizada

---

## 📞 Suporte

Para dúvidas, problemas ou sugestões:

1. **Problemas comuns:** Consulte `TROUBLESHOOTING.md` (16+ soluções)
2. **Issues:** Abra uma issue no GitHub
3. **Email:** adrianolucasdepaula@gmail.com

---

## ✅ Status do Projeto

**Versão:** 1.2.1
**Última Atualização:** 2025-11-25
**Status:** ✅ Produção (100% completo - 5 bugs críticos corrigidos)

### Estatísticas

| Métrica | Valor |
|---------|-------|
| **Fases Concluídas** | 53/54 (98.1%) |
| **Backend** | 100% (NestJS + Python) |
| **Frontend** | 100% (Next.js 14) |
| **Validações** | 100% (21 fases frontend) |
| **Scrapers** | 19.35% (6/31 fontes) |
| **Testes** | Em andamento |
| **Documentação** | 100% (40+ arquivos .md) |

### Páginas Implementadas

| Página | Status | Funcionalidades |
|--------|--------|----------------|
| `/dashboard` | ✅ 100% | Overview, estatísticas, gráficos |
| `/assets` | ✅ 100% | Listagem, sincronização BRAPI |
| `/analysis` | ✅ 100% | Nova análise, histórico, detalhes |
| `/portfolio` | ✅ 100% | CRUD posições, estatísticas, distribuição |
| `/reports` | ✅ 100% | Relatórios, download PDF/JSON |
| `/data-sources` | ✅ 100% | Status scrapers, teste, métricas |
| `/oauth-manager` | ✅ 100% | Renovação OAuth, VNC viewer |
| `/settings` | ✅ 100% | Perfil, notificações, API, segurança |

### Próximas Implementações

- [ ] FASE 25: Refatoração Botão "Solicitar Análises" (aguardando aprovação)
- [ ] Scrapers restantes (25 fontes)
- [ ] Análise técnica detalhada (indicadores, padrões)
- [ ] Análise de opções (greeks, volatilidade)
- [ ] Integração com IAs (ChatGPT, Claude, Gemini)
- [ ] Mobile app (React Native)
- [ ] Testes automatizados (>80% coverage)
- [ ] CI/CD completo (GitHub Actions)

📚 **Roadmap completo:** Ver `ROADMAP.md` para histórico detalhado de todas as 54 fases.

---

## 🔗 Links Úteis

**Repositório:** https://github.com/adrianolucasdepaula/invest
**Documentação:** Veja seção "Documentação Técnica" acima
**Issues:** https://github.com/adrianolucasdepaula/invest/issues

---

## 🙏 Agradecimentos

Projeto desenvolvido com suporte de:
- **Claude Code (Sonnet 4.5)** - Desenvolvimento assistido por IA
- **Anthropic** - Claude Code CLI
- **Comunidade Open Source** - Bibliotecas e frameworks utilizados

---

**Desenvolvido com ❤️ por Adriano Lucas de Paula + Claude Code**

> **Nota para Claude Code:** Este README é para **usuários finais e desenvolvedores**. Para instruções de trabalho com Claude Code, consulte `claude.md`.
