import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Asset, AssetType } from '../entities/asset.entity';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'invest_user',
  password: process.env.DB_PASSWORD || 'invest_password',
  database: process.env.DB_DATABASE || 'invest_db',
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

const ibovAssets = [
  { ticker: 'PETR4', name: 'Petrobras PN', type: AssetType.STOCK, sector: 'Petróleo e Gás' },
  { ticker: 'VALE3', name: 'Vale ON', type: AssetType.STOCK, sector: 'Mineração' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', type: AssetType.STOCK, sector: 'Financeiro' },
  { ticker: 'BBDC4', name: 'Bradesco PN', type: AssetType.STOCK, sector: 'Financeiro' },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', type: AssetType.STOCK, sector: 'Financeiro' },
  { ticker: 'ABEV3', name: 'Ambev ON', type: AssetType.STOCK, sector: 'Bebidas' },
  { ticker: 'WEGE3', name: 'WEG ON', type: AssetType.STOCK, sector: 'Máquinas e Equipamentos' },
  { ticker: 'B3SA3', name: 'B3 ON', type: AssetType.STOCK, sector: 'Financeiro' },
  { ticker: 'RENT3', name: 'Localiza ON', type: AssetType.STOCK, sector: 'Aluguel de Carros' },
  { ticker: 'BBSE3', name: 'BB Seguridade ON', type: AssetType.STOCK, sector: 'Seguros' },
];

async function seedAssets() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected!');

    const assetRepo = AppDataSource.getRepository(Asset);

    console.log('\n=== Seeding IBOV Assets ===\n');

    for (const assetData of ibovAssets) {
      const exists = await assetRepo.findOne({ where: { ticker: assetData.ticker } });
      if (!exists) {
        const asset = assetRepo.create(assetData);
        await assetRepo.save(asset);
        console.log(`✅ Created ${assetData.ticker}`);
      } else {
        console.log(`⏭️  ${assetData.ticker} already exists`);
      }
    }

    console.log('\n=== Asset seeding completed! ===\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedAssets();
