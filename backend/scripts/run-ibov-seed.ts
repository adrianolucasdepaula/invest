import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { seedIbovNewAssets } from '../src/database/seeds/ibov-new-assets.seed';

/**
 * Script to run IBOV new assets seed
 *
 * Usage: ts-node -r tsconfig-paths/register scripts/run-ibov-seed.ts
 */

async function runSeed() {
  console.log('🌱 Iniciando seed de novos ativos do IBOV...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    await seedIbovNewAssets(dataSource);
    console.log('\n✅ Seed executado com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao executar seed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
