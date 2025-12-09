# PLANO FASE: Adicionar LPA, VPA, Liquidez Corrente

**Data:** 2025-12-09
**Status:** ✅ COMPLETO
**Versao:** 1.0

## 1. Objetivo

Adicionar suporte aos campos `lpa` (Lucro Por Acao), `vpa` (Valor Patrimonial por Acao) e `liquidezCorrente` (Liquidez Corrente) que eram coletados pelos scrapers Python mas nao estavam sendo salvos no banco de dados.

## 2. Root Cause Analysis

### Problema Original
- Scrapers Python (Fundamentus, StatusInvest, etc.) coletavam os campos
- Campos NAO estavam em `TRACKABLE_FIELDS` no backend
- Colunas NAO existiam na entity `FundamentalData`
- Frontend exibia "N/A" para esses indicadores

### Diagnostico
```
Scraper Python → Coleta dados → Backend recebe → NAO salva (campo nao rastreado)
                                                 ↓
                                          fieldSources = {} (vazio)
                                                 ↓
                                          API retorna null
                                                 ↓
                                          Frontend mostra N/A
```

## 3. Solucao Implementada

### 3.1 Backend - TRACKABLE_FIELDS
**Arquivo:** `backend/src/scrapers/interfaces/field-source.interface.ts`

```typescript
export const TRACKABLE_FIELDS = [
  // ... campos existentes ...
  'lpa',
  'vpa',
  'liquidezCorrente',
];

export const FIELD_SELECTION_STRATEGY: Record<string, string> = {
  // ... campos existentes ...
  lpa: 'consensus',
  vpa: 'consensus',
  liquidezCorrente: 'consensus',
};

export const DEFAULT_TOLERANCES: Record<string, number> = {
  // ... campos existentes ...
  lpa: 0.01,      // 1% tolerance
  vpa: 0.01,      // 1% tolerance
  liquidezCorrente: 0.005,  // 0.5% tolerance
};
```

### 3.2 Backend - Entity FundamentalData
**Arquivo:** `backend/src/database/entities/fundamental-data.entity.ts`

```typescript
@Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
lpa: number | null;

@Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
vpa: number | null;

@Column({ name: 'liquidez_corrente', type: 'decimal', precision: 18, scale: 2, nullable: true })
liquidezCorrente: number | null;
```

### 3.3 Backend - Migration
**Arquivo:** `backend/src/database/migrations/1765100000000-AddLpaVpaLiquidezCorrente.ts`

```typescript
await queryRunner.query(`ALTER TABLE "fundamental_data" ADD "lpa" numeric(18,2)`);
await queryRunner.query(`ALTER TABLE "fundamental_data" ADD "vpa" numeric(18,2)`);
await queryRunner.query(`ALTER TABLE "fundamental_data" ADD "liquidez_corrente" numeric(18,2)`);
```

### 3.4 Backend - Services Mapping
**Arquivos:**
- `backend/src/api/assets/assets-update.service.ts`
- `backend/src/api/assets/assets.service.ts`

```typescript
// Per Share Data
lpa: getFieldValue('lpa'),
vpa: getFieldValue('vpa'),

// Liquidity
liquidezCorrente: getFieldValue('liquidezCorrente', 'liquidez_corrente'),
```

### 3.5 Frontend - Componente
**Arquivo:** `frontend/src/components/FundamentalIndicatorsTable.tsx`

Componente de tabela com secoes colapsaveis:
- Valuation (P/L, P/VP, PSR, etc.)
- Rentabilidade (ROE, ROIC, ROA)
- Margens (Bruta, EBIT, Liquida)
- Endividamento
- Dividendos
- Por Acao (LPA, VPA) - NOVO
- Liquidez (Liquidez Corrente) - NOVO

### 3.6 Frontend - Interface TypeScript
**Arquivo:** `frontend/src/lib/hooks/use-assets.ts`

```typescript
export interface FieldSourceInfo {
  values?: FieldSourceValue[];
  finalValue: number | null;
  finalSource: string;
  sourcesCount: number;
  agreementCount: number;
  consensus: number;
  hasDiscrepancy: boolean;
  divergentSources?: DivergentSource[];
}
```

## 4. Validacoes Realizadas

### 4.1 TypeScript
- [x] Backend: 0 erros
- [x] Frontend: 0 erros

### 4.2 Migration
- [x] Executada com sucesso
- [x] Colunas criadas no banco

### 4.3 API
- [x] GET /api/v1/assets/PETR4/data-sources retorna lpa, vpa, liquidezCorrente

### 4.4 Dados (PETR4)
| Campo | Valor | Fonte | Consensus |
|-------|-------|-------|-----------|
| LPA | 6.01 | Fundamentus | 100% |
| VPA | 32.81 | Fundamentus | 100% |
| Liquidez Corrente | 0.82 | Fundamentus | 100% |

## 5. Issues Identificados

### 5.1 CRITICO - Scraper TypeScript Timeout
**Problema:** `FundamentusScraper.ts` usa `waitUntil: 'networkidle'` causando timeout de 3min
**Impacto:** Jobs de update-fundamentals falham
**Solucao:** Alterar para `waitUntil: 'load'` (padrao do Python scraper)
**Status:** PENDENTE

### 5.2 MEDIO - fieldSources vazio
**Problema:** Registros antigos tem fieldSources = {}
**Impacto:** API retorna null mesmo com dados nas colunas
**Solucao:** Scrape futuro popula fieldSources corretamente
**Status:** Monitoramento

## 6. Documentacao Pendente

- [ ] ROADMAP.md - Adicionar esta fase
- [ ] CHANGELOG.md - Registrar mudancas
- [ ] ARCHITECTURE.md - Atualizar diagrama de dados
- [ ] DATABASE_SCHEMA.md - Documentar novas colunas

## 7. Proximos Passos

1. Corrigir FundamentusScraper.ts (waitUntil)
2. Validar frontend com MCP Triplo
3. Cross-validation dados financeiros
4. Atualizar documentacao
5. Commit final

## 8. Metricas de Sucesso

- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] API: Campos retornam valores
- [ ] Frontend: Tabela exibe dados
- [ ] Dados: Precisao validada em multiplas fontes
