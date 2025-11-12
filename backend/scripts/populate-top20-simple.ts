import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Asset } from '../src/database/entities/asset.entity';

/**
 * Script SIMPLIFICADO para testar scrapers e popular dados
 * Versão 1: Apenas testa se os scrapers funcionam e mostra os dados
 */

const TOP_20_TICKERS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
  'MGLU3', 'B3SA3', 'RENT3', 'WEGE3', 'SUZB3',
  'RAIL3', 'GGBR4', 'RADL3', 'JBSS3', 'EMBR3',
  'LREN3', 'SANB11', 'VIVT3', 'EGIE3', 'EQTL3',
];

async function main() {
  console.log('🚀 Initializing application...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const dataSource = app.get(DataSource);
  const scrapersService = app.get('ScrapersService');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST SCRAPERS - TOP 20 B3 ASSETS');
  console.log('═══════════════════════════════════════════════════════════\n');

  let successCount = 0;
  let failCount = 0;

  // Test only first 3 assets to start
  const testTickers = TOP_20_TICKERS.slice(0, 3);

  for (const ticker of testTickers) {
    try {
      console.log(`\n📊 Testing ${ticker}...`);

      const result = await scrapersService.scrapeFundamentalData(ticker);

      if (result.isValid && result.data) {
        console.log(`   ✅ SUCCESS`);
        console.log(`      Sources: ${result.sourcesCount} (${result.sources.join(', ')})`);
        console.log(`      Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`      Sample data:`);
        console.log(`        - P/L: ${result.data.pl || result.data.pe || 'N/A'}`);
        console.log(`        - P/VP: ${result.data.pvp || result.data.pb || 'N/A'}`);
        console.log(`        - ROE: ${result.data.roe || 'N/A'}%`);
        console.log(`        - Div Yield: ${result.data.dividendYield || result.data.dy || 'N/A'}%`);
        console.log(`        - Cotação: R$ ${result.data.cotacao || result.data.price || 'N/A'}`);
        successCount++;
      } else {
        console.log(`   ❌ FAILED`);
        console.log(`      Sources: ${result.sourcesCount}`);
        console.log(`      Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        failCount++;
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ Success: ${successCount}/${testTickers.length}`);
  console.log(`❌ Failed:  ${failCount}/${testTickers.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await app.close();
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
