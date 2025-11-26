# Controlled Vocabulary - B3 AI Analysis Platform

**Version:** 1.0.0
**Date:** 2025-11-25
**Status:** ACTIVE

---

## 1. Purpose

This document defines **standardized terms** to ensure consistency across all documentation in the B3 AI Analysis Platform project.

**Rules:**
- Always use the **STANDARD TERM** (right column)
- Avoid variations listed in the **AVOID** column
- Apply to: filenames, content, commit messages, comments

---

## 2. Status Terms

| AVOID (variations) | STANDARD TERM | Description |
|-------------------|---------------|-------------|
| acabado, pronto, feito, done | **completo** | Task/phase finished |
| em progresso, WIP, fazendo | **em-andamento** | Currently working |
| esperando, backlog, a fazer | **pendente** | Not started |
| travado, parado, stuck | **bloqueado** | Cannot proceed |
| revisando, checking | **revisao** | Under review |
| ok, aprovado, accepted | **aprovado** | Officially approved |
| obsoleto, old, antigo | **deprecated** | No longer used |

---

## 3. Action Terms

| AVOID (variations) | STANDARD TERM | Description |
|-------------------|---------------|-------------|
| crashou, quebrou, falhou | **crash** | System failure |
| consertado, arrumado, fixed | **corrigido** | Bug fixed |
| deletar, remover, apagar | **remover** | Delete something |
| criar, adicionar, add | **criar** | Create new |
| mudar, alterar, change | **modificar** | Change existing |
| refatorar, reescrever | **refatorar** | Code restructure |
| melhorar, improve | **otimizar** | Performance improvement |
| testar, verificar, check | **validar** | Test/verify |

---

## 4. Technical Terms

| AVOID (variations) | STANDARD TERM | Description |
|-------------------|---------------|-------------|
| bug, issue, problema | **bug** | Software defect |
| feature, funcionalidade | **feature** | New capability |
| teste, verificação | **validacao** | Testing process |
| documentação, docs | **documentacao** | Documentation |
| erro crítico, showstopper | **critico** | Critical severity |
| configuração, config | **configuracao** | Configuration |
| implementação, impl | **implementacao** | Implementation |

---

## 5. Priority Terms

| AVOID (variations) | STANDARD TERM | Usage |
|-------------------|---------------|-------|
| urgente, ASAP, now | **critica** | Must fix immediately |
| importante, high | **alta** | Fix soon |
| normal, medium | **media** | Standard priority |
| minor, low, depois | **baixa** | Can wait |

---

## 6. Area Terms

| AVOID (variations) | STANDARD TERM | Scope |
|-------------------|---------------|-------|
| back, server, API | **backend** | Server-side |
| front, client, UI | **frontend** | Client-side |
| DB, banco, postgres | **database** | Database |
| scraper, crawler | **scrapers** | Data collection |
| jobs, workers | **queue** | Background jobs |
| devops, deploy | **infra** | Infrastructure |

---

## 7. Technology Tags

| Technology | Standard Tag | Example Usage |
|------------|--------------|---------------|
| NestJS | `nestjs` | `tech: nestjs` |
| Next.js | `nextjs` | `tech: nextjs` |
| TypeScript | `typescript` | `tech: typescript` |
| PostgreSQL | `postgresql` | `tech: postgresql` |
| Redis | `redis` | `tech: redis` |
| BullMQ | `bullmq` | `tech: bullmq` |
| Playwright | `playwright` | `tech: playwright` |
| Python | `python` | `tech: python` |
| Docker | `docker` | `tech: docker` |

---

## 8. MCP Tags

| MCP Server | Standard Tag |
|------------|--------------|
| Playwright MCP | `mcp-playwright` |
| Chrome DevTools MCP | `mcp-chrome-devtools` |
| Sequential Thinking | `mcp-sequential-thinking` |
| Filesystem MCP | `mcp-filesystem` |
| Context7 MCP | `mcp-context7` |

---

## 9. Domain Terms (Financial)

| AVOID (variations) | STANDARD TERM | Description |
|-------------------|---------------|-------------|
| ação, stock, papel | **ativo** | Financial asset |
| preço, price, cotação | **preco** | Price value |
| dividendo, DY | **dividendo** | Dividend payment |
| lucro, profit, ganho | **lucro** | Profit |
| prejuízo, loss, perda | **prejuizo** | Loss |
| carteira, wallet | **portfolio** | Investment portfolio |
| B3, bolsa, bovespa | **b3** | Brazilian stock exchange |

---

## 10. Commit Message Prefixes

| Type | Usage | Example |
|------|-------|---------|
| `feat:` | New feature | `feat: add dividend calculator` |
| `fix:` | Bug fix | `fix: resolve job stalled issue` |
| `docs:` | Documentation | `docs: update ROADMAP.md` |
| `refactor:` | Code restructure | `refactor: optimize query performance` |
| `test:` | Testing | `test: add e2e tests for sync` |
| `chore:` | Maintenance | `chore: update dependencies` |
| `perf:` | Performance | `perf: reduce API response time` |

---

## 11. File Prefixes (TIPO)

| Prefix | Category | Example |
|--------|----------|---------|
| `BUG_` | Bug reports | `BUG_job-stalled.md` |
| `BUGFIX_` | Bug fixes | `BUGFIX_websocket.md` |
| `FASE_` | Development phases | `FASE_35_timeframes.md` |
| `VALIDACAO_` | Validation reports | `VALIDACAO_tripla-mcp.md` |
| `PLANO_` | Planning docs | `PLANO_migracao.md` |
| `CHECKLIST_` | Checklists | `CHECKLIST_fase-35.md` |
| `GUIA_` | Guides | `GUIA_nomenclatura.md` |
| `ANALISE_` | Analysis docs | `ANALISE_performance.md` |
| `CORRECAO_` | Corrections | `CORRECAO_eslint.md` |
| `MELHORIAS_` | Improvements | `MELHORIAS_contexto-ai.md` |

---

## 12. Boolean Values

| AVOID | STANDARD | Context |
|-------|----------|---------|
| yes, sim, true, 1 | **true** | Affirmative |
| no, não, false, 0 | **false** | Negative |
| ok, done, yes | **completo** | Status |
| fail, error, no | **falhou** | Status |

---

## 13. Date/Time Terms

| AVOID | STANDARD | Format |
|-------|----------|--------|
| today, hoje | **YYYY-MM-DD** | `2025-11-25` |
| now, agora | **HH:MM:SS** | `14:30:00` |
| timestamp | **ISO 8601** | `2025-11-25T14:30:00Z` |

---

## 14. Quick Reference Card

### Most Common Substitutions

```
crashou      → crash
consertado   → corrigido
em progresso → em-andamento
acabado      → completo
urgente      → critica
bug/issue    → bug
docs         → documentacao
teste        → validacao
```

### Filename Template
```
{TIPO}_{assunto}_{contexto}_{YYYY-MM-DD}.md
```

### Commit Template
```
{type}: {description}

{body}

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 15. Adoption

### Mandatory For
- New documentation files
- Commit messages
- Code comments (when referencing docs)
- Issue/PR titles

### Recommended For
- Existing documentation (during updates)
- Internal communications
- Technical discussions

### Exceptions
- External library names (keep original)
- User-facing content (use natural language)
- Legacy files (rename during major updates)

---

**Document maintained by:** Claude Code
**Last validation:** 2025-11-25
**Related:** [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
