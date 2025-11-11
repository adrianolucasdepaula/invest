# FASE 12 - ACESSIBILIDADE (WCAG 2.1 AA)

**Data Inicio:** 11/01/2025
**Status:** Planejada
**Objetivo:** Implementar conformidade WCAG 2.1 nivel AA em toda a plataforma
**Prioridade:** Alta
**Fase:** 12/21

---

## OBJETIVO GERAL

Garantir que a plataforma B3 AI Analysis seja acessivel para todos os usuarios, incluindo pessoas com deficiencias visuais, auditivas, motoras e cognitivas, seguindo as diretrizes WCAG 2.1 nivel AA.

---

## CRITERIOS DE SUCESSO

### Metricas Quantitativas
- ✅ 100% de conformidade WCAG 2.1 AA
- ✅ Lighthouse Accessibility Score: 100/100
- ✅ axe-core: 0 violacoes criticas
- ✅ 0 violacoes automaticas detectadas
- ✅ Navegacao completa por teclado em 100% das funcionalidades

### Testes Obrigatorios
- ✅ NVDA (Windows) - Screen reader
- ✅ JAWS (Windows) - Screen reader
- ✅ VoiceOver (Mac) - Screen reader
- ✅ Navegacao por teclado em todas as paginas
- ✅ Contraste de cores validado
- ✅ Focus indicators visiveis

---

## PRINCIPIOS WCAG 2.1

### 1. Perceptivel
Informacao e componentes da interface devem ser apresentados aos usuarios de forma que possam percebe-los.

### 2. Operavel
Componentes da interface e navegacao devem ser operaveis.

### 3. Compreensivel
Informacao e operacao da interface devem ser compreensives.

### 4. Robusto
Conteudo deve ser robusto o suficiente para ser interpretado por uma ampla variedade de user agents, incluindo tecnologias assistivas.

---

## TAREFAS POR CATEGORIA

### CATEGORIA 1: Navegacao por Teclado

**Prioridade:** Critica
**Estimativa:** 8 horas

#### Tarefas:
1. **Implementar Skip Links**
   - Skip to main content
   - Skip to navigation
   - Skip to footer
   - Arquivo: `frontend/src/components/layout/skip-links.tsx`

2. **Focus Management**
   - Focus trap em modals/dialogs
   - Focus visible em todos elementos interativos
   - Ordem logica de tabulacao (tabIndex)
   - Return focus apos fechar modals
   - Arquivos: Todos componentes com interacao

3. **Keyboard Shortcuts**
   - ESC para fechar modals
   - ENTER/SPACE para botoes
   - Arrow keys em menus/dropdowns
   - Tab/Shift+Tab para navegacao
   - Arquivo: `frontend/src/hooks/use-keyboard-shortcuts.tsx`

4. **Validacao**
   - Testar toda navegacao apenas com teclado
   - Verificar focus indicators em todos elementos
   - Testar com leitor de tela

**Criterios de Aceitacao:**
- Usuario pode navegar 100% da aplicacao apenas com teclado
- Focus sempre visivel e logico
- Nenhum elemento interativo inacessivel por teclado

---

### CATEGORIA 2: ARIA Labels e Landmarks

**Prioridade:** Critica
**Estimativa:** 6 horas

#### Tarefas:
1. **Landmarks ARIA**
   - `<header role="banner">`
   - `<nav role="navigation">`
   - `<main role="main">`
   - `<aside role="complementary">`
   - `<footer role="contentinfo">`
   - Arquivos: `frontend/src/components/layout/*`

2. **ARIA Labels**
   - aria-label em botoes de icone
   - aria-labelledby em sections
   - aria-describedby em inputs
   - aria-live para notificacoes
   - Arquivos: Todos componentes

3. **ARIA States**
   - aria-expanded em dropdowns
   - aria-selected em tabs
   - aria-checked em checkboxes
   - aria-disabled em elementos desabilitados
   - aria-hidden em elementos decorativos
   - Arquivos: Componentes interativos

4. **ARIA Roles**
   - role="dialog" em modals
   - role="alert" em mensagens de erro
   - role="status" em loading states
   - role="button" em elementos clicaveis nao-button
   - Arquivos: Todos componentes UI

**Criterios de Aceitacao:**
- Todos elementos tem labels apropriados
- Screen readers conseguem navegar e entender toda interface
- Estados dinamicos sao anunciados

---

### CATEGORIA 3: Contraste de Cores

**Prioridade:** Alta
**Estimativa:** 4 horas

#### Tarefas:
1. **Auditoria de Contraste**
   - Verificar todos textos vs backgrounds
   - Verificar botoes e elementos interativos
   - Verificar estados hover/focus/active
   - Ferramenta: Chrome DevTools Contrast Checker

2. **Correcoes Necessarias**
   - Textos pequenos: minimo 4.5:1
   - Textos grandes (18pt+): minimo 3:1
   - Elementos UI: minimo 3:1
   - Arquivo: `frontend/src/styles/globals.css`

3. **Dark Mode**
   - Garantir contraste adequado em dark mode
   - Testar todas combinacoes de cores
   - Arquivo: `frontend/tailwind.config.ts`

**Criterios de Aceitacao:**
- 100% de conformidade com WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)
- Ferramenta automatica confirma conformidade
- Usuarios com baixa visao conseguem ler confortavelmente

---

### CATEGORIA 4: Form Accessibility

**Prioridade:** Alta
**Estimativa:** 6 horas

#### Tarefas:
1. **Labels e Associacoes**
   - Todos inputs tem <label> associado
   - Usar htmlFor correto
   - Labels visiveis e descritivos
   - Arquivos: `frontend/src/components/*/forms/*`

2. **Error Messages**
   - aria-invalid em campos com erro
   - aria-describedby para mensagens de erro
   - role="alert" em erros criticos
   - Cor nao e unico indicador de erro
   - Arquivos: Todos forms

3. **Required Fields**
   - aria-required="true"
   - Indicador visual (asterisco)
   - Indicador textual em label
   - Arquivos: Todos forms

4. **Autocomplete**
   - autocomplete attributes corretos
   - autocomplete="name", "email", etc
   - Facilita preenchimento e leitores de tela
   - Arquivos: Todos forms

**Criterios de Aceitacao:**
- Todos forms podem ser preenchidos apenas com teclado
- Screen readers anunciam labels, erros e required fields
- Erros sao claros e descritivos

---

### CATEGORIA 5: Imagens e Midia

**Prioridade:** Media
**Estimativa:** 3 horas

#### Tarefas:
1. **Alt Text**
   - Todas imagens tem alt text descritivo
   - Imagens decorativas: alt=""
   - Imagens informativas: alt descritivo
   - Arquivos: Todos componentes com imagens

2. **Icons**
   - Icon-only buttons: aria-label
   - Decorative icons: aria-hidden="true"
   - Informative icons: aria-label ou title
   - Arquivo: `frontend/src/components/ui/icon.tsx`

3. **Charts e Graficos**
   - aria-label descritivo
   - Tabela de dados alternativa
   - Descricao textual dos insights
   - Arquivos: `frontend/src/components/charts/*`

**Criterios de Aceitacao:**
- Screen readers conseguem entender todas imagens e graficos
- Usuarios cegos tem acesso aos mesmos dados que videntes
- Nenhuma informacao transmitida apenas visualmente

---

### CATEGORIA 6: Tabelas

**Prioridade:** Media
**Estimativa:** 4 horas

#### Tarefas:
1. **Estrutura Semantica**
   - Usar <table>, <thead>, <tbody>, <th>, <td>
   - Nunca usar divs para tabelas
   - scope="col" e scope="row" em headers
   - Arquivos: `frontend/src/components/portfolio/positions-table.tsx`

2. **Captions**
   - <caption> descritivo em todas tabelas
   - Pode ser visualmente hidden se redundante
   - Arquivos: Todos componentes com tabelas

3. **Headers**
   - Associar headers com cells usando scope
   - Tabelas complexas: headers id + td headers
   - Arquivos: Tabelas complexas

4. **Navegacao**
   - Permitir navegacao por teclado
   - Sortable headers acessiveis
   - Arquivos: Tabelas com sort

**Criterios de Aceitacao:**
- Screen readers conseguem navegar e entender tabelas
- Relacao entre headers e cells e clara
- Navegacao por teclado funcional

---

### CATEGORIA 7: Temporal

**Prioridade:** Baixa
**Estimativa:** 2 horas

#### Tarefas:
1. **Auto-refresh**
   - Permitir pausar/parar auto-refresh
   - Avisar usuario antes de refresh
   - Arquivo: `frontend/src/hooks/use-auto-refresh.tsx`

2. **Timeouts**
   - Avisar usuario antes de timeout
   - Permitir extender sessao
   - Arquivo: `frontend/src/hooks/use-session-timeout.tsx`

3. **Animations**
   - Respeitar prefers-reduced-motion
   - Permitir desabilitar animacoes
   - Arquivo: `frontend/tailwind.config.ts`

**Criterios de Aceitacao:**
- Usuarios com dificuldades cognitivas tem tempo suficiente
- Usuarios podem controlar timing
- Animacoes podem ser desabilitadas

---

### CATEGORIA 8: Responsive e Mobile

**Prioridade:** Media
**Estimativa:** 4 horas

#### Tarefas:
1. **Touch Targets**
   - Minimo 44x44px (WCAG AA)
   - Espacamento adequado entre elementos
   - Arquivos: Todos componentes mobile

2. **Orientation**
   - Funcionar em portrait e landscape
   - Nao forcar orientation
   - Arquivos: CSS e layout

3. **Zoom**
   - Permitir zoom ate 200%
   - Nao quebrar layout em zoom
   - Arquivo: `frontend/src/app/layout.tsx`

**Criterios de Aceitacao:**
- Interface utilizavel em todos tamanhos de tela
- Touch targets adequados
- Zoom funciona corretamente

---

### CATEGORIA 9: Documentacao

**Prioridade:** Media
**Estimativa:** 3 horas

#### Tarefas:
1. **Guia de Acessibilidade**
   - Documentar recursos de acessibilidade
   - Keyboard shortcuts
   - Como usar com screen readers
   - Arquivo: `ACESSIBILIDADE.md`

2. **Acessibilidade na Documentacao**
   - Markdown acessivel
   - Alt text em imagens
   - Headings estruturados
   - Arquivos: Todos .md

**Criterios de Aceitacao:**
- Usuarios sabem como usar recursos de acessibilidade
- Documentacao e acessivel

---

### CATEGORIA 10: Testes e Validacao

**Prioridade:** Critica
**Estimativa:** 8 horas

#### Tarefas:
1. **Testes Automatizados**
   - Integrar axe-core
   - Integrar pa11y
   - CI/CD com testes de acessibilidade
   - Arquivo: `frontend/tests/accessibility/*`

2. **Testes Manuais**
   - NVDA screen reader
   - JAWS screen reader
   - VoiceOver screen reader
   - Navegacao apenas com teclado
   - Contraste de cores

3. **Lighthouse Audit**
   - Rodar em todas paginas principais
   - Objetivo: 100/100 em Accessibility
   - Corrigir todas issues

4. **Relatorio Final**
   - Documentar todos testes realizados
   - Screenshots de auditorias
   - Lista de conformidade WCAG 2.1 AA
   - Arquivo: `CERTIFICACAO_FASE_12_ACESSIBILIDADE.md`

**Criterios de Aceitacao:**
- 0 violacoes automaticas detectadas
- Testes manuais 100% aprovados
- Lighthouse Accessibility: 100/100
- Documentacao completa

---

## CRONOGRAMA

| Semana | Categorias | Estimativa |
|--------|-----------|-----------|
| Semana 1 | Cat 1 (Navegacao), Cat 2 (ARIA) | 14h |
| Semana 2 | Cat 3 (Cores), Cat 4 (Forms), Cat 5 (Midia) | 13h |
| Semana 3 | Cat 6 (Tabelas), Cat 7 (Temporal), Cat 8 (Mobile) | 10h |
| Semana 4 | Cat 9 (Docs), Cat 10 (Testes) | 11h |

**Total Estimado:** 48 horas (6 dias de trabalho full-time)

---

## FERRAMENTAS NECESSARIAS

### Desenvolvimento
- axe DevTools (Chrome Extension)
- WAVE (Chrome Extension)
- Lighthouse (Chrome DevTools)
- Color Contrast Analyzer
- Screen readers (NVDA, JAWS, VoiceOver)

### Testing
- @axe-core/react
- pa11y
- jest-axe
- cypress-axe

### Instalacao:
```bash
npm install --save-dev @axe-core/react pa11y jest-axe cypress-axe
```

---

## CHECKLIST WCAG 2.1 AA

### Nivel A (Obrigatorio)

#### Perceptivel
- [ ] 1.1.1 Non-text Content
- [ ] 1.2.1 Audio-only and Video-only (Prerecorded)
- [ ] 1.2.2 Captions (Prerecorded)
- [ ] 1.2.3 Audio Description or Media Alternative
- [ ] 1.3.1 Info and Relationships
- [ ] 1.3.2 Meaningful Sequence
- [ ] 1.3.3 Sensory Characteristics
- [ ] 1.4.1 Use of Color
- [ ] 1.4.2 Audio Control

#### Operavel
- [ ] 2.1.1 Keyboard
- [ ] 2.1.2 No Keyboard Trap
- [ ] 2.1.4 Character Key Shortcuts
- [ ] 2.2.1 Timing Adjustable
- [ ] 2.2.2 Pause, Stop, Hide
- [ ] 2.3.1 Three Flashes or Below Threshold
- [ ] 2.4.1 Bypass Blocks
- [ ] 2.4.2 Page Titled
- [ ] 2.4.3 Focus Order
- [ ] 2.4.4 Link Purpose (In Context)
- [ ] 2.5.1 Pointer Gestures
- [ ] 2.5.2 Pointer Cancellation
- [ ] 2.5.3 Label in Name
- [ ] 2.5.4 Motion Actuation

#### Compreensivel
- [ ] 3.1.1 Language of Page
- [ ] 3.2.1 On Focus
- [ ] 3.2.2 On Input
- [ ] 3.3.1 Error Identification
- [ ] 3.3.2 Labels or Instructions

#### Robusto
- [ ] 4.1.1 Parsing
- [ ] 4.1.2 Name, Role, Value

### Nivel AA (Obrigatorio para WCAG 2.1 AA)

#### Perceptivel
- [ ] 1.2.4 Captions (Live)
- [ ] 1.2.5 Audio Description (Prerecorded)
- [ ] 1.3.4 Orientation
- [ ] 1.3.5 Identify Input Purpose
- [ ] 1.4.3 Contrast (Minimum)
- [ ] 1.4.4 Resize Text
- [ ] 1.4.5 Images of Text
- [ ] 1.4.10 Reflow
- [ ] 1.4.11 Non-text Contrast
- [ ] 1.4.12 Text Spacing
- [ ] 1.4.13 Content on Hover or Focus

#### Operavel
- [ ] 2.4.5 Multiple Ways
- [ ] 2.4.6 Headings and Labels
- [ ] 2.4.7 Focus Visible

#### Compreensivel
- [ ] 3.1.2 Language of Parts
- [ ] 3.2.3 Consistent Navigation
- [ ] 3.2.4 Consistent Identification
- [ ] 3.3.3 Error Suggestion
- [ ] 3.3.4 Error Prevention (Legal, Financial, Data)

#### Robusto
- [ ] 4.1.3 Status Messages

---

## DEPENDENCIAS

### Pre-requisitos
- FASE 11 concluida 100%
- Git atualizado
- Documentacao atualizada

### Bloqueadores
- Nenhum

---

## RISCOS E MITIGACAO

### Risco 1: Complexidade de Screen Readers
**Probabilidade:** Media
**Impacto:** Alto
**Mitigacao:** Comecar cedo com testes de screen reader, consultar especialistas se necessario

### Risco 2: Componentes Third-Party Nao Acessiveis
**Probabilidade:** Media
**Impacto:** Medio
**Mitigacao:** Auditar todos componentes third-party, criar wrappers acessiveis se necessario

### Risco 3: Performance Impact de ARIA
**Probabilidade:** Baixa
**Impacto:** Baixo
**Mitigacao:** Usar ARIA com moderacao, testar performance apos implementacao

---

## ENTREGAVEIS

1. **Codigo:**
   - Todos componentes com acessibilidade implementada
   - Skip links
   - ARIA labels completos
   - Focus management
   - Keyboard shortcuts

2. **Testes:**
   - Suite de testes automatizados
   - Relatorios de testes manuais
   - Screenshots de auditorias

3. **Documentacao:**
   - ACESSIBILIDADE.md - Guia de usuario
   - CERTIFICACAO_FASE_12_ACESSIBILIDADE.md - Certificacao final
   - README.md atualizado

4. **Commits:**
   - Commits organizados por categoria
   - Mensagens descritivas
   - Git history limpo

---

## PROXIMA FASE

**FASE 13:** Testes Automatizados (Unit, Integration, E2E)

---

## REFERENCIAS

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Assinatura:**
Claude (Assistente IA)
Data: 11/01/2025
Status: PLANEJADA
Fase: 12/21 - Acessibilidade (WCAG 2.1 AA)
