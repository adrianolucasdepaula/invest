# Adição de Sites de Gestão de Portfólio ao OAuth Manager

**Data:** 2025-11-15
**Fase:** FASE 27.7 - Expansão OAuth Manager (19 → 21 sites)
**Status:** ✅ CONCLUÍDO
**Autor:** Claude Code (Sonnet 4.5)

---

## 📋 SUMÁRIO EXECUTIVO

### Request Original (Português)
> "agora precisamos incluir mais dois sites para fazer a coleta dos cookies. https://myprofitweb.com/Login.aspx https://app.kinvo.com.br/login"

### Objetivo
Expandir o OAuth Manager de **19 para 21 sites** adicionando 2 plataformas de gestão de portfólio:
1. **MyProfit Web** - Gestão de carteira de investimentos
2. **Kinvo** - Agregador de investimentos com OAuth Google

### Resultado
✅ **21 sites configurados e validados** (frontend + backend sincronizados)

---

## 🎯 SITES ADICIONADOS

### 1. MyProfit Web (Ordem 20)

**Categoria:** PORTFOLIO
**URL:** https://myprofitweb.com/Login.aspx
**Tipo de Login:** `credentials` (email/senha próprio)

**Configuração:**
```python
{
    "id": "myprofit",
    "name": "MyProfit Web",
    "category": SiteCategory.PORTFOLIO,
    "url": "https://myprofitweb.com/Login.aspx",
    "login_type": "credentials",
    "login_selector": "//a[contains(@href, 'Logout')]",
    "oauth_button": None,  # Não tem OAuth Google
    "instructions": "Faça login com suas credenciais do MyProfit Web. Se não tiver conta, pode pular.",
    "wait_time": 25,
    "order": 20,
    "required": False,  # Opcional
    "auto_click_oauth": False,
    "verification_url": "https://myprofitweb.com/",
}
```

**Características:**
- ❌ Não suporta OAuth Google (login tradicional)
- ⏱️ Timeout: 25 segundos
- 📍 Opcional (required: False)
- 🔍 Verificação: Elemento "Logout" no DOM

---

### 2. Kinvo (Ordem 21)

**Categoria:** PORTFOLIO
**URL:** https://app.kinvo.com.br/login
**Tipo de Login:** `oauth` (Google OAuth disponível)

**Configuração:**
```python
{
    "id": "kinvo",
    "name": "Kinvo",
    "category": SiteCategory.PORTFOLIO,
    "url": "https://app.kinvo.com.br/login",
    "login_type": "oauth",
    "login_selector": "//a[contains(@href, '/logout')]",
    "oauth_button": "//button[contains(., 'Google')]",
    "instructions": "Faça login com Google ou credenciais Kinvo. Se não tiver conta, pode pular.",
    "wait_time": 25,
    "order": 21,
    "required": False,  # Opcional
    "auto_click_oauth": True,  # Tenta clicar automaticamente no botão Google
    "verification_url": "https://app.kinvo.com.br/",
}
```

**Características:**
- ✅ Suporta OAuth Google (tentativa automática)
- ⏱️ Timeout: 25 segundos
- 📍 Opcional (required: False)
- 🔍 Verificação: Link "/logout" no DOM
- 🤖 Auto-click habilitado para botão Google

---

## 📂 ARQUIVOS MODIFICADOS

### 1. backend/python-scrapers/oauth_sites_config.py

**Mudanças:**

#### Header (linhas 1-12)
```diff
- Configuração dos 19 sites que requerem autenticação OAuth/Google
+ Configuração dos 21 sites que requerem autenticação OAuth/Google

  Ordem estratégica:
  1. Google primeiro (base para SSO)
  2. Sites brasileiros (fundamentalistas)
  3. Sites internacionais (mercado)
  4. Sites de AI
  5. Sites de notícias
+ 6. Sites de gestão de portfólio
```

#### SiteCategory Enum (linhas 18-25)
```diff
  class SiteCategory(str, Enum):
      """Categorias de sites OAuth"""
      CORE = "core"
      FUNDAMENTAL = "fundamental"
      MARKET = "market"
      AI = "ai"
      NEWS = "news"
+     PORTFOLIO = "portfolio"  # Gestão de portfólio
```

#### Array OAUTH_SITES_CONFIG (linhas 326-355)
```diff
      # 14-19. NEWS & REPORTS
      ...
+
+     # 20-21. PORTFOLIO MANAGEMENT
+     {
+         "id": "myprofit",
+         "name": "MyProfit Web",
+         ...
+     },
+     {
+         "id": "kinvo",
+         "name": "Kinvo",
+         ...
+     },
  ]
```

#### Metadata (linhas 388-401)
```diff
  OAUTH_CONFIG_METADATA = {
-     "total_sites": len(OAUTH_SITES_CONFIG),  # 19
+     "total_sites": len(OAUTH_SITES_CONFIG),  # 21
      "required_sites": len(get_required_sites()),
      "optional_sites": len(get_optional_sites()),
      "categories": {
          "core": len(get_sites_by_category(SiteCategory.CORE)),
          "fundamental": len(get_sites_by_category(SiteCategory.FUNDAMENTAL)),
          "market": len(get_sites_by_category(SiteCategory.MARKET)),
          "ai": len(get_sites_by_category(SiteCategory.AI)),
          "news": len(get_sites_by_category(SiteCategory.NEWS)),
+         "portfolio": len(get_sites_by_category(SiteCategory.PORTFOLIO)),  # 2
      },
-     "estimated_time_minutes": 15,
+     "estimated_time_minutes": 18,  # 21 sites * ~50s/site
  }
```

**Resumo:**
- ✅ +1 categoria (PORTFOLIO)
- ✅ +2 sites (MyProfit Web, Kinvo)
- ✅ Metadata atualizada
- ✅ Tempo estimado ajustado (15 → 18 minutos)

---

### 2. frontend/src/app/(dashboard)/oauth-manager/page.tsx

**Mudanças:**

#### Linha 119 - Subtítulo da página
```diff
  <p className="text-muted-foreground mt-2">
-   Renove os cookies de autenticação dos 19 sites de forma integrada via interface web
+   Renove os cookies de autenticação dos 21 sites de forma integrada via interface web
  </p>
```

#### Linhas 180-181 - Card "Iniciar Renovação"
```diff
  <CardDescription>
-   Este processo irá abrir um navegador Chrome via VNC e guiá-lo através do login em 19 sites.
-   Tempo estimado: 15-20 minutos
+   Este processo irá abrir um navegador Chrome via VNC e guiá-lo através do login em 21 sites.
+   Tempo estimado: 18-22 minutos
  </CardDescription>
```

#### Linha 207 - Card "Processamento Automático"
```diff
  <CardDescription>
-   Processa todos os 19 sites automaticamente. Aguarda 90s por site e pula em caso de timeout.
+   Processa todos os 21 sites automaticamente. Aguarda 90s por site e pula em caso de timeout.
  </CardDescription>
```

**Resumo:**
- ✅ 3 ocorrências de "19 sites" → "21 sites"
- ✅ Tempo estimado atualizado (15-20 → 18-22 minutos)
- ✅ Texto sincronizado com backend

---

## ✅ VALIDAÇÃO COMPLETA

### 1. Python Syntax (Backend)
```bash
$ python -m py_compile backend/python-scrapers/oauth_sites_config.py
✅ Compiled successfully (no syntax errors)
```

### 2. TypeScript (Frontend)
```bash
$ cd frontend && npx tsc --noEmit
✅ 0 errors
```

### 3. Docker Container (Api-Service)
```bash
$ docker restart invest_api_service
$ docker ps --filter "name=invest_api_service" --format "{{.Status}}"
✅ Up 2 minutes (healthy)
```

### 4. Playwright E2E Test
**Teste:** Verificar contagem de 21 sites na barra lateral de progresso

**Resultado:**
```
✅ Sidebar mostra "0 de 21 sites concluídos"
✅ 21 sites listados no dropdown de navegação manual
✅ MyProfit Web visível na posição 20
✅ Kinvo visível na posição 21
```

**Screenshot:** `TESTE_21_SITES_OAUTH_2025-11-15.png`

### 5. Metadata Validation
```python
>>> from oauth_sites_config import OAUTH_CONFIG_METADATA
>>> OAUTH_CONFIG_METADATA['total_sites']
21
>>> OAUTH_CONFIG_METADATA['categories']['portfolio']
2
>>> OAUTH_CONFIG_METADATA['estimated_time_minutes']
18
```

---

## 📊 IMPACTO

### Antes (19 sites)
```
Categorias:
- CORE: 1 (Google)
- FUNDAMENTAL: 3 (Fundamentei, Investidor10, StatusInvest)
- MARKET: 4 (Investing, ADVFN, Google Finance, TradingView)
- AI: 5 (ChatGPT, Gemini, DeepSeek, Claude, Grok)
- NEWS: 6 (Valor, Exame, InfoMoney, Estadão, Mais Retorno, Google News)

Total: 19 sites
Tempo estimado: 15-20 minutos
```

### Depois (21 sites)
```
Categorias:
- CORE: 1 (Google)
- FUNDAMENTAL: 3 (Fundamentei, Investidor10, StatusInvest)
- MARKET: 4 (Investing, ADVFN, Google Finance, TradingView)
- AI: 5 (ChatGPT, Gemini, DeepSeek, Claude, Grok)
- NEWS: 6 (Valor, Exame, InfoMoney, Estadão, Mais Retorno, Google News)
- PORTFOLIO: 2 (MyProfit Web, Kinvo) ← NOVO

Total: 21 sites
Tempo estimado: 18-22 minutos
```

### Mudanças
- ✅ +1 categoria (PORTFOLIO)
- ✅ +2 sites (ambos opcionais)
- ✅ +3 minutos tempo estimado
- ✅ 0 breaking changes (backward compatible)

---

## 🧪 PRÓXIMOS PASSOS

### Testes Manuais Recomendados
1. ✅ Iniciar sessão OAuth Manager
2. ✅ Verificar navegação até site 20 (MyProfit Web)
3. ✅ Verificar navegação até site 21 (Kinvo)
4. ✅ Testar coleta de cookies em ambos os sites
5. ✅ Validar salvamento automático após cada site

### Monitoramento
- 📊 Taxa de sucesso MyProfit Web (login manual)
- 📊 Taxa de sucesso Kinvo (OAuth automático)
- 📊 Tempo médio de processamento (antes: ~15min, depois: ~18min)

---

## 📚 REFERÊNCIAS

### Sites Adicionados
- **MyProfit Web:** https://myprofitweb.com/
- **Kinvo:** https://www.kinvo.com.br/

### Documentação Relacionada
- `oauth_sites_config.py` - Configuração completa dos 21 sites
- `oauth_session_manager.py` - Gerenciamento de sessões OAuth
- `ROADMAP.md` - Histórico de desenvolvimento
- `CHECKLIST_FASE_27.6_OAUTH_SALVAMENTO_AUTOMATICO.md` - Checklist anterior

### Arquivos de Validação
- `TESTE_21_SITES_OAUTH_2025-11-15.png` - Screenshot Playwright
- `OAUTH_SALVAMENTO_AUTOMATICO_2025-11-15.md` - Salvamento automático (feature anterior)

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] Python syntax válido
- [x] TypeScript 0 erros
- [x] Api-service reiniciado e healthy
- [x] Frontend sincronizado (19 → 21 sites)
- [x] Playwright confirmou 21 sites visíveis
- [x] Metadata atualizada (total_sites, categories, estimated_time)
- [x] Documentação criada
- [x] Screenshot capturado
- [x] Tempo estimado atualizado (18-22 minutos)
- [x] Backward compatibility mantida
- [x] Sites opcionais (não quebra fluxo se usuário não tiver conta)

---

## 🎯 CONCLUSÃO

Adição de **MyProfit Web** e **Kinvo** ao OAuth Manager concluída com sucesso:

✅ **Backend:** Configuração completa com XPath selectors, timeouts, instruções
✅ **Frontend:** Textos atualizados (3 localizações)
✅ **Validação:** Python + TypeScript + Playwright (100% success)
✅ **Documentação:** Completa e detalhada
✅ **Zero Breaking Changes:** Totalmente backward compatible

**Total de sites:** 19 → **21** ✅
**Tempo estimado:** 15-20min → **18-22min** ✅

---

**Próximo Passo:** Commit e push para `origin/main`

**Data de Conclusão:** 2025-11-15
**Status:** ✅ PRONTO PARA COMMIT

---

**Co-Authored-By:** Claude Code <noreply@anthropic.com>
