import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperConfig, ScraperExecutionProfile } from '@database/entities';
import { ScraperConfigController } from './scraper-config.controller';
import { ScraperConfigService } from './scraper-config.service';

/**
 * ScraperConfigModule
 *
 * Módulo responsável por gerenciar configurações dinâmicas de scrapers.
 * Permite controle via API de quais scrapers executar, ordem de prioridade,
 * e parâmetros ajustáveis.
 *
 * Features:
 * - CRUD de configurações de scrapers
 * - Aplicação de perfis pré-definidos
 * - Análise de impacto antes de aplicar mudanças
 * - Validações de regras de negócio
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md - Seção 3.2
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ScraperConfig, ScraperExecutionProfile]),
  ],
  controllers: [ScraperConfigController],
  providers: [ScraperConfigService],
  exports: [ScraperConfigService], // Exportar para uso no ScrapersService
})
export class ScraperConfigModule {}
