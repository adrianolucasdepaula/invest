import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddLpaVpaLiquidezCorrente
 *
 * Adiciona colunas faltantes na tabela fundamental_data:
 * - lpa: Lucro por Ação
 * - vpa: Valor Patrimonial por Ação
 * - liquidez_corrente: Liquidez Corrente
 *
 * Esses campos são coletados pelos scrapers Python mas não estavam
 * sendo salvos no banco por falta das colunas.
 */
export class AddLpaVpaLiquidezCorrente1765100000000 implements MigrationInterface {
  name = 'AddLpaVpaLiquidezCorrente1765100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna lpa (Lucro por Ação)
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      ADD COLUMN IF NOT EXISTS "lpa" DECIMAL(18, 2)
    `);

    // 2. Adicionar coluna vpa (Valor Patrimonial por Ação)
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      ADD COLUMN IF NOT EXISTS "vpa" DECIMAL(18, 2)
    `);

    // 3. Adicionar coluna liquidez_corrente (Liquidez Corrente)
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      ADD COLUMN IF NOT EXISTS "liquidez_corrente" DECIMAL(18, 2)
    `);

    // 4. Adicionar comentários explicativos
    await queryRunner.query(`
      COMMENT ON COLUMN "fundamental_data"."lpa"
      IS 'Lucro por Ação - Lucro líquido dividido pelo número de ações'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "fundamental_data"."vpa"
      IS 'Valor Patrimonial por Ação - Patrimônio líquido dividido pelo número de ações'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "fundamental_data"."liquidez_corrente"
      IS 'Liquidez Corrente - Ativo Circulante / Passivo Circulante'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas
    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      DROP COLUMN IF EXISTS "lpa"
    `);

    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      DROP COLUMN IF EXISTS "vpa"
    `);

    await queryRunner.query(`
      ALTER TABLE "fundamental_data"
      DROP COLUMN IF EXISTS "liquidez_corrente"
    `);
  }
}
