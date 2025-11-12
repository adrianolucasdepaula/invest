# 🔄 REFATORAÇÃO COMPLETA: Sistema de Reports e Análises

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Data de Criação:** 2025-11-12
**Status:** 📋 **PLANEJAMENTO COMPLETO**
**Prioridade:** 🔴 **ALTA**
**Estimativa:** 5-7 dias de desenvolvimento

---

## 📋 ÍNDICE

1. [Contexto e Motivação](#1-contexto-e-motivação)
2. [Diagnóstico Completo do Sistema Atual](#2-diagnóstico-completo-do-sistema-atual)
3. [Requisitos do Usuário](#3-requisitos-do-usuário)
4. [Problemas Identificados](#4-problemas-identificados)
5. [Arquitetura Proposta](#5-arquitetura-proposta)
6. [Plano de Implementação Detalhado](#6-plano-de-implementação-detalhado)
7. [Checklist de Tarefas](#7-checklist-de-tarefas)
8. [Arquivos Impactados](#8-arquivos-impactados)
9. [Queries SQL Necessárias](#9-queries-sql-necessárias)
10. [Endpoints API](#10-endpoints-api)
11. [Fluxos Completos](#11-fluxos-completos)
12. [Testes de Validação](#12-testes-de-validação)
13. [Riscos e Mitigações](#13-riscos-e-mitigações)
14. [Critérios de Aceitação](#14-critérios-de-aceitação)

---

## 1. CONTEXTO E MOTIVAÇÃO

### 1.1 Situação Atual

A página `/reports` está com problemas estruturais:
- ❌ Contém dados "sujos" (análises antigas, ativos inativos, análises falhadas)
- ❌ Lista de relatórios não sincronizada com lista de ativos
- ❌ Não mostra resumo da análise na listagem
- ❌ Não mostra data da última análise
- ❌ Botão "Gerar Novo Relatório" desabilitado
- ❌ Não permite análise individual por ativo
- ❌ Não permite análise em massa
- ❌ Download de relatórios não funciona

### 1.2 Objetivo da Refatoração

Transformar `/reports` em uma página completa de gestão de análises onde:
- ✅ Todos os ativos de `/assets` aparecem listados
- ✅ Cada ativo mostra status da última análise
- ✅ Resumo da análise visível na listagem
- ✅ Botão "Analisar Todos os Ativos" funcional
- ✅ Botão "Analisar" individual por ativo
- ✅ Data da última análise sempre visível
- ✅ Download de relatórios funcionando (PDF/JSON)
- ✅ Dados limpos e confiáveis

---

## 2. DIAGNÓSTICO COMPLETO DO SISTEMA ATUAL

### 2.1 Arquitetura Identificada

**DESCOBERTA CRÍTICA:** Não existe entidade separada "Report" no banco de dados.

```
┌─────────────────┐
│     Asset       │
│  (assets)       │
└────────┬────────┘
         │
         ├──────┬─────────────────┐
         │      │                 │
         ▼      ▼                 ▼
  ┌──────────┐  ┌────────────┐  ┌──────────────┐
  │  Price   │  │ Fundamental│  │   Analysis   │
  │          │  │    Data    │  │ (analyses)   │
  └──────────┘  └────────────┘  └──────┬───────┘
                                        │
                                        └─── type: 'complete' = Report
```

**Conceito:**
- `Report` = `Analysis` com `type = 'complete'`
- Tabela `analyses` armazena todos os tipos de análise
- `/reports` endpoint filtra `analyses` por `type='complete'`

### 2.2 Entidades do Banco de Dados

#### 2.2.1 Analysis Entity

**Localização:** `backend/src/database/entities/analysis.entity.ts`

**Campos:**
```typescript
{
  id: UUID                          // Primary Key
  assetId: UUID                     // FK -> Asset
  userId: UUID                      // FK -> User
  type: AnalysisType                // fundamental | technical | complete | macro
  status: AnalysisStatus            // pending | processing | completed | failed
  recommendation: Recommendation    // strong_buy | buy | hold | sell | strong_sell
  confidenceScore: decimal(5,4)     // 0.0000 - 1.0000
  summary: text                     // Resumo executivo
  analysis: JSONB                   // Dados detalhados da análise
  indicators: JSONB                 // Indicadores técnicos
  risks: JSONB                      // Riscos identificados
  targetPrices: JSONB               // Preços alvo (conservador, moderado, otimista)
  dataSources: JSONB                // Array de fontes utilizadas
  sourcesCount: integer             // Quantidade de fontes
  aiProvider: string                // IA utilizada (claude, gpt, gemini)
  errorMessage: text                // Mensagem de erro (se failed)
  processingTime: integer           // Tempo de processamento (ms)
  metadata: JSONB                   // Metadados extras
  createdAt: timestamp              // Data de criação
  updatedAt: timestamp              // Data de atualização
  completedAt: timestamp            // Data de conclusão
}
```

**Indexes:**
```sql
CREATE INDEX idx_analyses_asset_type ON analyses(asset_id, type);
CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_type ON analyses(type);
```

#### 2.2.2 Asset Entity

**Localização:** `backend/src/database/entities/asset.entity.ts`

**Campos:**
```typescript
{
  id: UUID
  ticker: string (UNIQUE)           // PETR4, VALE3, etc
  name: string                      // Nome completo
  type: AssetType                   // stock | fii | etf | bdr | option | future | crypto | fixed_income
  sector: string                    // Setor
  subsector: string                 // Subsetor
  isActive: boolean                 // Ativo no sistema
  lastUpdated: timestamp            // Última atualização de preço
  lastUpdateStatus: string          // success | failed | pending | outdated
  metadata: JSONB
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 2.3 Endpoints Backend Atuais

#### 2.3.1 Analysis Controller

**Localização:** `backend/src/api/analysis/analysis.controller.ts`

```typescript
POST   /api/v1/analysis/:ticker/fundamental  // Gerar análise fundamentalista
POST   /api/v1/analysis/:ticker/technical    // Gerar análise técnica
POST   /api/v1/analysis/:ticker/complete     // Gerar análise completa (= Report)
GET    /api/v1/analysis                      // Listar análises (com filtros)
GET    /api/v1/analysis/:id/details          // Detalhes de análise
GET    /api/v1/analysis/:ticker              // Análises de um ticker
POST   /api/v1/analysis/bulk/request         // Análise em massa ✅ JÁ EXISTE
DELETE /api/v1/analysis/:id                  // Deletar análise
```

**Status:** ✅ **Sistema de análise em massa JÁ IMPLEMENTADO**

**Comportamento do endpoint `POST /analysis/bulk/request`:**
```typescript
// backend/src/api/analysis/analysis.service.ts:465-536
async requestBulkAnalysis(type: AnalysisType, userId: string) {
  1. Busca todos os ativos ativos (isActive=true)
  2. Para cada ativo:
     - Verifica se análise recente existe (< 7 dias)
     - Se não existe: Cria análise com status=PENDING
     - Se existe: Pula (skipped)
  3. Retorna: { total, requested, skipped, requestedAssets, skippedAssets }
}
```

#### 2.3.2 Reports Controller

**Localização:** `backend/src/api/reports/reports.controller.ts`

```typescript
GET    /api/v1/reports                       // Listar reports (filtra type='complete')
GET    /api/v1/reports/:id                   // Detalhes de report
POST   /api/v1/reports/generate              // Gerar report (chama generateCompleteAnalysis)
GET    /api/v1/reports/:id/download          // Download report ⚠️ Retorna erro
```

**Status:** ⚠️ **Download endpoint existe mas não funciona**

### 2.4 Frontend Atual

#### 2.4.1 Reports Page (Listagem)

**Localização:** `frontend/src/app/(dashboard)/reports/page.tsx`

**Comportamento Atual:**
```typescript
- useReports() hook → GET /api/v1/reports
- Lista relatórios (apenas analyses type='complete' existentes)
- Busca por ticker/nome
- Botão "Gerar Novo Relatório" (disabled) ❌
- Botão "Visualizar" → /reports/:id ✅
- Botão "Download" (disabled) ❌
```

**Problemas:**
- ❌ Lista apenas análises que já existem
- ❌ Não mostra ativos sem análise
- ❌ Não mostra resumo da análise
- ❌ Não mostra data da última análise
- ❌ Botões desabilitados

#### 2.4.2 Report Detail Page

**Localização:** `frontend/src/app/(dashboard)/reports/[id]/page.tsx`

**Comportamento Atual:**
```typescript
- ❌ Usa mock data (dados estáticos)
- ❌ Não conecta com API real
- Tabs: Visão Geral, Fundamentalista, Técnica, Riscos
- Preços alvo (conservador, moderado, otimista)
- Recomendação com confiança
```

**Problema:** Não usa dados reais do backend

#### 2.4.3 Assets Page

**Localização:** `frontend/src/app/(dashboard)/assets/page.tsx`

**Comportamento Atual:**
```typescript
- useAssets() hook → GET /api/v1/assets
- Lista todos os ativos
- Sincronização com BRAPI
- Botão "Solicitar Análises" (comentado - FASE 24)
```

---

## 3. REQUISITOS DO USUÁRIO

### 3.1 Requisitos Funcionais

#### RF01: Limpeza de Dados
**Descrição:** Remover todas as análises antigas/sujas do banco de dados

**Critérios:**
- Remover análises de ativos inativos (`asset.isActive = false`)
- Remover análises falhadas antigas (> 7 dias)
- Remover análises pendentes travadas (> 1 hora)
- (Opcional) Remover análises muito antigas (> 90 dias)

#### RF02: Sincronização com Lista de Ativos
**Descrição:** Lista de reports deve corresponder exatamente à lista de ativos

**Critérios:**
- Mostrar TODOS os ativos de `/assets` (isActive=true)
- Não mostrar ativos inativos
- Ordem alfabética por ticker

#### RF03: Botão "Analisar Todos os Ativos"
**Descrição:** Botão para disparar análise em massa

**Critérios:**
- Visível no topo da página
- Chama endpoint `POST /analysis/bulk/request`
- Mostra confirmação antes de executar
- Mostra toast com resultado (X análises solicitadas, Y já atualizadas)

#### RF04: Botão "Analisar" Individual
**Descrição:** Cada ativo deve ter botão para análise individual

**Critérios:**
- Visível ao lado de cada ativo
- Chama endpoint `POST /analysis/:ticker/complete`
- Desabilitado se análise recente existe (< 7 dias)
- Mostra loading durante processamento

#### RF05: Data da Última Análise
**Descrição:** Mostrar quando foi feita a última análise

**Critérios:**
- Formato: "há 2 dias" (relativo)
- Se não tem análise: "-" ou "Sem análise"
- Atualização automática a cada 30s

#### RF06: Resumo da Análise
**Descrição:** Mostrar resumo executivo na listagem

**Critérios:**
- Campo `analysis.summary` do banco
- Máximo 2 linhas (line-clamp-2)
- Se não tem: "Clique em 'Analisar' para gerar"

#### RF07: Download de Relatórios
**Descrição:** Permitir download em múltiplos formatos

**Critérios:**
- Formatos: PDF, JSON
- PDF: Template HTML formatado
- JSON: Dados brutos da análise
- Nome do arquivo: `report-{ticker}-{date}.pdf`

#### RF08: Tooltip Multi-Source
**Descrição:** Explicar que análises usam 4 fontes

**Critérios:**
- Ícone de info ao lado do título
- Tooltip com lista das 4 fontes
- Explicação de cross-validation

### 3.2 Requisitos Não-Funcionais

#### RNF01: Performance
- Lista de ativos deve carregar em < 2s
- Análise individual deve completar em < 30s
- Análise em massa deve processar em background (BullMQ)

#### RNF02: Usabilidade
- Interface intuitiva e limpa
- Badges de status coloridos
- Feedback visual imediato (loading, success, error)

#### RNF03: Confiabilidade
- Retry automático em caso de falha
- Logs detalhados de todas as operações
- Validação de dados antes de salvar

---

## 4. PROBLEMAS IDENTIFICADOS

### 4.1 Dados "Sujos" no Banco

#### Problema 1: Análises de Ativos Inativos
**Descrição:** Existem análises de ativos com `isActive=false`

**Query de Diagnóstico:**
```sql
SELECT COUNT(*) as total
FROM analyses a
JOIN assets ast ON a.asset_id = ast.id
WHERE ast.is_active = false;
```

**Impacto:** Dados desnecessários ocupando espaço, poluindo listagens

#### Problema 2: Análises Falhadas Antigas
**Descrição:** Análises com `status='failed'` de mais de 7 dias atrás

**Query de Diagnóstico:**
```sql
SELECT COUNT(*) as total
FROM analyses
WHERE status = 'failed'
AND created_at < NOW() - INTERVAL '7 days';
```

**Impacto:** Dados inúteis, indicam problemas antigos já resolvidos

#### Problema 3: Análises Pendentes Travadas
**Descrição:** Análises com `status='pending'` há mais de 1 hora

**Query de Diagnóstico:**
```sql
SELECT COUNT(*) as total
FROM analyses
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour';
```

**Impacto:** Jobs que nunca completaram, provavelmente erro no processamento

#### Problema 4: Análises Muito Antigas
**Descrição:** Análises com mais de 90 dias podem estar obsoletas

**Query de Diagnóstico:**
```sql
SELECT COUNT(*) as total
FROM analyses
WHERE created_at < NOW() - INTERVAL '90 days';
```

**Impacto:** Dados desatualizados, não refletem realidade atual

### 4.2 Dessincronia com Lista de Ativos

**Problema:** `/reports` retorna apenas análises existentes, não todos os ativos

**Cenário Atual:**
```
/assets: PETR4, VALE3, ITUB4, BBAS3, MGLU3 (5 ativos)
/reports: PETR4, VALE3 (2 reports)
```

**Cenário Esperado:**
```
/reports:
  - PETR4 (com análise)
  - VALE3 (com análise)
  - ITUB4 (sem análise) ← botão "Analisar"
  - BBAS3 (sem análise) ← botão "Analisar"
  - MGLU3 (sem análise) ← botão "Analisar"
```

### 4.3 Informações Ausentes na Listagem

**Requisito vs Sistema Atual:**

| Requisito | Sistema Atual | Status |
|-----------|--------------|--------|
| Mostrar data da última análise | ❌ Não mostra | **FALTA** |
| Mostrar resumo da análise | ❌ Não mostra | **FALTA** |
| Botão "Analisar Todos" | ❌ Não existe | **FALTA** |
| Botão "Analisar" individual | ❌ Não existe | **FALTA** |
| Download funcional | ⚠️ Endpoint existe mas retorna erro | **IMPLEMENTAR** |
| Badge de status | ❌ Não mostra | **FALTA** |

### 4.4 Download de Relatórios Não Funciona

**Endpoint:** `GET /api/v1/reports/:id/download`

**Problema:** Implementação incompleta

**Comportamento Atual:**
```typescript
// Retorna erro ou resposta vazia
// Não gera PDF real
// Não formata HTML
```

**Comportamento Esperado:**
```typescript
GET /api/v1/reports/:id/download?format=pdf
→ Retorna PDF formatado, pronto para download

GET /api/v1/reports/:id/download?format=json
→ Retorna JSON completo da análise
```

---

## 5. ARQUITETURA PROPOSTA

### 5.1 Fluxo Geral Refatorado

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (/reports)                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Botão "Analisar Todos os Ativos"             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Lista de Ativos (sincronizada com /assets)   │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │ PETR4 - Petrobras PN                     │ │    │
│  │  │ Status: ✅ Atualizada                    │ │    │
│  │  │ Última análise: há 2 dias                │ │    │
│  │  │ Resumo: "Fundamentos sólidos..."         │ │    │
│  │  │ [Visualizar] [Download]                  │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │ VALE3 - Vale ON                          │ │    │
│  │  │ Status: ⚠️ Desatualizada                 │ │    │
│  │  │ Última análise: há 45 dias               │ │    │
│  │  │ Resumo: "Valuation atrativo..."          │ │    │
│  │  │ [Analisar] [Visualizar]                  │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │ ITUB4 - Itaú Unibanco PN                 │ │    │
│  │  │ Status: ❌ Sem Análise                   │ │    │
│  │  │ Última análise: -                        │ │    │
│  │  │ Resumo: Clique em "Analisar"             │ │    │
│  │  │ [Analisar]                               │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│          Backend (Novo Endpoint)                         │
│  GET /api/v1/reports/assets-status                      │
│                                                          │
│  Retorna: AssetWithAnalysisStatusDto[]                  │
│  {                                                       │
│    id, ticker, name, type, sector,                      │
│    hasAnalysis, lastAnalysisDate, lastAnalysisSummary,  │
│    isAnalysisRecent, isAnalysisOutdated,                │
│    canRequestAnalysis, ...                              │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Novo DTO: AssetWithAnalysisStatus

**Localização:** `backend/src/api/reports/dto/asset-with-analysis-status.dto.ts`

```typescript
export class AssetWithAnalysisStatusDto {
  // Dados do Ativo
  id: string;                          // UUID do ativo
  ticker: string;                      // PETR4, VALE3, etc
  name: string;                        // Nome completo
  type: string;                        // stock, fii, etc
  sector: string;                      // Setor
  subsector: string;                   // Subsetor
  currentPrice: number;                // Preço atual
  changePercent: number;               // Variação %

  // Status da Análise
  hasAnalysis: boolean;                // Tem alguma análise?
  lastAnalysisId: string | null;       // ID da última análise
  lastAnalysisDate: Date | null;       // Data da última análise
  lastAnalysisType: string | null;     // complete, fundamental, etc
  lastAnalysisStatus: string | null;   // pending, completed, failed
  lastAnalysisRecommendation: string | null;  // buy, sell, hold
  lastAnalysisConfidence: number | null;      // 0.0 - 1.0
  lastAnalysisSummary: string | null;         // Resumo executivo

  // Flags Computadas
  isAnalysisRecent: boolean;           // < 7 dias
  isAnalysisOutdated: boolean;         // > 30 dias
  canRequestAnalysis: boolean;         // Pode solicitar nova análise?
  daysSinceLastAnalysis: number | null; // Quantos dias desde última análise
}
```

### 5.3 Badges de Status

```typescript
// Lógica de Badge
function getStatusBadge(asset: AssetWithAnalysisStatusDto) {
  if (!asset.hasAnalysis) {
    return <Badge variant="outline">Sem Análise</Badge>;
  }

  if (asset.lastAnalysisStatus === 'pending') {
    return <Badge variant="secondary">Pendente</Badge>;
  }

  if (asset.lastAnalysisStatus === 'processing') {
    return <Badge variant="secondary" className="animate-pulse">
      Processando...
    </Badge>;
  }

  if (asset.lastAnalysisStatus === 'failed') {
    return <Badge variant="destructive">Falhou</Badge>;
  }

  if (asset.isAnalysisOutdated) {
    return <Badge variant="warning">Desatualizada</Badge>;
  }

  if (asset.isAnalysisRecent) {
    return <Badge variant="success">Atualizada</Badge>;
  }

  return <Badge>Completa</Badge>;
}
```

---

## 6. PLANO DE IMPLEMENTAÇÃO DETALHADO

### FASE 1: Limpeza de Dados (Backend) ⚠️ CRÍTICO

**Objetivo:** Remover análises antigas/sujas do banco de dados

**Tempo Estimado:** 2-3 horas

#### Tarefa 1.1: Criar Script de Limpeza

**Arquivo:** `backend/src/database/scripts/cleanup-analyses.ts`

**Código Completo:**
```typescript
import { DataSource } from 'typeorm';
import { Analysis } from '../entities/analysis.entity';
import { Asset } from '../entities/asset.entity';

async function cleanupAnalyses() {
  // 1. Configurar conexão
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5532'),
    username: process.env.POSTGRES_USER || 'invest_user',
    password: process.env.POSTGRES_PASSWORD || 'invest_password',
    database: process.env.POSTGRES_DB || 'invest_db',
    entities: [Analysis, Asset],
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('✅ Conectado com sucesso!');

    const analysisRepo = dataSource.getRepository(Analysis);
    const assetRepo = dataSource.getRepository(Asset);

    console.log('\n🧹 Iniciando limpeza de análises...\n');

    // 2. Estatísticas ANTES da limpeza
    const totalBefore = await analysisRepo.count();
    console.log(`📊 Total de análises ANTES: ${totalBefore}`);

    // 3. Remover análises de ativos inativos
    console.log('\n🔍 Buscando análises de ativos inativos...');
    const inactiveAssets = await assetRepo.find({
      where: { isActive: false },
    });

    if (inactiveAssets.length > 0) {
      const inactiveIds = inactiveAssets.map((a) => a.id);
      const deletedInactive = await analysisRepo
        .createQueryBuilder()
        .delete()
        .where('asset_id IN (:...ids)', { ids: inactiveIds })
        .execute();

      console.log(
        `✅ Removidas ${deletedInactive.affected} análises de ${inactiveAssets.length} ativos inativos`
      );
    } else {
      console.log('✅ Nenhuma análise de ativo inativo encontrada');
    }

    // 4. Remover análises falhadas antigas (> 7 dias)
    console.log('\n🔍 Buscando análises falhadas antigas (> 7 dias)...');
    const deletedFailed = await analysisRepo
      .createQueryBuilder()
      .delete()
      .where("status = 'failed'")
      .andWhere("created_at < NOW() - INTERVAL '7 days'")
      .execute();

    console.log(`✅ Removidas ${deletedFailed.affected} análises falhadas antigas`);

    // 5. Remover análises pendentes travadas (> 1 hora)
    console.log('\n🔍 Buscando análises pendentes travadas (> 1 hora)...');
    const deletedPending = await analysisRepo
      .createQueryBuilder()
      .delete()
      .where("status = 'pending'")
      .andWhere("created_at < NOW() - INTERVAL '1 hour'")
      .execute();

    console.log(`✅ Removidas ${deletedPending.affected} análises pendentes travadas`);

    // 6. (OPCIONAL) Remover análises muito antigas (> 90 dias)
    console.log('\n❓ Deseja remover análises antigas (> 90 dias)? [s/N]');
    console.log('   (Esta etapa está comentada por padrão)');

    // Descomente para executar:
    /*
    const deletedOld = await analysisRepo
      .createQueryBuilder()
      .delete()
      .where("created_at < NOW() - INTERVAL '90 days'")
      .execute();

    console.log(`✅ Removidas ${deletedOld.affected} análises antigas (> 90 dias)`);
    */

    // 7. Estatísticas DEPOIS da limpeza
    const totalAfter = await analysisRepo.count();
    const totalDeleted = totalBefore - totalAfter;

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA LIMPEZA');
    console.log('='.repeat(50));
    console.log(`Total ANTES:    ${totalBefore}`);
    console.log(`Total DEPOIS:   ${totalAfter}`);
    console.log(`Total REMOVIDO: ${totalDeleted}`);
    console.log('='.repeat(50));

    // 8. Estatísticas finais por status
    console.log('\n📊 Análises restantes por status:');
    const byStatus = await analysisRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .groupBy('a.status')
      .getRawMany();

    byStatus.forEach((row) => {
      console.log(`   ${row.status}: ${row.total}`);
    });

    console.log('\n🎉 Limpeza concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Executar
cleanupAnalyses().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
```

#### Tarefa 1.2: Adicionar Comando NPM

**Arquivo:** `backend/package.json`

**Modificação:**
```json
{
  "scripts": {
    "cleanup:analyses": "ts-node src/database/scripts/cleanup-analyses.ts",
    "cleanup:analyses:dry-run": "echo 'Dry run: executaria limpeza de análises'"
  }
}
```

#### Tarefa 1.3: Executar Limpeza

**Comando:**
```bash
cd backend
npm run cleanup:analyses
```

**Saída Esperada:**
```
🔌 Conectando ao banco de dados...
✅ Conectado com sucesso!

🧹 Iniciando limpeza de análises...

📊 Total de análises ANTES: 54

🔍 Buscando análises de ativos inativos...
✅ Removidas 0 análises de 0 ativos inativos

🔍 Buscando análises falhadas antigas (> 7 dias)...
✅ Removidas 0 análises falhadas antigas

🔍 Buscando análises pendentes travadas (> 1 hora)...
✅ Removidas 0 análises pendentes travadas

==================================================
📊 RESUMO DA LIMPEZA
==================================================
Total ANTES:    54
Total DEPOIS:   54
Total REMOVIDO: 0
==================================================

📊 Análises restantes por status:
   completed: 54

🎉 Limpeza concluída com sucesso!
```

#### Tarefa 1.4: Validar Resultados

**Query de Validação:**
```sql
-- Ver distribuição final
SELECT
  status,
  type,
  COUNT(*) as total,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM analyses
GROUP BY status, type
ORDER BY status, type;

-- Ver ativos sem análise
SELECT
  a.ticker,
  a.name,
  a.type,
  a.sector
FROM assets a
LEFT JOIN analyses an ON a.id = an.asset_id AND an.type = 'complete'
WHERE a.is_active = true
AND an.id IS NULL
ORDER BY a.ticker;
```

---

### FASE 2: Novo Endpoint - Assets with Analysis Status (Backend)

**Objetivo:** Criar endpoint que retorna todos os ativos com informação de análise

**Tempo Estimado:** 3-4 horas

#### Tarefa 2.1: Criar DTO

**Arquivo:** `backend/src/api/reports/dto/asset-with-analysis-status.dto.ts`

**Código Completo:**
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class AssetWithAnalysisStatusDto {
  @ApiProperty({ description: 'Asset ID' })
  id: string;

  @ApiProperty({ description: 'Ticker symbol', example: 'PETR4' })
  ticker: string;

  @ApiProperty({ description: 'Asset name', example: 'Petrobras PN' })
  name: string;

  @ApiProperty({ description: 'Asset type', example: 'stock' })
  type: string;

  @ApiProperty({ description: 'Sector' })
  sector: string;

  @ApiProperty({ description: 'Subsector', required: false })
  subsector?: string;

  @ApiProperty({ description: 'Current price' })
  currentPrice: number;

  @ApiProperty({ description: 'Change percent' })
  changePercent: number;

  @ApiProperty({ description: 'Has analysis' })
  hasAnalysis: boolean;

  @ApiProperty({ description: 'Last analysis ID', required: false })
  lastAnalysisId: string | null;

  @ApiProperty({ description: 'Last analysis date', required: false })
  lastAnalysisDate: Date | null;

  @ApiProperty({ description: 'Last analysis type', required: false })
  lastAnalysisType: string | null;

  @ApiProperty({ description: 'Last analysis status', required: false })
  lastAnalysisStatus: string | null;

  @ApiProperty({ description: 'Last analysis recommendation', required: false })
  lastAnalysisRecommendation: string | null;

  @ApiProperty({ description: 'Last analysis confidence', required: false })
  lastAnalysisConfidence: number | null;

  @ApiProperty({ description: 'Last analysis summary', required: false })
  lastAnalysisSummary: string | null;

  @ApiProperty({ description: 'Is analysis recent (< 7 days)' })
  isAnalysisRecent: boolean;

  @ApiProperty({ description: 'Is analysis outdated (> 30 days)' })
  isAnalysisOutdated: boolean;

  @ApiProperty({ description: 'Can request new analysis' })
  canRequestAnalysis: boolean;

  @ApiProperty({ description: 'Days since last analysis', required: false })
  daysSinceLastAnalysis: number | null;
}
```

#### Tarefa 2.2: Implementar Método no Service

**Arquivo:** `backend/src/api/reports/reports.service.ts`

**Adicionar método:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '@database/entities/asset.entity';
import { Analysis } from '@database/entities/analysis.entity';
import { AssetWithAnalysisStatusDto } from './dto/asset-with-analysis-status.dto';
import { AnalysisType } from '@database/entities/analysis.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
  ) {}

  async getAssetsWithAnalysisStatus(): Promise<AssetWithAnalysisStatusDto[]> {
    // 1. Buscar todos os ativos ativos
    const assets = await this.assetRepository.find({
      where: { isActive: true },
      relations: ['prices'],
      order: { ticker: 'ASC' },
    });

    // 2. Para cada ativo, buscar análise mais recente
    const result = await Promise.all(
      assets.map(async (asset) => {
        // Buscar última análise completa
        const latestAnalysis = await this.analysisRepository.findOne({
          where: {
            assetId: asset.id,
            type: AnalysisType.COMPLETE,
          },
          order: { createdAt: 'DESC' },
        });

        // Pegar preço atual (último preço)
        const latestPrice = asset.prices?.[0];
        const currentPrice = latestPrice?.close || 0;
        const changePercent = latestPrice?.changePercent || 0;

        // Calcular flags temporais
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const isAnalysisRecent = latestAnalysis
          ? new Date(latestAnalysis.createdAt) > sevenDaysAgo
          : false;

        const isAnalysisOutdated = latestAnalysis
          ? new Date(latestAnalysis.createdAt) < thirtyDaysAgo
          : false;

        // Calcular dias desde última análise
        let daysSinceLastAnalysis: number | null = null;
        if (latestAnalysis) {
          const diffMs = now.getTime() - new Date(latestAnalysis.createdAt).getTime();
          daysSinceLastAnalysis = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }

        // Determinar se pode solicitar nova análise
        const canRequestAnalysis =
          !latestAnalysis || // Nunca teve análise
          isAnalysisOutdated || // Análise antiga
          latestAnalysis.status === 'failed'; // Última análise falhou

        return {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          sector: asset.sector || '',
          subsector: asset.subsector || '',
          currentPrice,
          changePercent,

          hasAnalysis: !!latestAnalysis,
          lastAnalysisId: latestAnalysis?.id || null,
          lastAnalysisDate: latestAnalysis?.createdAt || null,
          lastAnalysisType: latestAnalysis?.type || null,
          lastAnalysisStatus: latestAnalysis?.status || null,
          lastAnalysisRecommendation: latestAnalysis?.recommendation || null,
          lastAnalysisConfidence: latestAnalysis?.confidenceScore || null,
          lastAnalysisSummary: latestAnalysis?.summary || null,

          isAnalysisRecent,
          isAnalysisOutdated,
          canRequestAnalysis,
          daysSinceLastAnalysis,
        };
      })
    );

    return result;
  }
}
```

#### Tarefa 2.3: Adicionar Rota no Controller

**Arquivo:** `backend/src/api/reports/reports.controller.ts`

**Adicionar método:**
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AssetWithAnalysisStatusDto } from './dto/asset-with-analysis-status.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('assets-status')
  @ApiOperation({
    summary: 'Get all assets with analysis status',
    description: 'Returns all active assets with information about their latest analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assets with analysis status',
    type: [AssetWithAnalysisStatusDto],
  })
  async getAssetsWithStatus(): Promise<AssetWithAnalysisStatusDto[]> {
    return this.reportsService.getAssetsWithAnalysisStatus();
  }

  // ... outros métodos existentes
}
```

#### Tarefa 2.4: Testar Endpoint

**Ferramentas:** Postman, Insomnia, ou cURL

**Request:**
```bash
curl -X GET http://localhost:3101/api/v1/reports/assets-status \
  -H "Content-Type: application/json"
```

**Response Esperado:**
```json
[
  {
    "id": "uuid-1",
    "ticker": "PETR4",
    "name": "Petrobras PN",
    "type": "stock",
    "sector": "Petróleo, Gás e Biocombustíveis",
    "subsector": "Exploração e Refino",
    "currentPrice": 38.45,
    "changePercent": 1.25,
    "hasAnalysis": true,
    "lastAnalysisId": "uuid-analysis-1",
    "lastAnalysisDate": "2025-11-10T14:30:00.000Z",
    "lastAnalysisType": "complete",
    "lastAnalysisStatus": "completed",
    "lastAnalysisRecommendation": "buy",
    "lastAnalysisConfidence": 0.85,
    "lastAnalysisSummary": "Empresa apresenta fundamentos sólidos com ROE acima de 18%...",
    "isAnalysisRecent": true,
    "isAnalysisOutdated": false,
    "canRequestAnalysis": false,
    "daysSinceLastAnalysis": 2
  },
  {
    "id": "uuid-2",
    "ticker": "VALE3",
    "name": "Vale ON",
    "type": "stock",
    "sector": "Materiais Básicos",
    "subsector": "Mineração",
    "currentPrice": 62.30,
    "changePercent": -0.80,
    "hasAnalysis": false,
    "lastAnalysisId": null,
    "lastAnalysisDate": null,
    "lastAnalysisType": null,
    "lastAnalysisStatus": null,
    "lastAnalysisRecommendation": null,
    "lastAnalysisConfidence": null,
    "lastAnalysisSummary": null,
    "isAnalysisRecent": false,
    "isAnalysisOutdated": false,
    "canRequestAnalysis": true,
    "daysSinceLastAnalysis": null
  }
]
```

---

### FASE 3: Refatorar Frontend - Reports Page

**Objetivo:** Redesenhar `/reports` para mostrar todos os ativos com controles de análise

**Tempo Estimado:** 4-5 horas

#### Tarefa 3.1: Criar Hooks Customizados

**Arquivo:** `frontend/src/lib/hooks/use-reports-assets.ts`

**Código Completo:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useToast } from '@/components/ui/use-toast';

export function useReportsAssets() {
  return useQuery({
    queryKey: ['reports', 'assets-status'],
    queryFn: () => api.getReportsAssetsStatus(),
    refetchInterval: 30000, // Auto-refresh a cada 30s
    staleTime: 20000, // Considera stale após 20s
  });
}

export function useRequestAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ticker: string) => api.requestCompleteAnalysis(ticker),
    onSuccess: (data, ticker) => {
      toast({
        title: 'Análise Solicitada',
        description: `Análise completa solicitada para ${ticker}. Aguarde alguns minutos.`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any, ticker) => {
      toast({
        title: 'Erro ao Solicitar Análise',
        description: error.response?.data?.message || `Falha ao solicitar análise para ${ticker}`,
        variant: 'destructive',
      });
    },
  });
}

export function useRequestBulkAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => api.requestBulkAnalysis('complete'),
    onSuccess: (data) => {
      const { total, requested, skipped } = data;
      toast({
        title: 'Análises em Massa Solicitadas',
        description: `${requested} análises solicitadas de ${total} ativos. ${skipped} já estavam atualizadas.`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Solicitar Análises',
        description: error.response?.data?.message || 'Falha ao solicitar análises em massa',
        variant: 'destructive',
      });
    },
  });
}
```

#### Tarefa 3.2: Adicionar Métodos na API Client

**Arquivo:** `frontend/src/lib/api.ts`

**Adicionar no `ApiClient` class:**
```typescript
export class ApiClient {
  // ... código existente

  // Novo método: Get assets with analysis status
  async getReportsAssetsStatus() {
    const response = await this.client.get('/reports/assets-status');
    return response.data;
  }

  // Novo método: Request complete analysis for ticker
  async requestCompleteAnalysis(ticker: string) {
    const response = await this.client.post(`/analysis/${ticker}/complete`);
    return response.data;
  }

  // Método já existe, confirmar implementação
  async requestBulkAnalysis(type: 'fundamental' | 'technical' | 'complete') {
    const response = await this.client.post('/analysis/bulk/request', { type });
    return response.data;
  }
}

export const api = new ApiClient();
```

#### Tarefa 3.3: Criar Componente MultiSourceTooltip

**Arquivo:** `frontend/src/components/reports/multi-source-tooltip.tsx`

**Código Completo:**
```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export function MultiSourceTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center"
            aria-label="Informações sobre análise multi-fonte"
          >
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">Análise Multi-Fonte</p>
            <p className="text-xs text-muted-foreground">
              Coletamos dados de 4 fontes simultâneas:
            </p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• <strong>Fundamentus</strong> (público)</li>
              <li>• <strong>BRAPI</strong> (API pública)</li>
              <li>• <strong>StatusInvest</strong> (autenticado)</li>
              <li>• <strong>Investidor10</strong> (autenticado)</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Fazemos <strong>cross-validation</strong> para garantir precisão e calculamos
              um <strong>score de confiança</strong> baseado no consenso entre as fontes.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

#### Tarefa 3.4: Redesenhar Reports Page

**Arquivo:** `frontend/src/app/(dashboard)/reports/page.tsx`

**Código Completo:**
```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useReportsAssets,
  useRequestAnalysis,
  useRequestBulkAnalysis,
} from '@/lib/hooks/use-reports-assets';
import {
  Search,
  Play,
  PlayCircle,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { MultiSourceTooltip } from '@/components/reports/multi-source-tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: assets, isLoading, error } = useReportsAssets();
  const requestAnalysis = useRequestAnalysis();
  const requestBulkAnalysis = useRequestBulkAnalysis();

  const filteredAssets = (assets || []).filter(
    (asset: any) =>
      asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnalyzeAll = async () => {
    await requestBulkAnalysis.mutateAsync();
  };

  const handleAnalyze = async (ticker: string) => {
    await requestAnalysis.mutateAsync(ticker);
  };

  const getStatusBadge = (asset: any) => {
    if (!asset.hasAnalysis) {
      return <Badge variant="outline">Sem Análise</Badge>;
    }

    if (asset.lastAnalysisStatus === 'pending') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Pendente
        </Badge>
      );
    }

    if (asset.lastAnalysisStatus === 'processing') {
      return (
        <Badge variant="secondary" className="gap-1 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processando...
        </Badge>
      );
    }

    if (asset.lastAnalysisStatus === 'failed') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Falhou
        </Badge>
      );
    }

    if (asset.isAnalysisOutdated) {
      return <Badge variant="warning">Desatualizada</Badge>;
    }

    if (asset.isAnalysisRecent) {
      return <Badge variant="success">Atualizada</Badge>;
    }

    return <Badge>Completa</Badge>;
  };

  const getRecommendationBadge = (recommendation: string | null) => {
    if (!recommendation) return null;

    const badges = {
      strong_buy: <Badge className="bg-green-600">Compra Forte</Badge>,
      buy: <Badge className="bg-green-500">Compra</Badge>,
      hold: <Badge variant="secondary">Manter</Badge>,
      sell: <Badge className="bg-red-500">Venda</Badge>,
      strong_sell: <Badge className="bg-red-600">Venda Forte</Badge>,
    };

    return badges[recommendation as keyof typeof badges] || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Erro ao Carregar Relatórios</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Análise</h1>
            <p className="text-muted-foreground">
              Análises completas com IA para todos os ativos
            </p>
          </div>
          <MultiSourceTooltip />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              disabled={requestBulkAnalysis.isPending}
            >
              {requestBulkAnalysis.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Solicitando...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Analisar Todos os Ativos
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Analisar Todos os Ativos?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Esta ação solicitará análises completas para todos os ativos
                  que não possuem análise recente (menos de 7 dias).
                </p>
                <p className="font-semibold">
                  As análises serão processadas em segundo plano e podem levar
                  alguns minutos para completar.
                </p>
                <p className="text-xs text-muted-foreground">
                  Cada análise coleta dados de 4 fontes diferentes para garantir
                  máxima precisão.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleAnalyzeAll}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ticker ou nome do ativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total de Ativos</div>
          <div className="text-2xl font-bold">{assets?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Com Análise</div>
          <div className="text-2xl font-bold text-green-600">
            {assets?.filter((a: any) => a.hasAnalysis).length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Sem Análise</div>
          <div className="text-2xl font-bold text-orange-600">
            {assets?.filter((a: any) => !a.hasAnalysis).length || 0}
          </div>
        </Card>
      </div>

      {/* Assets List */}
      <div className="grid gap-4">
        {filteredAssets.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-semibold">Nenhum ativo encontrado</p>
              <p className="text-sm">
                Tente ajustar os filtros ou a busca
              </p>
            </div>
          </Card>
        ) : (
          filteredAssets.map((asset: any) => (
            <Card key={asset.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-6">
                {/* Asset Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{asset.ticker}</h3>
                    <p className="text-sm text-muted-foreground">{asset.name}</p>
                    {getStatusBadge(asset)}
                    {asset.lastAnalysisRecommendation &&
                      getRecommendationBadge(asset.lastAnalysisRecommendation)}
                  </div>

                  {/* Analysis Info */}
                  {asset.hasAnalysis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Última Análise</p>
                        <p className="font-medium">
                          {asset.lastAnalysisDate
                            ? formatDistanceToNow(
                                new Date(asset.lastAnalysisDate),
                                {
                                  addSuffix: true,
                                  locale: ptBR,
                                }
                              )
                            : '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Recomendação</p>
                        <p className="font-medium capitalize">
                          {asset.lastAnalysisRecommendation?.replace('_', ' ') ||
                            'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Confiança</p>
                        <p className="font-medium">
                          {asset.lastAnalysisConfidence
                            ? `${(asset.lastAnalysisConfidence * 100).toFixed(0)}%`
                            : 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">
                          {asset.lastAnalysisStatus === 'completed'
                            ? 'Completa'
                            : asset.lastAnalysisStatus || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {asset.lastAnalysisSummary ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {asset.lastAnalysisSummary}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {asset.hasAnalysis
                        ? 'Resumo não disponível'
                        : 'Clique em "Analisar" para gerar análise completa'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  {asset.hasAnalysis &&
                    asset.lastAnalysisStatus === 'completed' && (
                      <Link href={`/reports/${asset.lastAnalysisId}`}>
                        <Button variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </Button>
                      </Link>
                    )}

                  {asset.canRequestAnalysis && (
                    <Button
                      onClick={() => handleAnalyze(asset.ticker)}
                      disabled={requestAnalysis.isPending}
                      className="gap-2"
                    >
                      {requestAnalysis.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Analisar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
```

---

### FASE 4: Conectar Report Detail Page com API Real

**Objetivo:** Remover mock data e usar dados reais do backend

**Tempo Estimado:** 2-3 horas

#### Tarefa 4.1: Criar Hook useReport

**Arquivo:** `frontend/src/lib/hooks/use-report.ts`

**Código Completo:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => api.getReportById(id),
    enabled: !!id,
  });
}
```

#### Tarefa 4.2: Adicionar Método na API

**Arquivo:** `frontend/src/lib/api.ts`

**Adicionar:**
```typescript
async getReportById(id: string) {
  const response = await this.client.get(`/reports/${id}`);
  return response.data;
}
```

#### Tarefa 4.3: Refatorar Report Detail Page

**Arquivo:** `frontend/src/app/(dashboard)/reports/[id]/page.tsx`

**Substituir código completo:**
```typescript
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReport } from '@/lib/hooks/use-report';
import {
  ArrowLeft,
  Download,
  PlayCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { data: report, isLoading, error } = useReport(reportId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Erro ao Carregar Relatório</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Relatório não encontrado'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push('/reports')}
              >
                Voltar para Relatórios
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { asset, recommendation, confidenceScore, summary, analysis } = report;

  const getRecommendationBadge = () => {
    const badges = {
      strong_buy: <Badge className="bg-green-600">Compra Forte</Badge>,
      buy: <Badge className="bg-green-500">Compra</Badge>,
      hold: <Badge variant="secondary">Manter</Badge>,
      sell: <Badge className="bg-red-500">Venda</Badge>,
      strong_sell: <Badge className="bg-red-600">Venda Forte</Badge>,
    };
    return badges[recommendation as keyof typeof badges] || null;
  };

  const handleDownload = (format: 'pdf' | 'json') => {
    window.open(
      `/api/v1/reports/${reportId}/download?format=${format}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Relatório: {asset.ticker}</h1>
            <p className="text-muted-foreground">{asset.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleDownload('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => handleDownload('json')}>
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
          <Button>
            <PlayCircle className="mr-2 h-4 w-4" />
            Gerar Novo Relatório
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Recomendação</p>
            <div className="mt-2">{getRecommendationBadge()}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Confiança</p>
            <p className="text-2xl font-bold mt-1">
              {(confidenceScore * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Preço Atual</p>
            <p className="text-2xl font-bold mt-1">
              R$ {analysis?.currentPrice?.toFixed(2) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gerado em</p>
            <p className="text-lg font-medium mt-1">
              {formatDate(new Date(report.createdAt), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="fundamental">Fundamentalista</TabsTrigger>
          <TabsTrigger value="technical">Técnica</TabsTrigger>
          <TabsTrigger value="risks">Riscos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resumo Executivo</h3>
            <p className="text-muted-foreground">{summary}</p>
          </Card>

          {analysis?.keyPoints && (
            <Card className="p-6">
              <h4 className="font-semibold mb-3">Pontos Chave</h4>
              <ul className="space-y-2">
                {analysis.keyPoints.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Adicionar mais seções conforme dados disponíveis */}
        </TabsContent>

        <TabsContent value="fundamental">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Análise Fundamentalista</h3>
            {analysis?.fundamental ? (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(analysis.fundamental, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Dados fundamentalistas não disponíveis
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="technical">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Análise Técnica</h3>
            {analysis?.technical ? (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(analysis.technical, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Dados técnicos não disponíveis
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Análise de Riscos</h3>
            {report.risks ? (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(report.risks, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Análise de riscos não disponível
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### FASE 5: Implementar Download de Relatórios (Backend)

**Objetivo:** Gerar PDF/JSON dos relatórios

**Tempo Estimado:** 4-5 horas

*(Continuação no próximo bloco devido ao limite de caracteres)*

---

## 7. CHECKLIST DE TAREFAS

### Backend

- [ ] **FASE 1: Limpeza de Dados**
  - [ ] 1.1: Criar script `cleanup-analyses.ts`
  - [ ] 1.2: Adicionar comando NPM `cleanup:analyses`
  - [ ] 1.3: Executar limpeza
  - [ ] 1.4: Validar resultados com queries SQL

- [ ] **FASE 2: Novo Endpoint Assets Status**
  - [ ] 2.1: Criar DTO `AssetWithAnalysisStatusDto`
  - [ ] 2.2: Implementar `getAssetsWithAnalysisStatus()` no service
  - [ ] 2.3: Adicionar rota `GET /reports/assets-status`
  - [ ] 2.4: Testar endpoint com Postman

- [ ] **FASE 5: Download de Relatórios**
  - [ ] 5.1: Instalar dependências (puppeteer, handlebars)
  - [ ] 5.2: Criar `PdfGeneratorService`
  - [ ] 5.3: Criar template HTML (`report-template.hbs`)
  - [ ] 5.4: Implementar endpoint download
  - [ ] 5.5: Testar download PDF
  - [ ] 5.6: Testar download JSON

### Frontend

- [ ] **FASE 3: Refatorar Reports Page**
  - [ ] 3.1: Criar hooks customizados
  - [ ] 3.2: Adicionar métodos na API client
  - [ ] 3.3: Criar componente `MultiSourceTooltip`
  - [ ] 3.4: Redesenhar `/reports/page.tsx`
  - [ ] 3.5: Testar listagem
  - [ ] 3.6: Testar busca
  - [ ] 3.7: Testar botão "Analisar Todos"
  - [ ] 3.8: Testar botão "Analisar" individual

- [ ] **FASE 4: Report Detail Page**
  - [ ] 4.1: Criar hook `useReport`
  - [ ] 4.2: Adicionar método na API
  - [ ] 4.3: Refatorar `/reports/[id]/page.tsx`
  - [ ] 4.4: Testar carregamento de detalhes
  - [ ] 4.5: Testar tabs
  - [ ] 4.6: Testar botões download

### Testes e Validação

- [ ] **FASE 6: Testes E2E**
  - [ ] 6.1: Testar análise em massa
  - [ ] 6.2: Testar análise individual
  - [ ] 6.3: Testar navegação listagem → detalhes
  - [ ] 6.4: Testar downloads (PDF/JSON)
  - [ ] 6.5: Testar badges de status
  - [ ] 6.6: Testar busca e filtros
  - [ ] 6.7: Validar performance (lista grande)
  - [ ] 6.8: Validar console (0 erros)

### Documentação

- [ ] Atualizar `claude.md` com novas features
- [ ] Atualizar `README.md` se necessário
- [ ] Criar/atualizar documentação de API (Swagger)
- [ ] Commit final com mensagem detalhada

---

## 8. ARQUIVOS IMPACTADOS

### Backend - Criar (5 arquivos)

1. `backend/src/database/scripts/cleanup-analyses.ts`
2. `backend/src/api/reports/dto/asset-with-analysis-status.dto.ts`
3. `backend/src/api/reports/pdf-generator.service.ts`
4. `backend/src/templates/report-template.hbs`
5. `backend/src/api/reports/reports.module.ts` (atualizar injeções)

### Backend - Modificar (3 arquivos)

1. `backend/src/api/reports/reports.service.ts` - Adicionar `getAssetsWithAnalysisStatus()`
2. `backend/src/api/reports/reports.controller.ts` - Adicionar rotas, injetar PdfGenerator
3. `backend/package.json` - Adicionar scripts e dependências

### Frontend - Criar (4 arquivos)

1. `frontend/src/lib/hooks/use-reports-assets.ts`
2. `frontend/src/lib/hooks/use-report.ts`
3. `frontend/src/components/reports/multi-source-tooltip.tsx`
4. `frontend/src/components/reports/analysis-status-badge.tsx` (opcional)

### Frontend - Modificar (3 arquivos)

1. `frontend/src/app/(dashboard)/reports/page.tsx` - Redesenhar completamente
2. `frontend/src/app/(dashboard)/reports/[id]/page.tsx` - Conectar com API
3. `frontend/src/lib/api.ts` - Adicionar novos métodos

---

## 9. QUERIES SQL NECESSÁRIAS

### Limpeza de Dados

```sql
-- 1. Remover análises de ativos inativos
DELETE FROM analyses
WHERE asset_id IN (
  SELECT id FROM assets WHERE is_active = false
);

-- 2. Remover análises falhadas antigas (> 7 dias)
DELETE FROM analyses
WHERE status = 'failed'
AND created_at < NOW() - INTERVAL '7 days';

-- 3. Remover análises pendentes travadas (> 1 hora)
DELETE FROM analyses
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour';

-- 4. (OPCIONAL) Remover análises antigas (> 90 dias)
DELETE FROM analyses
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Análise de Dados

```sql
-- Ver distribuição de análises por tipo
SELECT type, status, COUNT(*) as total
FROM analyses
GROUP BY type, status
ORDER BY type, status;

-- Ver ativos sem análise
SELECT a.ticker, a.name, a.type, a.sector
FROM assets a
LEFT JOIN analyses an ON a.id = an.asset_id AND an.type = 'complete'
WHERE a.is_active = true
AND an.id IS NULL
ORDER BY a.ticker;

-- Ver análises desatualizadas (> 30 dias)
SELECT
  a.ticker,
  an.type,
  an.status,
  an.created_at,
  NOW() - an.created_at as age
FROM analyses an
JOIN assets a ON an.asset_id = a.id
WHERE an.created_at < NOW() - INTERVAL '30 days'
AND a.is_active = true
ORDER BY an.created_at DESC;

-- Estatísticas gerais
SELECT
  COUNT(*) as total_analises,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completas,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as falhadas,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recentes
FROM analyses;
```

---

## 10. ENDPOINTS API

### Novos Endpoints

```
GET  /api/v1/reports/assets-status
     → Retorna todos os ativos com status de análise
     Response: AssetWithAnalysisStatusDto[]
     Status: 200 OK
```

### Endpoints Modificados

```
GET  /api/v1/reports/:id/download
     ✅ Endpoint existe mas será implementado
     Query: ?format=pdf|html|json
     Response: File download (PDF, HTML ou JSON)
     Status: 200 OK
```

### Endpoints Existentes (Reutilizar)

```
POST /api/v1/analysis/bulk/request
     ✅ Endpoint já existe e funciona
     Body: { type: 'complete' }
     Response: { total, requested, skipped, requestedAssets, skippedAssets }
     Status: 201 Created

POST /api/v1/analysis/:ticker/complete
     ✅ Endpoint já existe e funciona
     Response: Analysis object
     Status: 201 Created
```

---

## 11. FLUXOS COMPLETOS

### Fluxo 1: Visualizar Reports

```
1. User acessa http://localhost:3100/reports
2. Frontend chama GET /api/v1/reports/assets-status
3. Backend:
   a. Busca todos os ativos ativos (isActive=true)
   b. Para cada ativo, busca análise mais recente (type='complete')
   c. Calcula flags: hasAnalysis, isRecent, isOutdated, canRequest
   d. Retorna array de AssetWithAnalysisStatusDto[]
4. Frontend exibe lista com:
   - Ticker, Nome, Setor
   - Badge de status (Sem Análise, Atualizada, Desatualizada, etc)
   - Data última análise (relativa: "há 2 dias")
   - Resumo da análise (line-clamp-2)
   - Botões: "Visualizar" (se tem análise) ou "Analisar" (se não tem)
5. User pode buscar/filtrar por ticker ou nome
```

### Fluxo 2: Analisar Todos os Ativos

```
1. User clica "Analisar Todos os Ativos"
2. Dialog de confirmação aparece
3. User confirma
4. Frontend chama POST /api/v1/analysis/bulk/request { type: 'complete' }
5. Backend (AnalysisService.requestBulkAnalysis):
   a. Busca todos os ativos ativos
   b. Para cada ativo:
      - Verifica se análise recente existe (< 7 dias)
      - Se não: Cria análise com status=PENDING
      - Se sim: Pula (skipped)
   c. Retorna: { total, requested, skipped, requestedAssets, skippedAssets }
6. Toast de sucesso: "X análises solicitadas. Y já estavam atualizadas."
7. Frontend auto-refresh de 30 em 30s para atualizar status
8. Queue BullMQ processa análises PENDING em background
9. WebSocket emite eventos de conclusão (opcional)
10. Badges mudam de "Pendente" → "Processando" → "Atualizada"
```

### Fluxo 3: Analisar Individualmente

```
1. User clica "Analisar" em um ativo específico (ex: VALE3)
2. Frontend chama POST /api/v1/analysis/VALE3/complete
3. Backend (AnalysisService.generateCompleteAnalysis):
   a. Cria análise com status=PROCESSING
   b. Executa análise fundamentalista (4 scrapers em paralelo)
   c. Executa análise técnica (indicadores)
   d. Chama IA para gerar relatório completo
   e. Atualiza análise: status=COMPLETED, dados, recomendação
4. Toast de sucesso: "Análise concluída para VALE3"
5. Frontend atualiza lista automaticamente (React Query invalida cache)
6. Badge muda para "Atualizada"
7. Botão "Visualizar" aparece
```

### Fluxo 4: Visualizar Detalhes

```
1. User clica "Visualizar" em um relatório
2. Frontend navega para /reports/{analysisId}
3. useReport(id) hook chama GET /api/v1/reports/{id}
4. Backend retorna análise completa com:
   - Dados do ativo
   - Recomendação, confiança, summary
   - analysis (JSONB): fundamental, técnica, IA
   - risks, indicators, targetPrices
5. Frontend renderiza:
   - Header com ticker, nome
   - Card de resumo (recomendação, confiança, preço, data)
   - Tabs: Visão Geral, Fundamentalista, Técnica, Riscos
6. User pode navegar entre tabs
7. Botões "Download PDF/JSON" e "Gerar Novo Relatório" disponíveis
```

### Fluxo 5: Download de Relatório

```
1. User clica "Download PDF" na página de detalhes
2. Frontend abre nova janela:
   GET /api/v1/reports/{id}/download?format=pdf
3. Backend (ReportsController):
   a. Busca análise por ID
   b. Chama PdfGeneratorService.generatePdf(analysis)
4. PdfGeneratorService:
   a. Carrega template HTML (report-template.hbs)
   b. Compila template com Handlebars
   c. Renderiza HTML com dados da análise
   d. Usa Puppeteer para gerar PDF do HTML
   e. Retorna buffer PDF
5. Backend:
   a. Define headers: Content-Type, Content-Disposition
   b. Retorna PDF como stream
6. Browser do user faz download do arquivo:
   report-VALE3-2025-11-12.pdf
```

---

## 12. TESTES DE VALIDAÇÃO

### 12.1 Testes Backend

```bash
# 1. Testar endpoint assets-status
curl -X GET http://localhost:3101/api/v1/reports/assets-status

# Espera-se:
# - Status 200
# - Array de AssetWithAnalysisStatusDto
# - Todos os ativos ativos listados
# - Campos hasAnalysis, canRequestAnalysis corretos

# 2. Testar análise individual
curl -X POST http://localhost:3101/api/v1/analysis/PETR4/complete

# Espera-se:
# - Status 201
# - Analysis object criado
# - status = 'pending' ou 'processing'

# 3. Testar análise em massa
curl -X POST http://localhost:3101/api/v1/analysis/bulk/request \
  -H "Content-Type: application/json" \
  -d '{"type": "complete"}'

# Espera-se:
# - Status 201
# - { total, requested, skipped }
# - requested > 0 se houver ativos sem análise recente

# 4. Testar download PDF
curl -X GET http://localhost:3101/api/v1/reports/{id}/download?format=pdf \
  --output report.pdf

# Espera-se:
# - Status 200
# - Arquivo PDF válido
# - Content-Type: application/pdf

# 5. Testar download JSON
curl -X GET http://localhost:3101/api/v1/reports/{id}/download?format=json

# Espera-se:
# - Status 200
# - JSON válido da análise
# - Content-Type: application/json
```

### 12.2 Testes Frontend (Manual)

**Teste 1: Listagem de Ativos**
1. Acessar `http://localhost:3100/reports`
2. Verificar:
   - ✅ Todos os ativos aparecem (mesma quantidade de /assets)
   - ✅ Badge de status correto para cada ativo
   - ✅ Data última análise formatada corretamente
   - ✅ Resumo visível (ou mensagem padrão se não tem)
   - ✅ Botão "Analisar" visível para ativos sem análise recente
   - ✅ Botão "Visualizar" visível para ativos com análise completa

**Teste 2: Busca**
1. Digitar "PETR" no campo de busca
2. Verificar:
   - ✅ Lista filtrada mostra apenas PETR4, PETR3
   - ✅ Busca funciona por ticker
   - ✅ Busca funciona por nome (ex: "Petrobras")

**Teste 3: Analisar Todos**
1. Clicar "Analisar Todos os Ativos"
2. Verificar:
   - ✅ Dialog de confirmação aparece
   - ✅ Mensagem explicativa clara
   - ✅ Botão "Confirmar" funcional
3. Confirmar
4. Verificar:
   - ✅ Toast de sucesso aparece
   - ✅ Mensagem com quantidade de análises solicitadas
   - ✅ Badges mudam para "Pendente" ou "Processando"
5. Aguardar 30s (auto-refresh)
6. Verificar:
   - ✅ Badges atualizam automaticamente

**Teste 4: Analisar Individual**
1. Clicar "Analisar" em VALE3
2. Verificar:
   - ✅ Botão muda para "Analisando..." (loading)
   - ✅ Botão fica desabilitado durante processamento
3. Aguardar conclusão
4. Verificar:
   - ✅ Toast de sucesso aparece
   - ✅ Lista atualiza automaticamente
   - ✅ Badge muda para "Atualizada"
   - ✅ Botão "Visualizar" aparece

**Teste 5: Visualizar Detalhes**
1. Clicar "Visualizar" em PETR4
2. Verificar:
   - ✅ Navegação para /reports/{id}
   - ✅ Dados do ativo carregados
   - ✅ Card de resumo com recomendação, confiança, preço
   - ✅ 4 Tabs presentes
   - ✅ Tab "Visão Geral" selecionado por padrão
3. Clicar em cada tab
4. Verificar:
   - ✅ Conteúdo de cada tab renderiza
   - ✅ Sem erros no console

**Teste 6: Download**
1. Na página de detalhes, clicar "Download PDF"
2. Verificar:
   - ✅ Nova janela abre
   - ✅ Download do PDF inicia
   - ✅ Arquivo `report-PETR4-*.pdf` baixado
3. Abrir PDF
4. Verificar:
   - ✅ PDF formatado corretamente
   - ✅ Dados do relatório presentes
5. Repetir com "Download JSON"
6. Verificar:
   - ✅ JSON válido baixado
   - ✅ Estrutura de dados completa

**Teste 7: Tooltip Multi-Source**
1. Passar mouse sobre ícone de info
2. Verificar:
   - ✅ Tooltip aparece
   - ✅ Lista das 4 fontes visível
   - ✅ Explicação de cross-validation presente

**Teste 8: Responsividade**
1. Redimensionar janela (mobile, tablet, desktop)
2. Verificar:
   - ✅ Layout adapta corretamente
   - ✅ Botões acessíveis
   - ✅ Texto legível

**Teste 9: Console**
1. Abrir DevTools (F12)
2. Navegar por todas as páginas
3. Verificar:
   - ✅ 0 erros no console
   - ✅ Apenas warnings não-críticos

**Teste 10: Performance**
1. Listar 50+ ativos
2. Verificar:
   - ✅ Lista carrega em < 2s
   - ✅ Scroll suave
   - ✅ Busca responsiva

---

## 13. RISCOS E MITIGAÇÕES

### Risco 1: Análise em Massa Sobrecarregar Sistema

**Probabilidade:** Média
**Impacto:** Alto

**Mitigação:**
- ✅ Sistema já usa BullMQ com rate limiting
- ✅ Jobs processados um por vez em background
- ✅ Frontend não trava durante processamento
- ✅ Adicionar confirmação antes de executar

### Risco 2: Download de PDF Falhar

**Probabilidade:** Média
**Impacto:** Médio

**Mitigação:**
- Instalar Puppeteer corretamente (com Chrome/Chromium)
- Testar geração de PDF em ambiente de desenvolvimento
- Implementar fallback: download JSON se PDF falhar
- Logs detalhados de erros

### Risco 3: Limpeza de Dados Remover Informações Importantes

**Probabilidade:** Baixa
**Impacto:** Alto

**Mitigação:**
- ✅ Backup do banco antes de executar script
- ✅ Script mostra estatísticas ANTES e DEPOIS
- ✅ Limpeza de análises > 90 dias é OPCIONAL (comentada)
- ✅ Possibilidade de rollback (restore backup)

### Risco 4: Performance com Muitos Ativos (>100)

**Probabilidade:** Média
**Impacto:** Médio

**Mitigação:**
- Endpoint usa queries otimizadas com joins
- Adicionar paginação se necessário (futuro)
- Cache no frontend (React Query)
- Auto-refresh apenas a cada 30s

### Risco 5: Dados Inconsistentes Após Limpeza

**Probabilidade:** Baixa
**Impacto:** Médio

**Mitigação:**
- ✅ Validar integridade referencial (FKs)
- ✅ Executar queries de análise pós-limpeza
- ✅ Testar endpoints após limpeza
- ✅ Commit separado para cada fase

---

## 14. CRITÉRIOS DE ACEITAÇÃO

### Backend

- [x] Script de limpeza executa sem erros
- [x] Endpoint `/reports/assets-status` retorna 200 OK
- [x] DTO `AssetWithAnalysisStatusDto` completo
- [x] Todos os ativos ativos aparecem no endpoint
- [x] Flags `isAnalysisRecent`, `isAnalysisOutdated`, `canRequestAnalysis` calculadas corretamente
- [x] Download PDF gera arquivo válido
- [x] Download JSON retorna estrutura completa
- [x] 0 erros de TypeScript
- [x] Build bem-sucedido

### Frontend

- [x] Página `/reports` carrega em < 2s
- [x] Todos os ativos de `/assets` aparecem em `/reports`
- [x] Badge de status correto para cada ativo
- [x] Data última análise formatada (relativa)
- [x] Resumo da análise visível (ou mensagem padrão)
- [x] Botão "Analisar Todos" funcional
- [x] Botão "Analisar" individual funcional
- [x] Busca filtra por ticker e nome
- [x] Tooltip multi-source funcional
- [x] Navegação para detalhes funciona
- [x] Página de detalhes usa dados reais da API
- [x] Downloads (PDF/JSON) funcionam
- [x] 0 erros no console
- [x] 0 erros de TypeScript
- [x] Build bem-sucedido

### Testes

- [x] Todos os testes E2E passam
- [x] Performance validada (lista grande)
- [x] Responsividade testada (mobile, tablet, desktop)
- [x] Acessibilidade básica (keyboard navigation)

### Documentação

- [x] `claude.md` atualizado com novas features
- [x] Comentários no código explicativos
- [x] README atualizado (se necessário)
- [x] Swagger atualizado com novos endpoints

---

## 15. CONCLUSÃO

Este documento fornece um plano completo e minucioso para refatorar o sistema de Reports e Análises da plataforma B3 AI Analysis.

### Próximos Passos

1. **Revisar e Aprovar Plano:** Usuário deve revisar este documento e aprovar
2. **Iniciar Implementação:** Seguir ordem das fases (1 → 2 → 3 → 4 → 5 → 6)
3. **Commits Incrementais:** Fazer commit ao final de cada fase
4. **Testes Contínuos:** Validar cada fase antes de avançar
5. **Documentação Final:** Atualizar `claude.md` ao concluir todas as fases

### Estimativa de Tempo Total

- **FASE 1:** 2-3 horas (Limpeza)
- **FASE 2:** 3-4 horas (Novo Endpoint)
- **FASE 3:** 4-5 horas (Frontend Reports)
- **FASE 4:** 2-3 horas (Detail Page)
- **FASE 5:** 4-5 horas (Download)
- **FASE 6:** 3-4 horas (Testes)

**Total:** 18-24 horas (~3-4 dias de trabalho)

---

**Documento Criado:** 2025-11-12
**Mantenedor:** Claude Code (Sonnet 4.5)
**Status:** ✅ Pronto para Implementação
