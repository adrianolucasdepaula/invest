import { DataSource } from 'typeorm';
import { TickerChange } from '../entities/ticker-change.entity';
import { Asset } from '../entities/asset.entity';

/**
 * Seed para popular mudanças de tickers (FASE 55).
 *
 * Casos reais documentados:
 * 1. ELET3 → AXIA3 (2025-11-10) - Eletrobras privatizada virou Axia Energia
 * 2. ELET6 → AXIA6 (2025-11-10) - Eletrobras PNB
 * 3. ARZZ3 → AZZA3 (data desconhecida, antes de 2025) - Arezzo virou Azzas 2154 S.A.
 * 4. CPFE → AURE3 (data desconhecida) - CPFL Geração virou Auren Energia S.A.
 *
 * Nota: Apenas casos onde AMBOS os tickers existem no banco serão populados.
 */

interface TickerChangeData {
  oldTicker: string;
  newTicker: string;
  changeDate: string;
  reason: string;
  ratio: number;
}

const TICKER_CHANGES: TickerChangeData[] = [
  {
    oldTicker: 'ELET3',
    newTicker: 'AXIA3',
    changeDate: '2025-11-10',
    reason: 'REBRANDING',
    ratio: 1.0,
  },
  {
    oldTicker: 'ELET6',
    newTicker: 'AXIA6',
    changeDate: '2025-11-10',
    reason: 'REBRANDING',
    ratio: 1.0,
  },
  // ARZZ3 → AZZA3 não incluído porque ARZZ3 não existe no banco (merge antes de 2025)
  // CPFE → AURE3 não incluído porque dados incompletos
];

export async function seedTickerChanges(dataSource: DataSource): Promise<void> {
  console.log('📦 Seeding Ticker Changes (FASE 55)...');

  const tickerChangeRepository = dataSource.getRepository(TickerChange);
  const assetRepository = dataSource.getRepository(Asset);

  try {
    // 1. Verificar quais já existem
    const existingChanges = await tickerChangeRepository.find();
    console.log(`📊 Existing ticker changes: ${existingChanges.length}`);

    let inserted = 0;
    let skipped = 0;

    // 2. Processar cada mudança de ticker
    for (const changeData of TICKER_CHANGES) {
      // 2.1. Verificar se já existe
      const exists = existingChanges.some(
        (tc) => tc.oldTicker === changeData.oldTicker && tc.newTicker === changeData.newTicker,
      );

      if (exists) {
        console.log(
          `  ⏭️  Skipping ${changeData.oldTicker} → ${changeData.newTicker} (already exists)`,
        );
        skipped++;
        continue;
      }

      // 2.2. Buscar IDs dos assets
      const oldAsset = await assetRepository.findOne({
        where: { ticker: changeData.oldTicker },
      });
      const newAsset = await assetRepository.findOne({
        where: { ticker: changeData.newTicker },
      });

      if (!oldAsset) {
        console.log(
          `  ⚠️  Skipping ${changeData.oldTicker} → ${changeData.newTicker}: old ticker not found`,
        );
        skipped++;
        continue;
      }

      if (!newAsset) {
        console.log(
          `  ⚠️  Skipping ${changeData.oldTicker} → ${changeData.newTicker}: new ticker not found`,
        );
        skipped++;
        continue;
      }

      // 2.3. Validar e inserir ticker change
      const parsedDate = new Date(changeData.changeDate);
      if (isNaN(parsedDate.getTime())) {
        console.log(
          `  ⚠️  Skipping ${changeData.oldTicker} → ${changeData.newTicker}: invalid date format`,
        );
        skipped++;
        continue;
      }

      const tickerChange = tickerChangeRepository.create({
        oldTicker: changeData.oldTicker,
        newTicker: changeData.newTicker,
        changeDate: parsedDate,
        reason: changeData.reason,
        ratio: changeData.ratio,
      });

      await tickerChangeRepository.save(tickerChange);
      console.log(
        `  ✅ Inserted: ${changeData.oldTicker} → ${changeData.newTicker} (${changeData.changeDate})`,
      );
      inserted++;
    }

    // 3. Estatísticas finais
    const totalChanges = await tickerChangeRepository.count();
    console.log(`\n📊 FINAL STATISTICS:`);
    console.log(`  Total ticker changes in DB: ${totalChanges}`);
    console.log(`  Inserted in this run: ${inserted}`);
    console.log(`  Skipped (already exists or missing assets): ${skipped}`);
  } catch (error) {
    console.error('❌ Error seeding ticker changes:', error);
    throw error;
  }
}
