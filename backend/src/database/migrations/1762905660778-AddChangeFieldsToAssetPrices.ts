import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChangeFieldsToAssetPrices1762905660778 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE asset_prices
            ADD COLUMN change DECIMAL(18, 2),
            ADD COLUMN change_percent DECIMAL(10, 4)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE asset_prices
            DROP COLUMN change,
            DROP COLUMN change_percent
        `);
    }

}
