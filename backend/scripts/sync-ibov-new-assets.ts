import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AssetsService } from '../src/api/assets/assets.service';

/**
 * Script para sincronizar dados dos novos ativos do IBOV
 *
 * Usage: ts-node -r tsconfig-paths/register scripts/sync-ibov-new-assets.ts
 */

const NEW_IBOV_TICKERS = [
  'ALOS3',  'ASAI3',  'AURE3',  'AXIA3',
  'AXIA6',  'AZZA3',  'BBSE3',  'BBDC3',
  'BRKM5',  'BRAV3',  'BPAC11', 'CXSE3',
  'CEAB3',  'COGN3',
];

async function syncNewAssets() {
  console.log('🔄 Iniciando sincronização dos novos ativos do IBOV...\n');
  console.log(`📊 Total de ativos a sincronizar: ${NEW_IBOV_TICKERS.length}\n`);
  console.log('─'.repeat(80));

  const app = await NestFactory.createApplicationContext(AppModule);
  const assetsService = app.get(AssetsService);

  let synced = 0;
  let failed = 0;

  for (const ticker of NEW_IBOV_TICKERS) {
    try {
      process.stdout.write(`Syncing ${ticker.padEnd(10)}... `);

      const result = await assetsService.syncAsset(ticker);

      if (result.status === 'success') {
        synced++;
        const price = result.currentPrice ? `R$ ${result.currentPrice.toFixed(2)}` : 'N/A';
        console.log(`✅ OK - ${price}`);
      } else {
        failed++;
        console.log(`❌ ERRO - ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      failed++;
      console.log(`❌ ERRO - ${error.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('─'.repeat(80));
  console.log('\n📈 RESUMO DA SINCRONIZAÇÃO:\n');
  console.log(`✅ Sincronizados com sucesso: ${synced}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log('\n✅ Sincronização concluída!\n');

  await app.close();
}

syncNewAssets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
