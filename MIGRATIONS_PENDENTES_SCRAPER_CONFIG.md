# Migrations Pendentes - Controle Dinâmico de Scrapers

**Data:** 2025-12-25
**Razão:** Docker Desktop com instabilidade, bloqueando execução de migrations
**Status:** CÓDIGO CRIADO, aguardando execução quando Docker estabilizar

---

## MIGRATIONS A EXECUTAR

### 1. AddUniquePriorityConstraint (BUG-003)

**Arquivo:** `backend/src/database/migrations/1766680100000-AddUniquePriorityConstraint.ts`
**Status:** ✅ Criado, ⏳ Aguardando execução
**Prioridade:** ALTA

**Problema:**
- Entity comenta "CONSTRAINT: Deve ser única (não pode haver duplicatas)"
- Migration original NÃO criou UNIQUE constraint em priority
- Múltiplos scrapers podem ter mesma prioridade
- Ordenação fica incerta

**Solução:**
```sql
-- 1. Limpar duplicatas existentes (se houver)
WITH ranked AS (
  SELECT id, priority,
         ROW_NUMBER() OVER (PARTITION BY priority ORDER BY "createdAt", id) as row_num
  FROM scraper_configs
)
UPDATE scraper_configs sc
SET priority = (
  SELECT MAX(priority) + (row_num - 1)
  FROM scraper_configs
)
FROM ranked r
WHERE sc.id = r.id AND r.row_num > 1;

-- 2. Adicionar constraint
ALTER TABLE scraper_configs
ADD CONSTRAINT UQ_scraper_config_priority UNIQUE (priority);
```

**Validação Pós-Execução:**
```bash
# Verificar constraint
\d scraper_configs
# Deve mostrar: "UQ_scraper_config_priority" UNIQUE, btree (priority)

# Testar constraint
INSERT INTO scraper_configs (id, scraperId, priority, ...) VALUES (..., 1, ...);
-- Deve falhar: ERROR duplicate key value violates unique constraint
```

**Rollback:**
```sql
ALTER TABLE scraper_configs DROP CONSTRAINT IF EXISTS UQ_scraper_config_priority;
```

---

### 2. CreateScraperConfigAudit (GAP-006)

**Arquivo:** `backend/src/database/migrations/1766680100000-CreateScraperConfigAudit.ts`
**Status:** ⏳ A criar
**Prioridade:** ALTA (Sistema Financeiro = Audit Obrigatória)

**Problema:**
- Nenhum registro de quem modificou configurações
- Impossível auditar mudanças
- CRÍTICO para sistema financeiro

**Solução:**
Criar tabela `scraper_config_audit` com:
```sql
CREATE TYPE "scraper_config_audit_action_enum" AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'APPLY_PROFILE', 'BULK_TOGGLE', 'TOGGLE'
);

CREATE TABLE scraper_config_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action scraper_config_audit_action_enum NOT NULL,
  userId UUID, -- FK para users (quem fez)
  scraperId VARCHAR(100), -- Qual scraper afetado
  profileId VARCHAR(100), -- Qual perfil (se aplicável)
  changes JSONB NOT NULL, -- {before: {...}, after: {...}}
  reason TEXT, -- Por que foi feito
  createdAt TIMESTAMP DEFAULT now()
);

CREATE INDEX IDX_audit_scraper_created ON scraper_config_audit (scraperId, createdAt);
CREATE INDEX IDX_audit_user_created ON scraper_config_audit (userId, createdAt);
```

**Entity a Criar:**
`backend/src/database/entities/scraper-config-audit.entity.ts`

**Service Integration:**
```typescript
// Adicionar em ScraperConfigService:
private async logAudit(
  action: string,
  scraperId: string | null,
  before: any,
  after: any,
  userId?: string
): Promise<void> {
  await this.auditRepo.save({
    action,
    userId: userId || null,
    scraperId,
    changes: { before, after },
  });
}

// Chamar em TODOS métodos de modificação:
// - update()
// - toggleEnabled()
// - bulkToggle()
// - applyProfile()
// - createProfile()
// - deleteProfile()
```

**Validação Pós-Execução:**
```bash
# 1. Aplicar perfil
curl -X POST http://localhost:3101/api/v1/scraper-config/profiles/{id}/apply

# 2. Verificar audit
SELECT action, "scraperId", changes FROM scraper_config_audit ORDER BY "createdAt" DESC LIMIT 5;

# Deve mostrar: APPLY_PROFILE, null, {before: {...}, after: {...}}
```

---

## ORDEM DE EXECUÇÃO (Quando Docker Estabilizar)

```bash
# 1. Parar backend
docker stop invest_backend

# 2. Executar migrations
cd backend && npm run migration:run

# 3. Verificar migrations aplicadas
docker exec invest_postgres psql -U invest_user -d invest_db -c "SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;"

# Deve mostrar:
# - AlterSuccessRateToDecimal1766680000000 ✅ (já executada)
# - AddUniquePriorityConstraint1766680100000 ⏳ (pendente)
# - CreateScraperConfigAudit... ⏳ (pendente)

# 4. Executar seed (se necessário atualizar dados)
npm run seed

# 5. Rebuild e reiniciar
npm run build
docker restart invest_backend

# 6. Validar
curl http://localhost:3101/api/v1/scraper-config | jq 'length'
# Deve retornar: 42
```

---

## IMPACTO SE NÃO EXECUTAR

### BUG-003 (UNIQUE priority)
- **Severidade:** MÉDIA
- **Risco:** Prioridades duplicadas podem ocorrer
- **Mitigação Temporária:** Validação em Service (já implementada)
- **Workaround:** Sistema funciona, mas sem constraint no banco

### GAP-006 (Audit trail)
- **Severidade:** ALTA (Sistema Financeiro)
- **Risco:** Impossível rastrear quem mudou o quê
- **Mitigação Temporária:** Logs do NestJS (não persistentes)
- **Workaround:** Nenhum (gap crítico)

---

## CHECKLIST PRÉ-EXECUÇÃO

**Antes de executar migrations:**
- [ ] Docker Desktop estável (sem erro 500)
- [ ] Containers todos healthy: `.\system-manager.ps1 status`
- [ ] Backup do banco: `pg_dump invest_db > backup_before_migrations.sql`
- [ ] Git clean: `git status` (sem mudanças pendentes)

**Durante execução:**
- [ ] Monitorar logs: `docker logs invest_backend -f`
- [ ] Se erro: ROLLBACK imediato

**Após execução:**
- [ ] Validar constraints: `\d scraper_configs`
- [ ] Validar audit table: `\d scraper_config_audit`
- [ ] Testar endpoint: `curl http://localhost:3101/api/v1/scraper-config`
- [ ] Commit das migrations executadas

---

## CÓDIGO DAS MIGRATIONS

### AddUniquePriorityConstraint
**Localização:** Já criado em `backend/src/database/migrations/1766680100000-AddUniquePriorityConstraint.ts`

### CreateScraperConfigAudit
**Localização:** A criar

**Código Completo:**
```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateScraperConfigAudit1766680200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar ENUM
    await queryRunner.query(`
      CREATE TYPE "scraper_config_audit_action_enum" AS ENUM (
        'CREATE', 'UPDATE', 'DELETE', 'APPLY_PROFILE', 'BULK_TOGGLE', 'TOGGLE'
      )
    `);

    // Criar tabela
    await queryRunner.createTable(
      new Table({
        name: 'scraper_config_audit',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['CREATE', 'UPDATE', 'DELETE', 'APPLY_PROFILE', 'BULK_TOGGLE', 'TOGGLE'],
            enumName: 'scraper_config_audit_action_enum',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'scraperId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'profileId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'scraper_config_audit',
      new TableIndex({
        name: 'IDX_audit_scraper_created',
        columnNames: ['scraperId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_config_audit',
      new TableIndex({
        name: 'IDX_audit_user_created',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_config_audit',
      new TableIndex({
        name: 'IDX_audit_action_created',
        columnNames: ['action', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scraper_config_audit', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "scraper_config_audit_action_enum"`);
  }
}
```

---

## STATUS ATUAL

**Migrations Executadas:** 3/5
1. ✅ CreateScraperConfigTable (1766676100000)
2. ✅ CreateScraperExecutionProfileTable (1766676200000)
3. ✅ AlterSuccessRateToDecimal (1766680000000)

**Migrations Pendentes:** 2/5
4. ⏳ AddUniquePriorityConstraint (1766680100000) - **Código criado**
5. ⏳ CreateScraperConfigAudit (1766680200000) - **A criar**

---

**Última Atualização:** 2025-12-25
**Responsável:** Claude Sonnet 4.5
**Próxima Ação:** Executar quando `.\system-manager.ps1 health` mostrar PostgreSQL OK
