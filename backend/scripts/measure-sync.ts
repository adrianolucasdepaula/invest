import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AssetsService } from '../src/api/assets/assets.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const assetsService = app.get(AssetsService);
    const logger = new Logger('MeasureSync');

    logger.log('Starting syncAllAssets measurement...');
    const start = Date.now();

    try {
        // Run sync for a subset or all to estimate
        // We'll run for all since that's the real case
        const result = await assetsService.syncAllAssets('1d'); // Use 1d to be faster but still test connection

        const end = Date.now();
        const duration = (end - start) / 1000;

        logger.log(`Sync completed in ${duration.toFixed(2)} seconds`);
        logger.log(`Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
        logger.error(`Sync failed: ${error.message}`);
    } finally {
        await app.close();
    }
}

bootstrap();
