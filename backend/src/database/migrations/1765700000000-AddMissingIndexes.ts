import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Missing Indexes
 *
 * FASE 133 - Database Performance Optimization
 *
 * Adds indexes to improve query performance for:
 * - Users table: email, isActive, isEmailVerified, createdAt
 * - CrossValidationConfig table: isActive, configKey+isActive
 * - PortfolioPositions table: portfolioId+firstBuyDate
 */
export class AddMissingIndexes1765700000000 implements MigrationInterface {
  name = 'AddMissingIndexes1765700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_is_active" ON "users" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_is_email_verified" ON "users" ("is_email_verified")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("created_at")
    `);

    // CrossValidationConfig indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cross_validation_config_is_active" ON "cross_validation_config" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cross_validation_config_key_active" ON "cross_validation_config" ("config_key", "is_active")
    `);

    // PortfolioPositions indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_portfolio_positions_portfolio_first_buy" ON "portfolio_positions" ("portfolio_id", "first_buy_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Users indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_email_verified"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_created_at"`);

    // CrossValidationConfig indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cross_validation_config_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cross_validation_config_key_active"`);

    // PortfolioPositions indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portfolio_positions_portfolio_first_buy"`);
  }
}
