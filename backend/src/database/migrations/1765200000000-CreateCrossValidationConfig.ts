import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FASE 93.1 - Create Cross-Validation Configuration Table
 *
 * Cria tabela para armazenar configurações dinâmicas de validação cruzada:
 * - min_sources: Número mínimo de fontes para validação
 * - severity_threshold_high: Threshold para severidade alta (%)
 * - severity_threshold_medium: Threshold para severidade média (%)
 * - source_priority: Ordem de prioridade das fontes
 * - field_tolerances: Tolerâncias por campo
 */
export class CreateCrossValidationConfig1765200000000
  implements MigrationInterface
{
  name = 'CreateCrossValidationConfig1765200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the table
    await queryRunner.query(`
      CREATE TABLE "cross_validation_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "config_key" varchar(50) NOT NULL,
        "value" jsonb NOT NULL,
        "description" text,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cross_validation_config" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cross_validation_config_key" UNIQUE ("config_key")
      )
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_cross_validation_config_key" ON "cross_validation_config" ("config_key")
    `);

    // Seed default values from current hardcoded configuration
    const defaultFieldTolerances = {
      default: 0.01,
      byField: {
        // Valuation - 2% tolerance
        pl: 0.02,
        pvp: 0.02,
        psr: 0.02,
        evEbit: 0.02,
        evEbitda: 0.02,
        // Margins - 0.5% tolerance
        margemBruta: 0.005,
        margemEbit: 0.005,
        margemEbitda: 0.005,
        margemLiquida: 0.005,
        // Profitability - 0.5% tolerance
        roe: 0.005,
        roa: 0.005,
        roic: 0.005,
        // Dividend Yield - 0.5% tolerance
        dividendYield: 0.005,
        // Absolute values - 0.1% tolerance
        receitaLiquida: 0.001,
        lucroLiquido: 0.001,
        patrimonioLiquido: 0.001,
        ativoTotal: 0.001,
        dividaBruta: 0.001,
        dividaLiquida: 0.001,
        // Per Share - 1% tolerance
        lpa: 0.01,
        vpa: 0.01,
        // Liquidity - 0.5% tolerance
        liquidezCorrente: 0.005,
      },
    };

    const sourcePriority = [
      'fundamentus',
      'statusinvest',
      'investidor10',
      'brapi',
      'investsite',
      'fundamentei',
    ];

    await queryRunner.query(`
      INSERT INTO "cross_validation_config" ("config_key", "value", "description") VALUES
      ('min_sources', '3', 'Número mínimo de fontes para validação. Se menos fontes retornarem dados, usa fallback por prioridade.'),
      ('severity_threshold_high', '20', 'Desvio percentual para classificar discrepância como ALTA severidade.'),
      ('severity_threshold_medium', '10', 'Desvio percentual para classificar discrepância como MÉDIA severidade. Abaixo disso é BAIXA.'),
      ('source_priority', '${JSON.stringify(sourcePriority)}', 'Ordem de prioridade das fontes para fallback quando não há consenso.'),
      ('field_tolerances', '${JSON.stringify(defaultFieldTolerances).replace(/'/g, "''")}', 'Tolerâncias percentuais por campo para determinar se valores são considerados iguais.')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_cross_validation_config_key"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "cross_validation_config"`);
  }
}
