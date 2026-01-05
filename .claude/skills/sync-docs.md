---
description: Sincroniza CLAUDE.md ↔ GEMINI.md (regra de sincronização 100%)
---

# Skill: sync-docs

**Descrição:** Garante que CLAUDE.md e GEMINI.md estejam 100% idênticos

**Frequência de Uso:** 🔥 2-3x por semana (a cada mudança em CLAUDE.md)

**Tempo Economizado:** ~2 min → ~5 seg (**96% redução**)

---

## Objetivo

Manter **CLAUDE.md** e **GEMINI.md** **100% sincronizados**, conforme **regra explícita** do projeto.

**Regra Crítica (CLAUDE.md):**
> **IMPORTANTE:** CLAUDE.md e GEMINI.md devem ter conteúdo 100% idêntico (regra explícita).

---

## Workflow de Sincronização

### Etapa 1: Ler CLAUDE.md

```
Read: c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\CLAUDE.md
```

**Ação:** Carregar conteúdo completo em memória

---

### Etapa 2: Ler GEMINI.md

```
Read: c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\GEMINI.md
```

**Ação:** Carregar conteúdo completo em memória

---

### Etapa 3: Comparar Conteúdos

**Algoritmo:**
```python
if hash(CLAUDE.md) == hash(GEMINI.md):
    print("✅ Já sincronizados (100% idênticos)")
    return
else:
    print("⚠️ Divergência detectada. Sincronizando...")
    copy(CLAUDE.md → GEMINI.md)
```

**Critério:** Comparação **byte-a-byte** (100% idêntico)

---

### Etapa 4: Copiar CLAUDE.md → GEMINI.md (Se Divergir)

```
Write: GEMINI.md
Content: [conteúdo exato de CLAUDE.md]
```

**IMPORTANTE:**
- ✅ Copiar **linha por linha** (preservar formatação)
- ✅ Preservar **quebras de linha** exatas
- ✅ Preservar **encoding** (UTF-8)
- ❌ **NUNCA modificar** conteúdo durante cópia

---

### Etapa 5: Confirmar Sincronização

```bash
# Verificar que files são idênticos
diff CLAUDE.md GEMINI.md
```

**Resultado Esperado:** Nenhuma diferença (silêncio)

**Se houver diferença:** Repetir Etapa 4

---

## Resumo de Saída

### ✅ Se Já Sincronizados

```
✅ SINCRONIZAÇÃO CLAUDE.md ↔ GEMINI.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 CLAUDE.md: 1,926 linhas
📄 GEMINI.md: 1,926 linhas

🔍 Comparação: 100% idênticos ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Arquivos já sincronizados. Nenhuma ação necessária.
```

---

### ⚠️ Se Divergirem → Sincronizados

```
⚠️ SINCRONIZAÇÃO CLAUDE.md ↔ GEMINI.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 CLAUDE.md: 1,926 linhas (modificado 2025-12-05 14:30)
📄 GEMINI.md: 1,920 linhas (desatualizado)

🔍 Divergência detectada:
   - 6 linhas adicionadas em CLAUDE.md
   - Última edição: Seção "Gemini 3 Pro - Protocolo"

📋 Ação: Copiando CLAUDE.md → GEMINI.md...

✅ GEMINI.md atualizado (1,926 linhas)

🔍 Verificação: diff CLAUDE.md GEMINI.md
   → Nenhuma diferença ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 GEMINI.md sincronizado com sucesso (100% idêntico).
```

---

## Quando Usar

### ✅ Obrigatório Usar

- **Após QUALQUER edição em CLAUDE.md** (manual ou automática)
- **Antes de commitar** (garantir sincronização)
- **Após merge de branch** (se CLAUDE.md foi modificado)
- **Quando em dúvida** (sempre seguro verificar)

### ⏩ Opcional (Já Automático)

- **Via Hook `post-file-edit.md`** (sincronização automática após edição)

---

## Invocação

**Via Comando:**
```
Execute skill sync-docs
```

**Via Slash Command (se configurado):**
```
/sync-docs
```

**Via Hook Automático:**
O hook `post-file-edit.md` detecta edições em CLAUDE.md e executa automaticamente este skill.

---

## Regra Crítica de Sincronização

**Do CLAUDE.md:**

> ### IMPORTANTE: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
>
> **Arquivo:** CLAUDE.md / GEMINI.md
> **Conteúdo:** Instruções completas para Claude Code / Gemini AI
> **Público-Alvo:** Claude AI / Gemini AI
> **Sincronização:** Devem ter conteúdo 100% idêntico (regra explícita)

**Razão:**
- Ambos AIs devem seguir **exatamente as mesmas regras**
- Evita inconsistências entre decisões Claude vs Gemini
- Garante **protocolo de advisor** funcione corretamente

---

## Anti-Patterns (NUNCA FAZER)

❌ **Modificar GEMINI.md diretamente** → Sempre modificar CLAUDE.md primeiro
❌ **Modificar conteúdo durante cópia** → Cópia deve ser **exata**
❌ **Assumir que estão sincronizados** → Sempre verificar
❌ **Commitar sem sincronizar** → Hook pre-commit deveria prevenir, mas double-check

---

## Checklist de Sincronização

- [ ] CLAUDE.md lido completamente?
- [ ] GEMINI.md lido completamente?
- [ ] Comparação byte-a-byte realizada?
- [ ] Se divergir → GEMINI.md atualizado com cópia exata?
- [ ] Verificação diff executada?
- [ ] Diferença = 0 (100% idênticos)?

---

## Tempo Estimado

- **Execução:** ~5 segundos
- **Antes (manual):** ~2 minutos (abrir 2 arquivos, comparar visualmente, copiar)

**Economia:** ⬆️ **96% de redução de tempo**

---

## Casos Especiais

### Caso 1: GEMINI.md não existe

```
⚠️ GEMINI.md não encontrado!

📋 Ação: Criando GEMINI.md a partir de CLAUDE.md...

✅ GEMINI.md criado (1,926 linhas)

🟢 Sincronização completa.
```

---

### Caso 2: CLAUDE.md modificado via merge conflict

```
⚠️ Merge conflict detectado em CLAUDE.md

📋 Ação:
1. Resolver merge conflict manualmente primeiro
2. Executar sync-docs após resolução
3. Commit com ambos arquivos sincronizados

🔴 Aguardando resolução de merge...
```

---

## Histórico de Edições Comum

**Seções mais editadas em CLAUDE.md:**
1. **Regras de Ouro** (novas regras de metodologia)
2. **Gemini 3 Pro - Protocolo de Advisor** (atualização de limitações)
3. **Python Scrapers (Playwright)** (novos padrões)
4. **Zero Tolerance Policy** (novas validações)
5. **Common Commands** (novos comandos)

**Após editar qualquer seção acima → Executar sync-docs imediatamente.**

---

**Versão:** 1.0.0
**Criado:** 2025-12-05
**Mantenedor:** Claude Code (Opus 4.5)
**Última Atualização:** 2025-12-05
**Regra Baseada em:** CLAUDE.md - Seção "Arquivos Mestres de Instrução"
