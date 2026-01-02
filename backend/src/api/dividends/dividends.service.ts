import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, In } from 'typeorm';
import Decimal from 'decimal.js';
import { Dividend, DividendType, DividendStatus } from '@database/entities/dividend.entity';
import { Asset, AssetPrice } from '@database/entities';
import {
  CreateDividendDto,
  DividendQueryDto,
  DividendYieldSummaryDto,
  DividendSyncResponseDto,
} from './dto/dividend.dto';

/**
 * Dividends Service
 *
 * Gerencia o histórico de proventos (dividendos, JCP, bonificações) de ativos B3.
 * Usado na estratégia WHEEL para:
 * - Calcular yield histórico
 * - Projetar dividendos futuros
 * - Identificar datas-ex para ajuste de posições
 *
 * @created 2025-12-21
 * @phase FASE 101 - Wheel Turbinada
 */
@Injectable()
export class DividendsService {
  private readonly logger = new Logger(DividendsService.name);

  constructor(
    @InjectRepository(Dividend)
    private readonly dividendRepository: Repository<Dividend>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
  ) {}

  /**
   * Busca todos os dividendos com filtros opcionais
   */
  async findAll(query: DividendQueryDto): Promise<Dividend[]> {
    const { assetId, ticker, startDate, endDate, tipo, status, limit = 100, offset = 0 } = query;

    const qb = this.dividendRepository
      .createQueryBuilder('dividend')
      .leftJoinAndSelect('dividend.asset', 'asset')
      .orderBy('dividend.dataEx', 'DESC')
      .take(limit)
      .skip(offset);

    if (assetId) {
      qb.andWhere('dividend.assetId = :assetId', { assetId });
    }

    if (ticker) {
      qb.andWhere('UPPER(asset.ticker) = :ticker', { ticker: ticker.toUpperCase() });
    }

    if (startDate) {
      qb.andWhere('dividend.dataEx >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('dividend.dataEx <= :endDate', { endDate });
    }

    if (tipo) {
      qb.andWhere('dividend.tipo = :tipo', { tipo });
    }

    if (status) {
      qb.andWhere('dividend.status = :status', { status });
    }

    return qb.getMany();
  }

  /**
   * Busca um dividendo por ID
   */
  async findById(id: string): Promise<Dividend> {
    const dividend = await this.dividendRepository.findOne({
      where: { id },
      relations: ['asset'],
    });

    if (!dividend) {
      throw new NotFoundException(`Dividend ${id} not found`);
    }

    return dividend;
  }

  /**
   * Busca dividendos por ticker
   */
  async findByTicker(ticker: string, limit: number = 50): Promise<Dividend[]> {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    return this.dividendRepository.find({
      where: { assetId: asset.id },
      order: { dataEx: 'DESC' },
      take: limit,
    });
  }

  /**
   * Cria um novo registro de dividendo
   */
  async create(dto: CreateDividendDto): Promise<Dividend> {
    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${dto.assetId} not found`);
    }

    // Calculate net value and tax for JCP
    let valorLiquido = dto.valorLiquido;
    let impostoRetido: Decimal | null = null;

    if (dto.tipo === DividendType.JCP) {
      // JCP has 15% tax withheld at source
      impostoRetido = dto.valorBruto.mul(0.15);
      valorLiquido = valorLiquido ?? dto.valorBruto.mul(0.85);
    } else {
      // Dividends are tax-free for individuals
      valorLiquido = valorLiquido ?? dto.valorBruto;
      impostoRetido = new Decimal(0);
    }

    const dividend = this.dividendRepository.create({
      ...dto,
      valorLiquido,
      impostoRetido,
      status: dto.status ?? DividendStatus.ANUNCIADO,
    });

    const saved = await this.dividendRepository.save(dividend);
    this.logger.log(`Created dividend ${saved.id} for asset ${asset.ticker}: R$ ${dto.valorBruto}`);

    return saved;
  }

  /**
   * Calcula o Dividend Yield histórico de um ativo
   *
   * DY = (Total Dividendos no Período / Preço Atual) * 100
   */
  async calculateDividendYield(
    assetId: string,
    months: number = 12,
  ): Promise<DividendYieldSummaryDto> {
    this.logger.log(`Calculating dividend yield for asset ${assetId} (last ${months} months)`);

    // 1. Fetch asset
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    // 2. Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // 3. Fetch dividends in period
    const dividends = await this.dividendRepository.find({
      where: {
        assetId,
        dataEx: Between(startDate, endDate),
        status: In([DividendStatus.PAGO, DividendStatus.ANUNCIADO]),
      },
      order: { dataEx: 'DESC' },
    });

    // 4. Fetch latest price
    const latestPrice = await this.assetPriceRepository.findOne({
      where: { assetId },
      order: { date: 'DESC' },
    });

    if (!latestPrice) {
      this.logger.warn(`No price data found for asset ${assetId}`);
    }

    const currentPrice = latestPrice ? Number(latestPrice.close) : 0;

    // 5. Calculate totals
    const totalPago = dividends.reduce((sum, d) => sum + Number(d.valorBruto), 0);
    const dy = currentPrice > 0 ? (totalPago / currentPrice) * 100 : 0;

    // 6. Calculate 24m for comparison
    const startDate24m = new Date();
    startDate24m.setMonth(startDate24m.getMonth() - 24);

    const dividends24m = await this.dividendRepository.find({
      where: {
        assetId,
        dataEx: Between(startDate24m, endDate),
        status: In([DividendStatus.PAGO, DividendStatus.ANUNCIADO]),
      },
    });

    const totalPago24m = dividends24m.reduce((sum, d) => sum + Number(d.valorBruto), 0);
    const dy24m = currentPrice > 0 ? (totalPago24m / currentPrice) * 100 : 0;

    // 7. Calculate frequency and next estimate
    const frequencia = this.inferFrequency(dividends);
    const proximoEstimado = this.estimateNextDividend(dividends, frequencia);

    return {
      ticker: asset.ticker,
      dy12m: new Decimal(dy.toFixed(2)),
      dy24m: new Decimal(dy24m.toFixed(2)),
      totalPago12m: new Decimal(totalPago.toFixed(4)),
      pagamentos12m: dividends.length,
      mediaPorPagamento:
        dividends.length > 0
          ? new Decimal((totalPago / dividends.length).toFixed(4))
          : new Decimal(0),
      frequenciaPredominante: frequencia,
      proximoProventoEstimado: proximoEstimado
        ? {
            dataEx: proximoEstimado.dataEx,
            valorEstimado: new Decimal(proximoEstimado.valorEstimado),
          }
        : undefined,
    };
  }

  /**
   * Importa dividendos do scraper Python
   */
  async importFromScraper(
    ticker: string,
    scraperData: Array<{
      tipo: string;
      valor_bruto: number;
      valor_liquido?: number;
      imposto_retido?: number;
      data_ex: string;
      data_com?: string;
      data_pagamento?: string;
      status?: string;
    }>,
  ): Promise<DividendSyncResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Importing ${scraperData.length} dividends for ${ticker}`);

    // 1. Find asset
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of scraperData) {
      try {
        // 2. Check for duplicate (asset + data_ex + tipo)
        const exists = await this.dividendRepository.findOne({
          where: {
            assetId: asset.id,
            dataEx: new Date(item.data_ex),
            tipo: this.mapDividendType(item.tipo),
          },
        });

        if (exists) {
          skipped++;
          continue;
        }

        // 3. Map and create dividend
        const tipo = this.mapDividendType(item.tipo);
        let valorLiquido = item.valor_liquido;
        let impostoRetido = item.imposto_retido ?? 0;

        // Calculate tax for JCP if not provided
        if (tipo === DividendType.JCP && !item.valor_liquido) {
          impostoRetido = item.valor_bruto * 0.15;
          valorLiquido = item.valor_bruto * 0.85;
        } else if (!item.valor_liquido) {
          valorLiquido = item.valor_bruto;
        }

        // Convert raw numbers to Decimal instances (DecimalTransformer requires Decimal)
        const dividend = this.dividendRepository.create({
          assetId: asset.id,
          tipo,
          status: this.mapDividendStatus(item.status),
          valorBruto: new Decimal(item.valor_bruto),
          valorLiquido: valorLiquido != null ? new Decimal(valorLiquido) : null,
          impostoRetido: impostoRetido != null ? new Decimal(impostoRetido) : null,
          dataEx: new Date(item.data_ex),
          dataCom: item.data_com ? new Date(item.data_com) : null,
          dataPagamento: item.data_pagamento ? new Date(item.data_pagamento) : null,
          source: 'STATUSINVEST_DIVIDENDS',
        });

        await this.dividendRepository.save(dividend);
        imported++;
      } catch (error) {
        errors.push(`Error on ${item.data_ex}: ${error.message}`);
        this.logger.error(`Failed to import dividend: ${error.message}`);
      }
    }

    const elapsedTime = (Date.now() - startTime) / 1000;
    this.logger.log(
      `Import completed: ${imported} imported, ${skipped} skipped, ${errors.length} errors`,
    );

    return {
      success: errors.length === 0,
      ticker,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      source: 'STATUSINVEST_DIVIDENDS',
      elapsedTime,
    };
  }

  /**
   * Calcula dividendos ganhos em um período específico
   * Usado no backtesting da estratégia WHEEL
   */
  async calculateDividendsForPeriod(
    assetId: string,
    startDate: Date,
    endDate: Date,
    sharesHeld: number,
  ): Promise<number> {
    const dividends = await this.dividendRepository.find({
      where: {
        assetId,
        dataEx: Between(startDate, endDate),
        status: In([DividendStatus.PAGO, DividendStatus.ANUNCIADO]),
      },
    });

    return dividends.reduce(
      (sum, d) => sum + Number(d.valorLiquido || d.valorBruto) * sharesHeld,
      0,
    );
  }

  /**
   * Retorna próximos dividendos anunciados (ainda não pagos)
   */
  async getUpcomingDividends(days: number = 30): Promise<Dividend[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.dividendRepository.find({
      where: {
        dataEx: Between(today, futureDate),
        status: DividendStatus.ANUNCIADO,
      },
      relations: ['asset'],
      order: { dataEx: 'ASC' },
    });
  }

  /**
   * Infere a frequência predominante de dividendos
   */
  private inferFrequency(dividends: Dividend[]): string {
    if (dividends.length < 2) return 'irregular';

    // Sort by date ascending
    const sorted = [...dividends].sort(
      (a, b) => new Date(a.dataEx).getTime() - new Date(b.dataEx).getTime(),
    );

    // Calculate average interval between dividends
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff = this.daysBetween(new Date(sorted[i - 1].dataEx), new Date(sorted[i].dataEx));
      totalDays += diff;
    }

    const avgDays = totalDays / (sorted.length - 1);

    if (avgDays <= 35) return 'mensal';
    if (avgDays <= 100) return 'trimestral';
    if (avgDays <= 200) return 'semestral';
    if (avgDays <= 400) return 'anual';
    return 'irregular';
  }

  /**
   * Estima o próximo dividendo com base no histórico
   */
  private estimateNextDividend(
    dividends: Dividend[],
    frequencia: string,
  ): { dataEx: string; valorEstimado: number } | undefined {
    if (dividends.length === 0) {
      return undefined;
    }

    // Get average value from last 4 dividends
    const recent = dividends.slice(0, 4);
    const avgValue = recent.reduce((sum, d) => sum + Number(d.valorBruto), 0) / recent.length;

    // Estimate next date based on frequency
    const lastDate = new Date(dividends[0].dataEx);
    let nextDate: Date;

    switch (frequencia) {
      case 'mensal':
        nextDate = this.addMonths(lastDate, 1);
        break;
      case 'trimestral':
        nextDate = this.addMonths(lastDate, 3);
        break;
      case 'semestral':
        nextDate = this.addMonths(lastDate, 6);
        break;
      case 'anual':
        nextDate = this.addMonths(lastDate, 12);
        break;
      default:
        nextDate = this.addMonths(lastDate, 3); // Default to quarterly
    }

    return {
      dataEx: nextDate.toISOString().split('T')[0],
      valorEstimado: Number(avgValue.toFixed(4)),
    };
  }

  /**
   * Helper: Days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.abs(Math.round((date2.getTime() - date1.getTime()) / oneDay));
  }

  /**
   * Helper: Add months to date
   */
  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Helper: Map string to DividendType enum
   */
  private mapDividendType(tipo: string): DividendType {
    const normalized = tipo.toLowerCase().trim();
    const mapping: Record<string, DividendType> = {
      dividendo: DividendType.DIVIDENDO,
      dividendos: DividendType.DIVIDENDO,
      jcp: DividendType.JCP,
      jscp: DividendType.JCP,
      juros: DividendType.JCP,
      'juros sobre capital': DividendType.JCP,
      bonus: DividendType.BONUS,
      bonificacao: DividendType.BONUS,
      bonificação: DividendType.BONUS,
      rendimento: DividendType.RENDIMENTO,
      fracao: DividendType.FRACAO,
      fração: DividendType.FRACAO,
      subscricao: DividendType.SUBSCRICAO,
      subscrição: DividendType.SUBSCRICAO,
    };

    return mapping[normalized] || DividendType.DIVIDENDO;
  }

  /**
   * Helper: Map string to DividendStatus enum
   */
  private mapDividendStatus(status?: string): DividendStatus {
    if (!status) return DividendStatus.ANUNCIADO;

    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, DividendStatus> = {
      anunciado: DividendStatus.ANUNCIADO,
      pago: DividendStatus.PAGO,
      projetado: DividendStatus.PROJETADO,
      previsto: DividendStatus.PROJETADO,
    };

    return mapping[normalized] || DividendStatus.ANUNCIADO;
  }
}
