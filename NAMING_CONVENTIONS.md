# Naming Conventions - B3 AI Analysis Platform

**Version:** 1.0.0
**Date:** 2025-11-25
**Status:** ACTIVE

---

## 1. File Naming Convention

### Format
```
TIPO_assunto-contexto_YYYY-MM-DD.md
```

### Rules

| Rule | Description | Example |
|------|-------------|---------|
| **TIPO** | UPPERCASE, identifies document type | `BUG_`, `FASE_`, `VALIDACAO_` |
| **assunto** | lowercase-with-hyphens | `job-stalled`, `candle-timeframes` |
| **contexto** | lowercase-with-hyphens (optional) | `solucao-definitiva`, `tripla-mcp` |
| **date** | ISO 8601 format | `2025-11-25` |
| **extension** | Always `.md` | `.md` |

### Character Limits

- **Maximum filename:** 50 characters (excluding `.md`)
- **Allowed characters:** `a-z`, `0-9`, `-`, `_`
- **Prohibited:** spaces, dots (except `.md`), special chars (`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`)

### Valid Examples

```
BUG_job-stalled_solucao-definitiva_2025-11-25.md
FASE_35_candle-timeframes_2025-11-17.md
VALIDACAO_frontend_playwright_2025-11-23.md
PLANO_acao-corretiva_priorizado_2025-11-25.md
CHECKLIST_oauth-manager_completo_2025-11-15.md
```

### Invalid Examples

```
Bug Report - Job Stalled.md          # spaces, no pattern
fase35.md                            # no separator, no date
VALIDAÇÃO_frontend.md                # special char (ç)
my_document.MD                       # wrong extension case
```

---

## 2. Document Types (TIPO)

### Core Documentation
| TIPO | Description | Example |
|------|-------------|---------|
| `README` | Project overview | `README.md` |
| `ARCHITECTURE` | System architecture | `ARCHITECTURE.md` |
| `DATABASE_SCHEMA` | Database structure | `DATABASE_SCHEMA.md` |
| `ROADMAP` | Development phases | `ROADMAP.md` |
| `INDEX` | Documentation index | `INDEX.md` |
| `INSTALL` | Installation guide | `INSTALL.md` |
| `TROUBLESHOOTING` | Problem solutions | `TROUBLESHOOTING.md` |
| `CONTRIBUTING` | Contribution guide | `CONTRIBUTING.md` |
| `CHANGELOG` | Version history | `CHANGELOG.md` |

### Development & Phases
| TIPO | Description | Example |
|------|-------------|---------|
| `FASE` | Development phase | `FASE_35_candle-timeframes.md` |
| `PLANO` | Planning document | `PLANO_acao-corretiva_2025-11-25.md` |
| `CHECKLIST` | Validation checklist | `CHECKLIST_fase-35_completo.md` |
| `ANALISE` | Analysis document | `ANALISE_performance_backend.md` |

### Bug Tracking
| TIPO | Description | Example |
|------|-------------|---------|
| `BUG` | Bug report | `BUG_job-stalled_2025-11-25.md` |
| `BUGFIX` | Bug fix documentation | `BUGFIX_websocket-logs_2025-11-23.md` |
| `CORRECAO` | Correction record | `CORRECAO_eslint-warnings.md` |

### Validation & Testing
| TIPO | Description | Example |
|------|-------------|---------|
| `VALIDACAO` | Validation report | `VALIDACAO_tripla-mcp_fase-35.md` |
| `FRAMEWORK` | Testing framework | `FRAMEWORK_validacao-frontend.md` |

### Guides & Best Practices
| TIPO | Description | Example |
|------|-------------|---------|
| `GUIA` | How-to guide | `GUIA_tags-nomenclatura_2025.md` |
| `MELHORIAS` | Improvements doc | `MELHORIAS_contexto-ai.md` |
| `MCPS` | MCP documentation | `MCPS_usage-guide.md` |

---

## 3. Directory Structure

### Root Level (Keep Here)
```
README.md
ARCHITECTURE.md
DATABASE_SCHEMA.md
ROADMAP.md
INDEX.md
INSTALL.md
TROUBLESHOOTING.md
CONTRIBUTING.md
CLAUDE.md
GEMINI.md
NAMING_CONVENTIONS.md      # This file
CONTROLLED_VOCABULARY.md
```

### Protected Directories (Do NOT Modify)
```
.claude/agents/            # Sub-agent definitions
.gemini/                   # Gemini AI context
backend/                   # Backend source code
frontend/                  # Frontend source code
```

### Future Migration (Optional)
```
docs/
├── bugs/                  # BUG_*.md, BUGFIX_*.md
├── phases/                # FASE_*.md
├── validation/            # VALIDACAO_*.md
├── planning/              # PLANO_*.md, CHECKLIST_*.md
├── guides/                # GUIA_*.md, MELHORIAS_*.md
└── archive/               # Deprecated documents
```

---

## 4. Version Numbering

### Format
```
v01, v02, v03, ... v99
```

### Rules
- Use 2-digit padding (v01, not v1)
- Increment for major changes
- Keep previous versions in archive/

### Example
```
PLANO_migracao_v01.md      # First version
PLANO_migracao_v02.md      # Major revision
```

---

## 5. Date Formats

### In Filenames
```
YYYY-MM-DD                 # ISO 8601
2025-11-25                 # Example
```

### In Content
```
**Date:** 2025-11-25
**Last Updated:** 2025-11-25
```

---

## 6. Quick Reference

### Creating New Document

1. **Choose TIPO** from list above
2. **Write assunto** in lowercase-with-hyphens
3. **Add date** if time-sensitive
4. **Check length** (max 50 chars)
5. **Validate characters** (a-z, 0-9, -, _)

### Template
```markdown
# [TIPO]: [Title]

**Date:** YYYY-MM-DD
**Author:** claude-code | human
**Status:** draft | active | deprecated

---

## 1. Overview
[Content]

## 2. Details
[Content]

---

**Related Documents:**
- [Related Doc 1](./related-doc-1.md)
- [Related Doc 2](./related-doc-2.md)
```

---

## 7. Adoption

### For New Files
- **MANDATORY:** Follow this convention for all new .md files
- **Exception:** Files in protected directories (.claude/, .gemini/)

### For Existing Files
- **NOT REQUIRED:** Existing files keep their names
- **OPTIONAL:** Rename during major updates
- **FUTURE:** Full migration in dedicated session

---

**Document maintained by:** Claude Code
**Last validation:** 2025-11-25
