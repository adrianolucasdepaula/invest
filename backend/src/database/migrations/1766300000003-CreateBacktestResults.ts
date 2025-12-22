import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreateBacktestResults
 *
 * Creates the backtest_results table for storing WHEEL strategy backtest results.
 * Includes performance metrics, equity curve, and simulated trades.
 *
 * @created 2025-12-21
 * @phase FASE 101.4 - Wheel Turbinada Backtesting Engine
 */
export class CreateBacktestResults1766300000003 implements MigrationInterface {
  name = 'CreateBacktestResults1766300000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create backtest_results table
    await queryRunner.createTable(
      new Table({
        name: 'backtest_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // Foreign Keys
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'asset_id',
            type: 'uuid',
            isNullable: false,
          },
          // Basic Info
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: false,
          },
          // Configuration (JSONB)
          {
            name: 'config',
            type: 'jsonb',
            isNullable: false,
          },
          // Capital & Returns
          {
            name: 'initial_capital',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'final_capital',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'total_return',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'total_return_percent',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
          },
          // Risk Metrics
          {
            name: 'cagr',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Compound Annual Growth Rate (%)',
          },
          {
            name: 'sharpe_ratio',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Sharpe Ratio (risk-adjusted return)',
          },
          {
            name: 'sortino_ratio',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Sortino Ratio (downside risk-adjusted)',
          },
          {
            name: 'max_drawdown',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Maximum Drawdown (%)',
          },
          {
            name: 'max_drawdown_days',
            type: 'int',
            isNullable: false,
            comment: 'Days in max drawdown',
          },
          {
            name: 'win_rate',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Win Rate (%)',
          },
          {
            name: 'profit_factor',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Profit Factor (gross profit / gross loss)',
          },
          {
            name: 'calmar_ratio',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
            comment: 'Calmar Ratio (CAGR / MaxDD)',
          },
          // Trade Statistics
          {
            name: 'total_trades',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'winning_trades',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'losing_trades',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'exercises',
            type: 'int',
            isNullable: false,
            comment: 'Number of option exercises (PUT or CALL)',
          },
          // Income Breakdown
          {
            name: 'premium_income',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
            comment: 'Total income from option premiums (R$)',
          },
          {
            name: 'dividend_income',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
            comment: 'Total income from dividends/JCP (R$)',
          },
          {
            name: 'lending_income',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
            comment: 'Total income from stock lending (R$)',
          },
          {
            name: 'selic_income',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
            comment: 'Total income from Selic (collateral) (R$)',
          },
          // Detailed Results (JSONB)
          {
            name: 'equity_curve',
            type: 'jsonb',
            isNullable: false,
            comment: 'Daily equity curve for charting',
          },
          {
            name: 'simulated_trades',
            type: 'jsonb',
            isNullable: false,
            comment: 'All simulated trades during backtest',
          },
          // Status & Metadata
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'running'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: 'Error message if status is FAILED',
          },
          {
            name: 'progress',
            type: 'int',
            isNullable: true,
            comment: 'Progress percentage (0-100)',
          },
          {
            name: 'execution_time',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Execution time in seconds',
          },
          // Timestamps
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
        ],
      }),
      true,
    );

    // Foreign Keys
    await queryRunner.createForeignKey(
      'backtest_results',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_backtest_results_user',
      }),
    );

    await queryRunner.createForeignKey(
      'backtest_results',
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedTableName: 'assets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_backtest_results_asset',
      }),
    );

    // Indexes
    await queryRunner.createIndex(
      'backtest_results',
      new TableIndex({
        name: 'IDX_BACKTEST_USER',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'backtest_results',
      new TableIndex({
        name: 'IDX_BACKTEST_ASSET',
        columnNames: ['asset_id'],
      }),
    );

    await queryRunner.createIndex(
      'backtest_results',
      new TableIndex({
        name: 'IDX_BACKTEST_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'backtest_results',
      new TableIndex({
        name: 'IDX_BACKTEST_CREATED',
        columnNames: ['created_at'],
      }),
    );

    // Composite index for user + asset queries
    await queryRunner.createIndex(
      'backtest_results',
      new TableIndex({
        name: 'IDX_BACKTEST_USER_ASSET',
        columnNames: ['user_id', 'asset_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('backtest_results');

    if (table) {
      // Drop indexes
      await queryRunner.dropIndex('backtest_results', 'IDX_BACKTEST_USER_ASSET');
      await queryRunner.dropIndex('backtest_results', 'IDX_BACKTEST_CREATED');
      await queryRunner.dropIndex('backtest_results', 'IDX_BACKTEST_STATUS');
      await queryRunner.dropIndex('backtest_results', 'IDX_BACKTEST_ASSET');
      await queryRunner.dropIndex('backtest_results', 'IDX_BACKTEST_USER');

      // Drop foreign keys
      const fkUser = table.foreignKeys.find((fk) => fk.name === 'FK_backtest_results_user');
      if (fkUser) await queryRunner.dropForeignKey('backtest_results', fkUser);

      const fkAsset = table.foreignKeys.find((fk) => fk.name === 'FK_backtest_results_asset');
      if (fkAsset) await queryRunner.dropForeignKey('backtest_results', fkAsset);
    }

    // Drop table
    await queryRunner.dropTable('backtest_results');
  }
}
