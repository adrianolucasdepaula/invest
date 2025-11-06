# B3 AI Analysis Platform

Plataforma completa de análise de investimentos B3 com Inteligência Artificial para análise fundamentalista, técnica, macroeconômica e gestão de portfólio.

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

### Fontes de Dados

#### Análise Fundamentalista
- Fundamentei (login Google)
- Investidor10 (login Google)
- StatusInvest (login Google)
- Fundamentus
- Investsite
- BRAPI (API)

#### Análise Geral do Mercado
- Investing.com (login Google)
- ADVFN (login Google)
- Google Finance (login Google)

#### Análise Gráfica/Técnica
- TradingView (login Google)

#### Análise de Opções
- Opcoes.net.br (login credenciais)

#### Criptomoedas
- CoinMarketCap

#### Insiders
- Griffin.app.br

#### Relatórios Institucionais
- BTG Pactual (login token)
- XPI (login token)
- Estadão Investidor (login Google)
- Mais Retorno (login Google)

#### Dados Oficiais
- B3
- Google Search

#### Análise com IA
- ChatGPT (login Google)
- DeepSeek (login Google)
- Gemini (login Google)
- Claude (login Google)
- Grok (login Google)

#### Notícias
- Google News
- Bloomberg Línea
- Investing News
- Valor Econômico
- Exame
- InfoMoney

## 🏗️ Arquitetura

```
invest/
├── backend/                    # Backend NestJS + Python
│   ├── src/
│   │   ├── api/               # Controllers e rotas
│   │   ├── services/          # Lógica de negócio
│   │   ├── scrapers/          # Módulos de scraping
│   │   ├── validators/        # Validação cruzada de dados
│   │   ├── ai/                # Integração com IA
│   │   ├── analysis/          # Módulos de análise
│   │   ├── database/          # Modelos e migrations
│   │   └── queue/             # Sistema de filas
│   └── python-scrapers/       # Scrapers Python (Playwright)
├── frontend/                   # Frontend Next.js 14
│   ├── src/
│   │   ├── app/               # App Router
│   │   ├── components/        # Componentes React
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API clients
│   │   └── utils/             # Utilitários
├── database/                   # Scripts de banco de dados
│   ├── migrations/
│   └── seeds/
├── docker/                     # Configurações Docker
└── docs/                       # Documentação
```

## 🛠️ Tecnologias

### Backend
- **NestJS**: Framework Node.js
- **Python**: Scrapers com Playwright
- **PostgreSQL**: Banco de dados principal
- **TimescaleDB**: Extensão para séries temporais
- **Redis**: Cache e filas
- **Bull**: Sistema de filas
- **Puppeteer/Playwright**: Web scraping
- **TypeORM**: ORM

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **TailwindCSS**: Estilização
- **Shadcn/UI**: Componentes UI
- **Recharts/TradingView**: Gráficos
- **React Query**: Gerenciamento de estado
- **Zustand**: State management
- **Socket.io**: Real-time updates

### DevOps
- **Docker & Docker Compose**: Containerização
- **Nginx**: Reverse proxy
- **GitHub Actions**: CI/CD

## 🚀 Getting Started

### Pré-requisitos
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd invest
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

3. Inicie os containers:
```bash
docker-compose up -d
```

4. Instale as dependências:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

5. Execute as migrations:
```bash
cd backend
npm run migration:run
```

6. Inicie a aplicação:
```bash
# Backend (porta 3001)
cd backend
npm run start:dev

# Frontend (porta 3000)
cd frontend
npm run dev
```

Acesse: http://localhost:3000

## 📊 Uso

### Dashboard
Acesse o dashboard principal para visualizar:
- Análises em tempo real
- Portfólio consolidado
- Alertas e recomendações
- Gráficos interativos

### Gerenciamento de Portfólio
1. Importe seu portfólio de várias fontes
2. Visualize performance consolidada
3. Receba análises e recomendações automáticas

### Análises com IA
1. Selecione um ativo
2. Escolha o tipo de análise
3. Receba relatório completo com dados de múltiplas fontes validados

### Relatórios
Gere relatórios completos em PDF/Excel com:
- Análise fundamentalista detalhada
- Análise técnica e gráfica
- Análise macroeconômica
- Análise de sentimento
- Recomendações de compra/venda
- Análise de riscos

## 🔒 Segurança

- Credenciais armazenadas de forma segura
- Autenticação OAuth2 com Google
- Criptografia de dados sensíveis
- Rate limiting nas APIs
- Validação de dados em múltiplas camadas

## 📝 Licença

Este projeto é privado e proprietário.

## 🤝 Contribuição

Por favor, leia CONTRIBUTING.md para detalhes sobre nosso código de conduta e processo de pull requests.

## 📞 Suporte

Para suporte, abra uma issue ou entre em contato através de [email].

## 🗺️ Roadmap

- [x] Estrutura base do projeto
- [ ] Sistema de scraping com múltiplas fontes
- [ ] Validação cruzada de dados
- [ ] Dashboard frontend
- [ ] Análises fundamentalistas
- [ ] Análises técnicas
- [ ] Integração com IA
- [ ] Gerenciamento de portfólio
- [ ] Geração de relatórios
- [ ] Sistema de alertas
- [ ] Mobile app (futuro)
- [ ] Análise de sentimento ML (futuro)
