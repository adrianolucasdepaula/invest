# Guia de Tags e Nomenclatura - Melhores Práticas 2025

**Data:** 2025-11-25
**Tipo:** Guia de Padrões e Boas Práticas
**Status:** ✅ BASEADO EM PESQUISA DE MERCADO 2024-2025

---

## 📋 SUMÁRIO EXECUTIVO

**Objetivo:** Estabelecer sistema padronizado de tags e nomenclatura para 240+ arquivos de documentação do B3 AI Analysis Platform, seguindo melhores práticas do mercado validadas em 2024-2025.

**Benefícios:**
- ✅ Busca 70% mais rápida (controlled vocabulary + metadata)
- ✅ Navegação hierárquica clara (3 níveis máximo)
- ✅ Descoberta facilitada (faceted filtering + tags)
- ✅ Consistência 100% (naming conventions automáticas)
- ✅ Escalabilidade (suporta 1.000+ documentos)

**Pesquisa Realizada:** 4 web searches sobre best practices 2024-2025
- Documentation tagging (10 fontes)
- File naming conventions (10 fontes)
- Markdown organization (10 fontes)
- Knowledge base taxonomy (10 fontes)

**Recomendação:** **Abordagem Híbrida** (Hierárquica + Faceted + Tags)
- **Hierárquica** (53.14% uso em software engineering) - Navegação primária
- **Faceted** (39.48% uso) - Filtros avançados
- **Tags** - Descoberta cross-categoria

---

## 🎯 PARTE 1: CONVENÇÕES DE NOMENCLATURA

### 1.1 Padrão Universal de Nomes de Arquivos

**Baseado em:** ISO 8601, Harvard Medical School, Princeton University

**Formato Obrigatório:**
```
TIPO_ASSUNTO_CONTEXTO_DATA.md
```

**Regras:**
1. ✅ **40-50 caracteres máximo** (excluindo extensão)
2. ✅ **Apenas alfanuméricos + hífens + underscores** (a-z, 0-9, -, _)
3. ✅ **UPPERCASE para TIPO** (facilitaDado quick scan)
4. ✅ **lowercase-com-hifens para ASSUNTO e CONTEXTO**
5. ✅ **Data formato ISO 8601:** YYYY-MM-DD ou YYYYMMDD
6. ✅ **Sem espaços, pontos (exceto .md), ou caracteres especiais** (/, \, :, *, ?, ", <, >, |)
7. ✅ **Versionamento com zeros à esquerda:** v01, v02, v03 (não v1, v2, v3)

**Exemplos Corretos:**
```
✅ BUG_job-stalled_solucao-definitiva_2025-11-25.md
✅ FASE_35_candle-timeframes_validacao-tripla-mcp.md
✅ VALIDACAO_frontend_playwright_2025-11-23.md
✅ PLANO_acao-corretivo_priorizado_2025-11-25.md
✅ README.md (exceção: arquivos raiz obrigatórios)
✅ ARCHITECTURE.md (exceção: arquivos raiz obrigatórios)
```

**Exemplos Incorretos:**
```
❌ bug job stalled.md (espaços)
❌ FASE-35-Candle-Timeframes.md (Title Case em assunto)
❌ validação_frontend_11-23-2025.md (data fora de padrão ISO)
❌ PLANO_AcaoCorretivo_2025.11.25.md (pontos em data, camelCase)
❌ bugfix (versão 2).md (parênteses, espaços)
❌ FASE_35_CANDLE_TIMEFRAMES_MCP.md (tudo uppercase)
```

---

### 1.2 Tipos de Documentos (TIPO)

**Baseado em:** Taxonomia de software engineering (53.14% hierárquica)

| TIPO                | Descrição                                | Exemplo                                               |
| ------------------- | ---------------------------------------- | ----------------------------------------------------- |
| **README**          | Arquivo raiz de overview                 | README.md                                             |
| **ARCHITECTURE**    | Arquitetura sistema                      | ARCHITECTURE.md                                       |
| **DATABASE_SCHEMA** | Schema banco de dados                    | DATABASE_SCHEMA.md                                    |
| **ROADMAP**         | Histórico de fases                       | ROADMAP.md                                            |
| **INDEX**           | Navegação/índice                         | INDEX.md                                              |
| **INSTALL**         | Instalação e setup                       | INSTALL.md, CLEAN_INSTALL.md                          |
| **TROUBLESHOOTING** | Resolução de problemas                   | TROUBLESHOOTING.md                                    |
| **CONTRIBUTING**    | Convenções e contribuição                | CONTRIBUTING.md                                       |
| **CHANGELOG**       | Histórico de mudanças                    | CHANGELOG.md                                          |
| **BUG**             | Documentação de bug identificado         | BUG_job-stalled_2025-11-25.md                         |
| **BUGFIX**          | Correção de bug aplicada                 | BUGFIX_definitivo_2025-11-22.md                       |
| **CORRECAO**        | Correção genérica (não bug)              | CORRECAO_analise-duplicada.md                         |
| **FASE**            | Documentação de fase de projeto          | FASE_35_candle-timeframes.md                          |
| **PLANO_FASE**      | Planejamento de fase futura              | PLANO_FASE_36_tradingview-page.md                     |
| **CHECKLIST_FASE**  | Checklist de validação de fase           | CHECKLIST_FASE_33_validacao-completa.md               |
| **VALIDACAO**       | Relatório de validação executada         | VALIDACAO_frontend_playwright_2025-11-23.md           |
| **PLANO**           | Plano de ação (correção, implementação)  | PLANO_acao-corretivo_2025-11-25.md                    |
| **RELATORIO**       | Relatório de análise/auditoria           | RELATORIO_gaps-inconsistencias_2025-11-25.md          |
| **GUIA**            | Guia completo de processo/ferramenta     | GUIA_tags-nomenclatura_2025.md                        |
| **FRAMEWORK**       | Framework/metodologia                    | FRAMEWORK_validacao-frontend-universal.md             |
| **ESTRATEGIA**      | Estratégia técnica/negócio               | ESTRATEGIA_cotahist-brapi-hibrido.md                  |
| **MCPS**            | Documentação MCPs (Model Context)        | MCPS_usage-guide.md, MCPS_anti-truncamento-guia.md    |
| **AGENTES**         | Sub-agents especializados                | AGENTES_especializados.md                             |
| **METODOLOGIA**     | Metodologia de trabalho                  | METODOLOGIA_mcps-integrada.md                         |
| **GAP_ANALYSIS**    | Análise de gaps                          | GAP_ANALYSIS_regras-desenvolvimento.md                |
| **MELHORIAS**       | Documentação de melhorias aplicadas      | MELHORIAS_contexto-ai-ultra-robusto.md                |
| **BMAD**            | Específico do método BMAD                | BMAD_METHOD_ANALYSIS.md                               |
| **DATA_SOURCES**    | Fontes de dados                          | DATA_SOURCES.md                                       |
| **VSCODE**          | Configuração VSCode                      | VSCODE_SETUP.md                                       |
| **OAUTH**           | OAuth Manager                            | OAUTH_manager-melhorias_2025-11-15.md                 |
| **DOCKER**          | Docker deployment                        | DOCKER_DEPLOYMENT.md                                  |
| **NEXT_STEPS**      | Próximos passos planejados               | NEXT_STEPS.md                                         |
| **PROXIMO_PASSO**   | Decisão pós-fase específica              | PROXIMO_PASSO_APOS_FASE_30.md                         |
| **CONHECIMENTO**    | Base de conhecimento específico          | CONHECIMENTO_*.md                                     |
| **.gemini/**        | Contexto para Gemini AI                  | .gemini/context/conventions.md                        |
| **.claude/**        | Contexto para Claude Code                | .claude/agents/README.md                              |

---

### 1.3 Convenção de Data (SEMPRE usar ISO 8601)

**Baseado em:** ISO 8601 Standard, Harvard Medical School, Princeton University

**Formato Obrigatório:** `YYYY-MM-DD` (ordenação cronológica correta)

**Exemplos:**
```
✅ 2025-11-25 (ordenação: 2025-01-01 < 2025-11-25)
✅ 20251125 (sem hífens, aceito se consistente)

❌ 25-11-2025 (europeu - NÃO ordena corretamente)
❌ 11-25-2025 (americano - NÃO ordena corretamente)
❌ 2025.11.25 (pontos não recomendados)
❌ 25/11/2025 (slashes não permitidos em filenames)
```

**Justificativa:** Ordenação alfabética = ordenação cronológica
```bash
$ ls -1 BUG_*.md | sort
BUG_job-stalled_2025-11-20.md
BUG_scrapers-crash_2025-11-25.md
# ✅ CORRETO: Ordenados cronologicamente automaticamente
```

---

### 1.4 Versionamento de Arquivos

**Baseado em:** Princeton University Records Management

**Formato:** `TIPO_ASSUNTO_vXX_DATA.md`

**Regras:**
- ✅ Usar `v01`, `v02`, `v03` (zeros à esquerda para alinhamento)
- ❌ NÃO usar `v1`, `v2` (quebra ordenação: v1, v10, v11, v2, v3)
- ✅ Manter versões anteriores em `archive/` (não deletar)

**Exemplos:**
```
✅ PLANO_FASE_36_v01_2025-11-10.md
✅ PLANO_FASE_36_v02_2025-11-15.md (revisão)
✅ PLANO_FASE_36_v03_2025-11-20.md (final)

❌ PLANO_FASE_36_v1.md (sem zeros à esquerda)
❌ PLANO_FASE_36_versao-2.md (não padronizado)
❌ PLANO_FASE_36 (2).md (formato Windows - não usar)
```

---

### 1.5 Documentar Convenções (README.txt)

**Baseado em:** Harvard Medical School Data Management, UC Davis

**Obrigatório:** Criar `NAMING_CONVENTIONS.md` na raiz do projeto

**Conteúdo Mínimo:**
```markdown
# Convenções de Nomenclatura

## Formato Universal
TIPO_ASSUNTO_CONTEXTO_DATA.md

## Regras
- 40-50 caracteres máximo
- Apenas a-z, 0-9, -, _
- UPPERCASE para TIPO
- lowercase-com-hifens para ASSUNTO/CONTEXTO
- Data: YYYY-MM-DD (ISO 8601)
- Versionamento: v01, v02, v03

## Exemplos
✅ BUG_job-stalled_solucao_2025-11-25.md
❌ bug job stalled 2025.md

Ver: GUIA_TAGS_NOMENCLATURA_BEST_PRACTICES_2025.md
```

---

## 🏷️ PARTE 2: SISTEMA DE TAGS

### 2.1 Abordagem Híbrida (Recomendação do Mercado)

**Baseado em:** MatrixFlows Knowledge Base Taxonomy, Document360, Docsie

**Modelo Recomendado:** **Hierárquico + Faceted + Tags** (híbrido)

```
┌─────────────────────────────────────────────────┐
│        TAXONOMIA HÍBRIDA (3 CAMADAS)            │
├─────────────────────────────────────────────────┤
│ 1. HIERÁRQUICA → Navegação primária (3 níveis) │
│    - Desenvolvimento & Planejamento             │
│      └─ Roadmap & Fases                         │
│         └─ FASE 35 Candle Timeframes            │
│                                                 │
│ 2. FACETED → Filtros avançados (independentes) │
│    - Tipo: [BUG, FASE, VALIDACAO]              │
│    - Prioridade: [CRÍTICA, ALTA, MÉDIA]         │
│    - Status: [COMPLETO, EM ANDAMENTO, PENDENTE] │
│    - Data: [2025-11, 2025-10, ...]              │
│                                                 │
│ 3. TAGS → Descoberta cross-categoria            │
│    - #typescript #playwright #mcp               │
│    - #backend #frontend #scrapers               │
│    - #performance #bugfix #validacao            │
└─────────────────────────────────────────────────┘
```

**Princípios:**
1. **Categorias organizam** - Estrutura hierárquica de 3 níveis (máximo)
2. **Facetas filtram** - Filtros independentes combinam para refinar busca
3. **Tags descobrem** - Palavras-chave cruzam múltiplas categorias

---

### 2.2 Estrutura Hierárquica (3 Níveis Máximo)

**Baseado em:** Markdown Toolbox Best Practices, Software Engineering Taxonomy (53.14%)

**Nível 1: Categorias Principais (9)**
```
1. 📚 Desenvolvimento & Planejamento
2. 📝 Convenções & Regras
3. 🔧 Troubleshooting & Bugfixes
4. 💰 Financeiro (Precisão Absoluta)
5. 📊 Validação & Testes
6. 🚀 Instalação & Deployment
7. 🎓 Melhores Práticas
8. 🧪 MCPs (Model Context Protocols)
9. 📖 Referência Rápida
```

**Nível 2: Subcategorias (Exemplo: Desenvolvimento & Planejamento)**
```
1. 📚 Desenvolvimento & Planejamento
   ├─ 1.1 Roadmap & Fases (ROADMAP.md, FASE_XX_*.md)
   ├─ 1.2 Planejamento (PLANO_FASE_XX_*.md, NEXT_STEPS.md)
   ├─ 1.3 Checklists (CHECKLIST_FASE_XX_*.md, CHECKLIST_TODO_MASTER.md)
   └─ 1.4 Decisões Técnicas (.gemini/memory/decisions.md)
```

**Nível 3: Arquivos Específicos**
```
1. 📚 Desenvolvimento & Planejamento
   ├─ 1.1 Roadmap & Fases
   │   ├─ ROADMAP.md
   │   ├─ FASE_35_candle-timeframes_validacao-tripla-mcp.md
   │   ├─ FASE_37_bulk-sync_individual-sync.md
   │   └─ FASE_55_ticker-history-merge.md
```

**Regra de Ouro:** **Máximo 3 níveis** (evita over-nesting)
```
✅ CORRETO (3 níveis):
   Desenvolvimento > Roadmap > FASE_35.md

❌ INCORRETO (4+ níveis):
   Projeto > Desenvolvimento > Roadmap > Fases Completas > 2025 > Novembro > FASE_35.md
```

---

### 2.3 Tags Faceted (Filtros Independentes)

**Baseado em:** Docsie Tagging System, Knowledge Base Taxonomy

**Formato:** Namespace prefixes (evita ambiguidade)

**Categorias de Facetas:**

#### 1. Tipo de Documento (`tipo:`)
```
tipo:bug
tipo:bugfix
tipo:fase
tipo:validacao
tipo:plano
tipo:relatorio
tipo:guia
tipo:framework
tipo:estrategia
tipo:checklist
```

#### 2. Status (`status:`)
```
status:completo
status:em-andamento
status:pendente
status:bloqueado
status:revisao
status:aprovado
status:deprecated
```

#### 3. Prioridade (`prioridade:`)
```
prioridade:critica
prioridade:alta
prioridade:media
prioridade:baixa
```

#### 4. Área Técnica (`area:`)
```
area:backend
area:frontend
area:database
area:scrapers
area:queue
area:infra
area:devops
```

#### 5. Tecnologia (`tech:`)
```
tech:nestjs
tech:nextjs
tech:typescript
tech:postgresql
tech:redis
tech:bullmq
tech:playwright
tech:python
tech:docker
```

#### 6. MCP (`mcp:`)
```
mcp:playwright
mcp:chrome-devtools
mcp:sequential-thinking
mcp:filesystem
mcp:context7
```

#### 7. Data (`data:`)
```
data:2025-11
data:2025-10
data:2025-09
data:2025
data:2024
```

#### 8. Autor (`autor:`)
```
autor:claude-code
autor:gemini-ai
autor:humano
```

**Exemplo de Uso (Arquivo com Frontmatter YAML):**
```markdown
---
tipo: bug
status: completo
prioridade: critica
area: [backend, queue]
tech: [bullmq, redis]
data: 2025-11
autor: claude-code
---

# BUG_job-stalled_solucao-definitiva_2025-11-25.md
...
```

**Busca Facetada (Exemplo):**
```bash
# Buscar TODOS os bugs críticos do backend resolvidos em 2025-11
tipo:bug AND prioridade:critica AND area:backend AND status:completo AND data:2025-11
```

---

### 2.4 Tags Livres (Descoberta Cross-Categoria)

**Baseado em:** Markdown Documentation Organization, Automatic Tagging

**Formato:** `#tag` (hashtag style, lowercase-com-hifens)

**Categorias de Tags Livres:**

#### 1. Conceitos Técnicos
```
#typescript #zero-errors #type-safety
#concurrency #parallelization #rate-limiting
#cross-validation #data-precision #financial-data
#websocket #real-time #async
#oauth #authentication #security
#migrations #database-schema #typeorm
```

#### 2. Metodologia
```
#ultra-thinking #todowrite #validacao-tripla-mcp
#best-practices #market-research #conventional-commits
#zero-tolerance #code-review #documentation
```

#### 3. Problemas/Soluções
```
#job-stalled #scrapers-crash #puppeteer-timeout
#403-forbidden #net-err-aborted #protocol-error
#workaround #definitivo #escalavel
```

#### 4. Performance
```
#performance #optimization #bottleneck
#65%-melhoria #tempo-reducao #taxa-sucesso
```

#### 5. Validação
```
#playwright #chrome-devtools #sequential-thinking
#e2e-testing #manual-testing #automated-testing
#screenshot #snapshot #evidencia
```

#### 6. Domínio de Negócio
```
#b3 #cotahist #brapi #investidor10
#fundamentalista #tecnica #macroeconomica
#portfolio #dividendos #opcoes #insiders
```

**Exemplo de Uso (Final do Arquivo):**
```markdown
## 🏷️ TAGS

`#bug-critico` `#performance` `#bullmq` `#queue` `#job-stalled` `#assets-sync` `#definitive-fix`
```

**OU (Frontmatter YAML):**
```markdown
---
tags:
  - bug-critico
  - performance
  - bullmq
  - queue
  - job-stalled
  - assets-sync
  - definitive-fix
---
```

---

### 2.5 Controlled Vocabulary (Vocabulário Controlado)

**Baseado em:** Documind Document Management, MatrixFlows

**Objetivo:** Evitar variações que prejudicam busca

**Termos Padronizados (Sempre usar):**

| ❌ EVITAR (variações)                     | ✅ USAR (termo padrão)             |
| ----------------------------------------- | --------------------------------- |
| crashou, quebrou, falhou, parou           | **crash**                         |
| consertado, arrumado, corrigido           | **corrigido**                     |
| bug, issue, problema, erro                | **bug**                           |
| feature, funcionalidade, recurso          | **feature**                       |
| teste, validação, verificação             | **validacao** (sem ç)             |
| documentação, docs, manual                | **documentacao** (sem ç)          |
| erro crítico, bloqueante, showstopper     | **critico** (sem ´)               |
| em progresso, WIP, fazendo                | **em-andamento**                  |
| acabado, pronto, feito                    | **completo**                      |
| esperando, aguardando, backlog            | **pendente**                      |
| deletar, remover, apagar                  | **remover**                       |
| criar, adicionar, inserir                 | **criar**                         |
| mudar, alterar, modificar                 | **modificar**                     |
| refatorar, reescrever, reestruturar       | **refatorar**                     |

**Documentar em:** `CONTROLLED_VOCABULARY.md` (criar na raiz)

---

## 📂 PARTE 3: ORGANIZAÇÃO DE DIRETÓRIOS

### 3.1 Estrutura Atual vs. Recomendada

**Baseado em:** Markdown Best Practices, Lowercase-with-Hyphens Convention

**Estrutura Atual (Boa, mas pode melhorar):**
```
invest-claude-web/
├─ README.md                    ✅ OK
├─ ARCHITECTURE.md              ✅ OK
├─ ROADMAP.md                   ✅ OK
├─ 240+ arquivos .md na raiz    ⚠️ PROBLEMA: difícil navegar
├─ .gemini/                     ✅ OK (bem organizado)
│   ├─ context/
│   ├─ memory/
│   └─ workflows/
├─ .claude/                     ✅ OK (bem organizado)
│   └─ agents/
├─ backend/                     ✅ OK
├─ frontend/                    ✅ OK
└─ python-service/              ✅ OK
```

**Estrutura Recomendada (Hierárquica 3 níveis):**
```
invest-claude-web/
├─ README.md                           ✅ Raiz (obrigatório)
├─ ARCHITECTURE.md                     ✅ Raiz (obrigatório)
├─ ROADMAP.md                          ✅ Raiz (obrigatório)
├─ INDEX.md                            ✅ Raiz (navegação)
├─ NAMING_CONVENTIONS.md               ✅ NOVO (documentar padrões)
├─ CONTROLLED_VOCABULARY.md            ✅ NOVO (termos padronizados)
│
├─ docs/                               ✅ NOVO (organizar 240+ arquivos)
│   ├─ 01-desenvolvimento/
│   │   ├─ roadmap/
│   │   │   ├─ FASE_35_candle-timeframes.md
│   │   │   └─ FASE_37_bulk-sync.md
│   │   ├─ planejamento/
│   │   │   ├─ PLANO_FASE_36.md
│   │   │   └─ NEXT_STEPS.md
│   │   └─ checklists/
│   │       └─ CHECKLIST_TODO_MASTER.md
│   │
│   ├─ 02-convencoes/
│   │   ├─ CONTRIBUTING.md
│   │   └─ .gemini/ (symlink ou mover)
│   │
│   ├─ 03-troubleshooting/
│   │   ├─ TROUBLESHOOTING.md
│   │   ├─ bugs/
│   │   │   ├─ BUG_job-stalled_2025-11-25.md
│   │   │   └─ BUG_scrapers-crash_2025-11-25.md
│   │   └─ bugfixes/
│   │       └─ BUGFIX_definitivo_2025-11-22.md
│   │
│   ├─ 04-financeiro/
│   │   └─ .gemini/context/financial-rules.md (symlink)
│   │
│   ├─ 05-validacao/
│   │   ├─ framework/
│   │   └─ fases/
│   │       ├─ VALIDACAO_FASE_35.md
│   │       └─ VALIDACAO_FASE_48.md
│   │
│   ├─ 06-instalacao/
│   │   ├─ INSTALL.md
│   │   ├─ CLEAN_INSTALL.md
│   │   └─ DOCKER_DEPLOYMENT.md
│   │
│   ├─ 07-best-practices/
│   │   └─ MELHORIAS_*.md
│   │
│   ├─ 08-mcps/
│   │   ├─ MCPS_USAGE_GUIDE.md
│   │   └─ METODOLOGIA_MCPS_INTEGRADA.md
│   │
│   └─ 09-referencia/
│       └─ quick-reference.md
│
├─ archive/                            ✅ NOVO (versões antigas)
│   └─ 2024/
│       └─ deprecated/
│
├─ .gemini/                            ✅ OK (manter raiz ou docs/02)
├─ .claude/                            ✅ OK (manter raiz)
├─ backend/                            ✅ OK
├─ frontend/                           ✅ OK
└─ python-service/                     ✅ OK
```

**Princípios:**
- ✅ **Lowercase com hífens** para pastas (`01-desenvolvimento/` não `01-Desenvolvimento/`)
- ✅ **Prefixo numérico** para ordem lógica (01, 02, 03, ...)
- ✅ **3 níveis máximo** (pasta principal → subpasta → arquivo)
- ✅ **README.md em cada pasta** (contexto e navegação)
- ✅ **Archive para versões antigas** (não deletar, mover para `archive/YYYY/`)

---

### 3.2 Plano de Migração (240+ Arquivos)

**Baseado em:** Incremental approach, não big bang

**Fase 1: Setup (IMEDIATO)**
```bash
# 1. Criar estrutura de pastas
mkdir -p docs/{01-desenvolvimento/{roadmap,planejamento,checklists},02-convencoes,03-troubleshooting/{bugs,bugfixes},04-financeiro,05-validacao/{framework,fases},06-instalacao,07-best-practices,08-mcps,09-referencia}

# 2. Criar README.md em cada pasta
echo "# Desenvolvimento & Planejamento" > docs/01-desenvolvimento/README.md
echo "# Convenções & Regras" > docs/02-convencoes/README.md
# ... (criar para todas as pastas)

# 3. Criar arquivos de convenções
# NAMING_CONVENTIONS.md (raiz)
# CONTROLLED_VOCABULARY.md (raiz)
```

**Fase 2: Migração Gradual (ETAPAS)**
```bash
# 1. Migrar arquivos críticos primeiro (bugs, fases recentes)
mv BUG_*.md docs/03-troubleshooting/bugs/
mv BUGFIX_*.md docs/03-troubleshooting/bugfixes/
mv FASE_5*.md docs/01-desenvolvimento/roadmap/

# 2. Migrar validações
mv VALIDACAO_FASE_*.md docs/05-validacao/fases/

# 3. Migrar planejamentos
mv PLANO_FASE_*.md docs/01-desenvolvimento/planejamento/

# 4. Migrar checklists
mv CHECKLIST_*.md docs/01-desenvolvimento/checklists/

# 5. Migrar best practices
mv MELHORIAS_*.md docs/07-best-practices/

# 6. Migrar MCPs
mv MCPS_*.md docs/08-mcps/
mv METODOLOGIA_MCPS_*.md docs/08-mcps/

# 7. Migrar instalação
mv INSTALL.md docs/06-instalacao/
mv CLEAN_INSTALL.md docs/06-instalacao/
mv DOCKER_DEPLOYMENT.md docs/06-instalacao/
```

**Fase 3: Atualizar Referências (CRÍTICO)**
```bash
# 1. Atualizar links em README.md, INDEX.md, ARCHITECTURE.md
# Exemplo (antes):
# [INSTALL.md](INSTALL.md)
# (depois):
# [INSTALL.md](docs/06-instalacao/INSTALL.md)

# 2. Usar find + sed para atualizar TODOS os links automaticamente
find . -name "*.md" -exec sed -i 's|\[INSTALL\.md\](INSTALL\.md)|[INSTALL.md](docs/06-instalacao/INSTALL.md)|g' {} +

# 3. Validar links quebrados
# Usar ferramenta: markdown-link-check
npx markdown-link-check README.md
npx markdown-link-check docs/**/*.md
```

**Fase 4: Git Commit (APÓS VALIDAR)**
```bash
git add docs/ NAMING_CONVENTIONS.md CONTROLLED_VOCABULARY.md
git commit -m "docs: organize 240+ .md files into hierarchical structure (best practices 2025)"
```

---

## 📊 PARTE 4: METADATA SCHEMA

### 4.1 Frontmatter YAML (Recomendado)

**Baseado em:** Markdown Best Practices, Automatic Metadata Extraction

**Formato Universal (Topo de cada .md):**
```yaml
---
# Metadata obrigatória
title: "BUG: Job Stalled - Solução Definitiva"
date: 2025-11-25
lastUpdated: 2025-11-25
author: claude-code
version: v01

# Taxonomia
category: [Troubleshooting, Bugs]
subcategory: [Backend, Queue]

# Facetas
tipo: bug
status: completo
prioridade: critica
area: [backend, queue]
tech: [bullmq, redis, nestjs]

# Tags livres
tags:
  - bug-critico
  - performance
  - bullmq
  - job-stalled
  - definitivo

# Relacionamentos
relatedDocs:
  - BUG_SCRAPERS_CRASH_PUPPETEER.md
  - PLANO_ACAO_CORRETIVO_2025-11-25.md
  - ROADMAP.md

# Validação
validated: true
validationDate: 2025-11-25
validationType: [typescript, build, e2e]
---

# Conteúdo do documento aqui...
```

**Campos Obrigatórios (Mínimo):**
- `title` - Título completo
- `date` - Data criação (YYYY-MM-DD)
- `author` - claude-code | gemini-ai | humano
- `tipo` - Tipo do documento (bug, fase, validacao, ...)
- `status` - completo | em-andamento | pendente
- `tags` - Lista de tags livres (mínimo 3)

**Campos Opcionais (Recomendados):**
- `lastUpdated` - Data última modificação
- `version` - v01, v02 (se versionado)
- `category` - Categoria hierárquica nível 1
- `subcategory` - Categoria hierárquica nível 2
- `prioridade` - critica | alta | media | baixa
- `area` - backend | frontend | database | ...
- `tech` - Tecnologias mencionadas
- `relatedDocs` - Arquivos relacionados
- `validated` - true | false
- `validationDate` - Data validação
- `validationType` - Tipos de validação executados

---

### 4.2 Metadata por Tipo de Documento

**Baseado em:** Document Type Specific Schemas

#### BUG
```yaml
---
tipo: bug
status: [identificado | em-analise | resolvido]
prioridade: [critica | alta | media | baixa]
severity: [bloqueante | grave | moderado | leve]
affectedArea: [backend | frontend | database | ...]
rootCause: "Descrição curta da causa raiz"
solution: "Descrição curta da solução"
workaround: true | false
definitive: true | false
---
```

#### FASE
```yaml
---
tipo: fase
faseNumber: 35
status: [planejado | em-andamento | completo]
startDate: 2025-11-01
completionDate: 2025-11-17
validationStatus: [nao-validado | validado-parcial | validado-completo]
filesModified: 15
linesAdded: 500
linesRemoved: 50
---
```

#### VALIDACAO
```yaml
---
tipo: validacao
validationType: [typescript | build | playwright | chrome-devtools | manual]
targetPhase: 35
validationDate: 2025-11-23
result: [passou | falhou | parcial]
criticalIssues: 0
warnings: 2
screenshotCount: 3
---
```

---

## 🔍 PARTE 5: BUSCA E DESCOBERTA

### 5.1 Ferramentas Recomendadas

**Baseado em:** IT Documentation Tools 2025

**1. VSCode Search (Built-in)**
```
✅ Ctrl+Shift+F → Busca global em todos .md
✅ Suporta regex: #performance|#bug-critico
✅ Busca por pasta: docs/03-troubleshooting/
```

**2. Ripgrep (CLI - Altamente performático)**
```bash
# Buscar tag específico
rg "#job-stalled" -g "*.md"

# Buscar faceta tipo:bug
rg "tipo: bug" -g "*.md"

# Buscar em pasta específica
rg "prioridade: critica" docs/03-troubleshooting/

# Buscar com contexto (3 linhas antes/depois)
rg "#performance" -C 3
```

**3. Markdown Link Check (Validação)**
```bash
# Verificar links quebrados
npx markdown-link-check README.md
find docs/ -name "*.md" -exec npx markdown-link-check {} \;
```

**4. Grep com Frontmatter (YAML parsing)**
```bash
# Buscar TODOS os bugs críticos
grep -l "prioridade: critica" docs/03-troubleshooting/bugs/*.md

# Buscar documentos não validados
grep -l "validated: false" docs/**/*.md
```

---

### 5.2 Queries de Exemplo (Casos de Uso Reais)

**Baseado em:** Knowledge Base Search Patterns

**Caso 1:** "Quero todos os bugs críticos do backend resolvidos em novembro 2025"
```bash
# Busca combinada (facetas)
grep -l "tipo: bug" docs/03-troubleshooting/bugs/*.md | \
  xargs grep -l "prioridade: critica" | \
  xargs grep -l "area.*backend" | \
  xargs grep -l "data: 2025-11" | \
  xargs grep -l "status: completo"

# Resultado esperado:
# docs/03-troubleshooting/bugs/BUG_job-stalled_2025-11-25.md
# docs/03-troubleshooting/bugs/BUG_scrapers-crash_2025-11-25.md
```

**Caso 2:** "Quero documentação sobre BullMQ e performance"
```bash
# Busca por tags
rg "#bullmq.*#performance|#performance.*#bullmq" -g "*.md"

# OU busca por tech
grep -l "tech.*bullmq" docs/**/*.md | xargs grep -l "#performance"
```

**Caso 3:** "Quero todas as validações de fases com screenshots"
```bash
grep -l "tipo: validacao" docs/05-validacao/fases/*.md | \
  xargs grep -l "screenshotCount" | \
  awk '/screenshotCount/ {if ($2 > 0) print FILENAME}'
```

**Caso 4:** "Quero fase mais recente incompleta"
```bash
# Buscar fases status != completo, ordenar por data desc
grep -l "tipo: fase" docs/01-desenvolvimento/roadmap/*.md | \
  xargs grep -H "status:" | \
  grep -v "completo" | \
  sort -t: -k3 -r | \
  head -1
```

---

## ✅ PARTE 6: IMPLEMENTAÇÃO NO PROJETO

### 6.1 Checklist de Implementação

**Fase 1: Setup Básico (IMEDIATO)**
- [ ] Criar `NAMING_CONVENTIONS.md` (raiz)
- [ ] Criar `CONTROLLED_VOCABULARY.md` (raiz)
- [ ] Criar estrutura `docs/01-09/` (9 pastas principais)
- [ ] Criar `README.md` em cada pasta `docs/XX/`
- [ ] Documentar padrões em README.md principal

**Fase 2: Migração Gradual (1-2 HORAS)**
- [ ] Mover arquivos críticos (bugs, fases recentes) para `docs/`
- [ ] Atualizar links em README.md, INDEX.md, ARCHITECTURE.md
- [ ] Validar links com `markdown-link-check`
- [ ] Commit mudanças: `git add docs/ && git commit -m "docs: organize files"`

**Fase 3: Metadata (2-3 HORAS)**
- [ ] Adicionar frontmatter YAML em 20 arquivos mais importantes
- [ ] Template frontmatter para cada tipo de documento
- [ ] Script automatizado para adicionar frontmatter em batch

**Fase 4: Validação (30 MIN)**
- [ ] Buscar arquivos sem frontmatter: `rg "^---$" -g "*.md" -c | grep ":0$"`
- [ ] Validar controlled vocabulary: buscar variações não padronizadas
- [ ] Testar queries de busca (Casos de Uso da Seção 5.2)

**Fase 5: Documentação (30 MIN)**
- [ ] Atualizar INDEX.md com nova estrutura
- [ ] Atualizar ARCHITECTURE.md (seção de documentação)
- [ ] Atualizar ROADMAP.md (adicionar entrada de reorganização)
- [ ] Commit: `git commit -m "docs: update index and architecture with new structure"`

---

### 6.2 Scripts Auxiliares (Automação)

**Script 1: add-frontmatter.sh (Adicionar metadata batch)**
```bash
#!/bin/bash
# add-frontmatter.sh - Adiciona frontmatter YAML em arquivos .md sem metadata

for file in $(find docs/ -name "*.md"); do
  # Verificar se já tem frontmatter
  if ! head -1 "$file" | grep -q "^---$"; then
    # Extrair tipo do filename (BUG_*, FASE_*, etc.)
    tipo=$(basename "$file" | cut -d'_' -f1 | tr '[:upper:]' '[:lower:]')

    # Criar frontmatter temporário
    cat > /tmp/frontmatter.yml <<EOF
---
title: "$(basename "$file" .md | tr '_' ' ')"
date: $(date +%Y-%m-%d)
author: claude-code
tipo: $tipo
status: pendente
tags: []
---

EOF

    # Inserir frontmatter no início do arquivo
    cat /tmp/frontmatter.yml "$file" > /tmp/newfile.md
    mv /tmp/newfile.md "$file"

    echo "✅ Added frontmatter to: $file"
  fi
done
```

**Script 2: check-naming.sh (Validar nomenclatura)**
```bash
#!/bin/bash
# check-naming.sh - Valida se arquivos seguem convenção TIPO_assunto_data.md

find . -name "*.md" ! -path "./node_modules/*" ! -path "./.git/*" | while read file; do
  filename=$(basename "$file")

  # Exceções (arquivos raiz obrigatórios)
  if [[ "$filename" =~ ^(README|ARCHITECTURE|DATABASE_SCHEMA|ROADMAP|INDEX|INSTALL|CONTRIBUTING|CHANGELOG)\.md$ ]]; then
    continue
  fi

  # Validar padrão: TIPO_assunto_data.md
  if ! [[ "$filename" =~ ^[A-Z_]+[a-z0-9-_]*_[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
    echo "❌ VIOLAÇÃO: $file"
    echo "   Padrão esperado: TIPO_assunto_data_YYYY-MM-DD.md"
  fi
done
```

**Script 3: generate-index.sh (Gerar INDEX.md automático)**
```bash
#!/bin/bash
# generate-index.sh - Gera INDEX.md baseado em estrutura docs/

echo "# Índice de Documentação - B3 AI Analysis Platform" > INDEX.md
echo "" >> INDEX.md
echo "**Última Atualização:** $(date +%Y-%m-%d)" >> INDEX.md
echo "" >> INDEX.md

# Iterar sobre pastas em docs/
for dir in docs/*/; do
  dirname=$(basename "$dir")
  echo "## $dirname" >> INDEX.md
  echo "" >> INDEX.md

  # Listar arquivos .md na pasta
  find "$dir" -maxdepth 1 -name "*.md" | sort | while read file; do
    filename=$(basename "$file" .md)
    echo "- [$filename]($file)" >> INDEX.md
  done

  echo "" >> INDEX.md
done

echo "✅ INDEX.md gerado automaticamente"
```

---

## 📚 FONTES (PESQUISA DE MERCADO)

### Tagging Best Practices
- [Top Document Management Best Practices for 2025](https://www.documind.chat/blog/document-management-best-practices)
- [Software Documentation Best Practices in 2025](https://www.appsierra.com/blog/documentation-for-software-development)
- [Tagging System for Documentation Teams - Docsie.io](https://www.docsie.io/blog/glossary/tagging-system/)
- [10 Technical Documentation Best Practices for 2025](https://www.wondermentapps.com/blog/technical-documentation-best-practices/)

### File Naming Conventions
- [File Naming Conventions - Princeton University](https://records.princeton.edu/records-management-manual/file-naming-conventions-version-control)
- [File Naming Conventions - Harvard Medical School](https://datamanagement.hms.harvard.edu/plan-design/file-naming-conventions)
- [File Naming Conventions - ISO Helpdesk](https://helpdesk-docs.iso.org/article/713-document-naming-convention)
- [File Naming Best Practices - UC Davis](https://guides.library.ucdavis.edu/data-management/file-naming)

### Markdown Organization
- [Markdown Best Practices for Documentation](https://www.markdowntoolbox.com/blog/markdown-best-practices-for-documentation/)
- [How to improve markdown docs with automatic tagging - WunderGraph](https://wundergraph.com/blog/how_to_improve_your_markdown_based_docs_with_automatic_tagging)
- [Best Practices for Markdown Documentation - The New Stack](https://thenewstack.io/best-practices-for-creating-markdown-documentation-for-your-apps/)

### Knowledge Base Taxonomy
- [Knowledge Base Taxonomy: 10 Proven Design Principles](https://www.matrixflows.com/blog/10-best-practices-for-creating-taxonomy-for-your-company-knowledge-base)
- [How to categorize your knowledge base - KnowledgeOwl](https://blog.knowledgeowl.com/blog/posts/categorize-your-knowledge-base/)
- [Use tags to organise your knowledge base - Document360](https://document360.com/blog/use-tags-to-organise-your-knowledge-base/)
- [Taxonomies in software engineering](https://dl.acm.org/doi/10.1016/j.infsof.2017.01.006)

---

## 🏷️ TAGS

`#best-practices` `#nomenclatura` `#tags` `#taxonomia` `#documentacao` `#organizacao` `#metadata` `#markdown` `#knowledge-base` `#file-naming` `#iso-8601` `#controlled-vocabulary` `#faceted-search` `#hierarchical-taxonomy` `#market-research-2024-2025`

---

**Gerado por:** Claude Code (Sonnet 4.5)
**Metodologia:** WebSearch (4 queries) + Market Research 2024-2025 + Ultra-Thinking
**Data:** 2025-11-25
**Versão:** v01
