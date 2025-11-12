import { DataSource } from 'typeorm';
import { Asset, AssetType } from '../entities/asset.entity';

// Lista completa dos principais ativos do IBOV (atualizada 2024)
const IBOV_ASSETS = [
  // Já existentes no banco (manter para referência)
  { ticker: 'ABEV3', name: 'AMBEV ON', sector: 'Consumo', subsector: 'Bebidas', segment: 'Cervejas e Refrigerantes' },
  { ticker: 'B3SA3', name: 'B3 ON', sector: 'Financeiro', subsector: 'Serviços Financeiros', segment: 'Bolsa de Valores' },
  { ticker: 'BBAS3', name: 'BRASIL ON', sector: 'Financeiro', subsector: 'Bancos', segment: 'Bancos' },
  { ticker: 'BBDC4', name: 'BRADESCO PN', sector: 'Financeiro', subsector: 'Bancos', segment: 'Bancos' },

  // Novos ativos para completar o IBOV
  { ticker: 'AZUL4', name: 'AZUL PN', sector: 'Transporte', subsector: 'Transporte Aéreo', segment: 'Transporte Aéreo' },
  { ticker: 'BBSE3', name: 'BBSEGURIDADE ON', sector: 'Financeiro', subsector: 'Seguros', segment: 'Seguros' },
  { ticker: 'CRFB3', name: 'CARREFOUR BR ON', sector: 'Consumo', subsector: 'Varejo', segment: 'Hipermercados' },
  { ticker: 'CSMG3', name: 'COPASA ON', sector: 'Utilidade Pública', subsector: 'Água e Saneamento', segment: 'Água e Saneamento' },
  { ticker: 'CVCB3', name: 'CVC BRASIL ON', sector: 'Consumo', subsector: 'Viagens e Lazer', segment: 'Agências de Viagens' },
  { ticker: 'DXCO3', name: 'DEXCO ON', sector: 'Construção', subsector: 'Materiais de Construção', segment: 'Materiais de Construção' },
  { ticker: 'ECOR3', name: 'ECORODOVIAS ON', sector: 'Infraestrutura', subsector: 'Transporte', segment: 'Rodovias' },
  { ticker: 'ENEV3', name: 'ENEVA ON', sector: 'Energia', subsector: 'Energia Elétrica', segment: 'Geração de Energia' },
  { ticker: 'ENGI11', name: 'ENERGISA UNT', sector: 'Utilidade Pública', subsector: 'Energia Elétrica', segment: 'Energia Elétrica' },
  { ticker: 'EQTL3', name: 'EQUATORIAL ON', sector: 'Utilidade Pública', subsector: 'Energia Elétrica', segment: 'Energia Elétrica' },
  { ticker: 'FLRY3', name: 'FLEURY ON', sector: 'Saúde', subsector: 'Serviços Médicos', segment: 'Diagnósticos' },
  { ticker: 'GGBR4', name: 'GERDAU PN', sector: 'Materiais Básicos', subsector: 'Siderurgia', segment: 'Siderurgia' },
  { ticker: 'GOLL4', name: 'GOL PN', sector: 'Transporte', subsector: 'Transporte Aéreo', segment: 'Transporte Aéreo' },
  { ticker: 'HYPE3', name: 'HYPERA ON', sector: 'Saúde', subsector: 'Medicamentos', segment: 'Medicamentos' },
  { ticker: 'IGTI11', name: 'IGUATEMI UNT', sector: 'Consumo', subsector: 'Varejo', segment: 'Shopping Centers' },
  { ticker: 'ITUB4', name: 'ITAUUNIBANCO PN', sector: 'Financeiro', subsector: 'Bancos', segment: 'Bancos' },
  { ticker: 'JBSS3', name: 'JBS ON', sector: 'Consumo', subsector: 'Alimentos', segment: 'Carnes e Derivados' },
  { ticker: 'LREN3', name: 'LOJAS RENNER ON', sector: 'Consumo', subsector: 'Varejo', segment: 'Vestuário' },
  { ticker: 'LWSA3', name: 'LOCAWEB ON', sector: 'Tecnologia', subsector: 'Software', segment: 'Serviços de Internet' },
  { ticker: 'MGLU3', name: 'MAGALU ON', sector: 'Consumo', subsector: 'Varejo', segment: 'Varejo Online' },
  { ticker: 'MRFG3', name: 'MARFRIG ON', sector: 'Consumo', subsector: 'Alimentos', segment: 'Carnes e Derivados' },
  { ticker: 'MRVE3', name: 'MRV ON', sector: 'Construção', subsector: 'Construção Civil', segment: 'Edificações' },
  { ticker: 'MULT3', name: 'MULTIPLAN ON', sector: 'Consumo', subsector: 'Varejo', segment: 'Shopping Centers' },
  { ticker: 'NTCO3', name: 'NATURA ON', sector: 'Consumo', subsector: 'Produtos Pessoais', segment: 'Cosméticos' },
  { ticker: 'PETR3', name: 'PETROBRAS ON', sector: 'Petróleo e Gás', subsector: 'Exploração', segment: 'Petróleo' },
  { ticker: 'PETR4', name: 'PETROBRAS PN', sector: 'Petróleo e Gás', subsector: 'Exploração', segment: 'Petróleo' },
  { ticker: 'PETZ3', name: 'PETZ ON', sector: 'Consumo', subsector: 'Varejo', segment: 'Pet Shop' },
  { ticker: 'RADL3', name: 'RAIADROGASIL ON', sector: 'Consumo', subsector: 'Varejo', segment: 'Farmácias' },
  { ticker: 'RAIL3', name: 'RUMO ON', sector: 'Transporte', subsector: 'Transporte Ferroviário', segment: 'Transporte Ferroviário' },
  { ticker: 'RAIZ4', name: 'RAIZEN PN', sector: 'Energia', subsector: 'Combustíveis', segment: 'Biocombustíveis' },
  { ticker: 'RDOR3', name: 'REDE DOR ON', sector: 'Saúde', subsector: 'Serviços Médicos', segment: 'Hospitais' },
  { ticker: 'RENT3', name: 'LOCALIZA ON', sector: 'Transporte', subsector: 'Aluguel de Carros', segment: 'Aluguel de Carros' },
  { ticker: 'RRRP3', name: '3R PETROLEUM ON', sector: 'Petróleo e Gás', subsector: 'Exploração', segment: 'Petróleo' },
  { ticker: 'SANB11', name: 'SANTANDER BR UNT', sector: 'Financeiro', subsector: 'Bancos', segment: 'Bancos' },
  { ticker: 'SBSP3', name: 'SABESP ON', sector: 'Utilidade Pública', subsector: 'Água e Saneamento', segment: 'Água e Saneamento' },
  { ticker: 'SLCE3', name: 'SLC AGRICOLA ON', sector: 'Agronegócio', subsector: 'Agricultura', segment: 'Agricultura' },
  { ticker: 'SMTO3', name: 'SAO MARTINHO ON', sector: 'Agronegócio', subsector: 'Açúcar e Álcool', segment: 'Açúcar e Álcool' },
  { ticker: 'SOMA3', name: 'SOMA ON', sector: 'Consumo', subsector: 'Varejo', segment: 'Vestuário' },
  { ticker: 'SUZB3', name: 'SUZANO ON', sector: 'Materiais Básicos', subsector: 'Papel e Celulose', segment: 'Papel e Celulose' },
  { ticker: 'TAEE11', name: 'TAESA UNT', sector: 'Utilidade Pública', subsector: 'Energia Elétrica', segment: 'Transmissão de Energia' },
  { ticker: 'TIMS3', name: 'TIM ON', sector: 'Telecomunicações', subsector: 'Telefonia', segment: 'Telefonia Móvel' },
  { ticker: 'UGPA3', name: 'ULTRAPAR ON', sector: 'Energia', subsector: 'Combustíveis', segment: 'Distribuição de Combustíveis' },
  { ticker: 'VALE3', name: 'VALE ON', sector: 'Materiais Básicos', subsector: 'Mineração', segment: 'Minerais Metálicos' },
  { ticker: 'VAMO3', name: 'VAMOS ON', sector: 'Transporte', subsector: 'Aluguel de Veículos', segment: 'Aluguel de Veículos' },
  { ticker: 'VBBR3', name: 'VIBRA ON', sector: 'Energia', subsector: 'Combustíveis', segment: 'Distribuição de Combustíveis' },
  { ticker: 'VIVT3', name: 'TELEF BRASIL ON', sector: 'Telecomunicações', subsector: 'Telefonia', segment: 'Telefonia Fixa' },
  { ticker: 'WEGE3', name: 'WEG ON', sector: 'Bens Industriais', subsector: 'Máquinas e Equipamentos', segment: 'Motores Elétricos' },
  { ticker: 'YDUQ3', name: 'YDUQS ON', sector: 'Educação', subsector: 'Ensino Superior', segment: 'Ensino Superior' },
];

export async function seedIbovAssets(dataSource: DataSource): Promise<void> {
  const assetRepository = dataSource.getRepository(Asset);

  console.log('Starting IBOV assets seed...');

  let inserted = 0;
  let skipped = 0;

  for (const assetData of IBOV_ASSETS) {
    try {
      // Check if asset already exists
      const existing = await assetRepository.findOne({
        where: { ticker: assetData.ticker }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create new asset
      const asset = assetRepository.create({
        ticker: assetData.ticker,
        name: assetData.name,
        type: AssetType.STOCK,
        sector: assetData.sector,
        subsector: assetData.subsector,
        segment: assetData.segment,
        description: `${assetData.name} - ${assetData.segment}`,
      });

      await assetRepository.save(asset);
      inserted++;
      console.log(`✓ Inserted: ${assetData.ticker} - ${assetData.name}`);

    } catch (error) {
      console.error(`✗ Error inserting ${assetData.ticker}:`, error.message);
    }
  }

  console.log(`\n📊 Seed completed:`);
  console.log(`   - Inserted: ${inserted}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Total: ${IBOV_ASSETS.length}`);
}
