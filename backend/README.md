# 🚀 B3 AI Analysis Platform - Backend

Backend da plataforma de análise de investimentos B3 com Inteligência Artificial.

## 📋 Visão Geral

API RESTful construída com NestJS, TypeScript e PostgreSQL que fornece:
- **Análise de ativos** com IA (GPT-4)
- **Scraping de dados** de múltiplas fontes (B3, InfoMoney, Status Invest)
- **Gerenciamento de portfólios**
- **Indicadores técnicos e fundamentalistas**
- **WebSocket** para dados em tempo real
- **Processamento assíncrono** com Bull Queue

---

## 🏗️ Arquitetura

```
backend/
├── src/
│   ├── api/            # Controladores REST
│   │   ├── assets/     # Endpoints de ativos
│   │   ├── portfolio/  # Endpoints de portfólio
│   │   └── analysis/   # Endpoints de análise
│   ├── scrapers/       # Web scrapers
│   │   ├── b3/
│   │   ├── infomoney/
│   │   └── statusinvest/
│   ├── analysis/       # Lógica de análise
│   │   ├── fundamental/
│   │   └── technical/
│   ├── ai/             # Integração GPT-4
│   ├── database/       # TypeORM entities
│   ├── queue/          # Bull jobs
│   ├── websocket/      # Socket.IO
│   ├── common/         # Utilitários
│   └── config/         # Configurações
├── test/               # Testes E2E
└── coverage/           # Relatórios de cobertura
```

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | NestJS 10.x |
| **Linguagem** | TypeScript 5.x |
| **Banco de Dados** | PostgreSQL 15 + TimescaleDB |
| **Cache** | Redis 7 |
| **Queue** | Bull (Redis) |
| **ORM** | TypeORM 0.3.x |
| **Scraping** | Puppeteer + Cheerio |
| **IA** | OpenAI GPT-4 |
| **WebSocket** | Socket.IO |
| **Validação** | class-validator + class-transformer |
| **Documentação** | Swagger/OpenAPI |
| **Testes** | Jest + Supertest |

---

## 🚦 Começando

### Pré-requisitos

- Node.js >= 18.x
- PostgreSQL >= 15
- Redis >= 7
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/invest.git
cd invest/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Rodar migrações do banco
npm run migration:run

# Popular dados iniciais (opcional)
npm run seed
```

### Desenvolvimento

```bash
# Modo de desenvolvimento (hot reload)
npm run start:dev

# Servidor estará em: http://localhost:3001
# Swagger docs em: http://localhost:3001/api/docs
```

### Produção

```bash
# Build
npm run build

# Rodar em produção
npm run start:prod
```

---

## 🧪 Testes

### Executar Todos os Testes

```bash
# Script completo de testes
./test-all.sh

# Ou manualmente:
npm run test              # Testes unitários
npm run test:e2e          # Testes E2E
npm run test:cov          # Com cobertura
npm run test:watch        # Watch mode
```

### Testes E2E Disponíveis

| Arquivo | Descrição | Testes |
|---------|-----------|--------|
| `test/assets.e2e-spec.ts` | API de ativos | 12+ testes |
| `test/portfolio.e2e-spec.ts` | API de portfólio | 15+ testes |
| `test/analysis.e2e-spec.ts` | API de análise e IA | 18+ testes |

### Cobertura de Código

```bash
npm run test:cov

# Ver relatório HTML
open coverage/lcov-report/index.html
```

**Meta de Cobertura:** > 80%

---

## 📡 API Endpoints

### Assets

```
GET    /api/assets                    # Listar ativos
GET    /api/assets/:ticker            # Detalhes do ativo
GET    /api/assets/:ticker/history    # Histórico de preços
GET    /api/assets/:ticker/indicators # Indicadores técnicos
POST   /api/assets/compare            # Comparar múltiplos ativos
```

### Portfolio

```
GET    /api/portfolios                       # Listar portfólios
POST   /api/portfolios                       # Criar portfólio
GET    /api/portfolios/:id                   # Detalhes do portfólio
PATCH  /api/portfolios/:id                   # Atualizar portfólio
DELETE /api/portfolios/:id                   # Deletar portfólio
POST   /api/portfolios/:id/positions         # Adicionar posição
PATCH  /api/portfolios/:id/positions/:posId  # Atualizar posição
DELETE /api/portfolios/:id/positions/:posId  # Remover posição
POST   /api/portfolios/:id/import            # Importar de arquivo
GET    /api/portfolios/:id/performance       # Performance do portfólio
```

### Analysis

```
POST   /api/analysis/generate                # Gerar análise com IA
GET    /api/analysis/reports                 # Listar relatórios
GET    /api/analysis/reports/:id             # Detalhes do relatório
GET    /api/analysis/fundamental/:ticker     # Análise fundamentalista
GET    /api/analysis/technical/:ticker       # Análise técnica
POST   /api/analysis/ai/:ticker              # Análise com GPT-4
POST   /api/analysis/compare                 # Comparar ativos
POST   /api/analysis/alerts                  # Criar alerta de preço
GET    /api/analysis/alerts                  # Listar alertas
```

### WebSocket Events

```javascript
// Cliente conecta
socket.connect('http://localhost:3001');

// Eventos disponíveis
socket.on('price-update', (data) => {
  // { ticker: 'PETR4', price: 38.45, change: 2.34 }
});

socket.on('indicator-update', (data) => {
  // { ticker: 'PETR4', rsi: 65.4, macd: {...} }
});

socket.on('alert-triggered', (data) => {
  // { alertId: '...', ticker: 'PETR4', message: '...' }
});

// Inscrever em ticker específico
socket.emit('subscribe', { ticker: 'PETR4' });
socket.emit('unsubscribe', { ticker: 'PETR4' });
```

---

## 📚 Documentação da API (Swagger)

Acesse: `http://localhost:3001/api/docs`

A documentação Swagger é gerada automaticamente com:
- Todos os endpoints
- Schemas de request/response
- Exemplos de uso
- Códigos de status HTTP

---

## 🔧 Configuração (.env)

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=b3_invest

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRATION=7d

# OpenAI
OPENAI_API_KEY=sk-...

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Scrapers
SCRAPER_HEADLESS=true
SCRAPER_CONCURRENT_JOBS=3
SCRAPER_RETRY_ATTEMPTS=3

# Cache
CACHE_TTL=300

# Queue
QUEUE_REDIS_HOST=localhost
QUEUE_REDIS_PORT=6379
```

---

## 🕷️ Scrapers

### Fontes de Dados

1. **B3 (Brasil, Bolsa, Balcão)**
   - Preços em tempo real
   - Histórico de cotações
   - Volume negociado
   - Market cap

2. **Status Invest**
   - Indicadores fundamentalistas
   - ROE, P/L, P/VP, Dividend Yield
   - Balanços patrimoniais
   - DRE (Demonstração de Resultados)

3. **InfoMoney**
   - Notícias do mercado
   - Análises de especialistas
   - Recomendações

4. **Fundamentus**
   - Dados fundamentalistas consolidados
   - Ranking de ativos
   - Comparações setoriais

5. **Yahoo Finance**
   - Preços internacionais
   - Histórico longo (anos)
   - Dados macroeconômicos

6. **Google Finance**
   - Cotações em tempo real
   - Notícias integradas
   - Gráficos

7. **Investing.com**
   - Agenda econômica
   - Calendário de dividendos
   - Análise técnica

### Agendamento de Scrapers

```typescript
// Configurado com @nestjs/schedule

// Atualizar preços a cada 5 minutos (durante pregão)
@Cron('*/5 9-18 * * 1-5') // Segunda a sexta, 9h-18h
async updatePrices() { }

// Scraping de fundamentalistas (diário, após fechamento)
@Cron('0 19 * * 1-5') // 19h, dias úteis
async scrapeFundamentals() { }

// Scraping de notícias (a cada hora)
@Cron('0 * * * *')
async scrapeNews() { }
```

---

## 🤖 Análise com IA (GPT-4)

### Sistema de Validação Cruzada

Para garantir precisão, cada análise passa por:

1. **Coleta de Dados** de múltiplas fontes
2. **Validação Cruzada** entre fontes
3. **Análise Fundamentalista** (indicadores)
4. **Análise Técnica** (RSI, MACD, etc.)
5. **Análise de Sentimento** (notícias)
6. **GPT-4** processa todos os dados
7. **Cross-Validation** da recomendação

### Prompt Engineering

```typescript
const prompt = `
Você é um analista de investimentos especializado na B3.

Dados do ativo ${ticker}:
- Preço atual: R$ ${price}
- Variação: ${change}%
- Fundamentalistas: ${JSON.stringify(fundamentals)}
- Técnicos: ${JSON.stringify(technicals)}
- Notícias: ${news}

Forneça análise com:
1. Recomendação (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
2. Confiança (0-100%)
3. Preços-alvo (conservador, moderado, otimista)
4. Justificativa detalhada
5. Riscos identificados
6. Horizon de investimento

Formato JSON.
`;
```

---

## 🔄 Processamento Assíncrono (Bull Queue)

### Jobs Configurados

```typescript
// Análise com IA (demorado)
@Process('generate-ai-analysis')
async processAIAnalysis(job: Job) {
  const { ticker } = job.data;
  // Processar...
}

// Scraping em background
@Process('scrape-asset-data')
async scrapeAssetData(job: Job) {
  const { ticker, sources } = job.data;
  // Scraping...
}

// Import de portfólio (arquivo grande)
@Process('import-portfolio')
async importPortfolio(job: Job) {
  const { file, userId } = job.data;
  // Processar CSV/Excel...
}

// Cálculo de performance (pesado)
@Process('calculate-portfolio-performance')
async calculatePerformance(job: Job) {
  const { portfolioId } = job.data;
  // Calcular...
}
```

### Monitorar Filas

```bash
# Bull Board (UI para monitorar filas)
# Acesse: http://localhost:3001/admin/queues

# Ou via Redis CLI
redis-cli
> KEYS bull:*
> LLEN bull:ai-analysis:waiting
> LLEN bull:ai-analysis:active
```

---

## 🗄️ Banco de Dados

### Entities Principais

```typescript
// Asset (Ativo)
@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticker: string;

  @Column()
  name: string;

  @Column('decimal')
  currentPrice: number;

  @Column()
  sector: string;

  // ... mais campos
}

// Portfolio
@Entity()
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Position, position => position.portfolio)
  positions: Position[];

  // ...
}

// AnalysisReport
@Entity()
export class AnalysisReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticker: string;

  @Column('json')
  recommendation: {
    action: string;
    confidence: number;
    reasoning: string;
  };

  // ...
}
```

### Migrações

```bash
# Criar nova migração
npm run migration:create -- src/database/migrations/AddNewField

# Gerar migração automaticamente
npm run migration:generate -- src/database/migrations/AutoGenerated

# Executar migrações
npm run migration:run

# Reverter última migração
npm run migration:revert
```

---

## 🔐 Autenticação e Segurança

### JWT Authentication

```typescript
// Endpoints protegidos usam @UseGuards(JwtAuthGuard)

@Get('/protected')
@UseGuards(JwtAuthGuard)
async protectedRoute(@Request() req) {
  // req.user contém dados do usuário autenticado
  return { userId: req.user.id };
}

// Google OAuth
@Get('/auth/google')
@UseGuards(AuthGuard('google'))
async googleLogin() {}

@Get('/auth/google/callback')
@UseGuards(AuthGuard('google'))
async googleCallback(@Req() req) {
  // Retorna JWT token
}
```

### Rate Limiting

```typescript
// Configurado com @nestjs/throttler
@Throttle(10, 60) // 10 requests por 60 segundos
@Get('/api/assets')
async listAssets() {}
```

### Helmet & CORS

```typescript
// main.ts
app.use(helmet()); // Security headers
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
```

---

## 📊 Monitoramento e Logs

### Logs Estruturados

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('ScraperService');

logger.log('Iniciando scraping de PETR4');
logger.error('Erro ao processar ativo', error.stack);
logger.warn('Rate limit atingido');
logger.debug('Dados recebidos', data);
```

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "queue": { "status": "up" }
  }
}
```

---

## 🐳 Docker

```bash
# Subir backend com Docker
docker-compose up backend

# Ou todos os serviços
docker-compose up
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrões de Código

```bash
# Lint
npm run lint

# Formatar código
npm run format

# Verificar tipos
npm run build
```

---

## 📝 Convenções

### Commits (Conventional Commits)

```
feat: adicionar endpoint de análise técnica
fix: corrigir cálculo de RSI
docs: atualizar README
refactor: otimizar scraper do Status Invest
test: adicionar testes para portfolio service
chore: atualizar dependências
```

### Estrutura de Código

- **Controllers**: Apenas recebem requests e chamam services
- **Services**: Lógica de negócio
- **Repositories**: Acesso ao banco de dados
- **DTOs**: Validação de dados com class-validator
- **Entities**: TypeORM models

---

## 🚧 Roadmap

- [ ] Implementar autenticação completa (JWT + OAuth)
- [ ] Adicionar mais scrapers (XP, Rico, Clear)
- [ ] Melhorar análise de sentimento de notícias
- [ ] Cache inteligente (invalidação automática)
- [ ] Rate limiting por usuário
- [ ] Backtest de estratégias
- [ ] Machine Learning para previsões
- [ ] API GraphQL além da REST
- [ ] Notificações push (Firebase)
- [ ] Multi-tenancy

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 👥 Equipe

**Invest Team** - B3 AI Analysis Platform

---

## 📞 Suporte

- **Issues**: https://github.com/seu-usuario/invest/issues
- **Email**: suporte@invest.com.br
- **Docs**: http://localhost:3001/api/docs

---

*Última atualização: 2025-11-06*
