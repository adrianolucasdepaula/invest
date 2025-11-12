import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BrapiScraper } from '../src/scrapers/fundamental/brapi.scraper';

/**
 * Script para testar disponibilidade de ativos no BRAPI
 *
 * Uso: ts-node -r tsconfig-paths/register scripts/test-brapi-availability.ts
 */

const NEW_IBOV_TICKERS = [
  // Novos ativos encontrados na página 1 do IBOV
  'ALOS3',  // ALLOS
  'ASAI3',  // ASSAI
  'AURE3',  // AUREN
  'AXIA3',  // AXIA ENERGIA ON
  'AXIA6',  // AXIA ENERGIA PNB
  'AZZA3',  // AZZAS 2154
  'BBSE3',  // BBSEGURIDADE
  'BBDC3',  // BRADESCO ON (temos BBDC4 PN)
  'BRKM5',  // BRASKEM
  'BRAV3',  // BRAVA
  'BPAC11', // BTGP BANCO
  'CXSE3',  // CAIXA SEGURI
  'CEAB3',  // CEA MODAS
  'COGN3',  // COGNA ON
];

interface TestResult {
  ticker: string;
  available: boolean;
  statusCode?: number;
  error?: string;
  price?: number;
  name?: string;
}

async function testBrapiAvailability() {
  console.log('🔍 Iniciando teste de disponibilidade no BRAPI...\n');
  console.log(`📊 Total de ativos a testar: ${NEW_IBOV_TICKERS.length}\n`);
  console.log('─'.repeat(80));

  const app = await NestFactory.createApplicationContext(AppModule);
  const brapiScraper = app.get(BrapiScraper);

  const results: TestResult[] = [];
  let availableCount = 0;
  let unavailableCount = 0;

  for (const ticker of NEW_IBOV_TICKERS) {
    try {
      process.stdout.write(`Testing ${ticker.padEnd(10)}... `);

      const result = await brapiScraper.scrape(ticker, '1d');

      if (result.success && result.data) {
        availableCount++;
        console.log(`✅ OK - R$ ${result.data.price?.toFixed(2) || 'N/A'} - ${result.data.name || ticker}`);

        results.push({
          ticker,
          available: true,
          price: result.data.price,
          name: result.data.name,
        });
      } else {
        unavailableCount++;
        console.log(`❌ ERRO - ${result.error || 'Sem dados'}`);

        results.push({
          ticker,
          available: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      unavailableCount++;
      const statusCode = error.response?.status;
      console.log(`❌ ERRO ${statusCode || ''} - ${error.message}`);

      results.push({
        ticker,
        available: false,
        statusCode,
        error: error.message,
      });
    }

    // Pequeno delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('─'.repeat(80));
  console.log('\n📈 RESUMO DOS TESTES:\n');
  console.log(`✅ Disponíveis: ${availableCount} (${((availableCount/NEW_IBOV_TICKERS.length)*100).toFixed(1)}%)`);
  console.log(`❌ Indisponíveis: ${unavailableCount} (${((unavailableCount/NEW_IBOV_TICKERS.length)*100).toFixed(1)}%)`);

  console.log('\n📋 ATIVOS DISPONÍVEIS PARA ADICIONAR:\n');
  const available = results.filter(r => r.available);
  if (available.length > 0) {
    available.forEach(r => {
      console.log(`  ${r.ticker.padEnd(10)} - ${r.name || 'N/A'} - R$ ${r.price?.toFixed(2) || 'N/A'}`);
    });
  } else {
    console.log('  Nenhum ativo disponível');
  }

  console.log('\n❌ ATIVOS INDISPONÍVEIS:\n');
  const unavailable = results.filter(r => !r.available);
  if (unavailable.length > 0) {
    unavailable.forEach(r => {
      console.log(`  ${r.ticker.padEnd(10)} - ${r.error || 'Erro desconhecido'}`);
    });
  } else {
    console.log('  Todos disponíveis!');
  }

  console.log('\n─'.repeat(80));
  console.log('✅ Teste concluído!\n');

  await app.close();

  return results;
}

testBrapiAvailability()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro ao executar teste:', error);
    process.exit(1);
  });
