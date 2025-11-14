# TODO - PRÓXIMAS FASES

**Data Criação:** 2025-11-14
**Responsável:** Claude Code (Sonnet 4.5)
**Contexto:** Planejamento detalhado pós-resolução problema crítico
**Metodologia:** Ultra-Thinking + TodoWrite + MCP Triplo

---

## 📊 STATUS ATUAL DO PROJETO

### Fases Concluídas ✅
- ✅ FASE 1-10: Backend Core (100%)
- ✅ FASE 11: Frontend Core (/dashboard, /assets, /analysis, /portfolio, etc)
- ✅ FASE 12-21: Validação Frontend (100% - 12 fases)
- ✅ FASE 22: Sistema de Atualização de Ativos (100%)
- ✅ FASE 22.5: Correções e Melhorias do Portfólio (100%)
- ✅ FASE 3: Refatoração Sistema Reports (6/6 subfases - 100%)
- ✅ FASE 9: OAuth Manager - Validação Frontend (100%)
- ✅ FASE 23: Sistema de Métricas de Scrapers (100%)
- ✅ **FIX CRÍTICO:** Puppeteer Timeout Resolvido (2025-11-14)

### Problemas Crônicos
- ✅ **#1 (CRÍTICO):** Puppeteer Navigation Timeout - **RESOLVIDO** (commit d4ac091)
- ⚠️ **#2 (MÉDIO):** Script system-manager.ps1 encoding - **PENDENTE**
- ⚠️ **#3 (MÉDIO):** BRAPI 403 Forbidden esporádico - **PENDENTE**
- ⚠️ **#4 (MÉDIO):** InvestsiteScraper seletor inválido - **PENDENTE**
- ⚠️ **#5 (MÉDIO):** FundamenteiScraper CSS parsing error - **PENDENTE**

### Estatísticas
- **Git:** 26 commits na main (todos pushed)
- **TypeScript:** 0 erros (backend + frontend)
- **Build:** Success (backend 9.2s, frontend 17 páginas)
- **Docker:** 12 serviços UP (todos healthy)
- **Scrapers:** 6/31 fontes implementadas (19.35%)

---

## 🎯 FASES PLANEJADAS

### FASE 24: Dados Históricos BRAPI 🔜 **PRÓXIMA PRIORIDADE**

**Status:** 📋 PLANEJADO
**Prioridade:** 🟡 MÉDIA
**Tempo Estimado:** 4-6 horas
**Dependências:** BRAPI API (funcional)

**Objetivo:**
Implementar sistema de coleta e armazenamento de dados históricos de preços usando API BRAPI, permitindo análises temporais e backtesting.

**Descrição:**
Atualmente o sistema coleta apenas o preço atual e last 30 days de dados. Esta fase implementará coleta de histórico completo (diário, semanal, mensal) para permitir análises técnicas avançadas e backtesting de estratégias.

#### Checklist de Implementação

**24.1. Pesquisa e Planejamento (1h)**
- [ ] 1.1. Pesquisar endpoints BRAPI para histórico
  - Documentação: https://brapi.dev/docs
  - Endpoints conhecidos: `/api/quote/{ticker}?range=1mo|3mo|6mo|1y|2y|5y|10y|max`
  - Formatos: JSON, CSV
- [ ] 1.2. Verificar períodos disponíveis
  - Diário (daily)
  - Semanal (weekly)
  - Mensal (monthly)
  - Anual (yearly)
  - Ranges: 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, max
- [ ] 1.3. Comparar com Investing.com
  - Investing.com: Histórico completo, mas requer scraping
  - BRAPI: API estruturada, mais confiável
  - Decisão: Usar BRAPI como fonte primária
- [ ] 1.4. Analisar limitações de API
  - Rate limiting: Verificar limites da BRAPI
  - Token: Verificar se requer token especial para histórico
  - Cache: Planejar cache de dados históricos

**24.2. Estrutura de Tabela (1h)**
- [ ] 2.1. Criar migration `CreateHistoricalPrices`
  - Tabela: `historical_prices`
  - Colunas: id, asset_id, date, period_type, open, high, low, close, volume, created_at
  - Indexes: (asset_id, date), (asset_id, period_type, date)
  - Unique constraint: (asset_id, date, period_type)
- [ ] 2.2. Criar entity `HistoricalPrice`
  - TypeORM entity com decorators
  - Relacionamento: ManyToOne com Asset
  - Enum: PeriodType ('daily' | 'weekly' | 'monthly')
- [ ] 2.3. Validar schema
  - TypeScript: 0 erros
  - Migration: npm run migration:run

**24.3. Backend Service (2h)**
- [ ] 3.1. Criar `HistoricalPricesService`
  - Method: `fetchHistoricalData(ticker, range)`
  - Method: `storeHistoricalData(ticker, data)`
  - Method: `getHistoricalData(ticker, startDate, endDate, periodType)`
  - Method: `cleanupOldData(days)` - Auto-limpeza
- [ ] 3.2. Integrar com BRAPI
  - Endpoint: GET /api/quote/{ticker}/historical?range=1y
  - Response parsing: Converter para HistoricalPrice[]
  - Error handling: Retry logic, fallbacks
- [ ] 3.3. Criar endpoints REST
  - POST /api/v1/assets/:ticker/historical/fetch
  - GET /api/v1/assets/:ticker/historical?startDate=&endDate=&periodType=
  - GET /api/v1/assets/:ticker/historical/summary

**24.4. Frontend Component (1h)**
- [ ] 4.1. Criar hook `useHistoricalPrices(ticker, range)`
  - React Query integration
  - Stale time: 1 hora
  - Refetch on window focus: false
- [ ] 4.2. Criar componente `HistoricalPricesChart`
  - Recharts LineChart
  - Time range selector (1m, 3m, 6m, 1y, 2y, 5y, max)
  - Period type selector (daily, weekly, monthly)
- [ ] 4.3. Integrar em `/assets/[ticker]` page
  - Tab "Histórico de Preços"
  - Chart interativo
  - Download CSV/JSON

**24.5. Validação e Testes (1h)**
- [ ] 5.1. TypeScript: 0 erros
- [ ] 5.2. Build: Success
- [ ] 5.3. Testes manuais:
  - [ ] Fetch histórico PETR4 (1 ano)
  - [ ] Validar dados salvos no banco
  - [ ] Validar chart renderiza corretamente
  - [ ] Testar seletor de ranges
- [ ] 5.4. MCP Triplo (Playwright + Chrome DevTools + Selenium)

**24.6. Documentação e Commit (0.5h)**
- [ ] 6.1. Criar `VALIDACAO_FASE_24_HISTORICO.md`
- [ ] 6.2. Atualizar CLAUDE.md (roadmap)
- [ ] 6.3. Screenshots (3+)
- [ ] 6.4. Commit com co-autoria
- [ ] 6.5. Push para origin

**Referências:**
- BRAPI Docs: https://brapi.dev/docs
- Recharts Docs: https://recharts.org/en-US/

---

### FASE 25: Refatoração Botão "Solicitar Análises" ⏳ **AGUARDANDO APROVAÇÃO**

**Status:** ⏳ AGUARDANDO DECISÃO DO USUÁRIO
**Prioridade:** 🟡 MÉDIA
**Tempo Estimado:** 2-3 horas
**Dependências:** Aprovação do usuário

**Objetivo:**
Remover botão "Solicitar Análises em Massa" de `/assets` e mover para `/analysis`, onde a funcionalidade já existe. Adicionar tooltip explicativo sobre coleta multi-fonte.

**Descrição:**
Atualmente o botão "Solicitar Análises" aparece em múltiplas páginas de forma inconsistente. Esta refatoração centraliza a funcionalidade em um único local lógico.

#### Checklist de Implementação

**25.1. Análise Atual (0.5h)**
- [ ] 1.1. Mapear todos os botões "Solicitar Análise" no sistema
  - /assets: Botão global (remover)
  - /analysis: Botão individual por análise (manter)
  - /reports: Botão individual por ativo (manter)
- [ ] 1.2. Verificar backend coleta TODAS as fontes
  - Cross-validation com 6 fontes: Fundamentus, BRAPI, Status Invest, Investidor10, Fundamentei, Investsite
  - Validar ScrapersService.scrapeFundamentalData()
- [ ] 1.3. Analisar impacto da remoção
  - UX: Usuário terá que ir para /analysis para solicitar em massa
  - Consistência: Centraliza funcionalidade em um local

**25.2. Remover de /assets (0.5h)**
- [ ] 2.1. Remover botão de `frontend/src/app/(dashboard)/assets/page.tsx`
- [ ] 2.2. Remover imports não utilizados
- [ ] 2.3. Validar TypeScript: 0 erros
- [ ] 2.4. Validar Build: Success

**25.3. Melhorar /analysis (1h)**
- [ ] 3.1. Adicionar Tooltip no botão "Solicitar Análises em Massa"
  - Componente: `MultiSourceTooltip` (já existe em /reports)
  - Conteúdo: Explicação sobre coleta multi-fonte (6 fontes)
- [ ] 3.2. Adicionar indicador de fontes no dialog
  - Badge: "6 fontes" com ícone de informação
  - Tooltip: Lista das 6 fontes
- [ ] 3.3. Melhorar feedback durante processamento
  - Progress bar com contagem (ex: "2/10 análises solicitadas")
  - Toast com detalhes das fontes utilizadas

**25.4. Validar Backend (0.5h)**
- [ ] 4.1. Verificar ScrapersService coleta 6 fontes
  - Log de cada fonte durante scraping
  - Cross-validation funcionando
- [ ] 4.2. Verificar mínimo de 3 fontes para confiança
  - MIN_DATA_SOURCES=3 configurado
  - Score de confiança calculado corretamente

**25.5. Testes e Validação (0.5h)**
- [ ] 5.1. Testar fluxo completo
  - Acessar /analysis
  - Clicar "Solicitar Análises em Massa"
  - Verificar tooltip aparece
  - Confirmar solicitação
  - Validar 6 fontes sendo utilizadas
- [ ] 5.2. MCP Triplo (Playwright + Chrome DevTools + Selenium)

**25.6. Documentação (0.5h)**
- [ ] 6.1. Atualizar REFATORACAO_BOTAO_SOLICITAR_ANALISES.md (marcar completo)
- [ ] 6.2. Criar screenshots (antes/depois)
- [ ] 6.3. Commit e push

**Referência:** `REFATORACAO_BOTAO_SOLICITAR_ANALISES.md`

**❓ DECISÃO NECESSÁRIA DO USUÁRIO:**
- Aprovar remoção do botão de /assets?
- Aprovar centralização em /analysis?
- Sugestões de melhoria na UX?

---

### FASE 26: Corrigir Problemas Crônicos Médios ⚠️ **RECOMENDADO**

**Status:** 📋 PLANEJADO
**Prioridade:** 🟡 MÉDIA (4 problemas pendentes)
**Tempo Estimado:** 3-4 horas
**Dependências:** Nenhuma

**Objetivo:**
Resolver os 4 problemas crônicos médios identificados no `CHECKLIST_VALIDACAO_FASE_23_COMPLETA.md`, garantindo 100% de estabilidade antes de adicionar novas features.

#### 26.1. Problema #2: Script system-manager.ps1 Encoding (0.5h)
- [ ] 1.1. Recodificar arquivo para UTF-8 with BOM
- [ ] 1.2. Validar caracteres especiais (GREEN, YELLOW, RED)
- [ ] 1.3. Testar comandos: `status`, `up`, `down`, `restart`
- [ ] 1.4. Adicionar validação de encoding no CI/CD

#### 26.2. Problema #3: BRAPI 403 Forbidden (1h)
- [ ] 2.1. Verificar se token está sendo enviado corretamente
  - Query parameter: `?token=xxx`
  - Header: `Authorization: Bearer xxx`
- [ ] 2.2. Adicionar retry logic com backoff exponencial
  - 3 tentativas
  - Delay: 1s, 2s, 4s
- [ ] 2.3. Implementar fallback cache quando API falha
  - Cache Redis com TTL de 1 hora
- [ ] 2.4. Monitorar rate limiting
  - Log de headers: X-RateLimit-Limit, X-RateLimit-Remaining

#### 26.3. Problema #4: InvestsiteScraper Seletor Inválido (1h)
- [ ] 3.1. Inspecionar HTML do Investsite
  - URL: https://www.investsite.com.br/principais_indicadores.php?cod_negociacao=PETR4
  - Identificar estrutura de tabelas
- [ ] 3.2. Atualizar seletores CSS
  - Usar seletores mais robustos (data attributes, classes estáveis)
- [ ] 3.3. Adicionar tratamento de erro robusto
  - Fallback para scraping alternativo
  - Log detalhado de falhas
- [ ] 3.4. Testar com 5 tickers diferentes

#### 26.4. Problema #5: FundamenteiScraper CSS Parsing Error (1h)
- [ ] 4.1. Debugar seletor CSS que causa erro
  - Log de HTML antes do parsing
  - Identificar padrão ".value" problemático
- [ ] 4.2. Validar estrutura HTML do Fundamentei
  - Possível mudança no site
  - Verificar se OAuth session está válida
- [ ] 4.3. Adicionar tratamento de exceção robusto
  - Try-catch em cada seletor
  - Fallback para valor 0
- [ ] 4.4. Testar com OAuth session válida

#### 26.5. Validação Final (0.5h)
- [ ] 5.1. Validar todos os 4 scrapers
  - Fundamentus: OK
  - BRAPI: 403 resolvido
  - Status Invest: Timeout resolvido (FASE 23)
  - Investidor10: Timeout resolvido (FASE 23)
  - Fundamentei: Parsing error resolvido
  - Investsite: Seletor resolvido
- [ ] 5.2. Taxa de sucesso média: > 95%
- [ ] 5.3. Backend healthy: 100%
- [ ] 5.4. Cross-validation: 6/6 fontes funcionando

---

### FASE 27+: Features Futuras 🔮

**Status:** 🔮 PLANEJADO (longo prazo)

#### 27.1. Análise Geral do Mercado (3 fontes)
- [ ] Investing.com scraper (OAuth Google)
- [ ] ADVFN scraper (OAuth Google)
- [ ] Google Finance scraper (OAuth Google)

#### 27.2. Análise Técnica (1 fonte)
- [ ] TradingView scraper (OAuth Google)
- [ ] Indicadores: RSI, MACD, Bollinger, Médias Móveis
- [ ] Sinais de compra/venda

#### 27.3. Análise de Opções (1 fonte)
- [ ] Opcoes.net.br scraper (user/password)
- [ ] Vencimentos, strikes, volumes
- [ ] IV (Implied Volatility), Greeks

#### 27.4. Sistema de Alertas
- [ ] Email notifications
- [ ] Webhook para Slack/Discord
- [ ] Push notifications (mobile)

#### 27.5. Importação de Portfólios
- [ ] Kinvo integration
- [ ] B3 CEI integration
- [ ] MyProfit integration
- [ ] CSV upload

#### 27.6. CI/CD Completo
- [ ] GitHub Actions
- [ ] Automated tests (>80% coverage)
- [ ] Automated deployment
- [ ] Docker image optimization

---

## 📋 PRÓXIMOS PASSOS RECOMENDADOS

### Ordem de Prioridade Sugerida:

1. **URGENTE: Validar FASE 23 com MCP Triplo** (2h)
   - Garantir que problema crítico está 100% resolvido
   - Validar todos os scrapers funcionando
   - Documentar com screenshots

2. **RECOMENDADO: FASE 26 - Corrigir Problemas Crônicos** (3-4h)
   - Resolver 4 problemas médios pendentes
   - Garantir estabilidade 100%
   - Taxa de sucesso > 95%

3. **OPCIONAL: FASE 25 - Refatoração Botão Análises** (2-3h)
   - Aguarda aprovação do usuário
   - Melhora consistência da UX
   - Centraliza funcionalidade

4. **FUTURO: FASE 24 - Dados Históricos** (4-6h)
   - Feature nova (não corretiva)
   - Habilita análises temporais
   - Base para backtesting

5. **LONGO PRAZO: FASE 27+ - Features Futuras**
   - Análise técnica, opções, alertas
   - Integrações externas
   - Mobile app

---

## 🛡️ REGRAS DE OURO (SEMPRE SEGUIR)

1. ✅ **SEMPRE** revisar fase anterior antes de avançar
2. ✅ **SEMPRE** garantir 0 erros TypeScript + Build
3. ✅ **SEMPRE** validar com MCP Triplo (Playwright + Chrome DevTools + Selenium)
4. ✅ **SEMPRE** documentar (VALIDACAO_*.md + Screenshots)
5. ✅ **SEMPRE** commit com co-autoria Claude
6. ✅ **SEMPRE** push para origin antes de mudar de sessão
7. ✅ **SEMPRE** usar dados reais (não mocks)
8. ✅ **SEMPRE** corrigir problemas crônicos em definitivo
9. ✅ **SEMPRE** respeitar arquitetura definida
10. ✅ **SEMPRE** seguir metodologia Ultra-Thinking + TodoWrite

---

## 📝 NOTAS IMPORTANTES

### Decisões Técnicas Pendentes
- [ ] FASE 25: Aprovar remoção de botão de /assets?
- [ ] FASE 24: Qual fonte de histórico usar (BRAPI vs Investing)?
- [ ] FASE 27: Qual ordem de prioridade para features futuras?

### Problemas Conhecidos (Não-Bloqueantes)
- ⚠️ OAuth sessions expiram (renovar via /oauth-manager)
- ⚠️ Favicon.ico 404 (arquivo faltando)
- ⚠️ Alguns scrapers requerem assinatura paga (Fundamentei: R$ 320/ano)

### Melhorias Futuras
- [ ] Implementar cache Redis para scrapers
- [ ] Adicionar logs estruturados (Winston)
- [ ] Criar dashboard de métricas (Grafana)
- [ ] Implementar alertas de falha (email/Slack)
- [ ] Adicionar testes automatizados (Jest + Playwright)

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-14
**Última Atualização:** 2025-11-14
**Metodologia:** Ultra-Thinking + TodoWrite
**Próxima Revisão:** Após conclusão de cada fase
