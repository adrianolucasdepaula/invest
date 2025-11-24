import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decimal } from 'decimal.js';
import { ExampleEntity } from './example.entity';

/**
 * Example Service
 * 
 * Demonstrates NestJS service following project conventions
 * 
 * @see .gemini/context/conventions.md (Naming, Error Handling)
 * @see .gemini/context/financial-rules.md (Decimal, Cross-Validation)
 */
@Injectable()
export class ExampleService {
  //============================================================================
  // DEPENDENCIES
  //============================================================================
  
  private readonly logger = new Logger(ExampleService.name);

  constructor(
    @InjectRepository(ExampleEntity)
    private readonly exampleRepo: Repository<ExampleEntity>,
  ) {}

  //============================================================================
  // CREATE
  //============================================================================
  
  /**
   * Create new entity with financial data
   * 
   * @param ticker Stock ticker symbol
   * @param valueBrl Value in BRL (as Decimal)
   * @param date Date (timezone: America/Sao_Paulo)
   * 
   * @returns Created entity
   * 
   * @example
   * const entity = await service.create('PETR4', new Decimal('123.45'), new Date());
   */
  async create(
    ticker: string,
    valueBrl: Decimal,
    date: Date,
  ): Promise<ExampleEntity> {
    this.logger.log(`Creating entity: ${ticker}, ${valueBrl}, ${date}`);

    // Validate inputs
    if (!ticker || ticker.length === 0) {
      throw new Error('Ticker is required');
    }

    if (valueBrl.isNegative()) {
      throw new Error('Value cannot be negative');
    }

    // Create entity
    const entity = new ExampleEntity();
    entity.ticker = ticker.toUpperCase();  // Normalize ticker
    entity.setValueBrlDecimal(valueBrl);  // Use setter (automatic rounding)
    entity.date = date;
    entity.isActive = true;

    // Save
    const saved = await this.exampleRepo.save(entity);
    this.logger.log(`Created entity id: ${saved.id}`);

    return saved;
  }

  //============================================================================
  // READ
  //============================================================================
  
  /**
   * Find entity by ID
   * 
   * @param id Entity ID
   * @returns Entity
   * @throws NotFoundException if not found
   */
  async findById(id: number): Promise<ExampleEntity> {
    const entity = await this.exampleRepo.findOne({
      where: { id },
      relations: ['relatedEntity'],  // Load relationships
    });

    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    return entity;
  }

  /**
   * Find all entities by ticker
   * 
   * @param ticker Stock ticker symbol
   * @returns Array of entities
   */
  async findByTicker(ticker: string): Promise<ExampleEntity[]> {
    return await this.exampleRepo.find({
      where: { ticker: ticker.toUpperCase() },
      order: { date: 'DESC' },  // Most recent first
    });
  }

  /**
   * Find entities in date range
   * 
   * @param startDate Start date (inclusive)
   * @param endDate End date (inclusive)
   * @returns Array of entities
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<ExampleEntity[]> {
    return await this.exampleRepo
      .createQueryBuilder('e')
      .where('e.date >= :startDate', { startDate })
      .andWhere('e.date <= :endDate', { endDate })
      .orderBy('e.date', 'ASC')
      .getMany();
  }

  //============================================================================
  // UPDATE
  //============================================================================
  
  /**
   * Update entity value
   * 
   * @param id Entity ID
   * @param newValue New value in BRL
   * @returns Updated entity
   */
  async updateValue(id: number, newValue: Decimal): Promise<ExampleEntity> {
    const entity = await this.findById(id);

    this.logger.log(
      `Updating entity ${id}: ${entity.valueBrl} → ${newValue.toString()}`,
    );

    entity.setValueBrlDecimal(newValue);
    return await this.exampleRepo.save(entity);
  }

  //============================================================================
  // DELETE
  //============================================================================
  
  /**
   * Soft delete (set isActive = false)
   * 
   * Preferred over hard delete for audit trail
   */
  async softDelete(id: number): Promise<void> {
    const entity = await this.findById(id);
    entity.isActive = false;
    await this.exampleRepo.save(entity);
    this.logger.log(`Soft deleted entity ${id}`);
  }

  /**
   * Hard delete (remove from database)
   * 
   * Use with caution!
   */
  async hardDelete(id: number): Promise<void> {
    const result = await this.exampleRepo.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    this.logger.warn(`HARD DELETED entity ${id}`);
  }

  //============================================================================
  // BUSINESS LOGIC (Decimal Calculations)
  //============================================================================
  
  /**
   * Calculate total value for ticker
   * 
   * CRITICAL: Use Decimal for all calculations
   * 
   * @param ticker Stock ticker symbol
   * @returns Total value (Decimal)
   */
  async calculateTotal(ticker: string): Promise<Decimal> {
    const entities = await this.findByTicker(ticker);

    // ✅ CORRECT: Decimal.reduce
    const total = entities.reduce(
      (sum, entity) => sum.plus(entity.getValueBrlDecimal()),
      new Decimal(0),
    );

    this.logger.log(`Total for ${ticker}: R$ ${total.toFixed(2)}`);

    return total;
  }

  /**
   * Calculate average value for ticker
   * 
   * @param ticker Stock ticker symbol
   * @returns Average value (Decimal)
   */
  async calculateAverage(ticker: string): Promise<Decimal> {
    const entities = await this.findByTicker(ticker);

    if (entities.length === 0) {
      return new Decimal(0);
    }

    const total = await this.calculateTotal(ticker);
    const average = total.dividedBy(entities.length);

    // Round to 2 decimal places (BRL precision)
    return average.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculate percentage change between two values
   * 
   * @param oldValue Old value
   * @param newValue New value
   * @returns Percentage change (Decimal, 4 decimal places)
   * 
   * @example
   * calculatePercentageChange(new Decimal(100), new Decimal(110))
   * // Returns: new Decimal('10.0000') (10.0000%)
   */
  calculatePercentageChange(oldValue: Decimal, newValue: Decimal): Decimal {
    if (oldValue.isZero()) {
      throw new Error('Cannot calculate percentage change from zero');
    }

    // Formula: ((new - old) / old) * 100
    const percentage = newValue
      .minus(oldValue)
      .dividedBy(oldValue)
      .times(100);

    // Round to 4 decimal places (percentage precision)
    return percentage.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  }

  //==========================================================================
  // CROSS-VALIDATION (Multiple Sources)
  //==========================================================================
  
  /**
   * Cross-validate data from multiple sources
   * 
   * CRITICAL: Minimum 3 sources required
   * Outlier detection: threshold 10%
   * 
   * @param sources Array of source values
   * @returns Validated value + confidence score
   * 
   * @see .gemini/context/financial-rules.md Section 5
   */
  crossValidate(
    sources: Array<{ source: string; value: Decimal }>,
  ): { value: Decimal; confidence: number } {
    if (sources.length < 3) {
      throw new Error('Cross-validation requires minimum 3 sources');
    }

    // Calculate mean
    const sum = sources.reduce((acc, s) => acc.plus(s.value), new Decimal(0));
    const mean = sum.dividedBy(sources.length);

    // Outlier detection (threshold 10%)
    const validSources = sources.filter((s) => {
      const deviation = s.value.minus(mean).abs().dividedBy(mean);
      return deviation.lessThanOrEqualTo(0.1); // <= 10%
    });

    if (validSources.length < 3) {
      throw new Error('Insufficient valid sources after outlier removal');
    }

    // Recalculate with valid sources only
    const validSum = validSources.reduce(
      (acc, s) => acc.plus(s.value),
      new Decimal(0),
    );
    const validMean = validSum.dividedBy(validSources.length);

    // Confidence score (0.0 - 1.0)
    const confidence = validSources.length / sources.length;

    this.logger.log(
      `Cross-validation: ${validSources.length}/${sources.length} sources valid, ` +
        `confidence: ${(confidence * 100).toFixed(1)}%`,
    );

    return {
      value: validMean.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      confidence,
    };
  }

  //============================================================================
  // BATCH OPERATIONS
  //============================================================================
  
  /**
   * Bulk create entities
   * 
   * Uses transaction for atomicity
   * 
   * @param entities Array of entity data
   * @returns Array of created entities
   */
  async bulkCreate(
    entities: Array<{ ticker: string; valueBrl: Decimal; date: Date }>,
  ): Promise<ExampleEntity[]> {
    this.logger.log(`Bulk creating ${entities.length} entities...`);

    // Use transaction
    return await this.exampleRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const created: ExampleEntity[] = [];

        for (const data of entities) {
          const entity = new ExampleEntity();
          entity.ticker = data.ticker.toUpperCase();
          entity.setValueBrlDecimal(data.valueBrl);
          entity.date = data.date;
          entity.isActive = true;

          const saved =
            await transactionalEntityManager.save(ExampleEntity, entity);
          created.push(saved);
        }

        return created;
      },
    );
  }

  //============================================================================
  // ERROR HANDLING EXAMPLE
  //============================================================================
  
  /**
   * Example of proper error handling
   * 
   * @see .gemini/context/conventions.md (Error Handling)
   */
  async dangerousOperation(id: number): Promise<void> {
    try {
      const entity = await this.findById(id);
      
      // Do something dangerous
      if (entity.valueBrl === '0') {
        throw new Error('Division by zero');
      }

      // ...
    } catch (error) {
      this.logger.error(`Error in dangerousOperation: ${error.message}`, error.stack);
      
      // Re-throw appropriate HTTP exception
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Failed to perform operation: ${error.message}`);
    }
  }
}

//=============================================================================
// DTO EXAMPLE
//=============================================================================

/**
 * Create DTO example
 * 
 * File: example.dto.ts
 */
/*
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExampleDto {
  @ApiProperty({ example: 'PETR4', description: 'Stock ticker symbol' })
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @ApiProperty({ example: '123.45', description: 'Value in BRL' })
  @IsString()
  @IsNotEmpty()
  valueBrl: string;  // String for Decimal precision

  @ApiProperty({ example: '2025-11-24', description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Example description' })
  @IsString()
  @IsOptional()
  description?: string;
}
*/

//=============================================================================
// CONTROLLER EXAMPLE
//=============================================================================

/**
 * Controller example
 * 
 * File: example.controller.ts
 */
/*
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExampleService } from './example.service';
import { CreateExampleDto } from './dto/example.dto';
import { Decimal } from 'decimal.js';

@ApiTags('Examples')
@Controller('api/v1/examples')
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Post()
  @ApiOperation({ summary: 'Create example entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  async create(@Body() dto: CreateExampleDto) {
    const entity = await this.service.create(
      dto.ticker,
      new Decimal(dto.valueBrl),
      new Date(dto.date),
    );

    return {
      id: entity.id,
      ticker: entity.ticker,
      valueBrl: entity.valueBrl,
      date: entity.date,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  async findOne(@Param('id') id: string) {
    return await this.service.findById(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete entity' })
  async delete(@Param('id') id: string) {
    await this.service.softDelete(+id);
    return { message: 'Entity deleted successfully' };
  }
}
*/
