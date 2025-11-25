import { DataSource } from 'typeorm';
import { Asset, AssetType } from '../entities/asset.entity';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Seed para popular TODOS os ativos úteis da B3 extraídos do COTAHIST 2025.
 *
 * Fonte: COTAHIST B3 (Oficial)
 * Data: 2025-11-25
 * Total: 861 ativos úteis (após filtrar fracionários)
 *
 * Distribuição:
 * - 415 Ações (lote padrão - BDI 02)
 * - 446 FIIs (BDI 12)
 *
 * Nota: Ativos fracionários (sufixo F) são filtrados automaticamente (linha 103)
 */

interface AssetMetadata {
  ticker: string;
  company_name: string;
  stock_type: string;
  bdi_codes: number[];
  first_date: string;
  last_date: string;
  total_records: number;
}

/**
 * Deriva o tipo de ativo com base no ticker e BDI codes.
 */
function deriveAssetType(ticker: string, bdiCodes: number[]): AssetType {
  // BDI 12 = Fundos Imobiliários
  if (bdiCodes.includes(12)) {
    return AssetType.FII;
  }

  // Ticker termina com 11 = geralmente FII (mesmo com BDI 02/96)
  if (ticker.endsWith('11')) {
    return AssetType.FII;
  }

  // BDI 02 ou 96 com número no final = Ações
  // Exemplos: PETR4, VALE3, ABEV3, etc.
  if (bdiCodes.includes(2) || bdiCodes.includes(96)) {
    return AssetType.STOCK;
  }

  // Default: STOCK
  return AssetType.STOCK;
}

/**
 * Limpa o nome da empresa removendo espaços extras.
 */
function cleanCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Carrega os dados do arquivo JSON.
 */
function loadAssetsData(): Record<string, AssetMetadata> {
  const jsonPath = path.resolve(__dirname, '../../../scripts/all_b3_assets.json');

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo não encontrado: ${jsonPath}`);
  }

  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(jsonContent);
}

export async function seedAllB3Assets(dataSource: DataSource): Promise<void> {
  console.log('📦 Seeding ALL B3 Assets (1,422 tickers from COTAHIST 2025)...');

  const assetRepository = dataSource.getRepository(Asset);

  try {
    // 1. Carregar dados do JSON
    const assetsData = loadAssetsData();
    const tickers = Object.keys(assetsData);

    console.log(`✅ Loaded ${tickers.length} assets from JSON`);

    // 2. Verificar quantos já existem no banco
    const existingAssets = await assetRepository.find({
      select: ['ticker'],
    });
    const existingTickers = new Set(existingAssets.map(a => a.ticker));

    console.log(`📊 Existing assets in DB: ${existingTickers.size}`);

    // 3. Filtrar apenas assets novos
    const newAssets: Partial<Asset>[] = [];

    for (const ticker of tickers) {
      if (existingTickers.has(ticker)) {
        continue; // Skip já existentes
      }

      // Skip tickers fracionários (terminam com F)
      if (ticker.endsWith('F')) {
        continue;
      }

      const metadata = assetsData[ticker];
      const assetType = deriveAssetType(ticker, metadata.bdi_codes);

      // Validações críticas
      if (!metadata.first_date) {
        console.warn(`  ⚠️  Skipping ${ticker}: missing first_date`);
        continue;
      }

      newAssets.push({
        ticker: metadata.ticker,
        name: cleanCompanyName(metadata.company_name),
        type: assetType,
        isActive: true,
        autoUpdateEnabled: true,
        listingDate: new Date(metadata.first_date),
        metadata: {
          stock_type: metadata.stock_type ? metadata.stock_type.trim() : '',
          bdi_codes: metadata.bdi_codes,
          first_trading_date: metadata.first_date,
          last_trading_date: metadata.last_date,
          total_trading_days_2025: metadata.total_records,
          source: 'COTAHIST_B3_2025',
          imported_at: new Date().toISOString(),
        },
      });
    }

    console.log(`📥 Assets to insert: ${newAssets.length}`);

    // 4. Inserir em lotes de 100 para otimizar performance
    if (newAssets.length > 0) {
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < newAssets.length; i += batchSize) {
        const batch = newAssets.slice(i, i + batchSize);
        await assetRepository.save(batch);
        inserted += batch.length;
        console.log(`  ✅ Inserted ${inserted}/${newAssets.length} assets...`);
      }

      console.log(`\n✅ Successfully seeded ${inserted} new B3 assets!`);
    } else {
      console.log('ℹ️  All assets already exist in database');
    }

    // 5. Estatísticas finais
    const totalAssets = await assetRepository.count();
    const assetsByType = await assetRepository
      .createQueryBuilder('asset')
      .select('asset.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('asset.type')
      .getRawMany();

    console.log(`\n📊 FINAL STATISTICS:`);
    console.log(`  Total assets in DB: ${totalAssets}`);
    console.log(`  By type:`);
    assetsByType.forEach(stat => {
      console.log(`    ${stat.type.toUpperCase()}: ${stat.count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding B3 assets:', error);
    throw error;
  }
}
