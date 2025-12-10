import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiscrepancyResolutions1733840640548 implements MigrationInterface {
  name = 'CreateDiscrepancyResolutions1733840640548';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar extensão UUID se não existir
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Criar tabela discrepancy_resolutions
    await queryRunner.query(`
      CREATE TABLE "discrepancy_resolutions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "asset_id" uuid NOT NULL,
        "ticker" varchar(10) NOT NULL,
        "field_name" varchar(50) NOT NULL,
        "field_label" varchar(100),
        "old_value" decimal(18,4),
        "new_value" decimal(18,4),
        "selected_source" varchar(50),
        "resolution_method" varchar(20) NOT NULL,
        "resolved_by" varchar(100),
        "notes" text,
        "source_values_snapshot" jsonb,
        "severity" varchar(10),
        "max_deviation" decimal(10,4),
        "fundamental_data_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_discrepancy_resolutions" PRIMARY KEY ("id")
      )
    `);

    // Criar índices para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_discrepancy_resolution_asset_field"
      ON "discrepancy_resolutions" ("asset_id", "field_name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_discrepancy_resolution_created_at"
      ON "discrepancy_resolutions" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_discrepancy_resolution_method"
      ON "discrepancy_resolutions" ("resolution_method")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_discrepancy_resolution_ticker"
      ON "discrepancy_resolutions" ("ticker")
    `);

    // FK para fundamental_data (opcional, SET NULL on delete)
    await queryRunner.query(`
      ALTER TABLE "discrepancy_resolutions"
      ADD CONSTRAINT "FK_discrepancy_resolution_fundamental_data"
      FOREIGN KEY ("fundamental_data_id")
      REFERENCES "fundamental_data"("id")
      ON DELETE SET NULL
    `);

    // Comentário na tabela para documentação
    await queryRunner.query(`
      COMMENT ON TABLE "discrepancy_resolutions" IS
      'FASE 90 - Histórico de resoluções de discrepâncias para auditoria'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "discrepancy_resolutions" DROP CONSTRAINT IF EXISTS "FK_discrepancy_resolution_fundamental_data"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_discrepancy_resolution_ticker"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_discrepancy_resolution_method"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_discrepancy_resolution_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_discrepancy_resolution_asset_field"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "discrepancy_resolutions"`);
  }
}
