# 🎯 GUIA DEFINITIVO: Validação Frontend - Capacidade MÁXIMA

**Versão:** FINAL 5.0
**Criado:** 2025-11-16
**Integração:** Framework Universal + CLAUDE.md + Metodologia do Projeto
**Objetivo:** Usar **TODA** a capacidade do Claude Code para validação frontend

---

## ⚡ PRINCÍPIOS FUNDAMENTAIS

### Do CLAUDE.md (OBRIGATÓRIOS)

1. **✅ Ultra-Thinking + TodoWrite + Validação Contínua**
   - SEMPRE usar Sequential Thinking (mesmo sem problemas)
   - SEMPRE usar TodoWrite para tarefas >= 3 etapas
   - SEMPRE validar (TypeScript 0 erros, Build Success)

2. **✅ Zero Tolerance**
   ```
   TypeScript Errors: 0 ✅ OBRIGATÓRIO
   Build Errors: 0 ✅ OBRIGATÓRIO
   Console Errors: 0 ✅ OBRIGATÓRIO
   ```

3. **✅ Documentação Completa**
   - Criar arquivo `.md` se mudança > 100 linhas
   - Incluir: problema, solução, arquivos, validação
   - Co-autoria: `Co-Authored-By: Claude <noreply@anthropic.com>`

4. **✅ MCP Triplo (Validação Cruzada)**
   - Chrome DevTools + Playwright + A11y
   - Comparar resultados
   - Documentar divergências

### Regras de Ouro (NÃO NEGOCIÁVEL)

❌ **NUNCA:**
1. Implementar sem planejar (exceto < 5 linhas triviais)
2. Commitar com erros TypeScript
3. Commitar com build quebrado
4. Pular validações do checklist
5. Deixar múltiplos `in_progress` simultâne os (TodoWrite)

✅ **SEMPRE:**
1. Ler contexto antes de implementar
2. Usar TodoWrite para tarefas >= 3 etapas
3. Validar TypeScript (0 erros) antes de commit
4. Validar Build (Success) antes de commit
5. Ter apenas 1 todo `in_progress` por vez
6. Marcar `completed` imediatamente após concluir
7. Atualizar documentação após implementação
8. Incluir co-autoria em commits
9. Documentar decisões técnicas importantes
10. Validar arquivos reais (documentação pode estar desatualizada)

---

## 🧠 METODOLOGIA: SEQUENTIAL THINKING ULTRA-PROFUNDO

### Capacidade MÁXIMA

**Sequential Thinking é usado em 100% do processo:**

```
┌────────────────────────────────────────────┐
│  🧠 SEQUENTIAL THINKING (MAESTRO)          │
│                                            │
│  Thoughts ilimitados (até resolver 100%)  │
│  Análise profunda OBRIGATÓRIA             │
│  Nada pode escapar                        │
└────────────────────────────────────────────┘
         │
         ├─→ TodoWrite (organização)
         ├─→ MCPs (Chrome, Playwright, A11y)
         ├─→ Agentes Especializados
         └─→ Validação Zero Tolerance
```

**Thoughts Mínimos:** 30 (validação completa)
**Thoughts Máximos:** Ilimitado (até garantir 100%)

---

## 📋 FRAMEWORK COMPLETO (PASSO-A-PASSO)

### ETAPA -1: TodoWrite - PLANEJAMENTO DE TAREFAS

**OBRIGATÓRIO** antes de iniciar:

```javascript
TodoWrite({
  todos: [
    {
      content: "Ler FRAMEWORK_VALIDACAO_FRONTEND_UNIVERSAL.md",
      status: "in_progress",
      activeForm: "Lendo framework"
    },
    {
      content: "Planejar validação com Sequential Thinking (thoughts 1-5)",
      status: "pending",
      activeForm: "Planejando"
    },
    {
      content: "Executar Chrome DevTools (navigate, console, snapshot, screenshot)",
      status: "pending",
      activeForm: "Executando Chrome"
    },
    {
      content: "Analisar resultados Chrome com Sequential Thinking",
      status: "pending",
      activeForm: "Analisando Chrome"
    },
    {
      content: "Executar Playwright (navigate, snapshot, console, screenshot)",
      status: "pending",
      activeForm: "Executando Playwright"
    },
    {
      content: "Comparar Chrome vs Playwright com Sequential Thinking",
      status: "pending",
      activeForm: "Comparando browsers"
    },
    {
      content: "Invocar agentes especializados (se necessário)",
      status: "pending",
      activeForm: "Invocando agentes"
    },
    {
      content: "Executar A11y audit",
      status: "pending",
      activeForm: "Auditando acessibilidade"
    },
    {
      content: "Consolidar com Sequential Thinking (decisão final)",
      status: "pending",
      activeForm: "Consolidando resultados"
    },
    {
      content: "Documentar resultado completo",
      status: "pending",
      activeForm: "Documentando"
    },
    {
      content: "Validar Zero Tolerance (TypeScript, Build, Console)",
      status: "pending",
      activeForm: "Validando Zero Tolerance"
    }
  ]
})
```

**Regras TodoWrite:**
- ✅ Apenas 1 `in_progress` por vez
- ✅ Marcar `completed` IMEDIATAMENTE após concluir
- ✅ Atualizar lista conforme progresso
- ✅ Adicionar novos todos se necessário

---

### ETAPA 0: Sequential Thinking - PLANEJAMENTO INICIAL

**Thoughts 1-5: Planejamento Ultra-Profundo**

#### Thought 1: Contexto e Objetivo
```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: `
Iniciando validação ULTRA-PROFUNDA de [URL].

Contexto do Projeto (CLAUDE.md):
- Projeto: B3 AI Analysis Platform
- Stack: Next.js 14 + NestJS 10 + PostgreSQL 16
- Metodologia: Ultra-Thinking + TodoWrite + Zero Tolerance
- MCPs: Chrome DevTools + Playwright + A11y + Sequential Thinking

Objetivo da Validação:
- URL: [URL]
- Tipo de Página: [assets/dashboard/analysis/etc]
- Feature: [descrição]
- Critério de Sucesso: >= 80% aprovação

Regras Obrigatórias:
1. TypeScript: 0 erros ✅
2. Build: Success ✅
3. Console: 0 erros ✅
4. MCP Triplo: Chrome + Playwright + A11y ✅
5. Documentação: Completa ✅

Próximo Thought: Identificar tipo de página e selecionar agentes.
`,
  thoughtNumber: 1,
  totalThoughts: 40, // Estimativa inicial (pode ajustar dinamicamente)
  nextThoughtNeeded: true
})
```

**✅ Marcar todo "Planejar" como completed**

#### Thought 2: Identificação de Tipo

```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: `
Analisando [URL] para identificar tipo de página.

Tipos Possíveis (FRAMEWORK_VALIDACAO_FRONTEND_UNIVERSAL.md):
1. /assets/[ticker] → Chart Expert + Data Consistency
2. /dashboard → Data Consistency + Performance
3. /analysis → Data Consistency + State Management
4. /portfolio → Data Consistency + Chart
5. /reports/[id] → Data Consistency + Chart

[URL] = [URL_REAL]
Tipo Identificado: [TIPO]

Agentes Especializados Necessários:
- [AGENTE 1]: [MOTIVO]
- [AGENTE 2]: [MOTIVO]
- A11y Compliance Expert: (sempre obrigatório)
- Cross-Browser Expert: (sempre obrigatório)

Próximo Thought: Definir sequência de execução detalhada.
`,
  thoughtNumber: 2,
  totalThoughts: 40,
  nextThoughtNeeded: true
})
```

#### Thought 3: Sequência de Execução

```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: `
Definindo sequência COMPLETA de validação para [TIPO].

Sequência Planejada (40 thoughts estimados):
- Thoughts 1-5: Planejamento (ESTE)
- Thoughts 6-15: Chrome DevTools (navigate, console, snapshot, screenshot + análise profunda)
- Thoughts 16-20: Invocar Agentes Especializados (se necessário)
- Thoughts 21-28: Playwright (navigate, snapshot, console, screenshot + comparação)
- Thoughts 29-34: A11y (audit, analysis, violações)
- Thoughts 35-40: Consolidação, Decisão Final, Documentação

Pré-requisitos (verificar antes de executar):
- [ ] Frontend rodando (http://localhost:3100)
- [ ] Backend saudável (docker-compose ps)
- [ ] PostgreSQL + Redis operacionais
- [ ] Dados existem (se aplicável)

Próximo Thought: Verificar pré-requisitos.
`,
  thoughtNumber: 3,
  totalThoughts: 40,
  nextThoughtNeeded: true
})
```

#### Thought 4: Verificação de Pré-requisitos

```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: `
Verificando pré-requisitos antes de iniciar MCPs.

Checklist:
1. Frontend rodando?
   - Comando: curl -s http://localhost:3100 | grep -q "B3 AI Analysis"
   - Resultado: [OK/FALHA]
   - Se FALHA: docker-compose restart frontend

2. Backend saudável?
   - Comando: docker-compose ps backend
   - Resultado: [healthy/unhealthy]
   - Se unhealthy: investigar logs

3. PostgreSQL + Redis?
   - Comando: docker-compose ps postgres redis
   - Resultado: [ambos healthy/problema]

4. Dados existem (se /assets/[ticker])?
   - Comando: docker exec postgres psql ... SELECT COUNT(*) FROM asset_prices WHERE ticker='[TICKER]'
   - Resultado: [X] pontos (mínimo 200 necessário)

Se TODOS pré-requisitos OK:
  → Prosseguir para Chrome DevTools
Se ALGUM pré-requisito FALHA:
  → Corrigir ANTES de prosseguir (adicionar thoughts)

Próximo Thought: Executar Chrome DevTools ou corrigir pré-requisitos.
`,
  thoughtNumber: 4,
  totalThoughts: 40,
  nextThoughtNeeded: true
})
```

#### Thought 5: Critérios de Sucesso Detalhados

```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: `
Definindo critérios EXATOS de sucesso para [URL].

Critérios Gerais (Zero Tolerance):
✅ TypeScript: 0 erros (obrigatório)
✅ Build: Success (obrigatório)
✅ Console: 0 erros (obrigatório)
✅ MCP Triplo: Chrome + Playwright + A11y (obrigatório)

Critérios Específicos para [TIPO]:
${
  tipo === 'assets' ?
  `
  ✅ 3 gráficos TradingView carregados
  ✅ Indicadores com valores numéricos (RSI, MACD, SMAs)
  ✅ Preço e variação exibidos
  ✅ Card de indicadores presente
  ` :
  tipo === 'dashboard' ?
  `
  ✅ Todos os cards carregados
  ✅ Dados atualizados (timestamps)
  ✅ Performance < 3s LCP
  ✅ Widgets interativos funcionando
  ` :
  '✅ [Definir critérios específicos conforme tipo]'
}

Critérios de Aprovação:
- >= 90%: Aprovação Total ✅
- 80-89%: Aprovação Parcial ⚠️
- < 80%: Reprovação ❌

Próximo Thought: Iniciar Chrome DevTools.
`,
  thoughtNumber: 5,
  totalThoughts: 40,
  nextThoughtNeeded: true
})
```

**✅ Atualizar TodoWrite: "Planejar" → completed, "Chrome DevTools" → in_progress**

---

### ETAPA 1: Chrome DevTools - ANÁLISE MÁXIMA

**Thoughts 6-15: Execução e Análise Profunda**

#### Thought 6: Navegação

```javascript
// EXECUTAR MCP
mcp__chrome-devtools__navigate_page({
  type: "url",
  url: [URL],
  timeout: 15000
})

// ANALISAR IMEDIATAMENTE
mcp__sequential-thinking__sequentialthinking({
  thought: `
Navegação executada para [URL].

Resultado:
- Status: [Successfully navigated / Timeout / Error]
- Tempo: [X.X]s (critério: < 15s)
- URL Final: [URL]

Análise:
${
  status === 'success' ?
  `
  ✅ Navegação bem-sucedida
  ✅ Tempo aceitável (${tempo}s < 15s)
  ✅ URL correta
  → Prosseguir para wait
  ` :
  `
  ❌ Navegação falhou
  ❌ Possíveis causas:
     1. Frontend não está rodando
     2. URL incorreta
     3. Timeout (backend lento?)
  → Investigar causa raiz ANTES de prosseguir
  → Adicionar thoughts para diagnóstico
  `
}

Próximo Thought: ${status === 'success' ? 'Aguardar renderização' : 'Diagnosticar falha'}
`,
  thoughtNumber: 6,
  totalThoughts: 40,
  nextThoughtNeeded: true
})
```

#### Thought 7: Aguardar Renderização

```javascript
// EXECUTAR MCP
mcp__chrome-devtools__wait_for({
  text: [TEXTO_ESPERADO], // Ex: "Análise Técnica Avançada"
  timeout: 10000
})

// ANALISAR
mcp__sequential-thinking__sequentialthinking({
  thought: `
Aguardando elemento "[TEXTO_ESPERADO]" na página.

Resultado:
- Status: [Element found / Timeout]
- Tempo: [X.X]s (critério: < 10s)

Análise:
${
  found ?
  `
  ✅ Elemento encontrado
  ✅ React renderizou com sucesso
  ✅ Componente principal carregou
  → Verificar console para erros
  ` :
  `
  ❌ Elemento não encontrado (timeout)
  ❌ Possíveis causas:
     1. Frontend não compilou (erro build)
     2. React error boundary ativou
     3. Componente não renderizou (prop faltando?)
     4. Texto esperado mudou (refatoração?)
  → Verificar console OBRIGATÓRIO
  → Verificar snapshot para ver o que renderizou
  `
}

Decisão: ${found ? 'Prosseguir para console' : 'Investigar snapshot + console'}
Próximo Thought: Verificar console.
`,
  thoughtNumber: 7,
  totalThoughts: 40,
  nextThoughtNeeded: true
})
```

#### Thought 8: Console - Análise PROFUNDA

```javascript
// EXECUTAR MCP
mcp__chrome-devtools__list_console_messages({
  types: ["error", "warn"]
})

// ANALISAR PROFUNDAMENTE
mcp__sequential-thinking__sequentialthinking({
  thought: `
Console messages analisados.

Resultado:
- Erros: [X]
- Warnings: [Y]

${
  errors > 0 ?
  `
  ❌ ERROS DETECTADOS (${errors})

  Análise CRÍTICA de cada erro:
  ${errors.map((err, i) => `
  Erro #${i+1}:
  - Mensagem: [MENSAGEM]
  - Tipo: [fetch failed / React error / JS error / etc]
  - Severidade: [crítico / moderado / menor]
  - Impacto: [bloqueia funcionalidade / apenas warning]
  - Causa Raiz Provável: [análise]
  - Ação Necessária: [correção imediata / documentar / ignorar]
  `).join('\n')}

  Decisão:
  - Se QUALQUER erro crítico: REPROVAR validação, PARAR execução, corrigir PRIMEIRO
  - Se apenas erros menores: Continuar mas documentar para correção futura
  ` :
  warnings > 0 ?
  `
  ⚠️ WARNINGS DETECTADOS (${warnings})

  Análise de cada warning:
  ${warnings.map((warn, i) => `
  Warning #${i+1}:
  - Mensagem: [MENSAGEM]
  - Tipo: [performance / best-practice / deprecation]
  - Impacto: [nenhum / menor]
  - Ação: [documentar / ignorar]
  `).join('\n')}

  Decisão: Warnings aceitáveis, prosseguir mas documentar.
  ` :
  `
  ✅ CONSOLE LIMPO (0 erros, 0 warnings)
  ✅ Página carregou PERFEITAMENTE
  ✅ Nenhum problema JavaScript
  ✅ Nenhum fetch falhou
  ✅ Nenhum component crash

  Conclusão: Console = 100% aprovado
  Confiança: MÁXIMA nesta etapa
  `
}

Próximo Thought: ${errors > 0 ? 'Detalhar erros críticos' : 'Snapshot da página'}
`,
  thoughtNumber: 8,
  totalThoughts: ${errors > 0 ? 45 : 40}, // Ajustar dinamicamente se erros
  nextThoughtNeeded: true
})
```

#### Thought 9: Snapshot - Estrutura COMPLETA

```javascript
// EXECUTAR MCP
mcp__chrome-devtools__take_snapshot({
  filePath: `SNAPSHOT_CHROME_${ticker}_${date}.txt`
})

// ANALISAR TODOS OS ELEMENTOS
mcp__sequential-thinking__sequentialthinking({
  thought: `
Snapshot capturado. Analisando estrutura COMPLETA da página.

Total de Elementos: [X]

Análise SISTEMÁTICA:

1. CABEÇALHO (Ticker e Nome):
   - uid=[X]: heading "[TICKER]" level="1"
     Status: ${found ? '✅ Correto' : '❌ Faltando/Incorreto'}
   - uid=[X]: StaticText "[Nome]"
     Status: ${found ? '✅ Correto' : '❌ Faltando'}

2. DADOS BÁSICOS (Preço, Variação):
   - uid=[X]: StaticText "R$ X,XX"
     Status: ${found ? '✅ Preço carregado' : '❌ Não carregou'}
   - uid=[X]: StaticText "+X.XX%"
     Status: ${found ? '✅ Variação carregada' : '❌ Não carregou'}

3. CARD DE INDICADORES:
   - uid=[X]: heading "Indicadores Técnicos"
     Status: ${found ? '✅ Card presente' : '❌ Card faltando'}
   - Checkboxes (SMA20, SMA50, RSI, MACD):
     ${checkboxes.map(cb => `uid=[X]: checkbox "${cb}" ${checked ? 'checked' : ''} → ${found ? '✅' : '❌'}`).join('\n')}

4. GRÁFICOS (CRÍTICO):
   - uid=[X]: link "Charting by TradingView" (Candlestick)
     Status: ${found ? '✅ Gráfico 1 OK' : '❌ Gráfico 1 FALTANDO'}
   - uid=[X]: link "Charting by TradingView" (RSI)
     Status: ${found ? '✅ Gráfico 2 OK' : '❌ Gráfico 2 FALTANDO'}
   - uid=[X]: link "Charting by TradingView" (MACD)
     Status: ${found ? '✅ Gráfico 3 OK' : '❌ Gráfico 3 FALTANDO'}

   Total Gráficos: [X/3]

5. RESUMO DE INDICADORES:
   ${indicators.map(ind => `
   - ${ind.label}: uid=[X] → Valor: "${ind.value}"
     Status: ${ind.value !== 'N/A' ? '✅ Valor válido' : '❌ Valor inválido (N/A)'}
   `).join('\n')}

CONSOLIDAÇÃO SNAPSHOT:
- Elementos presentes: [X/Y] (${percentage}%)
- Gráficos carregados: [X/3]
- Indicadores válidos: [X/Z]
- Estrutura completa: ${complete ? '✅ SIM' : '❌ NÃO (faltam elementos)'}

Decisão: ${complete ? 'Snapshot = 100%' : 'Snapshot = PARCIAL (documentar faltantes)'}
Próximo Thought: Screenshot para evidência visual.
`,
  thoughtNumber: 9,
  totalThoughts: 40,
  nextThoughtNeeded: true
})
```

---

**CONTINUA** com Thoughts 10-40 seguindo mesma profundidade...

---

## 📊 CHECKLIST ZERO TOLERANCE

**OBRIGATÓRIO** executar ANTES de aprovar:

```bash
# 1. TypeScript (ZERO ERROS)
cd frontend && npx tsc --noEmit
# Esperado: (sem output = 0 erros)
# Se erros: REPROVAR, corrigir OBRIGATÓRIO

# 2. Build (SUCCESS)
cd frontend && npm run build
# Esperado: "Compiled successfully"
# Se falhar: REPROVAR, corrigir OBRIGATÓRIO

# 3. Git Status
git status
# Esperado: working tree clean ou apenas arquivos intencionais

# 4. Docker Services
docker-compose ps
# Esperado: ALL healthy

# 5. Console Frontend (manual)
# Abrir http://localhost:3100/[URL]
# F12 → Console → Verificar 0 erros
```

---

## 📝 TEMPLATE DE DOCUMENTAÇÃO FINAL

**Criar arquivo:** `VALIDACAO_[TICKER/PAGE]_[DATA].md`

```markdown
# ✅ VALIDAÇÃO: [PÁGINA] - [DATA]

**URL:** [URL]
**Tipo:** [assets/dashboard/etc]
**Método:** Sequential Thinking Ultra-Profundo
**Thoughts Totais:** [X]

## Resultado Final

**Aprovação:** [X]% (>= 80% = APROVADO)

**Status:** ✅ APROVADO | ⚠️ PARCIAL | ❌ REPROVADO

## Evidências

### Chrome DevTools
- Console: [X] erros
- Snapshot: [elementos/total]
- Gráficos: [X/3]
- Screenshot: `[PATH]`

### Playwright
- Consistência: ✅ | ❌
- Console: [X] erros
- Screenshot: `[PATH]`

### A11y
- WCAG 2.1 AA: PASSED | FAILED
- Violações: [X] critical, [Y] serious

### Agentes Especializados
${agents.map(a => `- ${a.name}: ${a.result}`).join('\n')}

## Sequential Thinking Summary

[Resumo dos 40 thoughts]

## Decisão Final

[Justificativa completa]

## Próximas Ações

[Se reprovado: lista de correções]
[Se aprovado: melhorias futuras]

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-16
**Versão:** FINAL 5.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
