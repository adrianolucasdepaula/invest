import { DataSource } from 'typeorm';
import { Asset, AssetType } from '../entities/asset.entity';

/**
 * Seed das Top 20 Ações da B3 por valor de mercado
 * Dados baseados em novembro 2025
 */

const TOP_20_B3_ASSETS = [
  {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: AssetType.STOCK,
    sector: 'Petróleo, Gás e Biocombustíveis',
    subsector: 'Petróleo, Gás e Biocombustíveis',
    segment: 'Exploração, Refino e Distribuição',
    cnpj: '33.000.167/0001-01',
    website: 'https://www.petrobras.com.br',
    description:
      'Petróleo Brasileiro S.A. - Petrobras é uma empresa de energia integrada que atua nos segmentos de exploração e produção, refino, comercialização e transporte de petróleo e gás natural.',
  },
  {
    ticker: 'VALE3',
    name: 'Vale ON',
    type: AssetType.STOCK,
    sector: 'Materiais Básicos',
    subsector: 'Mineração',
    segment: 'Minerais Metálicos',
    cnpj: '33.592.510/0001-54',
    website: 'https://www.vale.com',
    description:
      'Vale S.A. é uma empresa mineradora multinacional brasileira e uma das maiores operadoras de logística do país. É a maior produtora de minério de ferro e de pelotas de minério de ferro do mundo.',
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    type: AssetType.STOCK,
    sector: 'Financeiro',
    subsector: 'Intermediários Financeiros',
    segment: 'Bancos',
    cnpj: '60.701.190/0001-04',
    website: 'https://www.itau.com.br',
    description:
      'Itaú Unibanco Holding S.A. é um dos maiores conglomerados financeiros do Brasil, oferecendo serviços bancários, seguros, previdência e capitalização.',
  },
  {
    ticker: 'BBDC4',
    name: 'Bradesco PN',
    type: AssetType.STOCK,
    sector: 'Financeiro',
    subsector: 'Intermediários Financeiros',
    segment: 'Bancos',
    cnpj: '60.746.948/0001-12',
    website: 'https://www.bradesco.com.br',
    description:
      'Banco Bradesco S.A. é um dos maiores bancos do Brasil, oferecendo ampla gama de serviços financeiros incluindo crédito, poupança, investimentos e seguros.',
  },
  {
    ticker: 'ABEV3',
    name: 'Ambev ON',
    type: AssetType.STOCK,
    sector: 'Consumo não Cíclico',
    subsector: 'Bebidas',
    segment: 'Cervejas e Refrigerantes',
    cnpj: '07.526.557/0001-00',
    website: 'https://www.ambev.com.br',
    description:
      'Ambev S.A. é a maior cervejaria da América do Sul e uma das cinco maiores do mundo. Produz marcas como Skol, Brahma, Antarctica, Budweiser, entre outras.',
  },
  {
    ticker: 'MGLU3',
    name: 'Magazine Luiza ON',
    type: AssetType.STOCK,
    sector: 'Consumo Cíclico',
    subsector: 'Comércio',
    segment: 'Eletrodomésticos',
    cnpj: '47.960.950/0001-21',
    website: 'https://www.magazineluiza.com.br',
    description:
      'Magazine Luiza S.A. é uma das maiores redes varejistas do Brasil, atuando nos segmentos de eletrodomésticos, eletrônicos, móveis e utilidades domésticas.',
  },
  {
    ticker: 'B3SA3',
    name: 'B3 ON',
    type: AssetType.STOCK,
    sector: 'Financeiro',
    subsector: 'Serviços Financeiros Diversos',
    segment: 'Bolsa de Valores',
    cnpj: '09.346.601/0001-25',
    website: 'https://www.b3.com.br',
    description:
      'B3 S.A. - Brasil, Bolsa, Balcão é a bolsa de valores oficial do Brasil, administrando mercados de ações, derivativos, renda fixa e commodities.',
  },
  {
    ticker: 'RENT3',
    name: 'Localiza ON',
    type: AssetType.STOCK,
    sector: 'Consumo Cíclico',
    subsector: 'Diversos',
    segment: 'Aluguel de Carros',
    cnpj: '16.670.085/0001-55',
    website: 'https://www.localiza.com',
    description:
      'Localiza Rent a Car S.A. é a maior empresa de aluguel de veículos da América Latina, atuando também em gestão de frotas e seminovos.',
  },
  {
    ticker: 'WEGE3',
    name: 'WEG ON',
    type: AssetType.STOCK,
    sector: 'Bens Industriais',
    subsector: 'Máquinas e Equipamentos',
    segment: 'Motores, Compressores e Outros',
    cnpj: '84.429.695/0001-11',
    website: 'https://www.weg.net',
    description:
      'WEG S.A. é uma empresa brasileira fabricante de equipamentos eletroeletrônicos, incluindo motores elétricos, transformadores, geradores e automação industrial.',
  },
  {
    ticker: 'SUZB3',
    name: 'Suzano ON',
    type: AssetType.STOCK,
    sector: 'Materiais Básicos',
    subsector: 'Madeira e Papel',
    segment: 'Papel e Celulose',
    cnpj: '16.404.287/0001-55',
    website: 'https://www.suzano.com.br',
    description:
      'Suzano S.A. é a maior produtora de celulose de eucalipto do mundo e uma das principais fabricantes de papel da América Latina.',
  },
  {
    ticker: 'RAIL3',
    name: 'Rumo ON',
    type: AssetType.STOCK,
    sector: 'Bens Industriais',
    subsector: 'Transporte',
    segment: 'Transporte Ferroviário',
    cnpj: '02.937.149/0001-08',
    website: 'https://www.rumolog.com',
    description:
      'Rumo S.A. é uma empresa de logística ferroviária que opera a maior malha ferroviária do Brasil, transportando principalmente grãos e açúcar.',
  },
  {
    ticker: 'GGBR4',
    name: 'Gerdau PN',
    type: AssetType.STOCK,
    sector: 'Materiais Básicos',
    subsector: 'Siderurgia e Metalurgia',
    segment: 'Siderurgia',
    cnpj: '33.611.500/0001-19',
    website: 'https://www.gerdau.com.br',
    description:
      'Gerdau S.A. é uma das maiores empresas brasileiras produtoras de aço, com operações nas Américas e Europa.',
  },
  {
    ticker: 'RADL3',
    name: 'Raia Drogasil ON',
    type: AssetType.STOCK,
    sector: 'Consumo não Cíclico',
    subsector: 'Comércio e Distribuição',
    segment: 'Medicamentos',
    cnpj: '61.585.865/0001-51',
    website: 'https://www.rd.com.br',
    description:
      'RD - Raia Drogasil S.A. é a maior rede de farmácias do Brasil, resultado da fusão entre Droga Raia e Drogasil.',
  },
  {
    ticker: 'JBSS3',
    name: 'JBS ON',
    type: AssetType.STOCK,
    sector: 'Consumo não Cíclico',
    subsector: 'Alimentos Processados',
    segment: 'Carnes e Derivados',
    cnpj: '02.916.265/0001-60',
    website: 'https://www.jbs.com.br',
    description:
      "JBS S.A. é a maior processadora de proteína animal do mundo, com marcas como Friboi, Seara, Swift e Pilgrim's Pride.",
  },
  {
    ticker: 'EMBR3',
    name: 'Embraer ON',
    type: AssetType.STOCK,
    sector: 'Bens Industriais',
    subsector: 'Material de Transporte',
    segment: 'Construção de Aeronaves',
    cnpj: '07.689.002/0001-89',
    website: 'https://www.embraer.com',
    description:
      'Embraer S.A. é a terceira maior fabricante de aeronaves do mundo, especializada em jatos comerciais, executivos e aeronaves militares.',
  },
  {
    ticker: 'LREN3',
    name: 'Lojas Renner ON',
    type: AssetType.STOCK,
    sector: 'Consumo Cíclico',
    subsector: 'Comércio',
    segment: 'Tecidos, Vestuário e Calçados',
    cnpj: '92.754.738/0001-62',
    website: 'https://www.lojasrenner.com.br',
    description:
      'Lojas Renner S.A. é a maior varejista de moda do Brasil, operando as marcas Renner, Camicado, Youcom e Ashua.',
  },
  {
    ticker: 'SANB11',
    name: 'Santander Brasil Unit',
    type: AssetType.STOCK,
    sector: 'Financeiro',
    subsector: 'Intermediários Financeiros',
    segment: 'Bancos',
    cnpj: '90.400.888/0001-42',
    website: 'https://www.santander.com.br',
    description:
      'Banco Santander (Brasil) S.A. é um dos principais bancos do país, oferecendo serviços bancários completos para pessoas físicas e jurídicas.',
  },
  {
    ticker: 'VIVT3',
    name: 'Telefônica Brasil ON',
    type: AssetType.STOCK,
    sector: 'Comunicações',
    subsector: 'Telecomunicações',
    segment: 'Telefonia Fixa',
    cnpj: '02.558.157/0001-62',
    website: 'https://www.telefonica.com.br',
    description:
      'Telefônica Brasil S.A. (Vivo) é a maior operadora de telefonia móvel do Brasil em número de clientes, oferecendo também serviços de banda larga e TV por assinatura.',
  },
  {
    ticker: 'EGIE3',
    name: 'Engie Brasil ON',
    type: AssetType.STOCK,
    sector: 'Utilidade Pública',
    subsector: 'Energia Elétrica',
    segment: 'Geração de Energia',
    cnpj: '02.474.103/0001-19',
    website: 'https://www.engie.com.br',
    description:
      'Engie Brasil Energia S.A. é uma das principais geradoras privadas de energia elétrica do Brasil, com matriz energética diversificada.',
  },
  {
    ticker: 'EQTL3',
    name: 'Equatorial ON',
    type: AssetType.STOCK,
    sector: 'Utilidade Pública',
    subsector: 'Energia Elétrica',
    segment: 'Distribuição de Energia',
    cnpj: '03.220.438/0001-73',
    website: 'https://www.equatorialenergia.com.br',
    description:
      'Equatorial Energia S.A. é um grupo empresarial brasileiro do setor de energia elétrica, atuando na distribuição e transmissão de energia.',
  },
];

export async function seedTop20Assets(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding Top 20 B3 Assets...');

  const assetRepository = dataSource.getRepository(Asset);

  for (const assetData of TOP_20_B3_ASSETS) {
    try {
      // Check if asset already exists
      const existingAsset = await assetRepository.findOne({
        where: { ticker: assetData.ticker },
      });

      if (existingAsset) {
        console.log(`   ⏭️  ${assetData.ticker} - Already exists, skipping`);
        continue;
      }

      // Create new asset
      const asset = assetRepository.create({
        ...assetData,
        isActive: true,
        metadata: {
          source: 'manual_seed',
          seededAt: new Date().toISOString(),
        },
      });

      await assetRepository.save(asset);
      console.log(`   ✅ ${assetData.ticker} - ${assetData.name} created`);
    } catch (error) {
      console.error(`   ❌ Error creating ${assetData.ticker}:`, error.message);
    }
  }

  const count = await assetRepository.count();
  console.log(`✨ Seed completed! Total assets in database: ${count}\n`);
}
