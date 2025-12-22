import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTagAlongToFundamentalData1766300000002 implements MigrationInterface {
  name = 'AddTagAlongToFundamentalData1766300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'fundamental_data',
      new TableColumn({
        name: 'tag_along',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
        comment: 'Tag Along % - protecao minoritarios (0-100)',
      }),
    );

    console.log('FASE 101.4: Added tag_along column to fundamental_data for Wheel Turbinada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('fundamental_data', 'tag_along');

    console.log('FASE 101.4: Dropped tag_along column from fundamental_data');
  }
}
