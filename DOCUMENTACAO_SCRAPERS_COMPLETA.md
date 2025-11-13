# DOCUMENTAÇÃO COMPLETA - Scrapers e Fontes de Dados

**Data:** 2025-11-13
**Responsável:** Claude Code (Sonnet 4.5)
**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Versão:** 1.0.0

---

## 📋 SUMÁRIO EXECUTIVO

### Objetivo
Documentar TODAS as fontes de dados planejadas para o sistema, incluindo scrapers implementados, em desenvolvimento e planejados.

### Status Geral
- **Implementados:** 4 scrapers (análise fundamentalista)
- **Planejados:** 30+ fontes (diversos tipos)
- **Taxa de Implementação:** 11.76% (4/34 fontes)

---

## 🎯 CATEGORIAS DE FONTES

### 1️⃣ Análise Fundamentalista (6 fontes)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 1 | **Fundamentus** | https://fundamentus.com.br | Público | Não | ✅ **Implementado** | `fundamentus.scraper.ts` |
| 2 | **BRAPI** | https://brapi.dev | API Pública | Token | ✅ **Implementado** | `brapi.scraper.ts` |
| 3 | **Status Invest** | https://statusinvest.com.br | Privado | Google OAuth | ✅ **Implementado** | `statusinvest.scraper.ts` |
| 4 | **Investidor10** | https://investidor10.com.br | Privado | Google OAuth | ✅ **Implementado** | `investidor10.scraper.ts` |
| 5 | **Fundamentei** | https://fundamentei.com | Privado | Google OAuth | 🔜 Planejado | - |
| 6 | **Investsite** | https://www.investsite.com.br | Público | Não | 🔜 Planejado | - |

#### Dados Coletados (Fundamentalista)
- **Valuation:** P/L, P/VP, EV/EBITDA
- **Rentabilidade:** ROE, ROA, ROIC, Margem Líquida
- **Dividendos:** Dividend Yield, Payout
- **Endividamento:** Dívida Líquida/EBITDA, Dívida Líquida/Patrimônio
- **Crescimento:** LPA (últimos 5 anos), Receita Líquida

---

### 2️⃣ Análise Geral do Mercado (3 fontes)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 7 | **Investing.com** | https://br.investing.com | Privado | Google OAuth | 🔜 Planejado | - |
| 8 | **ADVFN** | https://br.advfn.com | Privado | Google OAuth | 🔜 Planejado | - |
| 9 | **Google Finance** | https://www.google.com/finance | Privado | Google OAuth | 🔜 Planejado | - |

#### Dados Coletados (Mercado)
- **Preços:** Cotações em tempo real, histórico
- **Volume:** Negociações diárias
- **Indicadores:** Máximas, mínimas, variação %
- **Notícias:** Feed de notícias relacionadas
- **Calendário:** Eventos econômicos

---

### 3️⃣ Análise Gráfica/Técnica (1 fonte)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 10 | **TradingView** | https://br.tradingview.com | Privado | Google OAuth | 🔜 Planejado | - |

#### Dados Coletados (Técnica)
- **Indicadores:** RSI, MACD, Bollinger Bands, Médias Móveis
- **Padrões:** Candles, suportes, resistências
- **Volume:** Análise de volume
- **Sinais:** Compra, venda, neutro

---

### 4️⃣ Análise de Opções (1 fonte)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 11 | **Opcoes.net.br** | https://opcoes.net.br | Privado | Usuário/Senha | 🔜 Planejado | - |

**Credenciais:**
- Usuário: `312.862.178-06`
- Senha: `Safra998266@#`

#### Dados Coletados (Opções)
- **Preço de Exercício (Strike)**
- **Volatilidade Implícita (IV)**
- **Greeks:** Delta, Gamma, Theta, Vega, Rho
- **Vencimentos:** Próximos vencimentos
- **Volume:** Open Interest

---

### 5️⃣ Análise de Criptomoedas (1 fonte)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 12 | **CoinMarketCap** | https://coinmarketcap.com | Público/API | API Key | 🔜 Planejado | - |

#### Dados Coletados (Cripto)
- **Preço:** BTC, ETH, principais altcoins
- **Market Cap:** Capitalização de mercado
- **Volume 24h:** Volume de negociações
- **Dominância:** BTC dominance
- **Fear & Greed Index**

---

### 6️⃣ Análise de Insiders (1 fonte)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 13 | **Griffin** | https://griffin.app.br | Privado | Google OAuth | 🔜 Planejado | - |

#### Dados Coletados (Insiders)
- **Compras/Vendas:** Transações de insiders
- **Volume:** Quantidade de ações
- **Data:** Datas das operações
- **Cargo:** Diretor, CEO, etc.

---

### 7️⃣ Relatórios e Análises Institucionais (4 fontes)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 14 | **BTG Pactual** | https://content.btgpactual.com/research | Privado | Token celular | 🔜 Planejado | - |
| 15 | **XP Investimentos** | https://conteudos.xpi.com.br | Privado | Token celular | 🔜 Planejado | - |
| 16 | **Estadão Investidor** | https://einvestidor.estadao.com.br | Privado | Google OAuth | 🔜 Planejado | - |
| 17 | **Mais Retorno** | https://maisretorno.com | Privado | Google OAuth | 🔜 Planejado | - |

#### Dados Coletados (Relatórios)
- **Recomendações:** Compra, venda, neutro
- **Preço-alvo:** Target price
- **Tese de Investimento:** Análise qualitativa
- **Ratings:** Ratings de analistas

---

### 8️⃣ Busca Geral e Dados Oficiais (6 fontes)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 18 | **B3** | https://www.b3.com.br | Público | Não | 🔜 Planejado | - |
| 19 | **Google Search** | https://www.google.com | Privado | Google OAuth | 🔜 Planejado | - |
| 20 | **ChatGPT** | https://chatgpt.com | Privado | Google OAuth | 🔜 Planejado | - |
| 21 | **DeepSeek** | https://www.deepseek.com | Privado | Google OAuth | 🔜 Planejado | - |
| 22 | **Google Gemini** | https://gemini.google.com/app | Privado | Google OAuth | 🔜 Planejado | - |
| 23 | **Claude AI** | https://claude.ai/new | Privado | Google OAuth | 🔜 Planejado | - |
| 24 | **Grok** | https://grok.com | Privado | Google OAuth | 🔜 Planejado | - |
| 25 | **Banco Central** | https://www.bcb.gov.br | Público | Não | 🔜 Planejado | - |

#### Dados Coletados (Oficial/IA)
- **B3:** Cotações oficiais, horário de negociação
- **Banco Central:** Taxa Selic, IPCA, câmbio
- **IAs:** Análises contextuais, resumos de notícias

---

### 9️⃣ Notícias Especializadas (6 fontes)

| # | Nome | URL | Tipo Acesso | Login | Status | Scraper |
|---|------|-----|-------------|-------|--------|---------|
| 26 | **Google News** | https://news.google.com | Privado | Google OAuth | 🔜 Planejado | - |
| 27 | **Bloomberg Línea** | https://www.bloomberglinea.com.br | Público | Não | 🔜 Planejado | - |
| 28 | **Investing News** | https://br.investing.com/news | Privado | Google OAuth | 🔜 Planejado | - |
| 29 | **Valor Econômico** | https://valor.globo.com | Privado | Google OAuth | 🔜 Planejado | - |
| 30 | **Exame** | https://exame.com | Privado | Google OAuth | 🔜 Planejado | - |
| 31 | **InfoMoney** | https://www.infomoney.com.br | Privado | Google OAuth | 🔜 Planejado | - |

#### Dados Coletados (Notícias)
- **Título:** Manchete da notícia
- **Data:** Data de publicação
- **Resumo:** Resumo do artigo
- **Fonte:** Autor ou agência
- **Sentimento:** Positivo, neutro, negativo (análise de IA)

---

## 📊 ESTATÍSTICAS GERAIS

### Por Categoria
| Categoria | Total Fontes | Implementadas | Planejadas | % Completo |
|-----------|--------------|---------------|------------|------------|
| Fundamentalista | 6 | 4 | 2 | 66.67% |
| Mercado | 3 | 0 | 3 | 0% |
| Técnica | 1 | 0 | 1 | 0% |
| Opções | 1 | 0 | 1 | 0% |
| Criptomoedas | 1 | 0 | 1 | 0% |
| Insiders | 1 | 0 | 1 | 0% |
| Relatórios | 4 | 0 | 4 | 0% |
| Oficial/IA | 8 | 0 | 8 | 0% |
| Notícias | 6 | 0 | 6 | 0% |
| **TOTAL** | **31** | **4** | **27** | **12.90%** |

### Por Tipo de Acesso
| Tipo | Quantidade | % |
|------|------------|---|
| Público (sem login) | 6 | 19.35% |
| Privado (Google OAuth) | 20 | 64.52% |
| API Pública (token) | 2 | 6.45% |
| Privado (usuário/senha) | 1 | 3.23% |
| Privado (token celular) | 2 | 6.45% |

---

## 🔧 ARQUITETURA DE SCRAPERS

### Estrutura de Pastas

```
backend/src/scrapers/
├── base/
│   └── base-scraper.interface.ts          # Interface base
├── fundamental/
│   ├── fundamentus.scraper.ts              # ✅ Implementado
│   ├── brapi.scraper.ts                    # ✅ Implementado
│   ├── statusinvest.scraper.ts             # ✅ Implementado
│   ├── investidor10.scraper.ts             # ✅ Implementado
│   ├── fundamentei.scraper.ts              # 🔜 Planejado
│   └── investsite.scraper.ts               # 🔜 Planejado
├── market/                                  # 🔜 Pasta futura
│   ├── investing.scraper.ts
│   ├── advfn.scraper.ts
│   └── googlefinance.scraper.ts
├── technical/                               # 🔜 Pasta futura
│   └── tradingview.scraper.ts
├── options/                                 # 🔜 Pasta futura
│   └── opcoes.scraper.ts
├── crypto/                                  # 🔜 Pasta futura
│   └── coinmarketcap.scraper.ts
├── insiders/                                # 🔜 Pasta futura
│   └── griffin.scraper.ts
├── reports/                                 # 🔜 Pasta futura
│   ├── btg.scraper.ts
│   ├── xp.scraper.ts
│   ├── estadao.scraper.ts
│   └── maisretorno.scraper.ts
├── news/                                    # 🔜 Pasta futura
│   ├── googlenews.scraper.ts
│   ├── bloomberg.scraper.ts
│   ├── investingnews.scraper.ts
│   ├── valor.scraper.ts
│   ├── exame.scraper.ts
│   └── infomoney.scraper.ts
├── official/                                # 🔜 Pasta futura
│   ├── b3.scraper.ts
│   ├── bcb.scraper.ts
│   └── google.scraper.ts
├── ai/                                      # 🔜 Pasta futura
│   ├── chatgpt.scraper.ts
│   ├── deepseek.scraper.ts
│   ├── gemini.scraper.ts
│   ├── claude.scraper.ts
│   └── grok.scraper.ts
├── auth/
│   └── google-oauth.service.ts              # Compartilhado
├── scrapers.service.ts                      # Orquestrador
├── scrapers.controller.ts                   # API REST
└── scrapers.module.ts                       # Módulo NestJS
```

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### FASE 1 - Fundamentalista ✅ **COMPLETO** (4/6)
- [x] Fundamentus
- [x] BRAPI
- [x] Status Invest
- [x] Investidor10
- [ ] Fundamentei
- [ ] Investsite

**Prioridade:** Alta
**Complexidade:** Baixa-Média
**Tempo Estimado:** 2 semanas (2 scrapers restantes)

### FASE 2 - Mercado 🔜 PLANEJADO (0/3)
- [ ] Investing.com
- [ ] ADVFN
- [ ] Google Finance

**Prioridade:** Alta
**Complexidade:** Média
**Tempo Estimado:** 2 semanas

### FASE 3 - Técnica 🔜 PLANEJADO (0/1)
- [ ] TradingView

**Prioridade:** Média
**Complexidade:** Alta (análise de gráficos)
**Tempo Estimado:** 1 semana

### FASE 4 - Opções 🔜 PLANEJADO (0/1)
- [ ] Opcoes.net.br

**Prioridade:** Média
**Complexidade:** Alta (cálculo de greeks)
**Tempo Estimado:** 1 semana

### FASE 5 - Notícias 🔜 PLANEJADO (0/6)
- [ ] Google News
- [ ] Bloomberg Línea
- [ ] Investing News
- [ ] Valor Econômico
- [ ] Exame
- [ ] InfoMoney

**Prioridade:** Média
**Complexidade:** Baixa-Média
**Tempo Estimado:** 2 semanas

### FASE 6 - Oficial/IA 🔜 PLANEJADO (0/8)
- [ ] B3
- [ ] Banco Central
- [ ] Google Search
- [ ] ChatGPT
- [ ] DeepSeek
- [ ] Google Gemini
- [ ] Claude AI
- [ ] Grok

**Prioridade:** Média-Alta (B3 e BCB), Baixa (IAs)
**Complexidade:** Baixa (B3/BCB), Alta (IAs)
**Tempo Estimado:** 3 semanas

### FASE 7 - Relatórios 🔜 PLANEJADO (0/4)
- [ ] BTG Pactual
- [ ] XP Investimentos
- [ ] Estadão Investidor
- [ ] Mais Retorno

**Prioridade:** Baixa
**Complexidade:** Alta (PDFs, autenticação complexa)
**Tempo Estimado:** 2 semanas

### FASE 8 - Especializados 🔜 PLANEJADO (0/2)
- [ ] CoinMarketCap (cripto)
- [ ] Griffin (insiders)

**Prioridade:** Baixa
**Complexidade:** Média
**Tempo Estimado:** 1 semana

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### 1. Completar Fundamentalista (2 scrapers)
- [ ] Implementar `fundamentei.scraper.ts`
- [ ] Implementar `investsite.scraper.ts`
- [ ] Atualizar `ScrapersService` para 6 fontes
- [ ] Atualizar cross-validation (mínimo 4 fontes)
- [ ] Atualizar frontend `/data-sources` para 6 cards
- [ ] Testes completos (Playwright, Selenium, Chrome DevTools)

### 2. Melhorar Sistema Atual
- [ ] Implementar métricas reais (tabela `scraper_metrics`)
- [ ] Implementar botão "Testar" (teste individual de scraper)
- [ ] Implementar botão "Sincronizar" (force refresh)
- [ ] Adicionar gráficos de performance
- [ ] Dashboard de monitoramento (health checks)

### 3. Documentação
- [ ] Adicionar README para cada scraper
- [ ] Criar guia de desenvolvimento de novos scrapers
- [ ] Documentar padrões de autenticação
- [ ] Criar troubleshooting guide

---

## 📚 REFERÊNCIAS

### Documentos do Projeto
- `claude.md` - Seção "Fontes de Dados"
- `CHECKLIST_SCRAPERS_DATA_SOURCES.md` - Checklist de validação
- `backend/src/scrapers/scrapers.service.ts` - Orquestrador
- `backend/src/scrapers/scrapers.controller.ts` - API REST

### Commits Relacionados
- `4eaf7d5` - feat: Conectar /data-sources com dados reais dos scrapers

### URLs Úteis
- Frontend: http://localhost:3100/data-sources
- Backend API: http://localhost:3101/api/v1/scrapers/status
- Swagger: http://localhost:3101/api/docs

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-13
**Versão:** 1.0.0
**Status:** 📝 Documentação em Progresso (12.90% completo)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
