import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScrapersService } from '../src/scrapers/scrapers.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Asset } from '../src/database/entities/asset.entity';
import { FundamentalData } from '../src/database/entities/fundamental-data.entity';
import { AssetPrice } from '../src/database/entities/asset-price.entity';

/**
 * Script para popular dados fundamentais e preços das Top 20 ações B3
 *
 * Execução: npm run populate:top20
 *
 * O que faz:
 * 1. Busca as 20 ações do banco
 * 2. Para cada ação, executa scrapers (Fundamentus, BRAPI, StatusInvest, Investidor10)
 * 3. Salva dados fundamentais
 * 4. Salva preços históricos (se disponível)
 */

const TOP_20_TICKERS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
  'MGLU3', 'B3SA3', 'RENT3', 'WEGE3', 'SUZB3',
  'RAIL3', 'GGBR4', 'RADL3', 'JBSS3', 'EMBR3',
  'LREN3', 'SANB11', 'VIVT3', 'EGIE3', 'EQTL3',
];

class PopulateDataScript {
  private scrapersService: ScrapersService;
  private assetRepository: Repository<Asset>;
  private fundamentalRepository: Repository<FundamentalData>;
  private priceRepository: Repository<AssetPrice>;
  private dataSource: DataSource;

  async initialize() {
    console.log('🚀 Initializing NestJS application...\n');

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    this.scrapersService = app.get(ScrapersService);
    this.dataSource = app.get(DataSource);
    this.assetRepository = this.dataSource.getRepository(Asset);
    this.fundamentalRepository = this.dataSource.getRepository(FundamentalData);
    this.priceRepository = this.dataSource.getRepository(AssetPrice);

    console.log('✅ Application initialized\n');

    return app;
  }

  async populateAssetData(ticker: string): Promise<boolean> {
    try {
      console.log(`\n📊 Processing ${ticker}...`);

      // 1. Find asset in database
      const asset = await this.assetRepository.findOne({ where: { ticker } });

      if (!asset) {
        console.log(`   ⚠️  Asset ${ticker} not found in database, skipping`);
        return false;
      }

      // 2. Scrape fundamental data from multiple sources
      console.log(`   🔍 Scraping fundamental data from 4 sources...`);
      const fundamentalResult = await this.scrapersService.scrapeFundamentalData(ticker);

      if (!fundamentalResult.isValid || !fundamentalResult.data) {
        console.log(`   ❌ Failed to scrape valid data for ${ticker}`);
        console.log(`      Sources: ${fundamentalResult.sourcesCount}/${4}`);
        console.log(`      Confidence: ${(fundamentalResult.confidence * 100).toFixed(1)}%`);
        return false;
      }

      console.log(`   ✅ Scraped data from ${fundamentalResult.sourcesCount} sources`);
      console.log(`      Confidence: ${(fundamentalResult.confidence * 100).toFixed(1)}%`);
      console.log(`      Sources: ${fundamentalResult.sources.join(', ')}`);

      // 3. Save fundamental data
      const fundamentalData = this.fundamentalRepository.create({
        assetId: asset.id,
        referenceDate: new Date(),

        // Valuation indicators
        pl: fundamentalResult.data.pl || fundamentalResult.data.pe || null,
        pvp: fundamentalResult.data.pvp || fundamentalResult.data.pb || null,
        psr: fundamentalResult.data.psr || null,
        dividendYield: fundamentalResult.data.dividendYield || fundamentalResult.data.dy || null,
        evEbitda: fundamentalResult.data.evEbitda || null,
        evEbit: fundamentalResult.data.evEbit || null,

        // Profitability indicators
        roe: fundamentalResult.data.roe || null,
        roa: fundamentalResult.data.roa || null,
        roic: fundamentalResult.data.roic || null,
        margemLiquida: fundamentalResult.data.margemLiquida || fundamentalResult.data.netMargin || null,
        margemBruta: fundamentalResult.data.margemBruta || fundamentalResult.data.grossMargin || null,
        margemEbit: fundamentalResult.data.margemEbit || fundamentalResult.data.ebitMargin || null,

        // Liquidity
        liquidezCorrente: fundamentalResult.data.liquidezCorrente || fundamentalResult.data.currentRatio || null,

        // Absolute values (in millions)
        valorMercado: fundamentalResult.data.valorMercado || fundamentalResult.data.marketCap || null,
        receitaLiquida: fundamentalResult.data.receitaLiquida || fundamentalResult.data.revenue || null,
        lucroLiquido: fundamentalResult.data.lucroLiquido || fundamentalResult.data.netIncome || null,
        ebitda: fundamentalResult.data.ebitda || null,
        ebit: fundamentalResult.data.ebit || null,
        ativoTotal: fundamentalResult.data.ativoTotal || fundamentalResult.data.totalAssets || null,
        patrimonioLiquido: fundamentalResult.data.patrimonioLiquido || fundamentalResult.data.shareholderEquity || null,
        disponibilidades: fundamentalResult.data.disponibilidades || fundamentalResult.data.cash || null,
        dividaBruta: fundamentalResult.data.dividaBruta || fundamentalResult.data.debt || null,
      });

      await this.fundamentalRepository.save(fundamentalData);
      console.log(`   💾 Saved fundamental data to database`);

      // 4. Save current price if available
      const currentPrice = fundamentalResult.data.cotacao || fundamentalResult.data.price || fundamentalResult.data.regularMarketPrice;

      if (currentPrice && currentPrice > 0) {
        const priceData = this.priceRepository.create({
          assetId: asset.id,
          date: new Date(),
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          volume: fundamentalResult.data.volume || 0,
          adjustedClose: currentPrice,
        });

        await this.priceRepository.save(priceData);
        console.log(`   💰 Saved current price: R$ ${currentPrice.toFixed(2)}`);
      }

      console.log(`   ✅ ${ticker} completed successfully!`);
      return true;

    } catch (error) {
      console.error(`   ❌ Error processing ${ticker}:`, error.message);
      return false;
    }
  }

  async run() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  POPULATE TOP 20 B3 ASSETS - FUNDAMENTAL DATA & PRICES');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📋 Assets to process: ${TOP_20_TICKERS.length}`);
    console.log(`🔍 Scrapers: Fundamentus, BRAPI, StatusInvest, Investidor10\n`);

    let successCount = 0;
    let failCount = 0;

    const startTime = Date.now();

    for (const ticker of TOP_20_TICKERS) {
      const success = await this.populateAssetData(ticker);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Success: ${successCount}/${TOP_20_TICKERS.length}`);
    console.log(`❌ Failed:  ${failCount}/${TOP_20_TICKERS.length}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Average: ${(parseFloat(duration) / TOP_20_TICKERS.length).toFixed(1)}s per asset`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Show database stats
    const fundamentalCount = await this.fundamentalRepository.count();
    const priceCount = await this.priceRepository.count();

    console.log('📈 Database Stats:');
    console.log(`   Fundamental Data Records: ${fundamentalCount}`);
    console.log(`   Price Records: ${priceCount}`);
    console.log('');
  }
}

async function main() {
  const script = new PopulateDataScript();

  try {
    const app = await script.initialize();
    await script.run();
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
