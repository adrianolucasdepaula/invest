import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetIndexMemberships1766271773230 implements MigrationInterface {
    name = 'CreateAssetIndexMemberships1766271773230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create asset_index_memberships table
        await queryRunner.query(`CREATE TABLE "asset_index_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "asset_id" uuid NOT NULL, "index_name" character varying(10) NOT NULL, "participation_percent" numeric(10,6) NOT NULL, "theoretical_quantity" bigint, "valid_from" date NOT NULL, "valid_to" date, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_72cdfff88769c0b2044e8f0aac4" UNIQUE ("asset_id", "index_name", "valid_from"), CONSTRAINT "PK_4d29614487add61d1f474cfb5c8" PRIMARY KEY ("id"))`);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_4e5bded58e998e0f7cdfbdb3d7" ON "asset_index_memberships" ("asset_id", "valid_from", "valid_to") `);
        await queryRunner.query(`CREATE INDEX "IDX_4534fb56d75e88b8f1c85d8963" ON "asset_index_memberships" ("index_name") `);

        // Add foreign key constraint
        await queryRunner.query(`ALTER TABLE "asset_index_memberships" ADD CONSTRAINT "FK_85973faf957e7a10c97b8f630f8" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "asset_index_memberships" DROP CONSTRAINT "FK_85973faf957e7a10c97b8f630f8"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_4534fb56d75e88b8f1c85d8963"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e5bded58e998e0f7cdfbdb3d7"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "asset_index_memberships"`);
    }

}
