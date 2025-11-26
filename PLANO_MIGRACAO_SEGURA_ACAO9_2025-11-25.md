# PLANO DE MIGRAÇÃO SEGURA - AÇÃO 9

**Data:** 2025-11-25
**Status:** ✅ ANÁLISE DE RISCOS COMPLETA
**Objetivo:** Garantir ZERO quebras durante migração de 317 arquivos .md

---

## 1. RESUMO DA ANÁLISE DE RISCOS

### Arquivos que Referenciam Documentação (.md)

| Categoria | Arquivos | Risco | Ação |
|-----------|----------|-------|------|
| **README.md** | 1 | 🔴 ALTO | Atualizar links |
| **CLAUDE.md** | 1 | 🔴 ALTO | Atualizar 30+ referências |
| **GEMINI.md** | 1 | 🔴 ALTO | Auto-sync via CI/CD |
| **INDEX.md** | 1 | 🔴 ALTO | Atualizar 60+ links |
| **.github/workflows/sync-docs.yml** | 1 | 🔴 ALTO | Atualizar paths |
| **.gemini/schemas/project-context.json** | 1 | 🟡 MÉDIO | Verificar schema |
| **.claude/agents/README.md** | 1 | 🟡 MÉDIO | Atualizar referências |
| **Outros .md (300+)** | 300+ | 🟢 BAIXO | Bulk update |
| **Source code (.ts/.js/.py)** | 0 | ✅ NENHUM | Nada a fazer |
| **Docker files** | 0 | ✅ NENHUM | Nada a fazer |
| **package.json** | 0 | ✅ NENHUM | Nada a fazer |
| **Shell scripts** | 0 | ✅ NENHUM | Nada a fazer |

### Descobertas Críticas

1. **NENHUM código fonte** referencia arquivos .md diretamente
2. **CI/CD** apenas monitora CLAUDE.md e GEMINI.md
3. **317 arquivos** no root (não 240 como estimado)
4. **Pasta docs/ já existe** com 1 arquivo (USER_GUIDE.md)

---

## 2. ESTRATÉGIA DE SEGURANÇA: "COMMIT-POR-COMMIT"

Em vez de fazer todas as mudanças de uma vez, usaremos **commits atômicos** que podem ser revertidos individualmente.

### Sequência Segura de Commits

```
Commit 1: Backup + Setup estrutura
    └── Tag: backup-before-migration-v1
    └── Criar estrutura docs/01-09/
    └── NÃO mover arquivos ainda

Commit 2: Mover BUG_*.md (25 arquivos)
    └── Testar: links ainda funcionam no root
    └── Se falhar: git revert HEAD

Commit 3: Mover FASE_*.md (30 arquivos)
    └── Testar: ROADMAP.md links
    └── Se falhar: git revert HEAD

Commit 4: Mover VALIDACAO_*.md (35 arquivos)
    └── Testar: INDEX.md links
    └── Se falhar: git revert HEAD

Commit 5: Mover restante (227 arquivos)
    └── Testar: todos os links
    └── Se falhar: git revert HEAD

Commit 6: Atualizar links em arquivos críticos
    └── README.md, CLAUDE.md, INDEX.md
    └── Se falhar: git revert HEAD

Commit 7: Atualizar CI/CD
    └── .github/workflows/sync-docs.yml
    └── Se falhar: git revert HEAD
```

---

## 3. PLANO DE ROLLBACK

### Nível 1: Rollback de Commit Individual
```bash
# Se um commit específico quebrar algo
git revert HEAD --no-edit
```

### Nível 2: Rollback Completo para Backup
```bash
# Voltar ao estado antes da migração
git reset --hard backup-before-migration-v1
```

### Nível 3: Recuperação de Arquivos Específicos
```bash
# Restaurar arquivo específico do backup
git checkout backup-before-migration-v1 -- path/to/file.md
```

---

## 4. DECISÃO: ABORDAGEM CONSERVADORA

### ⚠️ RISCO IDENTIFICADO

Mover 317 arquivos pode quebrar:
- 120+ links internos entre documentos
- Referências no INDEX.md (60+ links)
- Referências no CLAUDE.md (30+ links)
- CI/CD workflow (sync CLAUDE.md ↔ GEMINI.md)

### ✅ ABORDAGEM RECOMENDADA: INCREMENTAL

Em vez de reorganizar tudo de uma vez, recomendo:

**FASE 1 (IMEDIATA - Baixo Risco):**
- Criar arquivos de convenção (NAMING_CONVENTIONS.md, CONTROLLED_VOCABULARY.md)
- NÃO mover arquivos existentes
- Aplicar convenções apenas para NOVOS arquivos

**FASE 2 (FUTURA - Médio Risco):**
- Criar estrutura docs/ vazia
- Migrar arquivos gradualmente (10-20 por sessão)
- Atualizar links conforme migra

**FASE 3 (OPCIONAL - Alto Risco):**
- Reorganização completa
- Requer 4-6 horas dedicadas
- Melhor fazer em branch separada

---

## 5. PLANO DE EXECUÇÃO SEGURA (FASE 1 APENAS)

### Passo 1: Criar Backup
```bash
git tag backup-before-migration-v1
git stash push -m "backup before ACAO9"
```

### Passo 2: Criar Arquivos de Convenção (SEM MOVER NADA)
```bash
# Criar NAMING_CONVENTIONS.md no root
# Criar CONTROLLED_VOCABULARY.md no root
# Criar INDEX.md atualizado (se não existir)
```

### Passo 3: Commit Seguro
```bash
git add NAMING_CONVENTIONS.md CONTROLLED_VOCABULARY.md
git commit -m "docs: add naming conventions and controlled vocabulary standards"
```

### Passo 4: Validação
```bash
# Verificar que nada quebrou
npm run build --prefix frontend
npm run build --prefix backend
```

---

## 6. ARQUIVOS QUE NÃO DEVEM SER MOVIDOS (NUNCA)

| Arquivo | Motivo |
|---------|--------|
| `README.md` | Entry point do repositório |
| `CLAUDE.md` | Contexto AI crítico |
| `GEMINI.md` | Sync com CLAUDE.md via CI/CD |
| `ARCHITECTURE.md` | Referência arquitetural |
| `ROADMAP.md` | Tracking de fases |
| `CONTRIBUTING.md` | Guia de contribuição |
| `TROUBLESHOOTING.md` | Suporte técnico |
| `DATABASE_SCHEMA.md` | Schema do banco |
| `INSTALL.md` | Instalação |
| `.claude/agents/*.md` | Sub-agents (path fixo) |
| `.gemini/**/*.md` | Contexto Gemini (path fixo) |

---

## 7. VALIDAÇÃO PÓS-MIGRAÇÃO (CHECKLIST)

### Antes de Cada Commit
- [ ] `npm run build --prefix frontend` passa
- [ ] `npm run build --prefix backend` passa
- [ ] `npx tsc --noEmit` (frontend) passa
- [ ] `npx tsc --noEmit` (backend) passa

### Após Migração Completa
- [ ] README.md links funcionam
- [ ] CLAUDE.md links funcionam
- [ ] INDEX.md links funcionam
- [ ] CI/CD workflow funciona (CLAUDE.md → GEMINI.md)
- [ ] Nenhum link quebrado (`npx markdown-link-check`)

---

## 8. RECOMENDAÇÃO FINAL

### 🎯 OPÇÃO A: CONSERVADORA (RECOMENDADA)

**Fazer agora:**
1. ✅ Criar NAMING_CONVENTIONS.md
2. ✅ Criar CONTROLLED_VOCABULARY.md
3. ✅ Aplicar convenções para novos arquivos apenas
4. ❌ NÃO mover arquivos existentes

**Fazer depois (sessão dedicada):**
- Migração completa em branch separada
- 4-6 horas dedicadas
- Validação extensiva

### 🎯 OPÇÃO B: COMPLETA (ALTO RISCO)

**Se quiser fazer agora:**
1. Criar branch: `git checkout -b feature/docs-reorganization`
2. Executar migração completa
3. Testar extensivamente
4. Merge apenas se tudo funcionar

---

## 9. CONCLUSÃO

| Aspecto | Decisão |
|---------|---------|
| **Mover arquivos agora?** | ❌ NÃO RECOMENDADO |
| **Criar convenções agora?** | ✅ SIM (baixo risco) |
| **Migração futura?** | ✅ Em branch separada |
| **Risco de quebra atual** | 🟢 ZERO (se seguir Opção A) |

---

**Aguardando decisão do usuário:**
- **OPÇÃO A:** Criar apenas convenções (5 min, risco zero)
- **OPÇÃO B:** Migração completa em branch (4-6h, risco médio)
