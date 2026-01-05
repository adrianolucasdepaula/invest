# Database Transactions Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Padrões de transações TypeORM + PostgreSQL

---

## Overview

Transações garantem **atomicidade** em operações que modificam múltiplas tabelas.

**Quando usar transações:**
- Múltiplas inserções/atualizações relacionadas
- Operações financeiras (Portfolio, Orders)
- Rollback automático em caso de erro

---

## TypeORM Transaction Patterns

### 1. QueryRunner (Controle Manual)

**Mais flexível - recomendado para operações complexas:**

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PortfolioService {
  constructor(private dataSource: DataSource) {}

  async createPortfolioWithPositions(
    createPortfolioDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    const queryRunner = this.dataSource.createQueryRunner();

    // Conectar ao banco
    await queryRunner.connect();

    // Iniciar transação
    await queryRunner.startTransaction();

    try {
      // Criar portfolio
      const portfolio = queryRunner.manager.create(Portfolio, {
        name: createPortfolioDto.name,
        userId: createPortfolioDto.userId,
      });
      await queryRunner.manager.save(portfolio);

      // Criar posições
      const positions = createPortfolioDto.positions.map((pos) =>
        queryRunner.manager.create(PortfolioPosition, {
          ...pos,
          portfolioId: portfolio.id,
        }),
      );
      await queryRunner.manager.save(positions);

      // Commit se tudo OK
      await queryRunner.commitTransaction();

      return portfolio;
    } catch (err) {
      // Rollback em caso de erro
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Liberar conexão
      await queryRunner.release();
    }
  }
}
```

### 2. Transaction Decorator (Mais Simples)

**Simples e direto - para casos básicos:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionRepository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  @Transaction()
  async createOrder(
    createOrderDto: CreateOrderDto,
    @TransactionRepository(Order) orderRepo?: Repository<Order>,
    @TransactionRepository(PortfolioPosition) positionRepo?: Repository<PortfolioPosition>,
  ) {
    // Criar ordem
    const order = orderRepo.create(createOrderDto);
    await orderRepo.save(order);

    // Atualizar posição
    const position = await positionRepo.findOne({
      where: { assetId: order.assetId },
    });
    position.quantity += order.quantity;
    await positionRepo.save(position);

    return order;
  }
}
```

**⚠️ Nota:** `@Transaction()` decorator foi deprecado no TypeORM 0.3.x. Prefira QueryRunner.

### 3. DataSource Transaction (Callback)

**Alternativa moderna:**

```typescript
await this.dataSource.transaction(async (manager) => {
  // Todas operações dentro do manager são transacionais
  const portfolio = manager.create(Portfolio, createPortfolioDto);
  await manager.save(portfolio);

  const positions = manager.create(PortfolioPosition, positionsData);
  await manager.save(positions);

  return portfolio;
});
```

---

## Isolation Levels

### PostgreSQL Isolation Levels

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|------------|---------------------|--------------|
| **READ UNCOMMITTED** | Sim | Sim | Sim |
| **READ COMMITTED** (default) | Não | Sim | Sim |
| **REPEATABLE READ** | Não | Não | Sim |
| **SERIALIZABLE** | Não | Não | Não |

**PostgreSQL implementa apenas 3 níveis:**
- READ UNCOMMITTED → comporta-se como READ COMMITTED
- READ COMMITTED
- REPEATABLE READ
- SERIALIZABLE

### Especificar Isolation Level

```typescript
await queryRunner.startTransaction('REPEATABLE READ');

// Ou usando DataSource
await this.dataSource.transaction(
  'REPEATABLE READ',
  async (manager) => {
    // ...
  },
);
```

### Quando usar cada nível

| Use Case | Isolation Level | Justificativa |
|----------|----------------|---------------|
| **Leitura de relatórios** | READ COMMITTED | Padrão, boa performance |
| **Transferências financeiras** | SERIALIZABLE | Garantir consistência absoluta |
| **Análise de portfolio** | REPEATABLE READ | Snapshot consistente |
| **Import em batch** | READ COMMITTED | Performance + tolerância a dirty reads |

---

## Deadlock Handling

### Identificar Deadlocks

**Error code PostgreSQL:** `40P01`

```typescript
try {
  await queryRunner.commitTransaction();
} catch (error) {
  if (error.code === '40P01') {
    this.logger.warn('Deadlock detected, retrying...');
    // Retry logic
  }
  await queryRunner.rollbackTransaction();
  throw error;
}
```

### Retry com Backoff Exponencial

```typescript
async executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isDeadlock = error.code === '40P01' || error.code === '40001'; // Serialization failure

      if (!isDeadlock || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
      this.logger.warn(`Deadlock on attempt ${attempt + 1}, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Uso
await this.executeWithRetry(() =>
  this.createPortfolioWithPositions(dto),
);
```

### Prevenir Deadlocks

**1. Ordem consistente de locks:**

```typescript
// ✅ CORRETO: Sempre ordenar por ID
const assetIds = [3, 1, 2].sort((a, b) => a - b); // [1, 2, 3]
for (const id of assetIds) {
  await queryRunner.manager.findOne(Asset, {
    where: { id },
    lock: { mode: 'pessimistic_write' },
  });
}
```

```typescript
// ❌ ERRADO: Ordem aleatória
for (const id of [3, 1, 2]) {
  await queryRunner.manager.findOne(Asset, { where: { id } });
}
```

**2. Usar `FOR UPDATE SKIP LOCKED`:**

```typescript
const asset = await queryRunner.manager
  .createQueryBuilder(Asset, 'asset')
  .where('asset.id = :id', { id })
  .setLock('pessimistic_write_or_fail') // Skip se locked
  .getOne();

if (!asset) {
  throw new ConflictException('Asset is locked by another transaction');
}
```

**3. Timeout de transação:**

```typescript
await queryRunner.query(`SET LOCAL statement_timeout = '5s'`);
```

---

## Nested Transactions (Savepoints)

**PostgreSQL suporta savepoints:**

```typescript
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(portfolio);

  // Savepoint antes de operação arriscada
  await queryRunner.manager.query('SAVEPOINT before_positions');

  try {
    await queryRunner.manager.save(positions);
  } catch (err) {
    // Rollback parcial para savepoint
    await queryRunner.manager.query('ROLLBACK TO SAVEPOINT before_positions');
    this.logger.warn('Failed to save positions, continuing without them');
  }

  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

---

## Performance Best Practices

### ✅ DO

1. **Manter transações curtas** (< 1s ideal)
2. **Evitar I/O dentro de transações** (HTTP calls, file reads)
3. **Usar batch inserts:**

```typescript
// ✅ CORRETO: Batch insert
await manager.save(Asset, assetArray); // 1 query

// ❌ ERRADO: Loop de saves
for (const asset of assetArray) {
  await manager.save(asset); // N queries
}
```

4. **Usar `upsert` quando apropriado:**

```typescript
await manager.upsert(
  Asset,
  [{ ticker: 'PETR4', currentPrice: 38.5 }],
  ['ticker'], // Conflict target
);
```

5. **Índices apropriados** (evitar table scans em transações)

### ❌ DON'T

1. **Não fazer HTTP calls dentro de transações:**

```typescript
// ❌ ERRADO
await queryRunner.startTransaction();
const data = await axios.get('https://api.com/data'); // I/O bloqueante!
await queryRunner.manager.save(data);
await queryRunner.commitTransaction();
```

```typescript
// ✅ CORRETO
const data = await axios.get('https://api.com/data'); // Fetch primeiro
await queryRunner.startTransaction();
await queryRunner.manager.save(data);
await queryRunner.commitTransaction();
```

2. **Não usar transações para read-only** (desnecessário):

```typescript
// ❌ ERRADO: Transação para leitura
await this.dataSource.transaction(async (manager) => {
  return manager.find(Asset);
});

// ✅ CORRETO: Leitura direta
return this.assetRepository.find();
```

3. **Não esquecer `release()`** com QueryRunner:

```typescript
// ❌ ERRADO: Connection leak
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();
// ... sem release()
```

---

## Examples

### Example 1: Transferência de Fundos

```typescript
async transferFunds(
  fromPortfolioId: number,
  toPortfolioId: number,
  amount: Decimal,
): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction('SERIALIZABLE'); // Máxima consistência

  try {
    // Lock portfolios
    const fromPortfolio = await queryRunner.manager.findOne(Portfolio, {
      where: { id: fromPortfolioId },
      lock: { mode: 'pessimistic_write' },
    });

    const toPortfolio = await queryRunner.manager.findOne(Portfolio, {
      where: { id: toPortfolioId },
      lock: { mode: 'pessimistic_write' },
    });

    // Validar saldo
    if (fromPortfolio.balance.lessThan(amount)) {
      throw new BadRequestException('Saldo insuficiente');
    }

    // Debitar
    fromPortfolio.balance = fromPortfolio.balance.minus(amount);
    await queryRunner.manager.save(fromPortfolio);

    // Creditar
    toPortfolio.balance = toPortfolio.balance.plus(amount);
    await queryRunner.manager.save(toPortfolio);

    // Registrar transação
    const transaction = queryRunner.manager.create(Transaction, {
      fromPortfolioId,
      toPortfolioId,
      amount,
      type: 'TRANSFER',
    });
    await queryRunner.manager.save(transaction);

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

### Example 2: Bulk Import com Rollback Parcial

```typescript
async bulkImportAssets(
  assets: CreateAssetDto[],
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();

  for (const assetDto of assets) {
    await queryRunner.startTransaction();

    try {
      const asset = queryRunner.manager.create(Asset, assetDto);
      await queryRunner.manager.save(asset);

      await queryRunner.commitTransaction();
      success++;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to import ${assetDto.ticker}:`, err.message);
      failed++;
    }
  }

  await queryRunner.release();
  return { success, failed };
}
```

---

## Fontes

- [TypeORM Transactions - Darragh O Riordan](https://www.darraghoriordan.com/2022/06/13/persistence-6-typeorm-postgres-transactions)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [TypeORM Advanced Topics - Transactions](https://typeorm.io/docs/advanced-topics/transactions/)
- [Solve Database Concurrency Issues with TypeORM](https://hackernoon.com/database-concurrencies-with-typeorm-6b1631k8)
