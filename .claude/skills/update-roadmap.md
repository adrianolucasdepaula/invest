---
description: Atualiza ROADMAP.md com fase concluída seguindo formato padrão
---

# Skill: update-roadmap

**Descrição:** Atualiza ROADMAP.md com fase concluída no formato padrão

**Frequência de Uso:** 1-3x por dia (conclusão de fases)

**Tempo Economizado:** ~10 min → ~2 min (**80% redução**)

---

## Objetivo

Atualizar o **ROADMAP.md** com informações da fase concluída:
- Formato padronizado
- Commit hash incluído
- Arquivos modificados contados
- CHANGELOG.md atualizado simultaneamente

---

## Etapas de Execução

### 1. Coletar Informações

**Verificar fase atual:**
```bash
# Ver último commit (hash e mensagem)
git log -1 --oneline

# Contar arquivos modificados na fase
git diff --stat HEAD~X  # X = número de commits da fase
```

**Verificar ROADMAP atual:**
```bash
# Ver última fase documentada
head -100 ROADMAP.md
```

---

### 2. Formato da Entrada

**Template ROADMAP.md:**

```markdown
### FASE XX: Nome da Fase (YYYY-MM-DD) ✅

**Objetivo:** Descrição clara do objetivo em uma linha

**Implementado:**
- Item 1 implementado
- Item 2 implementado
- Item 3 implementado

**Arquivos:** X arquivos modificados/criados

**Commit:** `abc1234` - feat(scope): mensagem do commit
```

---

### 3. Atualizar ROADMAP.md

**Localizar seção de inserção:**
- Após "## Histórico de Fases" ou similar
- Antes das fases anteriores (ordem cronológica inversa)

**Inserir nova entrada:**

```markdown
### FASE 75: Dashboard de Discrepâncias (2025-12-05) ✅

**Objetivo:** Criar página para visualizar e gerenciar discrepâncias de dados

**Implementado:**
- Página /dashboard/discrepancies com DataTable
- API endpoint /api/v1/scrapers/discrepancies
- Filtros por ticker, severidade e status
- Integração com cross-validation existente

**Arquivos:** 8 arquivos modificados/criados

**Commit:** `0f085e5` - feat(frontend): add discrepancies dashboard
```

---

### 4. Atualizar CHANGELOG.md

**Template CHANGELOG:**

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Nova funcionalidade X (FASE XX)

### Changed
- Mudança Y para melhorar Z

### Fixed
- Bug fix W
```

**Inserir após última versão:**

```markdown
## [Unreleased]

### Added
- Dashboard de discrepâncias com filtros avançados (FASE 75)
```

---

### 5. Verificar Consistência

```bash
# Verificar que ROADMAP não tem conflitos
git diff ROADMAP.md

# Verificar que CHANGELOG está correto
git diff CHANGELOG.md
```

---

## Regras Críticas

### Ordem Cronológica

```markdown
// ✅ CORRETO - Mais recente primeiro
### FASE 75: ... (2025-12-05) ✅
### FASE 74: ... (2025-12-04) ✅
### FASE 73: ... (2025-12-03) ✅

// ❌ ERRADO - Ordem aleatória
### FASE 73: ... (2025-12-03) ✅
### FASE 75: ... (2025-12-05) ✅
### FASE 74: ... (2025-12-04) ✅
```

### Formato de Data

```markdown
// ✅ CORRETO
(2025-12-05)

// ❌ ERRADO
(05/12/2025)
(Dec 5, 2025)
```

### Commit Hash

```markdown
// ✅ CORRETO - 7 caracteres
**Commit:** `0f085e5` - feat(frontend): ...

// ❌ ERRADO - Hash completo
**Commit:** `0f085e5abc123def456...` - feat(frontend): ...
```

### Emoji de Status

```markdown
// ✅ Fase completa
### FASE XX: Nome (YYYY-MM-DD) ✅

// ⏳ Fase em progresso
### FASE XX: Nome (YYYY-MM-DD) ⏳

// ❌ Fase cancelada
### FASE XX: Nome (YYYY-MM-DD) ❌
```

---

## Checklist de Validação

- [ ] Número da fase correto (sequencial)
- [ ] Data no formato YYYY-MM-DD
- [ ] Objetivo claro em uma linha
- [ ] Itens implementados listados
- [ ] Contagem de arquivos precisa
- [ ] Commit hash correto (7 chars)
- [ ] Mensagem de commit incluída
- [ ] CHANGELOG.md atualizado
- [ ] Ordem cronológica mantida

---

## Resumo de Saída

### ✅ Se Atualizado com Sucesso

```
✅ ROADMAP ATUALIZADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Fase:     FASE 75
📝 Nome:     Dashboard de Discrepâncias
📅 Data:     2025-12-05
📁 Arquivos: 8 modificados

✅ ROADMAP.md:   Atualizado
✅ CHANGELOG.md: Atualizado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Documentação pronta para commit.
```

---

## Invocação

**Via Comando:**
```
Execute skill update-roadmap para FASE XX: Nome da Fase
```

**Exemplo:**
```
Execute skill update-roadmap para FASE 75: Dashboard de Discrepâncias
```

---

## Referências

- **ROADMAP.md** - Histórico completo de fases
- **CHANGELOG.md** - Mudanças versionadas
- **documentation-expert** - Sub-agent especializado

---

**Versão:** 1.0.0
**Criado:** 2025-12-05
**Mantenedor:** Claude Code
**Última Atualização:** 2025-12-05
