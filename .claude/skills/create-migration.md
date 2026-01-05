---
description: Cria migração TypeORM seguindo padrões do projeto
---

# Skill: create-migration

**Descrição:** Cria migração TypeORM com UP/DOWN, indexes e documentação

**Frequência de Uso:** 2-5x por semana (novas features com DB)

**Tempo Economizado:** ~15 min → ~3 min (**80% redução**)

---

## Objetivo

Criar **migração TypeORM completa** seguindo padrões do projeto:
- UP e DOWN reversíveis
- Indexes apropriados
- Tipos financeiros corretos (Decimal, não Float)
- Documentação atualizada

---

## Etapas de Execução

### 1. Verificar Contexto

```bash
# Listar migrations existentes
ls backend/src/database/migrations/

# Verificar entities atuais
ls backend/src/database/entities/
```

**Consultar:** `DATABASE_SCHEMA.md` para entender schema atual

---

### 2. Gerar Migration

```bash
cd backend && npm run migration:generate -- -n NomeDaMigration
```

**OU criar migration vazia:**

```bash
cd backend && npm run migration:create -- -n NomeDaMigration
```

---

### 3. Implementar Migration

**Template Padrão:**

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class NomeDaMigration1733XXXXXXXXX implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela
    await queryRunner.createTable(new Table({
      name: 'nome_tabela',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          default: 'uuid_generate_v4()'
        },
        {
          name: 'valor_financeiro',
          type: 'decimal',
          precision: 18,
          scale: 6,
          isNullable: false
        },
        {
          name: 'data_referencia',
          type: 'timestamptz',
          isNullable: false
        },
        {
          name: 'created_at',
          type: 'timestamptz',
          default: 'now()'
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
          default: 'now()'
        },
      ],
    }));

    // Criar indexes
    await queryRunner.createIndex('nome_tabela', new TableIndex({
      name: 'IDX_nome_tabela_campo',
      columnNames: ['campo'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Ordem inversa da criação
    await queryRunner.dropIndex('nome_tabela', 'IDX_nome_tabela_campo');
    await queryRunner.dropTable('nome_tabela');
  }
}
```

---

### 4. Executar Migration

```bash
cd backend && npm run migration:run
```

**Verificar no banco:**

```bash
docker exec invest_postgres psql -U invest -d invest -c "\d+ nome_tabela"
```

---

### 5. Testar Rollback

```bash
cd backend && npm run migration:revert
```

**Verificar que tabela foi removida:**

```bash
docker exec invest_postgres psql -U invest -d invest -c "\dt"
```

**Re-executar migration:**

```bash
cd backend && npm run migration:run
```

---

### 6. Atualizar Documentação

**Editar `DATABASE_SCHEMA.md`:**

```markdown
### nome_tabela

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | uuid_generate_v4() | PK |
| valor_financeiro | decimal(18,6) | NO | - | Valor em R$ |
| data_referencia | timestamptz | NO | - | Data de referência |
| created_at | timestamptz | NO | now() | Criação |
| updated_at | timestamptz | NO | now() | Atualização |

**Indexes:**
- `IDX_nome_tabela_campo` (campo)
```

---

## Regras Críticas

### Tipos Financeiros

```typescript
// ❌ NUNCA usar Float
{ name: 'preco', type: 'float' }

// ✅ SEMPRE usar Decimal
{ name: 'preco', type: 'decimal', precision: 18, scale: 6 }
```

### Datas

```typescript
// ❌ NUNCA usar timestamp sem timezone
{ name: 'data', type: 'timestamp' }

// ✅ SEMPRE usar timestamptz
{ name: 'data', type: 'timestamptz' }
```

### DOWN Method

```typescript
// ❌ NUNCA omitir DOWN
public async down(queryRunner: QueryRunner): Promise<void> {
  // vazio = migration irreversível
}

// ✅ SEMPRE implementar reverso completo
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.dropIndex('tabela', 'IDX_tabela_campo');
  await queryRunner.dropTable('tabela');
}
```

---

## Checklist de Validação

- [ ] Migration tem UP completo
- [ ] Migration tem DOWN completo (reversível)
- [ ] Tipos financeiros usam Decimal
- [ ] Datas usam timestamptz
- [ ] Indexes criados para FKs e campos de busca
- [ ] Migration executou com sucesso
- [ ] Rollback executou com sucesso
- [ ] DATABASE_SCHEMA.md atualizado
- [ ] Entity TypeORM atualizada (se aplicável)

---

## Resumo de Saída

### ✅ Se Migration Criada com Sucesso

```
✅ MIGRATION CRIADA COM SUCESSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Arquivo: 1733XXXXXXXXX-NomeDaMigration.ts
📊 Tabela:  nome_tabela
📋 Colunas: 5
📇 Indexes: 1

✅ UP:       Executado
✅ DOWN:     Testado (revertido e re-executado)
✅ Docs:     DATABASE_SCHEMA.md atualizado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Migration pronta para commit.
```

---

## Invocação

**Via Comando:**
```
Execute skill create-migration para [descrição da mudança]
```

**Exemplo:**
```
Execute skill create-migration para criar tabela de watchlists
```

---

## Referências

- **DATABASE_SCHEMA.md** - Schema completo atual
- **.gemini/context/financial-rules.md** - Regras de tipos financeiros
- **database-migration-expert** - Sub-agent especializado

---

**Versão:** 1.0.0
**Criado:** 2025-12-05
**Mantenedor:** Claude Code
**Última Atualização:** 2025-12-05
