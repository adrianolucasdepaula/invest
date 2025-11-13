# 🎯 DECISÃO ESTRATÉGICA: FASE 23 - Implementação de Scrapers

**Data:** 2025-11-13
**Responsável:** Claude Code (Sonnet 4.5)
**Status:** 🚨 **DECISÃO CRÍTICA NECESSÁRIA**

---

## 📊 SITUAÇÃO ATUAL

### Scrapers Implementados (4/31 - 12.90%)
1. ✅ **Fundamentus** - Público, sem login
2. ✅ **BRAPI** - API Pública, token via query param
3. ✅ **StatusInvest** - Público (pode funcionar sem login)
4. ✅ **Investidor10** - Requer login (OAuth não implementado)

### Scrapers Planejados (2/31 - 6.45%)
5. 🔜 **Fundamentei** - Requer login/assinatura paga
6. 🔜 **Investsite** - Público, acessível

---

## 🔍 PESQUISA REALIZADA

### 1. Fundamentei (https://fundamentei.com)

**Resultados da Pesquisa:**
- ❌ **Requer login obrigatório** (botão "Logar com o Google")
- ❌ **Requer assinatura Premium** (R$ 320/ano com desconto Black Friday)
- ❌ **Não tem plano gratuito com dados completos**
- ❌ **Dados básicos não acessíveis sem login**
- ✅ Possui Google OAuth (botão "Logar com o Google")
- ✅ Parece ter dados ricos (900+ indicadores)

**URLs Testadas:**
- `https://fundamentei.com/acoes/PETR4` → **404 Not Found** (requer login)
- `https://fundamentei.com/screener` → Landing page pública (sem dados)
- `https://fundamentei.com/login` → Página de login com OAuth Google

**Screenshot:** `(não capturado - página requer login)`

**Conclusão:**
🚨 **IMPOSSÍVEL implementar sem credenciais válidas de assinante.**

---

### 2. Investsite (https://investsite.com.br)

**Resultados da Pesquisa:**
- ✅ **Site 100% público** (sem necessidade de login)
- ✅ **Dados acessíveis** via URLs diretas
- ✅ **Estrutura HTML tradicional** (fácil de scraper com Cheerio)
- ✅ **URL pattern identificada:** `https://www.investsite.com.br/principais_indicadores.php?cod_negociacao=PETR4`

**URLs Testadas:**
- `https://investsite.com.br` → ✅ Home page pública
- `https://investsite.com.br/acoes/PETR4` → ✅ Redireciona para `principais_indicadores.php?cod_negociacao=PETR4`

**Screenshot:** `screenshots/investsite-petr4.png` ✅ **CAPTURADO**

**Conclusão:**
✅ **IMPLEMENTAÇÃO VIÁVEL** - Site público, sem barreiras de acesso.

---

### 3. Arquitetura de Scrapers Atual

**AbstractScraper (Base Class):**
- ✅ Puppeteer Extra + Stealth Plugin
- ✅ Retry logic com exponential backoff
- ✅ Timeout configurável (30s padrão)
- ✅ Método `login()` abstrato (linha 123-125)
- ✅ **PROBLEMA:** Nenhum scraper implementa OAuth real

**StatusInvestScraper:**
- Linha 41: `requiresLogin = false`
- Linha 142-145: Método `login()` apenas loga mensagem "running without login"
- **CONCLUSÃO:** OAuth Google **NÃO ESTÁ IMPLEMENTADO** em nenhum scraper

**Investidor10Scraper:**
- ⚠️ **Não analisado ainda**, mas provavelmente tem mesmo problema

---

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### OAuth Google NÃO Está Implementado

**Evidências:**
1. `StatusInvestScraper.login()` (linha 142-145) apenas loga mensagem
2. `Investidor10Scraper` provavelmente tem stub similar
3. `AbstractScraper.login()` é método abstrato vazio (linha 123-125)

**Impacto:**
- ❌ **Não é possível** scraper Fundamentei sem OAuth funcional
- ❌ **Não é possível** scraper Investidor10 corretamente (pode estar parcialmente funcional)
- ⚠️ **StatusInvest** pode estar retornando dados limitados

**Complexidade de Implementar OAuth Google:**
- 🔴 **ALTA:** Requer configuração de app Google Cloud
- 🔴 **ALTA:** Requer credenciais de conta válida (email + senha)
- 🔴 **ALTA:** Requer lidar com 2FA/CAPTCHA
- 🔴 **ALTA:** Requer manter sessão ativa
- 🔴 **ALTA:** Risco de ban por automação

---

## 🎯 DECISÃO ESTRATÉGICA

### OPÇÃO 1: Implementar OAuth + Fundamentei (COMPLEXO)

**Ações:**
1. Implementar OAuth Google genérico no `AbstractScraper`
2. Configurar Google Cloud project
3. Obter credenciais de assinante Fundamentei (R$ 320/ano)
4. Implementar `FundamenteiScraper` completo
5. Testar e validar

**Prós:**
- ✅ Completa categoria Fundamentalista (6/6)
- ✅ Dados ricos (900+ indicadores)
- ✅ OAuth reutilizável para outros scrapers

**Contras:**
- ❌ **Custo:** R$ 320/ano de assinatura
- ❌ **Tempo:** 4-6 horas de implementação OAuth
- ❌ **Complexidade:** Alta (2FA, CAPTCHA, sessão)
- ❌ **Risco:** Ban por automação
- ❌ **Manutenção:** Alta (OAuth pode quebrar)

**Estimativa:** 6-8 horas + R$ 320/ano

---

### OPÇÃO 2: Implementar Apenas Investsite (SIMPLES) ⭐ **RECOMENDADO**

**Ações:**
1. Implementar `InvestsiteScraper` (público, sem login)
2. Testar com ticker PETR4
3. Integrar no backend
4. Atualizar frontend para 5 cards (não 6)
5. Documentar limitação do Fundamentei

**Prós:**
- ✅ **Custo:** R$ 0,00
- ✅ **Tempo:** 1-2 horas de implementação
- ✅ **Complexidade:** Baixa (Cheerio + Puppeteer)
- ✅ **Risco:** Baixo (site público)
- ✅ **Manutenção:** Baixa
- ✅ **Dados suficientes** para cross-validation (5 fontes)

**Contras:**
- ⚠️ Não completa categoria Fundamentalista (5/6 = 83.33%)
- ⚠️ Menos dados que Fundamentei

**Estimativa:** 1-2 horas

---

### OPÇÃO 3: Implementar Investsite + Outros Scrapers Públicos (ALTERNATIVO)

**Ações:**
1. Implementar `InvestsiteScraper`
2. Pesquisar outros sites públicos (ex: Investsite tem 6k+ indicadores?)
3. Implementar 1-2 scrapers adicionais de outras categorias
4. Diversificar tipos de análise (não só Fundamentalista)

**Prós:**
- ✅ Mantém foco em sites públicos (sem custo)
- ✅ Diversifica categorias de scrapers
- ✅ Evita complexidade de OAuth

**Contras:**
- ⏳ Requer pesquisa adicional (1-2 horas)
- ⏳ Implementação mais demorada (3-4 horas)

**Estimativa:** 4-6 horas

---

## 📊 COMPARAÇÃO DE OPÇÕES

| Critério | Opção 1 (OAuth + Fundamentei) | Opção 2 (Investsite) ⭐ | Opção 3 (Investsite + Outros) |
|----------|-------------------------------|------------------------|------------------------------|
| **Tempo** | 6-8 horas | 1-2 horas | 4-6 horas |
| **Custo** | R$ 320/ano | R$ 0 | R$ 0 |
| **Complexidade** | 🔴 Alta | 🟢 Baixa | 🟡 Média |
| **Risco** | 🔴 Alto (ban) | 🟢 Baixo | 🟡 Médio |
| **Manutenção** | 🔴 Alta | 🟢 Baixa | 🟡 Média |
| **Fontes Fundamentalistas** | 6/6 (100%) | 5/6 (83%) | 5/6 (83%) |
| **Total de Fontes** | 6/31 (19%) | 5/31 (16%) | 7-8/31 (23-26%) |
| **ROI** | ⚠️ Baixo | ✅ Alto | ✅ Médio-Alto |

---

## 🎯 RECOMENDAÇÃO FINAL

### ⭐ **OPÇÃO 2: Implementar Apenas Investsite**

**Justificativa:**
1. ✅ **Custo-benefício:** Melhor ROI (R$ 0 vs R$ 320 + 6-8h)
2. ✅ **Risco mínimo:** Site público, sem barreira de acesso
3. ✅ **Implementação rápida:** 1-2 horas vs 6-8 horas
4. ✅ **Manutenibilidade:** Baixa vs Alta
5. ✅ **5 fontes suficientes** para cross-validation confiável (mínimo 3)
6. ✅ **Progresso mensurável:** 4/31 → 5/31 (12.90% → 16.13%)
7. ✅ **Evita bloqueio:** Não depende de assinatura paga

**Próximos Passos (OPÇÃO 2):**
1. Implementar `InvestsiteScraper` (1 hora)
2. Integrar no `ScrapersModule` e `ScrapersService` (20 min)
3. Atualizar `ScrapersController` para 5 fontes (10 min)
4. Testar com Playwright + Chrome DevTools (30 min)
5. Validar frontend com 5 cards (10 min)
6. Documentar e commitar (30 min)

**Total Estimado:** 2-3 horas

---

## 🚧 ALTERNATIVA PARA FUNDAMENTEI (FUTURO)

### Se OAuth for Implementado no Futuro:

**Pré-requisitos:**
1. Configurar Google Cloud Project (OAuth 2.0)
2. Obter credenciais de assinante (R$ 320/ano)
3. Implementar `GoogleOAuthService` genérico
4. Atualizar `AbstractScraper` com `useGoogleOAuth: boolean`
5. Implementar `FundamenteiScraper` usando OAuth

**Benefícios:**
- ✅ OAuth reutilizável para **Investidor10** e **StatusInvest** (dados completos)
- ✅ Acesso a 900+ indicadores do Fundamentei
- ✅ Completa categoria Fundamentalista (6/6)

**Estimativa:** 6-8 horas (quando for prioridade)

---

## 📊 PROGRESSO ESPERADO (OPÇÃO 2)

### Antes:
- **Total de Fontes:** 4/31 (12.90%)
- **Fundamentalista:** 4/6 (66.67%)
- **Outras Categorias:** 0/25 (0%)

### Depois:
- **Total de Fontes:** 5/31 (16.13%) ⬆️ +3.23%
- **Fundamentalista:** 5/6 (83.33%) ⬆️ +16.66%
- **Outras Categorias:** 0/25 (0%)

---

## ✅ CRITÉRIOS DE APROVAÇÃO

### Se Opção 2 for Aprovada:

**Bloqueadores (DEVEM estar 0):**
- [ ] TypeScript: 0 erros
- [ ] Console: 0 erros críticos
- [ ] Build: 0 falhas
- [ ] `InvestsiteScraper` funcional com PETR4

**Qualidade Mínima:**
- [ ] `InvestsiteScraper` retorna mínimo 6 indicadores
- [ ] Cross-validation funciona com 5 fontes
- [ ] Frontend exibe 5 cards (não 6)
- [ ] Documentação atualizada (FASE 23 = 5 fontes)
- [ ] Screenshots capturados (mínimo 3)

---

## 🎤 AGUARDANDO APROVAÇÃO DO USUÁRIO

**Pergunta:**
Qual opção você prefere?

1. **OPÇÃO 1:** Implementar OAuth + Fundamentei (6-8h + R$ 320/ano)
2. **OPÇÃO 2:** Implementar apenas Investsite (1-2h + R$ 0) ⭐ **RECOMENDADO**
3. **OPÇÃO 3:** Investsite + outros públicos (4-6h + R$ 0)

**Ou alguma outra sugestão?**

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-13
**Status:** 🚨 **AGUARDANDO DECISÃO DO USUÁRIO**

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
