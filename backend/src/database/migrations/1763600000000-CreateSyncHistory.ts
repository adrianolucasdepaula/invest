import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSyncHistory1763600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sync_history',
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
            comment: 'Asset that was synced',
          },
          {
            name: 'operation_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Type of sync operation (sync-cotahist, sync-brapi, sync-all)',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'success, failed, or partial',
          },
          {
            name: 'records_synced',
            type: 'integer',
            isNullable: true,
            comment: 'Total records successfully synced',
          },
          {
            name: 'years_processed',
            type: 'integer',
            isNullable: true,
            comment: 'Number of years processed (for COTAHIST)',
          },
          {
            name: 'processing_time',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Processing time in seconds',
          },
          {
            name: 'source_details',
            type: 'jsonb',
            isNullable: true,
            comment: 'Detailed source breakdown (cotahist, brapi counts)',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: 'Error message if sync failed',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional metadata (IP, user-agent, etc)',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Foreign key to assets table
    await queryRunner.createForeignKey(
      'sync_history',
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedTableName: 'assets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'sync_history',
      new TableIndex({
        name: 'IDX_sync_history_asset_id',
        columnNames: ['asset_id'],
      }),
    );

    await queryRunner.createIndex(
      'sync_history',
      new TableIndex({
        name: 'IDX_sync_history_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'sync_history',
      new TableIndex({
        name: 'IDX_sync_history_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'sync_history',
      new TableIndex({
        name: 'IDX_sync_history_operation_type',
        columnNames: ['operation_type'],
      }),
    );

    await queryRunner.createIndex(
      'sync_history',
      new TableIndex({
        name: 'IDX_sync_history_asset_created',
        columnNames: ['asset_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('sync_history');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('asset_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('sync_history', foreignKey);
    }

    await queryRunner.dropIndex('sync_history', 'IDX_sync_history_asset_created');
    await queryRunner.dropIndex('sync_history', 'IDX_sync_history_operation_type');
    await queryRunner.dropIndex('sync_history', 'IDX_sync_history_status');
    await queryRunner.dropIndex('sync_history', 'IDX_sync_history_created_at');
    await queryRunner.dropIndex('sync_history', 'IDX_sync_history_asset_id');
    await queryRunner.dropTable('sync_history');
  }
}
