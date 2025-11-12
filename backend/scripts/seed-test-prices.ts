import { DataSource } from 'typeorm';
import { Asset, AssetPrice } from '../src/database/entities';

// Sample test price data with different variations to test sorting
const TEST_PRICES = [
  // High performers
  { ticker: 'MGLU3', close: 12.50, previousClose: 10.00, volume: 15000000 },
  { ticker: 'RENT3', close: 45.80, previousClose: 42.00, volume: 8000000 },
  { ticker: 'WEGE3', close: 38.90, previousClose: 36.50, volume: 12000000 },
  { ticker: 'VALE3', close: 65.20, previousClose: 62.00, volume: 25000000 },

  // Medium performers
  { ticker: 'ITUB4', close: 28.30, previousClose: 27.50, volume: 20000000 },
  { ticker: 'BBDC4', close: 15.75, previousClose: 15.50, volume: 18000000 },
  { ticker: 'PETR4', close: 38.45, previousClose: 38.00, volume: 30000000 },
  { ticker: 'B3SA3', close: 11.80, previousClose: 11.70, volume: 10000000 },

  // Low performers or stable
  { ticker: 'ABEV3', close: 13.20, previousClose: 13.25, volume: 22000000 },
  { ticker: 'BBAS3', close: 26.50, previousClose: 27.00, volume: 15000000 },
  { ticker: 'JBSS3', close: 19.80, previousClose: 20.50, volume: 9000000 },
  { ticker: 'LREN3', close: 16.40, previousClose: 17.00, volume: 7000000 },
];

async function seedTestPrices() {
  // Create TypeORM connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5532'),
    username: process.env.DB_USER || 'invest_user',
    password: process.env.DB_PASSWORD || 'invest_pass_2024',
    database: process.env.DB_NAME || 'invest_platform_db',
    entities: [Asset, AssetPrice],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    const assetRepository = dataSource.getRepository(Asset);
    const priceRepository = dataSource.getRepository(AssetPrice);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let inserted = 0;
    let failed = 0;

    for (const priceData of TEST_PRICES) {
      try {
        // Find asset
        const asset = await assetRepository.findOne({
          where: { ticker: priceData.ticker }
        });

        if (!asset) {
          console.log(`⚠ Asset ${priceData.ticker} not found, skipping...`);
          failed++;
          continue;
        }

        // Insert today's price
        const todayPrice = priceRepository.create({
          asset,
          assetId: asset.id,
          date: today,
          open: priceData.previousClose * 1.001,
          high: priceData.close * 1.005,
          low: priceData.previousClose * 0.998,
          close: priceData.close,
          volume: priceData.volume,
          adjustedClose: priceData.close,
        });

        await priceRepository.save(todayPrice);

        // Insert yesterday's price for comparison
        const yesterdayPrice = priceRepository.create({
          asset,
          assetId: asset.id,
          date: yesterday,
          open: priceData.previousClose * 0.995,
          high: priceData.previousClose * 1.002,
          low: priceData.previousClose * 0.992,
          close: priceData.previousClose,
          volume: priceData.volume * 0.9,
          adjustedClose: priceData.previousClose,
        });

        await priceRepository.save(yesterdayPrice);

        const change = priceData.close - priceData.previousClose;
        const changePercent = ((change / priceData.previousClose) * 100).toFixed(2);
        console.log(`✓ ${priceData.ticker}: R$ ${priceData.close.toFixed(2)} (${changePercent}%)`);
        inserted++;
      } catch (error) {
        console.error(`✗ Error inserting ${priceData.ticker}:`, error.message);
        failed++;
      }
    }

    console.log(`\n📊 Seed completed:`);
    console.log(`   - Inserted: ${inserted} assets`);
    console.log(`   - Failed: ${failed} assets`);
    console.log(`   - Total prices created: ${inserted * 2} (today + yesterday)`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedTestPrices();
