# 🔧 Guia de Validação: DevTools + Figma + Context7

## 📋 Visão Geral

Este documento descreve como integrar e validar o frontend usando:
- **Chrome DevTools** - Inspeção técnica e performance
- **Figma** - Comparação visual com designs
- **Context7** - Análise de contexto e qualidade

---

## 🌐 Chrome DevTools - Validação Implementada

### ✅ Testes Automatizados Criados

Arquivo: `tests/devtools-validation.spec.ts`

#### 1. Console Validation
- ✅ Captura erros de console
- ✅ Captura warnings
- ✅ Filtra erros conhecidos (Google Fonts)
- ✅ Detecta exceções não tratadas

**Como executar:**
```bash
npx playwright test devtools-validation --grep "Console"
```

#### 2. Network Validation
- ✅ Monitora todas as requisições HTTP
- ✅ Detecta recursos que falharam (404, 500)
- ✅ Mede tempos de resposta
- ✅ Verifica headers de cache

**Métricas capturadas:**
- Total de arquivos JS carregados
- Total de arquivos CSS carregados
- Recursos que falharam
- Headers de cache

#### 3. Performance Metrics
- ✅ Largest Contentful Paint (LCP)
- ✅ DOM Content Loaded
- ✅ Load Complete
- ✅ DOM Interactive Time
- ✅ Tamanho total dos bundles

**Benchmarks:**
- LCP: < 2.5s (bom), < 4s (aceitável)
- DOM Interactive: < 3000ms
- Total JS: < 5MB
- Time to First Render: < 2000ms

#### 4. Memory & Resources
- ✅ Detecta memory leaks
- ✅ Monitora uso de memória ao navegar
- ✅ Conta event listeners
- ✅ Verifica limpeza de recursos

**Limites:**
- Aumento de memória: < 50% após 5 navegações
- Event listeners: < 100 por página

#### 5. Accessibility (Lighthouse)
- ✅ Verifica labels acessíveis em inputs
- ✅ Testa navegação por teclado
- ✅ Valida contraste de cores (visual)
- ✅ Verifica ARIA attributes

#### 6. Security
- ✅ Detecta requisições HTTP inseguras
- ✅ Verifica security headers
- ✅ Valida Content Security Policy

### 📊 Como Ver os Resultados

```bash
# Executar todos os testes do DevTools
npx playwright test devtools-validation

# Executar categoria específica
npx playwright test devtools-validation --grep "Performance"
npx playwright test devtools-validation --grep "Network"
npx playwright test devtools-validation --grep "Memory"

# Ver relatório HTML
npx playwright show-report
```

### 🔍 Inspeção Manual com DevTools

Para validação manual complementar:

1. **Abra o Chrome DevTools** (F12)
2. **Console Tab:**
   - Verifique erros (vermelho)
   - Verifique warnings (amarelo)
   - Logs informativos devem ser claros

3. **Network Tab:**
   - Filtre por "Fetch/XHR" para ver requisições API
   - Verifique tempos de resposta
   - Confirme que recursos críticos carregam com sucesso

4. **Performance Tab:**
   - Grave uma sessão de navegação
   - Verifique métricas Web Vitals
   - Identifique gargalos de performance

5. **Application Tab:**
   - Verifique localStorage/sessionStorage
   - Confirme service workers (se aplicável)
   - Veja cookies e cache

6. **Lighthouse Tab:**
   - Execute audit completo
   - Metas:
     - Performance: > 90
     - Accessibility: > 90
     - Best Practices: > 90
     - SEO: > 80

---

## 🎨 Figma - Comparação Visual

### 📐 Design de Referência

**Link do Figma:** [INSERIR LINK AQUI]

> ⚠️ **AÇÃO NECESSÁRIA:** Por favor, forneça o link do design no Figma

### 📸 Screenshots Automatizados

Arquivo: `tests/visual-validation.spec.ts`

#### Capturas Criadas

**Resoluções:**
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667

**Páginas Capturadas:**
- Dashboard
- Assets
- Portfolio
- Reports
- Asset Detail (PETR4)
- Report Detail
- Login

**Estados Capturados:**
- Dialogs abertos/fechados
- Hover states
- Sidebar navigation states
- Formulários vazios/preenchidos
- Busca vazia/filtrada
- Componentes individuais (cards, tabelas, gráficos)

### 🚀 Como Gerar Screenshots

```bash
# Gerar todos os screenshots
npx playwright test visual-validation

# Ver screenshots gerados
ls -lh frontend/screenshots/

# Screenshots são salvos em:
# frontend/screenshots/<page>-<viewport>.png
```

### 🔍 Comparação Manual com Figma

1. **Abra o design no Figma**
2. **Navegue para cada tela**
3. **Compare com screenshots:**

   ```bash
   # Abrir diretório de screenshots
   open frontend/screenshots/  # macOS
   xdg-open frontend/screenshots/  # Linux
   explorer frontend\screenshots\  # Windows
   ```

4. **Checklist de Comparação:**

   - [ ] Cores correspondem ao design system
   - [ ] Espaçamentos (padding/margin) corretos
   - [ ] Tipografia (fonte, tamanhos, pesos)
   - [ ] Ícones corretos e bem posicionados
   - [ ] Componentes responsivos conforme design
   - [ ] Estados (hover, active, disabled) implementados
   - [ ] Shadows e bordas conforme Figma
   - [ ] Alinhamento e grid system respeitados

### 📊 Design Tokens - Validação

Verifique se os tokens do Figma estão implementados no Tailwind:

**Cores:** `tailwind.config.ts`
```typescript
colors: {
  primary: '#...', // Comparar com Figma
  secondary: '#...',
  success: '#...',
  destructive: '#...',
  // ...
}
```

**Espaçamentos:**
```typescript
spacing: {
  '4': '1rem',  // 16px
  '8': '2rem',  // 32px
  // ...
}
```

**Tipografia:**
```typescript
fontSize: {
  'sm': '0.875rem',
  'base': '1rem',
  'lg': '1.125rem',
  // ...
}
```

### 🎯 Testes Visuais de Regressão (Opcional)

Para comparação automática de screenshots:

```bash
# Instalar ferramenta de diff visual
npm install -D playwright-visual-regression

# Configurar baseline de screenshots
npx playwright test visual-validation --update-snapshots

# Comparar screenshots automaticamente
npx playwright test visual-validation
```

---

## 🔍 Context7 - Análise de Contexto

### ❓ O que é Context7?

> ⚠️ **INFORMAÇÃO NECESSÁRIA:** Por favor, forneça detalhes sobre Context7:
> - É uma ferramenta de análise de código?
> - É um framework de testes?
> - É uma plataforma de QA?
> - Link da documentação?

### 🔧 Integração Sugerida

Enquanto aguardo mais informações, aqui está uma estrutura genérica:

#### Opção 1: Context7 como Ferramenta de Análise de Código

```bash
# Instalar (exemplo genérico)
npm install -D context7

# Configurar
# context7.config.js
module.exports = {
  root: './src',
  include: ['**/*.tsx', '**/*.ts'],
  exclude: ['node_modules', 'dist'],
  rules: {
    // Regras de análise
  }
}

# Executar análise
npx context7 analyze
```

#### Opção 2: Context7 como Framework de Testes

```typescript
// tests/context7-validation.spec.ts
import { context7 } from 'context7';

describe('Context7 Validation', () => {
  it('should validate component context', async () => {
    const result = await context7.analyze({
      component: 'Dashboard',
      context: ['auth', 'data', 'navigation']
    });

    expect(result.valid).toBe(true);
  });
});
```

#### Opção 3: Context7 como Plataforma de QA

```bash
# Upload para plataforma
context7 upload --screenshots ./screenshots
context7 upload --test-results ./test-results.json

# Comparar com baseline
context7 compare --baseline main --current feature-branch
```

### 📋 Checklist de Validação Context7

Depois de configurado, validar:

- [ ] Análise de código completa sem erros críticos
- [ ] Contexto de componentes mapeado corretamente
- [ ] Dependências entre módulos validadas
- [ ] Cobertura de código > 80%
- [ ] Sem código duplicado
- [ ] Complexidade ciclomática aceitável
- [ ] Performance de runtime dentro dos limites
- [ ] Integração com CI/CD funcionando

---

## 🚀 Fluxo Completo de Validação

### 1️⃣ Preparação

```bash
cd frontend

# Garantir dependências instaladas
npm install

# Build de produção
npm run build

# Iniciar servidor
npm start
```

### 2️⃣ Chrome DevTools - Automação

```bash
# Executar todos os testes do DevTools
npx playwright test devtools-validation --reporter=html

# Ver relatório
npx playwright show-report
```

**Resultados esperados:**
- ✅ 0 erros de console
- ✅ 0 requisições falhadas
- ✅ Performance > 90
- ✅ 0 memory leaks
- ✅ Accessibility OK

### 3️⃣ Screenshots para Figma

```bash
# Gerar screenshots
npx playwright test visual-validation

# Screenshots salvos em:
cd screenshots
ls -lh

# Comparar manualmente com Figma
```

**Checklist:**
- [ ] Todas as páginas capturadas (7 páginas × 4 resoluções = 28 screenshots)
- [ ] Estados de componentes capturados
- [ ] Formulários em diferentes estados
- [ ] Compare cada screenshot com o design no Figma

### 4️⃣ Context7 (Aguardando configuração)

```bash
# Executar análise Context7
# [COMANDO A SER DEFINIDO]

# Ver resultados
# [LOCALIZAÇÃO A SER DEFINIDA]
```

### 5️⃣ Validação Manual - DevTools

Abra Chrome e navegue para `http://localhost:3000`

**Console (F12 → Console):**
- Não deve haver erros vermelhos
- Warnings são aceitáveis se documentados

**Network (F12 → Network):**
- Todos os recursos devem carregar (status 200)
- Tempo de carregamento da página < 2s

**Performance (F12 → Performance):**
- Gravar sessão de uso
- FPS deve manter 60fps
- Sem long tasks > 50ms

**Lighthouse (F12 → Lighthouse):**
- Executar audit
- Scores esperados: Performance > 90, Accessibility > 90

### 6️⃣ Relatório Final

```bash
# Gerar relatório consolidado
./generate-validation-report.sh

# Relatório salvo em:
cat VALIDATION_REPORT_COMPLETE.md
```

---

## 📊 Métricas de Sucesso

### Chrome DevTools
| Métrica | Meta | Status |
|---------|------|--------|
| Console Errors | 0 | ⏳ |
| Failed Requests | 0 | ⏳ |
| Performance Score | > 90 | ⏳ |
| Accessibility Score | > 90 | ⏳ |
| Memory Leaks | 0 | ⏳ |
| LCP | < 2.5s | ⏳ |
| Time to Interactive | < 3s | ⏳ |

### Figma
| Item | Meta | Status |
|------|------|--------|
| Design System Match | 100% | ⏳ |
| Responsive Breakpoints | 4/4 | ⏳ |
| Component States | 100% | ⏳ |
| Typography | 100% | ⏳ |
| Colors | 100% | ⏳ |
| Spacing | 100% | ⏳ |

### Context7
| Métrica | Meta | Status |
|---------|------|--------|
| Code Quality | A | ⏳ |
| Coverage | > 80% | ⏳ |
| Complexity | Low | ⏳ |
| Duplication | < 5% | ⏳ |

---

## 🎯 Próximos Passos

### Informações Necessárias

Para completar a validação, preciso:

1. **Link do Figma:**
   - [ ] Link para o design/protótipo
   - [ ] Acesso ao design system (tokens, componentes)
   - [ ] Especificações de responsividade

2. **Context7:**
   - [ ] O que é exatamente o Context7?
   - [ ] Como instalá-lo?
   - [ ] Como configurá-lo?
   - [ ] Quais métricas devem ser validadas?
   - [ ] Link para documentação

3. **Critérios de Aceitação:**
   - [ ] Quais são os critérios mínimos de aprovação?
   - [ ] Há algum threshold específico?
   - [ ] Alguma funcionalidade prioritária?

### Executar Validação Completa

Depois de fornecer as informações acima:

```bash
# Script completo de validação
./validate-complete.sh

# Isso irá:
# 1. Executar testes do DevTools
# 2. Gerar screenshots
# 3. Executar Context7 (quando configurado)
# 4. Gerar relatório consolidado
```

---

## 📞 Suporte

Se precisar de ajuda:

1. **DevTools:** Documentação em https://developer.chrome.com/docs/devtools/
2. **Playwright:** Documentação em https://playwright.dev/
3. **Figma:** Documentação em https://help.figma.com/
4. **Context7:** [AGUARDANDO LINK]

---

*Guia criado em 2025-11-06*
