import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDividends1766300000000 implements MigrationInterface {
  name = 'CreateDividends1766300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create ENUM types
    await queryRunner.query(`
      CREATE TYPE "dividend_type_enum" AS ENUM(
        'dividendo', 'jcp', 'bonus', 'rendimento', 'fracao', 'subscricao'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "dividend_status_enum" AS ENUM(
        'anunciado', 'pago', 'projetado'
      )
    `);

    // 2. Create dividends table
    await queryRunner.createTable(
      new Table({
        name: 'dividends',
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
            name: 'tipo',
            type: 'dividend_type_enum',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'dividend_status_enum',
            isNullable: false,
            default: "'anunciado'",
          },
          {
            name: 'valor_bruto',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: false,
          },
          {
            name: 'valor_liquido',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'imposto_retido',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
            default: 0,
          },
          {
            name: 'data_com',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'data_ex',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'data_aprovacao',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'data_pagamento',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'data_base',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'frequencia',
            type: 'varchar',
            length: '20',
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

    // 3. Create Foreign Key
    await queryRunner.createForeignKey(
      'dividends',
      new TableForeignKey({
        name: 'FK_dividends_asset',
        columnNames: ['asset_id'],
        referencedTableName: 'assets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 4. Create Indexes
    await queryRunner.createIndex(
      'dividends',
      new TableIndex({
        name: 'IDX_DIVIDEND_ASSET_DATA_EX',
        columnNames: ['asset_id', 'data_ex'],
      }),
    );

    await queryRunner.createIndex(
      'dividends',
      new TableIndex({
        name: 'IDX_DIVIDEND_ASSET_DATA_PAGAMENTO',
        columnNames: ['asset_id', 'data_pagamento'],
      }),
    );

    await queryRunner.createIndex(
      'dividends',
      new TableIndex({
        name: 'IDX_DIVIDEND_TIPO',
        columnNames: ['tipo'],
      }),
    );

    await queryRunner.createIndex(
      'dividends',
      new TableIndex({
        name: 'IDX_DIVIDEND_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'dividends',
      new TableIndex({
        name: 'IDX_DIVIDEND_DATA_EX',
        columnNames: ['data_ex'],
      }),
    );

    // 5. Unique constraint (asset + data_ex + tipo to avoid duplicates)
    await queryRunner.createIndex(
      'dividends',
      new TableIndex({
        name: 'UQ_DIVIDEND_ASSET_DATE_TIPO',
        columnNames: ['asset_id', 'data_ex', 'tipo'],
        isUnique: true,
      }),
    );

    console.log('FASE 101.2: Created dividends table with indexes for Wheel Turbinada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('dividends', 'UQ_DIVIDEND_ASSET_DATE_TIPO');
    await queryRunner.dropIndex('dividends', 'IDX_DIVIDEND_DATA_EX');
    await queryRunner.dropIndex('dividends', 'IDX_DIVIDEND_STATUS');
    await queryRunner.dropIndex('dividends', 'IDX_DIVIDEND_TIPO');
    await queryRunner.dropIndex('dividends', 'IDX_DIVIDEND_ASSET_DATA_PAGAMENTO');
    await queryRunner.dropIndex('dividends', 'IDX_DIVIDEND_ASSET_DATA_EX');

    // Drop foreign key
    const table = await queryRunner.getTable('dividends');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.name === 'FK_dividends_asset');
      if (foreignKey) {
        await queryRunner.dropForeignKey('dividends', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('dividends');

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "dividend_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dividend_type_enum"`);

    console.log('FASE 101.2: Dropped dividends table and enums');
  }
}
