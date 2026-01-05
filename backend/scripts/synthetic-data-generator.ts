/**
 * Synthetic Data Generator for B3 AI Analysis Platform
 *
 * Generates realistic synthetic test data for:
 * - Assets (stocks, FIIs, ETFs, options)
 * - Users
 * - Portfolios and positions
 * - Option prices with Greeks
 *
 * Uses Faker.js for realistic data generation with reproducible seeds.
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see Synthetic Test Data (Tool #10)
 * @license FREE (100% open source)
 *
 * Usage:
 * npx ts-node scripts/synthetic-data-generator.ts --entities Asset --count 100 --seed 42
 * npx ts-node scripts/synthetic-data-generator.ts --all --count 50 --verbose
 * npx ts-node scripts/synthetic-data-generator.ts --entities Asset,User,Portfolio --count 20
 */

import { faker } from '@faker-js/faker';
import Decimal from 'decimal.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export type EntityType = 'Asset' | 'User' | 'Portfolio' | 'Option' | 'PortfolioPosition';

export interface GeneratorConfig {
  entities: EntityType[];
  count: number;
  seed?: number;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface GeneratedData {
  assets: SyntheticAsset[];
  users: SyntheticUser[];
  portfolios: SyntheticPortfolio[];
  options: SyntheticOption[];
  positions: SyntheticPosition[];
}

// =============================================================================
// SYNTHETIC DATA TYPES
// =============================================================================

export interface SyntheticAsset {
  ticker: string;
  name: string;
  type: 'stock' | 'fii' | 'etf' | 'bdr' | 'option';
  sector: string;
  subsector: string;
  cnpj: string;
  website: string;
  description: string;
  isActive: boolean;
  hasOptions: boolean;
  listingDate: Date;
  metadata: Record<string, unknown>;
}

export interface SyntheticUser {
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isActive: boolean;
  isEmailVerified: boolean;
  preferences: Record<string, unknown>;
  lastLogin: Date;
}

export interface SyntheticPortfolio {
  userId: string;
  name: string;
  description: string;
  isActive: boolean;
  totalInvested: Decimal;
  currentValue: Decimal;
  profit: Decimal;
  profitPercentage: Decimal;
  settings: Record<string, unknown>;
}

export interface SyntheticOption {
  ticker: string;
  underlyingTicker: string;
  type: 'call' | 'put';
  style: 'american' | 'european';
  status: 'active' | 'expired' | 'exercised';
  strike: Decimal;
  expirationDate: Date;
  lastPrice: Decimal;
  bid: Decimal;
  ask: Decimal;
  volume: number;
  openInterest: number;
  impliedVolatility: Decimal;
  delta: Decimal;
  gamma: Decimal;
  theta: Decimal;
  vega: Decimal;
  rho: Decimal;
  underlyingPrice: Decimal;
  intrinsicValue: Decimal;
  extrinsicValue: Decimal;
  daysToExpiration: number;
  inTheMoney: boolean;
  source: string;
}

export interface SyntheticPosition {
  portfolioId: string;
  assetId: string;
  quantity: Decimal;
  averagePrice: Decimal;
  currentPrice: Decimal;
  totalInvested: Decimal;
  currentValue: Decimal;
  profit: Decimal;
  profitPercentage: Decimal;
  firstBuyDate: Date;
}

// =============================================================================
// B3 SPECIFIC DATA
// =============================================================================

const B3_SECTORS = [
  'Financeiro',
  'Utilidade Pública',
  'Materiais Básicos',
  'Consumo Cíclico',
  'Consumo não Cíclico',
  'Petróleo, Gás e Biocombustíveis',
  'Saúde',
  'Bens Industriais',
  'Tecnologia da Informação',
  'Comunicações',
  'Imobiliário',
];

const B3_SUBSECTORS: Record<string, string[]> = {
  Financeiro: ['Bancos', 'Seguradoras', 'Serviços Financeiros', 'Previdência'],
  'Utilidade Pública': ['Energia Elétrica', 'Água e Saneamento', 'Gás'],
  'Materiais Básicos': ['Siderurgia', 'Mineração', 'Papel e Celulose', 'Químicos'],
  'Consumo Cíclico': ['Varejo', 'Vestuário', 'Construção Civil', 'Turismo'],
  'Consumo não Cíclico': ['Alimentos', 'Bebidas', 'Fumo', 'Higiene Pessoal'],
  'Petróleo, Gás e Biocombustíveis': ['Exploração', 'Refino', 'Distribuição'],
  Saúde: ['Hospitais', 'Laboratórios', 'Farmacêuticas', 'Planos de Saúde'],
  'Bens Industriais': ['Máquinas', 'Equipamentos', 'Transporte', 'Logística'],
  'Tecnologia da Informação': ['Software', 'Hardware', 'Serviços de TI'],
  Comunicações: ['Telecomunicações', 'Mídia', 'Internet'],
  Imobiliário: ['FIIs', 'Incorporadoras', 'Shopping Centers', 'Logística'],
};

const B3_STOCK_SUFFIXES = ['3', '4', '5', '6', '11'];
const B3_FII_SUFFIXES = ['11', '11B'];
const B3_ETF_SUFFIXES = ['11'];

const OPTION_MONTHS_CALL = 'ABCDEFGHIJKL';
const OPTION_MONTHS_PUT = 'MNOPQRSTUVWX';

// =============================================================================
// GENERATOR CLASS
// =============================================================================

export class SyntheticDataGenerator {
  private config: GeneratorConfig;
  private data: GeneratedData = {
    assets: [],
    users: [],
    portfolios: [],
    options: [],
    positions: [],
  };

  constructor(config: GeneratorConfig) {
    this.config = config;

    // Set seed for reproducibility
    if (config.seed !== undefined) {
      faker.seed(config.seed);
    }

    this.log(`Initialized with seed: ${config.seed ?? 'random'}`);
  }

  // ===========================================================================
  // MAIN GENERATION METHODS
  // ===========================================================================

  async generate(): Promise<GeneratedData> {
    const { entities, count } = this.config;

    for (const entity of entities) {
      this.log(`Generating ${count} ${entity}(s)...`);

      switch (entity) {
        case 'Asset':
          this.data.assets = this.generateAssets(count);
          break;
        case 'User':
          this.data.users = this.generateUsers(count);
          break;
        case 'Portfolio':
          this.data.portfolios = this.generatePortfolios(count);
          break;
        case 'Option':
          this.data.options = this.generateOptions(count);
          break;
        case 'PortfolioPosition':
          this.data.positions = this.generatePositions(count);
          break;
      }
    }

    this.printSummary();
    return this.data;
  }

  // ===========================================================================
  // ASSET GENERATION
  // ===========================================================================

  private generateAssets(count: number): SyntheticAsset[] {
    const assets: SyntheticAsset[] = [];
    const usedTickers = new Set<string>();

    for (let i = 0; i < count; i++) {
      const type = this.randomAssetType();
      let ticker: string;

      // Generate unique ticker
      do {
        ticker = this.generateTicker(type);
      } while (usedTickers.has(ticker));
      usedTickers.add(ticker);

      const sector = faker.helpers.arrayElement(B3_SECTORS);
      const subsectors = B3_SUBSECTORS[sector] || ['Geral'];

      assets.push({
        ticker,
        name: this.generateCompanyName(),
        type,
        sector,
        subsector: faker.helpers.arrayElement(subsectors),
        cnpj: this.generateCNPJ(),
        website: faker.internet.url(),
        description: faker.company.catchPhrase(),
        isActive: faker.datatype.boolean({ probability: 0.95 }),
        hasOptions: type === 'stock' && faker.datatype.boolean({ probability: 0.3 }),
        listingDate: faker.date.past({ years: 20 }),
        metadata: {
          isin: this.generateISIN(),
          tradingCode: ticker,
          segment: faker.helpers.arrayElement(['Novo Mercado', 'N1', 'N2', 'Tradicional']),
        },
      });
    }

    return assets;
  }

  private generateTicker(type: string): string {
    const base = faker.string.alpha({ length: 4, casing: 'upper' });

    switch (type) {
      case 'stock':
        return base + faker.helpers.arrayElement(B3_STOCK_SUFFIXES);
      case 'fii':
        return base + faker.helpers.arrayElement(B3_FII_SUFFIXES);
      case 'etf':
        return base + faker.helpers.arrayElement(B3_ETF_SUFFIXES);
      case 'bdr':
        return base + '34';
      default:
        return base + '3';
    }
  }

  private randomAssetType(): 'stock' | 'fii' | 'etf' | 'bdr' {
    const weights = [
      { type: 'stock' as const, weight: 0.6 },
      { type: 'fii' as const, weight: 0.2 },
      { type: 'etf' as const, weight: 0.1 },
      { type: 'bdr' as const, weight: 0.1 },
    ];

    const random = Math.random();
    let cumulative = 0;

    for (const { type, weight } of weights) {
      cumulative += weight;
      if (random < cumulative) return type;
    }

    return 'stock';
  }

  private generateCompanyName(): string {
    return `${faker.company.name()} S.A.`;
  }

  private generateCNPJ(): string {
    const base = faker.string.numeric({ length: 8 });
    const branch = faker.string.numeric({ length: 4 });
    const check = faker.string.numeric({ length: 2 });
    return `${base}/${branch}-${check}`;
  }

  private generateISIN(): string {
    return `BR${faker.string.alpha({ length: 4, casing: 'upper' })}${faker.string.alphanumeric({ length: 5, casing: 'upper' })}${faker.string.numeric({ length: 1 })}`;
  }

  // ===========================================================================
  // USER GENERATION
  // ===========================================================================

  private generateUsers(count: number): SyntheticUser[] {
    const users: SyntheticUser[] = [];
    const usedEmails = new Set<string>();

    for (let i = 0; i < count; i++) {
      let email: string;

      // Generate unique email
      do {
        email = faker.internet.email().toLowerCase();
      } while (usedEmails.has(email));
      usedEmails.add(email);

      users.push({
        email,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        avatar: faker.image.avatar(),
        isActive: faker.datatype.boolean({ probability: 0.95 }),
        isEmailVerified: faker.datatype.boolean({ probability: 0.8 }),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
          language: faker.helpers.arrayElement(['pt-BR', 'en-US']),
          currency: 'BRL',
          notifications: {
            email: faker.datatype.boolean(),
            push: faker.datatype.boolean(),
          },
        },
        lastLogin: faker.date.recent({ days: 30 }),
      });
    }

    return users;
  }

  // ===========================================================================
  // PORTFOLIO GENERATION
  // ===========================================================================

  private generatePortfolios(count: number): SyntheticPortfolio[] {
    const portfolios: SyntheticPortfolio[] = [];

    for (let i = 0; i < count; i++) {
      const totalInvested = new Decimal(faker.number.float({ min: 1000, max: 1000000, fractionDigits: 2 }));
      const returnPct = new Decimal(faker.number.float({ min: -0.5, max: 1.0, fractionDigits: 4 }));
      const currentValue = totalInvested.mul(new Decimal(1).plus(returnPct));
      const profit = currentValue.minus(totalInvested);

      portfolios.push({
        userId: faker.string.uuid(),
        name: faker.helpers.arrayElement([
          'Carteira Principal',
          'Dividendos',
          'Growth',
          'Value Investing',
          'FIIs',
          'Aposentadoria',
          'Reserva de Emergência',
          'Especulação',
        ]),
        description: faker.lorem.sentence(),
        isActive: faker.datatype.boolean({ probability: 0.9 }),
        totalInvested,
        currentValue,
        profit,
        profitPercentage: returnPct.mul(100),
        settings: {
          benchmarkIndex: faker.helpers.arrayElement(['IBOV', 'IFIX', 'CDI', 'IPCA']),
          targetAllocation: this.generateAllocation(),
          rebalanceFrequency: faker.helpers.arrayElement(['monthly', 'quarterly', 'yearly', 'manual']),
        },
      });
    }

    return portfolios;
  }

  private generateAllocation(): Record<string, number> {
    const categories = ['stocks', 'fiis', 'bonds', 'cash', 'international'];
    const allocation: Record<string, number> = {};
    let remaining = 100;

    for (let i = 0; i < categories.length - 1; i++) {
      const value = faker.number.int({ min: 0, max: remaining });
      allocation[categories[i]] = value;
      remaining -= value;
    }
    allocation[categories[categories.length - 1]] = remaining;

    return allocation;
  }

  // ===========================================================================
  // OPTION GENERATION
  // ===========================================================================

  private generateOptions(count: number): SyntheticOption[] {
    const options: SyntheticOption[] = [];
    const usedTickers = new Set<string>();

    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(['call', 'put'] as const);
      const underlyingTicker = faker.string.alpha({ length: 4, casing: 'upper' }) + '3';

      let optionTicker: string;
      do {
        optionTicker = this.generateOptionTicker(underlyingTicker, type);
      } while (usedTickers.has(optionTicker));
      usedTickers.add(optionTicker);

      const underlyingPrice = new Decimal(faker.number.float({ min: 5, max: 200, fractionDigits: 2 }));
      const strikeOffset = faker.number.float({ min: -0.2, max: 0.2 });
      const strike = underlyingPrice.mul(1 + strikeOffset).toDecimalPlaces(2);

      const daysToExpiration = faker.number.int({ min: 1, max: 120 });
      const iv = new Decimal(faker.number.float({ min: 0.15, max: 0.8, fractionDigits: 4 }));

      // Generate realistic Greeks
      const delta = this.calculateDelta(type, underlyingPrice, strike);
      const gamma = new Decimal(faker.number.float({ min: 0.001, max: 0.05, fractionDigits: 4 }));
      const theta = new Decimal(faker.number.float({ min: -0.1, max: 0, fractionDigits: 4 }));
      const vega = new Decimal(faker.number.float({ min: 0.01, max: 0.3, fractionDigits: 4 }));
      const rho = new Decimal(faker.number.float({ min: -0.05, max: 0.05, fractionDigits: 4 }));

      // Calculate intrinsic/extrinsic values
      const inTheMoney =
        type === 'call'
          ? underlyingPrice.greaterThan(strike)
          : underlyingPrice.lessThan(strike);

      const intrinsicValue = inTheMoney
        ? type === 'call'
          ? underlyingPrice.minus(strike)
          : strike.minus(underlyingPrice)
        : new Decimal(0);

      const extrinsicValue = new Decimal(faker.number.float({ min: 0.01, max: 5, fractionDigits: 2 }));
      const lastPrice = intrinsicValue.plus(extrinsicValue);
      const spread = lastPrice.mul(faker.number.float({ min: 0.01, max: 0.05 }));
      const bid = lastPrice.minus(spread.div(2)).toDecimalPlaces(2);
      const ask = lastPrice.plus(spread.div(2)).toDecimalPlaces(2);

      options.push({
        ticker: optionTicker,
        underlyingTicker,
        type,
        style: faker.helpers.arrayElement(['american', 'european'] as const),
        status: faker.helpers.arrayElement(['active', 'expired', 'exercised'] as const),
        strike,
        expirationDate: faker.date.future({ years: 1 }),
        lastPrice,
        bid,
        ask,
        volume: faker.number.int({ min: 0, max: 100000 }),
        openInterest: faker.number.int({ min: 0, max: 500000 }),
        impliedVolatility: iv,
        delta,
        gamma,
        theta,
        vega,
        rho,
        underlyingPrice,
        intrinsicValue,
        extrinsicValue,
        daysToExpiration,
        inTheMoney,
        source: faker.helpers.arrayElement(['opcoes.net.br', 'b3', 'statusinvest']),
      });
    }

    return options;
  }

  private generateOptionTicker(underlying: string, type: 'call' | 'put'): string {
    const monthIndex = faker.number.int({ min: 0, max: 11 });
    const monthLetter = type === 'call'
      ? OPTION_MONTHS_CALL[monthIndex]
      : OPTION_MONTHS_PUT[monthIndex];
    const strike = faker.number.int({ min: 10, max: 200 });

    return `${underlying.slice(0, 4)}${monthLetter}${strike}`;
  }

  private calculateDelta(type: 'call' | 'put', underlying: Decimal, strike: Decimal): Decimal {
    const moneyness = underlying.div(strike).toNumber();
    let delta: number;

    if (type === 'call') {
      // Call delta: 0 to 1, higher when ITM
      delta = Math.min(Math.max(0.5 + (moneyness - 1) * 2, 0.01), 0.99);
    } else {
      // Put delta: -1 to 0, more negative when ITM
      delta = Math.max(Math.min(-0.5 + (moneyness - 1) * 2, -0.01), -0.99);
    }

    return new Decimal(delta).toDecimalPlaces(4);
  }

  // ===========================================================================
  // POSITION GENERATION
  // ===========================================================================

  private generatePositions(count: number): SyntheticPosition[] {
    const positions: SyntheticPosition[] = [];

    for (let i = 0; i < count; i++) {
      const averagePrice = new Decimal(faker.number.float({ min: 5, max: 200, fractionDigits: 2 }));
      const priceChange = faker.number.float({ min: -0.5, max: 1.0 });
      const currentPrice = averagePrice.mul(1 + priceChange).toDecimalPlaces(2);
      const quantity = new Decimal(faker.number.int({ min: 1, max: 1000 }));
      const totalInvested = quantity.mul(averagePrice);
      const currentValue = quantity.mul(currentPrice);
      const profit = currentValue.minus(totalInvested);
      const profitPercentage = profit.div(totalInvested).mul(100);

      positions.push({
        portfolioId: faker.string.uuid(),
        assetId: faker.string.uuid(),
        quantity,
        averagePrice,
        currentPrice,
        totalInvested,
        currentValue,
        profit,
        profitPercentage,
        firstBuyDate: faker.date.past({ years: 5 }),
      });
    }

    return positions;
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[SyntheticDataGenerator] ${message}`);
    }
  }

  private printSummary(): void {
    console.log('\n========================================');
    console.log('  Synthetic Data Generation Summary');
    console.log('========================================');
    console.log(`  Assets:     ${this.data.assets.length}`);
    console.log(`  Users:      ${this.data.users.length}`);
    console.log(`  Portfolios: ${this.data.portfolios.length}`);
    console.log(`  Options:    ${this.data.options.length}`);
    console.log(`  Positions:  ${this.data.positions.length}`);
    console.log('========================================\n');

    if (this.config.verbose && this.data.assets.length > 0) {
      console.log('Sample Asset:', JSON.stringify(this.data.assets[0], null, 2));
    }
    if (this.config.verbose && this.data.options.length > 0) {
      console.log('Sample Option:', JSON.stringify(this.data.options[0], this.decimalReplacer, 2));
    }
  }

  private decimalReplacer(_key: string, value: unknown): unknown {
    if (value instanceof Decimal) {
      return value.toString();
    }
    return value;
  }

  // ===========================================================================
  // EXPORT METHODS
  // ===========================================================================

  toJSON(): string {
    return JSON.stringify(this.data, this.decimalReplacer, 2);
  }

  getGeneratedData(): GeneratedData {
    return this.data;
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

function parseArgs(): GeneratorConfig {
  const args = process.argv.slice(2);
  const config: GeneratorConfig = {
    entities: [],
    count: 10,
    verbose: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--entities':
        config.entities = args[++i].split(',') as EntityType[];
        break;
      case '--all':
        config.entities = ['Asset', 'User', 'Portfolio', 'Option', 'PortfolioPosition'];
        break;
      case '--count':
        config.count = parseInt(args[++i], 10);
        break;
      case '--seed':
        config.seed = parseInt(args[++i], 10);
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  if (config.entities.length === 0) {
    config.entities = ['Asset'];
  }

  return config;
}

function printHelp(): void {
  console.log(`
Synthetic Data Generator for B3 AI Analysis Platform

Usage:
  npx ts-node scripts/synthetic-data-generator.ts [options]

Options:
  --entities <list>   Comma-separated list of entities to generate
                      Valid: Asset, User, Portfolio, Option, PortfolioPosition
  --all               Generate all entity types
  --count <number>    Number of records per entity (default: 10)
  --seed <number>     Random seed for reproducibility
  --verbose           Enable verbose output
  --dry-run           Generate but don't save to database
  --help              Show this help message

Examples:
  npx ts-node scripts/synthetic-data-generator.ts --entities Asset --count 100 --seed 42
  npx ts-node scripts/synthetic-data-generator.ts --all --count 50 --verbose
  npx ts-node scripts/synthetic-data-generator.ts --entities Asset,User,Portfolio --count 20
`);
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  console.log('\n🔧 Synthetic Data Generator - FASE 158');
  console.log('==========================================');
  console.log(`Entities: ${config.entities.join(', ')}`);
  console.log(`Count: ${config.count}`);
  console.log(`Seed: ${config.seed ?? 'random'}`);
  console.log(`Verbose: ${config.verbose}`);
  console.log(`Dry Run: ${config.dryRun}`);
  console.log('==========================================\n');

  const generator = new SyntheticDataGenerator(config);
  const data = await generator.generate();

  if (config.dryRun) {
    console.log('✅ Dry run complete. Data generated but not saved.');

    // Output sample data
    if (config.verbose) {
      console.log('\nGenerated Data (JSON):');
      console.log(generator.toJSON());
    }
  } else {
    console.log('✅ Data generation complete.');
    console.log('Note: Database insertion not implemented. Use --dry-run for testing.');
  }

  return;
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default SyntheticDataGenerator;
