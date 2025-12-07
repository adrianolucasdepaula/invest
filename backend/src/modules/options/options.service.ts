import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { OptionPrice, OptionType, OptionStatus, OptionStyle } from '../../database/entities';

export interface CreateOptionPriceDto {
  ticker: string;
  underlyingAssetId: string;
  type: OptionType;
  style?: OptionStyle;
  strike: number;
  expirationDate: Date;
  lastPrice?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  underlyingPrice?: number;
  source?: string;
}

export interface OptionChainFilter {
  underlyingAssetId?: string;
  type?: OptionType;
  expirationDate?: Date;
  minStrike?: number;
  maxStrike?: number;
  inTheMoney?: boolean;
  status?: OptionStatus;
}

export interface OptionChainSummary {
  underlyingAssetId: string;
  underlyingTicker: string;
  expirationDates: Date[];
  totalCalls: number;
  totalPuts: number;
  totalOpenInterest: number;
  totalVolume: number;
  putCallRatio: number;
  maxPain?: number;
}

@Injectable()
export class OptionsService {
  private readonly logger = new Logger(OptionsService.name);

  constructor(
    @InjectRepository(OptionPrice)
    private readonly optionRepository: Repository<OptionPrice>,
  ) {}

  async create(dto: CreateOptionPriceDto): Promise<OptionPrice> {
    this.logger.log(`Creating option: ${dto.ticker}`);

    const intrinsicValue = this.calculateIntrinsicValue(
      dto.type,
      dto.strike,
      dto.underlyingPrice || 0,
    );

    const option = this.optionRepository.create({
      ...dto,
      style: dto.style || OptionStyle.AMERICAN,
      status: OptionStatus.ACTIVE,
      intrinsicValue,
      extrinsicValue: dto.lastPrice ? dto.lastPrice - intrinsicValue : null,
      inTheMoney: intrinsicValue > 0,
      daysToExpiration: this.calculateDaysToExpiration(dto.expirationDate),
      quoteTime: new Date(),
    });

    return this.optionRepository.save(option);
  }

  async upsertOption(dto: CreateOptionPriceDto): Promise<OptionPrice> {
    const existing = await this.optionRepository.findOne({
      where: {
        ticker: dto.ticker,
        expirationDate: dto.expirationDate,
      },
    });

    if (existing) {
      Object.assign(existing, dto);
      existing.intrinsicValue = this.calculateIntrinsicValue(
        dto.type,
        dto.strike,
        dto.underlyingPrice || existing.underlyingPrice || 0,
      );
      existing.extrinsicValue = dto.lastPrice
        ? dto.lastPrice - existing.intrinsicValue
        : existing.extrinsicValue;
      existing.inTheMoney = existing.intrinsicValue > 0;
      existing.daysToExpiration = this.calculateDaysToExpiration(dto.expirationDate);
      existing.quoteTime = new Date();
      return this.optionRepository.save(existing);
    }

    return this.create(dto);
  }

  async findById(id: string): Promise<OptionPrice> {
    const option = await this.optionRepository.findOne({
      where: { id },
      relations: ['underlyingAsset'],
    });

    if (!option) {
      throw new NotFoundException(`Option ${id} not found`);
    }

    return option;
  }

  async findByTicker(ticker: string): Promise<OptionPrice | null> {
    return this.optionRepository.findOne({
      where: { ticker },
      relations: ['underlyingAsset'],
    });
  }

  async getOptionChain(
    underlyingAssetId: string,
    expirationDate?: Date,
  ): Promise<{ calls: OptionPrice[]; puts: OptionPrice[] }> {
    const where: any = {
      underlyingAssetId,
      status: OptionStatus.ACTIVE,
    };

    if (expirationDate) {
      where.expirationDate = expirationDate;
    }

    const options = await this.optionRepository.find({
      where,
      relations: ['underlyingAsset'],
      order: { strike: 'ASC' },
    });

    return {
      calls: options.filter((o) => o.type === OptionType.CALL),
      puts: options.filter((o) => o.type === OptionType.PUT),
    };
  }

  async findOptions(filter: OptionChainFilter): Promise<OptionPrice[]> {
    const queryBuilder = this.optionRepository
      .createQueryBuilder('option')
      .leftJoinAndSelect('option.underlyingAsset', 'asset');

    if (filter.underlyingAssetId) {
      queryBuilder.andWhere('option.underlyingAssetId = :assetId', {
        assetId: filter.underlyingAssetId,
      });
    }

    if (filter.type) {
      queryBuilder.andWhere('option.type = :type', { type: filter.type });
    }

    if (filter.expirationDate) {
      queryBuilder.andWhere('option.expirationDate = :expDate', {
        expDate: filter.expirationDate,
      });
    }

    if (filter.minStrike !== undefined) {
      queryBuilder.andWhere('option.strike >= :minStrike', {
        minStrike: filter.minStrike,
      });
    }

    if (filter.maxStrike !== undefined) {
      queryBuilder.andWhere('option.strike <= :maxStrike', {
        maxStrike: filter.maxStrike,
      });
    }

    if (filter.inTheMoney !== undefined) {
      queryBuilder.andWhere('option.inTheMoney = :itm', {
        itm: filter.inTheMoney,
      });
    }

    if (filter.status) {
      queryBuilder.andWhere('option.status = :status', {
        status: filter.status,
      });
    }

    return queryBuilder.orderBy('option.strike', 'ASC').getMany();
  }

  async getExpirationDates(underlyingAssetId: string): Promise<Date[]> {
    const result = await this.optionRepository
      .createQueryBuilder('option')
      .select('DISTINCT option.expirationDate', 'expirationDate')
      .where('option.underlyingAssetId = :assetId', { assetId: underlyingAssetId })
      .andWhere('option.status = :status', { status: OptionStatus.ACTIVE })
      .andWhere('option.expirationDate >= :today', { today: new Date() })
      .orderBy('option.expirationDate', 'ASC')
      .getRawMany();

    return result.map((r) => r.expirationDate);
  }

  async getChainSummary(underlyingAssetId: string): Promise<OptionChainSummary> {
    const options = await this.optionRepository.find({
      where: {
        underlyingAssetId,
        status: OptionStatus.ACTIVE,
      },
      relations: ['underlyingAsset'],
    });

    const calls = options.filter((o) => o.type === OptionType.CALL);
    const puts = options.filter((o) => o.type === OptionType.PUT);

    const expirationDates = [...new Set(options.map((o) => o.expirationDate.toISOString()))]
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const totalOpenInterest = options.reduce((sum, o) => sum + (o.openInterest || 0), 0);
    const totalVolume = options.reduce((sum, o) => sum + (o.volume || 0), 0);

    const callOI = calls.reduce((sum, o) => sum + (o.openInterest || 0), 0);
    const putOI = puts.reduce((sum, o) => sum + (o.openInterest || 0), 0);

    return {
      underlyingAssetId,
      underlyingTicker: options[0]?.underlyingAsset?.ticker || '',
      expirationDates,
      totalCalls: calls.length,
      totalPuts: puts.length,
      totalOpenInterest,
      totalVolume,
      putCallRatio: callOI > 0 ? putOI / callOI : 0,
      maxPain: this.calculateMaxPain(options),
    };
  }

  async expireOptions(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.optionRepository.update(
      {
        status: OptionStatus.ACTIVE,
        expirationDate: LessThanOrEqual(today),
      },
      { status: OptionStatus.EXPIRED },
    );

    const affected = result.affected || 0;
    if (affected > 0) {
      this.logger.log(`Expired ${affected} options`);
    }

    return affected;
  }

  async updateGreeks(id: string, greeks: {
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    rho?: number;
    impliedVolatility?: number;
  }): Promise<OptionPrice> {
    const option = await this.findById(id);
    Object.assign(option, greeks);
    return this.optionRepository.save(option);
  }

  private calculateIntrinsicValue(
    type: OptionType,
    strike: number,
    underlyingPrice: number,
  ): number {
    if (type === OptionType.CALL) {
      return Math.max(0, underlyingPrice - strike);
    } else {
      return Math.max(0, strike - underlyingPrice);
    }
  }

  private calculateDaysToExpiration(expirationDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private calculateMaxPain(options: OptionPrice[]): number | undefined {
    if (options.length === 0) return undefined;

    const strikes = [...new Set(options.map((o) => o.strike))].sort((a, b) => a - b);
    let minPain = Infinity;
    let maxPainStrike = strikes[0];

    for (const strike of strikes) {
      let totalPain = 0;

      for (const option of options) {
        const oi = option.openInterest || 0;
        if (option.type === OptionType.CALL) {
          totalPain += Math.max(0, strike - option.strike) * oi;
        } else {
          totalPain += Math.max(0, option.strike - strike) * oi;
        }
      }

      if (totalPain < minPain) {
        minPain = totalPain;
        maxPainStrike = strike;
      }
    }

    return maxPainStrike;
  }
}
