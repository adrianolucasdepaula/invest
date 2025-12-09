# PROTOCOLO DE LOG DE SESSAO v5.0

> **Novidade v5.0:** Integração com arquivos de planejamento (`~/.claude/plans/`).
> Sistema detecta automaticamente o plano ativo e o associa à sessão.

---

## ARQUITETURA INTEGRADA

```
~/.claude/
  projects/<hash>/sessions/
    <session-id>.jsonl            # TRANSCRIPT NATIVO (fonte única)
  plans/
    declarative-imagining-nova.md # PLANO ATIVO (detectado automaticamente)
    ...outros planos...

.claude/
  hooks-scripts/
    context-monitor.js            # Monitor de contexto (lê transcript)
    session-tracker.js            # Tracker de eventos (v3.0) + plan detection
  activity.log                    # Eventos importantes (minimal)
  session-metrics.json            # Métricas + transcriptPath + planPath
  context-state.json              # Estado do monitor
```

**Princípio:** Transcript nativo + Plan file como fontes únicas de verdade.

---

## COMO FUNCIONA

### Transcript Nativo

O Claude Code automaticamente:
1. Cria arquivo `.jsonl` para cada sessão
2. Salva todas mensagens (user + assistant + tool calls)
3. Passa `transcript_path` para hooks via stdin

### Arquivos de Planejamento

O Claude Code (Plan Mode):
1. Gera arquivos `.md` em `~/.claude/plans/`
2. Nomes aleatórios (ex: `declarative-imagining-nova.md`)
3. Contém checkpoints, fases, e todos os detalhes do planejamento

### Rastreamento Automático (v3.0)

O `session-tracker.js` v3.0:
1. Recebe `transcript_path` do Claude Code
2. **NOVO:** Detecta plano ativo em `~/.claude/plans/` (mais recentemente modificado)
3. Extrai sumário do plano (título, versão, fase atual)
4. Salva referências em `session-metrics.json`
5. Loga eventos importantes em `activity.log`

### Hooks Automáticos

| Hook | Trigger | Ação |
|------|---------|------|
| **PostToolUse:Read** | Após ler arquivo | Monitor de contexto |
| **PreCompact** | Antes de compact | Salva métricas + plan info + reset state |
| **Stop** | Fim da sessão | Log final com transcript + plan path |

---

## MÉTRICAS DA SESSÃO

### session-metrics.json (v5.0)

```json
{
  "sessionStart": "2025-12-08 18:00:00",
  "interactions": 45,
  "autoCompacts": 1,
  "manualCompacts": 2,
  "lastCompact": "2025-12-08 22:00:00",
  "lastActivity": "2025-12-08 23:00:00",
  "transcriptPath": "~/.claude/projects/.../e2ce6be3-c46c-418e-8b9d-fcee4318e367.jsonl",
  "sessionId": "e2ce6be3-c46c-418e-8b9d-fcee4318e367",
  "planPath": "~/.claude/plans/declarative-imagining-nova.md",
  "planName": "declarative-imagining-nova.md",
  "planLastModified": "2025-12-08 13:51:00",
  "planTitle": "PLANO ULTRA-COMPLETO DE VALIDACAO E TESTES DO ECOSSISTEMA",
  "planCurrentPhase": "SETUP - Sistema de Log Automatico"
}
```

**Campos v5.0:**
- `transcriptPath`: Caminho do transcript nativo JSONL
- `sessionId`: ID da sessão extraído do transcript
- `planPath`: Caminho completo do arquivo de planejamento ativo
- `planName`: Nome do arquivo de planejamento
- `planLastModified`: Última modificação do plano
- `planTitle`: Título extraído do plano
- `planCurrentPhase`: Fase atual extraída do checkpoint do plano

---

## DETECÇÃO DE PLANO ATIVO

### Estratégia

O sistema detecta o plano ativo baseado em:
1. **Modificação mais recente** - arquivo .md modificado mais recentemente em `~/.claude/plans/`
2. **Extração de metadados** - Lê primeiras 50 linhas do plano para extrair:
   - Título (`# PLANO ...`)
   - Versão (`**Versao:**`)
   - Objetivo (`**Objetivo:**`)
   - Fase atual (`<!-- Phase: ... -->` ou `| **Fase em Execucao** |`)

### Formato do Arquivo de Planejamento

O plano pode incluir checkpoint para rastreamento:

```markdown
<!-- CHECKPOINT_SESSION_LOG -->
<!-- Last Update: 2025-12-08 -->
<!-- Phase: SETUP - Sistema de Log Automatico -->
<!-- Status: in_progress -->

## CHECKPOINT DE SESSAO ATIVO

| Campo | Valor |
|-------|-------|
| **Sessao Atual** | 2025-12-08 |
| **Fase em Execucao** | SETUP - Sistema de Log Automatico |
| **Interacao Atual** | #3 |
```

---

## MONITORAMENTO DE CONTEXTO

### Thresholds

| Threshold | % | Ação |
|-----------|---|------|
| Warning | 40% | Log silencioso em activity.log |
| Compact | 50% | Log + flag compactSuggested |
| Critical | 70% | Block (exit 2) até compact |

### Estado (context-state.json)

```json
{
  "lastCheck": "2025-12-08 23:00:00",
  "lastUsagePercent": 35.2,
  "warningShown": false,
  "compactSuggested": false,
  "checksCount": 42
}
```

---

## PROCEDIMENTO DE RETOMADA

### Após Compact

1. Claude Code carrega resumo automático do contexto compactado
2. Hook `PreCompact` loga plano ativo + reseta `context-state.json`
3. `session-metrics.json` mantém referências ao transcript e plano
4. Continuar normalmente - transcript e plano são preservados

### Após Crash ou Interrupção

1. Iniciar nova sessão no mesmo projeto
2. Claude Code carrega contexto do projeto automaticamente
3. Verificar `session-metrics.json`:
   ```bash
   cat .claude/session-metrics.json
   ```
4. `transcriptPath` aponta para transcript anterior
5. `planPath` aponta para plano ativo (recuperar fase atual)

### Recuperar Contexto Antigo

```bash
# Ver métricas completas
cat .claude/session-metrics.json | jq .

# Ver transcript anterior
tail -50 "$(cat .claude/session-metrics.json | jq -r '.transcriptPath')"

# Ver plano ativo
cat "$(cat .claude/session-metrics.json | jq -r '.planPath')" | head -100
```

---

## COMANDOS ÚTEIS

### Verificar Estado

```bash
# Ver métricas da sessão (inclui plano)
cat .claude/session-metrics.json

# Ver estado do contexto
cat .claude/context-state.json

# Ver últimas atividades
tail -20 .claude/activity.log

# Ver plano ativo
cat .claude/session-metrics.json | jq -r '.planPath'
cat .claude/session-metrics.json | jq -r '.planCurrentPhase'
```

### Listar Planos

```bash
# Listar todos os planos
ls -la ~/.claude/plans/

# Ver plano mais recente
ls -t ~/.claude/plans/*.md | head -1 | xargs head -50
```

### Compact Manual

```bash
/compact Keep: fase atual do plano, erros pendentes. Discard: outputs longos.
```

---

## REGRAS SIMPLIFICADAS

### O Que Fazer

1. ✅ Deixar hooks funcionarem automaticamente
2. ✅ Verificar `session-metrics.json` para métricas, transcript e plano
3. ✅ Usar `/compact` quando contexto estiver alto
4. ✅ Confiar no transcript nativo + plano como fontes de verdade
5. ✅ Usar `activity.log` para debug se necessário
6. ✅ Atualizar checkpoint no plano quando mudar de fase

### O Que NÃO Fazer

1. ❌ Criar arquivos de checkpoint manuais separados
2. ❌ Duplicar logs em markdown
3. ❌ Tentar reconstruir histórico manualmente
4. ❌ Ignorar alertas de contexto
5. ❌ Criar planos fora de `~/.claude/plans/` (perdem rastreamento)

---

## TROUBLESHOOTING

### "Prompt is too long"

1. Pressione `Esc` 2x
2. Apague últimas mensagens longas
3. Execute `/compact`
4. Verifique `planCurrentPhase` para retomar

### Sessão perdeu contexto

1. O transcript JSONL preserva tudo
2. O plano em `~/.claude/plans/` tem checkpoints
3. Inicie nova sessão no mesmo projeto
4. Claude Code carrega contexto automaticamente
5. Verifique `session-metrics.json` para transcript e plano

### Plano não detectado

```bash
# Verificar se diretório existe
ls ~/.claude/plans/

# Verificar se há arquivos .md
ls ~/.claude/plans/*.md

# Ver plano mais recente
ls -t ~/.claude/plans/*.md | head -1
```

### Hooks não disparam

```bash
# Verificar settings.json
cat .claude/settings.json | jq '.hooks'

# Verificar se scripts existem
ls -la .claude/hooks-scripts/

# Testar tracker manualmente
echo '{}' | node .claude/hooks-scripts/session-tracker.js start
cat .claude/session-metrics.json
```

---

## ACTIVITY LOG - Eventos Rastreados

| Evento | Formato | Descrição |
|--------|---------|-----------|
| `[PLAN-DETECTED]` | nome + modified | Novo plano detectado |
| `[PLAN-TITLE]` | título | Título do plano |
| `[PLAN-PHASE]` | fase | Fase atual do plano |
| `[PLAN-LOADED]` | nome | Plano carregado no início |
| `[PLAN-FINAL]` | nome | Plano ao fim da sessão |
| `[COMPACT-PLAN]` | nome + fase | Plano antes de compact |
| `[SESSION-START]` | - | Início de sessão |
| `[SESSION-END]` | métricas | Fim de sessão |
| `[TRANSCRIPT]` | path | Path do transcript |
| `[AUTO-COMPACT]` | # + transcript | Compact automático |
| `[MANUAL-COMPACT]` | # | Compact manual |
| `[CONTEXT-SNAPSHOT]` | # msgs | Mensagens antes de compact |

---

## ESTIMATIVA DE TOKENS

| Conteúdo | Tokens Aprox |
|----------|--------------|
| 1 char | ~0.25 tokens |
| 1 linha | ~15 tokens |
| 100KB transcript | ~25.000 tokens |
| 800KB transcript | ~200.000 tokens (limite) |
| Plano típico (200KB) | ~50.000 tokens |

**Cálculo:** `tamanho_bytes / 4 = tokens_estimados`

---

## HISTÓRICO DE VERSÕES

| Versão | Data | Mudança Principal |
|--------|------|-------------------|
| v5.0 | 2025-12-08 | Integração com `~/.claude/plans/` |
| v4.0 | 2025-12-08 | Transcript nativo como fonte única |
| v3.0 | - | Session-tracker com métricas |
| v2.0 | - | Hooks automáticos |
| v1.0 | - | Checkpoints manuais |

---

**Versão:** 5.0
**Data:** 2025-12-08
**Autor:** Claude Opus 4.5
**Mudança Principal:** Integração com arquivos de planejamento em `~/.claude/plans/`
