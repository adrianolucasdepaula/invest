import { IsArray, IsString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Item individual de prioridade
 */
export class PriorityItemDto {
  @ApiProperty({ description: 'ID do scraper' })
  @IsString()
  scraperId: string;

  @ApiProperty({ description: 'Nova prioridade (1 = maior)', minimum: 1 })
  @IsInt()
  @Min(1)
  priority: number;
}

/**
 * DTO para atualizar prioridades de múltiplos scrapers
 * Usado após drag & drop na UI
 *
 * FASE: Dynamic Scraper Configuration
 */
export class UpdatePriorityDto {
  @ApiProperty({ description: 'Lista de scrapers com novas prioridades', type: [PriorityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriorityItemDto)
  priorities: PriorityItemDto[];
}
