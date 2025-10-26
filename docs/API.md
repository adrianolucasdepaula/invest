# 📘 Documentação Completa da API - B3 Investment Analysis Platform

**Versão:** 1.0.0
**Última Atualização:** 2025-10-26
**Base URL:** `http://localhost:8000/api/v1`

---

## 📑 Índice

1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Rate Limiting](#rate-limiting)
4. [Convenções](#convenções)
5. [Endpoints](#endpoints)
   - [Assets](#assets-ativos)
   - [Analysis](#analysis-análises)
   - [Reports](#reports-relatórios)
   - [Portfolio](#portfolio-portfólio)
6. [Modelos de Dados](#modelos-de-dados)
7. [Códigos de Status](#códigos-de-status)
8. [Exemplos de Uso](#exemplos-de-uso)
9. [Erros Comuns](#erros-comuns)
10. [SDKs e Libraries](#sdks-e-libraries)

---

## 🚀 Introdução

A **B3 Investment Analysis Platform API** é uma interface REST completa para coleta, análise e geração de relatórios de investimentos da Bolsa de Valores Brasileira (B3).

### Principais Funcionalidades

- ✅ **Coleta de Dados**: Integração com 17+ fontes (fundamentalistas, técnicos, notícias, opções)
- ✅ **Análise com IA**: Análises usando GPT-4, Claude e Gemini
- ✅ **Validação Cruzada**: Validação de dados de múltiplas fontes
- ✅ **Relatórios**: Geração de relatórios em PDF/HTML/Markdown
- ✅ **Portfólio**: Gerenciamento multi-mercado
- ✅ **Tarefas Assíncronas**: Processamento em background com Celery

### Links Úteis

- **Swagger UI (Interativa)**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/api/v1/openapi.json`
- **Health Check**: `http://localhost:8000/health`

---

## 🛡️ Autenticação

A API suporta **dois métodos de autenticação**:

### 1. Bearer Token (JWT)

Método recomendado para aplicações web e mobile.

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como obter um token:**

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 691200
}
```

### 2. API Key

Método recomendado para integrações servidor-a-servidor.

```bash
X-API-Key: sua_api_key_aqui
```

**Como obter uma API Key:**

1. Acesse o painel de configurações
2. Vá em "API Keys"
3. Clique em "Gerar Nova API Key"
4. Copie e guarde com segurança

---

## ⚡ Rate Limiting

A API implementa rate limiting para garantir qualidade do serviço:

- **Limite**: 60 requisições por minuto por IP
- **Headers de Resposta**:
  - `X-RateLimit-Limit`: Limite máximo
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp de reset

**Exemplo de Resposta quando Limite Excedido:**

```json
{
  "detail": "Rate limit exceeded. Try again in 30 seconds.",
  "retry_after": 30
}
```

Status Code: `429 Too Many Requests`

---

## 📝 Convenções

### Endpoints

- Todos os endpoints principais estão sob `/api/v1/`
- Versionamento via prefixo (`/api/v1/`, `/api/v2/`, etc)

### Respostas

- Sucesso: `200 OK`, `201 Created`, `204 No Content`
- Erro Cliente: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- Erro Servidor: `500 Internal Server Error`, `503 Service Unavailable`

### Formato de Dados

- **Datas**: ISO 8601 (UTC) - `2025-10-26T14:30:00Z`
- **Moeda**: BRL (R$)
- **Decimais**: Máximo 2 casas para valores monetários
- **Encoding**: UTF-8

### Paginação

Endpoints que retornam listas suportam paginação:

```bash
GET /api/v1/assets?skip=0&limit=20
```

**Parâmetros:**
- `skip`: Número de registros a pular (default: 0)
- `limit`: Número máximo de registros (default: 20, max: 100)

---

## 📦 Endpoints

### Assets (Ativos)

Operações relacionadas a ativos (ações, FIIs, ETFs, BDRs).

#### `GET /api/v1/assets/{ticker}`

Obtém dados consolidados de um ativo.

**Parâmetros de Rota:**
- `ticker` (string, obrigatório): Código do ativo (ex: PETR4, VALE3)

**Query Parameters:**
- `include_fundamental` (boolean, default: true): Incluir dados fundamentalistas
- `include_technical` (boolean, default: true): Incluir dados técnicos
- `include_news` (boolean, default: true): Incluir notícias
- `include_options` (boolean, default: false): Incluir dados de opções
- `include_insider` (boolean, default: false): Incluir dados de insiders

**Exemplo de Requisição:**

```bash
curl -X GET "http://localhost:8000/api/v1/assets/PETR4?include_fundamental=true&include_technical=true" \
  -H "Authorization: Bearer seu_token_aqui"
```

**Exemplo de Resposta:**

```json
{
  "ticker": "PETR4",
  "collected_at": "2025-10-26T14:30:00Z",
  "fundamental": {
    "p_l": 5.23,
    "p_vp": 1.12,
    "roe": 21.5,
    "dividend_yield": 12.8,
    "market_cap": 515000000000.00
  },
  "technical": {
    "price": 38.50,
    "change": 0.75,
    "change_percent": 1.99,
    "volume": 45000000,
    "sma_20": 37.80,
    "sma_200": 35.20,
    "rsi": 58.3
  },
  "options": null,
  "news": {
    "count": 15,
    "sentiment": "positive",
    "latest": [
      {
        "title": "Petrobras anuncia novo programa de dividendos",
        "source": "Valor Econômico",
        "published_at": "2025-10-26T12:00:00Z",
        "sentiment": "positive"
      }
    ]
  },
  "macroeconomic": null,
  "insider": null,
  "errors": [],
  "sources_used": 12
}
```

---

#### `POST /api/v1/assets/collect`

Inicia coleta de dados de um ativo em background.

**Body (JSON):**

```json
{
  "ticker": "PETR4",
  "company_name": "Petrobras PN",
  "force_refresh": false
}
```

**Campos:**
- `ticker` (string, obrigatório): Código do ativo
- `company_name` (string, opcional): Nome da empresa
- `force_refresh` (boolean, opcional, default: false): Forçar nova coleta ignorando cache

**Exemplo de Resposta:**

```json
{
  "status": "collecting",
  "ticker": "PETR4",
  "message": "Coleta iniciada em background",
  "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

#### `POST /api/v1/assets/batch-collect`

Inicia coleta de múltiplos ativos em batch.

**Body (JSON):**

```json
{
  "tickers": ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"]
}
```

**Exemplo de Resposta:**

```json
{
  "status": "collecting",
  "total_assets": 5,
  "tickers": ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"],
  "message": "Coleta em batch iniciada em background",
  "task_id": "b2c3d4e5-f6g7-8901-bcde-f12345678901"
}
```

---

#### `GET /api/v1/assets/{ticker}/fundamental`

Obtém dados fundamentalistas detalhados de um ativo.

**Exemplo de Resposta:**

```json
{
  "ticker": "PETR4",
  "collected_at": "2025-10-26T14:30:00Z",
  "indicators": {
    "p_l": 5.23,
    "p_vp": 1.12,
    "p_ebit": 3.45,
    "psr": 0.87,
    "p_ativos": 0.92,
    "p_cap_giro": 4.21,
    "p_ativ_circ_liq": 6.78,
    "roe": 21.5,
    "roa": 12.3,
    "roic": 18.7,
    "margem_bruta": 45.2,
    "margem_ebit": 28.5,
    "margem_liquida": 18.9,
    "ebit": 85000000000.00,
    "dividend_yield": 12.8,
    "payout": 65.5
  },
  "balance_sheet": {
    "ativo_total": 987000000000.00,
    "passivo_total": 654000000000.00,
    "patrimonio_liquido": 333000000000.00,
    "divida_bruta": 210000000000.00,
    "divida_liquida": 180000000000.00,
    "disponibilidades": 30000000000.00
  },
  "income_statement": {
    "receita_liquida": 450000000000.00,
    "lucro_bruto": 203000000000.00,
    "ebit": 128000000000.00,
    "lucro_liquido": 85000000000.00
  },
  "quality_score": 0.92,
  "sources": ["Fundamentus", "BRAPI", "StatusInvest", "Investidor10"]
}
```

---

#### `GET /api/v1/assets/{ticker}/technical`

Obtém dados técnicos detalhados de um ativo.

**Query Parameters:**
- `timeframe` (string, optional, default: "1d"): Timeframe (1min, 5min, 15min, 1h, 4h, 1d, 1w, 1m)
- `period` (integer, optional, default: 60): Número de períodos

**Exemplo de Resposta:**

```json
{
  "ticker": "PETR4",
  "timeframe": "1d",
  "collected_at": "2025-10-26T14:30:00Z",
  "current_price": 38.50,
  "change": 0.75,
  "change_percent": 1.99,
  "volume": 45000000,
  "indicators": {
    "sma_9": 38.20,
    "sma_20": 37.80,
    "sma_50": 36.50,
    "sma_200": 35.20,
    "ema_9": 38.35,
    "ema_20": 37.95,
    "rsi": 58.3,
    "macd": {
      "value": 0.45,
      "signal": 0.38,
      "histogram": 0.07
    },
    "stochastic": {
      "k": 65.2,
      "d": 62.8
    },
    "atr": 1.25,
    "adx": 28.5,
    "obv": 1250000000,
    "bollinger_bands": {
      "upper": 40.50,
      "middle": 38.00,
      "lower": 35.50
    }
  },
  "patterns": [
    {
      "name": "Bullish Engulfing",
      "confidence": 0.85,
      "detected_at": "2025-10-25"
    }
  ],
  "signals": {
    "trend": "bullish",
    "strength": "medium",
    "recommendation": "buy"
  },
  "sources": ["TradingView", "Investing.com", "Yahoo Finance"]
}
```

---

#### `GET /api/v1/assets/{ticker}/options`

Obtém dados de opções de um ativo.

**Exemplo de Resposta:**

```json
{
  "ticker": "PETR4",
  "collected_at": "2025-10-26T14:30:00Z",
  "options_chain": [
    {
      "symbol": "PETRD245",
      "type": "CALL",
      "strike": 40.00,
      "expiration": "2025-11-15",
      "last_price": 1.85,
      "bid": 1.82,
      "ask": 1.88,
      "volume": 12500,
      "open_interest": 45000,
      "implied_volatility": 0.42,
      "delta": 0.45,
      "gamma": 0.08,
      "theta": -0.05,
      "vega": 0.12,
      "rho": 0.03
    }
  ],
  "expirations": ["2025-11-15", "2025-12-20", "2026-01-17"],
  "iv_rank": 65.5,
  "hv_20": 0.38,
  "strategies": [
    {
      "name": "Bull Call Spread",
      "description": "Comprar PETRD245 e vender PETRD250",
      "max_profit": 300,
      "max_loss": 200,
      "breakeven": 42.00,
      "probability_profit": 0.55
    }
  ],
  "source": "Opcoes.net.br"
}
```

---

#### `GET /api/v1/assets/search`

Busca ativos por nome ou ticker.

**Query Parameters:**
- `q` (string, obrigatório): Termo de busca
- `asset_type` (string, opcional): Filtrar por tipo (STOCK, FII, ETF, BDR)
- `sector` (string, opcional): Filtrar por setor
- `limit` (integer, opcional, default: 20): Limite de resultados

**Exemplo:**

```bash
GET /api/v1/assets/search?q=petro&asset_type=STOCK&limit=10
```

**Resposta:**

```json
{
  "results": [
    {
      "ticker": "PETR4",
      "name": "Petrobras PN",
      "asset_type": "STOCK",
      "sector": "Energia",
      "current_price": 38.50,
      "change_percent": 1.99,
      "volume": 45000000
    },
    {
      "ticker": "PETR3",
      "name": "Petrobras ON",
      "asset_type": "STOCK",
      "sector": "Energia",
      "current_price": 40.20,
      "change_percent": 2.15,
      "volume": 32000000
    }
  ],
  "total": 2,
  "query": "petro"
}
```

---

### Analysis (Análises)

Análises avançadas de ativos usando IA e algoritmos proprietários.

#### `POST /api/v1/analysis/analyze`

Realiza análise completa de um ativo usando IA.

**Body (JSON):**

```json
{
  "ticker": "PETR4",
  "analysis_type": "complete",
  "ai_provider": "openai",
  "include_recommendation": true
}
```

**Campos:**
- `ticker` (string, obrigatório): Código do ativo
- `analysis_type` (string, opcional, default: "complete"): Tipo de análise (complete, fundamental, technical, sentiment)
- `ai_provider` (string, opcional, default: "openai"): Provedor IA (openai, anthropic, gemini, multi)
- `include_recommendation` (boolean, opcional, default: true): Incluir recomendação de compra/venda

**Exemplo de Resposta:**

```json
{
  "ticker": "PETR4",
  "analysis_type": "complete",
  "analyzed_at": "2025-10-26T14:30:00Z",
  "fundamental_analysis": {
    "score": 8.5,
    "summary": "Excelentes indicadores fundamentalistas. P/L atrativo de 5.23x e ROE sólido de 21.5%. Dividend yield de 12.8% muito atraente.",
    "strengths": [
      "P/L baixo comparado ao setor",
      "ROE acima de 20%",
      "Dividend yield excepcional",
      "Baixo endividamento"
    ],
    "weaknesses": [
      "Exposição a volatilidade do petróleo",
      "Riscos políticos"
    ]
  },
  "technical_analysis": {
    "score": 7.2,
    "summary": "Tendência de alta confirmada. RSI em 58.3 indica espaço para valorização. MACD positivo.",
    "signals": {
      "trend": "bullish",
      "strength": "medium",
      "recommendation": "buy"
    },
    "support_levels": [36.50, 35.20, 33.80],
    "resistance_levels": [39.50, 41.00, 43.20]
  },
  "sentiment_analysis": {
    "score": 7.8,
    "overall": "positive",
    "news_sentiment": 0.72,
    "social_sentiment": 0.68,
    "insider_sentiment": "neutral",
    "summary": "Sentimento geral positivo. Notícias recentes sobre dividendos impactaram positivamente."
  },
  "recommendation": {
    "action": "BUY",
    "confidence": 0.82,
    "target_price": 45.00,
    "stop_loss": 34.50,
    "time_horizon": "6-12 months",
    "rationale": "Fundamentos sólidos, tendência técnica de alta e sentimento positivo justificam recomendação de compra. Potencial de valorização de 17%."
  },
  "risks": [
    "Volatilidade do preço do petróleo",
    "Mudanças regulatórias",
    "Riscos políticos no Brasil"
  ],
  "ai_provider": "openai",
  "model": "gpt-4",
  "processing_time_ms": 4523
}
```

---

#### `POST /api/v1/analysis/compare`

Compara múltiplos ativos lado a lado.

**Body (JSON):**

```json
{
  "tickers": ["PETR4", "VALE3", "ITUB4"],
  "comparison_type": "fundamental",
  "metrics": ["p_l", "roe", "dividend_yield", "debt_ratio"]
}
```

**Exemplo de Resposta:**

```json
{
  "tickers": ["PETR4", "VALE3", "ITUB4"],
  "comparison_type": "fundamental",
  "compared_at": "2025-10-26T14:30:00Z",
  "metrics": {
    "p_l": {
      "PETR4": 5.23,
      "VALE3": 4.87,
      "ITUB4": 7.12,
      "best": "VALE3",
      "average": 5.74
    },
    "roe": {
      "PETR4": 21.5,
      "VALE3": 28.3,
      "ITUB4": 18.7,
      "best": "VALE3",
      "average": 22.83
    },
    "dividend_yield": {
      "PETR4": 12.8,
      "VALE3": 9.5,
      "ITUB4": 8.2,
      "best": "PETR4",
      "average": 10.17
    }
  },
  "ranking": [
    {"ticker": "VALE3", "score": 9.2, "position": 1},
    {"ticker": "PETR4", "score": 8.5, "position": 2},
    {"ticker": "ITUB4", "score": 7.8, "position": 3}
  ],
  "summary": "VALE3 apresenta os melhores indicadores fundamentalistas no conjunto, com ROE excepcional e P/L atrativo."
}
```

---

#### `POST /api/v1/analysis/opportunities`

Detecta oportunidades de investimento baseado em critérios.

**Body (JSON):**

```json
{
  "criteria": {
    "min_roe": 15,
    "max_p_l": 10,
    "min_dividend_yield": 5,
    "max_debt_ratio": 0.5
  },
  "asset_types": ["STOCK", "FII"],
  "sectors": ["Energia", "Financeiro", "Mineração"],
  "limit": 10
}
```

**Exemplo de Resposta:**

```json
{
  "opportunities": [
    {
      "ticker": "PETR4",
      "name": "Petrobras PN",
      "score": 9.1,
      "reason": "ROE de 21.5% acima do mínimo, P/L de 5.23 abaixo do máximo, dividend yield de 12.8% muito atrativo",
      "metrics": {
        "roe": 21.5,
        "p_l": 5.23,
        "dividend_yield": 12.8,
        "debt_ratio": 0.42
      }
    }
  ],
  "total_found": 15,
  "filtered_from": 450,
  "criteria_applied": {
    "min_roe": 15,
    "max_p_l": 10,
    "min_dividend_yield": 5,
    "max_debt_ratio": 0.5
  }
}
```

---

### Reports (Relatórios)

Geração de relatórios profissionais com análise completa.

#### `POST /api/v1/reports/generate`

Gera um relatório completo de análise de ativo.

**Body (JSON):**

```json
{
  "ticker": "PETR4",
  "report_type": "complete",
  "format": "pdf",
  "language": "pt-BR",
  "include_charts": true,
  "include_recommendations": true,
  "ai_providers": ["openai", "anthropic"]
}
```

**Campos:**
- `ticker` (string, obrigatório): Código do ativo
- `report_type` (string, opcional, default: "complete"): Tipo (complete, fundamental, technical, options, comparison)
- `format` (string, opcional, default: "pdf"): Formato (pdf, html, markdown)
- `language` (string, opcional, default: "pt-BR"): Idioma (pt-BR, en-US)
- `include_charts` (boolean, opcional, default: true): Incluir gráficos
- `include_recommendations` (boolean, opcional, default: true): Incluir recomendações
- `ai_providers` (array, opcional): Provedores IA para análise multi-IA

**Exemplo de Resposta:**

```json
{
  "report_id": "rep_a1b2c3d4e5f6",
  "ticker": "PETR4",
  "report_type": "complete",
  "format": "pdf",
  "status": "generating",
  "estimated_time_seconds": 30,
  "download_url": null,
  "message": "Relatório em geração. Use o report_id para consultar o status."
}
```

---

#### `GET /api/v1/reports/{report_id}`

Consulta o status e detalhes de um relatório.

**Exemplo de Resposta (em geração):**

```json
{
  "report_id": "rep_a1b2c3d4e5f6",
  "ticker": "PETR4",
  "status": "generating",
  "progress": 65,
  "message": "Gerando análise técnica..."
}
```

**Exemplo de Resposta (completo):**

```json
{
  "report_id": "rep_a1b2c3d4e5f6",
  "ticker": "PETR4",
  "report_type": "complete",
  "format": "pdf",
  "status": "completed",
  "generated_at": "2025-10-26T14:32:45Z",
  "file_size_bytes": 2458192,
  "pages": 28,
  "download_url": "http://localhost:8000/api/v1/reports/rep_a1b2c3d4e5f6/download",
  "expires_at": "2025-11-02T14:32:45Z",
  "metadata": {
    "analysis_score": 8.5,
    "recommendation": "BUY",
    "target_price": 45.00,
    "ai_providers": ["openai", "anthropic"],
    "sources_used": 15
  }
}
```

---

#### `GET /api/v1/reports/{report_id}/download`

Baixa o arquivo do relatório.

**Headers de Resposta:**
- `Content-Type`: application/pdf | text/html | text/markdown
- `Content-Disposition`: attachment; filename="PETR4_analysis_2025-10-26.pdf"

---

#### `GET /api/v1/reports`

Lista todos os relatórios gerados.

**Query Parameters:**
- `ticker` (string, opcional): Filtrar por ticker
- `report_type` (string, opcional): Filtrar por tipo
- `status` (string, opcional): Filtrar por status (generating, completed, failed)
- `skip` (integer, opcional, default: 0): Paginação
- `limit` (integer, opcional, default: 20): Limite por página

**Exemplo de Resposta:**

```json
{
  "reports": [
    {
      "report_id": "rep_a1b2c3d4e5f6",
      "ticker": "PETR4",
      "report_type": "complete",
      "format": "pdf",
      "status": "completed",
      "generated_at": "2025-10-26T14:32:45Z",
      "file_size_bytes": 2458192
    }
  ],
  "total": 125,
  "skip": 0,
  "limit": 20
}
```

---

### Portfolio (Portfólio)

Gerenciamento de portfólio multi-mercado.

#### `POST /api/v1/portfolio/import`

Importa posições de portfólio de arquivos ou APIs externas.

**Body (multipart/form-data):**

```
file: <arquivo.xlsx>
source: "kinvo"
merge: true
```

**Ou (JSON para API):**

```json
{
  "source": "investidor10",
  "api_key": "sua_api_key",
  "merge": true
}
```

**Fontes Suportadas:**
- Kinvo (arquivo XLSX)
- Investidor10 (arquivo XLSX ou API)
- B3 (arquivo CEI)
- MyProfit (arquivo CSV)
- NuInvest (arquivo CSV)
- Binance (API)

**Exemplo de Resposta:**

```json
{
  "status": "success",
  "source": "kinvo",
  "positions_imported": 25,
  "positions_updated": 8,
  "positions_new": 17,
  "total_value": 125000.00,
  "processing_time_ms": 1250,
  "errors": []
}
```

---

#### `GET /api/v1/portfolio`

Obtém visão consolidada do portfólio.

**Exemplo de Resposta:**

```json
{
  "portfolio_id": "pf_main",
  "total_value": 125000.00,
  "total_invested": 100000.00,
  "total_profit": 25000.00,
  "total_profit_percent": 25.00,
  "positions_count": 25,
  "last_updated": "2025-10-26T14:30:00Z",
  "allocation": {
    "STOCK": 65.5,
    "FII": 20.0,
    "ETF": 10.0,
    "BDR": 4.5
  },
  "top_positions": [
    {
      "ticker": "PETR4",
      "quantity": 500,
      "average_price": 30.00,
      "current_price": 38.50,
      "total_invested": 15000.00,
      "current_value": 19250.00,
      "profit": 4250.00,
      "profit_percent": 28.33,
      "allocation_percent": 15.4
    }
  ],
  "performance": {
    "day": 1.25,
    "week": 3.45,
    "month": 8.72,
    "year": 25.00,
    "total": 25.00
  }
}
```

---

#### `GET /api/v1/portfolio/summary`

Obtém resumo executivo do portfólio.

**Exemplo de Resposta:**

```json
{
  "total_value": 125000.00,
  "total_invested": 100000.00,
  "total_profit": 25000.00,
  "profit_percent": 25.00,
  "positions_count": 25,
  "diversification_score": 7.8,
  "risk_score": 6.5,
  "allocation_by_sector": {
    "Energia": 25.5,
    "Financeiro": 20.0,
    "Mineração": 15.5,
    "Outros": 39.0
  },
  "alerts": [
    {
      "type": "concentration",
      "severity": "medium",
      "message": "Portfólio concentrado em setor de Energia (25.5%). Considere diversificar."
    }
  ],
  "recommendations": [
    {
      "action": "rebalance",
      "reason": "Alocação de FII abaixo do target de 25%",
      "suggested_allocation": {"FII": 25.0}
    }
  ]
}
```

---

## 📊 Modelos de Dados

### Asset (Ativo)

```typescript
interface Asset {
  id: number;
  ticker: string;              // Ex: "PETR4"
  name: string;                // Ex: "Petrobras PN"
  asset_type: AssetType;       // STOCK | FII | ETF | BDR
  sector?: string;             // Ex: "Energia"
  subsector?: string;          // Ex: "Petróleo e Gás"
  segment?: string;            // Ex: "Novo Mercado"
  cnpj?: string;               // Ex: "33.000.167/0001-01"
  current_price?: number;      // Ex: 38.50
  market_cap?: number;         // Ex: 515000000000.00
  free_float?: number;         // Ex: 23.5
  average_volume?: number;     // Ex: 45000000.00
  is_active: boolean;
  created_at: string;          // ISO 8601
  updated_at?: string;         // ISO 8601
}
```

### FundamentalData

```typescript
interface FundamentalData {
  ticker: string;
  collected_at: string;
  p_l?: number;
  p_vp?: number;
  roe?: number;
  roa?: number;
  roic?: number;
  dividend_yield?: number;
  payout?: number;
  market_cap?: number;
  net_revenue?: number;
  net_profit?: number;
  ebit?: number;
  quality_score: number;
  sources: string[];
}
```

### TechnicalData

```typescript
interface TechnicalData {
  ticker: string;
  timeframe: string;
  collected_at: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  indicators: {
    sma_20?: number;
    sma_50?: number;
    sma_200?: number;
    rsi?: number;
    macd?: {
      value: number;
      signal: number;
      histogram: number;
    };
    bollinger_bands?: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  signals: {
    trend: "bullish" | "bearish" | "neutral";
    strength: "strong" | "medium" | "weak";
    recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  };
}
```

---

## 🚦 Códigos de Status HTTP

### Sucesso (2xx)

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `202 Accepted`: Requisição aceita para processamento assíncrono
- `204 No Content`: Sucesso sem conteúdo no body

### Erro Cliente (4xx)

- `400 Bad Request`: Requisição inválida (parâmetros, body)
- `401 Unauthorized`: Token ausente ou inválido
- `403 Forbidden`: Token válido mas sem permissão
- `404 Not Found`: Recurso não encontrado
- `422 Unprocessable Entity`: Validação de dados falhou
- `429 Too Many Requests`: Rate limit excedido

### Erro Servidor (5xx)

- `500 Internal Server Error`: Erro interno do servidor
- `502 Bad Gateway`: Erro no gateway upstream
- `503 Service Unavailable`: Serviço temporariamente indisponível
- `504 Gateway Timeout`: Timeout no processamento

---

## 💡 Exemplos de Uso

### Python

```python
import requests

# Configuração
BASE_URL = "http://localhost:8000/api/v1"
TOKEN = "seu_token_aqui"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Obter dados de um ativo
response = requests.get(
    f"{BASE_URL}/assets/PETR4",
    headers=headers,
    params={
        "include_fundamental": True,
        "include_technical": True
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"Preço: R$ {data['technical']['price']}")
    print(f"P/L: {data['fundamental']['p_l']}")
else:
    print(f"Erro: {response.status_code}")

# Gerar relatório
report_request = {
    "ticker": "PETR4",
    "report_type": "complete",
    "format": "pdf",
    "include_charts": True
}

response = requests.post(
    f"{BASE_URL}/reports/generate",
    headers=headers,
    json=report_request
)

if response.status_code == 200:
    report = response.json()
    report_id = report['report_id']
    print(f"Relatório em geração: {report_id}")
else:
    print(f"Erro: {response.status_code}")
```

### JavaScript/TypeScript

```typescript
const BASE_URL = 'http://localhost:8000/api/v1';
const TOKEN = 'seu_token_aqui';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

// Obter dados de um ativo
async function getAssetData(ticker: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/assets/${ticker}?include_fundamental=true&include_technical=true`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`Preço: R$ ${data.technical.price}`);
    console.log(`P/L: ${data.fundamental.p_l}`);

    return data;
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Gerar relatório
async function generateReport(ticker: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/reports/generate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ticker,
          report_type: 'complete',
          format: 'pdf',
          include_charts: true
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const report = await response.json();
    console.log(`Relatório em geração: ${report.report_id}`);

    return report;
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Uso
await getAssetData('PETR4');
await generateReport('PETR4');
```

### cURL

```bash
# Obter dados de ativo
curl -X GET "http://localhost:8000/api/v1/assets/PETR4?include_fundamental=true" \
  -H "Authorization: Bearer seu_token_aqui"

# Gerar relatório
curl -X POST "http://localhost:8000/api/v1/reports/generate" \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "PETR4",
    "report_type": "complete",
    "format": "pdf",
    "include_charts": true
  }'

# Comparar ativos
curl -X POST "http://localhost:8000/api/v1/analysis/compare" \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "tickers": ["PETR4", "VALE3", "ITUB4"],
    "comparison_type": "fundamental"
  }'
```

---

## ⚠️ Erros Comuns

### 401 Unauthorized - Token Inválido

```json
{
  "detail": "Token inválido ou expirado"
}
```

**Solução**: Obtenha um novo token via `/api/v1/auth/login`

---

### 404 Not Found - Ativo não Encontrado

```json
{
  "detail": "Asset INVALID4 not found"
}
```

**Solução**: Verifique o ticker. Use `/api/v1/assets/search` para buscar ativos válidos.

---

### 429 Too Many Requests - Rate Limit

```json
{
  "detail": "Rate limit exceeded. Try again in 30 seconds.",
  "retry_after": 30
}
```

**Solução**: Aguarde o tempo indicado em `retry_after` antes de nova requisição.

---

### 422 Unprocessable Entity - Validação Falhou

```json
{
  "detail": [
    {
      "loc": ["body", "ticker"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Solução**: Corrija os campos indicados em `detail`.

---

### 500 Internal Server Error - Erro no Servidor

```json
{
  "detail": "Internal server error. Please try again later.",
  "error_id": "err_a1b2c3d4"
}
```

**Solução**: Entre em contato com suporte informando o `error_id`.

---

## 📦 SDKs e Libraries

### Python SDK (Em Desenvolvimento)

```python
from b3_analysis import B3Client

client = B3Client(token="seu_token_aqui")

# Obter dados
data = client.assets.get("PETR4", include_fundamental=True)

# Gerar relatório
report = client.reports.generate("PETR4", format="pdf")
```

### JavaScript/TypeScript SDK (Em Desenvolvimento)

```typescript
import { B3Client } from '@b3analysis/sdk';

const client = new B3Client({ token: 'seu_token_aqui' });

// Obter dados
const data = await client.assets.get('PETR4', {
  includeFundamental: true
});

// Gerar relatório
const report = await client.reports.generate('PETR4', {
  format: 'pdf'
});
```

---

## 📞 Suporte

- **Documentação**: https://docs.b3analysis.com
- **Email**: support@b3analysis.com
- **GitHub Issues**: https://github.com/yourusername/b3-investment-platform/issues
- **Discord**: https://discord.gg/b3analysis

---

## 📄 Licença

Esta API é distribuída sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Última atualização:** 2025-10-26
**Versão do documento:** 1.0.0
