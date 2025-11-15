# 🧪 GUIA DE TESTE - Fix Timeout ADVFN

**Data:** 2025-11-15
**Commit:** `8115ce1`
**Problema:** Timeout ADVFN (58.938s)
**Solução:** Timeout 60s → 120s + Graceful Fallback

---

## 📋 PRÉ-REQUISITOS

**1. Serviços Rodando:**
```bash
docker-compose ps
# ✅ api-service: Up (healthy)
# ✅ scrapers: Up (healthy)
# ✅ frontend: Up (healthy)
```

**2. Fix Aplicado:**
```bash
git log -1 --oneline
# 8115ce1 fix(oauth): Resolver timeout ADVFN (60s → 120s + graceful fallback)
```

**3. Timeout Verificado:**
```bash
grep "set_page_load_timeout" backend/python-scrapers/oauth_session_manager.py
# DEVE mostrar: self.driver.set_page_load_timeout(120)
```

---

## 🎯 TESTE MANUAL (MÉTODO 1 - VIA UI)

### Passo 1: Acessar OAuth Manager

**URL:** http://localhost:3100/oauth-manager

**Problema Identificado:** ⚠️ Sistema requer autenticação

**Solução Temporária:**
1. Se não houver sistema de login configurado, vá para **MÉTODO 2 (API Direta)**
2. OU configure autenticação temporária no frontend

---

## 🔧 TESTE MANUAL (MÉTODO 2 - API DIRETA) ⭐ RECOMENDADO

### Passo 1: Verificar Status Atual

```bash
# Verificar se já existe sessão ativa
curl http://localhost:8000/api/oauth/session/status
```

**Resultado Esperado:**
```json
{
  "success": true,
  "session": null,
  "message": "Nenhuma sessão ativa"
}
```

---

### Passo 2: Iniciar Sessão OAuth

```bash
# Iniciar nova sessão OAuth
curl -X POST http://localhost:8000/api/oauth/session/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "session_id": "...",
  "vnc_url": "http://localhost:6080",
  "message": "Sessão OAuth iniciada com sucesso"
}
```

---

### Passo 3: Abrir VNC Viewer

**URL:** http://localhost:6080

**O que você verá:**
- Chrome abrindo automaticamente
- Navegação para o primeiro site (Google)
- Aguardando sua ação

---

### Passo 4: Navegar Pelos Sites (Manual)

**Opção A - Site por Site:**
```bash
# Avançar para próximo site
curl -X POST http://localhost:8000/api/oauth/session/next-site
```

**Opção B - Processamento Automático:**
```bash
# Processar todos os 19 sites automaticamente
# (90s timeout por site)
```
⚠️ **Nota:** Modo automático pode não existir via API. Use navegação manual.

---

### Passo 5: Monitorar Progresso

**Em outro terminal, rode:**
```bash
# Monitorar logs em tempo real
docker-compose logs -f api-service | grep -E "NAVIGATE|ADVFN|timeout"
```

**O que procurar nos logs:**

**✅ SUCESSO (Navegação Normal < 120s):**
```
[NAVIGATE] Iniciando navegação para ADVFN...
[NAVIGATE] Página carregada em 59.45s
[NAVIGATE] ✓ Navegação concluída em 62.31s. Aguardando ação do usuário...
```

**⚠️ LENTO MAS OK (60-120s):**
```
[NAVIGATE] Iniciando navegação para ADVFN...
[NAVIGATE] Página carregada em 85.23s
[NAVIGATE] ⚠️ Navegação MUITO LENTA: 85.23s (> 60s)
[NAVIGATE] ✓ Navegação concluída. Aguardando ação do usuário...
```

**✅ GRACEFUL FALLBACK (Timeout mas continua):**
```
[NAVIGATE] Iniciando navegação para ADVFN...
[NAVIGATE] ⚠️ Timeout/Erro durante carregamento após 120.45s: timeout
[NAVIGATE] ⚠️ Continuando mesmo assim - site pode ter carregado parcialmente
[NAVIGATE] Aguardando 3s para carregamento completo...
[NAVIGATE] ✓ Navegação concluída. Aguardando ação do usuário...
```

**❌ FALHA (se ainda ocorrer):**
```
[NAVIGATE] ❌ Erro ao navegar para advfn após 125.67s
[NAVIGATE] Erro: TimeoutException: ...
```

---

### Passo 6: Quando Chegar no ADVFN

**No VNC Viewer (http://localhost:6080):**

1. ⏱️ **Aguarde até 120 segundos** (ANTES era 60s)
2. 👀 **Observe:**
   - Chrome tentando carregar ADVFN
   - Barra de progresso no navegador
   - Página renderizando gradualmente

3. ✅ **Sucesso Esperado:**
   - Página ADVFN carrega (pode demorar 60-120s)
   - **Sem erro de timeout**
   - VNC mostra página ADVFN visível

4. 🔐 **Ação Necessária (se site pedir login):**
   - ADVFN pode requerer credenciais próprias
   - Se não tiver, clique "Próximo Site" (botão ou API)
   - Cookies parciais já foram coletados

---

### Passo 7: Verificar Cookies Coletados

```bash
# Ver status da sessão (inclui cookies)
curl http://localhost:8000/api/oauth/session/status
```

**Procurar no JSON:**
```json
{
  "session": {
    "sites_progress": [
      {
        "site_id": "advfn",
        "site_name": "ADVFN",
        "status": "completed",  // ✅ ou "waiting_user"
        "cookies_count": 29,    // ✅ Deve ter cookies!
        "error_message": null   // ✅ SEM ERRO
      }
    ]
  }
}
```

---

### Passo 8: Finalizar Teste

**Se quiser cancelar sessão:**
```bash
curl -X POST http://localhost:8000/api/oauth/session/cancel
```

**Se quiser salvar cookies:**
```bash
curl -X POST http://localhost:8000/api/oauth/session/save-cookies
```

---

## 📊 CRITÉRIOS DE SUCESSO

| Critério | ANTES (60s) | DEPOIS (120s) | Status |
|----------|-------------|---------------|--------|
| **Timeout ADVFN** | ❌ 58.938s (falha) | ✅ < 120s (sucesso) | ⏳ **TESTAR** |
| **Cookies Coletados** | ❌ 0 (perdidos) | ✅ 29+ | ⏳ **TESTAR** |
| **Erro de Timeout** | ❌ Exception | ✅ Warning gracioso | ⏳ **TESTAR** |
| **Logs Detalhados** | ⚠️ Básicos | ✅ Performance tracking | ✅ **OK** |
| **Fallback** | ❌ Falha imediata | ✅ Aproveita parcial | ✅ **IMPLEMENTADO** |

---

## 🔍 TROUBLESHOOTING DO TESTE

### Problema: "Connection refused" na porta 8000

**Causa:** Network mode sharing (api-service usa rede do scrapers)

**Solução:**
```bash
# Verificar se scrapers está rodando
docker-compose ps scrapers

# Se scrapers não estiver healthy, reiniciar
docker-compose restart scrapers
sleep 10
docker-compose restart api-service
```

---

### Problema: VNC não abre (porta 6080)

**Causa:** Container scrapers não está rodando

**Solução:**
```bash
# Verificar logs do scrapers
docker-compose logs scrapers --tail=50

# Se houver erro de Xvfb lock, fazer down + up
docker-compose down
docker-compose up -d
```

---

### Problema: ADVFN ainda dá timeout > 120s

**Causa:** Site extremamente pesado ou problema de rede

**Próximas Soluções (implementar se necessário):**

**1. Usar domcontentloaded (mais rápido):**
```python
# Modificar oauth_session_manager.py
# Trocar waitUntil de 'load' para 'domcontentloaded'
```

**2. Aumentar timeout para 180s:**
```python
self.driver.set_page_load_timeout(180)  # 3 minutos
```

**3. Implementar retry logic:**
```python
for attempt in range(3):
    try:
        self.driver.get(url)
        break
    except TimeoutException:
        logger.warning(f"Tentativa {attempt+1}/3 falhou, retry em {2**attempt}s")
        await asyncio.sleep(2 ** attempt)
```

---

## 📝 RESULTADO DO TESTE (PREENCHER APÓS TESTAR)

**Data do Teste:** __________
**Testado por:** __________

**Navegação ADVFN:**
- [ ] ✅ Carregou em < 60s
- [ ] ✅ Carregou entre 60-120s (com warning)
- [ ] ❌ Timeout > 120s (falhou)
- [ ] ⏭️ Não testado (pulou ADVFN)

**Cookies Coletados:**
- [ ] ✅ 29+ cookies coletados
- [ ] ⚠️ Menos de 29 cookies
- [ ] ❌ 0 cookies (falha total)

**Logs Observados:**
```
[COPIE OS LOGS RELEVANTES AQUI]
```

**Observações:**
```
[DESCREVA O COMPORTAMENTO OBSERVADO]
```

**Status Final:**
- [ ] ✅ **FIX FUNCIONOU** - ADVFN carregou sem timeout
- [ ] ⚠️ **FIX PARCIAL** - Carregou mas com warnings
- [ ] ❌ **FIX NÃO FUNCIONOU** - Ainda dá timeout

---

## 🚀 COMANDOS RÁPIDOS

**Setup Completo:**
```bash
# 1. Verificar serviços
docker-compose ps

# 2. Reiniciar se necessário
docker-compose restart api-service scrapers

# 3. Iniciar sessão OAuth
curl -X POST http://localhost:8000/api/oauth/session/start -H "Content-Type: application/json" -d '{}'

# 4. Abrir VNC
# Browser: http://localhost:6080

# 5. Monitorar logs
docker-compose logs -f api-service | grep -E "NAVIGATE|ADVFN"
```

**Navegação Manual (API):**
```bash
# Status atual
curl http://localhost:8000/api/oauth/session/status

# Próximo site
curl -X POST http://localhost:8000/api/oauth/session/next-site

# Voltar site anterior
curl -X POST http://localhost:8000/api/oauth/session/go-back

# Pular para site específico
curl -X POST http://localhost:8000/api/oauth/session/navigate-to-site \
  -H "Content-Type: application/json" \
  -d '{"site_id": "advfn"}'

# Cancelar sessão
curl -X POST http://localhost:8000/api/oauth/session/cancel
```

---

**FIM DO GUIA DE TESTE**

**Próximo Passo:** Execute o teste e preencha a seção "RESULTADO DO TESTE" acima! 🎯
