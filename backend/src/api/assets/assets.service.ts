import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetType, AssetPrice, FundamentalData } from '@database/entities';
import { ScrapersService } from '../../scrapers/scrapers.service';
import { BrapiScraper } from '../../scrapers/fundamental/brapi.scraper';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
    @InjectRepository(FundamentalData)
    private fundamentalDataRepository: Repository<FundamentalData>,
    private scrapersService: ScrapersService,
    private brapiScraper: BrapiScraper,
  ) {}

  async findAll(type?: string) {
    // Build optimized query with LEFT JOIN to get latest 2 prices per asset
    const qb = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect(
        'asset_prices',
        'price1',
        `price1.asset_id = asset.id AND price1.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
        )`
      )
      .leftJoinAndSelect(
        'asset_prices',
        'price2',
        `price2.asset_id = asset.id AND price2.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
            AND p.date < (
              SELECT MAX(p2.date)
              FROM asset_prices p2
              WHERE p2.asset_id = asset.id
            )
        )`
      )
      .addSelect('price1.change', 'price1_change')
      .addSelect('price1.change_percent', 'price1_change_percent')
      .orderBy('asset.ticker', 'ASC');

    if (type) {
      qb.where('asset.type = :type', { type });
    }

    const assets = await qb.getRawAndEntities();

    // Process results to get enriched data from database
    const enrichedAssets = assets.entities.map((asset, index) => {
      const rawData = assets.raw[index];

      const latestClose = rawData?.price1_close;

      if (!latestClose) {
        return {
          ...asset,
          price: null,
          change: null,
          changePercent: null,
          volume: null,
          marketCap: null,
        };
      }

      const price = Number(latestClose);
      // Use change and changePercent from database (collected from BRAPI)
      const change = rawData?.price1_change ? Number(rawData.price1_change) : null;
      const changePercent = rawData?.price1_change_percent ? Number(rawData.price1_change_percent) : null;

      return {
        ...asset,
        price,
        change,
        changePercent,
        volume: rawData?.price1_volume ? Number(rawData.price1_volume) : null,
        marketCap: rawData?.price1_market_cap ? Number(rawData.price1_market_cap) : null,
        currentPrice: {
          date: rawData?.price1_date,
          close: price,
          collectedAt: rawData?.price1_collected_at,
        },
      };
    });

    return enrichedAssets;
  }

  async findByTicker(ticker: string) {
    // Optimized query with LEFT JOIN to get latest 2 prices
    const result = await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect(
        'asset_prices',
        'price1',
        `price1.asset_id = asset.id AND price1.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
        )`
      )
      .leftJoinAndSelect(
        'asset_prices',
        'price2',
        `price2.asset_id = asset.id AND price2.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
            AND p.date < (
              SELECT MAX(p2.date)
              FROM asset_prices p2
              WHERE p2.asset_id = asset.id
            )
        )`
      )
      .where('UPPER(asset.ticker) = :ticker', { ticker: ticker.toUpperCase() })
      .getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    const asset = result.entities[0];
    const rawData = result.raw[0];

    const latestClose = rawData?.price1_close;
    const previousClose = rawData?.price2_close;

    if (!latestClose) {
      return {
        ...asset,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        marketCap: null,
      };
    }

    const price = Number(latestClose);
    // Use change and changePercent from database (collected from BRAPI)
    const change = rawData?.price1_change ? Number(rawData.price1_change) : null;
    const changePercent = rawData?.price1_change_percent ? Number(rawData.price1_change_percent) : null;

    return {
      ...asset,
      price,
      change,
      changePercent,
      volume: rawData?.price1_volume ? Number(rawData.price1_volume) : null,
      marketCap: rawData?.price1_market_cap ? Number(rawData.price1_market_cap) : null,
    };
  }

  async getPriceHistory(ticker: string, startDate?: string, endDate?: string) {
    const asset = await this.findByTicker(ticker);

    const query = this.assetPriceRepository
      .createQueryBuilder('price')
      .where('price.assetId = :assetId', { assetId: asset.id })
      .orderBy('price.date', 'DESC');

    if (startDate) {
      query.andWhere('price.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('price.date <= :endDate', { endDate });
    }

    return query.getMany();
  }

  async syncAsset(ticker: string) {
    this.logger.log(`Starting sync for ${ticker}`);

    try {
      // 1. Find asset in database
      const asset = await this.assetRepository.findOne({
        where: { ticker: ticker.toUpperCase() }
      });

      if (!asset) {
        throw new NotFoundException(`Asset ${ticker} not found`);
      }

      // 2. Fetch data from BRAPI scraper (includes price + historical data)
      const result = await this.brapiScraper.scrape(ticker, '1mo'); // Get last month of data

      if (!result.success || !result.data) {
        this.logger.warn(`Failed to fetch data for ${ticker}: ${result.error || 'unknown error'}`);
        return {
          message: `Failed to fetch data for ${ticker}`,
          ticker,
          status: 'failed',
          error: result.error,
        };
      }

      // 3. Extract price data from BRAPI
      const brapiData = result.data;
      this.logger.log(`BrapiData for ${ticker}: price=${brapiData.price}, volume=${brapiData.volume}, change=${brapiData.change}, changePercent=${brapiData.changePercent}`);

      // 4. Save current day price
      if (brapiData.price && brapiData.volume !== null && brapiData.volume !== undefined) {
        this.logger.log(`Preparing to save price for ${ticker}. Change: ${brapiData.change}, ChangePercent: ${brapiData.changePercent}`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if price already exists for today
        const existingPrice = await this.assetPriceRepository.findOne({
          where: {
            assetId: asset.id,
            date: today,
          }
        });

        const collectedAt = new Date(); // Timestamp da coleta

        this.logger.log(`Price exists for ${ticker}? ${!!existingPrice}`);

        if (!existingPrice) {
          const priceData = this.assetPriceRepository.create({
            asset,
            assetId: asset.id,
            date: today,
            open: brapiData.open || brapiData.price,
            high: brapiData.high || brapiData.price,
            low: brapiData.low || brapiData.price,
            close: brapiData.price,
            volume: brapiData.volume,
            adjustedClose: brapiData.price,
            marketCap: brapiData.marketCap,
            change: brapiData.change,
            changePercent: brapiData.changePercent,
            collectedAt, // Registra quando foi coletado da API
          });

          await this.assetPriceRepository.save(priceData);
          this.logger.log(`✓ Saved price for ${ticker}: R$ ${brapiData.price.toFixed(2)} (collected at ${collectedAt.toISOString()})`);
        } else {
          // Update existing price with latest data
          existingPrice.open = brapiData.open || brapiData.price;
          existingPrice.high = brapiData.high || brapiData.price;
          existingPrice.low = brapiData.low || brapiData.price;
          existingPrice.close = brapiData.price;
          existingPrice.volume = brapiData.volume;
          existingPrice.adjustedClose = brapiData.price;
          existingPrice.marketCap = brapiData.marketCap;
          existingPrice.change = brapiData.change;
          existingPrice.changePercent = brapiData.changePercent;
          existingPrice.collectedAt = collectedAt;

          await this.assetPriceRepository.save(existingPrice);
          this.logger.log(`✓ Updated price for ${ticker}: R$ ${brapiData.price.toFixed(2)} (collected at ${collectedAt.toISOString()})`);
        }
      }

      // 5. Save historical prices if available
      if (brapiData.historicalPrices && brapiData.historicalPrices.length > 0) {
        let savedCount = 0;
        const collectedAt = new Date(); // Mesmo timestamp para todos os históricos

        for (const histPrice of brapiData.historicalPrices.slice(0, 30)) { // Last 30 days
          const priceDate = new Date(histPrice.date);
          priceDate.setHours(0, 0, 0, 0);

          const existing = await this.assetPriceRepository.findOne({
            where: {
              assetId: asset.id,
              date: priceDate,
            }
          });

          if (!existing) {
            const historicalData = this.assetPriceRepository.create({
              asset,
              assetId: asset.id,
              date: priceDate,
              open: histPrice.open,
              high: histPrice.high,
              low: histPrice.low,
              close: histPrice.close,
              volume: histPrice.volume,
              adjustedClose: histPrice.adjustedClose,
              collectedAt, // Registra quando foi coletado
            });

            await this.assetPriceRepository.save(historicalData);
            savedCount++;
          }
        }

        if (savedCount > 0) {
          this.logger.log(`✓ Saved ${savedCount} historical prices for ${ticker}`);
        }
      }

      return {
        message: `Asset ${ticker} synced successfully`,
        ticker,
        status: 'success',
        currentPrice: brapiData.price,
        change: brapiData.change,
        changePercent: brapiData.changePercent,
        source: 'brapi',
      };
    } catch (error) {
      this.logger.error(`Failed to sync ${ticker}: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        message: `Failed to sync ${ticker}`,
        ticker,
        status: 'error',
        error: error.message,
      };
    }
  }

  async syncAllAssets() {
    this.logger.log('Starting sync for all assets');

    try {
      // Get all assets from database
      const assets = await this.assetRepository.find();
      this.logger.log(`Found ${assets.length} assets to sync`);

      const results = {
        total: assets.length,
        success: 0,
        failed: 0,
        startedAt: new Date(),
        completedAt: null as Date | null,
        assets: [] as any[],
      };

      // Sync each asset (in parallel with limit)
      const batchSize = 5; // Process 5 assets at a time to avoid overload
      for (let i = 0; i < assets.length; i += batchSize) {
        const batch = assets.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (asset) => {
            try {
              this.logger.log(`Syncing ${asset.ticker}...`);
              await this.syncAsset(asset.ticker);
              results.success++;
              results.assets.push({
                ticker: asset.ticker,
                status: 'success',
              });
            } catch (error) {
              this.logger.error(`Failed to sync ${asset.ticker}: ${error.message}`);
              results.failed++;
              results.assets.push({
                ticker: asset.ticker,
                status: 'failed',
                error: error.message,
              });
            }
          })
        );
      }

      results.completedAt = new Date();
      this.logger.log(`Sync completed: ${results.success} success, ${results.failed} failed`);

      return results;
    } catch (error) {
      this.logger.error(`Error syncing all assets: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(assetData: Partial<Asset>) {
    const asset = this.assetRepository.create(assetData);
    return this.assetRepository.save(asset);
  }

  async update(ticker: string, assetData: Partial<Asset>) {
    const asset = await this.findByTicker(ticker);
    Object.assign(asset, assetData);
    return this.assetRepository.save(asset);
  }

  /**
   * Populate fundamental data for an asset using scrapers
   * This method scrapes data from multiple sources, validates it, and saves to database
   */
  async populateFundamentalData(ticker: string): Promise<{ success: boolean; message: string; data?: any }> {
    this.logger.log(`Starting fundamental data population for ${ticker}`);

    try {
      // 1. Buscar asset no banco de dados
      const asset = await this.assetRepository.findOne({
        where: { ticker: ticker.toUpperCase() },
      });

      if (!asset) {
        throw new NotFoundException(`Asset ${ticker} not found in database`);
      }

      this.logger.log(`Asset found: ${asset.name} (${asset.ticker})`);

      // 2. Executar scrapers de múltiplas fontes
      this.logger.log(`Executing scrapers for ${ticker} from multiple sources...`);
      const scrapedResult = await this.scrapersService.scrapeFundamentalData(ticker);

      this.logger.log(
        `Scraping completed: ${scrapedResult.sourcesCount} sources, confidence: ${scrapedResult.confidence}`,
      );

      // 3. Validar resultado (mínimo 3 fontes, confidence >= 0.7)
      if (!scrapedResult.isValid) {
        this.logger.warn(
          `Insufficient data quality for ${ticker}: ` +
            `${scrapedResult.sourcesCount} sources (min 3 required), ` +
            `confidence: ${scrapedResult.confidence} (min 0.7 required)`,
        );
        return {
          success: false,
          message: `Insufficient data quality: ${scrapedResult.sourcesCount} sources, confidence ${scrapedResult.confidence.toFixed(2)}`,
          data: {
            sources: scrapedResult.sources,
            sourcesCount: scrapedResult.sourcesCount,
            confidence: scrapedResult.confidence,
            discrepancies: scrapedResult.discrepancies,
          },
        };
      }

      // 4. Mapear dados scraped para estrutura da entidade FundamentalData
      const mappedData = this.mapScraperDataToEntity(scrapedResult.data);
      this.logger.log(`Data mapped successfully with ${Object.keys(mappedData).length} fields`);

      // 5. Salvar dados fundamentalistas no banco
      const fundamentalData = this.fundamentalDataRepository.create({
        asset,
        assetId: asset.id,
        referenceDate: new Date(),
        ...mappedData,
      });

      const saved = await this.fundamentalDataRepository.save(fundamentalData);
      this.logger.log(`Fundamental data saved successfully with ID: ${saved.id}`);

      return {
        success: true,
        message: `Data populated successfully from ${scrapedResult.sourcesCount} sources with ${scrapedResult.confidence.toFixed(2)} confidence`,
        data: {
          ticker,
          assetName: asset.name,
          sources: scrapedResult.sources,
          sourcesCount: scrapedResult.sourcesCount,
          confidence: scrapedResult.confidence,
          dataId: saved.id,
          referenceDate: saved.referenceDate,
          indicators: {
            valuation: {
              pl: mappedData.pl,
              pvp: mappedData.pvp,
              psr: mappedData.psr,
              evEbitda: mappedData.evEbitda,
            },
            profitability: {
              roe: mappedData.roe,
              roa: mappedData.roa,
              roic: mappedData.roic,
              margemLiquida: mappedData.margemLiquida,
            },
            dividends: {
              dividendYield: mappedData.dividendYield,
              payout: mappedData.payout,
            },
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error populating data for ${ticker}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Map scraper data to FundamentalData entity fields
   * Handles field name variations and provides fallbacks
   */
  private mapScraperDataToEntity(scrapedData: any): Partial<FundamentalData> {
    return {
      // Valuation Indicators
      pl: scrapedData.pl || scrapedData.pe || null,
      pvp: scrapedData.pvp || scrapedData.pb || null,
      psr: scrapedData.psr || null,
      pAtivos: scrapedData.pAtivos || scrapedData.pAssets || null,
      pCapitalGiro: scrapedData.pCapitalGiro || scrapedData.pWorkingCapital || null,
      pEbit: scrapedData.pEbit || scrapedData.priceToEbit || null,
      evEbit: scrapedData.evEbit || scrapedData.enterpriseValueToEbit || null,
      evEbitda: scrapedData.evEbitda || scrapedData.enterpriseValueToEbitda || null,
      pegRatio: scrapedData.pegRatio || scrapedData.peg || null,

      // Debt Indicators
      dividaLiquidaPatrimonio: scrapedData.dividaLiquidaPatrimonio || scrapedData.netDebtToEquity || null,
      dividaLiquidaEbitda: scrapedData.dividaLiquidaEbitda || scrapedData.netDebtToEbitda || null,
      dividaLiquidaEbit: scrapedData.dividaLiquidaEbit || scrapedData.netDebtToEbit || null,
      patrimonioLiquidoAtivos: scrapedData.patrimonioLiquidoAtivos || scrapedData.equityToAssets || null,
      passivosAtivos: scrapedData.passivosAtivos || scrapedData.liabilitiesToAssets || null,

      // Efficiency Indicators
      margemBruta: scrapedData.margemBruta || scrapedData.grossMargin || null,
      margemEbit: scrapedData.margemEbit || scrapedData.ebitMargin || null,
      margemEbitda: scrapedData.margemEbitda || scrapedData.ebitdaMargin || null,
      margemLiquida: scrapedData.margemLiquida || scrapedData.netMargin || null,
      roe: scrapedData.roe || scrapedData.returnOnEquity || null,
      roa: scrapedData.roa || scrapedData.returnOnAssets || null,
      roic: scrapedData.roic || scrapedData.returnOnInvestedCapital || null,
      giroAtivos: scrapedData.giroAtivos || scrapedData.assetTurnover || null,

      // Growth Indicators
      cagrReceitas5anos: scrapedData.cagrReceitas5anos || scrapedData.revenueCagr5y || null,
      cagrLucros5anos: scrapedData.cagrLucros5anos || scrapedData.earningsCagr5y || null,

      // Dividend Indicators
      dividendYield: scrapedData.dividendYield || scrapedData.dy || null,
      payout: scrapedData.payout || scrapedData.payoutRatio || null,

      // Financial Statement Data (in millions)
      receitaLiquida: scrapedData.receitaLiquida || scrapedData.revenue || scrapedData.netRevenue || null,
      ebit: scrapedData.ebit || null,
      ebitda: scrapedData.ebitda || null,
      lucroLiquido: scrapedData.lucroLiquido || scrapedData.netIncome || scrapedData.netProfit || null,
      patrimonioLiquido: scrapedData.patrimonioLiquido || scrapedData.equity || scrapedData.shareholderEquity || null,
      ativoTotal: scrapedData.ativoTotal || scrapedData.totalAssets || null,
      dividaBruta: scrapedData.dividaBruta || scrapedData.grossDebt || scrapedData.totalDebt || null,
      dividaLiquida: scrapedData.dividaLiquida || scrapedData.netDebt || null,
      disponibilidades: scrapedData.disponibilidades || scrapedData.cash || scrapedData.cashAndEquivalents || null,

      // Store original data and metadata
      metadata: {
        originalData: scrapedData,
        sources: scrapedData.sources || [],
        scrapedAt: new Date().toISOString(),
        confidence: scrapedData.confidence || null,
        discrepancies: scrapedData.discrepancies || [],
      },
    };
  }
}
