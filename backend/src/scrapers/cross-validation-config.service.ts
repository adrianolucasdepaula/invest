import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { CrossValidationConfig, FundamentalData } from '@database/entities';
import {
  CrossValidationConfigDto,
  UpdateCrossValidationConfigDto,
  ImpactPreviewDto,
  FieldTolerancesDto,
} from './dto/cross-validation-config.dto';
import { DEFAULT_TOLERANCES, SOURCE_PRIORITY } from './interfaces/field-source.interface';

/**
 * Service para gerenciamento de configuração de validação cruzada
 *
 * FASE 93.1 - Cross-Validation Configuration Service
 *
 * Responsável por:
 * - CRUD das configurações
 * - Preview de impacto de mudanças
 * - Fornecer configurações atuais para o sistema de validação
 */
@Injectable()
export class CrossValidationConfigService {
  private readonly logger = new Logger(CrossValidationConfigService.name);

  // Cache das configurações para evitar queries repetidas
  private configCache: CrossValidationConfigDto | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minuto

  constructor(
    @InjectRepository(CrossValidationConfig)
    private readonly configRepository: Repository<CrossValidationConfig>,
    @InjectRepository(FundamentalData)
    private readonly fundamentalDataRepository: Repository<FundamentalData>,
  ) {}

  /**
   * Obtém a configuração completa atual
   * Usa cache para performance
   */
  async getConfig(): Promise<CrossValidationConfigDto> {
    // Verificar cache
    const now = Date.now();
    if (this.configCache && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.configCache;
    }

    this.logger.log('[CONFIG] Fetching cross-validation configuration from database');

    const configs = await this.configRepository.find({
      where: { isActive: true },
    });

    // Mapear para DTO com valores default como fallback
    const configMap = new Map<string, unknown>();
    for (const config of configs) {
      configMap.set(config.configKey, config.value);
    }

    const result: CrossValidationConfigDto = {
      minSources: this.parseNumber(configMap.get('min_sources'), 3),
      severityThresholdHigh: this.parseNumber(configMap.get('severity_threshold_high'), 20),
      severityThresholdMedium: this.parseNumber(configMap.get('severity_threshold_medium'), 10),
      sourcePriority: this.parseArray(configMap.get('source_priority'), [...SOURCE_PRIORITY]),
      fieldTolerances: this.parseTolerances(configMap.get('field_tolerances')),
    };

    // Atualizar cache
    this.configCache = result;
    this.cacheTimestamp = now;

    return result;
  }

  /**
   * Atualiza uma ou mais configurações
   */
  async updateConfig(dto: UpdateCrossValidationConfigDto): Promise<CrossValidationConfigDto> {
    this.logger.log(`[CONFIG] Updating cross-validation configuration: ${JSON.stringify(dto)}`);

    const updates: Array<{ key: string; value: unknown }> = [];

    if (dto.minSources !== undefined) {
      updates.push({ key: 'min_sources', value: dto.minSources });
    }
    if (dto.severityThresholdHigh !== undefined) {
      updates.push({ key: 'severity_threshold_high', value: dto.severityThresholdHigh });
    }
    if (dto.severityThresholdMedium !== undefined) {
      updates.push({ key: 'severity_threshold_medium', value: dto.severityThresholdMedium });
    }
    if (dto.sourcePriority !== undefined) {
      updates.push({ key: 'source_priority', value: dto.sourcePriority });
    }
    if (dto.fieldTolerances !== undefined) {
      updates.push({ key: 'field_tolerances', value: dto.fieldTolerances });
    }

    // Atualizar cada configuração
    for (const update of updates) {
      const existing = await this.configRepository.findOne({
        where: { configKey: update.key },
      });

      if (existing) {
        existing.value = update.value;
        await this.configRepository.save(existing);
      } else {
        // Criar novo registro se não existir
        const newConfig = this.configRepository.create({
          configKey: update.key,
          value: update.value,
          isActive: true,
        });
        await this.configRepository.save(newConfig);
      }
    }

    // Invalidar cache
    this.configCache = null;

    return this.getConfig();
  }

  /**
   * Preview do impacto de mudanças na configuração
   * Simula as mudanças sem aplicar
   */
  async previewImpact(newConfig: UpdateCrossValidationConfigDto): Promise<ImpactPreviewDto> {
    this.logger.log(`[CONFIG] Previewing impact of configuration changes`);

    // Obter configuração atual
    const currentConfig = await this.getConfig();

    // Mesclar com novas configurações para preview
    const previewConfig: CrossValidationConfigDto = {
      ...currentConfig,
      ...newConfig,
      fieldTolerances: newConfig.fieldTolerances || currentConfig.fieldTolerances,
    };

    // Buscar dados fundamentais com discrepâncias
    const fundamentalData = await this.fundamentalDataRepository.find({
      where: {
        fieldSources: Not(IsNull()),
      },
      select: ['id', 'assetId', 'fieldSources', 'updatedAt'],
      relations: ['asset'],
    });

    // Calcular discrepâncias com configuração atual
    const currentDiscrepancies = this.calculateDiscrepancies(fundamentalData, currentConfig);

    // Calcular discrepâncias com nova configuração
    const newDiscrepancies = this.calculateDiscrepancies(fundamentalData, previewConfig);

    // Calcular diferenças
    const currentByKey = new Map(currentDiscrepancies.map((d) => [`${d.ticker}-${d.field}`, d]));
    const newByKey = new Map(newDiscrepancies.map((d) => [`${d.ticker}-${d.field}`, d]));

    // Encontrar mudanças
    const affectedAssets = new Set<string>();
    const affectedFields = new Set<string>();
    const sampleChanges: ImpactPreviewDto['sampleChanges'] = [];

    // Discrepâncias adicionadas
    for (const [key, newDisc] of newByKey) {
      if (!currentByKey.has(key)) {
        affectedAssets.add(newDisc.ticker);
        affectedFields.add(newDisc.field);
        if (sampleChanges.length < 10) {
          sampleChanges.push({
            ticker: newDisc.ticker,
            field: newDisc.field,
            currentSeverity: null,
            newSeverity: newDisc.severity,
            reason: 'Nova discrepância detectada com regras mais estritas',
          });
        }
      } else {
        const current = currentByKey.get(key)!;
        if (current.severity !== newDisc.severity) {
          affectedAssets.add(newDisc.ticker);
          affectedFields.add(newDisc.field);
          if (sampleChanges.length < 10) {
            sampleChanges.push({
              ticker: newDisc.ticker,
              field: newDisc.field,
              currentSeverity: current.severity,
              newSeverity: newDisc.severity,
              reason: `Severidade alterada de ${current.severity} para ${newDisc.severity}`,
            });
          }
        }
      }
    }

    // Discrepâncias removidas
    for (const [key, currentDisc] of currentByKey) {
      if (!newByKey.has(key)) {
        affectedAssets.add(currentDisc.ticker);
        affectedFields.add(currentDisc.field);
        if (sampleChanges.length < 10) {
          sampleChanges.push({
            ticker: currentDisc.ticker,
            field: currentDisc.field,
            currentSeverity: currentDisc.severity,
            newSeverity: null,
            reason: 'Discrepância resolvida com regras mais flexíveis',
          });
        }
      }
    }

    // Calcular totais por severidade
    const currentBySeverity = this.countBySeverity(currentDiscrepancies);
    const newBySeverity = this.countBySeverity(newDiscrepancies);

    return {
      currentTotal: currentDiscrepancies.length,
      newTotal: newDiscrepancies.length,
      delta: newDiscrepancies.length - currentDiscrepancies.length,
      bySeverity: {
        high: {
          current: currentBySeverity.high,
          new: newBySeverity.high,
          delta: newBySeverity.high - currentBySeverity.high,
        },
        medium: {
          current: currentBySeverity.medium,
          new: newBySeverity.medium,
          delta: newBySeverity.medium - currentBySeverity.medium,
        },
        low: {
          current: currentBySeverity.low,
          new: newBySeverity.low,
          delta: newBySeverity.low - currentBySeverity.low,
        },
      },
      affectedAssets: Array.from(affectedAssets).slice(0, 20),
      affectedFields: Array.from(affectedFields),
      sampleChanges,
    };
  }

  /**
   * Calcula discrepâncias baseado em uma configuração específica
   */
  private calculateDiscrepancies(
    fundamentalData: FundamentalData[],
    config: CrossValidationConfigDto,
  ): Array<{
    ticker: string;
    field: string;
    severity: 'high' | 'medium' | 'low';
    deviation: number;
  }> {
    const discrepancies: Array<{
      ticker: string;
      field: string;
      severity: 'high' | 'medium' | 'low';
      deviation: number;
    }> = [];
    const seen = new Set<string>();

    for (const data of fundamentalData) {
      if (!data.fieldSources || !data.asset) continue;

      const ticker = data.asset.ticker;

      for (const [fieldName, fieldInfo] of Object.entries(
        data.fieldSources as Record<string, any>,
      )) {
        if (!fieldInfo || !fieldInfo.values) continue;

        // Deduplicar por ticker+field
        const key = `${ticker}-${fieldName}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Verificar se tem discrepância com a nova configuração
        const values = fieldInfo.values as Array<{ source: string; value: number | null }>;
        const validValues = values.filter((v) => v.value !== null && v.value !== undefined);

        if (validValues.length < config.minSources) continue;

        // Calcular tolerância para este campo
        const tolerance =
          config.fieldTolerances.byField?.[fieldName] ?? config.fieldTolerances.default;

        // Agrupar valores similares
        const groups: Array<{ value: number; sources: string[] }> = [];
        for (const v of validValues) {
          const existingGroup = groups.find(
            (g) => Math.abs((v.value! - g.value) / g.value) <= tolerance,
          );
          if (existingGroup) {
            existingGroup.sources.push(v.source);
          } else {
            groups.push({ value: v.value!, sources: [v.source] });
          }
        }

        // Se há mais de um grupo, há discrepância
        if (groups.length > 1) {
          // Encontrar grupo de consenso (maior)
          groups.sort((a, b) => b.sources.length - a.sources.length);
          const consensusValue = groups[0].value;

          // Calcular máximo desvio
          let maxDeviation = 0;
          for (const group of groups.slice(1)) {
            const deviation = Math.abs((group.value - consensusValue) / consensusValue) * 100;
            maxDeviation = Math.max(maxDeviation, deviation);
          }

          // Determinar severidade
          let severity: 'high' | 'medium' | 'low';
          if (maxDeviation > config.severityThresholdHigh) {
            severity = 'high';
          } else if (maxDeviation > config.severityThresholdMedium) {
            severity = 'medium';
          } else {
            severity = 'low';
          }

          discrepancies.push({
            ticker,
            field: fieldName,
            severity,
            deviation: maxDeviation,
          });
        }
      }
    }

    return discrepancies;
  }

  /**
   * Conta discrepâncias por severidade
   */
  private countBySeverity(discrepancies: Array<{ severity: 'high' | 'medium' | 'low' }>): {
    high: number;
    medium: number;
    low: number;
  } {
    return {
      high: discrepancies.filter((d) => d.severity === 'high').length,
      medium: discrepancies.filter((d) => d.severity === 'medium').length,
      low: discrepancies.filter((d) => d.severity === 'low').length,
    };
  }

  /**
   * Helper para parsear número do valor JSONB
   */
  private parseNumber(value: unknown, defaultValue: number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }

  /**
   * Helper para parsear array do valor JSONB
   */
  private parseArray(value: unknown, defaultValue: string[]): string[] {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  /**
   * Helper para parsear tolerâncias do valor JSONB
   */
  private parseTolerances(value: unknown): FieldTolerancesDto {
    const defaultValue: FieldTolerancesDto = {
      default: DEFAULT_TOLERANCES.default,
      byField: DEFAULT_TOLERANCES.byField || {},
    };

    if (!value) return defaultValue;

    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      return {
        default: typeof obj.default === 'number' ? obj.default : defaultValue.default,
        byField:
          typeof obj.byField === 'object' && obj.byField !== null
            ? (obj.byField as Record<string, number>)
            : defaultValue.byField,
      };
    }

    if (typeof value === 'string') {
      try {
        return this.parseTolerances(JSON.parse(value));
      } catch {
        return defaultValue;
      }
    }

    return defaultValue;
  }

  /**
   * Invalida o cache (para uso após updates externos)
   */
  invalidateCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
  }
}
