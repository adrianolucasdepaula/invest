import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ScraperConfig, ScraperExecutionProfile } from '@database/entities';
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
 * ScraperConfigService
 *
 * Service responsável por gerenciar configurações dinâmicas de scrapers.
 *
 * Métodos Principais:
 * - getEnabledScrapersForAsset: Retorna scrapers ativos para um asset (usado pelo ScrapersService)
 * - applyProfile: Aplica perfil pré-definido
 * - previewImpact: Análise de impacto antes de aplicar mudanças
 * - validateConfiguration: Valida regras de negócio
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md - Seção 3.2
 */
@Injectable()
export class ScraperConfigService {
  private readonly logger = new Logger(ScraperConfigService.name);

  constructor(
    @InjectRepository(ScraperConfig)
    private scraperConfigRepo: Repository<ScraperConfig>,
    @InjectRepository(ScraperExecutionProfile)
    private profileRepo: Repository<ScraperExecutionProfile>,
  ) {}

  // ============================================================================
  // MÉTODOS PRINCIPAIS (Usados pelo ScrapersService)
  // ============================================================================

  /**
   * Retorna scrapers ativos para um asset específico
   *
   * Este é o método CRÍTICO usado pelo ScrapersService.scrapeFundamentalData()
   * para obter quais scrapers executar.
   *
   * @param ticker Ticker do asset (ex: 'PETR4') ou null para todos
   * @param category Categoria dos scrapers (ex: 'fundamental')
   * @returns Lista de scrapers ativos ordenados por prioridade
   */
  async getEnabledScrapersForAsset(
    ticker: string | null,
    category: string,
  ): Promise<ScraperConfig[]> {
    this.logger.debug(`[GET-ENABLED] ticker=${ticker}, category=${category}`);

    // Buscar todos scrapers ativos da categoria
    const configs = await this.scraperConfigRepo.find({
      where: {
        isEnabled: true,
        category: category as any,
      },
    });

    // Filtrar por ticker se especificado
    const filtered = ticker
      ? configs.filter(
          (c) =>
            c.enabledFor === null || // Habilitado para todos
            c.enabledFor.includes(ticker), // Habilitado para este ticker
        )
      : configs;

    // VALIDAÇÃO CRÍTICA: Mínimo 2 scrapers
    if (filtered.length < 2) {
      this.logger.warn(
        `Ticker ${ticker}: Apenas ${filtered.length} scraper(s) disponível(is). ` +
          `Mínimo 2 necessário. Sistema usará fallback Python se necessário.`,
      );
    }

    // Ordenar por prioridade (1 = maior)
    const sorted = filtered.sort((a, b) => a.priority - b.priority);

    this.logger.debug(
      `[GET-ENABLED] Retornando ${sorted.length} scrapers: ${sorted.map((s) => s.scraperId).join(', ')}`,
    );

    return sorted;
  }

  // ============================================================================
  // CRUD DE SCRAPERS
  // ============================================================================

  /**
   * Lista todos os scrapers
   */
  async getAll(): Promise<ScraperConfig[]> {
    return this.scraperConfigRepo.find({
      order: { priority: 'ASC' },
    });
  }

  /**
   * Busca scraper por ID
   */
  async getOne(id: string): Promise<ScraperConfig> {
    const config = await this.scraperConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Scraper config ${id} not found`);
    }
    return config;
  }

  /**
   * Atualiza configuração de um scraper
   */
  async update(id: string, dto: UpdateScraperConfigDto): Promise<ScraperConfig> {
    const config = await this.getOne(id);

    // Aplicar mudanças
    if (dto.isEnabled !== undefined) config.isEnabled = dto.isEnabled;
    if (dto.priority !== undefined) config.priority = dto.priority;
    if (dto.enabledFor !== undefined) config.enabledFor = dto.enabledFor;
    if (dto.parameters !== undefined) {
      config.parameters = { ...config.parameters, ...dto.parameters };
    }

    // Validar antes de salvar
    await this.validateSingleConfig(config);

    return this.scraperConfigRepo.save(config);
  }

  /**
   * Toggle ON/OFF de um scraper
   */
  async toggleEnabled(id: string): Promise<ScraperConfig> {
    const config = await this.getOne(id);
    config.isEnabled = !config.isEnabled;

    // Validar que ainda haverá mínimo 2 ativos
    const enabledCount = await this.scraperConfigRepo.count({
      where: { isEnabled: true },
    });

    if (!config.isEnabled && enabledCount <= 2) {
      throw new BadRequestException(
        'Não é possível desabilitar este scraper. Mínimo de 2 scrapers deve estar ativo.',
      );
    }

    return this.scraperConfigRepo.save(config);
  }

  /**
   * Toggle em lote de múltiplos scrapers
   */
  async bulkToggle(dto: BulkToggleDto): Promise<{ updated: number }> {
    await this.scraperConfigRepo.update(
      { scraperId: In(dto.scraperIds) },
      { isEnabled: dto.enabled },
    );

    // Validar após mudança
    const enabledCount = await this.scraperConfigRepo.count({
      where: { isEnabled: true },
    });

    if (enabledCount < 2) {
      // Reverter
      await this.scraperConfigRepo.update(
        { scraperId: In(dto.scraperIds) },
        { isEnabled: !dto.enabled },
      );
      throw new BadRequestException(
        `Operação resultaria em apenas ${enabledCount} scraper(s) ativo(s). Mínimo 2 necessário.`,
      );
    }

    return { updated: dto.scraperIds.length };
  }

  /**
   * Atualiza prioridades de múltiplos scrapers
   */
  async updatePriority(dto: UpdatePriorityDto): Promise<void> {
    // Validar prioridades únicas
    const priorities = dto.priorities.map((p) => p.priority);
    const hasDuplicates = new Set(priorities).size !== priorities.length;

    if (hasDuplicates) {
      throw new BadRequestException(
        `Prioridades devem ser únicas. Valores fornecidos: ${priorities.join(', ')}`,
      );
    }

    // Atualizar em transação
    const queryRunner = this.scraperConfigRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of dto.priorities) {
        await queryRunner.manager.update(
          ScraperConfig,
          { scraperId: item.scraperId },
          { priority: item.priority },
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============================================================================
  // PERFIS DE EXECUÇÃO
  // ============================================================================

  /**
   * Lista todos os perfis
   */
  async getProfiles(): Promise<ScraperExecutionProfile[]> {
    return this.profileRepo.find({
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Cria perfil customizado
   */
  async createProfile(dto: CreateProfileDto): Promise<ScraperExecutionProfile> {
    // Validar scraperIds existem
    const scrapers = await this.scraperConfigRepo.find({
      where: { scraperId: In(dto.config.scraperIds) },
    });

    if (scrapers.length !== dto.config.scraperIds.length) {
      throw new BadRequestException('Um ou mais scraperIds inválidos');
    }

    // Validar mínimo 2 scrapers
    if (dto.config.minScrapers < 2) {
      throw new BadRequestException('Mínimo de 2 scrapers necessário');
    }

    const profile = this.profileRepo.create({
      ...dto,
      isSystem: false, // Perfis custom não são system
    });

    return this.profileRepo.save(profile);
  }

  /**
   * Deleta perfil (apenas custom, não system)
   */
  async deleteProfile(id: string): Promise<void> {
    const profile = await this.profileRepo.findOne({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    if (profile.isSystem) {
      throw new BadRequestException('Perfis do sistema não podem ser deletados');
    }

    await this.profileRepo.delete(id);
  }

  /**
   * Aplica perfil para todos os scrapers
   *
   * MÉTODO CRÍTICO: Usado pela UI para aplicar perfis pré-definidos
   *
   * Executa em TRANSAÇÃO ATÔMICA:
   * 1. Desativa TODOS os scrapers
   * 2. Ativa apenas os do perfil
   * 3. Atualiza prioridades
   *
   * Se qualquer passo falhar, faz ROLLBACK completo.
   */
  async applyProfile(profileId: string): Promise<{ applied: number; message: string }> {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    const { scraperIds, priorityOrder } = profile.config;

    this.logger.log(
      `[APPLY-PROFILE] Applying profile "${profile.displayName}" with ${scraperIds.length} scrapers`,
    );

    // Executar em transação atômica
    const queryRunner = this.scraperConfigRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Desativar TODOS
      await queryRunner.manager.update(ScraperConfig, {}, { isEnabled: false });

      // 2. Ativar apenas os do perfil
      await queryRunner.manager.update(
        ScraperConfig,
        { scraperId: In(scraperIds) },
        { isEnabled: true },
      );

      // 3. Atualizar prioridades
      for (let i = 0; i < priorityOrder.length; i++) {
        await queryRunner.manager.update(
          ScraperConfig,
          { scraperId: priorityOrder[i] },
          { priority: i + 1 },
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `[APPLY-PROFILE] ✅ Profile "${profile.displayName}" applied successfully`,
      );

      return {
        applied: scraperIds.length,
        message: `Perfil "${profile.displayName}" aplicado. ${scraperIds.length} scrapers ativos.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[APPLY-PROFILE] ❌ Failed to apply profile: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============================================================================
  // ANÁLISE DE IMPACTO
  // ============================================================================

  /**
   * Análise de impacto de mudanças de configuração
   *
   * Estima: duração, memória, CPU, confiança
   * Gera warnings para configurações problemáticas
   */
  async previewImpact(dto: PreviewImpactDto): Promise<ImpactAnalysis> {
    const scrapers = await this.scraperConfigRepo.find({
      where: { scraperId: In(dto.enabledScrapers) },
    });

    if (scrapers.length === 0) {
      throw new BadRequestException('Nenhum scraper válido fornecido');
    }

    // Contar Playwright vs API
    const playwrightCount = scrapers.filter(
      (s) => s.runtime === 'python' || s.scraperId === 'fundamentus',
    ).length;
    const apiCount = scrapers.filter((s) => s.scraperId === 'brapi').length;

    // ESTIMATIVAS baseadas em métricas reais
    // Playwright: ~30s por scraper (browser spawn + scrape)
    // API: ~5s por scraper (HTTP request)
    const estimatedDuration = playwrightCount * 30 + apiCount * 5;

    // Playwright: ~600MB por browser
    // API: ~50MB (JSON processing)
    const estimatedMemory = playwrightCount * 600 + apiCount * 50;

    // Playwright: ~15% CPU por browser
    const estimatedCPU = playwrightCount * 15;

    // Nível de confiança baseado em quantidade de fontes
    const confidenceLevel: 'low' | 'medium' | 'high' =
      scrapers.length >= 5 ? 'high' : scrapers.length >= 3 ? 'medium' : 'low';

    // Gerar warnings
    const warnings: string[] = [];

    if (scrapers.length < 2) {
      warnings.push('⚠️ Mínimo de 2 scrapers recomendado para cross-validation');
    }

    if (estimatedDuration > 180) {
      warnings.push(
        `⚠️ Duração estimada muito alta (${estimatedDuration}s > 180s). Risco de timeout.`,
      );
    }

    if (estimatedMemory > 2000) {
      warnings.push(`⚠️ Uso de memória alto (${estimatedMemory}MB > 2GB). Risco de Near-OOM.`);
    }

    const hasTypeScript = scrapers.some((s) => s.runtime === 'typescript');
    if (!hasTypeScript) {
      warnings.push(
        '⚠️ Recomendado ter pelo menos 1 scraper TypeScript para melhor performance',
      );
    }

    const playwrightLowTimeout = scrapers.filter(
      (s) => (s.runtime === 'python' || s.scraperId === 'fundamentus') && s.parameters.timeout < 60000,
    );

    if (playwrightLowTimeout.length > 0) {
      warnings.push(
        `⚠️ Scrapers Playwright com timeout < 60s: ${playwrightLowTimeout.map((s) => s.scraperName).join(', ')}. ` +
          `Recomendado >= 60000ms (60s) para inicialização de browser.`,
      );
    }

    return {
      estimatedDuration,
      estimatedMemory,
      estimatedCPU,
      minSources: scrapers.length,
      maxSources: scrapers.length,
      confidenceLevel,
      warnings,
    };
  }

  // ============================================================================
  // VALIDAÇÕES
  // ============================================================================

  /**
   * Valida configuração de um scraper individual
   */
  private async validateSingleConfig(config: ScraperConfig): Promise<void> {
    // Validar timeout Playwright
    if (
      (config.runtime === 'python' || config.scraperId === 'fundamentus') &&
      config.parameters.timeout < 60000
    ) {
      this.logger.warn(
        `Scraper ${config.scraperName}: Timeout de ${config.parameters.timeout}ms pode ser insuficiente para Playwright`,
      );
    }

    // Validar que não estamos criando prioridade duplicada
    const existingWithSamePriority = await this.scraperConfigRepo.findOne({
      where: {
        priority: config.priority,
        id: config.id ? { toString: () => `NOT '${config.id}'` } as any : undefined,
      },
    });

    if (existingWithSamePriority) {
      throw new BadRequestException(
        `Prioridade ${config.priority} já está em uso pelo scraper ${existingWithSamePriority.scraperName}`,
      );
    }
  }

  /**
   * Valida configuração completa (múltiplos scrapers)
   */
  async validateConfiguration(scraperIds: string[]): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // REGRA 1: Mínimo 2 scrapers
    if (scraperIds.length < 2) {
      errors.push('Mínimo de 2 scrapers necessário para cross-validation');
    }

    // REGRA 2: Não mais de 6 scrapers (Near-OOM prevention)
    if (scraperIds.length > 6) {
      warnings.push(
        'Mais de 6 scrapers pode causar problemas de memória (Near-OOM). Considere reduzir.',
      );
    }

    const configs = await this.scraperConfigRepo.find({
      where: { scraperId: In(scraperIds) },
    });

    // REGRA 3: Pelo menos 1 TypeScript para performance
    const hasTypeScript = configs.some((c) => c.runtime === 'typescript');
    if (!hasTypeScript) {
      warnings.push('Recomendado ter pelo menos 1 scraper TypeScript para melhor performance');
    }

    // REGRA 4: Validar timeouts Playwright
    const playwrightWithLowTimeout = configs.filter(
      (c) =>
        (c.runtime === 'python' || c.scraperId === 'fundamentus') &&
        c.parameters.timeout < 60000,
    );

    if (playwrightWithLowTimeout.length > 0) {
      warnings.push(
        `Scrapers Playwright com timeout < 60s: ${playwrightWithLowTimeout.map((c) => c.scraperName).join(', ')}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
