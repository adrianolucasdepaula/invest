# ✅ CHECKLIST TODO MASTER - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Versão:** 2.0.0 (Ultra-Robusto)
**Criado:** 2025-11-15
**Mantenedor:** Claude Code (Sonnet 4.5)
**Status:** 🔴 **OBRIGATÓRIO ANTES DE CADA FASE/ETAPA**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Princípios Fundamentais](#princípios-fundamentais)
3. [Checklist Pré-Implementação](#checklist-pré-implementação)
4. [Checklist Durante Implementação](#checklist-durante-implementação)
5. [Checklist Pré-Commit](#checklist-pré-commit)
6. [Checklist Pós-Commit](#checklist-pós-commit)
7. [Validação Ultra-Robusta (MCP Triplo)](#validação-ultra-robusta-mcp-triplo)
8. [Troubleshooting e Correções Definitivas](#troubleshooting-e-correções-definitivas)
9. [Gestão de Documentação](#gestão-de-documentação)
10. [TODO Master (Próximas Fases)](#todo-master-próximas-fases)

---

## 🎯 VISÃO GERAL

Este documento é o **guia definitivo** para garantir 100% de qualidade em todas as fases de desenvolvimento do projeto B3 AI Analysis Platform.

### 🚫 ZERO TOLERANCE POLICY

```
TypeScript Errors:     0 ✅ OBRIGATÓRIO
Build Errors:          0 ✅ OBRIGATÓRIO
Console Errors:        0 ✅ OBRIGATÓRIO (páginas principais)
Lint Critical:         0 ✅ OBRIGATÓRIO
Breaking Changes:      0 ✅ (sem aprovação explícita)
Documentação:      100% ✅ SEMPRE ATUALIZADA
Git Status:        100% ✅ SEMPRE LIMPO (branch main)
Co-Autoria Commits: 100% ✅ Claude <noreply@anthropic.com>
```

### 🔴 REGRA DE OURO

**NUNCA avançar para próxima fase/etapa enquanto a fase anterior não estiver 100% COMPLETA:**
- ✅ 0 erros TypeScript
- ✅ 0 erros Build
- ✅ 0 warnings críticos
- ✅ 0 bugs conhecidos
- ✅ 0 divergências
- ✅ 0 inconsistências
- ✅ 0 não-bloqueantes
- ✅ 0 oportunidades de melhoria críticas
- ✅ 0 itens não desenvolvidos ou incompletos
- ✅ Documentação 100% atualizada
- ✅ Git 100% atualizado (branch main)

---

## 🧭 PRINCÍPIOS FUNDAMENTAIS

### 1. Verdade dos Arquivos > Documentação

**SEMPRE verificar arquivos reais antes de implementar:**

```bash
# ❌ ERRADO: Confiar cegamente na documentação
"Documentação diz que useAssetPrices() aceita range" → IMPLEMENTA DIRETO

# ✅ CORRETO: Validar arquivos reais primeiro
1. Ler frontend/src/hooks/useAssetPrices.ts (código atual)
2. Verificar interface do hook (parâmetros reais)
3. Comparar com documentação
4. Se divergir → atualizar docs + planejar implementação
```

**Por quê?**
- Documentação pode estar desatualizada (2-3 commits atrás)
- Código é a **única fonte de verdade**
- Evita retrabalho e bugs de integração

### 2. Análise de Dependências e Integrações

**SEMPRE verificar impacto antes de mudanças:**

```bash
# Antes de modificar qualquer arquivo, executar:

# 1. Encontrar todos os imports deste arquivo
grep -r "from.*useAssetPrices" frontend/src
grep -r "import.*useAssetPrices" frontend/src

# 2. Encontrar todos os usages da função/classe
grep -r "useAssetPrices(" frontend/src

# 3. Verificar TypeScript types
npx tsc --noEmit  # Detecta quebras de contrato

# 4. Analisar arquivos relacionados
- Testes: frontend/src/hooks/__tests__/useAssetPrices.test.ts
- Tipos: frontend/src/types/assets.ts
- APIs: frontend/src/lib/api.ts
```

**Pergunta Crítica:**
"Se eu mudar este arquivo, QUAIS OUTROS ARQUIVOS PODEM QUEBRAR?"

### 3. Git Sempre Atualizado

**Estado do Git DEVE estar limpo antes de cada fase:**

```bash
# ✅ Estado IDEAL antes de começar nova fase:
git status
# On branch main
# Your branch is up to date with 'origin/main'.
# nothing to commit, working tree clean

# ❌ Estado PROIBIDO para iniciar nova fase:
git status
# Changes not staged for commit:
#   modified: 8 files
# Untracked files:
#   TEMP_*.md (6 arquivos)
```

**Workflow Obrigatório:**
1. Terminar fase atual
2. Commitar TUDO (código + docs + testes)
3. Verificar `git status` → working tree clean
4. Push para origin/main
5. **SÓ ENTÃO** iniciar próxima fase

### 4. Verificar Necessidade de Reiniciar Serviços

**SEMPRE verificar se mudanças exigem restart antes de testar:**

| Arquivo Modificado | Serviço a Reiniciar | Comando |
|-------------------|---------------------|---------|
| `backend/**/*.py` | api-service + scrapers | `docker-compose restart api-service scrapers` |
| `frontend/src/**/*.ts(x)` | frontend (desenvolvimento) | `docker-compose restart frontend` (se rodando em Docker) |
| `docker-compose.yml` | TODOS os serviços | `docker-compose down && docker-compose up -d` |
| `.env` ou `.env.template` | Serviço específico | Ver qual serviço usa a variável |
| `backend/package.json` | api-service | `docker-compose restart api-service` |
| Migrations (`*.ts`) | api-service | `docker-compose restart api-service && npm run migration:run` |

**Checklist Restart:**
```bash
# 1. Identificar serviços afetados
# 2. Reiniciar serviços
docker-compose restart <service>

# 3. Verificar health
docker-compose ps  # Status = Up (healthy)

# 4. Verificar logs (sem erros)
docker-compose logs -f <service> --tail=50

# 5. SÓ ENTÃO iniciar testes MCP
```

### 5. Correções Definitivas de Problemas Crônicos

**NUNCA aplicar "fix temporário" ou "workaround":**

```bash
# ❌ ERRADO: Fix superficial
"OAuth dando erro" → Reinicia container → "Funcionou!"

# ✅ CORRETO: Análise de causa raiz
1. Ler logs completos: docker-compose logs api-service --tail=200
2. Identificar CAUSA RAIZ: "DISPLAY environment variable not set"
3. Analisar arquitetura: Xvfb em scrapers, OAuth em api-service
4. Solução definitiva: network_mode sharing + DISPLAY env
5. Validar fix: 3 testes completos sem erro
6. Documentar: TROUBLESHOOTING.md + commit message detalhado
```

**Problema Crônico = Problema Arquitetural**
- Investir tempo para consertar de vez
- Documentar solução no TROUBLESHOOTING.md
- Adicionar validação preventiva no CI/CD (futuro)

### 6. Dados Reais > Mocks

**SEMPRE usar dados reais coletados dos scrapers:**

```typescript
// ❌ ERRADO: Dados mockados
const mockAsset = {
  ticker: "PETR4",
  price: 35.50,  // Inventado
  lastUpdate: new Date()
}

// ✅ CORRETO: Dados reais via API
const asset = await api.assets.getByTicker("PETR4");
// Dados vêm do PostgreSQL (scrapers coletaram)
```

**Exceções Permitidas:**
1. **Testes Unitários**: Pode mockar para isolar lógica
2. **Storybook**: Componentes visuais isolados
3. **Desenvolvimento Offline**: Usar dados previamente coletados (cache)

**Nunca em Produção/Staging:**
- Charts com dados fake
- Análises com valores inventados
- Relatórios com placeholders

---

## 📝 CHECKLIST PRÉ-IMPLEMENTAÇÃO

**Executar ANTES de escrever qualquer linha de código:**

### 1. Leitura de Contexto ✅

```bash
# 1.1. Ler documentação técnica relevante
- [ ] CLAUDE.md (metodologia)
- [ ] ARCHITECTURE.md (se mudança arquitetural)
- [ ] DATABASE_SCHEMA.md (se mudança em entities)
- [ ] ROADMAP.md (para entender fase atual)
- [ ] TROUBLESHOOTING.md (problemas conhecidos)

# 1.2. Ler arquivos de código relacionados
- [ ] Arquivo principal a ser modificado
- [ ] Interfaces/Types usados
- [ ] Testes existentes
- [ ] Arquivos que importam este módulo (grep -r)

# 1.3. Verificar divergências docs vs código
- [ ] Se documentação divergir → ATUALIZAR DOCS PRIMEIRO
- [ ] Se código divergir → PLANEJAR REFATORAÇÃO
```

### 2. Análise de Impacto ✅

```bash
# 2.1. Identificar TODOS os arquivos afetados
- [ ] Frontend: componentes, hooks, types, APIs
- [ ] Backend: controllers, services, entities, DTOs
- [ ] Database: migrations necessárias?
- [ ] Testes: quais testes quebrarão?

# 2.2. Verificar dependências
grep -r "importPath" <diretório>  # Quem importa este módulo?
npx tsc --noEmit                  # TypeScript detecta quebras

# 2.3. Estimar complexidade
- [ ] < 10 linhas → Trivial (não precisa TodoWrite)
- [ ] 10-50 linhas → Simples (TodoWrite com 3-5 etapas)
- [ ] 50-100 linhas → Médio (TodoWrite + Ultra-Thinking)
- [ ] > 100 linhas → Complexo (Documento de planejamento dedicado)
```

### 3. Planejamento (TodoWrite + Ultra-Thinking) ✅

```bash
# 3.1. Se mudança > 10 linhas → Criar TodoWrite
[
  {content: "Ler contexto (arquivos X, Y, Z)", status: "pending", activeForm: "..."},
  {content: "Criar/Atualizar DTOs e Interfaces", status: "pending", activeForm: "..."},
  {content: "Implementar Service/Hook", status: "pending", activeForm: "..."},
  {content: "Implementar Controller/Component", status: "pending", activeForm: "..."},
  {content: "Escrever/Atualizar testes", status: "pending", activeForm: "..."},
  {content: "Validar TypeScript (0 erros)", status: "pending", activeForm: "..."},
  {content: "Validar Build (Success)", status: "pending", activeForm: "..."},
  {content: "Reiniciar serviços se necessário", status: "pending", activeForm: "..."},
  {content: "Testar manualmente (MCP Triplo)", status: "pending", activeForm: "..."},
  {content: "Atualizar documentação", status: "pending", activeForm: "..."},
  {content: "Commit + Push", status: "pending", activeForm: "..."},
]

# 3.2. Se mudança > 100 linhas → Criar documento de planejamento
PLANO_FASE_X_NOME_FEATURE.md
- Problema a resolver
- Solução proposta (3 alternativas consideradas)
- Arquitetura (diagramas se necessário)
- Arquivos afetados (lista completa)
- Riscos e mitigações
- Validação (critérios de sucesso)

# 3.3. Se mudança complexa → Usar Ultra-Thinking (MCP Sequential Thinking)
- Análise profunda do problema
- Exploração de alternativas
- Identificação de edge cases
- Prevenção de regressões
```

### 4. Verificar Pré-Requisitos ✅

```bash
# 4.1. Git limpo?
git status  # working tree clean? ✅

# 4.2. Serviços rodando?
docker-compose ps  # Todos Up (healthy)? ✅

# 4.3. Dependências instaladas?
cd backend && npm install
cd frontend && npm install

# 4.4. Migrations aplicadas?
cd backend && npm run migration:run

# 4.5. TypeScript atual sem erros?
cd backend && npx tsc --noEmit   # 0 erros? ✅
cd frontend && npx tsc --noEmit  # 0 erros? ✅
```

---

## 🛠️ CHECKLIST DURANTE IMPLEMENTAÇÃO

**Executar DURANTE a escrita de código:**

### 1. Marcar TodoWrite (1 in_progress) ✅

```bash
# REGRA DE OURO: Apenas 1 tarefa in_progress por vez

# ❌ ERRADO: Múltiplas tarefas in_progress
[
  {content: "Criar DTO", status: "in_progress", ...},
  {content: "Criar Service", status: "in_progress", ...},  # PROIBIDO
]

# ✅ CORRETO: Foco em uma tarefa
[
  {content: "Criar DTO", status: "completed", ...},
  {content: "Criar Service", status: "in_progress", ...},  # ÚNICA
  {content: "Criar Controller", status: "pending", ...},
]

# Fluxo:
1. Marcar tarefa como in_progress
2. Implementar COMPLETAMENTE
3. Marcar como completed IMEDIATAMENTE
4. Passar para próxima tarefa
```

### 2. Validação Incremental ✅

```bash
# A cada arquivo modificado/criado, validar:

# 2.1. TypeScript (incremental)
npx tsc --noEmit <arquivo>.ts  # 0 erros neste arquivo?

# 2.2. Imports corretos?
# Verificar se imports estão resolvendo
# VSCode deve mostrar autocomplete

# 2.3. Linter (críticos apenas)
npm run lint <arquivo>  # Erros críticos?

# 2.4. Salvar frequentemente
# Git add + commit intermediário se mudança > 50 linhas
git add .
git commit -m "wip: implementando feature X - parte 1/3"
```

### 3. Seguir Padrões de Código ✅

**Backend (NestJS + TypeORM):**
```typescript
// ✅ CORRETO: Padrão NestJS

// 1. DTOs com class-validator
export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}

// 2. Services com injeção de dependência
@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
  ) {}

  async findByTicker(ticker: string): Promise<Asset> {
    return this.assetsRepository.findOne({ where: { ticker } });
  }
}

// 3. Controllers com decorators corretos
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(':ticker')
  async getAsset(@Param('ticker') ticker: string) {
    return this.assetsService.findByTicker(ticker);
  }
}
```

**Frontend (Next.js 14 + React):**
```typescript
// ✅ CORRETO: Padrão Next.js App Router

// 1. Componentes Server (default)
export default async function AssetPage({ params }: { params: { ticker: string } }) {
  const asset = await getAsset(params.ticker);  // Fetch direto
  return <AssetDetails asset={asset} />;
}

// 2. Componentes Client (quando necessário)
'use client';

import { useState } from 'react';

export function AssetChart({ ticker }: { ticker: string }) {
  const [range, setRange] = useState('1y');
  const { data, isLoading } = useAssetPrices(ticker, range);  // React Query

  return (
    <div className="grid gap-4">
      <RangeSelector value={range} onChange={setRange} />
      <Chart data={data} loading={isLoading} />
    </div>
  );
}

// 3. Hooks customizados com React Query
export function useAssetPrices(ticker: string, range: string) {
  return useQuery({
    queryKey: ['asset-prices', ticker, range],
    queryFn: () => api.assets.getPrices(ticker, { range }),
    staleTime: 5 * 60 * 1000,  // 5 minutos
  });
}
```

**Scrapers (Python + Playwright):**
```python
# ✅ CORRETO: Padrão Playwright + OAuth

from loguru import logger
from playwright.sync_api import sync_playwright

class GoogleScraper:
    def __init__(self, cookies: dict):
        self.cookies = cookies

    def scrape_portfolio(self, ticker: str) -> dict:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()

            # Injetar cookies OAuth
            context.add_cookies(self.cookies)

            page = context.new_page()

            try:
                page.goto(f"https://site.com/portfolio/{ticker}")
                page.wait_for_selector(".portfolio-data", timeout=30000)

                data = page.locator(".portfolio-data").text_content()

                logger.success(f"Scraped {ticker}: {data}")
                return {"ticker": ticker, "data": data}

            except Exception as e:
                logger.error(f"Erro ao scrape {ticker}: {e}")
                raise
            finally:
                browser.close()
```

---

## ✅ CHECKLIST PRÉ-COMMIT

**Executar ANTES de fazer commit (OBRIGATÓRIO):**

### 1. Validação TypeScript ✅ OBRIGATÓRIO

```bash
# 1.1. Backend
cd backend
npx tsc --noEmit

# RESULTADO ESPERADO:
# (silêncio = sucesso)

# RESULTADO PROIBIDO:
# error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

# Se QUALQUER erro → CORRIGIR antes de commit

# 1.2. Frontend
cd frontend
npx tsc --noEmit

# MESMO critério: 0 erros
```

**❌ NUNCA commitar com erros TypeScript**
**❌ NUNCA commitar com warnings críticos**

### 2. Validação Build ✅ OBRIGATÓRIO

```bash
# 2.1. Backend Build
cd backend
npm run build

# RESULTADO ESPERADO:
# Build complete. The output was saved to "dist" folder
# (sem erros)

# RESULTADO PROIBIDO:
# ERROR in src/services/assets.service.ts
# Module not found: Error: Can't resolve '@types/lodash'

# 2.2. Frontend Build
cd frontend
npm run build

# RESULTADO ESPERADO:
# Route (app)                              Size     First Load JS
# ✓ /                                      5.2 kB          100 kB
# ✓ /assets                                8.1 kB          103 kB
# ...
# ○  (Static)  prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand

# RESULTADO PROIBIDO:
# Error: Type error: Property 'range' does not exist on type 'AssetPricesQuery'.
```

**❌ NUNCA commitar com build quebrado**

### 3. Git Status ✅

```bash
# 3.1. Ver arquivos modificados
git status

# VERIFICAR:
- [ ] Apenas arquivos intencionais?
- [ ] Sem arquivos temporários? (.env, node_modules, dist, .next)
- [ ] Sem logs de debug? (temp_logs.txt, debug_*.txt)

# 3.2. Ver diff completo
git diff --stat

# VERIFICAR:
- [ ] Mudanças fazem sentido?
- [ ] Sem linhas comentadas esquecidas?
- [ ] Sem console.log() de debug?
- [ ] Sem código morto?

# 3.3. Ver arquivos a serem commitados
git add <arquivos>
git status

# VERIFICAR:
- [ ] Todos os arquivos novos adicionados?
- [ ] Documentação incluída?
```

### 4. Documentação ✅

```bash
# 4.1. CLAUDE.md atualizado?
- [ ] Se mudança metodologia → atualizar CLAUDE.md
- [ ] Se nova regra → adicionar em "Regras de Ouro"

# 4.2. README.md atualizado?
- [ ] Se novo serviço → atualizar README.md
- [ ] Se nova porta → atualizar README.md
- [ ] Se novo pré-requisito → atualizar README.md

# 4.3. ROADMAP.md atualizado?
- [ ] Se fase concluída → adicionar/atualizar ROADMAP.md
- [ ] Se nova fase iniciada → documentar em ROADMAP.md

# 4.4. Arquivo técnico específico criado/atualizado?
- [ ] Se mudança > 100 linhas → criar FASE_X_NOME.md
- [ ] Se bug crítico corrigido → atualizar TROUBLESHOOTING.md
- [ ] Se decisão arquitetural → atualizar ARCHITECTURE.md

# 4.5. Commit message detalhado?
- [ ] Tipo correto (feat, fix, docs, refactor, test, chore)?
- [ ] Descrição curta < 72 chars?
- [ ] Corpo detalhado (problema, solução, arquivos, validação)?
- [ ] Co-autoria Claude incluída?
```

### 5. Reiniciar Serviços (se necessário) ✅

```bash
# 5.1. Identificar serviços afetados
- [ ] Modificou backend/**/*.py → api-service + scrapers
- [ ] Modificou frontend/src/**/*.ts(x) → frontend
- [ ] Modificou docker-compose.yml → TODOS
- [ ] Modificou migrations → api-service

# 5.2. Reiniciar serviços
docker-compose restart <service>

# 5.3. Verificar health
docker-compose ps
# Todos devem estar Up (healthy)

# 5.4. Verificar logs (sem erros)
docker-compose logs -f <service> --tail=50
```

### 6. Teste Manual Básico ✅

```bash
# 6.1. Backend API (se modificou backend)
curl http://localhost:3101/api/v1/health
# Deve retornar 200 OK

curl http://localhost:3101/api/v1/assets/PETR4
# Deve retornar JSON com dados do ativo

# 6.2. Frontend (se modificou frontend)
# Abrir http://localhost:3100 no navegador
- [ ] Página carrega sem erro 500?
- [ ] Sidebar funciona?
- [ ] Navegação funciona?

# 6.3. Console (F12 → Console)
- [ ] 0 erros no console?
- [ ] Apenas INFO/WARN não-críticos?

# Se QUALQUER erro → CORRIGIR antes de commit
```

---

## 🚀 CHECKLIST PÓS-COMMIT

**Executar DEPOIS de fazer commit:**

### 1. Commit Message Detalhado ✅

**Template Obrigatório:**

```bash
git commit -m "$(cat <<'EOF'
<tipo>(<escopo>): <descrição curta max 72 chars>

<corpo detalhado em bullet points:
- Problema identificado
- Solução implementada
- Arquivos modificados (+X/-Y linhas)
- Validações realizadas>

**Problema:**
<Descrição do problema que esta mudança resolve>

**Solução:**
<Descrição da solução implementada>

**Arquivos Modificados:**
- arquivo1.ts (+X linhas)
- arquivo2.py (-Y linhas)

**Validação:**
- ✅ TypeScript: 0 erros (backend + frontend)
- ✅ Build: Success (ambos)
- ✅ Testes: X/Y passing
- ✅ Services: Todos healthy
- ✅ Console: 0 erros

**Documentação:**
- ARQUIVO.md (criado/atualizado)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Apenas documentação
- `refactor`: Refatoração (sem mudança de comportamento)
- `test`: Adicionar/modificar testes
- `chore`: Manutenção (deps, config)
- `perf`: Melhoria de performance

### 2. Verificar Commit ✅

```bash
# 2.1. Ver último commit
git log -1 --stat

# VERIFICAR:
- [ ] Mensagem detalhada?
- [ ] Co-autoria incluída?
- [ ] Arquivos corretos commitados?

# 2.2. Ver diff do commit
git show HEAD

# VERIFICAR:
- [ ] Mudanças fazem sentido?
- [ ] Sem mudanças acidentais?
```

### 3. Push para Origin ✅

```bash
# 3.1. Push
git push origin main

# 3.2. Verificar GitHub (se aplicável)
- [ ] Commit apareceu no GitHub?
- [ ] CI/CD passou? (se configurado)
- [ ] Branch main está ahead?
```

---

## 🔬 VALIDAÇÃO ULTRA-ROBUSTA (MCP TRIPLO)

**Metodologia de validação usando 3 MCPs em paralelo:**

### 1. Quando Aplicar ✅

**OBRIGATÓRIO para:**
- ✅ Páginas frontend completas (OAuth Manager, Assets, Dashboard)
- ✅ Fluxos críticos (autenticação, pagamento, análise)
- ✅ Integrações complexas (WebSocket, OAuth, API externa)
- ✅ Funcionalidades com estado (loading, error, success)
- ✅ Antes de marcar fase como 100% COMPLETO

**OPCIONAL para:**
- ⏩ Mudanças triviais (< 10 linhas)
- ⏩ Apenas documentação
- ⏩ Configuração (docker-compose.yml, tsconfig.json)

### 2. Setup (3 Janelas Separadas) ✅

**IMPORTANTE: Rodar cada MCP em janela separada do navegador para evitar conflitos**

```bash
# Janela 1: Playwright MCP
# URL: http://localhost:3100/<página>
# Uso: Navegação, screenshots, network requests

# Janela 2: Chrome DevTools MCP
# URL: http://localhost:3100/<página>
# Uso: Console, performance, accessibility snapshot

# Janela 3: Selenium MCP (se necessário)
# URL: http://localhost:3100/<página>
# Uso: Interações complexas, upload de arquivo
```

### 3. Playwright MCP ✅

**Objetivo:** Validar funcionalidade e capturar evidências visuais

```typescript
// 3.1. Navegar
await mcp__playwright__browser_navigate({
  url: "http://localhost:3100/oauth-manager"
});

// 3.2. Capturar snapshot (a11y tree)
await mcp__playwright__browser_snapshot();

// VERIFICAR:
- [ ] Página carregou completamente?
- [ ] Todos os elementos visíveis?
- [ ] Textos corretos?
- [ ] Botões com labels acessíveis?

// 3.3. Screenshot para documentação
await mcp__playwright__browser_take_screenshot({
  filename: "oauth_manager_validation.png",
  fullPage: true
});

// 3.4. Testar interações
await mcp__playwright__browser_click({
  element: "Botão Iniciar Renovação",
  ref: "<ref do snapshot>"
});

await mcp__playwright__browser_wait_for({
  text: "Sessão OAuth iniciada com sucesso"
});

// 3.5. Verificar network requests
await mcp__playwright__browser_network_requests();

// VERIFICAR:
- [ ] Requests retornaram 200 OK?
- [ ] Sem requests 404/500?
- [ ] Payloads corretos?
```

### 4. Chrome DevTools MCP ✅

**Objetivo:** Validar console, performance e acessibilidade

```typescript
// 4.1. Navegar
await mcp__chrome-devtools__navigate_page({
  type: "url",
  url: "http://localhost:3100/oauth-manager"
});

// 4.2. Capturar snapshot (a11y)
await mcp__chrome-devtools__take_snapshot({
  verbose: true
});

// VERIFICAR:
- [ ] Elementos com roles corretos?
- [ ] Labels acessíveis?
- [ ] Hierarquia correta?

// 4.3. Verificar console
await mcp__chrome-devtools__list_console_messages({
  types: ["error", "warn"]
});

// VERIFICAR:
- [ ] 0 erros no console?
- [ ] Warnings apenas não-críticos?
- [ ] INFO permitidos (React DevTools)

// 4.4. Analisar network
await mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["fetch", "xhr"]
});

// VERIFICAR:
- [ ] Requests para endpoints corretos?
- [ ] Sem duplicação de requests?
- [ ] Timing aceitável (< 1s)?

// 4.5. Screenshot
await mcp__chrome-devtools__take_screenshot({
  filePath: "oauth_manager_devtools.png",
  fullPage: true
});
```

---

## 🔧 TROUBLESHOOTING E CORREÇÕES DEFINITIVAS

### 1. Metodologia de Troubleshooting ✅

**SEMPRE seguir este fluxo para problemas:**

```bash
# PASSO 1: REPRODUZIR
- [ ] Consegue reproduzir o problema consistentemente?
- [ ] Quais passos exatos causam o problema?
- [ ] Problema ocorre em todos os ambientes (dev, staging)?

# PASSO 2: COLETAR LOGS
- [ ] Logs do serviço afetado (últimas 200 linhas)
docker-compose logs <service> --tail=200 > debug_logs.txt

- [ ] Console do navegador (F12 → Console)
Copiar TODOS os erros e warnings

- [ ] Network requests (F12 → Network)
Identificar requests com status 4xx/5xx

- [ ] Git status e branch
git status
git log -3

# PASSO 3: IDENTIFICAR CAUSA RAIZ
- [ ] Ler stack trace completo (não só primeira linha)
- [ ] Buscar erro no Google: site:stackoverflow.com "erro exato"
- [ ] Verificar TROUBLESHOOTING.md (problema conhecido?)
- [ ] Verificar mudanças recentes: git log --since="2 days ago" --oneline

# PASSO 4: HIPÓTESES
- [ ] Listar 3 hipóteses de causa raiz (mais provável → menos provável)
- [ ] Para cada hipótese, definir teste para validar/invalidar

# PASSO 5: TESTAR HIPÓTESES
- [ ] Testar hipótese 1
- [ ] Se falhar, testar hipótese 2
- [ ] Se falhar, testar hipótese 3
- [ ] Se todas falharem → pedir ajuda (GitHub issue, Stack Overflow)

# PASSO 6: APLICAR CORREÇÃO DEFINITIVA
- [ ] Implementar correção (não workaround!)
- [ ] Adicionar testes para prevenir regressão (se possível)
- [ ] Documentar em TROUBLESHOOTING.md
- [ ] Commit detalhado com causa raiz + solução

# PASSO 7: VALIDAR CORREÇÃO
- [ ] Reproduzir problema original → deve estar resolvido
- [ ] Reiniciar serviços e testar novamente
- [ ] Testar por 3 vezes (garantir consistência)
```

---

## 📚 GESTÃO DE DOCUMENTAÇÃO

### 1. Hierarquia de Documentação ✅

```
DOCUMENTAÇÃO DO PROJETO
│
├── NÍVEL 1: ESSENCIAL (leitura obrigatória)
│   ├── README.md                    # Visão geral, instalação, quick start
│   ├── CLAUDE.md                    # Metodologia Claude Code
│   ├── CHECKLIST_TODO_MASTER.md     # Este arquivo (checklist + TODO)
│   └── ROADMAP.md                   # Histórico + fases + TODO master
│
├── NÍVEL 2: TÉCNICO (referência frequente)
│   ├── ARCHITECTURE.md              # Arquitetura, stack, fluxos
│   ├── DATABASE_SCHEMA.md           # Schema PostgreSQL completo
│   ├── INSTALL.md                   # Instalação detalhada
│   ├── TROUBLESHOOTING.md           # 16+ problemas conhecidos
│   └── CONTRIBUTING.md              # Convenções de código, Git workflow
│
├── NÍVEL 3: ESPECÍFICO (consulta pontual)
│   ├── FASE_X_<NOME>.md             # Documentação de fase específica
│   ├── PLANO_FASE_X_<NOME>.md       # Planejamento de fase
│   ├── VALIDACAO_FASE_X_<NOME>.md   # Validação de fase
│   └── <FEATURE>_<DATA>.md          # Documentação de feature específica
│
└── NÍVEL 4: GUIAS (uso ocasional)
    ├── MCPS_USAGE_GUIDE.md          # 8 MCPs instalados
    ├── METODOLOGIA_MCPS_INTEGRADA.md # Integração MCPs
    └── DOCUMENTACAO_SCRAPERS_COMPLETA.md # 31 fontes de dados
```

### 2. Quando Atualizar Cada Documento ✅

| Documento | Quando Atualizar |
|-----------|------------------|
| **README.md** | • Novo serviço/porta<br>• Novo pré-requisito<br>• Mudança no Quick Start |
| **CLAUDE.md** | • Nova regra de metodologia<br>• Novo padrão identificado<br>• Mudança em Zero Tolerance Policy |
| **CHECKLIST_TODO_MASTER.md** | • Nova validação necessária<br>• Novo problema crônico resolvido<br>• Nova fase concluída (atualizar TODO Master) |
| **ROADMAP.md** | • Fase concluída (100%)<br>• Nova fase iniciada<br>• Mudança em planejamento |
| **ARCHITECTURE.md** | • Novo serviço/container<br>• Nova integração<br>• Mudança arquitetural |
| **DATABASE_SCHEMA.md** | • Nova entity<br>• Nova migration<br>• Mudança em relacionamentos |
| **TROUBLESHOOTING.md** | • Novo problema resolvido<br>• Solução definitiva encontrada |
| **CONTRIBUTING.md** | • Nova convenção de código<br>• Mudança em Git workflow |

---

## 📋 TODO MASTER (PRÓXIMAS FASES)

**Status Atual do Projeto:** 52.8% COMPLETO (28.5 fases concluídas de 54 planejadas)

### ✅ Fases Recentemente Concluídas

#### FASE 27: Sub-Agents Especializados ✅ 100% COMPLETO (2025-11-14)

**Concluído:**
- ✅ 6 sub-agents criados (backend, frontend, scrapers, charts, typescript, queue)
- ✅ `.claude/agents/README.md` com guia completo
- ✅ CLAUDE.md atualizado com seção sub-agents
- ✅ Validação ultra-robusta (Task tool análise)
- ✅ Commits: 4178528 (sub-agents)

**Documentação:**
- ✅ `FASE_27_SUB_AGENTS_ESPECIALIZADOS.md`
- ✅ `.claude/agents/README.md`
- ✅ 6 arquivos .md (1 por sub-agent)

---

#### FASE 27.5: OAuth Manager - Melhorias de UX ✅ 100% COMPLETO (2025-11-15)

**Concluído:**
- ✅ 5 melhorias implementadas (salvar parcial, voltar, seletor, loop, sessão órfã)
- ✅ +541 linhas (frontend + backend)
- ✅ Validação TypeScript (0 erros)
- ✅ Validação Build (Success)
- ✅ Validação MCP (Chrome DevTools)
- ✅ ROADMAP.md atualizado (FASE 27.5)
- ✅ Commits: 4172d9a + 114a811 + 7789115

**Documentação:**
- ✅ `OAUTH_MANAGER_MELHORIAS_2025-11-15.md`
- ✅ ROADMAP.md atualizado
- ✅ Screenshot: `oauth_manager_validation_screenshot.png`

---

### 📌 Próximas Fases (Prioridade Alta)

#### FASE 28: Refatoração Sistema de Relatórios (PLANEJADO)

**Objetivo:** Reorganizar sistema de relatórios para melhor UX e manutenibilidade

**Contexto:**
- Atualmente relatórios estão misturados em `/reports` e `/analysis`
- Falta padronização de visualização (cards, tabelas, charts)
- Oportunidade de implementar templates reutilizáveis

**Status:** ⏳ AGUARDANDO APROVAÇÃO

**Documentação:** `REFATORACAO_SISTEMA_REPORTS.md` (já existe)

---

#### FASE 29: Sistema de Atualização Automática de Ativos (PLANEJADO)

**Objetivo:** Implementar sistema robusto de atualização automática de preços e dados fundamentalistas

**Componentes:**
- Backend: BullMQ jobs (daily-update, weekly-fundamentals)
- Frontend: Dashboard de jobs (`/admin/jobs`)
- Retry logic + WebSocket notifications

**Status:** ⏳ PLANEJADO (depende FASE 28)

**Documentação:** `ROADMAP_SISTEMA_ATUALIZACAO_ATIVOS.md` (já existe)

---

#### FASE 30: Implementar Testes E2E (Playwright) (PLANEJADO)

**Objetivo:** Criar suite completa de testes E2E para páginas principais

**Componentes:**
- Setup Playwright
- 50+ testes (dashboard, assets, analysis, portfolio, reports, oauth-manager)
- CI/CD integration (GitHub Actions)

**Status:** ⏳ PLANEJADO (depende FASE 28 + 29)

---

### 🎯 Fases Futuras (Prioridade Média)

- **FASE 31:** Sistema de Notificações (8-10h)
- **FASE 32:** Dashboard de Admin com Métricas (6-8h)
- **FASE 33:** Sistema de Alertas (10-12h)

### 🚀 Fases Futuras (Prioridade Baixa)

- **FASE 34:** Backup Automático (4-6h)
- **FASE 35:** Caching Redis (6-8h)
- **FASE 36:** Rate Limiting API (4-6h)
- **FASE 37:** Deploy Produção AWS/GCP (15-20h)

---

## 🎓 CONCLUSÃO

Este **CHECKLIST TODO MASTER** é o documento definitivo para garantir 100% de qualidade em todas as fases de desenvolvimento.

### ✅ Princípios Fundamentais (SEMPRE LEMBRAR):

1. **Verdade dos Arquivos > Documentação** - Sempre validar código real
2. **Análise de Dependências** - Verificar impacto antes de mudanças
3. **Git Sempre Atualizado** - Working tree clean antes de nova fase
4. **Reiniciar Serviços** - Verificar necessidade antes de testar
5. **Correções Definitivas** - Nunca "workaround", sempre causa raiz
6. **Dados Reais > Mocks** - Usar dados dos scrapers sempre que possível
7. **Zero Tolerance** - 0 erros TypeScript, 0 erros Build, 0 console errors
8. **Documentação 100%** - Atualizar docs junto com código (mesmo commit)
9. **MCP Triplo** - Validação robusta antes de marcar fase como 100%
10. **TodoWrite Disciplina** - Apenas 1 in_progress, completar imediatamente

### 🚫 Anti-Patterns (NUNCA FAZER):

1. ❌ Implementar sem ler contexto
2. ❌ Commitar com erros TypeScript
3. ❌ Commitar com build quebrado
4. ❌ Pular validações do checklist
5. ❌ Múltiplos todos in_progress
6. ❌ Avançar fase com fase anterior incompleta
7. ❌ Confiar cegamente na documentação
8. ❌ Aplicar fix temporário para problema crônico
9. ❌ Testar sem reiniciar serviços modificados
10. ❌ Usar dados mockados em produção/staging

---

**Última Atualização:** 2025-11-15
**Mantenedor:** Claude Code (Sonnet 4.5)
**Versão:** 2.0.0 (Ultra-Robusto)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
