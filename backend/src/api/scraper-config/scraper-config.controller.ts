import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/api/auth/guards/jwt-auth.guard';
import { ScraperConfig, ScraperExecutionProfile } from '@database/entities';
import { ScraperConfigService } from './scraper-config.service';
import {
  UpdateScraperConfigDto,
  BulkToggleDto,
  UpdatePriorityDto,
  PreviewImpactDto,
  ImpactAnalysis,
  CreateProfileDto,
  UpdateProfileDto,
} from './dto';

/**
 * ScraperConfigController
 *
 * IMPORTANTE: Rotas específicas DEVEM vir ANTES de rotas parametrizadas
 * Ordem correta: profiles → bulk → preview-impact → :id
 *
 * SEGURANÇA (SEC-001): Endpoints de modificação protegidos com JwtAuthGuard
 * - GET: Público (autenticado)
 * - POST/PUT/PATCH/DELETE: Protegido (admin)
 *
 * TODO: Implementar RolesGuard para separar 'user' vs 'admin'
 *
 * FASE: Dynamic Scraper Configuration
 */
@ApiTags('Scraper Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Todos endpoints requerem autenticação
@Controller('scraper-config')
export class ScraperConfigController {
  constructor(private readonly scraperConfigService: ScraperConfigService) {}

  // ============================================================================
  // PERFIS DE EXECUÇÃO (Rotas específicas PRIMEIRO)
  // ============================================================================

  @Get('profiles')
  @ApiOperation({ summary: 'Lista todos os perfis de execução' })
  async getProfiles(): Promise<ScraperExecutionProfile[]> {
    return this.scraperConfigService.getProfiles();
  }

  @Post('profiles')
  @ApiOperation({ summary: 'Cria perfil customizado' })
  async createProfile(@Body() dto: CreateProfileDto): Promise<ScraperExecutionProfile> {
    return this.scraperConfigService.createProfile(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // SEC-002: Max 10 req/min
  @Post('profiles/:id/apply')
  @ApiOperation({ summary: 'Aplica perfil' })
  async applyProfile(@Param('id') id: string): Promise<{ applied: number; message: string }> {
    return this.scraperConfigService.applyProfile(id);
  }

  @Delete('profiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta perfil customizado' })
  async deleteProfile(@Param('id') id: string): Promise<void> {
    return this.scraperConfigService.deleteProfile(id);
  }

  // ============================================================================
  // BULK OPERATIONS (Rotas específicas)
  // ============================================================================

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // SEC-002: Max 10 req/min
  @Patch('bulk/toggle')
  @ApiOperation({ summary: 'Toggle múltiplos scrapers' })
  async bulkToggle(@Body() dto: BulkToggleDto): Promise<{ updated: number }> {
    return this.scraperConfigService.bulkToggle(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // SEC-002: Max 20 req/min (drag & drop)
  @Put('bulk/priority')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Atualiza prioridades (drag & drop)' })
  async updatePriority(@Body() dto: UpdatePriorityDto): Promise<void> {
    return this.scraperConfigService.updatePriority(dto);
  }

  // ============================================================================
  // ANÁLISE DE IMPACTO (Rota específica)
  // ============================================================================

  @Post('preview-impact')
  @ApiOperation({ summary: 'Análise de impacto' })
  async previewImpact(@Body() dto: PreviewImpactDto): Promise<ImpactAnalysis> {
    return this.scraperConfigService.previewImpact(dto);
  }

  // ============================================================================
  // CRUD DE SCRAPERS (Rotas parametrizadas POR ÚLTIMO)
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Lista todos os scrapers' })
  async getAll(): Promise<ScraperConfig[]> {
    return this.scraperConfigService.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de um scraper' })
  async getOne(@Param('id') id: string): Promise<ScraperConfig> {
    return this.scraperConfigService.getOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza scraper' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScraperConfigDto,
  ): Promise<ScraperConfig> {
    return this.scraperConfigService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle ON/OFF' })
  async toggleEnabled(@Param('id') id: string): Promise<ScraperConfig> {
    return this.scraperConfigService.toggleEnabled(id);
  }
}
