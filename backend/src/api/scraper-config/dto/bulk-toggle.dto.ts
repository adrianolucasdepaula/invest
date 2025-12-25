import { IsArray, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para habilitar/desabilitar múltiplos scrapers em lote
 *
 * FASE: Dynamic Scraper Configuration
 */
export class BulkToggleDto {
  @ApiProperty({ description: 'IDs dos scrapers a atualizar', type: [String] })
  @IsArray()
  @IsString({ each: true })
  scraperIds: string[];

  @ApiProperty({ description: 'Habilitar (true) ou desabilitar (false)' })
  @IsBoolean()
  enabled: boolean;
}
