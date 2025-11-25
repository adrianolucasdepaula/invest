import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOptionsLiquidityToAssets1764031742969 implements MigrationInterface {
    name = 'AddOptionsLiquidityToAssets1764031742969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "has_options" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "options_liquidity_metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT '0.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_sources" ALTER COLUMN "reliability_score" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "options_liquidity_metadata"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "has_options"`);
    }

}
