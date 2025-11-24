import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Decimal } from "decimal.js";

/**
 * Example Entity
 *
 * Demonstrates TypeORM entity following project conventions
 *
 * @see .gemini/context/conventions.md (Naming, Structure)
 * @see .gemini/context/financial-rules.md (Decimal, Precision)
 */
@Entity("example_table") // Snake_case for table name
@Index(["ticker", "date"], { unique: true }) // Compound index
export class ExampleEntity {
  //============================================================================
  // PRIMARY KEY
  //============================================================================

  @PrimaryGeneratedColumn("increment")
  id: number;

  //============================================================================
  // BUSINESS FIELDS
  //============================================================================

  /**
   * Stock ticker symbol
   * @example 'PETR4',' 'VALE3', 'ITUB4'
   */
  @Column({ type: "varchar", length: 10 })
  @Index() // Index for frequent queries
  ticker: string;

  /**
   * Value in BRL (Brazilian Real)
   *
   * CRITICAL: Use Decimal (NOT Float) for monetary values
   * Precision: DECIMAL(10,2) - 2 decimal places
   *
   * @see .gemini/context/financial-rules.md Section 1
   */
  @Column({ type: "decimal", precision: 10, scale: 2 })
  valueBrl: string; // Stored as string, converted to Decimal in getter

  /**
   * Percentage value
   *
   * Precision: DECIMAL(5,4) - 4 decimal places
   * Examples: 5.6789%, 12.3456%, -3.4567%
   *
   * @see .gemini/context/financial-rules.md Section 1
   */
  @Column({ type: "decimal", precision: 5, scale: 4, nullable: true })
  percentageValue?: string;

  /**
   * Date field
   *
   * CRITICAL: Timezone America/Sao_Paulo (Horário de Brasília)
   *
   * @see .gemini/context/financial-rules.md Section 4
   */
  @Column({ type: "date" })
  @Index() // Index for date range queries
  date: Date;

  /**
   * Optional text field
   * Max length: 255 chars (use TEXT for > 255)
   */
  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string;

  /**
   * Boolean field with default
   */
  @Column({ type: "boolean", default: false })
  isActive: boolean;

  //============================================================================
  // RELATIONSHIPS
  //============================================================================

  /**
   * Many-to-One relationship example
   *
   * Convention: Use @ManyToOne + @JoinColumn
   * Foreign key: camelCase + Id (e.g., relatedEntityId)
   */
  @ManyToOne(() => RelatedEntity, { nullable: true })
  @JoinColumn({ name: "related_entity_id" }) // Snake_case for FK column
  relatedEntity?: RelatedEntity;

  @Column({ type: "integer", nullable: true })
  relatedEntityId?: number;

  //============================================================================
  // TIMESTAMPS (AUTOMATIC)
  //============================================================================

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;

  //============================================================================
  // GETTERS (Decimal Conversion)
  //============================================================================

  /**
   * Get valueBrl as Decimal (for calculations)
   *
   * ALWAYS use Decimal for monetary calculations
   * NEVER use parseFloat() or Number()
   */
  getValueBrlDecimal(): Decimal {
    return new Decimal(this.valueBrl);
  }

  /**
   * Get percentage as Decimal
   */
  getPercentageDecimal(): Decimal | null {
    return this.percentageValue ? new Decimal(this.percentageValue) : null;
  }

  //============================================================================
  // SETTERS (Decimal Validation)
  //============================================================================

  /**
   * Set valueBrl from Decimal
   * Automatically rounds to 2 decimal places (ROUND_HALF_UP)
   */
  setValueBrlDecimal(value: Decimal): void {
    this.valueBrl = value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
  }

  /**
   * Set percentage from Decimal
   * Automatically rounds to 4 decimal places (ROUND_HALF_UP)
   */
  setPercentageDecimal(value: Decimal): void {
    this.percentageValue = value
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
      .toString();
  }
}

/**
 * Related entity example (for relationship demo)
 */
@Entity("related_entity")
class RelatedEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;
}

//=============================================================================
// MIGRATION EXAMPLE
//=============================================================================

/**
 * Migration to create example_table
 *
 * File: backend/src/database/migrations/XXXXXXXXXX-CreateExampleTable.ts
 *
 * Run: npm run migration:run
 */
/*
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateExampleTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'example_table',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'ticker',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'value_brl',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'percentage_value',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'related_entity_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Compound unique index
    await queryRunner.createIndex(
      'example_table',
      new TableIndex({
        name: 'IDX_example_ticker_date',
        columnNames: ['ticker', 'date'],
        isUnique: true,
      }),
    );

    // Single column indexes
    await queryRunner.createIndex(
      'example_table',
      new TableIndex({
        name: 'IDX_example_ticker',
        columnNames: ['ticker'],
      }),
    );

    await queryRunner.createIndex(
      'example_table',
      new TableIndex({
        name: 'IDX_example_date',
        columnNames: ['date'],
      }),
    );

    // Foreign key
    await queryRunner.createForeignKey(
      'example_table',
      new TableForeignKey({
        columnNames: ['related_entity_id'],
        referencedTableName: 'related_entity',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('example_table');
  }
}
*/

//=============================================================================
// USAGE EXAMPLE
//=============================================================================

/**
 * Example usage in service
 */
/*
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ExampleEntity } from './example.entity';
import { Decimal } from 'decimal.js';

export class ExampleService {
  constructor(
    @InjectRepository(ExampleEntity)
    private readonly repo: Repository<ExampleEntity>,
  ) {}

  async createExample(): Promise<ExampleEntity> {
    const entity = new ExampleEntity();
    entity.ticker = 'PETR4';
    entity.date = new Date('2025-11-24');
    
    // ✅ CORRECT: Use Decimal
    entity.setValueBrlDecimal(new Decimal('123.45'));
    entity.setPercentageDecimal(new Decimal('5.6789'));
    
    // ❌ WRONG: Don't use Float
    // entity.valueBrl = (123.45).toString(); // Precision loss!
    
    return await this.repo.save(entity);
  }

  async calculateTotal(ticker: string): Promise<Decimal> {
    const entities = await this.repo.find({ where: { ticker } });
    
    // ✅ CORRECT: Decimal calculations
    return entities.reduce(
      (sum, e) => sum.plus(e.getValueBrlDecimal()),
      new Decimal(0),
    );
    
    // ❌ WRONG: Float calculations
    // return entities.reduce((sum, e) => sum + parseFloat(e.valueBrl), 0);
  }
}
*/
