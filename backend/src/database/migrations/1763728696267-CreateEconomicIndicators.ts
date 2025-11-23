import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEconomicIndicators1763728696267 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create economic_indicators table
    await queryRunner.createTable(
      new Table({
        name: 'economic_indicators',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'indicator_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Type of indicator: SELIC, IPCA, CDI, PIB, IGPM, etc.',
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
            comment: 'Indicator value (e.g., 13.75 for SELIC 13.75% a.a.)',
          },
          {
            name: 'reference_date',
            type: 'date',
            isNullable: false,
            comment: 'Reference date of the indicator (e.g., 2025-11-21)',
          },
          {
            name: 'source',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Data source: BRAPI, BCB (Banco Central), IBGE, etc.',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional metadata (unit, period, notes, etc.)',
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

    // Create unique constraint (indicator_type + reference_date)
    await queryRunner.createIndex(
      'economic_indicators',
      new TableIndex({
        name: 'IDX_INDICATOR_TYPE_REFERENCE_DATE',
        columnNames: ['indicator_type', 'reference_date'],
        isUnique: true,
      }),
    );

    // Create index for faster queries by indicator_type
    await queryRunner.createIndex(
      'economic_indicators',
      new TableIndex({
        name: 'IDX_INDICATOR_TYPE',
        columnNames: ['indicator_type'],
      }),
    );

    // Create index for faster queries by reference_date (desc order)
    await queryRunner.createIndex(
      'economic_indicators',
      new TableIndex({
        name: 'IDX_REFERENCE_DATE',
        columnNames: ['reference_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('economic_indicators', 'IDX_REFERENCE_DATE');
    await queryRunner.dropIndex('economic_indicators', 'IDX_INDICATOR_TYPE');
    await queryRunner.dropIndex('economic_indicators', 'IDX_INDICATOR_TYPE_REFERENCE_DATE');

    // Drop table
    await queryRunner.dropTable('economic_indicators');
  }
}
