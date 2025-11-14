# CHECKLIST & TODO MASTER - B3 AI Analysis Platform

**Data de Criação:** 2025-11-14
**Responsável:** Claude Code (Sonnet 4.5)
**Versão:** 1.0.0
**Status:** 🔄 EM ANDAMENTO

---

## 📋 ÍNDICE

1. [Princípios Obrigatórios](#princípios-obrigatórios)
2. [Estado Atual do Sistema](#estado-atual-do-sistema)
3. [Planejamentos Ativos](#planejamentos-ativos)
4. [Checklist de Validação Universal](#checklist-de-validação-universal)
5. [TODO - Reorganização Documentação (ATUAL)](#todo-reorganização-documentação)
6. [TODO - Sistema Reports (PRÓXIMO)](#todo-sistema-reports)
7. [TODO - Validação Frontend (PRÓXIMO)](#todo-validação-frontend)
8. [Workflows de Validação](#workflows-de-validação)
9. [Comandos Rápidos](#comandos-rápidos)

---

## ⚖️ PRINCÍPIOS OBRIGATÓRIOS

### 1. Regra de Ouro: NÃO AVANÇAR COM PROBLEMAS

```
❌ PROIBIDO avançar para próxima fase/etapa se a atual tiver:
   - Erros
   - Falhas
   - Warnings
   - Bugs
   - Divergências
   - Inconsistências
   - Problemas não-bloqueantes
   - Oportunidades de melhoria não implementadas
   - Itens incompletos

✅ OBRIGATÓRIO: 100% de completude antes de avançar
```

### 2. Validação Antes de Mudança

```
SEMPRE verificar ANTES de qualquer mudança:
✅ Dependências (imports, relacionamentos)
✅ Integrações (API calls, WebSocket, Database)
✅ Arquivos relacionados (componentes, hooks, services)
✅ Documentação existente (pode estar desatualizada)
✅ Código fonte (verdade absoluta vs docs)
```

### 3. Git Sempre Atualizado

```
✅ Branch main sempre sincronizada
✅ Commits detalhados com co-autoria Claude
✅ Push após cada fase completa
✅ Ready para deploy no Claude Code Web a qualquer momento
```

### 4. Documentação Sempre Atualizada

```
✅ claude.md - Instruções para Claude Code
✅ README.md - Documentação pública
✅ Arquivos de validação - Criar após cada fase
✅ Screenshots - Evidências visuais
```

### 5. Melhores Práticas do Mercado

```
✅ Pesquisar melhores práticas ANTES de implementar
✅ Usar soluções comprovadas e modernas
✅ Simplicidade > Complexidade
✅ Arquitetura definida > Improvisação
```

### 6. Validação Ultra-Robusta

```
✅ MCP Triplo: Playwright + Chrome DevTools + Sequential Thinking
✅ React Developer Tools
✅ Testes minuciosos e detalhados
✅ Screenshots de todas as validações
```

### 7. Dados Reais (Não Mocks)

```
✅ SEMPRE usar dados coletados dos scrapers
❌ NUNCA usar dados mockados/hardcoded
✅ Validar que scrapers estão funcionando
```

### 8. System Manager

```
✅ Usar system-manager.ps1 para gerenciar ambiente
✅ Atualizar script se necessário
✅ Manter completo e funcional
```

### 9. Problemas Crônicos

```
✅ Corrigir em definitivo
✅ Seguir arquitetura definida
✅ Não criar workarounds temporários
✅ Documentar solução aplicada
```

### 10. Verificar Código Fonte > Documentação

```
⚠️ Documentação pode estar desatualizada
✅ SEMPRE ler arquivos reais antes de planejar
✅ Comparar código vs documentação
✅ Atualizar docs se divergentes
```

### 11. Reiniciar Serviços Antes de Testar

```
✅ Verificar uptime dos containers
✅ Reiniciar backend se mudou código backend
✅ Reiniciar frontend se mudou código frontend
✅ Aguardar status "healthy" antes de testar
```

---

## 🔍 ESTADO ATUAL DO SISTEMA

### Git Status (2025-11-14 15:50)

```
Branch: main
Status: Ahead of origin/main by 1 commit
Último commit: 6d16d69 - fix: Corrigir bug de ticker hardcoded
Arquivos não rastreados:
  - PLANO_REORGANIZACAO_CLAUDE_README.md (NOVO)
```

**Ação Necessária:** ✅ Commit do plano + Push

---

### Docker Containers Status

| Container | Status | Uptime | Observação |
|-----------|--------|--------|------------|
| invest_backend | ✅ healthy | 7 minutos | ⚠️ Reiniciado recentemente |
| invest_frontend | ✅ healthy | 6 horas | ✅ OK |
| invest_postgres | ✅ healthy | 2 dias | ✅ OK |
| invest_redis | ✅ healthy | 2 dias | ✅ OK |
| invest_scrapers | ✅ healthy | 2 dias | ✅ OK |
| invest_api_service | ✅ healthy | 2 dias | ✅ OK |
| invest_orchestrator | ✅ healthy | 2 dias | ✅ OK |

**Observação:** Backend foi reiniciado há 7 minutos (após commit 6d16d69). Frontend há 6 horas.

**Ação Necessária:** ✅ Aguardar 2-3 minutos para estabilização completa antes de testes.

---

### Arquivos de Planejamento Existentes

**Total:** 34 arquivos de validação + 3 arquivos de planejamento

**Planejamentos Ativos:**
1. ✅ **PLANO_REORGANIZACAO_CLAUDE_README.md** (NOVO - criado hoje)
   - Reorganizar claude.md (2001 → 200 linhas)
   - Reorganizar README.md (799 → 600 linhas)
   - Criar 6 novos arquivos separados

2. ⏸️ **REFATORACAO_SISTEMA_REPORTS.md**
   - Status: FASES 1-6 completas (100%)
   - Última validação: VALIDACAO_FASE_6_REPORTS_COMPLETA.md

3. ⏸️ **REFATORACAO_BOTAO_SOLICITAR_ANALISES.md**
   - Status: Planejado, não iniciado

**Validações Recentes:**
- VALIDACAO_FASE_21_ACESSIBILIDADE.md (2025-11-13) ✅ FINAL
- VALIDACAO_FASE_20_ESTADOS_TRANSICOES.md (2025-11-13) ✅
- VALIDACAO_FASE_19_INTEGRACOES.md (2025-11-13) ✅ 80%
- VALIDACAO_FASE_18_TYPESCRIPT.md (2025-11-13) ✅
- VALIDACAO_MCP_TRIPLO_COMPLETA.md (2025-11-14) ✅ 100%

---

### Fases do Roadmap (claude.md)

**Fases Completas:**
- ✅ FASE 1-21: Frontend validado 100% (12-21 = Validação completa)
- ✅ FASE 22: Sistema de Atualização de Ativos 100%
- ✅ FASE 22.5: Correções Portfolio 100%
- ✅ FASE 3: Refatoração Reports (Fases 1-6) 100%
- ✅ FASE 23: Sistema de Métricas de Scrapers 100%
- ✅ Validação MCP Triplo 100%

**Fases Planejadas:**
- 📋 FASE 24: Dados Históricos BRAPI (planejado)
- 📋 FASE 25: Refatoração Botão "Solicitar Análises" (aguardando aprovação)
- 📋 FASE 26+: Features futuras

---

## 📚 PLANEJAMENTOS ATIVOS

### 1. PLANO_REORGANIZACAO_CLAUDE_README.md (PRIORIDADE MÁXIMA)

**Objetivo:** Reorganizar claude.md e README.md seguindo melhores práticas oficiais

**Problema Crítico:**
- claude.md: 2001 linhas (10x acima do recomendado de 100-200)
- README.md: 799 linhas (pode melhorar organização)

**Solução:**
- Reduzir claude.md para ~200 linhas (90% de redução)
- Criar 6 arquivos separados (DATABASE_SCHEMA.md, ARCHITECTURE.md, ROADMAP.md, etc.)
- Melhorar README.md (badges, screenshots, estrutura)

**Status:** 📋 PLANEJADO, NÃO INICIADO

---

### 2. REFATORACAO_SISTEMA_REPORTS.md (COMPLETO)

**Status:** ✅ FASES 1-6 COMPLETAS (100%)

**Fases:**
- ✅ FASE 1: Limpeza de Dados (Backend) - 100%
- ✅ FASE 2: Novo Endpoint Backend - 100%
- ✅ FASE 3: Refatorar Frontend /reports - 100%
- ✅ FASE 4: Connect Detail Page /reports/[id] - 100%
- ✅ FASE 5: Downloads (PDF/JSON) - 100%
- ✅ FASE 6: Testes E2E e Validação Final - 100%

**Última Validação:** VALIDACAO_FASE_6_REPORTS_COMPLETA.md

**Bugs Corrigidos:**
- BUG #1: Botões "Solicitar Análise" desabilitam todos ✅
- BUG #2: Botão desaparece após análise ✅

**Ação:** ✅ COMPLETO - Nenhuma ação pendente

---

### 3. VALIDACAO_FRONTEND_COMPLETA.md (COMPLETO)

**Status:** ✅ FASES 12-21 COMPLETAS (100%)

**Fases Validadas:**
- ✅ FASE 12: Responsividade (mobile, tablet, desktop)
- ✅ FASE 13: Navegação (links, breadcrumbs, sidebar)
- ✅ FASE 14: Performance (loading, lazy, caching)
- ✅ FASE 15: Network (requests, errors, retries)
- ✅ FASE 16: Console (0 erros, 0 warnings)
- ✅ FASE 17: Browser Compatibility (Chrome, Firefox, Edge)
- ✅ FASE 18: TypeScript (0 erros, strict mode)
- ✅ FASE 19: Integrações Complexas (WebSocket, OAuth) - 80%
- ✅ FASE 20: Estados e Transições (loading, success, error)
- ✅ FASE 21: Acessibilidade (WCAG AA) ⭐ FINAL

**Páginas Validadas:** 7 (Dashboard, Assets, Analysis, Portfolio, Reports, Data Sources, Settings)

**Ação:** ✅ COMPLETO - Nenhuma ação pendente

---

## ✅ CHECKLIST DE VALIDAÇÃO UNIVERSAL

### Antes de QUALQUER mudança (OBRIGATÓRIO)

```
PRÉ-MUDANÇA:
□ Ler arquivo(s) a ser(em) modificado(s)
□ Ler arquivos relacionados (imports, dependências)
□ Verificar documentação relacionada
□ Comparar código vs documentação (identificar divergências)
□ Identificar todos os arquivos afetados
□ Verificar integrações (API, DB, WebSocket)
□ Pesquisar melhores práticas (se aplicável)
□ Criar planejamento (se > 100 linhas ou > 3 arquivos)
```

### Durante implementação (OBRIGATÓRIO)

```
ULTRA-THINKING:
□ Analisar impacto completo
□ Planejar mudanças (documento se necessário)
□ Validar dependências

TODOWRITE:
□ Criar TODO com etapas granulares
□ Manter apenas 1 etapa in_progress
□ Marcar completed imediatamente após concluir
□ NUNCA acumular etapas antes de marcar

IMPLEMENTAÇÃO:
□ Seguir arquitetura definida
□ Usar dados reais (não mocks)
□ Código limpo e documentado
```

### Após implementação (OBRIGATÓRIO)

```
VALIDAÇÃO TÉCNICA:
□ TypeScript (backend): npx tsc --noEmit → 0 erros
□ TypeScript (frontend): npx tsc --noEmit → 0 erros
□ Build (backend): npm run build → Success
□ Build (frontend): npm run build → Success (17 páginas)
□ Lint: 0 problemas críticos
□ Testes unitários: Passando (se aplicável)
□ Testes E2E: Passando (se aplicável)
```

### Validação Frontend (OBRIGATÓRIO se mudou UI)

```
REINICIAR SERVIÇOS:
□ Verificar uptime containers (docker ps)
□ Se backend mudou: docker restart invest_backend
□ Se frontend mudou: docker restart invest_frontend
□ Aguardar status "healthy" (30-60s)

MCP TRIPLO (3 janelas paralelas):
□ Janela 1: Playwright MCP (navegação + screenshots)
□ Janela 2: Chrome DevTools MCP (console + network)
□ Janela 3: Sequential Thinking MCP (análise profunda)

VALIDAÇÕES:
□ Console: 0 erros, 0 warnings
□ Network: Requests OK, CORS OK, Status codes corretos
□ Visual: Layout OK, Responsivo OK
□ Funcional: Botões OK, Forms OK, Navigation OK
□ Performance: Load time < 2s
□ Acessibilidade: WCAG AA (se nova página)

REACT DEV TOOLS:
□ Component tree OK
□ Props OK
□ State OK
□ Hooks OK

SCREENSHOTS:
□ Tirar screenshots de TODAS as validações
□ Salvar em validation-screenshots/
□ Nomear: fase-X-descricao.png
```

### Documentação (OBRIGATÓRIO)

```
ATUALIZAR:
□ claude.md (se mudou arquitetura, workflow, comandos)
□ README.md (se mudou features, instalação, uso)
□ Arquivo de validação (VALIDACAO_FASE_X.md)
□ Screenshots (evidências visuais)
□ ROADMAP (atualizar status de fases)
```

### Git (OBRIGATÓRIO)

```
COMMIT:
□ git add (arquivos modificados)
□ git commit -m "tipo: descrição\n\n<corpo detalhado>\n\nCo-Authored-By: Claude <noreply@anthropic.com>"
□ Mensagem detalhada (problema, solução, arquivos, validação, impacto)

PUSH:
□ git status → working tree clean
□ git log → commit aparece
□ git push → sucesso
□ Verificar GitHub → branch atualizada
```

### Validação Final (OBRIGATÓRIO)

```
CHECKLIST FINAL:
□ 0 erros TypeScript
□ 0 erros Build
□ 0 erros Console (páginas principais)
□ 0 warnings críticos
□ 0 problemas não-bloqueantes
□ 0 itens incompletos
□ 100% de funcionalidades testadas
□ Documentação 100% atualizada
□ Git 100% sincronizado
□ Screenshots 100% salvos

CRITÉRIO DE APROVAÇÃO:
□ Tudo acima = ✅ (SIM) → Pode avançar para próxima fase
□ Qualquer item = ❌ (NÃO) → Corrigir ANTES de avançar
```

---

## 📋 TODO - REORGANIZAÇÃO DOCUMENTAÇÃO (PRIORIDADE MÁXIMA)

### Status Geral
- **Fase Atual:** PRÉ-FASE 1
- **Progresso:** 0% (Planejamento criado, implementação não iniciada)
- **Estimativa:** 3-4 horas (total de todas as fases)

---

### PRÉ-FASE 1: Preparação e Validação Inicial

**Objetivo:** Garantir ambiente limpo e pronto para reorganização

```
□ Commit PLANO_REORGANIZACAO_CLAUDE_README.md
□ Push branch main
□ Verificar git status clean
□ Verificar containers healthy
□ Criar backup de claude.md (cp claude.md claude.md.backup)
□ Criar backup de README.md (cp README.md README.md.backup)
□ Validar TypeScript (backend + frontend) → 0 erros
□ Validar Build (backend + frontend) → Success
```

**Critério de Aprovação:** ✅ Todos os itens acima concluídos

---

### FASE 1: Criar Arquivos Separados (DATABASE_SCHEMA.md)

**Objetivo:** Extrair schema de banco do claude.md para arquivo separado

**Análise Prévia (OBRIGATÓRIO):**
```
□ Ler claude.md linhas 319-424 (seção completa)
□ Identificar conteúdo exato a ser extraído
□ Verificar se há referências a essa seção em outros arquivos
□ Planejar estrutura de DATABASE_SCHEMA.md
```

**Implementação:**
```
□ Criar DATABASE_SCHEMA.md
  - Seções: Entidades, Relacionamentos, Indexes, Migrations, Seeds
  - Incluir exemplos de queries
  - Incluir diagrama ER (texto ou mermaid)
□ Copiar conteúdo de claude.md linhas 319-424
□ Formatar e melhorar estrutura
□ Adicionar informações extras se necessário
```

**Validação:**
```
□ DATABASE_SCHEMA.md criado (estimar ~150-200 linhas)
□ Conteúdo completo e bem formatado
□ Markdown válido (sem erros de sintaxe)
□ Leitura clara e navegável
```

**Documentação:**
```
□ Adicionar referência em claude.md: "Ver DATABASE_SCHEMA.md"
□ Adicionar em README.md seção "Documentação Técnica"
```

**Git:**
```
□ git add DATABASE_SCHEMA.md claude.md README.md
□ git commit -m "docs: Criar DATABASE_SCHEMA.md - extrair schema do claude.md"
□ git push
```

**Critério de Aprovação:** ✅ Arquivo criado, referenciado, commitado e pushed

---

### FASE 2: Criar Arquivos Separados (ARCHITECTURE.md)

**Objetivo:** Extrair arquitetura e fluxos do claude.md

**Análise Prévia (OBRIGATÓRIO):**
```
□ Ler claude.md linhas 42-92 (Arquitetura Geral + Camadas)
□ Ler claude.md linhas 563-625 (Fluxos Principais)
□ Identificar conteúdo exato a ser extraído
□ Verificar referências em outros arquivos
□ Planejar estrutura de ARCHITECTURE.md
```

**Implementação:**
```
□ Criar ARCHITECTURE.md
  - Seções: Visão Geral, Arquitetura Geral, Camadas, Fluxos, Integrações
  - Incluir diagramas (mermaid ou ASCII art)
  - Incluir exemplos de fluxos (sync, analysis, bulk)
□ Copiar e adaptar conteúdo relevante
□ Melhorar estrutura e adicionar detalhes
```

**Validação:**
```
□ ARCHITECTURE.md criado (estimar ~300-400 linhas)
□ Conteúdo completo com diagramas
□ Markdown válido
□ Leitura clara e navegável
```

**Documentação:**
```
□ Adicionar referência em claude.md
□ Adicionar em README.md
```

**Git:**
```
□ git add ARCHITECTURE.md claude.md README.md
□ git commit -m "docs: Criar ARCHITECTURE.md - extrair arquitetura do claude.md"
□ git push
```

**Critério de Aprovação:** ✅ Arquivo criado, referenciado, commitado e pushed

---

### FASE 3: Criar Arquivos Separados (ROADMAP.md)

**Objetivo:** Extrair roadmap completo do claude.md

**Análise Prévia (OBRIGATÓRIO):**
```
□ Ler claude.md linhas 802-1400 (Roadmap completo)
□ Identificar todas as fases (1-26+)
□ Verificar documentos de validação existentes (34 arquivos)
□ Planejar estrutura de ROADMAP.md
```

**Implementação:**
```
□ Criar ROADMAP.md
  - Seções: Índice, Status Geral, Fases Completas (1-23), Fases Planejadas (24-26+)
  - Incluir links para documentos de validação
  - Incluir métricas de progresso
  - Incluir timeline
□ Copiar todo o roadmap de claude.md
□ Organizar por categoria (Backend, Frontend, Validação, etc.)
□ Adicionar badges de status (✅, 🔄, 📋)
```

**Validação:**
```
□ ROADMAP.md criado (estimar ~600-800 linhas)
□ Todas as 26+ fases documentadas
□ Links para documentos de validação funcionando
□ Markdown válido
```

**Documentação:**
```
□ Adicionar referência em claude.md
□ Adicionar em README.md
```

**Git:**
```
□ git add ROADMAP.md claude.md README.md
□ git commit -m "docs: Criar ROADMAP.md - extrair roadmap do claude.md"
□ git push
```

**Critério de Aprovação:** ✅ Arquivo criado, referenciado, commitado e pushed

---

### FASE 4: Criar Arquivos Separados (TROUBLESHOOTING.md)

**Objetivo:** Extrair troubleshooting do claude.md

**Análise Prévia (OBRIGATÓRIO):**
```
□ Ler claude.md linhas 1400-1550 (Troubleshooting)
□ Identificar todos os problemas documentados (6+)
□ Verificar se há outros problemas em issues/commits
□ Planejar estrutura de TROUBLESHOOTING.md
```

**Implementação:**
```
□ Criar TROUBLESHOOTING.md
  - Seções: Índice, Backend, Frontend, Docker, Scrapers, Database
  - Para cada problema: Sintomas, Causa, Solução passo-a-passo
  - Incluir comandos de debug
□ Copiar problemas de claude.md
□ Adicionar novos problemas (se identificados)
□ Melhorar soluções com comandos específicos
```

**Validação:**
```
□ TROUBLESHOOTING.md criado (estimar ~200-300 linhas)
□ Todos os problemas documentados
□ Soluções testáveis e claras
□ Markdown válido
```

**Documentação:**
```
□ Adicionar referência em claude.md
□ Adicionar em README.md
```

**Git:**
```
□ git add TROUBLESHOOTING.md claude.md README.md
□ git commit -m "docs: Criar TROUBLESHOOTING.md - extrair troubleshooting do claude.md"
□ git push
```

**Critério de Aprovação:** ✅ Arquivo criado, referenciado, commitado e pushed

---

### FASE 5: Criar Arquivos Separados (CONTRIBUTING.md)

**Objetivo:** Criar guia de contribuição (extrair metodologia do README.md)

**Análise Prévia (OBRIGATÓRIO):**
```
□ Ler README.md linhas 515-713 (Metodologia)
□ Ler METODOLOGIA_MCPS_INTEGRADA.md (metodologia completa)
□ Identificar conteúdo para CONTRIBUTING.md
□ Planejar estrutura
```

**Implementação:**
```
□ Criar CONTRIBUTING.md
  - Seções: Como Contribuir, Metodologia, Code Style, Git Workflow, Pull Requests
  - Incluir resumo de Ultra-Thinking + TodoWrite + MCPs
  - Incluir 25 regras de ouro
  - Incluir checklist de validação
□ Adaptar conteúdo de README.md
□ Resumir METODOLOGIA_MCPS_INTEGRADA.md
□ Adicionar exemplos práticos
```

**Validação:**
```
□ CONTRIBUTING.md criado (estimar ~300-400 linhas)
□ Conteúdo claro para novos contribuidores
□ Markdown válido
```

**Documentação:**
```
□ Adicionar referência em claude.md
□ Adicionar em README.md
```

**Git:**
```
□ git add CONTRIBUTING.md claude.md README.md
□ git commit -m "docs: Criar CONTRIBUTING.md - guia de contribuição"
□ git push
```

**Critério de Aprovação:** ✅ Arquivo criado, referenciado, commitado e pushed

---

### FASE 6: Criar Arquivos Separados (INSTALL.md)

**Objetivo:** Criar guia de instalação detalhado (extrair do README.md)

**Análise Prévia (OBRIGATÓRIO):**
```
□ Ler README.md linhas 171-282 (Getting Started)
□ Verificar system-manager.ps1 (comandos de instalação)
□ Identificar todos os métodos de instalação
□ Planejar estrutura de INSTALL.md
```

**Implementação:**
```
□ Criar INSTALL.md
  - Seções: Requisitos, Instalação (Docker/Local), Configuração, Troubleshooting
  - Incluir 3 métodos: Script automatizado, Docker manual, Local
  - Incluir verificação de instalação
  - Incluir primeiros passos
□ Expandir conteúdo de README.md
□ Adicionar troubleshooting de instalação
```

**Validação:**
```
□ INSTALL.md criado (estimar ~250-350 linhas)
□ 3 métodos de instalação documentados
□ Comandos testáveis
□ Markdown válido
```

**Documentação:**
```
□ Adicionar referência em claude.md
□ Adicionar em README.md
```

**Git:**
```
□ git add INSTALL.md claude.md README.md
□ git commit -m "docs: Criar INSTALL.md - guia de instalação detalhado"
□ git push
```

**Critério de Aprovação:** ✅ Arquivo criado, referenciado, commitado e pushed

---

### FASE 7: Reescrever claude.md (2001 → 200 linhas)

**Objetivo:** Reescrever claude.md seguindo melhores práticas Anthropic (100-200 linhas)

**Análise Prévia (OBRIGATÓRIO):**
```
□ Revisar PLANO_REORGANIZACAO_CLAUDE_README.md (estrutura proposta)
□ Verificar todos os 6 arquivos criados (DATABASE_SCHEMA, ARCHITECTURE, ROADMAP, TROUBLESHOOTING, CONTRIBUTING, INSTALL)
□ Confirmar que TODO conteúdo foi extraído
□ Planejar nova estrutura de claude.md
```

**Implementação:**
```
□ Criar claude.md.new (nova versão)
  - Seção 1: Quick Reference (Tech Stack, Structure, Ports) - ~30 linhas
  - Seção 2: Quick Commands (Dev, Testing, Validation) - ~40 linhas
  - Seção 3: Code Style & Conventions (Naming, Git) - ~30 linhas
  - Seção 4: Metodologia OBRIGATÓRIA (Ultra-Thinking + TodoWrite + MCPs) - ~50 linhas
  - Seção 5: Documentação Detalhada (Links para arquivos) - ~20 linhas
  - Seção 6: DO NOT / Restrictions - ~20 linhas
  - Seção 7: Current Project Status - ~10 linhas
□ Manter APENAS informações que impactam decisões de código
□ Usar ênfase: "IMPORTANT", "YOU MUST", "NEVER"
□ Testar leitura (simular Claude Code)
```

**Validação:**
```
□ claude.md.new criado (150-200 linhas ✅)
□ Conteúdo conciso e acionável
□ Todas as seções obrigatórias presentes
□ Markdown válido
□ Fácil leitura (< 2 minutos)
```

**Testes:**
```
□ Comparar claude.md vs claude.md.new
□ Verificar que TODO conteúdo importante está em claude.md.new OU em arquivos separados
□ Ler claude.md.new como se fosse Claude Code
□ Identificar gaps (informações faltantes)
```

**Implementação Final:**
```
□ Renomear claude.md → claude.md.old
□ Renomear claude.md.new → claude.md
```

**Git:**
```
□ git add claude.md claude.md.old
□ git commit -m "refactor: Reorganizar claude.md seguindo best practices Anthropic - reduzir de 2001 para 200 linhas"
□ git push
```

**Critério de Aprovação:**
```
✅ claude.md tem 150-200 linhas
✅ TODO conteúdo importante preservado (em claude.md ou arquivos separados)
✅ Fácil leitura e navegação
✅ Commitado e pushed
```

---

### FASE 8: Melhorar README.md (799 → 600 linhas)

**Objetivo:** Melhorar README.md seguindo melhores práticas GitHub

**Análise Prévia (OBRIGATÓRIO):**
```
□ Ler README.md completo
□ Verificar CONTRIBUTING.md e INSTALL.md criados
□ Planejar melhorias (badges, screenshots, simplificação)
```

**Implementação - Parte 1: Badges**
```
□ Adicionar badges no topo:
  - Build Status
  - TypeScript Version
  - Next.js Version
  - NestJS Version
  - License
  - Node Version
```

**Implementação - Parte 2: Screenshots**
```
□ Criar pasta docs/screenshots/ (se não existe)
□ Tirar screenshots:
  - Dashboard principal
  - Portfolio page
  - Analysis page
  - Reports page
  - Data Sources page
□ Adicionar seção "Screenshots" após "Características"
```

**Implementação - Parte 3: Simplificar Getting Started**
```
□ Manter apenas "Quick Start" (Docker comando único)
□ Remover instalação detalhada (já está em INSTALL.md)
□ Adicionar link: "Ver INSTALL.md para instalação completa"
```

**Implementação - Parte 4: Resumir Metodologia**
```
□ Remover detalhes de metodologia (linhas 515-713)
□ Adicionar resumo curto (3-4 parágrafos)
□ Adicionar link: "Ver CONTRIBUTING.md para metodologia completa"
```

**Implementação - Parte 5: Reorganizar Estrutura**
```
□ Estrutura final:
  - Título + Badges
  - Descrição (O que é, diferencial)
  - Screenshots
  - Características
  - Quick Start (Docker)
  - Documentação (Links organizados)
  - Tecnologias (Stack resumido)
  - Status do Projeto (Métricas)
  - Contribuindo (Link para CONTRIBUTING.md)
  - Licença
  - Suporte
```

**Validação:**
```
□ README.md atualizado (~600 linhas)
□ Badges adicionados e funcionando
□ Screenshots adicionados (5+)
□ Links para CONTRIBUTING.md e INSTALL.md funcionando
□ Markdown válido
```

**Git:**
```
□ git add README.md docs/screenshots/
□ git commit -m "docs: Reorganizar README.md - adicionar badges, screenshots e simplificar estrutura"
□ git push
```

**Critério de Aprovação:**
```
✅ README.md melhorado (~600 linhas)
✅ Badges visíveis
✅ Screenshots presentes
✅ Links funcionando
✅ Commitado e pushed
```

---

### FASE 9: Validação Final e Documentação

**Objetivo:** Validar reorganização completa e criar documento de validação

**Validação Técnica:**
```
□ TypeScript (backend): npx tsc --noEmit → 0 erros
□ TypeScript (frontend): npx tsc --noEmit → 0 erros
□ Build (backend): npm run build → Success
□ Build (frontend): npm run build → Success (17 páginas)
□ Git status: working tree clean
□ Git log: todos os commits presentes
□ GitHub: branch sincronizada
```

**Validação de Arquivos:**
```
□ DATABASE_SCHEMA.md existe e está completo
□ ARCHITECTURE.md existe e está completo
□ ROADMAP.md existe e está completo
□ TROUBLESHOOTING.md existe e está completo
□ CONTRIBUTING.md existe e está completo
□ INSTALL.md existe e está completo
□ claude.md tem 150-200 linhas
□ README.md tem ~600 linhas
□ Todos os links entre documentos funcionando
```

**Validação de Conteúdo:**
```
□ Comparar claude.md.old vs claude.md.new
□ Verificar que NADA foi perdido
□ Verificar que conteúdo está em arquivos corretos
□ Testar navegação entre documentos
```

**Criar Documento de Validação:**
```
□ Criar VALIDACAO_REORGANIZACAO_DOCUMENTACAO.md
  - Resumo executivo
  - Arquivos criados (6)
  - Arquivos modificados (2)
  - Comparação antes/depois (linhas, organização)
  - Validação técnica (TypeScript, Build, Git)
  - Screenshots dos novos arquivos
  - Conclusões
```

**Git Final:**
```
□ git add VALIDACAO_REORGANIZACAO_DOCUMENTACAO.md
□ git commit -m "docs: Validação completa da reorganização de documentação"
□ git push
```

**Critério de Aprovação:**
```
✅ Todos os itens de validação acima = ✅
✅ Documento de validação criado
✅ 0 erros em TODAS as validações
✅ Git 100% sincronizado
```

---

### RESUMO FASE REORGANIZAÇÃO DOCUMENTAÇÃO

**Total de Fases:** 9
**Arquivos Criados:** 7 (6 novos + 1 validação)
**Arquivos Modificados:** 2 (claude.md, README.md)
**Estimativa Total:** 3-4 horas
**Redução Total:** 2800 → 800 linhas (71%)

**Progresso Atual:**
- [ ] PRÉ-FASE 1: Preparação (0%)
- [ ] FASE 1: DATABASE_SCHEMA.md (0%)
- [ ] FASE 2: ARCHITECTURE.md (0%)
- [ ] FASE 3: ROADMAP.md (0%)
- [ ] FASE 4: TROUBLESHOOTING.md (0%)
- [ ] FASE 5: CONTRIBUTING.md (0%)
- [ ] FASE 6: INSTALL.md (0%)
- [ ] FASE 7: Reescrever claude.md (0%)
- [ ] FASE 8: Melhorar README.md (0%)
- [ ] FASE 9: Validação Final (0%)

**Status Geral:** 📋 PLANEJADO - Aguardando aprovação para iniciar

---

## 📋 TODO - SISTEMA REPORTS (COMPLETO - REFERÊNCIA)

**Status:** ✅ 100% COMPLETO
**Última Validação:** VALIDACAO_FASE_6_REPORTS_COMPLETA.md

Todas as 6 fases foram concluídas e validadas. Nenhuma ação pendente.

---

## 📋 TODO - VALIDAÇÃO FRONTEND (COMPLETO - REFERÊNCIA)

**Status:** ✅ 100% COMPLETO
**Última Validação:** VALIDACAO_FASE_21_ACESSIBILIDADE.md

Todas as 10 fases (12-21) foram concluídas e validadas. Nenhuma ação pendente.

---

## 🔧 WORKFLOWS DE VALIDAÇÃO

### Workflow 1: Validação Rápida (Após mudança pequena)

```bash
# 1. TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# 2. Git status
git status

# 3. Resultado esperado:
# - 0 erros TypeScript
# - Working tree clean (ou apenas arquivos intencionais)
```

**Tempo:** ~2 minutos
**Quando usar:** Mudanças < 50 linhas, 1-2 arquivos

---

### Workflow 2: Validação Média (Após mudança média)

```bash
# 1. TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# 2. Build
cd backend && npm run build
cd frontend && npm run build

# 3. Git
git status

# 4. Resultado esperado:
# - 0 erros TypeScript
# - Build success (backend)
# - Build success (frontend, 17 páginas)
# - Working tree clean
```

**Tempo:** ~5 minutos
**Quando usar:** Mudanças 50-200 linhas, 3-5 arquivos

---

### Workflow 3: Validação Completa (Após mudança grande ou nova feature)

```bash
# 1. Verificar containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"

# 2. Reiniciar se necessário (se mudou código backend/frontend)
docker restart invest_backend
docker restart invest_frontend
# Aguardar 30-60s até status "healthy"

# 3. TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# 4. Build
cd backend && npm run build
cd frontend && npm run build

# 5. MCP Triplo (3 janelas paralelas)
# Janela 1: Playwright MCP
# - Navegar páginas afetadas
# - Tirar screenshots
# - Validar funcionalidades

# Janela 2: Chrome DevTools MCP
# - Abrir console
# - Verificar erros/warnings
# - Validar network requests

# Janela 3: Sequential Thinking MCP
# - Analisar mudanças profundamente
# - Identificar possíveis problemas
# - Validar arquitetura

# 6. React Dev Tools
# - Abrir em http://localhost:3100
# - Verificar component tree
# - Validar props e state

# 7. Screenshots
# - Salvar em validation-screenshots/
# - Nomear: fase-X-descricao.png

# 8. Git
git status
git add .
git commit -m "tipo: descrição\n\n<corpo>\n\nCo-Authored-By: Claude <noreply@anthropic.com>"
git push

# 9. Criar documento de validação
# - VALIDACAO_FASE_X_NOME.md
# - Incluir: resumo, arquivos modificados, validações, screenshots, conclusões
```

**Tempo:** ~30-60 minutos
**Quando usar:**
- Mudanças > 200 linhas
- > 5 arquivos
- Nova feature completa
- Refatoração grande
- Correção de bug crítico

---

## ⚡ COMANDOS RÁPIDOS

### Validação TypeScript (Obrigatória)

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit

# Ambos (sequential)
cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit && echo "✅ TypeScript OK"
```

### Build (Obrigatório antes de commit)

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build

# Ambos (sequential)
cd backend && npm run build && cd ../frontend && npm run build && echo "✅ Build OK"
```

### Git (Workflow padrão)

```bash
# Status
git status

# Add + Commit (com co-autoria)
git add . && git commit -m "tipo: descrição

<corpo detalhado>

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push
git push

# Verificar sincronização
git log --oneline -5
git status
```

### Docker (Gerenciamento de containers)

```bash
# Ver status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"

# Reiniciar backend
docker restart invest_backend

# Reiniciar frontend
docker restart invest_frontend

# Reiniciar todos
docker restart invest_backend invest_frontend

# Ver logs (últimas 50 linhas)
docker logs invest_backend --tail 50
docker logs invest_frontend --tail 50

# Ver logs em tempo real
docker logs invest_backend -f
docker logs invest_frontend -f
```

### System Manager (Gerenciamento completo)

```bash
# Iniciar ambiente
.\system-manager.ps1 start

# Parar ambiente
.\system-manager.ps1 stop

# Ver status
.\system-manager.ps1 status

# Restart completo
.\system-manager.ps1 restart

# Limpeza (volumes)
.\system-manager.ps1 clean
```

---

## 📊 MÉTRICAS DE QUALIDADE (ZERO TOLERANCE)

```
TypeScript Errors: 0 ✅
Build Errors: 0 ✅
Console Errors: 0 ✅ (páginas principais)
Warnings Críticos: 0 ✅
Lint Problems: 0 ✅ (critical)
Breaking Changes: 0 ✅ (sem aprovação)
Problemas Não-Bloqueantes: 0 ✅
Itens Incompletos: 0 ✅
Documentação Desatualizada: 0 ✅
Git Desincronizado: 0 ✅
```

**Critério de Aprovação para Próxima Fase:**
```
TODOS os itens acima = 0 (ZERO) → ✅ Pode avançar
QUALQUER item > 0 → ❌ CORRIGIR ANTES de avançar
```

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Agora (Prioridade Máxima)

1. ✅ **Aprovar este TODO/Checklist**
2. ✅ **Commit PLANO_REORGANIZACAO_CLAUDE_README.md + este arquivo**
3. ✅ **Push para sincronizar branch**
4. ✅ **Iniciar PRÉ-FASE 1** (preparação)
5. ✅ **Executar FASES 1-9** (reorganização documentação)

### Depois (Após reorganização completa)

1. ⏸️ Analisar REFATORACAO_BOTAO_SOLICITAR_ANALISES.md
2. ⏸️ Planejar FASE 24 (Dados Históricos BRAPI)
3. ⏸️ Continuar desenvolvimento de novas features

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-14
**Última Atualização:** 2025-11-14 16:15
**Versão:** 1.0.0
**Status:** 📋 APROVAÇÃO PENDENTE
