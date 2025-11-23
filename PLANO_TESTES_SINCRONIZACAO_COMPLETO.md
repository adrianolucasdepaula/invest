# PLANO DE TESTES: Sistema de Sincronização B3
**Data:** 2025-11-22
**Objetivo:** Testar sincronização em massa (≥10 ativos) e individual (5 ativos)
**Status:** ANÁLISE COMPLETA - Aguardando Execução

---

## 📋 SUMÁRIO EXECUTIVO

### Contexto Completo

**Histórico do Sistema:**
- ✅ **FASE 35** (2025-11-20): Sistema completo implementado (backend + frontend + WebSocket)
- ✅ **FASE 37** (2025-11-21): Melhorias com datas completas (DD/MM/YYYY)
- ✅ **BUGFIX** (commit `8ca9f30`, 2025-11-22): Correção de 2 problemas críticos:
  1. Validação fail-fast ANTES do HTTP 202 (evita UI travada)
  2. Supressão de eventos WebSocket duplicados (fix progress bar)
- ✅ **BUGFIX SESSION** (2025-11-22): Limite de 20 ativos removido do modal

**Funcionalidades Testadas:**
- [x] Backend: GET `/api/v1/market-data/sync-status` (55 ativos)
- [x] Backend: POST `/api/v1/market-data/sync-bulk` (HTTP 202 + validação prévia)
- [x] Frontend: Modal "Sincronizar em Massa" (abertura/fechamento)
- [ ] **PENDENTE:** Sync batch completo (10+ ativos) com monitoramento
- [ ] **PENDENTE:** Sync individual (5 ativos) via botão "Re-Sincronizar"

**Problemas Identificados Durante Tentativas de Teste:**
- ❌ Playwright MCP: Timeout ao clicar "Iniciar Sincronização" (esperado - sync longo)
- ❌ Chrome DevTools MCP: Timeout (esperado - sync longo)
- ✅ **CAUSA RAIZ:** Sync de 55 ativos leva ~138 minutos (2h 18min)
- ✅ **SOLUÇÃO:** Testes automatizados com timeout padrão (5-10s) não são adequados

---

## 🎯 ESTRATÉGIAS DE TESTE (3 OPÇÕES)

### 🥇 OPÇÃO 1: TESTES MANUAIS GUIADOS (RECOMENDADO)

**Vantagens:**
- ✅ Adequado para operações longas (até 2h+)
- ✅ Permite validação visual em tempo real
- ✅ Identifica problemas de UX/UI facilmente
- ✅ Não requer configuração adicional

**Desvantagens:**
- ❌ Trabalhoso (requer interação manual)
- ❌ Screenshots devem ser capturados manualmente

**Quando Usar:**
- Primeira vez testando funcionalidade nova
- Sync de muitos ativos (10+)
- Validação de comportamento em tempo real

**Guia Detalhado:** Ver seção "GUIA DE TESTE MANUAL"

---

### 🥈 OPÇÃO 2: SCRIPT AUTOMATIZADO HTTP (INTERMEDIÁRIO)

**Vantagens:**
- ✅ Testa backend diretamente (sem UI)
- ✅ Rápido de executar
- ✅ Pode rodar em background
- ✅ Logs detalhados

**Desvantagens:**
- ❌ Não valida UI/UX
- ❌ Não testa WebSocket events (apenas endpoints REST)

**Quando Usar:**
- Teste rápido de backend após mudanças
- CI/CD pipelines
- Validação de lógica de negócio

**Script Disponível:** Ver seção "SCRIPT AUTOMATIZADO"

---

### 🥉 OPÇÃO 3: PLAYWRIGHT E2E COMPLETO (AVANÇADO)

**Vantagens:**
- ✅ Testa UI + Backend + WebSocket
- ✅ Screenshots automáticos
- ✅ Logs estruturados

**Desvantagens:**
- ❌ Complexo de configurar (timeout > 2h)
- ❌ Pode travar se sync falhar
- ❌ Difícil de debugar

**Quando Usar:**
- Validação completa end-to-end
- Regression testing automatizado
- CI/CD com ambiente dedicado

**⚠️ NÃO RECOMENDADO** para primeira execução de sync longo.

---

## 📘 GUIA DE TESTE MANUAL (OPÇÃO 1 - RECOMENDADO)

### Pré-Requisitos

1. **Serviços iniciados:**
```bash
docker-compose up -d
docker-compose logs -f invest_backend | grep "sync"
docker-compose logs -f invest_frontend | grep "data-management"
```

2. **Validação ambiente:**
- ✅ Backend: http://localhost:3101/api/v1/market-data/sync-status (deve retornar 55 ativos)
- ✅ Frontend: http://localhost:3100/data-management (deve carregar sem erros)
- ✅ WebSocket: Console do navegador deve mostrar `[SYNC WS] Conectado ao namespace /sync`

3. **Login no sistema:**
- Abrir http://localhost:3100
- Login: `admin@invest.com` / Senha: `admin123`

---

### TESTE BATCH: 55 ATIVOS (Simplificado)

**Objetivo:** Testar sincronização em massa com TODOS os 55 ativos.

**Passos:**

1. **Navegar para Data Management:**
   - URL: http://localhost:3100/data-management
   - Verificar que página carregou (55 cards de ativos visíveis)

2. **Abrir Modal "Sincronizar em Massa":**
   - Clicar botão "Sincronizar em Massa" (azul, canto superior direito)
   - ✅ **VALIDAR:** Modal abriu corretamente
   - ✅ **VALIDAR:** Título "Configurar Sincronização em Massa"

3. **Selecionar TODOS os ativos:**
   - Clicar botão "Selecionar Todos"
   - ✅ **VALIDAR:** Contador mostra "55 ativo(s) selecionado(s)"
   - ✅ **VALIDAR:** Tempo estimado: 138 min

4. **Configurar Período:**
   - Clicar em "Últimos 5 Anos" (já deve estar selecionado)
   - ✅ **VALIDAR:** Datas preenchidas automaticamente:
     - Data Inicial: 22/11/2020
     - Data Final: 22/11/2025 (data atual)

5. **Screenshot ANTES de iniciar:**
   - Tirar screenshot do modal completo
   - Salvar como: `TESTE_BATCH_55_ATIVOS_MODAL_ANTES.png`

6. **Iniciar Sincronização:**
   - Clicar botão "Iniciar Sincronização" (azul)
   - ✅ **VALIDAR:** Modal fechou imediatamente
   - ✅ **VALIDAR:** Toast notification apareceu:
     - Título: "Sincronização iniciada"
     - Descrição: "55 ativo(s) em processamento"

7. **Monitorar Progresso (CRÍTICO):**
   - **Seção "Progresso"** deve aparecer no topo da página
   - ✅ **VALIDAR:** Status: "Conectado"
   - ✅ **VALIDAR:** Barra de progresso aumentando (0% → 100%)
   - ✅ **VALIDAR:** Métricas atualizando em tempo real:
     - Total: 55
     - Sucesso: incrementando
     - Falhas: deve permanecer 0 (idealmente)

8. **Logs de Sincronização:**
   - Scroll até seção "Logs de Sincronização" (final da página)
   - ✅ **VALIDAR:** Logs aparecendo em tempo real
   - ✅ **VALIDAR:** Formato:
     - "ABEV3: Sincronizado com sucesso (2.832 registros em 18.33s)"
     - "PETR4: Sincronizado com sucesso (5.929 registros em 24.03s)"

9. **Screenshots Intermediários:**
   - **10 minutos:** `TESTE_BATCH_55_ATIVOS_10MIN.png`
   - **30 minutos:** `TESTE_BATCH_55_ATIVOS_30MIN.png`
   - **60 minutos:** `TESTE_BATCH_55_ATIVOS_60MIN.png`
   - **Fim (138min):** `TESTE_BATCH_55_ATIVOS_FINAL.png`

10. **Validação Final:**
    - ✅ Progresso: 100%
    - ✅ Total: 55 / Sucesso: 55 / Falhas: 0
    - ✅ Logs: 55 entradas (uma por ativo)
    - ✅ Tabela de ativos: Status "Sincronizado" para todos

---

### TESTE INDIVIDUAL: 5 ATIVOS

**Objetivo:** Testar sincronização individual via botão "Re-Sincronizar".

**Ativos Selecionados:**
1. ABEV3
2. PETR4
3. VALE3
4. ITUB4
5. BBDC4

**Passos (para cada ativo):**

1. **Localizar ativo:**
   - Scroll até encontrar card do ativo (ex: ABEV3)
   - Verificar status atual (Sincronizado/Parcial/Pendente)

2. **Abrir Modal Individual:**
   - Clicar botão "Re-Sincronizar" do ativo
   - ✅ **VALIDAR:** Modal específico abriu
   - ✅ **VALIDAR:** Ticker selecionado automaticamente (ex: ABEV3)

3. **Configurar Período:**
   - Selecionar "Últimos 5 Anos"
   - ✅ **VALIDAR:** Datas preenchidas (22/11/2020 a 22/11/2025)

4. **Iniciar Sync:**
   - Clicar "Iniciar Sincronização"
   - ✅ **VALIDAR:** Modal fechou
   - ✅ **VALIDAR:** Toast: "Sincronização iniciada"

5. **Monitorar (1-3 minutos por ativo):**
   - Verificar barra de progresso
   - Verificar logs aparecendo

6. **Validação:**
   - ✅ Progresso: 100%
   - ✅ Log: "ABEV3: Sincronizado com sucesso"
   - ✅ Card do ativo: Status atualizado

7. **Screenshot:**
   - Salvar: `TESTE_INDIVIDUAL_ABEV3_COMPLETO.png`

8. **Repetir para os outros 4 ativos**

---

## 🖥️ SCRIPT AUTOMATIZADO HTTP (OPÇÃO 2)

### Pré-Requisitos

```bash
# Instalar jq (parser JSON)
# Windows: choco install jq
# Linux: sudo apt install jq

# Verificar backend
curl http://localhost:3101/api/v1/market-data/sync-status
```

### Script PowerShell (Windows)

```powershell
# TESTE_SYNC_BATCH.ps1
# Testa sync em massa via HTTP direto

$baseUrl = "http://localhost:3101/api/v1/market-data"
$tickers = @("ABEV3", "PETR4", "VALE3", "ITUB4", "BBDC4", "MGLU3", "WEGE3", "B3SA3", "RENT3", "BBAS3")
$startYear = 2020
$endYear = 2025

Write-Host "=== TESTE BATCH SYNC ===" -ForegroundColor Cyan
Write-Host "Ativos: $($tickers.Length)"
Write-Host "Período: $startYear - $endYear"

# 1. Verificar status inicial
Write-Host "`n1. Verificando status inicial..." -ForegroundColor Yellow
$statusBefore = Invoke-RestMethod -Uri "$baseUrl/sync-status" -Method GET
Write-Host "Total ativos: $($statusBefore.summary.total)"

# 2. Iniciar sync batch
Write-Host "`n2. Iniciando sync batch..." -ForegroundColor Yellow
$body = @{
    tickers = $tickers
    startYear = $startYear
    endYear = $endYear
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/sync-bulk" -Method POST `
        -ContentType "application/json" -Body $body

    Write-Host "✅ Sync iniciado:" -ForegroundColor Green
    Write-Host "   Mensagem: $($response.message)"
    Write-Host "   Total: $($response.totalTickers)"
    Write-Host "   Estimativa: $($response.estimatedMinutes) min"

    # 3. Aguardar conclusão (polling a cada 30s)
    $elapsed = 0
    $maxWait = $response.estimatedMinutes * 60 # Converter para segundos

    Write-Host "`n3. Aguardando conclusão (polling a cada 30s)..." -ForegroundColor Yellow

    while ($elapsed -lt $maxWait) {
        Start-Sleep -Seconds 30
        $elapsed += 30

        $status = Invoke-RestMethod -Uri "$baseUrl/sync-status" -Method GET
        $synced = ($status.assets | Where-Object { $_.status -eq "SYNCED" }).Count

        Write-Host "[$elapsed s] Sincronizados: $synced / $($tickers.Length)"

        if ($synced -eq $tickers.Length) {
            Write-Host "`n✅ SYNC COMPLETO!" -ForegroundColor Green
            break
        }
    }

    # 4. Verificar status final
    Write-Host "`n4. Status final:" -ForegroundColor Yellow
    $statusAfter = Invoke-RestMethod -Uri "$baseUrl/sync-status" -Method GET

    $succeeded = ($statusAfter.assets | Where-Object { $_.status -eq "SYNCED" }).Count
    $failed = $tickers.Length - $succeeded

    Write-Host "Sucesso: $succeeded / $($tickers.Length)"
    Write-Host "Falhas: $failed"

} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Executar Script

```powershell
# Dar permissão (primeira vez)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Executar
.\TESTE_SYNC_BATCH.ps1
```

---

## 📊 EVIDÊNCIAS ESPERADAS

### Screenshots Obrigatórios

1. ✅ `TESTE_BATCH_55_ATIVOS_MODAL_ANTES.png` - Modal configurado antes de iniciar
2. ✅ `TESTE_BATCH_55_ATIVOS_10MIN.png` - Progresso após 10 minutos
3. ✅ `TESTE_BATCH_55_ATIVOS_30MIN.png` - Progresso após 30 minutos
4. ✅ `TESTE_BATCH_55_ATIVOS_60MIN.png` - Progresso após 60 minutos
5. ✅ `TESTE_BATCH_55_ATIVOS_FINAL.png` - Conclusão completa
6. ✅ `TESTE_INDIVIDUAL_ABEV3_COMPLETO.png` - Sync individual ABEV3
7. ✅ `TESTE_INDIVIDUAL_PETR4_COMPLETO.png` - Sync individual PETR4
8. ✅ `TESTE_INDIVIDUAL_VALE3_COMPLETO.png` - Sync individual VALE3
9. ✅ `TESTE_INDIVIDUAL_ITUB4_COMPLETO.png` - Sync individual ITUB4
10. ✅ `TESTE_INDIVIDUAL_BBDC4_COMPLETO.png` - Sync individual BBDC4

### Logs Obrigatórios

**Backend:**
```bash
docker-compose logs invest_backend > LOGS_BACKEND_SYNC.txt
```

**Frontend (Console):**
- Abrir DevTools (F12)
- Tab "Console"
- Copiar todos os logs
- Salvar em: `LOGS_FRONTEND_CONSOLE.txt`

**Network (DevTools):**
- Tab "Network"
- Filtrar: XHR
- Copiar HAR ou screenshot de requests
- Salvar em: `LOGS_NETWORK_REQUESTS.png`

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Validações Técnicas

- [ ] **TypeScript:** 0 erros (backend + frontend)
- [ ] **Build:** Success (backend + frontend)
- [ ] **Serviços:** Backend + Frontend + PostgreSQL + Redis todos healthy

### Validações Funcionais - Batch

- [ ] Modal "Sincronizar em Massa" abre corretamente
- [ ] Botão "Selecionar Todos" funciona (55 ativos)
- [ ] Período "Últimos 5 Anos" preenche datas automaticamente
- [ ] Botão "Iniciar Sincronização" dispara sync
- [ ] Modal fecha após iniciar
- [ ] Toast notification aparece
- [ ] Barra de progresso atualiza em tempo real
- [ ] Logs aparecem conforme sync progride
- [ ] Status final: 100% completo
- [ ] Todos os 55 ativos ficam com status "Sincronizado"

### Validações Funcionais - Individual

- [ ] Botão "Re-Sincronizar" abre modal individual (5x)
- [ ] Ticker preenchido automaticamente (5x)
- [ ] Sync individual funciona corretamente (5x)
- [ ] Logs individuais aparecem (5x)
- [ ] Cards atualizados após sync (5x)

### Validações de Performance

- [ ] Sync batch: tempo total ≤ 150 min (tolerância +10%)
- [ ] Sync individual: tempo médio ≤ 3 min por ativo
- [ ] WebSocket: eventos recebidos em < 1s
- [ ] UI: sem travamentos durante sync longo

### Validações de Erro

- [ ] Ticker inválido: HTTP 500 imediato (não HTTP 202)
- [ ] Eventos WebSocket: sem duplicação (4 eventos para 3 tickers)
- [ ] Falha em ativo: toast de erro aparece
- [ ] Logs de erro: aparecem na seção "Logs de Sincronização"

---

## 🎯 DECISÃO RECOMENDADA

**Para PRIMEIRA EXECUÇÃO de testes de sincronização:**

1. ✅ **USAR OPÇÃO 1** (Teste Manual Guiado)
2. ✅ **Executar com 55 ativos** (simplifica processo)
3. ✅ **Capturar screenshots intermediários** (evidência visual)
4. ✅ **Monitorar logs backend** (troubleshooting se necessário)
5. ✅ **Documentar resultados** em `RESULTADO_TESTES_SINCRONIZACAO.md`

**Após validação manual bem-sucedida:**
- Implementar OPÇÃO 2 (Script) para CI/CD
- Considerar OPÇÃO 3 (Playwright) para regression testing

---

## 📝 DOCUMENTAÇÃO PÓS-TESTE

Após executar testes, criar arquivo `RESULTADO_TESTES_SINCRONIZACAO.md` com:

```markdown
# Resultados: Testes de Sincronização B3
**Data:** YYYY-MM-DD
**Executor:** Nome
**Duração Total:** XXX minutos

## TESTE BATCH (55 ativos)
- Status: ✅ SUCESSO / ❌ FALHA
- Tempo total: XXX min (estimado: 138 min)
- Ativos sincronizados: XX/55
- Falhas: XX
- Logs: [anexo]
- Screenshots: [anexos]

## TESTE INDIVIDUAL (5 ativos)
- ABEV3: ✅ XX min
- PETR4: ✅ XX min
- VALE3: ✅ XX min
- ITUB4: ✅ XX min
- BBDC4: ✅ XX min

## PROBLEMAS IDENTIFICADOS
1. [Descrição do problema 1]
2. [Descrição do problema 2]

## EVIDÊNCIAS
- Screenshots: 10 arquivos
- Logs backend: LOGS_BACKEND_SYNC.txt
- Logs frontend: LOGS_FRONTEND_CONSOLE.txt
```

---

**FIM DO PLANO DE TESTES**

🤖 Generated with Claude Code - https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>
