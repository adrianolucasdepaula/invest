import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateStockLending1766300000001 implements MigrationInterface {
  name = 'CreateStockLending1766300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stock_lending_rates table
    await queryRunner.createTable(
      new Table({
        name: 'stock_lending_rates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'asset_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'taxa_aluguel_ano',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Taxa media anual em % (ex: 5.5000 = 5.5% a.a.)',
          },
          {
            name: 'taxa_aluguel_dia',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
            comment: 'Taxa diaria = taxa_ano / 252',
          },
          {
            name: 'taxa_min',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'taxa_max',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'quantidade_disponivel',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'quantidade_alugada',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'volume_financeiro',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'data_referencia',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'data_coleta',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
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
        ],
      }),
      true,
    );

    // Create Foreign Key
    await queryRunner.createForeignKey(
      'stock_lending_rates',
      new TableForeignKey({
        name: 'FK_stock_lending_asset',
        columnNames: ['asset_id'],
        referencedTableName: 'assets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create Indexes
    await queryRunner.createIndex(
      'stock_lending_rates',
      new TableIndex({
        name: 'IDX_LENDING_ASSET_DATE',
        columnNames: ['asset_id', 'data_referencia'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'stock_lending_rates',
      new TableIndex({
        name: 'IDX_LENDING_ASSET',
        columnNames: ['asset_id'],
      }),
    );

    await queryRunner.createIndex(
      'stock_lending_rates',
      new TableIndex({
        name: 'IDX_LENDING_DATE',
        columnNames: ['data_referencia'],
      }),
    );

    await queryRunner.createIndex(
      'stock_lending_rates',
      new TableIndex({
        name: 'IDX_LENDING_TAXA',
        columnNames: ['taxa_aluguel_ano'],
      }),
    );

    console.log('FASE 101.3: Created stock_lending_rates table with indexes for Wheel Turbinada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('stock_lending_rates', 'IDX_LENDING_TAXA');
    await queryRunner.dropIndex('stock_lending_rates', 'IDX_LENDING_DATE');
    await queryRunner.dropIndex('stock_lending_rates', 'IDX_LENDING_ASSET');
    await queryRunner.dropIndex('stock_lending_rates', 'IDX_LENDING_ASSET_DATE');

    // Drop foreign key
    const table = await queryRunner.getTable('stock_lending_rates');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.name === 'FK_stock_lending_asset');
      if (foreignKey) {
        await queryRunner.dropForeignKey('stock_lending_rates', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('stock_lending_rates');

    console.log('FASE 101.3: Dropped stock_lending_rates table');
  }
}
