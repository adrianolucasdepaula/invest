# 🔧 FIX - OAuth Manager "Processar Todos Automaticamente"

**Data:** 2025-11-15
**Tipo:** Feature Enhancement + Bug Fix
**Componente:** OAuth Session Manager
**Severidade:** 🟡 **ALTA** - Pula sites anteriores ao índice atual
**Status:** ✅ **RESOLVIDO**

---

## 📋 RESUMO EXECUTIVO

**Problema:** Quando usuário usa navegação manual para ir direto a um site no meio da lista (ex: ADVFN no índice 5), e depois clica em "Processar Todos Automaticamente", o sistema:
- ❌ Continua do site manual (índice 5) em diante
- ❌ **Pula os sites anteriores** (índices 0-4) que não foram executados
- ❌ Não implementa retry logic para sites com falhas

**Causa Raiz:** `move_to_next_site()` apenas incrementa `current_site_index += 1`, sem verificar se há sites pendentes antes do índice atual.

**Solução:**
1. Implementar busca inteligente de sites pendentes (TODA a lista, não apenas posteriores)
2. Adicionar retry logic (máximo 3 tentativas por site)
3. Priorizar sites PENDING sobre sites FAILED

---

## 🐛 RELATÓRIO DO USUÁRIO

**Comportamento Observado:**
1. Usuário inicia sessão OAuth → Processa Google (índice 0)
2. Usuário navega manualmente para ADVFN (índice 5)
3. Usuário clica "Processar Todos Automaticamente"
4. ❌ Sistema processa ADVFN → Google Finance (índice 6) → ...
5. ❌ Sistema **PULA** Fundamentei, Investidor10, StatusInvest, Investing.com (índices 1-4)

**Expectativa:**
1. Selecionar site manualmente (opcional)
2. Clicar "Processar Todos Automaticamente"
3. ✅ Sistema verifica TODOS os 19 sites
4. ✅ Processa apenas sites PENDENTES ou FAILED (< 3 tentativas)
5. ✅ Não pula sites anteriores ao índice atual
6. ✅ Retry automático (até 3x) para sites com falha

---

## 🔍 ANÁLISE TÉCNICA

### Root Cause Analysis

#### Fluxo Original (Bugado)
```python
# oauth_session_manager.py (ANTES DO FIX)
async def move_to_next_site(self) -> bool:
    self.current_session.current_site_index += 1  # ❌ Apenas incrementa sequencialmente

    if self.current_session.current_site_index >= len(...):
        return False  # Fim

    next_site = self.current_session.sites_progress[self.current_session.current_site_index]
    await self.navigate_to_site(next_site.site_id)
    return True
```

**Problema:**
- Se `current_site_index = 5` (ADVFN após navegação manual)
- Próximo site será **sempre** índice 6 (Google Finance)
- Sites 0-4 nunca serão processados!

#### Fluxo Corrigido
```python
# oauth_session_manager.py (DEPOIS DO FIX)
def find_next_pending_site(self) -> Optional[int]:
    """Buscar próximo site PENDENTE ou FAILED (< 3 tentativas) em TODA a lista"""
    for i, site_progress in enumerate(self.current_session.sites_progress):
        if site_progress.status == SiteStatus.PENDING:
            return i  # Priorizar sites pendentes

        if site_progress.status == SiteStatus.FAILED and site_progress.attempts < 3:
            return i  # Retry para sites com falha (máx 3x)

    return None  # Todos processados

async def move_to_next_site(self) -> bool:
    next_index = self.find_next_pending_site()  # ✅ Busca inteligente

    if next_index is None:
        # Todos os sites foram processados ou atingiram máximo de tentativas
        return False

    self.current_session.current_site_index = next_index  # ✅ Atualiza para site encontrado
    await self.navigate_to_site(next_site.site_id)
    return True
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Adicionar Campo `attempts` em SiteProgress

**Arquivo:** `backend/python-scrapers/oauth_session_manager.py` (linhas 56-67)

```python
@dataclass
class SiteProgress:
    """Progresso de um site específico"""
    site_id: str
    site_name: str
    status: SiteStatus = SiteStatus.PENDING
    cookies_count: int = 0
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    user_action_required: bool = False
    attempts: int = 0  # ✅ NOVO: Contador de tentativas (máximo 3)
```

### 2. Atualizar Serialização (to_dict)

**Arquivo:** `backend/python-scrapers/oauth_session_manager.py` (linhas 90-101)

```python
"sites_progress": [
    {
        "site_id": sp.site_id,
        "site_name": sp.site_name,
        "status": sp.status.value,
        "cookies_count": sp.cookies_count,
        "error_message": sp.error_message,
        "user_action_required": sp.user_action_required,
        "attempts": sp.attempts,  # ✅ NOVO
    }
    for sp in self.sites_progress
],
```

### 3. Criar Método `find_next_pending_site()`

**Arquivo:** `backend/python-scrapers/oauth_session_manager.py` (linhas 413-441)

```python
def find_next_pending_site(self) -> Optional[int]:
    """
    Encontrar o próximo site pendente ou com falha (máximo 3 tentativas)

    Busca em toda a lista de sites (não apenas posteriores ao índice atual)
    e retorna o índice do primeiro site que atenda aos critérios:
    - Status PENDING ou FAILED
    - Tentativas < 3 (se FAILED)

    Returns:
        Índice do próximo site pendente ou None se todos foram processados
    """
    if not self.current_session:
        return None

    # Buscar sites pendentes/falhados em toda a lista
    for i, site_progress in enumerate(self.current_session.sites_progress):
        # Site ainda não processado
        if site_progress.status == SiteStatus.PENDING:
            logger.debug(f"[FIND_PENDING] Site pendente encontrado: {site_progress.site_name} (índice {i})")
            return i

        # Site com falha mas ainda pode tentar novamente
        if site_progress.status == SiteStatus.FAILED and site_progress.attempts < 3:
            logger.debug(f"[FIND_PENDING] Site com falha encontrado: {site_progress.site_name} (índice {i}, tentativa {site_progress.attempts}/3)")
            return i

    logger.debug("[FIND_PENDING] Nenhum site pendente encontrado")
    return None
```

### 4. Modificar `move_to_next_site()`

**Arquivo:** `backend/python-scrapers/oauth_session_manager.py` (linhas 443-491)

```python
async def move_to_next_site(self) -> bool:
    """
    Mover para o próximo site PENDENTE (não apenas sequencial)

    Busca o próximo site com status PENDING ou FAILED (com < 3 tentativas)
    em TODA a lista, não apenas posteriores ao índice atual.

    Returns:
        True se há mais sites, False se terminou
    """
    if not self.current_session:
        logger.warning("[NEXT_SITE] Nenhuma sessão ativa")
        return False

    logger.info("=" * 80)
    logger.info(f"[NEXT_SITE] Buscando próximo site pendente...")
    logger.debug(f"[NEXT_SITE] Índice atual: {self.current_session.current_site_index}")

    # Buscar próximo site pendente
    next_index = self.find_next_pending_site()

    if next_index is None:
        logger.info(f"[NEXT_SITE] 🎉 Todos os sites foram processados (ou máximo de tentativas atingido)!")
        logger.info(f"[NEXT_SITE] Total: {len(self.current_session.sites_progress)} sites")

        # Estatísticas
        completed = sum(1 for sp in self.current_session.sites_progress if sp.status == SiteStatus.COMPLETED)
        skipped = sum(1 for sp in self.current_session.sites_progress if sp.status == SiteStatus.SKIPPED)
        failed = sum(1 for sp in self.current_session.sites_progress if sp.status == SiteStatus.FAILED)
        logger.info(f"[NEXT_SITE] ✓ Concluídos: {completed}, ⊘ Pulados: {skipped}, ✗ Falhados: {failed}")
        logger.info("=" * 80)
        return False

    # Atualizar índice para o site encontrado
    self.current_session.current_site_index = next_index
    next_site = self.current_session.sites_progress[next_index]

    logger.info(f"[NEXT_SITE] Próximo site: {next_site.site_name} (índice {next_index})")

    # Se for retry, logar tentativa
    if next_site.status == SiteStatus.FAILED:
        logger.info(f"[NEXT_SITE] ⚠️ Tentativa {next_site.attempts + 1}/3 (site com falha anterior)")

    logger.info("=" * 80)

    # Navegar automaticamente para o próximo
    await self.navigate_to_site(next_site.site_id)

    return True
```

### 5. Incrementar `attempts` em `navigate_to_site()`

**Arquivo:** `backend/python-scrapers/oauth_session_manager.py` (linhas 267-273)

```python
# Atualizar status e incrementar tentativas
site_progress.status = SiteStatus.IN_PROGRESS
site_progress.started_at = datetime.now()
site_progress.attempts += 1  # ✅ Incrementar contador de tentativas
self.current_session.status = SessionStatus.NAVIGATING

logger.debug(f"[NAVIGATE] Tentativa #{site_progress.attempts} para {site_config['name']}")
```

---

## 📊 COMPARATIVO ANTES/DEPOIS

### Cenário 1: Navegação Manual → Processar Todos

| Ação | ANTES (Bugado) | DEPOIS (Corrigido) |
|------|----------------|---------------------|
| 1. Iniciar sessão | current_site_index = 0 (Google) | current_site_index = 0 (Google) |
| 2. Navegar manualmente para ADVFN | current_site_index = 5 | current_site_index = 5 |
| 3. "Processar Todos Automaticamente" | ❌ Processa 6, 7, 8... (pula 1-4) | ✅ Processa 0, 1, 2, 3, 4, 6, 7... (todos pendentes) |

### Cenário 2: Site com Falha

| Ação | ANTES (Bugado) | DEPOIS (Corrigido) |
|------|----------------|---------------------|
| Site X falha na 1ª vez | ❌ Marca FAILED e nunca tenta novamente | ✅ Marca FAILED, attempts = 1 |
| "Processar Todos" executa | ❌ Pula site X (FAILED) | ✅ Tenta Site X novamente (attempts < 3) |
| Site X falha na 2ª vez | - | ✅ attempts = 2, tenta novamente |
| Site X falha na 3ª vez | - | ✅ attempts = 3, **NÃO** tenta mais |

---

## 🎯 CASOS DE TESTE

### Caso 1: Processar Todos sem Navegação Manual
```
1. Iniciar sessão → current_site_index = 0 (Google)
2. Processar site 0 (Google)
3. Clicar "Processar Todos Automaticamente"
   ✅ ESPERADO: Processa 1, 2, 3... até 18 sequencialmente
   ✅ ESPERADO: Todos os 19 sites processados
```

### Caso 2: Navegação Manual → Processar Todos
```
1. Iniciar sessão → current_site_index = 0 (Google)
2. Navegar manualmente para ADVFN (índice 5)
3. Confirmar login ADVFN → current_site_index = 5
4. Clicar "Processar Todos Automaticamente"
   ✅ ESPERADO: Busca próximo pendente = Google (índice 0)
   ✅ ESPERADO: Processa 0, 1, 2, 3, 4, 6, 7... (todos pendentes)
   ✅ ESPERADO: Logs: "[FIND_PENDING] Site pendente encontrado: Google (índice 0)"
```

### Caso 3: Retry para Site com Falha
```
1. Site Fundamentei (índice 1) falha → status = FAILED, attempts = 1
2. Sistema avança para próximo
3. Clicar "Processar Todos Automaticamente"
   ✅ ESPERADO: find_next_pending_site() retorna índice 1 (Fundamentei)
   ✅ ESPERADO: Logs: "[NEXT_SITE] ⚠️ Tentativa 2/3 (site com falha anterior)"
   ✅ ESPERADO: navigate_to_site() incrementa attempts para 2
```

### Caso 4: Máximo de Tentativas Atingido
```
1. Site StatusInvest (índice 3) falhou 3 vezes → attempts = 3
2. Clicar "Processar Todos Automaticamente"
   ✅ ESPERADO: find_next_pending_site() PULA índice 3 (attempts >= 3)
   ✅ ESPERADO: Processa próximo site pendente (ex: índice 4)
```

---

## 🔗 ARQUIVOS MODIFICADOS

### backend/python-scrapers/oauth_session_manager.py

**Modificações:**
1. **Linhas 56-67**: Adicionar campo `attempts: int = 0` em SiteProgress
2. **Linhas 90-101**: Adicionar `attempts` no to_dict()
3. **Linhas 267-273**: Incrementar `attempts` ao navegar
4. **Linhas 413-441**: Novo método `find_next_pending_site()`
5. **Linhas 443-491**: Modificar `move_to_next_site()` para buscar sites pendentes

**Total de linhas adicionadas:** ~80 linhas
**Total de linhas modificadas:** ~10 linhas

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

$ curl -s http://localhost:8000/api/oauth/health
{"status":"healthy","service":"oauth-management","vnc_enabled":true} ✅
```

### Logs Esperados (Após Fix)
```
# Navegação manual para ADVFN
[NAVIGATE] current_site_index atualizado para 5 (advfn)
[NAVIGATE] Tentativa #1 para ADVFN

# "Processar Todos Automaticamente"
[NEXT_SITE] Buscando próximo site pendente...
[FIND_PENDING] Site pendente encontrado: Google (índice 0)
[NEXT_SITE] Próximo site: Google (índice 0)

# Site com falha - retry
[FIND_PENDING] Site com falha encontrado: Fundamentei (índice 1, tentativa 1/3)
[NEXT_SITE] ⚠️ Tentativa 2/3 (site com falha anterior)
```

---

## 📈 IMPACTO

**Benefícios:**
1. ✅ **Processamento Completo**: Todos os 19 sites são processados, não apenas posteriores ao índice atual
2. ✅ **Retry Automático**: Sites com falhas temporárias têm 3 tentativas antes de serem desistidos
3. ✅ **Maior Taxa de Sucesso**: Retry logic aumenta chances de coletar cookies em sites instáveis
4. ✅ **UX Melhorada**: "Processar Todos" realmente processa TODOS, conforme esperado pelo usuário

**Breaking Changes:**
- ❌ Nenhum

**Compatibilidade:**
- ✅ Backward compatible (campo `attempts` tem valor padrão 0)
- ✅ Frontend não precisa de modificações
- ✅ API responses incluem novo campo `attempts` (opcional)

---

## 🚀 PRÓXIMOS PASSOS

1. **Usuário deve testar:**
   - Iniciar nova sessão OAuth
   - Navegar manualmente para um site (ex: ADVFN)
   - Confirmar login
   - Clicar "Processar Todos Automaticamente"
   - Verificar se processa TODOS os sites pendentes (não apenas posteriores)

2. **Verificar logs:**
   ```bash
   docker-compose logs api-service | grep "FIND_PENDING\|NEXT_SITE"
   # Deve mostrar busca de sites pendentes em toda a lista
   ```

3. **Confirmar estatísticas finais:**
   ```bash
   curl http://localhost:8000/api/oauth/session/status
   # Verificar: completed_sites = 19 (ou próximo disso)
   ```

---

## 📝 REFERÊNCIAS

**Commits Relacionados:**
- `06ca948` - fix(oauth): Corrigir current_site_index na navegação manual
- `3379f99` - fix(oauth): Resolver DNS api-service + timeout frontend

**Documentação:**
- FIX_OAUTH_NAVEGACAO_MANUAL_2025-11-15.md
- FIX_OAUTH_COMPLETO_2025-11-15.md

---

## ✅ CHECKLIST VALIDAÇÃO

- [x] Campo `attempts` adicionado em SiteProgress
- [x] Método `find_next_pending_site()` criado
- [x] Método `move_to_next_site()` modificado
- [x] Incremento de `attempts` em `navigate_to_site()`
- [x] Sintaxe Python validada
- [x] api-service reiniciado (healthy)
- [x] Logs implementados (FIND_PENDING, retry info)
- [ ] Teste manual completo (aguardando usuário)
- [ ] Confirmação de processamento completo (todos os 19 sites)

---

**FIM DO DOCUMENTO**

**Status:** ✅ **FIX APLICADO - AGUARDANDO TESTE DO USUÁRIO**
