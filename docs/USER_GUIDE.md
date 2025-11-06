# Guia do Usuário - B3 AI Analysis Platform

## Índice
1. [Introdução](#introdução)
2. [Primeiros Passos](#primeiros-passos)
3. [Análise de Ativos](#análise-de-ativos)
4. [Gerenciamento de Portfólio](#gerenciamento-de-portfólio)
5. [Geração de Relatórios](#geração-de-relatórios)
6. [API REST](#api-rest)

## Introdução

A B3 AI Analysis Platform é uma plataforma completa para análise de investimentos da B3 com inteligência artificial. Oferece análise fundamentalista, técnica, de opções, além de gerenciamento de portfólio e geração de relatórios automáticos.

### Principais Funcionalidades

- ✅ **Análise Fundamentalista**: 30+ indicadores de 4 fontes validadas
- ✅ **Análise Técnica**: 15+ indicadores técnicos e detecção de padrões
- ✅ **Análise de Opções**: Gregas, IV Rank, volatilidade
- ✅ **Relatórios com IA**: Relatórios completos gerados por IA
- ✅ **Importação de Portfólio**: B3, Kinvo e outras fontes
- ✅ **Validação Cruzada**: Dados validados por múltiplas fontes

## Primeiros Passos

### 1. Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd invest

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Inicie com Docker
docker-compose up -d
```

### 2. Acesso à Plataforma

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Documentação API**: http://localhost:3001/api/docs

### 3. Autenticação

#### Login com Google
```bash
GET /api/v1/auth/google
```

#### Login com Email/Senha
```bash
POST /api/v1/auth/login
{
  "email": "seu-email@exemplo.com",
  "password": "sua-senha"
}
```

## Análise de Ativos

### Análise Fundamentalista

Coleta dados de 4 fontes e valida cruzadamente:

```bash
POST /api/v1/analysis/:ticker/fundamental
```

**Exemplo:**
```bash
curl -X POST http://localhost:3001/api/v1/analysis/PETR4/fundamental \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resposta:**
```json
{
  "ticker": "PETR4",
  "status": "completed",
  "data": {
    "pl": 5.8,
    "pvp": 1.2,
    "roe": 15.3,
    "dividendYield": 8.5,
    ...
  },
  "sources": ["fundamentus", "brapi", "statusinvest", "investidor10"],
  "sourcesCount": 4,
  "confidence": 0.95
}
```

**Indicadores Coletados:**

**Valuation:**
- P/L, P/VP, PSR, P/Ativos
- EV/EBIT, EV/EBITDA, PEG Ratio

**Rentabilidade:**
- ROE, ROA, ROIC
- Margem Bruta, EBIT, EBITDA, Líquida

**Endividamento:**
- Dívida Líquida/PL
- Dívida Líquida/EBIT
- Liquidez Corrente

**Crescimento:**
- CAGR Receitas 5 anos
- CAGR Lucros 5 anos

**Dividendos:**
- Dividend Yield
- Payout

### Análise Técnica

Gera 15+ indicadores técnicos e sinais de compra/venda:

```bash
POST /api/v1/analysis/:ticker/technical
```

**Resposta:**
```json
{
  "ticker": "PETR4",
  "indicators": {
    "sma20": 28.50,
    "sma50": 27.80,
    "sma200": 26.30,
    "rsi": 65,
    "macd": {
      "macd": 0.45,
      "signal": 0.30,
      "histogram": 0.15
    },
    "bollingerBands": {
      "upper": 30.50,
      "middle": 28.50,
      "lower": 26.50
    }
  },
  "signals": {
    "overall": "BUY",
    "strength": 75,
    "trendSignal": "BUY",
    "momentumSignal": "BUY"
  },
  "patterns": [
    "MACD Bullish Crossover",
    "Price above SMA 200"
  ],
  "supportLevels": [26.50, 25.80, 24.90],
  "resistanceLevels": [29.50, 30.20, 31.00]
}
```

**Indicadores Disponíveis:**

**Tendência:**
- SMA (20, 50, 200)
- EMA (9, 21)
- Detecção de tendência
- Força da tendência (0-100)

**Momentum:**
- RSI (14)
- MACD
- Stochastic

**Volatilidade:**
- Bollinger Bands
- ATR

**Volume:**
- OBV
- Volume SMA

**Suporte/Resistência:**
- Pivot Points

### Análise Completa

Combina análise fundamentalista, técnica e gera relatório com IA:

```bash
POST /api/v1/analysis/:ticker/complete
```

## Gerenciamento de Portfólio

### Criar Portfólio

```bash
POST /api/v1/portfolio
{
  "name": "Meu Portfólio",
  "description": "Carteira de longo prazo"
}
```

### Importar Portfólio

Suporta arquivos de:
- B3 (XLSX, XLS)
- Kinvo (XLSX, XLS, CSV)
- MyProfit (em desenvolvimento)
- NuInvest (em desenvolvimento)

```bash
POST /api/v1/portfolio/import
Content-Type: multipart/form-data

file: <arquivo.xlsx>
```

**Formato B3 (exemplo):**

| Código do Ativo | Quantidade | Preço Médio |
|-----------------|------------|-------------|
| PETR4           | 100        | 28.50       |
| VALE3           | 200        | 65.30       |

**Formato Kinvo (exemplo):**

| Ticker | Qtd | Preço Médio | Cotação | Tipo   |
|--------|-----|-------------|---------|--------|
| PETR4  | 100 | 28,50       | 29,80   | Ação   |
| VALE3  | 200 | 65,30       | 67,50   | Ação   |

### Listar Portfólios

```bash
GET /api/v1/portfolio
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "name": "Meu Portfólio",
    "totalInvested": 15830.00,
    "currentValue": 16630.00,
    "profit": 800.00,
    "profitPercentage": 5.05,
    "positions": [
      {
        "ticker": "PETR4",
        "quantity": 100,
        "averagePrice": 28.50,
        "currentPrice": 29.80,
        "profit": 130.00,
        "profitPercentage": 4.56
      }
    ]
  }
]
```

## Geração de Relatórios

### Relatório Completo com IA

Gera relatório completo usando GPT-4:

```bash
POST /api/v1/reports/:ticker/generate
```

**Resposta:**
```json
{
  "ticker": "PETR4",
  "summary": "PETR4 apresenta valuation atrativo com P/L de 5.8...",
  "fundamentalAnalysis": "A análise fundamentalista revela...",
  "technicalAnalysis": "Tecnicamente, o ativo está em tendência de alta...",
  "riskAnalysis": "Principais riscos incluem volatilidade do petróleo...",
  "recommendation": {
    "action": "BUY",
    "confidence": 85,
    "reasoning": "Valuation atrativo combinado com tendência técnica positiva..."
  },
  "targetPrices": {
    "conservative": 32.00,
    "moderate": 35.00,
    "optimistic": 38.00
  },
  "keyPoints": [
    "P/L de 5.8 abaixo da média do setor",
    "Dividend Yield atrativo de 8.5%",
    "Tendência técnica de alta confirmada"
  ],
  "warnings": [
    "Alta exposição ao preço do petróleo",
    "Volatilidade elevada"
  ],
  "opportunities": [
    "Possível reversão de preços do petróleo",
    "Dividendos extraordinários possíveis"
  ]
}
```

## API REST

### Endpoints Principais

#### Autenticação
```
POST   /api/v1/auth/register          # Registrar novo usuário
POST   /api/v1/auth/login             # Login
GET    /api/v1/auth/google            # Login com Google
GET    /api/v1/auth/me                # Perfil do usuário
```

#### Ativos
```
GET    /api/v1/assets                 # Listar ativos
GET    /api/v1/assets/:ticker         # Detalhes de um ativo
GET    /api/v1/assets/:ticker/price-history  # Histórico de preços
POST   /api/v1/assets/:ticker/sync    # Sincronizar dados do ativo
```

#### Análises
```
POST   /api/v1/analysis/:ticker/fundamental  # Análise fundamentalista
POST   /api/v1/analysis/:ticker/technical    # Análise técnica
POST   /api/v1/analysis/:ticker/complete     # Análise completa
GET    /api/v1/analysis/:ticker              # Histórico de análises
GET    /api/v1/analysis/:id/details          # Detalhes de uma análise
```

#### Portfólio
```
GET    /api/v1/portfolio              # Listar portfólios
POST   /api/v1/portfolio              # Criar portfólio
POST   /api/v1/portfolio/import       # Importar portfólio
```

#### Relatórios
```
POST   /api/v1/reports/:ticker/generate  # Gerar relatório completo
```

#### Fontes de Dados
```
GET    /api/v1/data-sources           # Listar fontes de dados
GET    /api/v1/data-sources/status    # Status das fontes
```

### Autenticação

Todos os endpoints (exceto login/registro) requerem autenticação via JWT:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Códigos de Resposta

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro interno

## Exemplos de Uso

### Exemplo 1: Análise Completa de um Ativo

```bash
# 1. Análise fundamentalista
curl -X POST http://localhost:3001/api/v1/analysis/PETR4/fundamental \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Análise técnica
curl -X POST http://localhost:3001/api/v1/analysis/PETR4/technical \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Gerar relatório com IA
curl -X POST http://localhost:3001/api/v1/reports/PETR4/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Exemplo 2: Importar e Analisar Portfólio

```bash
# 1. Importar portfólio
curl -X POST http://localhost:3001/api/v1/portfolio/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@meu-portfolio.xlsx"

# 2. Listar portfólios
curl http://localhost:3001/api/v1/portfolio \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Analisar cada ativo do portfólio
# (fazer para cada ticker)
```

## Suporte e Documentação

- **Documentação API**: http://localhost:3001/api/docs
- **GitHub**: [repositório]
- **Issues**: [issues]

## Limitações e Restrições

- **Rate Limiting**: 100 requisições por minuto por usuário
- **Scrapers**: Dependem da disponibilidade dos sites fontes
- **IA**: Requer chave API da OpenAI (GPT-4)
- **Validação**: Mínimo de 3 fontes para alta confiança

## Troubleshooting

### Scraper falha
- Verificar se o site fonte está acessível
- Verificar credenciais de login (se aplicável)
- Verificar logs: `docker-compose logs backend`

### Análise retorna erro
- Verificar se o ticker é válido
- Verificar se há dados disponíveis
- Tentar novamente após alguns minutos

### Importação de portfólio falha
- Verificar formato do arquivo
- Verificar se colunas estão corretas
- Ver exemplos na documentação

## Próximas Funcionalidades

- [ ] Alertas em tempo real
- [ ] Dashboard interativo frontend
- [ ] Análise de sentimento de notícias
- [ ] Backtesting de estratégias
- [ ] Mobile app
- [ ] Alertas por Telegram/WhatsApp
