import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AssetsService } from '../src/api/assets/assets.service';

/**
 * Script para popular dados históricos completos de ativos
 * Usa BRAPI com range='3mo' (máximo permitido no plano gratuito)
 *
 * Uso:
 * - Sync específico: ts-node scripts/sync-historical-data.ts ABEV3
 * - Sync múltiplos: ts-node scripts/sync-historical-data.ts ABEV3 CMIG4 CYRE3
 * - Sync TODOS: ts-node scripts/sync-historical-data.ts --all
 */
async function main() {
  console.log('🚀 Starting historical data sync script...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const assetsService = app.get(AssetsService);

  const args = process.argv.slice(2);

  try {
    if (args.length === 0) {
      console.error('❌ Error: No tickers provided');
      console.log('\nUsage:');
      console.log('  ts-node scripts/sync-historical-data.ts ABEV3 CMIG4 CYRE3');
      console.log('  ts-node scripts/sync-historical-data.ts --all');
      process.exit(1);
    }

    let tickers: string[] = [];

    if (args[0] === '--all') {
      console.log('📊 Syncing ALL assets with range=3mo...\n');
      const result = await assetsService.syncAllAssets('3mo');
      console.log('\n✅ Sync completed:');
      console.log(`   Total: ${result.total}`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Failed: ${result.failed}`);
      console.log(`   Duration: ${(new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()) / 1000}s`);

      if (result.failed > 0) {
        console.log('\n❌ Failed assets:');
        result.assets.filter(a => a.status === 'failed').forEach(a => {
          console.log(`   - ${a.ticker}: ${a.error}`);
        });
      }
    } else {
      tickers = args;
      console.log(`📊 Syncing ${tickers.length} assets with range=3mo...`);
      console.log(`   Tickers: ${tickers.join(', ')}\n`);

      const results = [];

      for (const ticker of tickers) {
        console.log(`⏳ Syncing ${ticker}...`);
        const startTime = Date.now();

        try {
          const result = await assetsService.syncAsset(ticker, '3mo');
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);

          console.log(`   ✅ Success (${duration}s)`);
          console.log(`      Price: R$ ${result.currentPrice}`);
          console.log(`      Change: ${result.change >= 0 ? '+' : ''}${result.change} (${result.changePercent >= 0 ? '+' : ''}${result.changePercent}%)`);

          results.push({ ticker, status: 'success', duration });
        } catch (error) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`   ❌ Failed (${duration}s): ${error.message}`);
          results.push({ ticker, status: 'failed', error: error.message, duration });
        }

        console.log('');
      }

      // Summary
      const successCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      console.log('📋 Summary:');
      console.log(`   Total: ${results.length}`);
      console.log(`   Success: ${successCount}`);
      console.log(`   Failed: ${failedCount}`);

      if (failedCount > 0) {
        console.log('\n❌ Failed tickers:');
        results.filter(r => r.status === 'failed').forEach(r => {
          console.log(`   - ${r.ticker}: ${r.error}`);
        });
      }
    }

    console.log('\n✨ Script completed!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
