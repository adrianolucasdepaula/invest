import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import {
  ScraperConfig,
  ScraperExecutionProfile,
  ScraperConfigAudit,
} from '@database/entities';
import {
  UpdateScraperConfigDto,
  BulkToggleDto,
  UpdatePriorityDto,
  PreviewImpactDto,
  ImpactAnalysis,
  CreateProfileDto,
  UpdateProfileDto,
} from './dto';
import { CacheService } from '@/common/services/cache.service';

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
    @InjectRepository(ScraperConfigAudit)
    private auditRepo: Repository<ScraperConfigAudit>,
    private cacheService: CacheService, // GAP-005: Redis cache
  ) {}

  // ============================================================================
  // AUDIT TRAIL (GAP-006)
  // ============================================================================

  /**
   * Registra uma acao no audit trail
   *
   * GAP-006: Rastreabilidade de mudancas para compliance financeiro
   */
  private async logAudit(
    action: ScraperConfigAudit['action'],
    scraperId: string | null,
    changes: ScraperConfigAudit['changes'],
    userId?: string,
    profileId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.auditRepo.save({
        action,
        userId: userId || null,
        scraperId,
        profileId: profileId || null,
        changes,
        reason: reason || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });

      this.logger.log(
        `[AUDIT] ✅ ${action} | scraper=${scraperId || 'N/A'} | user=${userId || 'system'}`,
      );
    } catch (error) {
      // Nao falhar operacao principal se audit falhar
      this.logger.error(`[AUDIT] ❌ Falha ao registrar audit: ${error.message}`, error.stack);
    }
  }

  // ============================================================================
  // CACHE INVALIDATION (GAP-005)
  // ============================================================================

  /**
   * Invalida cache de scrapers
   *
   * GAP-005: Deve ser chamado após qualquer modificação que afete scrapers ativos
   */
  private async invalidateScraperCache(category?: string): Promise<void> {
    try {
      if (category) {
        // Invalidar cache específico de uma categoria
        // Cache keys: enabled_scrapers:<category>:<ticker|all>
        // Como não temos acesso direto ao Redis SCAN, vamos invalidar individual
        await this.cacheService.del(`enabled_scrapers:${category}:all`);
        this.logger.debug(`[CACHE] Invalidated category ${category}`);
      } else {
        // Invalidar todos os caches de scrapers (sem ticker específico)
        // Para ser mais eficiente, vamos invalidar as categorias principais
        const categories = [
          'fundamental',
          'technical',
          'news',
          'ai',
          'market_data',
          'crypto',
          'options',
          'macro',
        ];

        for (const cat of categories) {
          await this.cacheService.del(`enabled_scrapers:${cat}:all`);
        }

        this.logger.debug('[CACHE] Invalidated all scraper cache');
      }
    } catch (error) {
      // Não falhar operação principal se invalidação falhar
      this.logger.error(`[CACHE] Falha ao invalidar cache: ${error.message}`);
    }
  }

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

    // GAP-005: Cache com Redis (TTL 5 min = 300s)
    const cacheKey = `enabled_scrapers:${category}:${ticker || 'all'}`;

    return this.cacheService.wrap<ScraperConfig[]>(
      cacheKey,
      async () => {
        this.logger.debug(`[CACHE-MISS] Fetching from DB: ${cacheKey}`);

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
      },
      300, // TTL 5 minutos
    );
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

    const updated = await this.scraperConfigRepo.save(config);

    // GAP-005: Invalidar cache após mudança
    await this.invalidateScraperCache(updated.category);

    return updated;
  }

  /**
   * Toggle ON/OFF de um scraper
   *
   * BUG-001 FIX: Agora usa transação atômica com pessimistic lock
   * para prevenir race conditions entre leitura e escrita.
   */
  async toggleEnabled(id: string): Promise<ScraperConfig> {
    const queryRunner = this.scraperConfigRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // PESSIMISTIC LOCK: Bloqueia row para escrita durante transação
      const config = await queryRunner.manager.findOne(ScraperConfig, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!config) {
        throw new NotFoundException(`Scraper config ${id} not found`);
      }

      const newState = !config.isEnabled;

      // Validação: Se desabilitando, verificar se ainda haverá mínimo 2
      if (!newState) {
        const enabledCount = await queryRunner.manager.count(ScraperConfig, {
          where: { isEnabled: true },
        });

        if (enabledCount <= 2) {
          throw new BadRequestException(
            `Não é possível desabilitar ${config.scraperName}. ` +
              `Mínimo de 2 scrapers deve estar ativo. Atualmente: ${enabledCount} ativos.`,
          );
        }
      }

      const beforeState = config.isEnabled;
      config.isEnabled = newState;
      const updated = await queryRunner.manager.save(ScraperConfig, config);

      await queryRunner.commitTransaction();

      // GAP-005: Invalidar cache após mudança
      await this.invalidateScraperCache(config.category);

      this.logger.log(
        `[TOGGLE] ✅ ${config.scraperName} ${newState ? 'ativado' : 'desativado'}`,
      );

      // GAP-006: Registrar audit (após commit para não bloquear transação)
      this.logger.log(`[TOGGLE] Registrando audit para ${config.scraperId}...`);
      await this.logAudit('TOGGLE', config.scraperId, {
        before: { isEnabled: beforeState },
        after: { isEnabled: newState },
      });
      this.logger.log(`[TOGGLE] Audit registrado com sucesso`);

      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[TOGGLE] ❌ Falha: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Toggle em lote de múltiplos scrapers
   *
   * BUG-001 FIX: Agora usa transação atômica para garantir
   * rollback automático se validação falhar.
   */
  async bulkToggle(dto: BulkToggleDto): Promise<{ updated: number }> {
    const queryRunner = this.scraperConfigRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Atualizar scrapers
      const result = await queryRunner.query(
        `UPDATE scraper_configs SET "isEnabled" = $1 WHERE "scraperId" = ANY($2::text[])`,
        [dto.enabled, dto.scraperIds],
      );

      // 2. Validar APÓS atualização (dentro da transação)
      const enabledCount = await queryRunner.manager.count(ScraperConfig, {
        where: { isEnabled: true },
      });

      if (enabledCount < 2) {
        // Rollback automático via throw (não precisa reverter manualmente)
        throw new BadRequestException(
          `Operação resultaria em apenas ${enabledCount} scraper(s) ativo(s). ` +
            `Mínimo 2 necessário para cross-validation.`,
        );
      }

      await queryRunner.commitTransaction();

      // GAP-005: Invalidar cache após mudança
      await this.invalidateScraperCache(); // Invalidar todas categorias (não sabemos quais foram afetadas)

      // GAP-006: Registrar audit
      await this.logAudit('BULK_TOGGLE', null, {
        after: { enabled: dto.enabled },
        affectedScrapers: dto.scraperIds,
      });

      const action = dto.enabled ? 'ativados' : 'desativados';
      this.logger.log(`[BULK-TOGGLE] ✅ ${dto.scraperIds.length} scrapers ${action}`);

      return { updated: result.rowCount || 0 };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `[BULK-TOGGLE] ❌ Falha ao ${dto.enabled ? 'ativar' : 'desativar'}: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
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

      // GAP-006: Registrar audit
      await this.logAudit('UPDATE_PRIORITY', null, {
        after: { priorities: dto.priorities },
        affectedScrapers: dto.priorities.map((p) => p.scraperId),
      });
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
   * Atualiza perfil existente (apenas custom, não system)
   *
   * GAP-001: Implementação de updateProfile() endpoint
   */
  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
    userId?: string,
  ): Promise<ScraperExecutionProfile> {
    const profile = await this.profileRepo.findOne({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    if (profile.isSystem) {
      throw new BadRequestException(
        'System profiles cannot be modified. Create a custom profile instead.',
      );
    }

    // Validar scraperIds existem
    const scrapers = await this.scraperConfigRepo.find({
      where: { scraperId: In(dto.config.scraperIds) },
    });

    if (scrapers.length !== dto.config.scraperIds.length) {
      throw new BadRequestException('One or more scraperIds are invalid');
    }

    // Validar priorityOrder contém TODOS os scraperIds exatamente uma vez
    if (dto.config.priorityOrder.length !== dto.config.scraperIds.length) {
      throw new BadRequestException(
        'priorityOrder must contain ALL scraperIds exactly once',
      );
    }

    // Verificar se todos os scraperIds estão no priorityOrder
    const prioritySet = new Set(dto.config.priorityOrder);
    const hasAllScrapers = dto.config.scraperIds.every((id) => prioritySet.has(id));

    if (!hasAllScrapers) {
      throw new BadRequestException(
        'priorityOrder must contain all scraperIds from config.scraperIds',
      );
    }

    // Capturar estado antes para audit
    const before = {
      name: profile.name,
      displayName: profile.displayName,
      description: profile.description,
      isDefault: profile.isDefault,
      config: profile.config,
    };

    // Aplicar mudanças
    Object.assign(profile, dto);
    const updated = await this.profileRepo.save(profile);

    // Audit trail
    await this.logAudit('UPDATE', null, { before, after: updated }, userId, id);

    // GAP-005: Invalidar cache após mudança (priorityOrder pode afetar scrapers)
    await this.invalidateScraperCache(); // Invalidar todas categorias

    this.logger.log(`[UPDATE-PROFILE] ✅ Profile ${id} (${profile.name}) updated successfully`);

    return updated;
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
      // 1. Desativar TODOS usando SQL direto (TypeORM não aceita critério vazio em update)
      await queryRunner.query(`UPDATE scraper_configs SET "isEnabled" = false`);

      // 2. Ativar apenas os do perfil
      const placeholders = scraperIds.map((_, i) => `$${i + 1}`).join(',');
      await queryRunner.query(
        `UPDATE scraper_configs SET "isEnabled" = true WHERE "scraperId" IN (${placeholders})`,
        scraperIds,
      );

      // 3. Atualizar prioridades (evitar duplicate key usando temporárias negativas)
      // PASSO 3.1: Setar priorities temporárias negativas para scrapers do perfil
      for (let i = 0; i < priorityOrder.length; i++) {
        await queryRunner.query(
          `UPDATE scraper_configs SET priority = $1 WHERE "scraperId" = $2`,
          [-(i + 1), priorityOrder[i]], // Negativo temporário: -1, -2, -3...
        );
      }

      // PASSO 3.2: Converter priorities negativas para finais positivas (sem conflitos)
      for (let i = 0; i < priorityOrder.length; i++) {
        await queryRunner.query(
          `UPDATE scraper_configs SET priority = $1 WHERE "scraperId" = $2`,
          [i + 1, priorityOrder[i]], // Final: 1, 2, 3...
        );
      }

      // Nota: Scrapers desabilitados mantêm priorities antigas (pode haver gaps)
      // Gaps não afetam funcionalidade pois usamos ORDER BY priority

      await queryRunner.commitTransaction();

      // GAP-005: Invalidar cache após mudanças
      await this.invalidateScraperCache(); // Invalidar todas categorias

      // GAP-006: Registrar audit
      await this.logAudit(
        'APPLY_PROFILE',
        null,
        {
          after: {
            profileName: profile.name,
            profileDisplayName: profile.displayName,
          },
          affectedScrapers: scraperIds,
        },
        undefined,
        profileId,
      );

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

    // BUG-004 FIX: Lista de scrapers que usam Playwright (browser automation)
    // ANTES: Lógica incorreta "python OU fundamentus" (Python NÃO é Playwright!)
    // DEPOIS: Lista explícita de scrapers TypeScript que usam Playwright
    const PLAYWRIGHT_SCRAPERS = [
      'fundamentus',
      'statusinvest',
      'investidor10',
      'fundamentei',
    ];

    // Contar Playwright vs API
    const playwrightCount = scrapers.filter((s) =>
      PLAYWRIGHT_SCRAPERS.includes(s.scraperId),
    ).length;

    // API: brapi (TypeScript API) + todos Python (API-based)
    const apiCount = scrapers.filter(
      (s) => s.scraperId === 'brapi' || s.runtime === 'python',
    ).length;

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
    // FIX BUG-002: Usar Not() do TypeORM ao invés de sintaxe incorreta
    const existingWithSamePriority = await this.scraperConfigRepo.findOne({
      where: config.id
        ? { priority: config.priority, id: Not(config.id) }
        : { priority: config.priority },
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
