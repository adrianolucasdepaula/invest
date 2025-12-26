import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ScraperConfig, ScraperParameters } from '../entities';

const logger = new Logger('ScraperConfigsSeed');

/**
 * Seed: Popular tabela scraper_configs
 *
 * Registra os 41 scrapers disponíveis (6 TypeScript + 35 Python)
 * com configurações padrão sensatas.
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md - Seção 6
 */

// Defaults por tipo de scraper
const DEFAULTS = {
  // API-based (rápidos)
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    maxConcurrency: 10,
    cacheExpiry: 3600,
    waitStrategy: 'load' as const,
    headless: true,
    validationWeight: 1.0,
  },
  // Playwright (lentos, requerem browser)
  playwright: {
    timeout: 60000,
    retryAttempts: 2,
    retryDelay: 3000,
    maxConcurrency: 3,
    cacheExpiry: 1800,
    waitStrategy: 'load' as const,
    headless: true,
    validationWeight: 0.9,
  },
  // Python fallback (backup)
  python: {
    timeout: 120000,
    retryAttempts: 1,
    retryDelay: 5000,
    maxConcurrency: 1,
    cacheExpiry: 3600,
    waitStrategy: 'load' as const,
    headless: true,
    validationWeight: 0.7,
  },
};

export async function seedScraperConfigs(dataSource: DataSource): Promise<void> {
  const scraperConfigRepo = dataSource.getRepository(ScraperConfig);

  // Limpar dados existentes
  await scraperConfigRepo.clear();

  const scrapers: Partial<ScraperConfig>[] = [
    // ========================================================================
    // TYPESCRIPT SCRAPERS (6) - PRIORIDADE 1-6
    // ========================================================================
    {
      scraperId: 'fundamentus',
      scraperName: 'Fundamentus',
      runtime: 'typescript',
      category: 'fundamental',
      isEnabled: true,
      priority: 1,
      parameters: DEFAULTS.playwright,
      description: 'Dados fundamentalistas de ações brasileiras (Playwright)',
      requiresAuth: false,
    },
    {
      scraperId: 'brapi',
      scraperName: 'BRAPI',
      runtime: 'typescript',
      category: 'fundamental',
      isEnabled: true,
      priority: 2,
      parameters: DEFAULTS.api,
      description: 'API brasileira de dados financeiros (REST API)',
      requiresAuth: true,
      authType: 'token',
    },
    {
      scraperId: 'statusinvest',
      scraperName: 'Status Invest',
      runtime: 'typescript',
      category: 'fundamental',
      isEnabled: true,
      priority: 3,
      parameters: {
        ...DEFAULTS.playwright,
        timeout: 90000, // StatusInvest pode ser lento
      },
      description: 'Plataforma de análise de investimentos (Playwright)',
      requiresAuth: false,
    },
    {
      scraperId: 'investidor10',
      scraperName: 'Investidor10',
      runtime: 'typescript',
      category: 'fundamental',
      isEnabled: true,
      priority: 4,
      parameters: DEFAULTS.playwright,
      description: 'Dados fundamentalistas e análises (Playwright)',
      requiresAuth: false,
    },
    {
      scraperId: 'investsite',
      scraperName: 'Investsite',
      runtime: 'typescript',
      category: 'fundamental',
      isEnabled: true,
      priority: 5,
      parameters: DEFAULTS.api,
      description: 'Portal de investimentos brasileiro (HTTP)',
      requiresAuth: false,
    },
    {
      scraperId: 'fundamentei',
      scraperName: 'Fundamentei',
      runtime: 'typescript',
      category: 'fundamental',
      isEnabled: false, // Desabilitado por padrão (requer OAuth)
      priority: 6,
      parameters: DEFAULTS.playwright,
      description: 'Análise fundamentalista avançada (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },

    // ========================================================================
    // PYTHON SCRAPERS - FUNDAMENTAL (10) - PRIORIDADE 101-110
    // ========================================================================
    {
      scraperId: 'bcb',
      scraperName: 'Banco Central do Brasil',
      runtime: 'python',
      category: 'macro',
      isEnabled: false,
      priority: 101,
      parameters: DEFAULTS.api,
      description: 'Dados macroeconômicos do BCB (API pública)',
      requiresAuth: false,
    },
    {
      scraperId: 'tradingview',
      scraperName: 'TradingView',
      runtime: 'python',
      category: 'technical',
      isEnabled: false,
      priority: 102,
      parameters: DEFAULTS.python,
      description: 'Análise técnica e indicadores (Playwright)',
      requiresAuth: false,
    },
    {
      scraperId: 'googlefinance',
      scraperName: 'Google Finance',
      runtime: 'python',
      category: 'market_data',
      isEnabled: false,
      priority: 103,
      parameters: DEFAULTS.python,
      description: 'Preços e dados de mercado do Google',
      requiresAuth: false,
    },
    {
      scraperId: 'griffin',
      scraperName: 'Griffin',
      runtime: 'python',
      category: 'fundamental',
      isEnabled: false,
      priority: 104,
      parameters: DEFAULTS.python,
      description: 'Dados fundamentalistas (Playwright)',
      requiresAuth: false,
    },
    {
      scraperId: 'coinmarketcap',
      scraperName: 'CoinMarketCap',
      runtime: 'python',
      category: 'crypto',
      isEnabled: false,
      priority: 105,
      parameters: DEFAULTS.python,
      description: 'Dados de criptomoedas',
      requiresAuth: false,
    },
    {
      scraperId: 'oceans14',
      scraperName: 'Oceans14',
      runtime: 'python',
      category: 'fundamental',
      isEnabled: false,
      priority: 106,
      parameters: DEFAULTS.python,
      description: 'Dados fundamentalistas (Playwright)',
      requiresAuth: false,
    },

    // ========================================================================
    // PYTHON SCRAPERS - NEWS (8) - PRIORIDADE 201-208
    // ========================================================================
    {
      scraperId: 'bloomberg',
      scraperName: 'Bloomberg',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 201,
      parameters: DEFAULTS.python,
      description: 'Notícias financeiras Bloomberg',
      requiresAuth: false,
    },
    {
      scraperId: 'googlenews',
      scraperName: 'Google News',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 202,
      parameters: DEFAULTS.python,
      description: 'Agregador de notícias do Google',
      requiresAuth: false,
    },
    {
      scraperId: 'investing_news',
      scraperName: 'Investing.com News',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 203,
      parameters: DEFAULTS.python,
      description: 'Notícias do Investing.com',
      requiresAuth: false,
    },
    {
      scraperId: 'valor',
      scraperName: 'Valor Econômico',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 204,
      parameters: DEFAULTS.python,
      description: 'Notícias do Valor Econômico',
      requiresAuth: false,
    },
    {
      scraperId: 'exame',
      scraperName: 'Revista Exame',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 205,
      parameters: DEFAULTS.python,
      description: 'Notícias da Revista Exame',
      requiresAuth: false,
    },
    {
      scraperId: 'infomoney',
      scraperName: 'InfoMoney',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 206,
      parameters: DEFAULTS.python,
      description: 'Notícias do InfoMoney',
      requiresAuth: false,
    },
    {
      scraperId: 'estadao',
      scraperName: 'Estadão',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 207,
      parameters: DEFAULTS.python,
      description: 'Notícias do Estadão',
      requiresAuth: false,
    },
    {
      scraperId: 'einvestidor',
      scraperName: 'E-Investidor',
      runtime: 'python',
      category: 'news',
      isEnabled: false,
      priority: 208,
      parameters: DEFAULTS.python,
      description: 'Notícias do E-Investidor (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },

    // ========================================================================
    // PYTHON SCRAPERS - AI (6) - PRIORIDADE 301-306
    // ========================================================================
    {
      scraperId: 'chatgpt',
      scraperName: 'ChatGPT',
      runtime: 'python',
      category: 'ai',
      isEnabled: false,
      priority: 301,
      parameters: DEFAULTS.python,
      description: 'Análise de IA via ChatGPT (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },
    {
      scraperId: 'gemini',
      scraperName: 'Google Gemini',
      runtime: 'python',
      category: 'ai',
      isEnabled: false,
      priority: 302,
      parameters: DEFAULTS.python,
      description: 'Análise de IA via Gemini (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },
    {
      scraperId: 'deepseek',
      scraperName: 'DeepSeek',
      runtime: 'python',
      category: 'ai',
      isEnabled: false,
      priority: 303,
      parameters: DEFAULTS.python,
      description: 'Análise de IA via DeepSeek (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },
    {
      scraperId: 'claude',
      scraperName: 'Claude',
      runtime: 'python',
      category: 'ai',
      isEnabled: false,
      priority: 304,
      parameters: DEFAULTS.python,
      description: 'Análise de IA via Claude (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },
    {
      scraperId: 'grok',
      scraperName: 'Grok',
      runtime: 'python',
      category: 'ai',
      isEnabled: false,
      priority: 305,
      parameters: DEFAULTS.python,
      description: 'Análise de IA via Grok (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },
    {
      scraperId: 'perplexity',
      scraperName: 'Perplexity',
      runtime: 'python',
      category: 'ai',
      isEnabled: false,
      priority: 306,
      parameters: DEFAULTS.python,
      description: 'Análise de IA via Perplexity (OAuth Google)',
      requiresAuth: true,
      authType: 'google',
    },

    // ========================================================================
    // PYTHON SCRAPERS - MARKET DATA (8) - PRIORIDADE 401-408
    // ========================================================================
    {
      scraperId: 'yahoo_finance',
      scraperName: 'Yahoo Finance',
      runtime: 'python',
      category: 'market_data',
      isEnabled: false,
      priority: 401,
      parameters: DEFAULTS.api,
      description: 'Preços e dados de mercado do Yahoo',
      requiresAuth: false,
    },
    {
      scraperId: 'oplab',
      scraperName: 'OpLab',
      runtime: 'python',
      category: 'options',
      isEnabled: false,
      priority: 402,
      parameters: DEFAULTS.python,
      description: 'Dados de opções (Playwright)',
      requiresAuth: false,
    },
    {
      scraperId: 'opcoes_net',
      scraperName: 'Opções.net',
      runtime: 'python',
      category: 'options',
      isEnabled: false,
      priority: 403,
      parameters: DEFAULTS.python,
      description: 'Dados de opções (credenciais)',
      requiresAuth: true,
      authType: 'credentials',
    },
    {
      scraperId: 'kinvo',
      scraperName: 'Kinvo',
      runtime: 'python',
      category: 'market_data',
      isEnabled: false,
      priority: 404,
      parameters: DEFAULTS.python,
      description: 'Dados de mercado (credenciais)',
      requiresAuth: true,
      authType: 'credentials',
    },
    {
      scraperId: 'investing',
      scraperName: 'Investing.com',
      runtime: 'python',
      category: 'market_data',
      isEnabled: false,
      priority: 405,
      parameters: DEFAULTS.python,
      description: 'Dados de mercado global',
      requiresAuth: false,
    },
    {
      scraperId: 'b3',
      scraperName: 'B3',
      runtime: 'python',
      category: 'market_data',
      isEnabled: false,
      priority: 406,
      parameters: DEFAULTS.python,
      description: 'Dados oficiais da B3',
      requiresAuth: false,
    },
    {
      scraperId: 'advfn',
      scraperName: 'ADVFN',
      runtime: 'python',
      category: 'market_data',
      isEnabled: false,
      priority: 407,
      parameters: DEFAULTS.python,
      description: 'Dados de mercado ADVFN',
      requiresAuth: false,
    },
    {
      scraperId: 'idiv',
      scraperName: 'iDiv',
      runtime: 'python',
      category: 'fundamental',
      isEnabled: false,
      priority: 408,
      parameters: DEFAULTS.python,
      description: 'Dados de dividendos',
      requiresAuth: false,
    },

    // ========================================================================
    // PYTHON SCRAPERS - OAUTH (2) - PRIORIDADE 501-502
    // ========================================================================
    {
      scraperId: 'maisretorno',
      scraperName: 'Mais Retorno',
      runtime: 'python',
      category: 'fundamental',
      isEnabled: false,
      priority: 501,
      parameters: DEFAULTS.python,
      description: 'Análise fundamentalista (OAuth)',
      requiresAuth: true,
      authType: 'google',
    },

    // ========================================================================
    // PYTHON SCRAPERS - ECONOMIC (4) - PRIORIDADE 601-604
    // ========================================================================
    {
      scraperId: 'anbima',
      scraperName: 'ANBIMA',
      runtime: 'python',
      category: 'macro',
      isEnabled: false,
      priority: 601,
      parameters: DEFAULTS.api,
      description: 'Indicadores ANBIMA (API pública)',
      requiresAuth: false,
    },
    {
      scraperId: 'fred',
      scraperName: 'FRED',
      runtime: 'python',
      category: 'macro',
      isEnabled: false,
      priority: 602,
      parameters: DEFAULTS.api,
      description: 'Federal Reserve Economic Data (API)',
      requiresAuth: true,
      authType: 'api_key',
    },
    {
      scraperId: 'ipeadata',
      scraperName: 'IpeaData',
      runtime: 'python',
      category: 'macro',
      isEnabled: false,
      priority: 603,
      parameters: DEFAULTS.api,
      description: 'Dados econômicos do IPEA (API pública)',
      requiresAuth: false,
    },
    {
      scraperId: 'ibge',
      scraperName: 'IBGE SIDRA',
      runtime: 'python',
      category: 'macro',
      isEnabled: false,
      priority: 604,
      parameters: DEFAULTS.api,
      description: 'Dados econômicos do IBGE (API pública)',
      requiresAuth: false,
    },

    // ========================================================================
    // PYTHON SCRAPERS - CRYPTO (2) - PRIORIDADE 701-702
    // ========================================================================
    {
      scraperId: 'coingecko',
      scraperName: 'CoinGecko',
      runtime: 'python',
      category: 'crypto',
      isEnabled: false,
      priority: 701,
      parameters: DEFAULTS.api,
      description: 'Dados de criptomoedas (API pública)',
      requiresAuth: false,
    },

    // ========================================================================
    // PYTHON SCRAPERS - WHEEL STRATEGY (2) - PRIORIDADE 801-802
    // ========================================================================
    {
      scraperId: 'statusinvest_dividends',
      scraperName: 'Status Invest Dividendos',
      runtime: 'python',
      category: 'fundamental',
      isEnabled: false,
      priority: 801,
      parameters: DEFAULTS.python,
      description: 'Histórico de dividendos (Playwright)',
      requiresAuth: false,
    },
    {
      scraperId: 'stock_lending',
      scraperName: 'Stock Lending',
      runtime: 'python',
      category: 'fundamental',
      isEnabled: false,
      priority: 802,
      parameters: DEFAULTS.python,
      description: 'Taxas de empréstimo de ações (Playwright)',
      requiresAuth: false,
    },
  ];

  // Inserir em batch
  await scraperConfigRepo.save(scrapers);

  // BUG-010 FIX: Usar logger estruturado ao invés de console.log (CLAUDE.md)
  logger.log(`✅ Seed: ${scrapers.length} scrapers inseridos em scraper_configs`);
}
