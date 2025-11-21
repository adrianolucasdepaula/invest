import { DataSource as TypeORMDataSource } from 'typeorm';
import { Analysis } from '../entities/analysis.entity';
import { Asset } from '../entities/asset.entity';
import { AssetPrice } from '../entities/asset-price.entity';
import { User } from '../entities/user.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { PortfolioPosition } from '../entities/portfolio-position.entity';
import { FundamentalData } from '../entities/fundamental-data.entity';
import { ScrapedData } from '../entities/scraped-data.entity';
import { DataSource } from '../entities/data-source.entity';
import { UpdateLog } from '../entities/update-log.entity';

/**
 * Script para limpeza de análises antigas/sujas do banco de dados
 *
 * Remove:
 * 1. Análises de ativos inativos
 * 2. Análises com status "failed" (>7 dias)
 * 3. Análises com status "pending" travadas (>1 hora)
 * 4. (Opcional) Análises muito antigas (>90 dias)
 *
 * Uso: npm run cleanup:analyses
 */

interface CleanupStats {
  inactiveAssets: number;
  failedOld: number;
  pendingStuck: number;
  veryOld: number;
  total: number;
}

async function getStatisticsBeforeCleanup(dataSource: TypeORMDataSource): Promise<void> {
  console.log('\n========================================');
  console.log('📊 ESTATÍSTICAS ANTES DA LIMPEZA');
  console.log('========================================\n');

  // Total de análises
  const totalAnalyses = await dataSource.getRepository(Analysis).count();
  console.log(`Total de análises no banco: ${totalAnalyses}`);

  // Análises por status
  const byStatus = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .select('analysis.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .groupBy('analysis.status')
    .getRawMany();

  console.log('\nPor status:');
  byStatus.forEach(({ status, count }) => {
    console.log(`  - ${status}: ${count}`);
  });

  // Análises por tipo
  const byType = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .select('analysis.type', 'type')
    .addSelect('COUNT(*)', 'count')
    .groupBy('analysis.type')
    .getRawMany();

  console.log('\nPor tipo:');
  byType.forEach(({ type, count }) => {
    console.log(`  - ${type}: ${count}`);
  });

  // Análises de ativos inativos
  const inactiveAssetsCount = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .innerJoin('analysis.asset', 'asset')
    .where('asset.isActive = :isActive', { isActive: false })
    .getCount();
  console.log(`\n⚠️  Análises de ativos inativos: ${inactiveAssetsCount}`);

  // Análises failed antigas (>7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const failedOldCount = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .where('analysis.status = :status', { status: 'failed' })
    .andWhere('analysis.createdAt < :date', { date: sevenDaysAgo })
    .getCount();
  console.log(`⚠️  Análises failed antigas (>7 dias): ${failedOldCount}`);

  // Análises pending travadas (>1 hora)
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const pendingStuckCount = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .where('analysis.status = :status', { status: 'pending' })
    .andWhere('analysis.createdAt < :date', { date: oneHourAgo })
    .getCount();
  console.log(`⚠️  Análises pending travadas (>1 hora): ${pendingStuckCount}`);

  // Análises muito antigas (>90 dias)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const veryOldCount = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .where('analysis.createdAt < :date', { date: ninetyDaysAgo })
    .getCount();
  console.log(`⚠️  Análises muito antigas (>90 dias): ${veryOldCount}`);

  console.log('\n========================================\n');
}

async function cleanupAnalyses(
  dataSource: TypeORMDataSource,
  removeOldAnalyses: boolean = false,
): Promise<CleanupStats> {
  const stats: CleanupStats = {
    inactiveAssets: 0,
    failedOld: 0,
    pendingStuck: 0,
    veryOld: 0,
    total: 0,
  };

  console.log('🧹 INICIANDO LIMPEZA...\n');

  // 1. Remover análises de ativos inativos
  console.log('1️⃣  Removendo análises de ativos inativos...');

  // Primeiro, buscar IDs de ativos inativos
  const inactiveAssets = await dataSource.getRepository(Asset).find({
    where: { isActive: false },
    select: ['id'],
  });

  const inactiveAssetIds = inactiveAssets.map((asset) => asset.id);

  let inactiveAssetsResult;
  if (inactiveAssetIds.length > 0) {
    inactiveAssetsResult = await dataSource
      .createQueryBuilder()
      .delete()
      .from(Analysis)
      .where('assetId IN (:...ids)', { ids: inactiveAssetIds })
      .execute();
    stats.inactiveAssets = inactiveAssetsResult.affected || 0;
  } else {
    stats.inactiveAssets = 0;
  }

  console.log(`   ✅ Removidas: ${stats.inactiveAssets}`);

  // 2. Remover análises failed antigas (>7 dias)
  console.log('\n2️⃣  Removendo análises failed antigas (>7 dias)...');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const failedOldResult = await dataSource
    .createQueryBuilder()
    .delete()
    .from(Analysis)
    .where('status = :status', { status: 'failed' })
    .andWhere('createdAt < :date', { date: sevenDaysAgo })
    .execute();

  stats.failedOld = failedOldResult.affected || 0;
  console.log(`   ✅ Removidas: ${stats.failedOld}`);

  // 3. Remover análises pending travadas (>1 hora)
  console.log('\n3️⃣  Removendo análises pending travadas (>1 hora)...');
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const pendingStuckResult = await dataSource
    .createQueryBuilder()
    .delete()
    .from(Analysis)
    .where('status = :status', { status: 'pending' })
    .andWhere('createdAt < :date', { date: oneHourAgo })
    .execute();

  stats.pendingStuck = pendingStuckResult.affected || 0;
  console.log(`   ✅ Removidas: ${stats.pendingStuck}`);

  // 4. (Opcional) Remover análises muito antigas (>90 dias)
  if (removeOldAnalyses) {
    console.log('\n4️⃣  Removendo análises muito antigas (>90 dias)...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const veryOldResult = await dataSource
      .createQueryBuilder()
      .delete()
      .from(Analysis)
      .where('createdAt < :date', { date: ninetyDaysAgo })
      .execute();

    stats.veryOld = veryOldResult.affected || 0;
    console.log(`   ✅ Removidas: ${stats.veryOld}`);
  } else {
    console.log(
      '\n4️⃣  Análises antigas (>90 dias) NÃO removidas (parâmetro removeOldAnalyses=false)',
    );
  }

  stats.total = stats.inactiveAssets + stats.failedOld + stats.pendingStuck + stats.veryOld;

  return stats;
}

async function getStatisticsAfterCleanup(dataSource: TypeORMDataSource): Promise<void> {
  console.log('\n========================================');
  console.log('📊 ESTATÍSTICAS DEPOIS DA LIMPEZA');
  console.log('========================================\n');

  // Total de análises
  const totalAnalyses = await dataSource.getRepository(Analysis).count();
  console.log(`Total de análises no banco: ${totalAnalyses}`);

  // Análises por status
  const byStatus = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .select('analysis.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .groupBy('analysis.status')
    .getRawMany();

  console.log('\nPor status:');
  if (byStatus.length === 0) {
    console.log('  (nenhuma análise)');
  } else {
    byStatus.forEach(({ status, count }) => {
      console.log(`  - ${status}: ${count}`);
    });
  }

  // Análises por tipo
  const byType = await dataSource
    .getRepository(Analysis)
    .createQueryBuilder('analysis')
    .select('analysis.type', 'type')
    .addSelect('COUNT(*)', 'count')
    .groupBy('analysis.type')
    .getRawMany();

  console.log('\nPor tipo:');
  if (byType.length === 0) {
    console.log('  (nenhuma análise)');
  } else {
    byType.forEach(({ type, count }) => {
      console.log(`  - ${type}: ${count}`);
    });
  }

  console.log('\n========================================\n');
}

async function main() {
  console.log('\n🚀 SCRIPT DE LIMPEZA DE ANÁLISES\n');

  // Configuração do DataSource
  const dataSource = new TypeORMDataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5532', 10),
    username: process.env.DB_USERNAME || 'invest_user',
    password: process.env.DB_PASSWORD || 'invest_password',
    database: process.env.DB_DATABASE || 'invest_db',
    entities: [
      Analysis,
      Asset,
      AssetPrice,
      User,
      Portfolio,
      PortfolioPosition,
      FundamentalData,
      ScrapedData,
      DataSource,
      UpdateLog,
    ],
    synchronize: false,
    logging: false,
  });

  try {
    // Conectar ao banco
    console.log('📡 Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('✅ Conectado!\n');

    // Estatísticas ANTES
    await getStatisticsBeforeCleanup(dataSource);

    // Perguntar se deseja remover análises antigas (>90 dias)
    const removeOldAnalyses = process.argv.includes('--remove-old');

    if (removeOldAnalyses) {
      console.log('⚠️  MODO: Remover também análises antigas (>90 dias)\n');
    } else {
      console.log('ℹ️  MODO: Manter análises antigas (>90 dias)');
      console.log('   (Use --remove-old para remover também as antigas)\n');
    }

    // Executar limpeza
    const stats = await cleanupAnalyses(dataSource, removeOldAnalyses);

    // Resumo
    console.log('\n========================================');
    console.log('📋 RESUMO DA LIMPEZA');
    console.log('========================================');
    console.log(`Análises de ativos inativos: ${stats.inactiveAssets}`);
    console.log(`Análises failed antigas: ${stats.failedOld}`);
    console.log(`Análises pending travadas: ${stats.pendingStuck}`);
    console.log(`Análises muito antigas: ${stats.veryOld}`);
    console.log(`----------------------------------------`);
    console.log(`TOTAL REMOVIDO: ${stats.total}`);
    console.log('========================================\n');

    // Estatísticas DEPOIS
    await getStatisticsAfterCleanup(dataSource);

    console.log('✅ LIMPEZA CONCLUÍDA COM SUCESSO!\n');
  } catch (error) {
    console.error('\n❌ ERRO durante a limpeza:');
    console.error(error);
    process.exit(1);
  } finally {
    // Desconectar do banco
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('📡 Desconectado do banco de dados.\n');
    }
  }
}

// Executar script
main();
