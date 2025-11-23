import { DataSource } from 'typeorm';
import { Asset, AssetType } from '../entities/asset.entity';

/**
 * Seed para adicionar novos ativos do IBOV
 *
 * Baseado na validação de 11/11/2025 onde testamos 14 novos ativos
 * do índice IBOVESPA que estão disponíveis no BRAPI.
 *
 * Todos os 14 ativos foram validados com sucesso (100% disponíveis).
 *
 * Para executar: npm run seed:ibov-new
 */

const NEW_IBOV_ASSETS = [
  {
    ticker: 'ALOS3',
    name: 'Allos S.A.',
    sector: 'Shopping Centers',
    type: AssetType.STOCK,
    description:
      'Allos é uma empresa de shopping centers resultante da fusão da Aliansce com Sonae Sierra Brasil.',
  },
  {
    ticker: 'ASAI3',
    name: 'Sendas Distribuidora S.A.',
    sector: 'Varejo',
    type: AssetType.STOCK,
    description: 'Sendas (Assaí Atacadista) é uma rede brasileira de atacarejo.',
  },
  {
    ticker: 'AURE3',
    name: 'Auren Energia S.A.',
    sector: 'Energia Elétrica',
    type: AssetType.STOCK,
    description: 'Auren Energia é uma empresa de geração de energia elétrica.',
  },
  {
    ticker: 'AXIA3',
    name: 'Centrais Elétricas Brasileiras S.A. - Eletrobrás',
    sector: 'Energia Elétrica',
    type: AssetType.STOCK,
    description:
      'Eletrobrás é a maior empresa de energia elétrica da América Latina. AXIA3 são as ações ordinárias.',
  },
  {
    ticker: 'AXIA6',
    name: 'Centrais Elétricas Brasileiras S.A. - Eletrobrás',
    sector: 'Energia Elétrica',
    type: AssetType.STOCK,
    description:
      'Eletrobrás é a maior empresa de energia elétrica da América Latina. AXIA6 são as ações preferenciais classe B.',
  },
  {
    ticker: 'AZZA3',
    name: 'Azzas 2154 S.A.',
    sector: 'Varejo',
    type: AssetType.STOCK,
    description: 'Azzas 2154 (Grupo Casas Bahia e Ponto Frio) é uma empresa de varejo brasileiro.',
  },
  {
    ticker: 'BBSE3',
    name: 'BB Seguridade Participações S.A.',
    sector: 'Seguros',
    type: AssetType.STOCK,
    description:
      'BB Seguridade é a holding de seguros, previdência e capitalização do Banco do Brasil.',
  },
  {
    ticker: 'BBDC3',
    name: 'Banco Bradesco S.A.',
    sector: 'Bancos',
    type: AssetType.STOCK,
    description:
      'Bradesco é um dos maiores bancos privados do Brasil. BBDC3 são as ações ordinárias.',
  },
  {
    ticker: 'BRKM5',
    name: 'Braskem S.A.',
    sector: 'Petroquímico',
    type: AssetType.STOCK,
    description: 'Braskem é a maior produtora de resinas termoplásticas das Américas.',
  },
  {
    ticker: 'BRAV3',
    name: 'Brava Energia S.A.',
    sector: 'Petróleo e Gás',
    type: AssetType.STOCK,
    description:
      'Brava Energia (antiga 3R Petroleum) é uma empresa de exploração e produção de petróleo e gás.',
  },
  {
    ticker: 'BPAC11',
    name: 'Banco BTG Pactual S.A.',
    sector: 'Bancos',
    type: AssetType.STOCK,
    description: 'BTG Pactual é um banco de investimentos brasileiro.',
  },
  {
    ticker: 'CXSE3',
    name: 'Caixa Seguridade Participações S.A.',
    sector: 'Seguros',
    type: AssetType.STOCK,
    description:
      'Caixa Seguridade é a holding de seguros e previdência da Caixa Econômica Federal.',
  },
  {
    ticker: 'CEAB3',
    name: 'C&A Modas S.A.',
    sector: 'Varejo',
    type: AssetType.STOCK,
    description: 'C&A é uma rede internacional de lojas de roupas e acessórios.',
  },
  {
    ticker: 'COGN3',
    name: 'Cogna Educação S.A.',
    sector: 'Educação',
    type: AssetType.STOCK,
    description:
      'Cogna Educação (antiga Kroton) é uma empresa de educação que inclui marcas como Anhanguera, Unopar, Pitágoras e Vasta.',
  },
];

export async function seedIbovNewAssets(dataSource: DataSource) {
  const assetRepository = dataSource.getRepository(Asset);

  console.log('🌱 Iniciando seed de novos ativos do IBOV...\n');
  console.log(`📊 Total de ativos a adicionar: ${NEW_IBOV_ASSETS.length}\n`);
  console.log('─'.repeat(80));

  let added = 0;
  let skipped = 0;

  for (const assetData of NEW_IBOV_ASSETS) {
    try {
      // Check if asset already exists
      const existing = await assetRepository.findOne({
        where: { ticker: assetData.ticker },
      });

      if (existing) {
        console.log(`⏭️  ${assetData.ticker.padEnd(10)} - Já existe no banco`);
        skipped++;
        continue;
      }

      // Create new asset
      const asset = assetRepository.create({
        ...assetData,
        isActive: true,
        metadata: {
          source: 'ibov_validation_seed',
          seededAt: new Date().toISOString(),
          validatedDate: '2025-11-11',
        },
      });

      await assetRepository.save(asset);
      console.log(`✅ ${assetData.ticker.padEnd(10)} - ${assetData.name}`);
      added++;
    } catch (error) {
      console.error(`❌ Erro ao adicionar ${assetData.ticker}:`, error.message);
    }
  }

  console.log('─'.repeat(80));
  console.log('\n📈 RESUMO DO SEED:\n');
  console.log(`✅ Adicionados: ${added}`);
  console.log(`⏭️  Ignorados (já existiam): ${skipped}`);
  console.log(`❌ Erros: ${NEW_IBOV_ASSETS.length - added - skipped}`);
  console.log('\n✅ Seed concluído!\n');

  const count = await assetRepository.count();
  console.log(`✨ Total de ativos no banco: ${count}\n`);
}
