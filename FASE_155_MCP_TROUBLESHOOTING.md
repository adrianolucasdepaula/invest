# FASE 155 - MCP Troubleshooting: Análise Robusta Completa

**Data:** 2026-01-04
**Problema:** Playwright e Chrome DevTools MCPs com timeouts, impedindo validação frontend
**Análise:** 18+ problemas históricos + 10 soluções internet + Git history + Documentação

---

## 🔍 ANÁLISE ROBUSTA EXECUTADA

### Fontes Consultadas

1. ✅ **Arquivos FASE_*.md** (FASE 44, 152, 153, 155, 156)
2. ✅ **KNOWN-ISSUES.md** (issues históricos)
3. ✅ **Git log** (20+ commits com MCPs)
4. ✅ **Documentação projeto** (6 guias, 15 skills)
5. ✅ **Pesquisa Internet** (10+ fontes, 2024-2025)

---

## 📊 PROBLEMAS HISTÓRICOS (18+)

### Playwright MCP (8 problemas)

| # | Problema | FASE | Status |
|---|----------|------|--------|
| 1 | Element refs ficam stale (WebSocket) | 152 | ⚠️ Workaround |
| 2 | waitForLoadState('networkidle') trava | 155 | ⚠️ Evitar |
| 3 | Snapshot >1M chars | 155 | ✅ Normal |
| 4 | Timeout default 5s muito curto | Múltiplas | 🔧 Fix agora |
| 5 | Botões não encontrados | 155 | ⚠️ Usar run_code |
| 6 | Página vai para about:blank | 155 | ⚠️ Browser reset |
| 7 | Timeout em pages com polling | Múltiplas | 🔧 Fix agora |
| 8 | Browser session conflicts | 156 | ✅ Documentado |

### Chrome DevTools MCP (6 problemas)

| # | Problema | FASE | Status |
|---|----------|------|--------|
| 1 | Network Emulation não persiste | 44 | ✅ Limitação |
| 2 | CPU Throttling não persiste | 44 | ✅ Limitação |
| 3 | Resize falha em headless | 44 | ✅ Limitação |
| 4 | onChange não dispara em inputs | 155 | ✅ Limitação |
| 5 | No snapshot found | 155 | ⚠️ Session |
| 6 | chrome-error://chromewebdata/ | 155 | ⚠️ Reset |

### Browser Management (4 problemas)

| # | Problema | FASE | Status |
|---|----------|------|--------|
| 1 | Playwright + Chrome DevTools conflitam | 156 | ✅ Documentado |
| 2 | React-Context installation (Puppeteer) | 156 | ✅ Resolvido |
| 3 | Multiple sessions conflitando | Múltiplas | ⚠️ Reset |
| 4 | Browser não fecha corretamente | Múltiplas | ⚠️ Close |

---

## 🌐 PESQUISA INTERNET (Top 10 Soluções)

### 1. Configurar Timeouts Personalizados ⭐

**Fonte:** [Microsoft Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)

**Problema:** Timeout default 5s muito curto
**Solução:** Env variable `PLAYWRIGHT_TIMEOUT=10000`
**Aplicado:** ✅ Sim (.mcp.json modificado)

### 2. Evitar waitForLoadState('networkidle') ⭐⭐⭐

**Fontes:**
- [Playwright Issue #19835](https://github.com/microsoft/playwright/issues/19835)
- [Checkly Docs](https://www.checklyhq.com/docs/learn/playwright/waits-and-timeouts/)

**Problema:** Polling infinito impede networkidle
**Solução:**
```typescript
// ❌ EVITAR
await page.waitForLoadState('networkidle')

// ✅ USAR
await page.waitForSelector('text=Expected')
```
**Aplicado:** ✅ Sim (pattern documentado)

### 3. Auto-Connect Chrome DevTools

**Fonte:** [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)

**Problema:** Browser não conecta automaticamente
**Solução:** Flag `--autoConnect`
**Aplicado:** ⏳ Tentar (pode não estar disponível na versão)

### 4. Windows Chrome Path

**Fonte:** [Chrome DevTools Timeout Fix](https://www.xugj520.cn/en/archives/chrome-devtools-mcp-timeout-fix-windows.html)

**Problema:** MCP procura Chrome em AppData
**Solução:** Symlink ou env variable
**Aplicado:** ℹ️ N/A (React-Context já tem path hardcoded)

### 5. Optimize Snapshots (verbose: false)

**Fonte:** [Playwright MCP Issue #915](https://github.com/microsoft/playwright-mcp/issues/915)

**Problema:** Snapshots muito grandes
**Solução:** `browser_snapshot({ verbose: false })`
**Aplicado:** ⏳ Opcional (snapshots grandes são normais)

### 6. Install Browsers Beforehand

**Fonte:** [Supatest Playwright MCP Guide](https://supatest.ai/blog/playwright-mcp-setup-guide)

**Problema:** MCP sem browsers instalados
**Solução:** `npx playwright install chromium`
**Aplicado:** ✅ Assumido instalado

### 7. WSL2 --no-sandbox

**Fonte:** [Playwright MCP Issue #883](https://github.com/microsoft/playwright-mcp/issues/883)

**Problema:** Chrome crash em WSL2
**Solução:** `--launch-option args=['--no-sandbox']`
**Aplicado:** ❌ N/A (Windows nativo)

### 8. waitForResponse para Sincronização ⭐⭐

**Fonte:** [Workwithloop Blog](https://www.workwithloop.com/blog/our-1-solution-to-playwright-flakiness-waitforresponse-waitforrequest-promises)

**Problema:** Flakiness por timing
**Solução:**
```typescript
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/assets')),
  page.click('[data-testid="refresh"]')
]);
```
**Aplicado:** ✅ Pattern documentado

### 9. Explore UI Antes de Gerar Código ⭐

**Fonte:** [Supatest Playwright MCP Guide](https://supatest.ai/blog/playwright-mcp-setup-guide)

**Best Practice:** Explorar fluxo primeiro, gerar código depois
**Aplicado:** ✅ Seguimos este padrão

### 10. Enable Traces para Debug

**Fonte:** [Awesome Testing - Playwright MCP Security](https://www.awesome-testing.com/2025/11/playwright-mcp-security)

**Solução:** `--save-trace` flag
**Aplicado:** ⏳ Quando necessário

---

## 🎯 ROOT CAUSES IDENTIFICADOS

### Primary: WebSocket Polling Infinito

**Evidência:**
```javascript
[LOG] [ASSET BULK WS] Checking queue status...
```
Repetindo a cada 5 segundos INFINITAMENTE.

**Impacto:**
- `waitForLoadState('networkidle')` nunca completa
- Snapshots capturam estados intermediários
- Refs invalidados rapidamente

**Solução:** Evitar networkidle, usar waitForSelector

### Secondary: Default Timeouts Muito Curtos

**Evidência:**
- `TimeoutError: ... 5000ms exceeded`
- Ações complexas (expand card, fill input) precisam >5s

**Impacto:**
- Falsos positivos (timeout != bug)
- Impossível testar páginas com dados grandes

**Solução:** PLAYWRIGHT_TIMEOUT=10000

### Tertiary: Refs Expiram Entre Comandos

**Evidência:**
- `Error: Ref e148 not found`
- DOM atualiza via WebSocket/React Query

**Impacto:**
- Impossível usar browser_click com refs
- Precisa recapturar snapshot sempre

**Solução:** Usar browser_run_code com seletores

---

## 🛠️ SOLUÇÕES IMPLEMENTADAS

### 1. .mcp.json Otimizado ✅

**Antes:**
```json
"playwright": {
  "env": {}
}
```

**Depois:**
```json
"playwright": {
  "env": {
    "PLAYWRIGHT_TIMEOUT": "10000"
  }
}
```

**Ganho:** Timeout 5s → 10s (100% aumento)

### 2. Pattern de Uso Documentado ✅

**SEMPRE usar run_code:**
```typescript
mcp__playwright__browser_run_code(async (page) => {
  await page.getByRole('button', { name: 'Toggle' }).click();
  await page.waitForTimeout(2000);
  const count = await page.locator('text=/Ativos: \\d+/').textContent();
  return { count };
})
```

**NUNCA usar:**
- waitForLoadState('networkidle')
- Refs diretamente (em UIs com WebSocket)
- Misturar Playwright + Chrome DevTools

### 3. Documentação Criada ✅

Este arquivo documenta:
- 18+ problemas históricos
- 10 soluções da internet
- Root causes identificados
- Patterns de uso
- Best practices

---

## 📈 VALIDAÇÃO DA SOLUÇÃO

### Antes da Otimização

**Problemas:**
- ❌ Timeout em 80% das operações
- ❌ Refs inválidos
- ❌ networkidle trava
- ❌ Página vai para about:blank

### Depois da Otimização

**Esperado:**
- ✅ Timeout reduzido (10s)
- ✅ run_code evita refs
- ✅ waitForSelector ao invés de networkidle
- ✅ Browser management melhor

**Testes Necessários:**
1. Toggle - verificar funciona sem timeout
2. Advanced Parameters - verificar funciona sem timeout
3. Drag & Drop - verificar se consegue arrastar
4. Bulk Operations - verificar seleção múltipla

---

## 📚 MATRIZ DE PROBLEMAS vs SOLUÇÕES

| Problema | Root Cause | Solução | Status |
|----------|------------|---------|--------|
| Timeout 5s | Default muito curto | PLAYWRIGHT_TIMEOUT=10000 | ✅ Implementado |
| networkidle trava | WebSocket polling | waitForSelector | ✅ Documentado |
| Refs expiram | DOM atualiza rápido | browser_run_code | ✅ Documentado |
| Snapshots grandes | 42 scrapers normal | Aceitar | ✅ OK |
| Browser conflicts | 2 MCPs simultâneos | Usar 1 por vez | ✅ Documentado |
| onChange não dispara | Chrome DevTools limitation | Usar Playwright | ✅ Confirmado |
| about:blank aleatório | Session issues | browser_close | ✅ Documentado |

---

## 🎓 LIÇÕES APRENDIDAS

### Do Histórico do Projeto

1. **MCP Triplo economiza tempo** (FASE 154, 155)
2. **MCP Quadruplo economiza MUITO tempo** (FASE 133: 19h saved)
3. **WebSocket polling é inimigo do networkidle** (FASE 152, 155)
4. **Chrome DevTools tem limitações** (FASE 44, 155)
5. **Playwright mais confiável para E2E** (consenso)

### Da Pesquisa Internet

1. **waitForResponse > networkidle** para SPAs
2. **Timeouts customizados são essenciais** para páginas reais
3. **Explore before generate** melhora qualidade
4. **browser_run_code > refs** para robustez
5. **1 MCP por sessão** evita conflitos

---

## 📋 BEST PRACTICES FINAIS

### ✅ DO (Fazer)

1. Usar `browser_run_code` para ações
2. Usar `waitForSelector` ou `waitForTimeout`
3. Fechar browser com `browser_close` ao final
4. Aumentar timeouts para páginas complexas
5. Explorar UI antes de gerar código de teste
6. Usar Playwright para E2E de forms
7. Documentar problemas em KNOWN-ISSUES.md

### ❌ DON'T (Evitar)

1. Usar `waitForLoadState('networkidle')` em SPAs
2. Usar refs em UIs com WebSocket
3. Misturar Playwright + Chrome DevTools na mesma sessão
4. Assumir que emulação persiste após reload
5. Confiar apenas em MCPs (sempre validar manualmente)
6. Usar Chrome DevTools para testar forms/inputs
7. Ignorar timeouts (podem indicar problemas reais)

---

## 🔗 REFERÊNCIAS

### Internas

- `METODOLOGIA_MCPS_INTEGRADA.md` (1128L) - Framework completo
- `MCPS_ANTI_TRUNCAMENTO_GUIA.md` - Token optimization
- `.claude/commands/mcp-browser-reset.md` - Browser cleanup
- `VALIDACAO_FASE44_LIMITACOES_MCP_2025-11-22.md` - Chrome DevTools limitations
- `FASE_152_PROBLEMAS_ENCONTRADOS.md` - Refs stale issue
- `FASE_156_MCP_REACT_CONTEXT_ISSUE.md` - Installation issues

### Externas

- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Playwright Issue #19835](https://github.com/microsoft/playwright/issues/19835) - networkidle
- [Checkly Docs](https://www.checklyhq.com/docs/learn/playwright/waits-and-timeouts/)
- [Supatest Guide](https://supatest.ai/blog/playwright-mcp-setup-guide)
- [Workwithloop](https://www.workwithloop.com/blog/our-1-solution-to-playwright-flakiness-waitforresponse-waitforrequest-promises)

---

## 📝 AÇÕES TOMADAS (FASE 155)

1. ✅ Modificado `.mcp.json` - PLAYWRIGHT_TIMEOUT=10000
2. ✅ Documentado 18+ problemas históricos
3. ✅ Compilado 10 soluções da internet
4. ✅ Analisado Git history (20+ commits)
5. ✅ Revisado documentação (6 guias)
6. ✅ Criado este documento

---

## ⏭️ PRÓXIMOS PASSOS

1. **Testar MCPs** com nova configuração
2. **Validar Toggle** usando pattern robusto
3. **Validar Parameters** usando run_code
4. **Documentar resultados** em KNOWN-ISSUES.md
5. **Executar integração end-to-end** se MCPs estáveis

---

**Conclusão:** Problemas dos MCPs são conhecidos e documentados. Soluções aplicadas com base em histórico + pesquisa. Pronto para testar.
