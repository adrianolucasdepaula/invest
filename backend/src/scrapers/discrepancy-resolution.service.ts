import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscrepancyResolution, ResolutionMethod } from '@database/entities/discrepancy-resolution.entity';
import { FundamentalData } from '@database/entities/fundamental-data.entity';
import { Asset } from '@database/entities/asset.entity';
import { SOURCE_PRIORITY, FieldSourceInfo, FieldSourcesMap } from './interfaces/field-source.interface';

/**
 * DTO para resolução manual de discrepância
 */
export interface ResolveDiscrepancyDto {
  ticker: string;
  fieldName: string;
  selectedValue: number;
  selectedSource?: string;
  notes?: string;
  resolvedBy?: string;
}

/**
 * DTO para resolução automática em lote
 */
export interface AutoResolveOptionsDto {
  method: 'consensus' | 'priority';
  severity?: 'all' | 'high' | 'medium' | 'low';
  tickerFilter?: string;
  fieldFilter?: string;
  dryRun?: boolean; // Se true, não salva, apenas retorna o que seria feito
}

/**
 * Resultado de uma resolução
 */
export interface ResolutionResult {
  ticker: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: number | null;
  newValue: number;
  selectedSource: string;
  method: ResolutionMethod;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Detalhes de uma discrepância para exibição
 */
export interface DiscrepancyDetailDto {
  ticker: string;
  assetName: string;
  fieldName: string;
  fieldLabel: string;
  currentValue: number | null;
  currentSource: string;
  consensus: number;
  hasDiscrepancy: boolean;
  severity: 'high' | 'medium' | 'low';
  maxDeviation: number;
  sourceValues: Array<{
    source: string;
    value: number | null;
    deviation: number | null;
    isConsensus: boolean;
    priority: number;
    scrapedAt: string;
  }>;
  resolutionHistory: DiscrepancyResolution[];
  recommendedValue: number | null;
  recommendedSource: string | null;
  recommendedReason: string;
}

/**
 * Labels amigáveis para campos
 */
const FIELD_LABELS: Record<string, string> = {
  pl: 'P/L',
  pvp: 'P/VP',
  psr: 'P/SR',
  pAtivos: 'P/Ativos',
  pCapitalGiro: 'P/Capital de Giro',
  pEbit: 'P/EBIT',
  evEbit: 'EV/EBIT',
  evEbitda: 'EV/EBITDA',
  pegRatio: 'PEG Ratio',
  dividaLiquidaPatrimonio: 'Dív. Líq./Patrimônio',
  dividaLiquidaEbitda: 'Dív. Líq./EBITDA',
  dividaLiquidaEbit: 'Dív. Líq./EBIT',
  patrimonioLiquidoAtivos: 'Patrimônio Líq./Ativos',
  passivosAtivos: 'Passivos/Ativos',
  margemBruta: 'Margem Bruta',
  margemEbit: 'Margem EBIT',
  margemEbitda: 'Margem EBITDA',
  margemLiquida: 'Margem Líquida',
  roe: 'ROE',
  roa: 'ROA',
  roic: 'ROIC',
  giroAtivos: 'Giro dos Ativos',
  cagrReceitas5anos: 'CAGR Receitas 5a',
  cagrLucros5anos: 'CAGR Lucros 5a',
  dividendYield: 'Dividend Yield',
  payout: 'Payout',
  receitaLiquida: 'Receita Líquida',
  ebit: 'EBIT',
  ebitda: 'EBITDA',
  lucroLiquido: 'Lucro Líquido',
  patrimonioLiquido: 'Patrimônio Líquido',
  ativoTotal: 'Ativo Total',
  dividaBruta: 'Dívida Bruta',
  dividaLiquida: 'Dívida Líquida',
  disponibilidades: 'Disponibilidades',
  lpa: 'LPA',
  vpa: 'VPA',
  liquidezCorrente: 'Liquidez Corrente',
};

@Injectable()
export class DiscrepancyResolutionService {
  private readonly logger = new Logger(DiscrepancyResolutionService.name);

  constructor(
    @InjectRepository(DiscrepancyResolution)
    private resolutionRepository: Repository<DiscrepancyResolution>,
    @InjectRepository(FundamentalData)
    private fundamentalDataRepository: Repository<FundamentalData>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  /**
   * Obter detalhes completos de uma discrepância
   */
  async getDiscrepancyDetail(ticker: string, fieldName: string): Promise<DiscrepancyDetailDto> {
    this.logger.log(`[RESOLUTION] Getting discrepancy detail: ${ticker} - ${fieldName}`);

    // Buscar asset
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    // Buscar fundamental data mais recente
    const fd = await this.fundamentalDataRepository.findOne({
      where: { assetId: asset.id },
      order: { referenceDate: 'DESC' },
    });

    if (!fd) {
      throw new NotFoundException(`No fundamental data found for ${ticker}`);
    }

    const fieldInfo = fd.fieldSources?.[fieldName] as FieldSourceInfo;
    if (!fieldInfo) {
      throw new NotFoundException(`Field ${fieldName} not found in fieldSources for ${ticker}`);
    }

    // Calcular severidade e desvio máximo
    const maxDeviation = Math.max(...(fieldInfo.divergentSources?.map((s) => s.deviation) || [0]));
    const severity = maxDeviation > 20 ? 'high' : maxDeviation > 10 ? 'medium' : 'low';

    // Preparar valores das fontes com informações extras
    const sourceValues = fieldInfo.values
      .map((v) => {
        const priorityIndex = SOURCE_PRIORITY.indexOf(v.source as any);
        const isConsensus = v.value === fieldInfo.finalValue;
        const divergent = fieldInfo.divergentSources?.find((d) => d.source === v.source);

        return {
          source: v.source,
          value: v.value,
          deviation: divergent?.deviation || 0,
          isConsensus,
          priority: priorityIndex >= 0 ? priorityIndex + 1 : 99,
          scrapedAt: v.scrapedAt,
        };
      })
      .sort((a, b) => a.priority - b.priority);

    // Buscar histórico de resoluções
    const resolutionHistory = await this.resolutionRepository.find({
      where: { assetId: asset.id, fieldName },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Determinar valor recomendado
    let recommendedValue: number | null = null;
    let recommendedSource: string | null = null;
    let recommendedReason = '';

    if (fieldInfo.agreementCount >= 2) {
      // Se há consenso, recomendar o valor de consenso
      recommendedValue = fieldInfo.finalValue;
      recommendedSource = fieldInfo.finalSource;
      recommendedReason = `${fieldInfo.agreementCount} fontes concordam com este valor (consenso de ${fieldInfo.consensus}%)`;
    } else {
      // Se não há consenso, recomendar pela prioridade
      for (const source of SOURCE_PRIORITY) {
        const sv = fieldInfo.values.find((v) => v.source === source && v.value !== null);
        if (sv) {
          recommendedValue = sv.value;
          recommendedSource = source;
          recommendedReason = `Fonte mais confiável disponível (${source})`;
          break;
        }
      }
    }

    return {
      ticker: ticker.toUpperCase(),
      assetName: asset.name,
      fieldName,
      fieldLabel: FIELD_LABELS[fieldName] || fieldName,
      currentValue: fieldInfo.finalValue,
      currentSource: fieldInfo.finalSource,
      consensus: fieldInfo.consensus,
      hasDiscrepancy: fieldInfo.hasDiscrepancy,
      severity,
      maxDeviation,
      sourceValues,
      resolutionHistory,
      recommendedValue,
      recommendedSource,
      recommendedReason,
    };
  }

  /**
   * Resolver discrepância manualmente
   */
  async resolveManually(dto: ResolveDiscrepancyDto): Promise<ResolutionResult> {
    this.logger.log(`[RESOLUTION] Manual resolution: ${dto.ticker} - ${dto.fieldName}`);

    // Buscar asset
    const asset = await this.assetRepository.findOne({
      where: { ticker: dto.ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${dto.ticker} not found`);
    }

    // Buscar fundamental data
    const fd = await this.fundamentalDataRepository.findOne({
      where: { assetId: asset.id },
      order: { referenceDate: 'DESC' },
    });

    if (!fd) {
      throw new NotFoundException(`No fundamental data found for ${dto.ticker}`);
    }

    const fieldInfo = fd.fieldSources?.[dto.fieldName] as FieldSourceInfo;
    if (!fieldInfo) {
      throw new NotFoundException(`Field ${dto.fieldName} not found`);
    }

    const oldValue = fieldInfo.finalValue;
    const maxDeviation = Math.max(...(fieldInfo.divergentSources?.map((s) => s.deviation) || [0]));
    const severity = maxDeviation > 20 ? 'high' : maxDeviation > 10 ? 'medium' : 'low';

    // Criar registro de resolução
    const resolution = this.resolutionRepository.create({
      assetId: asset.id,
      ticker: dto.ticker.toUpperCase(),
      fieldName: dto.fieldName,
      fieldLabel: FIELD_LABELS[dto.fieldName] || dto.fieldName,
      oldValue,
      newValue: dto.selectedValue,
      selectedSource: dto.selectedSource || 'manual',
      resolutionMethod: 'manual',
      resolvedBy: dto.resolvedBy || 'unknown',
      notes: dto.notes,
      sourceValuesSnapshot: this.extractSourceValues(fieldInfo),
      severity,
      maxDeviation,
      fundamentalDataId: fd.id,
    });

    await this.resolutionRepository.save(resolution);

    // Atualizar fundamental data
    await this.updateFundamentalDataField(fd, dto.fieldName, dto.selectedValue, dto.selectedSource || 'manual');

    this.logger.log(`[RESOLUTION] Resolved ${dto.ticker} - ${dto.fieldName}: ${oldValue} -> ${dto.selectedValue}`);

    return {
      ticker: dto.ticker.toUpperCase(),
      fieldName: dto.fieldName,
      fieldLabel: FIELD_LABELS[dto.fieldName] || dto.fieldName,
      oldValue,
      newValue: dto.selectedValue,
      selectedSource: dto.selectedSource || 'manual',
      method: 'manual',
      severity,
    };
  }

  /**
   * Auto-resolver discrepâncias em lote
   */
  async autoResolve(options: AutoResolveOptionsDto): Promise<{
    resolved: number;
    skipped: number;
    errors: number;
    results: ResolutionResult[];
  }> {
    this.logger.log(
      `[RESOLUTION] Auto-resolve with method: ${options.method}, severity: ${options.severity || 'all'}`,
    );

    const results: ResolutionResult[] = [];
    let resolved = 0;
    let skipped = 0;
    let errors = 0;

    // Buscar todos os fundamental data com discrepâncias
    const query = this.fundamentalDataRepository
      .createQueryBuilder('fd')
      .innerJoinAndSelect('fd.asset', 'asset')
      .where('fd.field_sources IS NOT NULL')
      .orderBy('asset.ticker', 'ASC');

    if (options.tickerFilter) {
      query.andWhere('UPPER(asset.ticker) = UPPER(:ticker)', { ticker: options.tickerFilter });
    }

    const fundamentalDataList = await query.getMany();

    for (const fd of fundamentalDataList) {
      if (!fd.fieldSources || !fd.asset) continue;

      for (const [fieldName, fieldInfo] of Object.entries(fd.fieldSources)) {
        // Filtrar por campo se especificado
        if (options.fieldFilter && fieldName !== options.fieldFilter) continue;

        // Filtrar apenas discrepâncias
        if (!fieldInfo?.hasDiscrepancy) continue;

        // Filtrar por severidade
        const maxDeviation = Math.max(...(fieldInfo.divergentSources?.map((s) => s.deviation) || [0]));
        const severity = maxDeviation > 20 ? 'high' : maxDeviation > 10 ? 'medium' : 'low';

        if (options.severity && options.severity !== 'all' && severity !== options.severity) {
          continue;
        }

        try {
          const result = await this.autoResolveField(fd, fieldName, fieldInfo, options.method, options.dryRun);

          if (result) {
            results.push(result);
            resolved++;
          } else {
            skipped++;
          }
        } catch (error) {
          this.logger.warn(
            `[RESOLUTION] Failed to auto-resolve ${fd.asset.ticker} - ${fieldName}: ${error.message}`,
          );
          errors++;
        }
      }
    }

    this.logger.log(
      `[RESOLUTION] Auto-resolve complete: ${resolved} resolved, ${skipped} skipped, ${errors} errors`,
    );

    return { resolved, skipped, errors, results };
  }

  /**
   * Auto-resolver um campo específico
   */
  private async autoResolveField(
    fd: FundamentalData,
    fieldName: string,
    fieldInfo: FieldSourceInfo,
    method: 'consensus' | 'priority',
    dryRun?: boolean,
  ): Promise<ResolutionResult | null> {
    let newValue: number | null = null;
    let selectedSource: string = '';
    let resolutionMethod: ResolutionMethod;

    if (method === 'consensus') {
      // Usar valor com maior acordo
      if (fieldInfo.agreementCount >= 2) {
        newValue = fieldInfo.finalValue;
        selectedSource = fieldInfo.finalSource;
        resolutionMethod = 'auto_consensus';
      } else {
        // Não há consenso suficiente
        return null;
      }
    } else {
      // Usar prioridade
      for (const source of SOURCE_PRIORITY) {
        const sv = fieldInfo.values.find((v) => v.source === source && v.value !== null);
        if (sv) {
          newValue = sv.value;
          selectedSource = source;
          resolutionMethod = 'auto_priority';
          break;
        }
      }
    }

    if (newValue === null) return null;

    const oldValue = fieldInfo.finalValue;
    const maxDeviation = Math.max(...(fieldInfo.divergentSources?.map((s) => s.deviation) || [0]));
    const severity = maxDeviation > 20 ? 'high' : maxDeviation > 10 ? 'medium' : 'low';

    // Se dry run, não salvar
    if (!dryRun) {
      // Criar registro de resolução
      const resolution = this.resolutionRepository.create({
        assetId: fd.assetId,
        ticker: fd.asset?.ticker || 'UNKNOWN',
        fieldName,
        fieldLabel: FIELD_LABELS[fieldName] || fieldName,
        oldValue,
        newValue,
        selectedSource,
        resolutionMethod: resolutionMethod!,
        resolvedBy: 'system',
        notes: `Auto-resolved using ${method} method`,
        sourceValuesSnapshot: this.extractSourceValues(fieldInfo),
        severity,
        maxDeviation,
        fundamentalDataId: fd.id,
      });

      await this.resolutionRepository.save(resolution);

      // Atualizar fundamental data
      await this.updateFundamentalDataField(fd, fieldName, newValue, selectedSource);
    }

    return {
      ticker: fd.asset?.ticker || 'UNKNOWN',
      fieldName,
      fieldLabel: FIELD_LABELS[fieldName] || fieldName,
      oldValue,
      newValue,
      selectedSource,
      method: resolutionMethod!,
      severity,
    };
  }

  /**
   * Atualizar campo no fundamental data
   */
  private async updateFundamentalDataField(
    fd: FundamentalData,
    fieldName: string,
    newValue: number,
    selectedSource: string,
  ): Promise<void> {
    // Atualizar o campo principal
    (fd as any)[fieldName] = newValue;

    // Atualizar fieldSources para marcar como resolvido
    if (fd.fieldSources?.[fieldName]) {
      fd.fieldSources[fieldName].finalValue = newValue;
      fd.fieldSources[fieldName].finalSource = selectedSource;
      fd.fieldSources[fieldName].hasDiscrepancy = false;
      fd.fieldSources[fieldName].divergentSources = undefined;
    }

    await this.fundamentalDataRepository.save(fd);
  }

  /**
   * Extrair valores das fontes para snapshot
   */
  private extractSourceValues(fieldInfo: FieldSourceInfo): Record<string, number | null> {
    const values: Record<string, number | null> = {};
    for (const v of fieldInfo.values) {
      values[v.source] = v.value;
    }
    return values;
  }

  /**
   * Obter histórico de resoluções
   */
  async getResolutionHistory(options?: {
    ticker?: string;
    limit?: number;
    method?: ResolutionMethod;
  }): Promise<DiscrepancyResolution[]> {
    const query = this.resolutionRepository
      .createQueryBuilder('r')
      .orderBy('r.created_at', 'DESC')
      .take(options?.limit || 50);

    if (options?.ticker) {
      query.andWhere('UPPER(r.ticker) = UPPER(:ticker)', { ticker: options.ticker });
    }

    if (options?.method) {
      query.andWhere('r.resolution_method = :method', { method: options.method });
    }

    return query.getMany();
  }
}
