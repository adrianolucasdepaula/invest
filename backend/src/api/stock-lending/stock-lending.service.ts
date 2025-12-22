import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import Decimal from 'decimal.js';
import { StockLendingRate } from '@database/entities/stock-lending.entity';
import { Asset, AssetPrice } from '@database/entities';
import {
  CreateStockLendingRateDto,
  StockLendingQueryDto,
  CurrentLendingRateDto,
  LendingRateStatsDto,
  LendingIncomeEstimateDto,
  StockLendingSyncResponseDto,
} from './dto/stock-lending.dto';

/**
 * Stock Lending Service
 *
 * Gerencia taxas de aluguel de ações (BTC - Banco de Títulos B3).
 * Usado na estratégia WHEEL para:
 * - Calcular renda adicional durante fase HOLDING_SHARES
 * - Estimar rendimento total da estratégia
 * - Comparar custo de oportunidade
 *
 * @created 2025-12-21
 * @phase FASE 101 - Wheel Turbinada
 */
@Injectable()
export class StockLendingService {
  private readonly logger = new Logger(StockLendingService.name);

  /** Dias úteis no ano (B3) */
  private readonly TRADING_DAYS_PER_YEAR = 252;

  constructor(
    @InjectRepository(StockLendingRate)
    private readonly lendingRepository: Repository<StockLendingRate>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
  ) {}

  /**
   * Busca taxas de aluguel com filtros opcionais
   */
  async findAll(query: StockLendingQueryDto): Promise<StockLendingRate[]> {
    const { assetId, ticker, startDate, endDate, days, limit = 100, offset = 0 } = query;

    const qb = this.lendingRepository
      .createQueryBuilder('lending')
      .leftJoinAndSelect('lending.asset', 'asset')
      .orderBy('lending.dataReferencia', 'DESC')
      .take(limit)
      .skip(offset);

    if (assetId) {
      qb.andWhere('lending.assetId = :assetId', { assetId });
    }

    if (ticker) {
      qb.andWhere('UPPER(asset.ticker) = :ticker', { ticker: ticker.toUpperCase() });
    }

    // Date range
    if (startDate && endDate) {
      qb.andWhere('lending.dataReferencia BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (days) {
      const start = new Date();
      start.setDate(start.getDate() - days);
      qb.andWhere('lending.dataReferencia >= :start', { start });
    }

    return qb.getMany();
  }

  /**
   * Busca taxa de aluguel por ID
   */
  async findById(id: string): Promise<StockLendingRate> {
    const rate = await this.lendingRepository.findOne({
      where: { id },
      relations: ['asset'],
    });

    if (!rate) {
      throw new NotFoundException(`Stock lending rate ${id} not found`);
    }

    return rate;
  }

  /**
   * Busca taxa atual de aluguel por ticker
   */
  async getCurrentRate(ticker: string): Promise<CurrentLendingRateDto> {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    const latestRate = await this.lendingRepository.findOne({
      where: { assetId: asset.id },
      order: { dataReferencia: 'DESC' },
    });

    if (!latestRate) {
      throw new NotFoundException(`No lending rate found for ${ticker}`);
    }

    return {
      ticker: asset.ticker,
      taxaAluguelAno: latestRate.taxaAluguelAno,
      taxaAluguelDia: latestRate.taxaAluguelDia ?? new Decimal(0),
      quantidadeDisponivel: latestRate.quantidadeDisponivel
        ? Number(latestRate.quantidadeDisponivel)
        : undefined,
      quantidadeAlugada: latestRate.quantidadeAlugada
        ? Number(latestRate.quantidadeAlugada)
        : undefined,
      dataReferencia: latestRate.dataReferencia.toISOString().split('T')[0],
      source: latestRate.source || 'UNKNOWN',
    };
  }

  /**
   * Busca estatísticas de taxa de aluguel
   */
  async getLendingStats(ticker: string, days: number = 30): Promise<LendingRateStatsDto> {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rates = await this.lendingRepository.find({
      where: {
        assetId: asset.id,
        dataReferencia: MoreThanOrEqual(startDate),
      },
      order: { dataReferencia: 'DESC' },
    });

    if (rates.length === 0) {
      throw new NotFoundException(`No lending rates found for ${ticker} in the last ${days} days`);
    }

    // Calculate statistics
    const taxas = rates.map((r) => Number(r.taxaAluguelAno));
    const media = taxas.reduce((a, b) => a + b, 0) / taxas.length;
    const minimo = Math.min(...taxas);
    const maximo = Math.max(...taxas);

    // Calculate trend (compare first vs last half)
    const midPoint = Math.floor(taxas.length / 2);
    const recentAvg = taxas.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint || 0;
    const olderAvg = taxas.slice(midPoint).reduce((a, b) => a + b, 0) / (taxas.length - midPoint) || 0;

    let tendencia: 'alta' | 'baixa' | 'estavel';
    if (recentAvg > olderAvg * 1.05) {
      tendencia = 'alta';
    } else if (recentAvg < olderAvg * 0.95) {
      tendencia = 'baixa';
    } else {
      tendencia = 'estavel';
    }

    const latestRate = rates[0];

    return {
      ticker: asset.ticker,
      currentRate: {
        ticker: asset.ticker,
        taxaAluguelAno: latestRate.taxaAluguelAno,
        taxaAluguelDia: latestRate.taxaAluguelDia ?? new Decimal(0),
        quantidadeDisponivel: latestRate.quantidadeDisponivel
          ? Number(latestRate.quantidadeDisponivel)
          : undefined,
        dataReferencia: latestRate.dataReferencia.toISOString().split('T')[0],
        source: latestRate.source || 'UNKNOWN',
      },
      historico: rates.map((r) => ({
        data: r.dataReferencia.toISOString().split('T')[0],
        taxa: r.taxaAluguelAno,
      })),
      estatisticas: {
        mediaUltimos30Dias: new Decimal(media.toFixed(4)),
        minimo30Dias: new Decimal(minimo.toFixed(4)),
        maximo30Dias: new Decimal(maximo.toFixed(4)),
        tendencia,
      },
    };
  }

  /**
   * Cria um novo registro de taxa de aluguel
   */
  async create(dto: CreateStockLendingRateDto): Promise<StockLendingRate> {
    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${dto.assetId} not found`);
    }

    // Calculate daily rate if not provided
    const taxaAluguelDia =
      dto.taxaAluguelDia ?? dto.taxaAluguelAno.div(this.TRADING_DAYS_PER_YEAR);

    const rate = this.lendingRepository.create({
      ...dto,
      taxaAluguelDia,
      dataReferencia: new Date(dto.dataReferencia),
      dataColeta: new Date(),
    });

    const saved = await this.lendingRepository.save(rate);
    this.logger.log(
      `Created lending rate ${saved.id} for asset ${asset.ticker}: ${dto.taxaAluguelAno}% a.a.`,
    );

    return saved;
  }

  /**
   * Calcula renda estimada de aluguel
   */
  async estimateLendingIncome(
    ticker: string,
    quantidade: number,
  ): Promise<LendingIncomeEstimateDto> {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    // Get latest rate
    const latestRate = await this.lendingRepository.findOne({
      where: { assetId: asset.id },
      order: { dataReferencia: 'DESC' },
    });

    if (!latestRate) {
      throw new NotFoundException(`No lending rate found for ${ticker}`);
    }

    // Get latest price
    const latestPrice = await this.assetPriceRepository.findOne({
      where: { assetId: asset.id },
      order: { date: 'DESC' },
    });

    if (!latestPrice) {
      throw new NotFoundException(`No price data found for ${ticker}`);
    }

    const precoAtual = Number(latestPrice.close);
    const valorTotal = precoAtual * quantidade;
    const taxaAluguelAno = Number(latestRate.taxaAluguelAno);
    const taxaAluguelDia = taxaAluguelAno / this.TRADING_DAYS_PER_YEAR;

    // Calculate estimated income
    const rendaDiaria = (valorTotal * taxaAluguelDia) / 100;
    const rendaMensal = rendaDiaria * 21; // ~21 trading days per month
    const rendaAnual = (valorTotal * taxaAluguelAno) / 100;

    return {
      ticker: asset.ticker,
      quantidade,
      precoAtual: new Decimal(precoAtual.toFixed(2)),
      valorTotal: new Decimal(valorTotal.toFixed(2)),
      taxaAluguelAno: new Decimal(taxaAluguelAno.toFixed(4)),
      rendaDiaria: new Decimal(rendaDiaria.toFixed(2)),
      rendaMensal: new Decimal(rendaMensal.toFixed(2)),
      rendaAnual: new Decimal(rendaAnual.toFixed(2)),
      dataReferencia: latestRate.dataReferencia.toISOString().split('T')[0],
    };
  }

  /**
   * Calcula renda de aluguel para um período específico
   * Usado no backtesting da estratégia WHEEL
   */
  async calculateLendingForPeriod(
    assetId: string,
    startDate: Date,
    endDate: Date,
    sharesHeld: number,
  ): Promise<number> {
    // Get rates for the period
    const rates = await this.lendingRepository.find({
      where: {
        assetId,
        dataReferencia: Between(startDate, endDate),
      },
      order: { dataReferencia: 'ASC' },
    });

    if (rates.length === 0) {
      return 0;
    }

    // Get prices for the period
    const prices = await this.assetPriceRepository.find({
      where: {
        assetId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    if (prices.length === 0) {
      return 0;
    }

    // Calculate daily lending income
    let totalIncome = 0;
    const priceMap = new Map(
      prices.map((p) => [p.date.toISOString().split('T')[0], Number(p.close)]),
    );

    for (const rate of rates) {
      const dateKey = rate.dataReferencia.toISOString().split('T')[0];
      const price = priceMap.get(dateKey);

      if (price) {
        const dailyRate = Number(rate.taxaAluguelDia) / 100;
        const dailyIncome = sharesHeld * price * dailyRate;
        totalIncome += dailyIncome;
      }
    }

    return Number(totalIncome.toFixed(2));
  }

  /**
   * Importa taxas do scraper Python
   */
  async importFromScraper(
    ticker: string,
    scraperData: Array<{
      taxa_aluguel_ano: number;
      taxa_aluguel_dia?: number;
      quantidade_disponivel?: number;
      quantidade_alugada?: number;
      data_referencia: string;
      source_detail?: string;
    }>,
  ): Promise<StockLendingSyncResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Importing ${scraperData.length} lending rates for ${ticker}`);

    // Find asset
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
        // Check for duplicate (asset + data_referencia)
        const exists = await this.lendingRepository.findOne({
          where: {
            assetId: asset.id,
            dataReferencia: new Date(item.data_referencia),
          },
        });

        if (exists) {
          skipped++;
          continue;
        }

        // Calculate daily rate if not provided
        const taxaAluguelDia =
          item.taxa_aluguel_dia ?? item.taxa_aluguel_ano / this.TRADING_DAYS_PER_YEAR;

        // Convert raw numbers to Decimal instances (DecimalTransformer requires Decimal)
        const rate = this.lendingRepository.create({
          assetId: asset.id,
          taxaAluguelAno: new Decimal(item.taxa_aluguel_ano),
          taxaAluguelDia: new Decimal(taxaAluguelDia),
          quantidadeDisponivel: item.quantidade_disponivel,
          quantidadeAlugada: item.quantidade_alugada,
          dataReferencia: new Date(item.data_referencia),
          dataColeta: new Date(),
          source: 'STOCK_LENDING_SCRAPER',
          metadata: item.source_detail ? { custodiante: item.source_detail } : undefined,
        });

        await this.lendingRepository.save(rate);
        imported++;
      } catch (error) {
        errors.push(`Error on ${item.data_referencia}: ${error.message}`);
        this.logger.error(`Failed to import lending rate: ${error.message}`);
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
      source: 'STOCK_LENDING_SCRAPER',
      elapsedTime,
    };
  }

  /**
   * Busca taxas por ticker
   */
  async findByTicker(ticker: string, limit: number = 50): Promise<StockLendingRate[]> {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    return this.lendingRepository.find({
      where: { assetId: asset.id },
      order: { dataReferencia: 'DESC' },
      take: limit,
    });
  }
}
