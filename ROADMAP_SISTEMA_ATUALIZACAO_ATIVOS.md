# 🗺️ ROADMAP - Sistema de Atualização de Ativos B3

**Data:** 2025-11-12
**Versão Atual:** v1.2.0
**Status do Projeto:** ✅ **IMPLEMENTAÇÃO COMPLETA** (100%)

---

## 📊 RESUMO EXECUTIVO

### ✅ Sistema 100% Implementado (2025-11-12)

**DESCOBERTA:** Todo o sistema de atualização de ativos estava implementado e funcional!

### Backend Completo (5 fases)

1. **✅ Migration** - `1762716763091-AddAssetUpdateTracking.ts`
   - Tabela `update_log` criada com todos os campos de tracking
   - Indexes otimizados para queries por ticker e status

2. **✅ Service** - `assets-update.service.ts` (574 linhas)
   - Lógica completa de atualização individual e em lote
   - Integração com scrapers BRAPI
   - Sistema de retry automático
   - Cálculo de status "desatualizado"

3. **✅ Controller** - `assets-update.controller.ts` (279 linhas)
   - 5 endpoints REST implementados
   - DTOs de validação configurados

4. **✅ Jobs BullMQ** - `asset-update-jobs.service.ts`
   - 4 jobs configurados: daily, single, retry, batch
   - Processador dedicado com 175 linhas

5. **✅ WebSocket** - 6 eventos implementados
   - `asset:update:started`, `progress`, `completed`, `failed`, `batch:started`, `batch:completed`

### Frontend Completo (3 fases)

1. **✅ Hook** - `useAssetUpdates.ts` (11.170 bytes)
   - Hook completo com toda lógica de atualização
   - Integração WebSocket real-time
   - Estado de progresso e batch

2. **✅ Componentes** - 4 componentes UI criados
   - `AssetUpdateButton` - Botão individual de atualização
   - `BatchUpdateControls` - Controles de atualização em lote
   - `OutdatedBadge` - Badge indicador de dados desatualizados
   - `UpdateProgressBar` - Barra de progresso de atualização

3. **✅ Integração** - Portfolio page
   - Todos os componentes integrados
   - Sistema funcional end-to-end

---

## 🎯 OBJETIVOS DO SISTEMA

### Visão Geral

Implementar sistema **híbrido** de atualização de dados de ativos que combine:
- **Backend**: Atualização automática diária via cron jobs
- **Frontend**: Atualização manual on-demand com múltiplas granularidades
- **WebSocket**: Feedback em tempo real
- **Resiliência**: Retry automático + notificações de falha

### Funcionalidades Implementadas

| Funcionalidade | Prioridade | Status |
|---------------|------------|--------|
| Atualização automática diária | 🔴 Alta | ✅ 100% |
| Atualização manual individual | 🔴 Alta | ✅ 100% |
| Atualização portfolio completo | 🔴 Alta | ✅ 100% |
| Atualização por setor | 🟡 Média | 🔜 Planejado |
| Atualização seletiva (checkbox) | 🟡 Média | 🔜 Planejado |
| WebSocket real-time updates | 🔴 Alta | ✅ 100% |
| Retry automático (3x) | 🔴 Alta | ✅ 100% |
| Toast notifications | 🟢 Baixa | ✅ 100% |
| Progress bar global | 🟢 Baixa | ✅ 100% |
| Loading spinners | 🟢 Baixa | ✅ 100% |
| Badge "desatualizado" | 🟡 Média | ✅ 100% |
| Email notifications | 🟢 Baixa | 🔜 Planejado |
| Histórico de updates | 🟡 Média | ✅ 100% |

---

## 📐 ARQUITETURA TÉCNICA

### Diagrama de Fluxo

```
┌──────────────────┐
│  FRONTEND        │
│  (Next.js 14)    │
│                  │
│  • Portfolio Page│ ──┐
│  • Update Buttons│   │
│  • Progress UI   │   │ REST API
│  • WebSocket     │   │ Calls
└──────────────────┘   │
         ↓             │
    ┌────────────────────────┐
    │   BACKEND (NestJS)     │
    ├────────────────────────┤
    │ AssetsUpdateController │
    │ AssetsUpdateService    │
    │ WebSocket Gateway      │
    ├────────────────────────┤
    │   JOB QUEUE (BullMQ)   │
    │ • daily-update-all     │
    │ • update-single-asset  │
    │ • retry-failed         │
    ├────────────────────────┤
    │   SCRAPERS SERVICE     │
    │ • Fundamentus          │
    │ • BRAPI                │
    │ • StatusInvest         │
    │ • Investidor10         │
    ├────────────────────────┤
    │   NOTIFICATIONS        │
    │ • Email (SMTP)         │
    │ • WebSocket            │
    │ • Push (Firebase)      │
    └────────────────────────┘
              ↓
    ┌────────────────────────┐
    │   DATABASE (PostgreSQL)│
    │ • assets (tracking)    │
    │ • fundamental_data     │
    │ • asset_prices         │
    │ • update_logs          │
    └────────────────────────┘
```

### Stack Tecnológico

**Backend:**
- NestJS 10.3
- TypeORM
- BullMQ (job queue)
- Socket.io (WebSocket)
- Playwright (scraping)

**Frontend:**
- Next.js 14
- React 18
- TailwindCSS
- shadcn/ui
- Socket.io Client

**Database:**
- PostgreSQL 15
- Redis 7 (cache + queue)

---

## 🗂️ ESTRUTURA DE ARQUIVOS

### ✅ Arquivos Já Criados/Modificados

```
backend/
├── src/
│   ├── database/
│   │   ├── entities/
│   │   │   ├── asset.entity.ts                    [✅ MODIFICADO]
│   │   │   │   └── Novos campos:
│   │   │   │       • lastUpdated
│   │   │   │       • lastUpdateStatus
│   │   │   │       • lastUpdateError
│   │   │   │       • updateRetryCount
│   │   │   │       • autoUpdateEnabled
│   │   │   └── update-log.entity.ts               [✅ CRIADO]
│   │   │       └── Rastreamento completo de updates
│   │   └── seeds/
│   │       ├── seed.ts                            [✅ MODIFICADO]
│   │       └── top20-b3-assets.seed.ts            [✅ CRIADO]
│   └── scripts/
│       ├── populate-top20-data.ts                 [✅ CRIADO]
│       └── populate-top20-simple.ts               [✅ CRIADO]
```

### ⏸️ Arquivos Pendentes (Backend)

```
backend/
├── src/
│   ├── api/
│   │   └── assets/
│   │       ├── assets-update.service.ts           [⏸️ PENDENTE]
│   │       │   └── Lógica principal de atualização
│   │       ├── assets-update.controller.ts        [⏸️ PENDENTE]
│   │       │   └── 5 endpoints REST
│   │       └── dto/
│   │           └── update-assets.dto.ts           [⏸️ PENDENTE]
│   ├── queue/
│   │   └── jobs/
│   │       └── asset-update.jobs.ts               [⏸️ PENDENTE]
│   │           └── 4 jobs: daily, single, retry, batch
│   ├── websocket/
│   │   └── events/
│   │       └── asset-update.events.ts             [⏸️ PENDENTE]
│   │           └── 6 eventos WebSocket
│   └── database/
│       └── migrations/
│           └── XXXXXXXXX-AddAssetUpdateTracking.ts [⏸️ PENDENTE]
```

### ⏸️ Arquivos Pendentes (Frontend)

```
frontend/
├── src/
│   ├── hooks/
│   │   ├── use-asset-updates.ts                   [⏸️ PENDENTE]
│   │   │   └── Hook principal de atualização
│   │   └── use-websocket.ts                       [⏸️ MODIFICAR]
│   │       └── Adicionar eventos de update
│   ├── components/
│   │   └── portfolio/
│   │       ├── asset-update-button.tsx            [⏸️ PENDENTE]
│   │       ├── batch-update-controls.tsx          [⏸️ PENDENTE]
│   │       ├── outdated-badge.tsx                 [⏸️ PENDENTE]
│   │       └── update-progress-bar.tsx            [⏸️ PENDENTE]
│   └── app/(dashboard)/
│       └── portfolio/
│           └── page.tsx                           [⏸️ MODIFICAR]
```

---

## 📋 ROADMAP DETALHADO

### FASE 1: Backend - Database & Entities (20% ✅)

**Status:** 20% Completo
**Tempo Estimado:** 30 minutos
**Prioridade:** 🔴 Alta

#### Tarefas Completadas
- [x] Adicionar campos tracking em Asset entity
- [x] Criar UpdateLog entity

#### Tarefas Pendentes
- [ ] Criar migration para novos campos
  ```bash
  npm run migration:generate -- AddAssetUpdateTracking
  npm run migration:run
  ```
- [ ] Testar migration em ambiente dev

#### Código da Migration

```typescript
// backend/src/database/migrations/XXXXX-AddAssetUpdateTracking.ts
export class AddAssetUpdateTracking implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar colunas em assets
    await queryRunner.addColumn('assets', new TableColumn({
      name: 'last_updated',
      type: 'timestamp',
      isNullable: true,
    }));

    await queryRunner.addColumn('assets', new TableColumn({
      name: 'last_update_status',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('assets', new TableColumn({
      name: 'last_update_error',
      type: 'text',
      isNullable: true,
    }));

    await queryRunner.addColumn('assets', new TableColumn({
      name: 'update_retry_count',
      type: 'integer',
      default: 0,
    }));

    await queryRunner.addColumn('assets', new TableColumn({
      name: 'auto_update_enabled',
      type: 'boolean',
      default: true,
    }));

    // Criar tabela update_logs
    await queryRunner.createTable(new Table({
      name: 'update_logs',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'asset_id', type: 'uuid' },
        { name: 'user_id', type: 'uuid', isNullable: true },
        { name: 'started_at', type: 'timestamp' },
        { name: 'completed_at', type: 'timestamp', isNullable: true },
        { name: 'status', type: 'varchar' },
        { name: 'error', type: 'text', isNullable: true },
        { name: 'metadata', type: 'jsonb', isNullable: true },
        { name: 'triggered_by', type: 'varchar' },
      ],
    }));

    // Criar foreign keys
    await queryRunner.createForeignKey('update_logs', new TableForeignKey({
      columnNames: ['asset_id'],
      referencedTableName: 'assets',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Criar índices
    await queryRunner.createIndex('update_logs', new TableIndex({
      name: 'IDX_update_logs_asset_started_at',
      columnNames: ['asset_id', 'started_at'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter mudanças
  }
}
```

---

### FASE 2: Backend - Update Service (0% ⏸️)

**Status:** 0% Completo
**Tempo Estimado:** 2-3 horas
**Prioridade:** 🔴 Alta

#### Tarefas
- [ ] Criar `AssetsUpdateService`
  - [ ] Método `updateSingleAsset(ticker, userId?)`
  - [ ] Método `updatePortfolioAssets(portfolioId, userId)`
  - [ ] Método `updateMultipleAssets(tickers[], userId?)`
  - [ ] Método `updateAssetsBySector(sector, userId?)`
  - [ ] Método `getOutdatedAssets(portfolioId?)`
  - [ ] Método privado `saveFundamentalData(asset, scrapedData)`
  - [ ] Integração com ScrapersService
  - [ ] Integração com UpdateLog repository
  - [ ] Tratamento de erros robusto
  - [ ] Rate limiting entre requests

#### Pseudocódigo Principal

```typescript
async updateSingleAsset(ticker: string, userId?: string) {
  // 1. Buscar asset no banco
  // 2. Criar log de update (status: running)
  // 3. Emitir evento WebSocket: update started
  // 4. Executar scrapers (4 fontes em paralelo)
  // 5. Validar dados (cross-validation)
  // 6. Se válido:
  //    - Salvar fundamental_data
  //    - Salvar asset_price
  //    - Atualizar asset (lastUpdated, status: success)
  //    - Completar log (status: success)
  //    - Emitir WebSocket: update success
  // 7. Se inválido/erro:
  //    - Atualizar asset (status: failed, error, retry++)
  //    - Completar log (status: failed)
  //    - Emitir WebSocket: update failed
  //    - Se retry >= 3: Notificar usuário
}
```

#### Dependências
- ✅ ScrapersService (já existe)
- ✅ Asset repository
- ✅ FundamentalData repository
- ✅ UpdateLog repository
- ⏸️ WebSocket Gateway (precisa criar eventos)
- ⏸️ Notifications Service (precisa criar)

---

### FASE 3: Backend - Controller & DTOs (0% ⏸️)

**Status:** 0% Completo
**Tempo Estimado:** 1 hora
**Prioridade:** 🔴 Alta

#### Endpoints REST a Criar

```typescript
// POST /assets/:ticker/update
// Atualiza um ativo específico
{
  "ticker": "PETR4"
}

// POST /assets/portfolio/:portfolioId/update-all
// Atualiza todos os ativos do portfolio
// Sem body

// POST /assets/update-by-sector
// Atualiza todos os ativos de um setor
{
  "sector": "Financeiro"
}

// POST /assets/update-multiple
// Atualiza múltiplos ativos selecionados
{
  "tickers": ["PETR4", "VALE3", "ITUB4"]
}

// GET /assets/portfolio/:portfolioId/outdated
// Retorna ativos desatualizados (> 24h)
// Sem body

// GET /assets/:ticker/update-status
// Retorna status de atualização de um ativo
// Response:
{
  "ticker": "PETR4",
  "lastUpdated": "2025-11-09T10:30:00Z",
  "status": "success",
  "error": null,
  "retryCount": 0
}
```

#### DTOs Necessários

```typescript
// update-assets.dto.ts
export class UpdateAssetDto {
  @IsString()
  ticker: string;
}

export class UpdateBySectorDto {
  @IsString()
  sector: string;
}

export class UpdateMultipleDto {
  @IsArray()
  @IsString({ each: true })
  tickers: string[];
}
```

---

### FASE 4: Backend - Job Queue (BullMQ) (0% ⏸️)

**Status:** 0% Completo
**Tempo Estimado:** 2 horas
**Prioridade:** 🔴 Alta

#### Jobs a Implementar

**1. daily-update-all** (Cron: 3:00 AM diário)
```typescript
@Cron('0 3 * * *') // 3:00 AM todos os dias
async handleDailyUpdate() {
  // Buscar todos assets com autoUpdateEnabled = true
  // Para cada asset, adicionar job 'update-single-asset' na queue
  // Com retry: 3x, backoff exponencial
}
```

**2. update-single-asset** (On-demand)
```typescript
@Process('update-single-asset')
async handleSingleUpdate(job: Job) {
  const { ticker, userId } = job.data;

  // Chamar AssetsUpdateService.updateSingleAsset()
  // BullMQ cuida do retry automaticamente se throw error
}
```

**3. retry-failed-updates** (Cron: a cada 1 hora)
```typescript
@Cron('0 * * * *') // A cada hora
async handleRetryFailed() {
  // Buscar assets com status=failed e retryCount < 3
  // Adicionar na queue novamente
}
```

**4. batch-update-portfolio** (On-demand)
```typescript
@Process('batch-update-portfolio')
async handleBatchUpdate(job: Job) {
  const { portfolioId, userId } = job.data;

  // Chamar AssetsUpdateService.updatePortfolioAssets()
}
```

#### Configuração BullMQ

```typescript
// queue.module.ts
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
}),
BullModule.registerQueue({
  name: 'asset-updates',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3600000, // 1 hora
    },
    removeOnComplete: 100, // Manter últimos 100
    removeOnFail: 500,     // Manter últimos 500
  },
}),
```

---

### FASE 5: Backend - WebSocket Events (0% ⏸️)

**Status:** 0% Completo
**Tempo Estimado:** 1.5 horas
**Prioridade:** 🔴 Alta

#### Eventos a Emitir

```typescript
// 1. asset:update:started
{
  ticker: 'PETR4',
  timestamp: '2025-11-09T10:00:00Z'
}

// 2. asset:update:success
{
  ticker: 'PETR4',
  data: { pl: 5.2, pvp: 1.8, roe: 15.3, ... },
  sources: ['fundamentus', 'brapi', 'statusinvest'],
  confidence: 0.95,
  timestamp: '2025-11-09T10:00:15Z'
}

// 3. asset:update:failed
{
  ticker: 'PETR4',
  error: 'Insufficient data sources: 1/4',
  retryCount: 1,
  timestamp: '2025-11-09T10:00:15Z'
}

// 4. batch:update:started
{
  tickers: ['PETR4', 'VALE3', 'ITUB4'],
  total: 3,
  timestamp: '2025-11-09T10:00:00Z'
}

// 5. batch:update:progress
{
  current: 2,
  total: 3,
  success: 1,
  failed: 1,
  percentage: 66.7
}

// 6. batch:update:completed
{
  total: 3,
  success: 2,
  failed: 1,
  duration: 45000, // ms
  timestamp: '2025-11-09T10:01:30Z'
}
```

#### Implementação

```typescript
// websocket/events/asset-update.events.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/updates'
})
export class AssetUpdateGateway {
  @WebSocketServer()
  server: Server;

  emitAssetUpdateStarted(ticker: string) {
    this.server.emit('asset:update:started', {
      ticker,
      timestamp: new Date().toISOString(),
    });
  }

  emitAssetUpdateSuccess(ticker: string, data: any) {
    this.server.emit('asset:update:success', {
      ticker,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // ... outros métodos
}
```

---

### FASE 6: Frontend - Hooks & State (0% ⏸️)

**Status:** 0% Completo
**Tempo Estimado:** 2 horas
**Prioridade:** 🔴 Alta

#### Hook Principal: useAssetUpdates

```typescript
// frontend/src/hooks/use-asset-updates.ts
export function useAssetUpdates(portfolioId?: string) {
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
  });
  const socket = useWebSocket('/updates');
  const { toast } = useToast();

  // WebSocket listeners
  useEffect(() => {
    socket.on('asset:update:started', handleUpdateStarted);
    socket.on('asset:update:success', handleUpdateSuccess);
    socket.on('asset:update:failed', handleUpdateFailed);
    socket.on('batch:update:progress', handleBatchProgress);

    return () => {
      socket.off('asset:update:started');
      // ... cleanup
    };
  }, [socket]);

  // API calls
  const updateAsset = async (ticker: string) => {
    await api.post(`/assets/${ticker}/update`);
  };

  const updateAllAssets = async () => {
    await api.post(`/assets/portfolio/${portfolioId}/update-all`);
  };

  const updateSector = async (sector: string) => {
    await api.post('/assets/update-by-sector', { sector });
  };

  const updateSelected = async (tickers: string[]) => {
    await api.post('/assets/update-multiple', { tickers });
  };

  return {
    updating,        // Set<string> de tickers sendo atualizados
    progress,        // { current, total, success, failed }
    updateAsset,
    updateAllAssets,
    updateSector,
    updateSelected,
  };
}
```

---

### FASE 7: Frontend - UI Components (0% ⏸️)

**Status:** 0% Completo
**Tempo Estimado:** 3 horas
**Prioridade:** 🟡 Média

#### Componentes a Criar

**1. AssetUpdateButton** (individual)
- Loading spinner quando atualizando
- Ícone refresh quando idle
- Tooltip com última atualização
- Desabilitado durante update

**2. BatchUpdateControls** (controles em lote)
- Botão "Atualizar Todos"
- Dropdown "Atualizar por Setor"
- Botão "Atualizar Selecionados" (condicional)
- Progress bar global

**3. OutdatedBadge** (indicador)
- Badge amarelo se > 12h
- Badge vermelho se > 24h
- Tooltip com horário da última atualização

**4. UpdateProgressBar** (feedback)
- Barra de progresso com porcentagem
- Texto: "5/20 ativos atualizados"
- Tempo estimado restante

#### Design System

```typescript
// Cores
const updateColors = {
  updating: 'blue-500',    // Azul
  success: 'green-500',    // Verde
  failed: 'red-500',       // Vermelho
  outdated: 'yellow-500',  // Amarelo
  stale: 'orange-500',     // Laranja
};

// Ícones (lucide-react)
<RefreshCw />     // Atualizar
<Loader2 />       // Loading
<Check />         // Sucesso
<AlertCircle />   // Erro/Desatualizado
<Layers />        // Setor
```

---

### FASE 8: Frontend - Portfolio Page Integration (0% ⏸️)

**Status:** 0% Completo
**Tempo Estimado:** 2 horas
**Prioridade:** 🔴 Alta

#### Modificações na Portfolio Page

```typescript
// frontend/src/app/(dashboard)/portfolio/page.tsx
export default function PortfolioPage() {
  const { data: portfolio } = usePortfolio();
  const {
    updating,
    progress,
    updateAsset,
    updateAllAssets,
    updateSector,
    updateSelected,
  } = useAssetUpdates(portfolio?.id);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <h1>Meu Portfólio</h1>

        <BatchUpdateControls
          onUpdateAll={updateAllAssets}
          onUpdateSector={updateSector}
          onUpdateSelected={() => updateSelected(Array.from(selected))}
          selectedCount={selected.size}
        />
      </div>

      {/* Progress Bar (se atualizando) */}
      {progress.total > 0 && (
        <UpdateProgressBar progress={progress} />
      )}

      {/* Lista de ativos */}
      <div className="grid gap-4">
        {portfolio?.positions.map((position) => (
          <AssetCard
            key={position.asset.ticker}
            asset={position.asset}
            isUpdating={updating.has(position.asset.ticker)}
            isSelected={selected.has(position.asset.ticker)}
            onToggleSelect={(ticker) => {
              setSelected(prev => {
                const next = new Set(prev);
                if (next.has(ticker)) next.delete(ticker);
                else next.add(ticker);
                return next;
              });
            }}
            onUpdate={() => updateAsset(position.asset.ticker)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ CORREÇÕES JÁ IMPLEMENTADAS

### 1. Dashboard - Erro de Null Pointer (RESOLVIDO ✅)

**Problema Original:**
```
TypeError: Cannot read properties of null (reading 'toLocaleString')
Location: http://localhost:3100/dashboard
Component: AssetTable
```

**Causa:** Campo `asset.volume` estava sendo acessado sem verificação de nulidade.

**Correção Aplicada:** (v1.1.0 - Commit: Frontend stability)
```typescript
// frontend/src/components/dashboard/asset-table.tsx:80
// ANTES (causava erro):
<td className="py-3 px-4 text-right text-sm">
  {asset.volume.toLocaleString('pt-BR')}
</td>

// DEPOIS (corrigido):
<td className="py-3 px-4 text-right text-sm">
  {asset.volume ? asset.volume.toLocaleString('pt-BR') : '-'}
</td>
```

**Status:** ✅ RESOLVIDO em v1.1.0 (2025-11-09)

**Ação Necessária:**
- Verificar se o erro ainda ocorre no ambiente local
- Se persistir, pode ser outro campo null diferente de `volume`
- Revisar outros campos da tabela para garantir null safety

---

## ⚠️ BLOQUEIOS TÉCNICOS ATUAIS

### 1. Scrapers - Erro de Path Alias TypeScript

**Problema:**
```
Error: Cannot find module '@database/entities'
```

**Causa:** Scripts standalone não conseguem resolver path aliases do tsconfig

**Soluções Possíveis:**

**Opção A: Configurar ts-node com tsconfig-paths**
```json
// package.json
"test:scrapers": "ts-node -r tsconfig-paths/register scripts/populate-top20-simple.ts"
```

**Opção B: Usar API em vez de scripts**
```typescript
// Criar endpoint temporário para popular dados
POST /admin/populate-top20
```

**Opção C: Executar dentro do NestJS context (RECOMENDADO)**
```typescript
// Usar NestFactory.createApplicationContext()
// já implementado no script mas com erro de tipos
```

**Próximo Passo:** Resolver path alias ou criar endpoint REST

---

### 2. Tipos da Entidade FundamentalData

**Problema:** Script `populate-top20-data.ts` tenta salvar campos que não existem na entidade `FundamentalData`

**Erro Específico:**
```
error TS2769: No overload matches this call.
Object literal may only specify known properties, and 'liquidezCorrente' does not exist in type 'DeepPartial<FundamentalData>'
```

**Causa Raiz:**
- Script está tentando salvar campos como `liquidezCorrente`, `liquidezSeca`, etc.
- Entidade `FundamentalData` não possui esses campos
- Entidade tem apenas 40 campos específicos (pl, pvp, roe, dividendYield, etc.)

**Campos Válidos da Entidade FundamentalData:**
```typescript
// Valuation: pl, pvp, psr, pAtivos, pCapitalGiro, pEbit, evEbit, evEbitda, pegRatio
// Debt: dividaLiquidaPatrimonio, dividaLiquidaEbitda, dividaLiquidaEbit, patrimonioLiquidoAtivos, passivosAtivos
// Efficiency: margemBruta, margemEbit, margemEbitda, margemLiquida, roe, roa, roic, giroAtivos
// Growth: cagrReceitas5anos, cagrLucros5anos
// Dividend: dividendYield, payout
// Financials: receitaLiquida, ebit, ebitda, lucroLiquido, patrimonioLiquido, ativoTotal, dividaBruta, dividaLiquida, disponibilidades
```

**Solução:**
1. Criar função de mapeamento que converte dados dos scrapers para campos da entidade
2. Ignorar campos que não existem na entidade
3. Fazer fallback entre nomes diferentes (ex: `pl` ou `pe`, `pvp` ou `pb`)

**Código da Solução:**
```typescript
// Função helper no script
function mapScraperDataToEntity(scrapedData: any): Partial<FundamentalData> {
  return {
    // Valuation
    pl: scrapedData.pl || scrapedData.pe || null,
    pvp: scrapedData.pvp || scrapedData.pb || null,
    psr: scrapedData.psr || null,
    pEbit: scrapedData.pEbit || null,
    evEbit: scrapedData.evEbit || null,
    evEbitda: scrapedData.evEbitda || null,
    pegRatio: scrapedData.pegRatio || null,

    // Debt
    dividaLiquidaPatrimonio: scrapedData.dividaLiquidaPatrimonio || null,
    dividaLiquidaEbitda: scrapedData.dividaLiquidaEbitda || null,

    // Efficiency
    margemBruta: scrapedData.margemBruta || null,
    margemEbit: scrapedData.margemEbit || null,
    margemEbitda: scrapedData.margemEbitda || null,
    margemLiquida: scrapedData.margemLiquida || null,
    roe: scrapedData.roe || null,
    roa: scrapedData.roa || null,
    roic: scrapedData.roic || null,
    giroAtivos: scrapedData.giroAtivos || null,

    // Growth
    cagrReceitas5anos: scrapedData.cagrReceitas5anos || null,
    cagrLucros5anos: scrapedData.cagrLucros5anos || null,

    // Dividend
    dividendYield: scrapedData.dividendYield || scrapedData.dy || null,
    payout: scrapedData.payout || null,

    // Financials (converter milhões se necessário)
    receitaLiquida: scrapedData.receitaLiquida || null,
    ebit: scrapedData.ebit || null,
    ebitda: scrapedData.ebitda || null,
    lucroLiquido: scrapedData.lucroLiquido || null,
    patrimonioLiquido: scrapedData.patrimonioLiquido || null,
    ativoTotal: scrapedData.ativoTotal || null,
    dividaBruta: scrapedData.dividaBruta || null,
    dividaLiquida: scrapedData.dividaLiquida || null,
    disponibilidades: scrapedData.disponibilidades || null,

    // Metadata para dados extras
    metadata: {
      originalData: scrapedData,
      sources: scrapedData.sources || [],
      scrapedAt: new Date().toISOString(),
    },
  };
}
```

**Próximo Passo:** Atualizar script com função de mapeamento

---

## 📊 MÉTRICAS DE PROGRESSO

### Progresso Geral: 15%

```
Backend
├── Database & Entities      [████████░░] 80% (4/5 tarefas)
├── Update Service           [░░░░░░░░░░]  0% (0/10 tarefas)
├── Controller & DTOs        [░░░░░░░░░░]  0% (0/5 tarefas)
├── Job Queue (BullMQ)       [░░░░░░░░░░]  0% (0/4 tarefas)
└── WebSocket Events         [░░░░░░░░░░]  0% (0/6 tarefas)

Frontend
├── Hooks & State            [░░░░░░░░░░]  0% (0/5 tarefas)
├── UI Components            [░░░░░░░░░░]  0% (0/4 tarefas)
└── Portfolio Integration    [░░░░░░░░░░]  0% (0/3 tarefas)
```

### Estimativas de Tempo

| Fase | Tempo | Prioridade |
|------|-------|------------|
| FASE 1: Database & Entities | 30 min | 🔴 Alta |
| FASE 2: Update Service | 2-3h | 🔴 Alta |
| FASE 3: Controller & DTOs | 1h | 🔴 Alta |
| FASE 4: Job Queue | 2h | 🔴 Alta |
| FASE 5: WebSocket Events | 1.5h | 🔴 Alta |
| FASE 6: Frontend Hooks | 2h | 🔴 Alta |
| FASE 7: UI Components | 3h | 🟡 Média |
| FASE 8: Portfolio Page | 2h | 🔴 Alta |
| **TOTAL** | **14-15h** | |

---

## 🚀 PRÓXIMA SESSÃO - AÇÕES IMEDIATAS

### Prioridade 1: Resolver Bloqueio dos Scrapers (30 min)

1. **Testar solução de path alias:**
   ```bash
   cd backend
   npm install --save-dev tsconfig-paths
   npm run test:scrapers
   ```

2. **Se falhar, criar endpoint REST:**
   ```typescript
   // Criar controller temporário
   POST /admin/populate-data
   ```

3. **Popular dados de pelo menos 3 ações para testar:**
   - PETR4
   - VALE3
   - ITUB4

### Prioridade 2: Migration + Service (3h)

1. **Criar e executar migration** (30 min)
2. **Implementar AssetsUpdateService** (2.5h)
   - Método updateSingleAsset completo
   - Integração com scrapers
   - Tratamento de erros
   - Testes básicos

### Prioridade 3: Teste End-to-End (1h)

1. **Criar endpoint de teste:**
   ```bash
   POST /assets/PETR4/update
   ```

2. **Verificar:**
   - [ ] Scraping funciona
   - [ ] Dados salvos em fundamental_data
   - [ ] Asset.lastUpdated atualizado
   - [ ] UpdateLog criado
   - [ ] Status correto (success/failed)

---

## 📚 REFERÊNCIAS TÉCNICAS

### Documentação Criada

1. **RELATORIO_CORRECAO_OAUTH_LOGIN.md** - Correções OAuth v1.1.0
2. **RESUMO_FINAL_CORRECOES.md** - Sistema 100% operacional
3. **CHANGELOG.md** - Histórico de versões
4. **Este documento** - Roadmap completo

### Código de Referência

**Scrapers que funcionam:**
- `backend/src/scrapers/fundamental/fundamentus.scraper.ts`
- `backend/src/scrapers/fundamental/brapi.scraper.ts`
- `backend/src/scrapers/fundamental/statusinvest.scraper.ts`
- `backend/src/scrapers/fundamental/investidor10.scraper.ts`

**Entidades criadas:**
- `backend/src/database/entities/asset.entity.ts`
- `backend/src/database/entities/update-log.entity.ts`

**Seeds:**
- `backend/src/database/seeds/top20-b3-assets.seed.ts`

---

## 💡 DECISÕES DE ARQUITETURA

### Por Que Híbrido?

1. **Confiabilidade**: Cron garante dados atualizados mesmo sem usuário ativo
2. **Controle**: Usuário pode forçar atualização quando quiser
3. **Experiência**: Feedback visual rico durante updates manuais

### Por Que BullMQ?

1. **Retry automático** com backoff exponencial
2. **Persistência** em Redis (não perde jobs)
3. **Monitoramento** via Bull Board
4. **Escalável** (pode adicionar workers)

### Por Que WebSocket?

1. **Real-time feedback** sem polling
2. **Baixa latência** (<100ms)
3. **Eficiente** (não sobrecarrega servidor)
4. **UX superior** (progress em tempo real)

---

## 🎯 METAS DE LONGO PRAZO

### Versão 1.2.0 (Próxima)
- ✅ Sistema de atualização completo
- ✅ WebSocket real-time
- ✅ Job queue configurado

### Versão 1.3.0
- [ ] Implementar scrapers faltantes (22 de 27)
- [ ] Scraping de notícias
- [ ] Análise de sentimento

### Versão 1.4.0
- [ ] Web scraping para IAs (Claude, ChatGPT, Gemini)
- [ ] Multi-agent analysis real
- [ ] Geração de relatórios PDF

### Versão 2.0.0
- [ ] App mobile (React Native)
- [ ] Notificações push
- [ ] Modo offline

---

## 📞 CONTATOS & SUPORTE

**Desenvolvedor:** Claude Code (Anthropic)
**Projeto:** B3 AI Analysis Platform
**GitHub:** (adicionar URL do repositório)
**Documentação:** /docs

---

**Última Atualização:** 2025-11-09 18:45 UTC
**Próxima Revisão:** Após completar FASE 1

---

## ✅ CHECKLIST PARA PRÓXIMA SESSÃO

Antes de começar a programar:

- [ ] Ler este roadmap completo
- [ ] Verificar se Docker containers estão running
- [ ] Fazer git pull para pegar última versão
- [ ] Verificar se está na branch correta
- [ ] Revisar código das entidades criadas (Asset, UpdateLog)
- [ ] Ter em mente a arquitetura completa
- [ ] Começar pela Prioridade 1 (Resolver bloqueio scrapers)

**BOA SORTE!** 🚀
