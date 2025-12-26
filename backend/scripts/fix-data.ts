import { DataSource } from 'typeorm';
import Decimal from 'decimal.js';
import { Asset } from '../src/database/entities/asset.entity';
import { AssetPrice } from '../src/database/entities/asset-price.entity';
import { FundamentalData } from '../src/database/entities/fundamental-data.entity';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'invest_user',
    password: process.env.DB_PASSWORD || 'invest_password',
    database: process.env.DB_NAME || 'invest_db',
    entities: [Asset, AssetPrice, FundamentalData],
    synchronize: false,
});

async function fixData() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const assetRepository = AppDataSource.getRepository(Asset);
        const priceRepository = AppDataSource.getRepository(AssetPrice);

        const assets = await assetRepository.find();
        console.log(`Found ${assets.length} assets`);

        for (const asset of assets) {
            console.log(`Processing ${asset.ticker}...`);

            const prices = await priceRepository.find({
                where: { assetId: asset.id },
                order: { date: 'ASC' },
            });

            if (prices.length < 2) {
                console.log(`Not enough prices for ${asset.ticker}`);
                continue;
            }

            let updatedCount = 0;

            for (let i = 1; i < prices.length; i++) {
                const current = prices[i];
                const previous = prices[i - 1];

                // Calculate change if missing
                if (current.change === null || current.changePercent === null) {
                    const close = Number(current.close);
                    const prevClose = Number(previous.close);

                    const change = close - prevClose;
                    const changePercent = (change / prevClose) * 100;

                    current.change = new Decimal(change);
                    current.changePercent = new Decimal(changePercent);

                    await priceRepository.save(current);
                    updatedCount++;
                }
            }

            // Also update the first record to have 0 change if null
            if (prices[0].change === null) {
                prices[0].change = new Decimal(0);
                prices[0].changePercent = new Decimal(0);
                await priceRepository.save(prices[0]);
                updatedCount++;
            }

            console.log(`Updated ${updatedCount} records for ${asset.ticker}`);
        }

        console.log('Data fix completed');
    } catch (error) {
        console.error('Error fixing data:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

fixData();
