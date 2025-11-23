
import { DataSource } from 'typeorm';
import { AssetPrice } from '../src/database/entities/asset-price.entity';
import { Asset } from '../src/database/entities/asset.entity';
import { FundamentalData } from '../src/database/entities/fundamental-data.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function validatePrecision() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5532'),
        username: process.env.DB_USER || 'invest_user',
        password: process.env.DB_PASSWORD || 'invest_password',
        database: process.env.DB_NAME || 'invest_db',
        entities: [AssetPrice, Asset, FundamentalData],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('Database connected.');

        const repo = dataSource.getRepository(AssetPrice);
        const assetRepo = dataSource.getRepository(Asset);

        const petr4 = await assetRepo.findOne({ where: { ticker: 'PETR4' } });

        if (!petr4) {
            console.error('PETR4 not found in Asset table.');
            return;
        }

        console.log(`Found PETR4: ${petr4.id}`);

        // Insert test data with 4 decimals
        const testDate = '2099-01-01';
        const testPrice = 35.1234;

        const newPrice = new AssetPrice();
        newPrice.asset = petr4;
        newPrice.date = new Date(testDate);
        newPrice.open = testPrice;
        newPrice.high = testPrice;
        newPrice.low = testPrice;
        newPrice.close = testPrice;
        newPrice.volume = 1000;
        newPrice.source = 'cotahist' as any;

        await repo.save(newPrice);
        console.log('Inserted test price: 35.1234');

        // Read back
        const readPrice = await repo.findOne({
            where: { assetId: petr4.id, date: new Date(testDate) }
        });

        if (!readPrice) {
            console.error('Failed to read back test price.');
        } else {
            console.log(`Read back close: ${readPrice.close}`);
            // Check if precision is preserved
            if (Number(readPrice.close) === 35.1234) {
                console.log('SUCCESS: Precision preserved (35.1234).');
            } else {
                console.log(`FAILURE: Precision lost. Got ${readPrice.close}`);
            }
        }

        // Cleanup
        await repo.delete({ assetId: petr4.id, date: new Date(testDate) });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await dataSource.destroy();
    }
}

validatePrecision();
