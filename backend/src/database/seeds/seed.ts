import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedDataSources } from './data-sources.seed';

// Load environment variables
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

async function runSeeds() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected!');

    console.log('\n=== Starting database seeding ===\n');

    // Run seeds
    await seedDataSources(AppDataSource);

    console.log('\n=== Database seeding completed successfully! ===\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

runSeeds();
