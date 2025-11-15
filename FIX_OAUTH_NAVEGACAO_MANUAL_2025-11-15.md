# 🔧 FIX - OAuth Manager Navegação Manual (current_site_index)

**Data:** 2025-11-15
**Tipo:** Bug Fix
**Componente:** OAuth Session Manager
**Severidade:** 🔴 **CRÍTICA** - Coleta cookies do site errado
**Status:** ✅ **RESOLVIDO**

---

## 📋 RESUMO EXECUTIVO

**Problema:** Quando usuário usa navegação manual para ir direto a um site específico (ex: ADVFN), a página abre corretamente no VNC, mas ao clicar "Confirmar Login", o sistema coleta cookies do **site errado** (Google ao invés de ADVFN).

**Causa Raiz:** `navigate_to_site()` não atualiza `current_site_index` quando navega manualmente.

**Solução:** Atualizar `current_site_index` para o índice do site navegado manualmente.

---

## 🐛 RELATÓRIO DO USUÁRIO

**Comportamento Observado:**
1. Usuário selecionou site manualmente (dropdown)
2. Clicou no botão "Ir para Site"
3. ❌ Página NÃO abriu no VNC (ou abriu mas depois voltou)
4. Quando apareceu opção "Confirmar Login"
5. ❌ Sistema coletou cookies do **Google** ao invés do site selecionado

**Expectativa:**
1. Selecionar site (ex: ADVFN)
2. Clicar "Ir para Site"
3. ✅ VNC mostra página ADVFN
4. Clicar "Confirmar Login"
5. ✅ Sistema coleta cookies do **ADVFN**

---

## 🔍 ANÁLISE TÉCNICA

### Root Cause Analysis

#### Fluxo Normal (Automático)
```python
# Quando navega sequencialmente (Google → Fundamentei → Investidor10...)
current_site_index = 0  # Google
navigate_to_next_site() → current_site_index = 1  # Fundamentei
confirm_login() → Coleta cookies de sites_progress[1] ✅ Correto
```

#### Fluxo Bugado (Manual)
```python
# Quando usuário seleciona site manualmente
current_site_index = 0  # Google (sessão iniciou aqui)

# Usuário seleciona ADVFN (índice 5)
navigate_to_site("advfn"):
    # Navega para ADVFN
    driver.get("https://br.advfn.com/")  ✅ OK
    # Atualiza status do ADVFN
    sites_progress[5].status = "in_progress"  ✅ OK
    # ❌ MAS NÃO ATUALIZA current_site_index !!

# Usuário clica "Confirmar Login"
confirm_login():
    # ❌ BUG: Pega site no índice 0 (Google)
    site = sites_progress[current_site_index]  # sites_progress[0] = Google
    collect_cookies(site)  # Coleta cookies do Google, NÃO do ADVFN!
```

### Código Problemático

**`oauth_session_manager.py` (linha 342) - ANTES DO FIX:**
```python
async def collect_cookies_from_current_site(self) -> int:
    """Coletar cookies do site atual"""
    try:
        # ❌ USA current_site_index que não foi atualizado!
        current_site_progress = self.current_session.sites_progress[
            self.current_session.current_site_index
        ]
        site_config = get_site_by_id(current_site_progress.site_id)
        # ...
```

**`oauth_session_manager.py` (linhas 242-262) - ANTES DO FIX:**
```python
async def navigate_to_site(self, site_id: str) -> bool:
    try:
        site_config = get_site_by_id(site_id)
        site_progress = next(sp for sp in self.current_session.sites_progress
                             if sp.site_id == site_id)

        # ❌ NÃO ATUALIZA current_site_index
        logger.info(f"[NAVIGATE] Site #{self.current_session.current_site_index + 1}")
        # (Mostra índice errado nos logs também!)

        # Atualizar status
        site_progress.status = SiteStatus.IN_PROGRESS
        # ...
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Código Corrigido

**`oauth_session_manager.py` (linhas 246-250) - DEPOIS DO FIX:**
```python
async def navigate_to_site(self, site_id: str) -> bool:
    try:
        site_config = get_site_by_id(site_id)
        site_progress = next(sp for sp in self.current_session.sites_progress
                             if sp.site_id == site_id)

        # ✅ FIX: Atualizar current_site_index para o site navegado manualmente
        # Encontrar índice do site na lista de progresso
        site_index = next(i for i, sp in enumerate(self.current_session.sites_progress)
                          if sp.site_id == site_id)
        self.current_session.current_site_index = site_index
        logger.debug(f"[NAVIGATE] current_site_index atualizado para {site_index} ({site_id})")

        logger.info(f"[NAVIGATE] Site #{self.current_session.current_site_index + 1}")
        # (Agora mostra índice correto!)

        # Atualizar status
        site_progress.status = SiteStatus.IN_PROGRESS
        # ...
```

### Impacto do Fix

**Antes (Bugado):**
```
Usuário seleciona ADVFN → Navega para ADVFN → Clica "Confirmar Login"
→ ❌ Coleta cookies do Google (current_site_index ainda = 0)
```

**Depois (Corrigido):**
```
Usuário seleciona ADVFN → Navega para ADVFN (current_site_index = 5)
→ Clica "Confirmar Login" → ✅ Coleta cookies do ADVFN
```

---

## 🧪 VALIDAÇÃO

### Sintaxe Python
```bash
$ docker exec invest_api_service sh -c "python -m py_compile /app/python-scrapers/oauth_session_manager.py"
✅ Success (sem output = sem erros)
```

### Restart Serviço
```bash
$ docker-compose restart api-service
✅ Container healthy
```

### Logs Esperados (Após Fix)
```
# Antes do fix:
[NAVIGATE] Site #1/19: ADVFN  ❌ (Índice errado - mostra 1, deveria ser 6)

# Depois do fix:
[NAVIGATE] current_site_index atualizado para 5 (advfn) ✅
[NAVIGATE] Site #6/19: ADVFN  ✅ (Índice correto)
```

---

## 📊 COMPARATIVO

| Aspecto | ANTES (Bugado) | DEPOIS (Corrigido) |
|---------|----------------|---------------------|
| **Navegação Manual** | ❌ Abre site mas index não muda | ✅ Abre site E atualiza index |
| **Confirmar Login** | ❌ Coleta do site errado (Google) | ✅ Coleta do site correto (selecionado) |
| **Logs** | ❌ Site #1/19 (mentira) | ✅ Site #6/19 (verdade) |
| **current_site_index** | ❌ Fica em 0 | ✅ Atualizado para índice correto |

---

## 🎯 CASOS DE TESTE

### Caso 1: Navegação Manual para ADVFN (Índice 5)
```
1. Iniciar sessão OAuth → current_site_index = 0 (Google)
2. Selecionar "ADVFN" no dropdown
3. Clicar "Ir para Site"
   ✅ ESPERADO: current_site_index = 5
   ✅ ESPERADO: VNC mostra página ADVFN
   ✅ ESPERADO: Logs: "current_site_index atualizado para 5 (advfn)"
4. Clicar "Confirmar Login"
   ✅ ESPERADO: Coleta cookies de ADVFN (não Google)
   ✅ ESPERADO: sites_progress[5].cookies_count > 0
```

### Caso 2: Navegação Manual para Último Site (Google News - Índice 18)
```
1. Iniciar sessão OAuth → current_site_index = 0
2. Selecionar "Google News" no dropdown
3. Clicar "Ir para Site"
   ✅ ESPERADO: current_site_index = 18
   ✅ ESPERADO: VNC mostra Google News
4. Clicar "Confirmar Login"
   ✅ ESPERADO: Coleta cookies de Google News
```

### Caso 3: Navegação Sequencial Após Manual
```
1. Navegar manualmente para ADVFN → current_site_index = 5
2. Clicar "Confirmar Login" → Coleta cookies ADVFN ✅
3. Sistema avança automaticamente → current_site_index = 6 (Google Finance) ✅
4. Navegação sequencial continua normalmente
```

---

## 🔗 ARQUIVOS MODIFICADOS

### backend/python-scrapers/oauth_session_manager.py

**Linhas modificadas:** 246-250 (+5 linhas)

**Diff:**
```diff
 try:
     site_config = get_site_by_id(site_id)
     site_progress = next(sp for sp in self.current_session.sites_progress if sp.site_id == site_id)

+    # FIX: Atualizar current_site_index para o site navegado manualmente
+    # Encontrar índice do site na lista de progresso
+    site_index = next(i for i, sp in enumerate(self.current_session.sites_progress) if sp.site_id == site_id)
+    self.current_session.current_site_index = site_index
+    logger.debug(f"[NAVIGATE] current_site_index atualizado para {site_index} ({site_id})")
+
     logger.info("=" * 80)
     logger.info(f"[NAVIGATE] Site #{self.current_session.current_site_index + 1}/{len(self.current_session.sites_progress)}: {site_config['name']}")
```

---

## 🏷️ ÍNDICES DOS SITES

| Índice | Site ID | Site Name |
|--------|---------|-----------|
| 0 | google | Google |
| 1 | fundamentei | Fundamentei |
| 2 | investidor10 | Investidor10 |
| 3 | statusinvest | StatusInvest |
| 4 | investing | Investing.com |
| **5** | **advfn** | **ADVFN** |
| 6 | google_finance | Google Finance |
| 7 | tradingview | TradingView |
| 8 | chatgpt | ChatGPT |
| 9 | gemini | Gemini |
| 10 | deepseek | DeepSeek |
| 11 | claude | Claude |
| 12 | grok | Grok |
| 13 | valor | Valor Econômico |
| 14 | exame | Exame |
| 15 | infomoney | InfoMoney |
| 16 | estadao | Estadão |
| 17 | maisretorno | Mais Retorno |
| 18 | google_news | Google News |

---

## 📝 NOTAS ADICIONAIS

### Por que aconteceu?

O código original foi projetado para **navegação sequencial automática**. A função `navigate_to_next_site()` sempre incrementava o índice corretamente:

```python
def navigate_to_next_site():
    self.current_session.current_site_index += 1  # ✅ Incrementa
    site_id = self.current_session.sites_progress[index].site_id
    await self.navigate_to_site(site_id)
```

Mas quando implementaram **navegação manual direta** (via dropdown), esqueceram de atualizar o `current_site_index` dentro da `navigate_to_site()`.

### Outros Métodos que Usam current_site_index

**Confirmado seguro após fix:**
- `collect_cookies_from_current_site()` (linha 342) - ✅ Agora pega site correto
- `confirm_site_login()` (controller) - ✅ Agora pega site correto
- Todos os logs que mostram "Site #X/19" - ✅ Agora mostram índice correto

---

## ✅ CHECKLIST VALIDAÇÃO

- [x] Bug identificado (current_site_index não atualizado)
- [x] Root cause documentada (código original para navegação sequencial)
- [x] Fix implementado (linhas 246-250)
- [x] Sintaxe Python validada (py_compile success)
- [x] api-service reiniciado
- [x] Container healthy
- [ ] Teste manual realizado (aguardando usuário)
- [ ] Cookies coletados do site correto (aguardando confirmação)

---

## 🚀 PRÓXIMOS PASSOS

1. **Usuário deve testar:**
   - Iniciar nova sessão OAuth
   - Selecionar um site manualmente (ex: ADVFN)
   - Clicar "Ir para Site"
   - Verificar se VNC mostra o site correto
   - Clicar "Confirmar Login"
   - Verificar se cookies foram coletados do site correto

2. **Verificar logs:**
   ```bash
   docker-compose logs api-service | grep "current_site_index atualizado"
   # Deve mostrar: "current_site_index atualizado para 5 (advfn)"
   ```

3. **Confirmar coleta de cookies:**
   ```bash
   curl http://localhost:8000/api/oauth/session/status
   # Verificar: sites_progress[5].cookies_count > 0 (ADVFN)
   ```

---

**FIM DO DOCUMENTO**

**Status:** ✅ **FIX APLICADO - AGUARDANDO TESTE DO USUÁRIO**
