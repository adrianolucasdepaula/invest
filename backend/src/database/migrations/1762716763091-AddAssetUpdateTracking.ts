import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddAssetUpdateTracking1762716763091 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add update tracking columns to assets table
    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'last_updated',
        type: 'timestamp',
        isNullable: true,
        comment: 'Timestamp of last successful update',
      }),
    );

    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'last_update_status',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Status of last update: success, failed, pending, outdated',
      }),
    );

    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'last_update_error',
        type: 'text',
        isNullable: true,
        comment: 'Error message from last failed update',
      }),
    );

    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'update_retry_count',
        type: 'integer',
        default: 0,
        isNullable: false,
        comment: 'Number of retry attempts for failed updates',
      }),
    );

    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'auto_update_enabled',
        type: 'boolean',
        default: true,
        isNullable: false,
        comment: 'Whether automatic updates are enabled for this asset',
      }),
    );

    // 2. Create update_logs table
    await queryRunner.createTable(
      new Table({
        name: 'update_logs',
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
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            comment: 'User who triggered the update (null for automatic updates)',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'running, success, failed, cancelled',
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional data: sources, confidence, dataPoints, etc.',
          },
          {
            name: 'triggered_by',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'manual, cron, retry, batch',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 3. Create foreign key for asset_id
    await queryRunner.createForeignKey(
      'update_logs',
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedTableName: 'assets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_update_logs_asset',
      }),
    );

    // 4. Create foreign key for user_id (if exists)
    await queryRunner.createForeignKey(
      'update_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_update_logs_user',
      }),
    );

    // 5. Create indexes for better query performance
    await queryRunner.createIndex(
      'update_logs',
      new TableIndex({
        name: 'IDX_update_logs_asset_started_at',
        columnNames: ['asset_id', 'started_at'],
      }),
    );

    await queryRunner.createIndex(
      'update_logs',
      new TableIndex({
        name: 'IDX_update_logs_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'update_logs',
      new TableIndex({
        name: 'IDX_update_logs_started_at',
        columnNames: ['started_at'],
      }),
    );

    await queryRunner.createIndex(
      'assets',
      new TableIndex({
        name: 'IDX_assets_last_update_status',
        columnNames: ['last_update_status'],
      }),
    );

    await queryRunner.createIndex(
      'assets',
      new TableIndex({
        name: 'IDX_assets_auto_update_enabled',
        columnNames: ['auto_update_enabled'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes from assets
    await queryRunner.dropIndex('assets', 'IDX_assets_auto_update_enabled');
    await queryRunner.dropIndex('assets', 'IDX_assets_last_update_status');

    // Remove indexes from update_logs
    await queryRunner.dropIndex('update_logs', 'IDX_update_logs_started_at');
    await queryRunner.dropIndex('update_logs', 'IDX_update_logs_status');
    await queryRunner.dropIndex('update_logs', 'IDX_update_logs_asset_started_at');

    // Remove foreign keys
    await queryRunner.dropForeignKey('update_logs', 'FK_update_logs_user');
    await queryRunner.dropForeignKey('update_logs', 'FK_update_logs_asset');

    // Drop update_logs table
    await queryRunner.dropTable('update_logs');

    // Remove columns from assets
    await queryRunner.dropColumn('assets', 'auto_update_enabled');
    await queryRunner.dropColumn('assets', 'update_retry_count');
    await queryRunner.dropColumn('assets', 'last_update_error');
    await queryRunner.dropColumn('assets', 'last_update_status');
    await queryRunner.dropColumn('assets', 'last_updated');
  }
}
