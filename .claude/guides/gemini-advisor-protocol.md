# Gemini 3 Pro - Protocolo de Segunda Opinião (Advisor)

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Integração Claude Code + Gemini 3 Pro como advisor

---

## Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODELO DE DECISÃO HÍBRIDO                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐         ┌─────────────────┐                  │
│   │  CLAUDE CODE    │ ──────► │  GEMINI 3 PRO   │                  │
│   │  (DECISOR)      │ consulta│  (ADVISOR)      │                  │
│   │                 │ ◄────── │                 │                  │
│   │  - Implementa   │ opinião │  - Analisa      │                  │
│   │  - Decide       │         │  - Sugere       │                  │
│   │  - Executa      │         │  - NÃO executa  │                  │
│   └─────────────────┘         └─────────────────┘                  │
│          │                                                          │
│          ▼                                                          │
│   ┌─────────────────┐                                              │
│   │ DECISÃO FINAL   │ ◄── Claude SEMPRE tem autoridade final       │
│   │ (CLAUDE CODE)   │                                              │
│   └─────────────────┘                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Princípio Fundamental

**Papéis Claramente Definidos:**

| Modelo | Papel | Responsabilidades |
|--------|-------|------------------|
| **Claude Code** | DECISOR | Implementar, Decidir, Executar, Validar |
| **Gemini 3 Pro** | ADVISOR | Analisar, Sugerir, Opinar |

**IMPORTANTE:** Claude Code SEMPRE tem autoridade final. Gemini NÃO executa código.

---

## MCP Instalado

### Configuração

**Server:** `gemini-advisor` via `gemini-mcp-tool-windows-fixed`
**Status:** Ativo e conectado
**Modelo:** `gemini-3-pro-preview` (usar com parâmetro model)
**Modelos disponíveis:**
- `gemini-3-pro-preview` (recomendado - melhor performance)
- `gemini-2.5-pro`
- `gemini-2.5-flash`

**Context window:** 1M tokens (5x maior que Claude)

---

## Quando Claude DEVE Consultar Gemini

### Matriz de Prioridades

| Cenário | Prioridade | Justificativa |
|---------|------------|---------------|
| **Dados financeiros críticos** | **ALTA** | Claude mais preciso (12% vs 88% hallucination), mas segunda opinião reduz risco |
| **Análise de codebase grande (>50 arquivos)** | **ALTA** | Gemini tem 1M tokens vs 200K Claude - pode processar contexto maior |
| **Decisões arquiteturais** | **MÉDIA** | Perspectiva diferente pode revelar blind spots |
| **Refatoração > 5 arquivos** | **MÉDIA** | Validar impacto em arquivos relacionados |
| **Escolha entre alternativas** | **MÉDIA** | Debate de pros/cons ajuda decisão |
| **Debugging complexo** | **BAIXA** | Claude é superior (80.9% vs 76.2% SWE-bench) |
| **Tarefas < 50 linhas** | **NÃO CONSULTAR** | Overhead não compensa |

### Exemplos de Quando Consultar

**✅ CONSULTAR Gemini:**

```
Situação: Implementando sistema de cross-validation de 6 fontes de dados financeiros.
Decisão: Usar média ou mediana para consolidação?

Justificativa: Decisão arquitetural com múltiplas alternativas válidas.
Gemini pode analisar trade-offs que Claude pode não considerar.
```

```
Situação: Refatorando 12 scrapers de Selenium para Playwright.
Decisão: Qual padrão de error handling usar?

Justificativa: Mudança arquitetural que afeta múltiplos arquivos.
Gemini pode sugerir patterns que Claude desconhece.
```

**❌ NÃO CONSULTAR Gemini:**

```
Situação: Bug fix - função retorna undefined ao invés de null.
Decisão: Corrigir return value.

Justificativa: Bug simples, Claude é superior em debugging.
```

```
Situação: Adicionar console.log para debug.
Decisão: Onde adicionar log.

Justificativa: Tarefa trivial, overhead não justifica consulta.
```

---

## Quando Claude NÃO DEVE Consultar Gemini

**Situações onde Claude é superior sozinho:**

- Bug fixes simples (Claude é melhor em debugging)
- Tarefas triviais (< 50 linhas de código)
- Quando já tem certeza da solução
- Prototipagem rápida (adiciona latência desnecessária)
- Código que precisa de precisão absoluta (Claude tem menor taxa de alucinação)

---

## Limitações Conhecidas do Gemini 3 Pro (CRÍTICO)

### Tabela de Limitações

**Claude DEVE considerar estas limitações ao interpretar respostas do Gemini:**

| Limitação | Impacto | Como Claude Deve Tratar |
|-----------|---------|-------------------------|
| **Taxa de alucinação 88%** | Pode afirmar coisas incorretas com confiança | Verificar SEMPRE com código fonte |
| **Afirma "corrigido" quando não está** | Falso positivo em validações | Testar manualmente após sugestão |
| **Over-optimization** | Muda código que foi especificado corretamente | Ignorar se contradiz requisitos |
| **Infinite loops em edição** | Pode travar em old_string not found | Não usar para edição direta de código |
| **Instabilidade em picos** | Provider overload errors | Retry ou prosseguir sem consulta |
| **Hallucina estruturas cross-language** | Inventa models Java em projeto Python | Validar linguagem correta |

### Fontes

- [Gemini 3 Pro Hallucination Rate - The Decoder](https://the-decoder.com/gemini-3-pro-tops-new-ai-reliability-benchmark-but-hallucination-rates-remain-high/)
- [GitHub Issues - google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli/issues)

---

## Protocolo de Consulta Inteligente

### Workflow Recomendado

**Sequential Thinking + Gemini (8 passos):**

```
1. Claude inicia Sequential Thinking
   ↓
2. Durante análise, Claude identifica necessidade de segunda opinião
   ↓
3. Claude formula pergunta ESPECÍFICA e CONTEXTUALIZADA para Gemini
   ↓
4. Gemini retorna análise/sugestão
   ↓
5. Claude AVALIA criticamente a resposta considerando limitações
   ↓
6. Claude DECIDE (aceita, rejeita ou adapta sugestão)
   ↓
7. Claude IMPLEMENTA a decisão final
   ↓
8. Claude valida com Zero Tolerance (tsc, build, lint)
```

**IMPORTANTE:** Claude SEMPRE decide e implementa. Gemini NUNCA executa.

---

## Como Formular Consultas ao Gemini

### Template de Consulta Efetiva

```markdown
CONTEXTO:
- Projeto: [descrever brevemente]
- Stack: [tecnologias]
- Arquivos envolvidos: [listar]

SITUAÇÃO:
[Descrever o problema/decisão de forma clara]

CÓDIGO RELEVANTE:
[Incluir trechos específicos - Gemini tem 1M tokens]

PERGUNTA ESPECÍFICA:
[Uma pergunta clara e objetiva]

RESTRIÇÕES:
[Listar restrições que Gemini deve respeitar]
```

### Exemplo de Consulta Bem Formulada

```markdown
CONTEXTO:
- Projeto: B3 AI Analysis Platform
- Stack: NestJS + TypeORM + PostgreSQL
- Arquivo: backend/src/scrapers/scrapers.service.ts

SITUAÇÃO:
Estou implementando cross-validation de dados financeiros.
Preciso decidir entre usar média ou mediana para consolidar valores de 6 fontes.

CÓDIGO RELEVANTE:
[código do método atual]

PERGUNTA ESPECÍFICA:
Qual abordagem é mais robusta para dados financeiros B3:
1. Média com outlier detection (threshold 10%)
2. Mediana (naturalmente resistente a outliers)

RESTRIÇÕES:
- Deve manter precisão Decimal (não Float)
- Mínimo 3 fontes concordando
- Timezone America/Sao_Paulo
```

### Características de uma Boa Consulta

| Elemento | ✅ BOM | ❌ RUIM |
|----------|--------|---------|
| **Contexto** | "Projeto B3, NestJS, scraping financeiro" | "Um projeto web" |
| **Situação** | "Cross-validation de 6 fontes, escolher média vs mediana" | "Como fazer isso?" |
| **Código** | Trechos específicos (20-50 linhas) | Arquivo inteiro ou nada |
| **Pergunta** | "Qual abordagem é mais robusta?" | "O que você acha?" |
| **Restrições** | Lista clara (Decimal, timezone, fontes) | Sem restrições |

---

## Interpretando Respostas do Gemini

### Filtro Crítico (5 passos)

**Claude DEVE aplicar este filtro:**

1. **Verificar facticidade:** Gemini afirmou algo? Validar no código fonte
2. **Checar consistência:** Sugestão contradiz regras do projeto? Ignorar
3. **Avaliar completude:** Resposta considera todas restrições? Complementar se necessário
4. **Testar viabilidade:** Sugestão é implementável? Simular antes de aplicar
5. **Documentar decisão:** Registrar por que aceitou/rejeitou sugestão

### Padrão de Documentação

**Template para documentar consultas:**

```markdown
## Consulta Gemini: [título]
**Data:** YYYY-MM-DD
**Contexto:** [breve descrição]

### Pergunta
[pergunta formulada]

### Resposta Gemini
[resumo da resposta]

### Avaliação Claude
- **Pontos aceitos:** [lista]
- **Pontos rejeitados:** [lista com justificativa]
- **Adaptações:** [modificações feitas]

### Decisão Final
[o que foi implementado e por quê]
```

### Exemplo de Avaliação

```markdown
## Consulta Gemini: Cross-Validation Strategy
**Data:** 2025-12-21
**Contexto:** Decisão entre média vs mediana para consolidar dados financeiros

### Pergunta
Qual abordagem é mais robusta para dados financeiros B3:
1. Média com outlier detection (threshold 10%)
2. Mediana (naturalmente resistente a outliers)

### Resposta Gemini
Gemini sugeriu usar mediana porque:
1. Naturalmente resistente a outliers
2. Não requer threshold configurável
3. Mais simples de implementar

Sugeriu também adicionar confidence score baseado em concordância.

### Avaliação Claude
- **Pontos aceitos:**
  - ✅ Mediana é resistente a outliers (correto)
  - ✅ Confidence score é boa ideia

- **Pontos rejeitados:**
  - ❌ "Mais simples" não é critério em projeto de alta qualidade

- **Adaptações:**
  - Implementar mediana + confidence score
  - Manter threshold 10% para validação adicional

### Decisão Final
Implementado mediana com confidence score calculado por % de fontes
concordando dentro de threshold 10%. Melhor dos dois mundos.
```

---

## Integração com MCPs Existentes

### Combinação Recomendada

| Fase | MCPs a Usar | Ordem |
|------|-------------|-------|
| **Ultra-Thinking** | Sequential Thinking + Gemini (se complexo) | 1. ST analisa → 2. Gemini opina → 3. ST decide |
| **Análise de Contexto** | Filesystem + Gemini | 1. FS lê arquivos → 2. Gemini analisa contexto grande |
| **Code Review** | Gemini + Sequential Thinking | 1. Gemini revisa → 2. ST avalia críticas |
| **Validação** | Shell + Chrome DevTools | **SEM Gemini** (validação objetiva) |
| **Implementação** | Filesystem + Shell | **SEM Gemini** (Claude implementa sozinho) |

### Quando NÃO Usar Gemini com Outros MCPs

**❌ NÃO combinar Gemini com:**

- **Playwright/Chrome DevTools:** Validação deve ser objetiva, não opinativa
- **Shell/Bash:** Execução de comandos não requer segunda opinião
- **Edit/Write:** Gemini não deve editar código diretamente (taxa de alucinação 88%)

---

## Anti-Patterns (NUNCA FAZER)

### Tabela de Anti-Patterns

| Anti-Pattern | Por que é Ruim | O que Fazer |
|--------------|----------------|-------------|
| **Delegar decisão ao Gemini** | Claude perde controle, Gemini alucina 88% | Claude sempre decide |
| **Aceitar sugestão sem validar** | Gemini pode estar errado | Verificar no código |
| **Consultar para tarefas triviais** | Overhead desnecessário | Resolver diretamente |
| **Pedir para Gemini implementar** | Gemini não executa, só sugere | Claude implementa |
| **Ignorar limitações documentadas** | Bugs e inconsistências | Consultar tabela de limitações |
| **Consultar sem contexto** | Resposta genérica inútil | Usar template de consulta |

### Exemplos de Anti-Patterns

**❌ ERRADO:**

```
Claude: "Gemini, implemente o sistema de cross-validation."
Gemini: [Sugere código]
Claude: [Aceita e copia código sem validar]
```

**✅ CORRETO:**

```
Claude: "Gemini, qual abordagem é mais robusta: média ou mediana?"
Gemini: [Analisa pros/cons]
Claude: [Avalia resposta criticamente]
Claude: [Decide por mediana com validação adicional]
Claude: [Implementa solução]
Claude: [Valida com tsc + build + lint]
```

---

## Métricas de Uso

### O que Claude Deve Rastrear

**Internamente (não expor ao usuário):**

- Consultas ao Gemini por sessão
- Taxa de aceitação de sugestões
- Sugestões rejeitadas e motivo
- Tempo economizado vs overhead

### Meta de Performance

| Métrica | Target |
|---------|--------|
| % de consultas em tarefas complexas | 20-30% |
| Taxa de utilidade (sugestões úteis) | > 70% |
| Taxa de rejeição por alucinação | < 30% |
| Overhead médio por consulta | < 5s |

**Exemplo de Tracking:**

```
Sessão 2025-12-21:
- Tarefas complexas: 10
- Consultas Gemini: 3 (30%)
- Sugestões aceitas: 2 (67%)
- Sugestões rejeitadas: 1 (alucinação - sugeriu Float ao invés de Decimal)
- Overhead médio: 3.2s
```

---

## Casos de Uso Reais

### Caso 1: Decisão Arquitetural

**Situação:** Escolher estratégia de cache (Redis vs in-memory)

**Consulta a Gemini:**
```markdown
Projeto B3 com NestJS + Redis disponível.
Escolher: Redis cache vs in-memory cache?
Restrições: <100ms latência, 861 assets, dados mudam diariamente.
```

**Resposta Gemini:** Redis porque dados compartilhados entre instâncias.

**Avaliação Claude:**
- ✅ Aceito: Redis permite horizontal scaling
- ❌ Rejeitado: "Dados mudam diariamente" não justifica Redis sozinho
- Decisão: Redis com TTL de 24h

### Caso 2: Refatoração de Scrapers

**Situação:** Migração Selenium → Playwright

**Consulta a Gemini:**
```markdown
24 scrapers Selenium, migrar para Playwright.
Abordagem: Big Bang vs Gradual?
Restrições: Scrapers em produção, não pode quebrar.
```

**Resposta Gemini:** Gradual com feature flags e testes A/B.

**Avaliação Claude:**
- ✅ Aceito: Gradual reduz risco
- ❌ Rejeitado: Feature flags é over-engineering
- Decisão: Gradual com validação manual de cada scraper

### Caso 3: Alucinação Detectada

**Situação:** Cross-validation de dados financeiros

**Consulta a Gemini:**
```markdown
Consolidar preços de 6 fontes.
Como lidar com outliers?
```

**Resposta Gemini:** "Use Float com precisão de 2 casas decimais."

**Avaliação Claude:**
- ❌ REJEITADO TOTALMENTE: Violação de regra crítica (Decimal obrigatório)
- Gemini alucinou, ignorou restrição fundamental do projeto
- Decisão: Usar mediana com Decimal (precisão completa)

---

## Troubleshooting

### Gemini Retorna Erro "Provider Overload"

**Causa:** Picos de uso do Gemini API

**Solução:**
```typescript
try {
  const geminiResponse = await queryGemini(prompt);
} catch (error) {
  if (error.code === 'PROVIDER_OVERLOAD') {
    logger.warn('Gemini overload, proceeding without consultation');
    // Claude decide sozinho
    return claudeDecision();
  }
  throw error;
}
```

### Resposta de Gemini Contradiz Regras do Projeto

**Causa:** Gemini não conhece regras específicas do projeto

**Solução:**
1. Incluir regras críticas no contexto da consulta
2. Validar resposta contra `.claude/guides/*.md`
3. Rejeitar sugestão se contradiz regras documentadas

---

## Best Practices

### ✅ DO

1. **Sempre validar respostas de Gemini contra código fonte**
2. **Incluir contexto completo na consulta**
3. **Documentar decisões (aceitas e rejeitadas)**
4. **Usar template de consulta estruturado**
5. **Consultar apenas para tarefas complexas (>50 linhas)**
6. **Considerar limitações documentadas**

### ❌ DON'T

1. **Aceitar sugestões sem validar**
2. **Delegar decisão final ao Gemini**
3. **Consultar para tarefas triviais**
4. **Pedir para Gemini editar código diretamente**
5. **Ignorar taxa de alucinação 88%**
6. **Usar Gemini para validação objetiva**

---

## Fontes

- [Gemini 3 Pro Hallucination Rate - The Decoder](https://the-decoder.com/gemini-3-pro-tops-new-ai-reliability-benchmark-but-hallucination-rates-remain-high/)
- [GitHub Issues - google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli/issues)
- [SWE-bench Scores - Papers with Code](https://paperswithcode.com/sota/code-generation-on-swe-bench)
