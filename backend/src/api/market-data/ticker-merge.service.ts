import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TickerChange } from '../../database/entities/ticker-change.entity';
import { AssetPrice } from '../../database/entities/asset-price.entity';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class TickerMergeService {
  private readonly logger = new Logger(TickerMergeService.name);

  constructor(
    @InjectRepository(TickerChange)
    private tickerChangeRepository: Repository<TickerChange>,
    private assetsService: AssetsService,
  ) {}

  /**
   * Find the chain of ticker changes for a given ticker
   * e.g., if querying AXIA3, might return [ELET3, AXIA3]
   */
  async findTickerChain(ticker: string): Promise<string[]> {
    const chain: string[] = [ticker];
    let currentTicker = ticker;

    // 1. Look backwards (what did this ticker used to be?)
    while (true) {
      const change = await this.tickerChangeRepository.findOne({
        where: { newTicker: currentTicker },
      });

      if (!change) break;

      chain.unshift(change.oldTicker);
      currentTicker = change.oldTicker;
    }

    // 2. Look forwards (what did this ticker become?)
    // Note: Usually we query by the current ticker, so backward search is more common,
    // but forward search handles cases where we query an old ticker.
    currentTicker = ticker;
    while (true) {
      const change = await this.tickerChangeRepository.findOne({
        where: { oldTicker: currentTicker },
      });

      if (!change) break;

      chain.push(change.newTicker);
      currentTicker = change.newTicker;
    }

    // Remove duplicates
    return [...new Set(chain)];
  }

  /**
   * Get unified price history for a ticker, including its predecessors
   */
  async getUnifiedHistory(ticker: string, query: any): Promise<AssetPrice[]> {
    const chain = await this.findTickerChain(ticker);

    if (chain.length <= 1) {
      // No changes, just return normal history
      return this.assetsService.getPriceHistory(ticker, query);
    }

    this.logger.log(`Fetching unified history for chain: ${chain.join(' -> ')}`);

    // Fetch history for all tickers in chain
    const histories = await Promise.all(
      chain.map((t) => this.assetsService.getPriceHistory(t, query).catch(() => [])),
    );

    // Merge and sort
    const allPrices = histories
      .flat()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter duplicates (prefer newer ticker data if overlap)
    const uniquePrices = new Map<string, AssetPrice>();
    allPrices.forEach((price) => {
      const dateStr = new Date(price.date).toISOString().split('T')[0];
      uniquePrices.set(dateStr, price);
    });

    return Array.from(uniquePrices.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }
}
