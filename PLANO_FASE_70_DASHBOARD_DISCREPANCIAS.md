# PLANO FASE 70: Dashboard de Discrepancias

**Data:** 2025-12-05
**Tipo:** Feature
**Prioridade:** ALTA
**Estimativa:** 8-10h
**Versao do Plano:** v1.0

---

## 1. Objetivo

Criar uma pagina dedicada `/discrepancies` para visualizar todas as discrepancias detectadas entre fontes de dados, com filtros avancados, metricas agregadas e navegacao drill-down para os ativos.

---

## 2. Analise do Estado Atual

### 2.1 O que ja existe

1. **Backend - Endpoint de discrepancias** (`backend/src/scrapers/scrapers.controller.ts:259`)
   - `GET /scrapers/discrepancies`
   - Parametros: `limit`, `severity`, `field`
   - Retorna: lista de discrepancias com summary

2. **Backend - Logica de deteccao** (`backend/src/scrapers/scrapers.service.ts:1124`)
   - Busca dados com `fieldSources` do `FundamentalData`
   - Calcula severidade por desvio percentual:
     - > 20% = HIGH
     - > 10% = MEDIUM
     - <= 10% = LOW
   - Ordena por severidade e desvio

3. **Frontend - Hook existente** (`frontend/src/lib/hooks/useDataSources.ts:98`)
   - `useScrapersDiscrepancies({ limit, severity, field })`
   - Tipagem completa: `Discrepancy`, `DiscrepanciesResponse`

4. **Frontend - Visualizacao parcial** (`frontend/src/app/(dashboard)/data-sources/page.tsx`)
   - Aba "Alertas" na pagina de Fontes de Dados
   - Cards de summary (total, high, medium, low)
   - Filtro por severidade
   - Lista de discrepancias com detalhe

### 2.2 O que falta (escopo FASE 70)

1. **Pagina dedicada** `/discrepancies`
2. **Filtro por ativo** (ticker)
3. **Filtro por data** (range de datas)
4. **Tabela com ordenacao** (colunas clicaveis)
5. **Drill-down para ativo** (link para `/assets/[ticker]`)
6. **Metricas agregadas**:
   - Top 10 ativos com mais discrepancias
   - Top 10 campos com mais discrepancias
7. **Paginacao** (atualmente limitado a 100)
8. **Entrada no menu de navegacao**

---

## 3. Arquitetura da Solucao

### 3.1 Backend - Novo Endpoint

Expandir o endpoint existente com novos parametros:

```typescript
// GET /scrapers/discrepancies
// Novos parametros:
// - ticker: string (filtrar por ativo)
// - startDate: string (ISO date)
// - endDate: string (ISO date)
// - page: number (paginacao)
// - pageSize: number (itens por pagina, default 50)
// - orderBy: string (field, severity, deviation, date)
// - orderDirection: 'asc' | 'desc'
```

Novo endpoint para metricas agregadas:

```typescript
// GET /scrapers/discrepancies/stats
// Retorna:
// - topAssets: Array<{ ticker, count, avgDeviation }>
// - topFields: Array<{ field, fieldLabel, count, avgDeviation }>
// - timeline: Array<{ date, high, medium, low }> (ultimos 30 dias)
```

### 3.2 Frontend - Nova Pagina

```
frontend/src/app/(dashboard)/discrepancies/
  ├── page.tsx           # Pagina principal
  └── loading.tsx        # Loading state
```

### 3.3 Componentes

Reutilizar componentes existentes:
- `Card`, `Badge`, `Button` (Shadcn/ui)
- `Tooltip` para informacoes adicionais
- `Select` para filtros dropdown
- `Input` para busca por ticker
- `DatePicker` para range de datas

Novos componentes (inline na pagina):
- `DiscrepanciesTable` - Tabela ordenavel
- `DiscrepancyStats` - Cards de metricas
- `TopDiscrepanciesChart` - Graficos de top 10

---

## 4. Plano de Implementacao

### Etapa 1: Backend - Expandir Endpoints (2h)

1. Adicionar parametros ao endpoint existente:
   - `ticker`, `startDate`, `endDate`
   - `page`, `pageSize`
   - `orderBy`, `orderDirection`

2. Criar novo endpoint `/scrapers/discrepancies/stats`:
   - Query agregada para top 10 ativos
   - Query agregada para top 10 campos
   - Timeline dos ultimos 30 dias

3. Atualizar DTOs com novos campos

### Etapa 2: Frontend - API Client (0.5h)

1. Atualizar `api.ts` com novos parametros
2. Atualizar hook `useScrapersDiscrepancies`
3. Criar hook `useDiscrepancyStats`

### Etapa 3: Frontend - Pagina Principal (3h)

1. Criar `discrepancies/page.tsx`:
   - Header com titulo e descricao
   - Cards de metricas (summary)
   - Filtros (severidade, ticker, campo, data)
   - Tabela ordenavel com todas discrepancias
   - Links para drill-down

2. Adicionar ao menu de navegacao (`sidebar.tsx`)

### Etapa 4: Frontend - Metricas Agregadas (2h)

1. Cards de top 10 ativos/campos
2. Graficos simples (barras horizontais)
3. Timeline de discrepancias (opcional)

### Etapa 5: Validacao e Testes (1h)

1. TypeScript validation (0 erros)
2. Build validation
3. Chrome DevTools MCP - snapshot + console
4. Testar todos os filtros
5. Testar ordenacao
6. Testar drill-down

### Etapa 6: Documentacao (0.5h)

1. Atualizar ROADMAP.md
2. Criar VALIDACAO_FASE_70.md
3. Commit com mensagem descritiva

---

## 5. Dependencias

### Bibliotecas ja instaladas (nao precisa adicionar):
- React Query (useQuery)
- Shadcn/ui components
- Lucide icons
- date-fns (se precisar formatacao de data)

### Sem novas dependencias necessarias

---

## 6. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Performance com muitos registros | Media | Alto | Paginacao server-side |
| Complexidade de filtros | Baixa | Medio | Reutilizar patterns existentes |
| Duplicacao com data-sources | Baixa | Baixo | Link cruzado entre paginas |

---

## 7. Criterios de Aceite

- [ ] Pagina `/discrepancies` acessivel via menu
- [ ] Filtros funcionando: severidade, ticker, campo
- [ ] Tabela com ordenacao por clique no header
- [ ] Drill-down funcional para `/assets/[ticker]`
- [ ] Metricas de top 10 ativos e campos
- [ ] TypeScript: 0 erros
- [ ] Build: sucesso
- [ ] Console: 0 erros

---

## 8. Decisao: Pagina Nova vs Expandir Existente

**Decisao:** Criar pagina nova `/discrepancies`

**Justificativa:**
1. A aba "Alertas" em data-sources ja esta complexa
2. Dashboard dedicado permite mais funcionalidades
3. Melhor UX para analise focada em discrepancias
4. Permite metricas agregadas sem poluir a pagina existente
5. Facilita navegacao direta via menu

**Trade-off:** Pequena duplicacao de codigo (helpers de severidade/cores)
**Mitigacao:** Extrair helpers para arquivo compartilhado se necessario

---

## 9. Proximos Passos

1. Revisar e aprovar este plano
2. Iniciar implementacao pela Etapa 1 (Backend)
3. Seguir ordem das etapas sequencialmente
4. Validar a cada etapa antes de prosseguir

---

**Autor:** Claude Code (Opus 4.5)
**Revisao:** Pendente aprovacao do usuario
