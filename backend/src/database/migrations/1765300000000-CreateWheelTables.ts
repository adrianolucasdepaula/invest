import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateWheelTables1765300000000 implements MigrationInterface {
  name = 'CreateWheelTables1765300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create wheel_phase enum
    await queryRunner.query(`
      CREATE TYPE "wheel_phase_enum" AS ENUM ('selling_puts', 'holding_shares', 'selling_calls')
    `);

    // Create market_trend enum
    await queryRunner.query(`
      CREATE TYPE "market_trend_enum" AS ENUM ('bullish', 'bearish', 'neutral')
    `);

    // Create wheel_strategy_status enum
    await queryRunner.query(`
      CREATE TYPE "wheel_strategy_status_enum" AS ENUM ('active', 'paused', 'closed')
    `);

    // Create wheel_trade_type enum
    await queryRunner.query(`
      CREATE TYPE "wheel_trade_type_enum" AS ENUM ('sell_put', 'sell_call', 'buy_put', 'buy_call', 'exercise_put', 'exercise_call')
    `);

    // Create wheel_trade_status enum
    await queryRunner.query(`
      CREATE TYPE "wheel_trade_status_enum" AS ENUM ('open', 'closed', 'exercised', 'expired')
    `);

    // Create wheel_strategies table
    await queryRunner.createTable(
      new Table({
        name: 'wheel_strategies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'asset_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'wheel_strategy_status_enum',
            default: "'active'",
          },
          {
            name: 'phase',
            type: 'wheel_phase_enum',
            default: "'selling_puts'",
          },
          {
            name: 'market_trend',
            type: 'market_trend_enum',
            default: "'neutral'",
          },
          {
            name: 'notional',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'allocated_capital',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'available_capital',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'shares_held',
            type: 'int',
            default: 0,
          },
          {
            name: 'average_price',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'shares_total_cost',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_premium_received',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_premium_paid',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'realized_pnl',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'unrealized_pnl',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'cash_yield',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'dividends_received',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'total_trades',
            type: 'int',
            default: 0,
          },
          {
            name: 'winning_trades',
            type: 'int',
            default: 0,
          },
          {
            name: 'exercises',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'closed_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create wheel_trades table
    await queryRunner.createTable(
      new Table({
        name: 'wheel_trades',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'strategy_id',
            type: 'uuid',
          },
          {
            name: 'trade_type',
            type: 'wheel_trade_type_enum',
          },
          {
            name: 'status',
            type: 'wheel_trade_status_enum',
            default: "'open'",
          },
          {
            name: 'option_symbol',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'underlying_ticker',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'option_type',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'strike',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
          {
            name: 'expiration',
            type: 'date',
          },
          {
            name: 'days_to_expiration',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'contracts',
            type: 'int',
          },
          {
            name: 'shares_per_contract',
            type: 'int',
            default: 100,
          },
          {
            name: 'entry_price',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
          {
            name: 'exit_price',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'underlying_price_at_entry',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
          {
            name: 'underlying_price_at_exit',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'premium_received',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'premium_paid',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'delta',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'gamma',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'theta',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'vega',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'iv_at_entry',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'iv_rank_at_entry',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'realized_pnl',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'unrealized_pnl',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'commission',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'b3_fees',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'annualized_return',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'distribution_week',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'opened_at',
            type: 'timestamp',
          },
          {
            name: 'closed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for wheel_strategies
    await queryRunner.createIndex(
      'wheel_strategies',
      new TableIndex({
        name: 'IDX_wheel_strategies_user_status',
        columnNames: ['user_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'wheel_strategies',
      new TableIndex({
        name: 'IDX_wheel_strategies_asset_status',
        columnNames: ['asset_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'wheel_strategies',
      new TableIndex({
        name: 'IDX_wheel_strategies_phase',
        columnNames: ['phase'],
      }),
    );

    // Create indexes for wheel_trades
    await queryRunner.createIndex(
      'wheel_trades',
      new TableIndex({
        name: 'IDX_wheel_trades_strategy_status',
        columnNames: ['strategy_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'wheel_trades',
      new TableIndex({
        name: 'IDX_wheel_trades_option_symbol',
        columnNames: ['option_symbol'],
      }),
    );

    await queryRunner.createIndex(
      'wheel_trades',
      new TableIndex({
        name: 'IDX_wheel_trades_expiration',
        columnNames: ['expiration'],
      }),
    );

    await queryRunner.createIndex(
      'wheel_trades',
      new TableIndex({
        name: 'IDX_wheel_trades_type_status',
        columnNames: ['trade_type', 'status'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'wheel_strategies',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'wheel_strategies',
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'wheel_trades',
      new TableForeignKey({
        columnNames: ['strategy_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'wheel_strategies',
        onDelete: 'CASCADE',
      }),
    );

    console.log('FASE 101: Created wheel_strategies and wheel_trades tables with indexes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const wheelTrades = await queryRunner.getTable('wheel_trades');
    if (wheelTrades) {
      const fk = wheelTrades.foreignKeys.find((fk) => fk.columnNames.indexOf('strategy_id') !== -1);
      if (fk) await queryRunner.dropForeignKey('wheel_trades', fk);
    }

    const wheelStrategies = await queryRunner.getTable('wheel_strategies');
    if (wheelStrategies) {
      for (const fk of wheelStrategies.foreignKeys) {
        await queryRunner.dropForeignKey('wheel_strategies', fk);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('wheel_trades', 'IDX_wheel_trades_type_status');
    await queryRunner.dropIndex('wheel_trades', 'IDX_wheel_trades_expiration');
    await queryRunner.dropIndex('wheel_trades', 'IDX_wheel_trades_option_symbol');
    await queryRunner.dropIndex('wheel_trades', 'IDX_wheel_trades_strategy_status');
    await queryRunner.dropIndex('wheel_strategies', 'IDX_wheel_strategies_phase');
    await queryRunner.dropIndex('wheel_strategies', 'IDX_wheel_strategies_asset_status');
    await queryRunner.dropIndex('wheel_strategies', 'IDX_wheel_strategies_user_status');

    // Drop tables
    await queryRunner.dropTable('wheel_trades');
    await queryRunner.dropTable('wheel_strategies');

    // Drop enums
    await queryRunner.query(`DROP TYPE "wheel_trade_status_enum"`);
    await queryRunner.query(`DROP TYPE "wheel_trade_type_enum"`);
    await queryRunner.query(`DROP TYPE "wheel_strategy_status_enum"`);
    await queryRunner.query(`DROP TYPE "market_trend_enum"`);
    await queryRunner.query(`DROP TYPE "wheel_phase_enum"`);

    console.log('FASE 101: Dropped wheel tables and enums');
  }
}
