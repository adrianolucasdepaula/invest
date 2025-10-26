# B3 Investment Analysis Platform

Plataforma completa de análise de investimentos da B3 com coleta de dados em tempo real, análise fundamentalista, técnica, macroeconômica e geração de relatórios com IA.

## Funcionalidades

### Coleta de Dados
- **Análise Fundamentalista**: Indicadores de valuation, endividamento, eficiência, rentabilidade, crescimento, DRE, balanço patrimonial
- **Análise Técnica/Gráfica**: Indicadores técnicos, padrões gráficos, volume
- **Análise Macroeconômica**: Calendário econômico, indicadores macro
- **Análise de Opções**: Vencimentos, volume, IV rank, volatilidade implícita/histórica
- **Análise de Sentimento**: Notícias, redes sociais, análise de sentimento com IA
- **Análise de Insiders**: Movimentações de insiders
- **Dividendos e Proventos**: Datas, valores, análise de impacto
- **Aluguel de Ações**: Taxas e impactos
- **Criptomoedas**: Dados e análises de cripto

### Validação de Dados
- Confrontamento de dados de múltiplas fontes (mínimo 3 fontes)
- Sistema de classificação de confiabilidade das fontes
- Detecção de inconsistências

### Análise e IA
- Análise fundamentalista automatizada
- Sugestões de compra/venda/manter com IA
- Análise de riscos
- Correlações entre ativos
- Geração de relatórios completos

### Gestão de Portfólio
- Import de portfólios (Kinvo, Investidor10, B3, MyProfit, NuInvest, Binance)
- Acompanhamento de carteira completa
- Análise de performance

### Dashboard
- Visualizações interativas
- Métricas em tempo real
- Alertas e notificações
- Suporte para day trade, swing trade, position

## Arquitetura

### Backend
- **Framework**: FastAPI (Python)
- **Banco de Dados**: PostgreSQL + TimescaleDB (séries temporais)
- **Cache**: Redis
- **Tarefas Assíncronas**: Celery
- **Scraping**: Selenium, Playwright, Scrapy, BeautifulSoup
- **APIs**: Integração com APIs disponíveis

### Frontend
- **Framework**: Next.js 14 (React)
- **UI**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts, TradingView Widgets
- **Estado**: Zustand
- **Requisições**: Axios

### DevOps
- **Containerização**: Docker + Docker Compose
- **Orquestração**: Kubernetes (opcional)
- **CI/CD**: GitHub Actions

## Fontes de Dados

### Fundamentalista
- Fundamentei (login Google)
- Investidor10 (login Google)
- StatusInvest (login Google)
- Fundamentus
- InvestSite
- BRAPI (API - token: mVcy3EFZaBdza27tPQjdC1)

### Análise Geral
- Investing.com (login Google)
- ADVFN (login Google)
- Google Finance (login Google)

### Análise Técnica
- TradingView (login Google)

### Opções
- Opcoes.net.br (usuário: 312.862.178-06)

### Criptomoedas
- CoinMarketCap

### Insiders
- Griffin.app.br

### Relatórios Institucionais
- BTG Pactual
- XPI
- Estadão Investidor
- Mais Retorno

### Dados Oficiais
- B3
- Google Search
- ChatGPT, DeepSeek, Gemini, Claude, Grok (análise IA)

### Notícias
- Google News
- Bloomberg Linea
- Investing.com News
- Valor Econômico
- Exame
- InfoMoney

## Instalação

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento frontend)
- Python 3.11+ (para desenvolvimento backend)

### Setup Rápido

```bash
# Clone o repositório
git clone <repo-url>
cd invest

# Inicie os serviços com Docker
docker-compose up -d

# Acesse:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Documentação API: http://localhost:8000/docs
```

### Setup para Desenvolvimento

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/invest_db
REDIS_URL=redis://localhost:6379

# APIs
BRAPI_TOKEN=mVcy3EFZaBdza27tPQjdC1

# Opcoes.net.br
OPCOES_USER=312.862.178-06
OPCOES_PASSWORD=Safra998266@#

# Scraping
CHROME_DRIVER_PATH=/usr/local/bin/chromedriver
HEADLESS_MODE=true

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Uso

### Coleta de Dados

```python
# Exemplo de uso da API
import requests

# Coletar dados fundamentalistas de uma ação
response = requests.get('http://localhost:8000/api/v1/fundamentals/PETR4')
data = response.json()

# Gerar relatório completo
response = requests.post('http://localhost:8000/api/v1/reports/generate',
    json={'ticker': 'PETR4', 'report_type': 'complete'})
report = response.json()
```

### Dashboard

Acesse http://localhost:3000 e navegue pelas seguintes seções:
- **Home**: Visão geral do mercado
- **Análise**: Análise detalhada de ativos
- **Portfólio**: Gestão de carteira
- **Relatórios**: Geração e visualização de relatórios
- **Configurações**: Configurações de fontes e alertas

## Estrutura do Projeto

```
invest/
├── backend/               # Backend FastAPI
│   ├── app/
│   │   ├── api/          # Endpoints REST
│   │   ├── core/         # Configurações
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Schemas Pydantic
│   │   ├── scrapers/     # Módulos de scraping
│   │   ├── services/     # Lógica de negócio
│   │   ├── tasks/        # Tarefas Celery
│   │   └── utils/        # Utilitários
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # Frontend Next.js
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas Next.js
│   │   ├── services/     # Serviços API
│   │   └── styles/       # Estilos
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Roadmap

- [x] Estrutura base do projeto
- [ ] Sistema de scraping modular
- [ ] Coleta de dados fundamentalistas
- [ ] Coleta de dados técnicos
- [ ] Sistema de validação cruzada
- [ ] APIs REST
- [ ] Dashboard frontend
- [ ] Sistema de análise com IA
- [ ] Geração de relatórios
- [ ] Import de portfólios
- [ ] Alertas e notificações
- [ ] Backtesting
- [ ] Machine Learning para predições

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto é privado e proprietário.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.