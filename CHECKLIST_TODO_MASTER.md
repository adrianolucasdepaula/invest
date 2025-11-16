# ✅ CHECKLIST TODO MASTER - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Versão:** 2.1.0 (Ultra-Robusto + 4 Melhorias)
**Criado:** 2025-11-15
**Última Atualização:** 2025-11-15 (4 melhorias aplicadas)
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

### 6. Gerenciamento de Ambiente (system-manager.ps1)

**SEMPRE usar system-manager.ps1 para gerenciar o ambiente:**

```powershell
# 6.1. Subir ambiente completo
.\system-manager.ps1 up

# 6.2. Parar ambiente
.\system-manager.ps1 down

# 6.3. Ver status de todos os serviços
.\system-manager.ps1 status

# 6.4. Ver logs de serviço específico
.\system-manager.ps1 logs <service-name>

# Exemplos:
.\system-manager.ps1 logs api-service
.\system-manager.ps1 logs scrapers
.\system-manager.ps1 logs frontend
```

**Modificações no Script:**

```bash
# Se novo serviço adicionado ao docker-compose.yml:
- [ ] Atualizar system-manager.ps1 (adicionar serviço na lista)
- [ ] Documentar novo serviço no próprio script (comentários)

# Se nova feature necessária:
- [ ] Adicionar função ao system-manager.ps1
- [ ] Testar função em ambiente local
- [ ] Documentar uso no INSTALL.md

# Exemplo de nova feature:
# .\system-manager.ps1 backup   → Criar backup completo (DB + arquivos)
# .\system-manager.ps1 restore  → Restaurar backup
```

**Por quê usar system-manager.ps1?**
- Comandos padronizados (evita erros de digitação)
- Gerencia dependências entre serviços
- Valida pré-requisitos antes de subir ambiente
- Facilita onboarding de novos desenvolvedores
- Consistência entre ambientes (local, staging, produção)

### 7. Dados Reais > Mocks

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

### 8. Precisão de Dados Financeiros ✅ OBRIGATÓRIO

**CONTEXTO:**
Sistema financeiro exige precisão absoluta. NUNCA manipular valores monetários.

**PROIBIÇÕES ABSOLUTAS:**

❌ **NUNCA fazer:**

1. **Arredondar preços, dividendos, ou qualquer valor monetário**
   ```typescript
   // ❌ PROIBIDO
   const price = Math.round(asset.price * 100) / 100;  // 35.4567 → 35.46
   const price = asset.price.toFixed(2);               // "35.46" (perde precisão)
   ```

2. **Converter tipos de forma insegura**
   ```typescript
   // ❌ PROIBIDO
   const price = parseFloat(priceString);  // Sem validação
   const price = Number(priceString);      // Pode retornar NaN
   ```

3. **Ajustar valores "para caber no chart"**
   ```typescript
   // ❌ PROIBIDO
   const adjustedPrice = price * 0.95;  // "Ajuste" para visualização
   const scaledPrice = price / 1000;    // "Simplificar" grandes números
   ```

4. **Truncar decimais importantes**
   ```typescript
   // ❌ PROIBIDO
   const price = Number(asset.price.toFixed(2));  // 35.4567 → 35.46
   const price = Math.floor(asset.price * 100) / 100;
   ```

✅ **SEMPRE fazer:**

1. **Usar tipo `number` do TypeScript (precisão IEEE 754)**
   ```typescript
   // ✅ CORRETO
   const price: number = asset.price;  // 35.4567 mantém precisão

   // ✅ CORRETO: Validação de tipo
   if (typeof price !== 'number' || isNaN(price)) {
     throw new Error('Preço inválido');
   }
   ```

2. **Manter precisão decimal original**
   ```typescript
   // ✅ CORRETO: Salvar no DB exatamente como veio do scraper
   const asset = {
     ticker: "PETR4",
     price: 35.4567,  // Exatamente como retornado pela API
     lastUpdate: new Date()
   };

   // Database schema deve usar DECIMAL/NUMERIC (não FLOAT)
   // @Column({ type: 'decimal', precision: 10, scale: 4 })
   // price: number;
   ```

3. **Cross-validar com 3+ fontes antes de salvar**
   ```typescript
   // ✅ CORRETO: Validar divergências, mas NÃO ajustar valores
   const prices = await Promise.all([
     fundamentus.getPrice(ticker),
     brapi.getPrice(ticker),
     statusInvest.getPrice(ticker),
   ]);

   // Calcular divergência
   const maxPrice = Math.max(...prices);
   const minPrice = Math.min(...prices);
   const divergence = ((maxPrice - minPrice) / minPrice) * 100;

   // Se divergência > 1%, logar WARNING (mas NÃO ajustar)
   if (divergence > 1) {
     logger.warn(`Divergência de ${divergence.toFixed(2)}% para ${ticker}`, {
       prices,
       sources: ['fundamentus', 'brapi', 'statusInvest']
     });
   }

   // Salvar valor da fonte mais confiável (definida por prioridade)
   const finalPrice = prices[0];  // fundamentus (prioridade 1)
   ```

4. **Logar divergências entre fontes (sem ajustar)**
   ```typescript
   // ✅ CORRETO: Transparência total
   if (Math.abs(price1 - price2) > 0.01) {
     logger.warn('Divergência de preços detectada', {
       ticker,
       fundamentus: price1,
       brapi: price2,
       divergence: Math.abs(price1 - price2),
       percentual: ((Math.abs(price1 - price2) / price1) * 100).toFixed(2) + '%'
     });
     // NÃO ajustar, apenas logar
   }
   ```

5. **Exibir valores exatos no frontend**
   ```typescript
   // ✅ CORRETO: Formatação visual (apenas display)
   <div className="text-2xl font-bold">
     {new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL',
       minimumFractionDigits: 2,
       maximumFractionDigits: 4  // Preservar até 4 decimais
     }).format(asset.price)}
   </div>

   // Resultado: R$ 35,4567 (preserva precisão original)

   // ❌ ERRADO:
   // R$ {asset.price.toFixed(2)}  → R$ 35.46 (perde decimais)
   ```

**Exceções Permitidas:**

1. **Formatação Visual (apenas display, DB mantém precisão):**
   ```typescript
   // ✅ PERMITIDO: Display arredondado, DB preserva original
   const displayPrice = "R$ 35,46";   // Frontend (visual)
   const dbPrice = 35.4567;            // Database (precisão)
   ```

2. **Agregações (indicar claramente que são aproximações):**
   ```typescript
   // ✅ PERMITIDO: Com indicação clara
   const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

   // Exibir:
   <span className="text-sm text-muted-foreground">
     Preço Médio (aprox.): R$ {avgPrice.toFixed(2)}
   </span>
   ```

3. **Indicadores Técnicos (natureza aproximada):**
   ```typescript
   // ✅ PERMITIDO: Indicadores técnicos são aproximações por natureza
   const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
   const rsi = calculateRSI(prices);  // RSI não precisa 8 decimais

   // Mas NUNCA arredondar os preços originais que alimentam os indicadores
   ```

**Validação:**

```bash
# Checklist de Precisão Financeira:
- [ ] Todos os valores monetários salvos com precisão original? (sem toFixed, sem Math.round)
- [ ] Cross-validation de 3+ fontes implementada?
- [ ] Divergências logadas (mas não ajustadas automaticamente)?
- [ ] Frontend exibe valores exatos (Intl.NumberFormat com maxFractionDigits adequado)?
- [ ] Agregações indicam claramente que são aproximações?
- [ ] Database usa DECIMAL/NUMERIC (não FLOAT)?
- [ ] TypeScript valida tipos (typeof === 'number', !isNaN)?
```

**Database Schema Correto:**

```typescript
// ✅ CORRETO: Usar DECIMAL para valores monetários
@Entity()
export class Asset {
  @Column({ type: 'decimal', precision: 10, scale: 4 })
  price: number;  // 35.4567 → salvo exatamente

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  dividendYield: number;  // 0.0567 → 5.67%
}

// ❌ ERRADO: FLOAT perde precisão
// @Column({ type: 'float' })
// price: number;  // 35.4567 pode virar 35.456699999
```

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

# 1.4. Verificar se já existe (ANTI-DUPLICAÇÃO) ✅
# OBRIGATÓRIO: Antes de criar novo componente/service/entity
- [ ] Buscar no código por nome similar:
      grep -r "NomeSimilar" backend/src
      grep -r "NomeSimilar" frontend/src
- [ ] Buscar por padrão similar:
      grep -r "PatternProcurado" <diretório>
- [ ] Consultar ARCHITECTURE.md → "Onde Armazenar Novos Dados"
- [ ] Consultar DATABASE_SCHEMA.md → Entities existentes
- [ ] Consultar CONTRIBUTING.md → Convenções de nomenclatura
- [ ] Se encontrou similar → REAPROVEITAR/MELHORAR (não recriar)
- [ ] Se não encontrou → CRIAR seguindo padrões do projeto
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

### 2.1. Organização de Screenshots ✅

**Estrutura de Pastas:**

```
validations/
├── FASE_XX_NOME/
│   ├── 1_playwright_page_load.png
│   ├── 2_playwright_interaction.png
│   ├── 3_playwright_network_requests.png
│   ├── 4_chrome_devtools_console.png
│   ├── 5_chrome_devtools_network.png
│   └── 6_chrome_devtools_performance.png
```

**Nomenclatura Padrão:**

```
{ordem}_{mcp}_{tipo}_{feature}.png

Exemplos:
- 1_playwright_oauth_manager_initial.png
- 2_playwright_oauth_manager_after_click.png
- 3_playwright_network_requests.png
- 4_chrome_devtools_console_errors.png
- 5_chrome_devtools_network_fetch.png
- 6_chrome_devtools_performance_trace.png
```

**Salvamento de Screenshots:**

```typescript
// Playwright MCP
await mcp__playwright__browser_take_screenshot({
  filename: "validations/FASE_30_BACKEND_INTEGRATION/1_playwright_technical_analysis.png",
  fullPage: true
});

// Chrome DevTools MCP
await mcp__chrome-devtools__take_screenshot({
  filePath: "validations/FASE_30_BACKEND_INTEGRATION/4_chrome_devtools_console.png",
  fullPage: true
});
```

**Documentação de Screenshots:**

```markdown
# Em VALIDACAO_FASE_XX.md, sempre incluir seção:

## Screenshots

### Playwright MCP

![1. Page Load](./validations/FASE_30_BACKEND_INTEGRATION/1_playwright_technical_analysis.png)
*Página carregada com sucesso - todos os elementos visíveis*

![2. Interaction](./validations/FASE_30_BACKEND_INTEGRATION/2_playwright_interaction.png)
*Após clicar em "Calcular Indicadores" - resultados aparecem*

### Chrome DevTools MCP

![4. Console](./validations/FASE_30_BACKEND_INTEGRATION/4_chrome_devtools_console.png)
*Console: 0 erros, 2 warnings não-críticos (React DevTools)*

![5. Network](./validations/FASE_30_BACKEND_INTEGRATION/5_chrome_devtools_network.png)
*Network: 8 requests, todos 200 OK, sem duplicações*
```

**Checklist de Screenshots:**

```bash
- [ ] Pasta validations/FASE_XX_NOME/ criada?
- [ ] Screenshots numerados em ordem lógica?
- [ ] Nomenclatura segue padrão {ordem}_{mcp}_{tipo}_{feature}.png?
- [ ] Todos os screenshots incluídos no VALIDACAO_FASE_XX.md?
- [ ] Captions descritivas para cada screenshot?
- [ ] Screenshots mostram EVIDÊNCIA de validação (não apenas "página bonita")?
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

### 5. React Developer Tools (se necessário) ⚡

**Objetivo:** Inspecionar hierarquia de componentes React, props, state e performance.

**Quando Usar:**
- ⚠️ Investigar re-renders desnecessários
- ⚠️ Verificar props/state de componentes específicos
- ⚠️ Debugar hierarquia de componentes complexa
- ⚠️ Profiling de performance (Component Profiler)

**Setup:**
```bash
# 1. Instalar extensão React DevTools no Chrome
# URL: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi

# 2. Abrir DevTools → Components tab (novo ícone React)
# F12 → Components
```

**Checklist de Validação:**

```bash
# 5.1. Verificar hierarquia de componentes
- [ ] Abrir DevTools → Components tab
- [ ] Navegar até componente alvo (ex: OAuthManagerPage)
- [ ] Verificar se componente aparece na árvore
- [ ] Verificar children corretos

# 5.2. Inspecionar props
- [ ] Selecionar componente na árvore
- [ ] Painel direito → "props" section
- [ ] Verificar props esperadas estão presentes
- [ ] Verificar valores das props corretos
- [ ] Verificar props não-undefined quando não deveria

# 5.3. Inspecionar state
- [ ] Selecionar componente na árvore
- [ ] Painel direito → "hooks" section
- [ ] Verificar useState correto
- [ ] Verificar valores de state consistentes
- [ ] Verificar useEffect executando conforme esperado

# 5.4. Profiling de performance (se necessário)
- [ ] DevTools → Profiler tab
- [ ] Clicar "Record" → Executar ação → Clicar "Stop"
- [ ] Verificar flamegraph (componentes que mais renderizam)
- [ ] Identificar re-renders desnecessários (mesmas props/state)
- [ ] Otimizar com React.memo, useMemo, useCallback se necessário

# 5.5. Verificar Context
- [ ] Selecionar componente que usa context
- [ ] Painel direito → "contexts" section
- [ ] Verificar valores de context corretos
- [ ] Verificar context providers corretos na hierarquia
```

**Exemplo de Uso:**

```typescript
// Cenário: Botão "Adicionar ao Portfólio" não funciona

// 1. Abrir DevTools → Components
// 2. Buscar componente "AddToPortfolioButton"
// 3. Verificar props:
//    - ticker: "PETR4" ✅
//    - onAdd: function ✅
//    - disabled: true ❌ (deveria ser false)
// 4. Rastrear de onde vem disabled:
//    - Parent component: PortfolioCard
//    - State: isLoading: true (problema encontrado!)
// 5. Corrigir lógica de isLoading
```

**Notas:**
- ⚠️ React DevTools **NÃO substitui** MCPs (Playwright, Chrome DevTools)
- ✅ Usar como ferramenta **complementar** para debug específico de React
- ✅ Chrome DevTools Console já mostra erros críticos (suficiente para validação geral)

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

### 3. Atualização de Dependências (Context7 MCP) ✅

**Quando Atualizar:**

```bash
# Gatilhos para atualização:
- [ ] Após concluir fase importante (ex: FASE 30, FASE 35)
- [ ] Vulnerabilidade de segurança identificada (npm audit)
- [ ] Nova versão major de biblioteca crítica (Next.js 15, NestJS 11, React 19)
- [ ] Mensalmente (manutenção preventiva - 1ª semana do mês)
- [ ] Biblioteca deprecada ou EOL (End of Life)
```

**Cronograma Recomendado (Atualizações Periódicas):**

| Frequência | Escopo | Comandos | Quando Executar |
|------------|--------|----------|-----------------|
| **📅 Semanal** | Patches críticos | `npm update` (patch versions) | Segunda-feira, 9h |
| **📅 Mensal** | Minor versions | `npm outdated` → Context7 MCP → `npm update` | 1ª semana do mês |
| **📅 Trimestral** | Major versions (planejadas) | Context7 MCP + Planejamento | Após fase importante |
| **📅 Emergencial** | Vulnerabilidades críticas | `npm audit fix` | Imediato (< 24h) |
| **📅 Pós-Fase** | Consolidação técnica | Atualizar deps desatualizadas | Após fase 30, 35, 40... |

**Detalhamento do Cronograma:**

```bash
# ⏰ SEMANAL (patches críticos)
# Segunda-feira, 9h (10 minutos)
cd backend && npm update
cd frontend && npm update
npx tsc --noEmit  # Validar 0 erros
npm run build     # Validar success

# 📆 MENSAL (minor/patch de todas as deps)
# 1ª segunda-feira do mês (1-2 horas)
# Ver seção completa "PASSO 1-7" abaixo

# 📈 TRIMESTRAL (major versions planejadas)
# Após FASE 30, 35, 40, 45, 50...
# 1. Listar major versions disponíveis:
npm outdated | grep -E "wanted.*major"
# 2. Usar Context7 MCP para ver breaking changes
# 3. Criar PLANO_ATUALIZACAO_MAJOR_DEPS.md
# 4. Executar com TodoWrite + validação completa

# 🚨 EMERGENCIAL (vulnerabilidades críticas)
# Imediato (< 24h após identificação)
npm audit        # Identificar CVEs
npm audit fix    # Aplicar fixes automáticos
# Se não resolver automaticamente:
# - Consultar Context7 MCP para versão corrigida
# - Atualizar manualmente
# - Validar + Commit + Push + Deploy

# 🏁 PÓS-FASE (consolidação técnica)
# Após completar FASE importante (30, 35, 40...)
# 1. Revisar deps desatualizadas: npm outdated
# 2. Priorizar atualizações críticas (security, performance)
# 3. Criar planejamento se > 10 deps a atualizar
# 4. Executar atualizações + validação completa
```

**Exemplo de Log de Atualizações:**

```markdown
## LOG DE ATUALIZAÇÕES - 2025-11

### 2025-11-04 (Mensal)
- **Executado:** ✅ npm outdated + Context7 MCP
- **Atualizações:**
  - @nestjs/core: 10.2.10 → 10.3.0 (minor)
  - next: 14.0.3 → 14.0.4 (patch)
  - react-query: 4.35.3 → 4.36.0 (minor)
- **Validação:**
  - ✅ TypeScript: 0 erros
  - ✅ Build: Success (ambos)
  - ✅ Tests: 98 passing
- **Commit:** `c885e0a` (2025-11-04)

### 2025-11-08 (Semanal)
- **Executado:** ✅ npm update
- **Atualizações:** 3 patches (axios, lodash, date-fns)
- **Validação:** ✅ 0 erros
- **Commit:** `f43e7d7` (2025-11-08)

### 2025-11-15 (Emergencial)
- **Trigger:** npm audit → CVE-2025-12345 (axios < 1.6.5)
- **Ação:** npm audit fix → axios 1.6.5
- **Validação:** ✅ 0 erros
- **Commit:** `05768b6` (2025-11-15)
```

**Processo de Atualização (7 Passos):**

**PASSO 1: Verificar versões atuais**

```bash
# 1.1. Backend
cd backend
npm outdated

# Exemplo de output:
# Package       Current  Wanted  Latest  Location
# @nestjs/core  10.2.0   10.3.0  11.0.0  node_modules/@nestjs/core
# typeorm       0.3.17   0.3.20  0.4.0   node_modules/typeorm

# 1.2. Frontend
cd frontend
npm outdated

# Exemplo de output:
# Package    Current  Wanted  Latest  Location
# next       14.1.0   14.2.0  15.0.0  node_modules/next
# react      18.2.0   18.3.0  19.0.0  node_modules/react
```

**PASSO 2: Consultar Context7 MCP (Breaking Changes)**

```typescript
// 2.1. Resolver Library ID
await mcp__context7__resolve-library-id({
  libraryName: "next"
});

// Resultado:
// {
//   libraryID: "/vercel/next.js",
//   version: "15.0.0",
//   benchmarkScore: 98
// }

// 2.2. Obter documentação de migração
await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js/v15.0.0",
  topic: "migration guide from 14.x",
  tokens: 8000  // Mais tokens para guias de migração
});

// 2.3. Verificar breaking changes
await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "breaking changes v15",
  tokens: 5000
});
```

**PASSO 3: Classificar Atualizações**

```bash
# Classificação por urgência e risco:

# CRÍTICO (fazer imediatamente):
- Vulnerabilidades de segurança (npm audit fix)
- Bibliotecas EOL (End of Life)

# ALTA (fazer na próxima janela de manutenção):
- Versões minor com features importantes
- Correções de bugs críticos conhecidos

# MÉDIA (fazer mensalmente):
- Versões minor com melhorias de performance
- Versões patch acumuladas

# BAIXA (fazer trimestralmente):
- Versões major (requerem planejamento)
- Bibliotecas secundárias (não-críticas)
```

**PASSO 4: Atualizar package.json**

```bash
# 4.1. Bibliotecas CRÍTICAS: 1 por vez
# Exemplo: Next.js 14.1.0 → 14.2.0

cd frontend
npm install next@14.2.0

# 4.2. Bibliotecas SECUNDÁRIAS: em batch
# Exemplo: 5-10 libs patch/minor juntas

npm install \
  @types/node@latest \
  @types/react@latest \
  eslint-config-next@latest \
  lucide-react@latest \
  date-fns@latest

# 4.3. NUNCA atualizar bibliotecas major sem planejamento
# Exemplo: React 18 → 19 requer PLANO_MIGRACAO_REACT_19.md
```

**PASSO 5: Validação Pós-Atualização (OBRIGATÓRIO)**

```bash
# 5.1. Instalar dependências
npm install

# VERIFICAR:
- [ ] npm install sem erros?
- [ ] Sem peer dependency warnings críticos?

# 5.2. Validar TypeScript
npx tsc --noEmit

# RESULTADO ESPERADO:
# (silêncio = sucesso)

# RESULTADO PROIBIDO:
# error TS2305: Module '"next"' has no exported member 'GetServerSideProps'.
# → Se erro: reverter atualização, ler migration guide Context7

# 5.3. Validar Build
npm run build

# RESULTADO ESPERADO:
# ✓ Compiled successfully
# Route (app)                Size     First Load JS
# ...

# RESULTADO PROIBIDO:
# Error: Module not found: Can't resolve 'next/navigation'
# → Se erro: reverter atualização, criar PLANO_MIGRACAO_

# 5.4. Testes E2E (MCP Triplo) - OBRIGATÓRIO
# Rodar testes nas 3 páginas principais:
- [ ] /dashboard → Playwright + Chrome DevTools
- [ ] /assets/PETR4 → Playwright + Chrome DevTools
- [ ] /oauth-manager → Playwright + Chrome DevTools

# 5.5. Teste Manual (Smoke Test)
# Abrir http://localhost:3100
- [ ] Página carrega sem erro 500?
- [ ] Sidebar funciona?
- [ ] Navegação funciona?
- [ ] Console: 0 erros?
```

**PASSO 6: Commit de Atualização**

```bash
# 6.1. Commit individual para cada biblioteca crítica
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore(deps): atualizar Next.js 14.1.0 → 14.2.0

**Biblioteca:** Next.js
**Versão Anterior:** 14.1.0
**Versão Nova:** 14.2.0
**Tipo:** Minor update

**Breaking Changes:** Nenhum
**Migration Guide:** https://nextjs.org/docs/app/building-your-application/upgrading

**Validação:**
- ✅ npm install: Success
- ✅ TypeScript: 0 erros
- ✅ Build: Success (17 páginas compiladas)
- ✅ Tests E2E: 3/3 passing (Playwright + Chrome DevTools)
- ✅ Console: 0 erros

**Context7 MCP:** Consultado /vercel/next.js/v14.2.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 6.2. Commit batch para bibliotecas secundárias
git commit -m "chore(deps): atualizar 8 bibliotecas secundárias (patch/minor)"
```

**PASSO 7: Rollback (se necessário)**

```bash
# Se QUALQUER validação falhar:

# 7.1. Reverter commit
git reset --hard HEAD~1

# 7.2. Reinstalar deps antigas
npm install

# 7.3. Investigar breaking changes
# - Ler migration guide (Context7 MCP)
# - Buscar issues no GitHub da biblioteca
# - site:stackoverflow.com "biblioteca erro exato"

# 7.4. Se migração complexa → criar documento
PLANO_MIGRACAO_NEXT_15.md
- Breaking changes identificados
- Arquivos afetados (lista completa)
- Código antes/depois
- Estratégia de migração (incremental ou big bang)
- Validação (critérios de sucesso)
- Rollback plan

# 7.5. Agendar migração para próxima janela de manutenção
```

**Exemplo Completo (Next.js 14 → 15):**

```bash
# PASSO 1: Verificar versão atual
cd frontend
npm outdated next
# next  14.2.0  14.2.0  15.0.0

# PASSO 2: Consultar Context7
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js/v15.0.0",
  topic: "migration guide from 14.x",
  tokens: 10000
})

# PASSO 3: Criar documento de planejamento
# PLANO_MIGRACAO_NEXT_15.md (porque é major version)

# PASSO 4: Atualizar (após aprovação do plano)
npm install next@15.0.0 react@19.0.0 react-dom@19.0.0

# PASSO 5: Validar
npx tsc --noEmit   # 0 erros
npm run build      # Success
# MCP Triplo        # 3/3 passing

# PASSO 6: Commit
git commit -m "chore(deps): atualizar Next.js 14 → 15 + React 18 → 19"

# PASSO 7: Se falhar, rollback
git reset --hard HEAD~1
```

**Checklist de Atualização:**

```bash
- [ ] npm outdated executado (backend + frontend)?
- [ ] Context7 MCP consultado para breaking changes?
- [ ] Bibliotecas classificadas por urgência?
- [ ] Bibliotecas críticas atualizadas 1 por vez?
- [ ] npm install sem erros?
- [ ] npx tsc --noEmit → 0 erros?
- [ ] npm run build → Success?
- [ ] Testes E2E (MCP Triplo) → Passing?
- [ ] Console → 0 erros?
- [ ] Commit individual para cada lib crítica?
- [ ] Rollback plan documentado (se major version)?
```

---

## 📋 TODO MASTER (PRÓXIMAS FASES)

**Status Atual do Projeto:** 100% VALIDADO (FASE 29 + FASE 30 + Fix Crítico Completos)
**Última Validação:** 2025-11-16 (TypeScript 0 erros, Git clean, Modo Avançado funcionando)

### ✅ Fases Recentemente Concluídas

#### FASE 29: Gráficos Avançados (Análise Técnica Multi-Pane) ✅ 100% COMPLETO (2025-11-15)

**Entregas:**
- ✅ Candlestick com 15+ overlays (SMA, EMA, Bollinger, Pivot Points)
- ✅ Multi-pane chart (4 painéis: Candlestick, RSI, MACD, Stochastic)
- ✅ Página `/assets/[ticker]/technical` completa
- ✅ Testes Playwright (5 tests passing)
- ✅ Integração com Python Service (pandas_ta_classic)
- ✅ Commits: `816cd89`, `a98ae3f`, `93ece21`, `7b5a43b`
- ✅ +1,308 linhas

**Documentação:**
- ✅ `PLANO_FASE_29_GRAFICOS_AVANCADOS.md`
- ✅ `FASE_29_GRAFICOS_AVANCADOS_2025-11-15.md`
- ✅ `CHECKLIST_FASE_29_GRAFICOS_INDICADORES.md`

---

#### FASE 30: Backend Integration + Redis Cache ✅ 100% COMPLETO (2025-11-16)

**Entregas:**
- ✅ MarketDataModule (Controller + Service + DTOs)
- ✅ Cache Redis (5 min TTL, ~6,000x speedup)
- ✅ Python Service Client (retry logic + error handling)
- ✅ Frontend integration (proxy backend)
- ✅ Fix OHLCV validation (high >= low apenas)
- ✅ Commit: `4fc3f04`
- ✅ +3,506 linhas (12 novos arquivos backend)

**Performance:**
- Cache Miss: 6,100-6,300ms
- Cache Hit: 0ms
- Speedup: ~6,000x 🚀

**Documentação:**
- ✅ `FASE_30_BACKEND_INTEGRATION_2025-11-16.md`
- ✅ `PLANO_FASE_30.md`
- ✅ `validations/FASE_30_BACKEND_INTEGRATION/README.md`

---

#### Fix Crítico: Modo Avançado (Arrays Históricos) ✅ 100% COMPLETO (2025-11-16)

**Problema Resolvido:**
- Python Service retornava single values ao invés de arrays (`rsi: 65.999` → `rsi: [50.2, ..., 65.999]`)
- Frontend: `TypeError: rsiValues.map is not a function`
- Modo Avançado 100% quebrado (VALE3, PETR4)

**Solução:**
- Backend: `List[Optional[float]]` + retornar arrays completos via `_series_to_list()`
- Frontend: Transformar property names (snake_case → camelCase, macd.macd → macd.line)
- Commit: `352bddd`
- +95 linhas (3 arquivos modificados)

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ VALE3: Charts renderizando, 0 console errors
- ✅ PETR4: Charts renderizando, 0 console errors

**Documentação:**
- ✅ `validations/BUG_CRITICO_MODO_AVANCADO.md`

---

### 📌 Próximas Fases - AGUARDANDO DECISÃO

**📄 Documento de Análise:** `PROXIMO_PASSO_APOS_FASE_30.md` ⭐

#### Opção 1: FASE 25 - Refatoração Botão "Solicitar Análises" (PENDENTE)

**Status:** ⏳ AGUARDANDO APROVAÇÃO
**Complexidade:** Baixa (4-6h)
**Impacto:** UX (não bloqueante)

**Mudanças:**
- Remover botão de `/assets`
- Adicionar botão em `/analysis`
- Tooltip explicativo multi-fonte
- Validar backend coleta 6 fontes

---

#### Opção 2: FASE 31 - Sistema de Notificações (RECOMENDADO)

**Status:** 📋 PLANEJADO
**Complexidade:** Média (8-10h)
**Impacto:** UX significativo (notificações real-time)

**Componentes:**
- Entity: `Notification` (TypeORM)
- Service: `NotificationsService`
- WebSocket: `notification:new` event
- Frontend: NotificationBell + NotificationList
- Tipos: ANALYSIS_COMPLETED, PRICE_ALERT, PORTFOLIO_UPDATE, SYSTEM

**Pré-requisitos:**
- ✅ WebSocket já implementado
- ✅ TypeORM configurado
- ✅ Frontend Shadcn/ui

---

#### Opção 3: FASE 32 - Dashboard Admin com Métricas

**Status:** 📋 PLANEJADO
**Complexidade:** Média-Alta (10-12h)
**Impacto:** Operacional (monitoramento)

**Componentes:**
- Página: `/admin/dashboard`
- KPIs: usuários, ativos, análises
- Status scrapers: taxa sucesso, tempo resposta
- Logs de erros (últimos 100)
- Jobs BullMQ (status, retry)

**Pré-requisitos:**
- ✅ ScraperMetrics implementado (FASE 23)
- ✅ Recharts configurado
- ⚠️ Sistema de roles NÃO implementado (precisa criar)

---

#### Opção 4: FASE 33 - Sistema de Alertas de Preço

**Status:** 📋 PLANEJADO
**Complexidade:** Média (10-12h)
**Impacto:** Feature importante (usuários pedem muito)
**Depende:** FASE 31 (Sistema de Notificações)

**Componentes:**
- Entity: `PriceAlert`
- Job BullMQ: `check-price-alerts` (cron: 5 min)
- Página: `/alerts`
- Tipos: ABOVE/BELOW target price

---

#### Opção 5: Manutenção e Melhorias Incrementais (SAFE CHOICE)

**Status:** 🔄 Contínuo
**Complexidade:** Variável (2-20h)
**Impacto:** Qualidade geral

**Atividades:**
- Atualizar dependências (Context7 MCP)
- Ampliar testes E2E (50+ testes)
- Melhorias UX (loading states, tooltips)
- Performance (code splitting, lazy loading)
- Documentação (FAQ, guias)

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

**Última Atualização:** 2025-11-16
**Mantenedor:** Claude Code (Sonnet 4.5)
**Versão:** 2.2.0 (TODO Master Atualizado)

**Melhorias v2.2.0 (2025-11-16):**
1. ✅ TODO Master atualizado com FASE 29 + FASE 30 + Fix Crítico Modo Avançado
2. ✅ 5 opções de próximas fases analisadas (FASE 25, 31, 32, 33, Manutenção)
3. ✅ Documento `PROXIMO_PASSO_APOS_FASE_30.md` criado com análise completa
4. ✅ Recomendação Claude: FASE 31 (Notificações) como próximo passo lógico

**Melhorias v2.1.0 (2025-11-15):**
1. ✅ Seção 6: Gerenciamento de Ambiente (system-manager.ps1)
2. ✅ Seção 8: Precisão de Dados Financeiros (regras OBRIGATÓRIAS)
3. ✅ Seção 2.1 (MCP): Organização de Screenshots (nomenclatura + estrutura)
4. ✅ Seção 3 (Docs): Atualização de Dependências (Context7 MCP + 7 passos)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
