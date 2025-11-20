/**
 * TradingView Widgets - Constants
 *
 * Constants for TradingView widgets: B3 symbols, themes, technical studies, etc.
 *
 * @module tradingview/constants
 * @version 1.0.0
 * @created 2025-11-20
 */

import type {
  B3Symbol,
  TradingViewTheme,
  TradingViewLocale,
  ChartInterval,
  TechnicalAnalysisInterval,
} from './types';

// ============================================================================
// B3 (BOVESPA) SYMBOLS
// ============================================================================

/**
 * B3 Exchange identifier for TradingView
 */
export const B3_EXCHANGE = 'BMFBOVESPA';

/**
 * B3 Blue Chips (Top 10 most liquid stocks)
 */
export const B3_BLUE_CHIPS: B3Symbol[] = [
  {
    proName: 'BMFBOVESPA:PETR4',
    ticker: 'PETR4',
    title: 'Petrobras PN',
    name: 'Petrobras PN',
    sector: 'Petróleo, Gás e Biocombustíveis',
    segment: 'Petróleo, Gás e Biocombustíveis',
  },
  {
    proName: 'BMFBOVESPA:VALE3',
    ticker: 'VALE3',
    title: 'Vale ON',
    name: 'Vale ON',
    sector: 'Mineração',
    segment: 'Minerais Metálicos',
  },
  {
    proName: 'BMFBOVESPA:ITUB4',
    ticker: 'ITUB4',
    title: 'Itaú Unibanco PN',
    name: 'Itaú Unibanco PN',
    sector: 'Financeiro',
    segment: 'Bancos',
  },
  {
    proName: 'BMFBOVESPA:BBDC4',
    ticker: 'BBDC4',
    title: 'Bradesco PN',
    name: 'Bradesco PN',
    sector: 'Financeiro',
    segment: 'Bancos',
  },
  {
    proName: 'BMFBOVESPA:ABEV3',
    ticker: 'ABEV3',
    title: 'Ambev ON',
    name: 'Ambev ON',
    sector: 'Consumo não Cíclico',
    segment: 'Bebidas',
  },
  {
    proName: 'BMFBOVESPA:BBAS3',
    ticker: 'BBAS3',
    title: 'Banco do Brasil ON',
    name: 'Banco do Brasil ON',
    sector: 'Financeiro',
    segment: 'Bancos',
  },
  {
    proName: 'BMFBOVESPA:WEGE3',
    ticker: 'WEGE3',
    title: 'WEG ON',
    name: 'WEG ON',
    sector: 'Bens Industriais',
    segment: 'Máquinas e Equipamentos',
  },
  {
    proName: 'BMFBOVESPA:RENT3',
    ticker: 'RENT3',
    title: 'Localiza ON',
    name: 'Localiza ON',
    sector: 'Consumo Cíclico',
    segment: 'Aluguel de Carros',
  },
  {
    proName: 'BMFBOVESPA:B3SA3',
    ticker: 'B3SA3',
    title: 'B3 ON',
    name: 'B3 ON',
    sector: 'Financeiro',
    segment: 'Serviços Financeiros Diversos',
  },
  {
    proName: 'BMFBOVESPA:MGLU3',
    ticker: 'MGLU3',
    title: 'Magazine Luiza ON',
    name: 'Magazine Luiza ON',
    sector: 'Consumo Cíclico',
    segment: 'Comércio',
  },
];

/**
 * B3 High Liquidity Stocks (Extended list - Top 30)
 */
export const B3_HIGH_LIQUIDITY: B3Symbol[] = [
  ...B3_BLUE_CHIPS,
  {
    proName: 'BMFBOVESPA:SUZB3',
    ticker: 'SUZB3',
    title: 'Suzano ON',
    name: 'Suzano ON',
    sector: 'Materiais Básicos',
    segment: 'Papel e Celulose',
  },
  {
    proName: 'BMFBOVESPA:JBSS3',
    ticker: 'JBSS3',
    title: 'JBS ON',
    name: 'JBS ON',
    sector: 'Consumo não Cíclico',
    segment: 'Alimentos Processados',
  },
  {
    proName: 'BMFBOVESPA:RAIL3',
    ticker: 'RAIL3',
    title: 'Rumo ON',
    name: 'Rumo ON',
    sector: 'Bens Industriais',
    segment: 'Transporte',
  },
  {
    proName: 'BMFBOVESPA:RADL3',
    ticker: 'RADL3',
    title: 'Raia Drogasil ON',
    name: 'Raia Drogasil ON',
    sector: 'Saúde',
    segment: 'Comércio e Distribuição',
  },
  {
    proName: 'BMFBOVESPA:HAPV3',
    ticker: 'HAPV3',
    title: 'Hapvida ON',
    name: 'Hapvida ON',
    sector: 'Saúde',
    segment: 'Serviços Médicos Hospitalares',
  },
  {
    proName: 'BMFBOVESPA:GGBR4',
    ticker: 'GGBR4',
    title: 'Gerdau PN',
    name: 'Gerdau PN',
    sector: 'Materiais Básicos',
    segment: 'Siderurgia',
  },
  {
    proName: 'BMFBOVESPA:CSNA3',
    ticker: 'CSNA3',
    title: 'CSN ON',
    name: 'CSN ON',
    sector: 'Materiais Básicos',
    segment: 'Siderurgia',
  },
  {
    proName: 'BMFBOVESPA:VIVT3',
    ticker: 'VIVT3',
    title: 'Vivo ON',
    name: 'Vivo ON',
    sector: 'Telecomunicações',
    segment: 'Telecomunicações',
  },
  {
    proName: 'BMFBOVESPA:ELET3',
    ticker: 'ELET3',
    title: 'Eletrobras ON',
    name: 'Eletrobras ON',
    sector: 'Utilidade Pública',
    segment: 'Energia Elétrica',
  },
  {
    proName: 'BMFBOVESPA:SANB11',
    ticker: 'SANB11',
    title: 'Santander Brasil Unit',
    name: 'Santander Brasil Unit',
    sector: 'Financeiro',
    segment: 'Bancos',
  },
  {
    proName: 'BMFBOVESPA:EMBR3',
    ticker: 'EMBR3',
    title: 'Embraer ON',
    name: 'Embraer ON',
    sector: 'Bens Industriais',
    segment: 'Aeronáutica',
  },
  {
    proName: 'BMFBOVESPA:CSAN3',
    ticker: 'CSAN3',
    title: 'Cosan ON',
    name: 'Cosan ON',
    sector: 'Petróleo, Gás e Biocombustíveis',
    segment: 'Biocombustíveis',
  },
  {
    proName: 'BMFBOVESPA:BEEF3',
    ticker: 'BEEF3',
    title: 'Minerva ON',
    name: 'Minerva ON',
    sector: 'Consumo não Cíclico',
    segment: 'Alimentos Processados',
  },
  {
    proName: 'BMFBOVESPA:NTCO3',
    ticker: 'NTCO3',
    title: 'Natura ON',
    name: 'Natura ON',
    sector: 'Consumo Cíclico',
    segment: 'Produtos de Uso Pessoal',
  },
  {
    proName: 'BMFBOVESPA:LREN3',
    ticker: 'LREN3',
    title: 'Lojas Renner ON',
    name: 'Lojas Renner ON',
    sector: 'Consumo Cíclico',
    segment: 'Comércio',
  },
  {
    proName: 'BMFBOVESPA:CIEL3',
    ticker: 'CIEL3',
    title: 'Cielo ON',
    name: 'Cielo ON',
    sector: 'Financeiro',
    segment: 'Serviços Financeiros Diversos',
  },
  {
    proName: 'BMFBOVESPA:PRIO3',
    ticker: 'PRIO3',
    title: 'PRIO ON',
    name: 'PRIO ON',
    sector: 'Petróleo, Gás e Biocombustíveis',
    segment: 'Exploração e Produção',
  },
  {
    proName: 'BMFBOVESPA:KLBN11',
    ticker: 'KLBN11',
    title: 'Klabin Unit',
    name: 'Klabin Unit',
    sector: 'Materiais Básicos',
    segment: 'Papel e Celulose',
  },
  {
    proName: 'BMFBOVESPA:CPFE3',
    ticker: 'CPFE3',
    title: 'CPFL Energia ON',
    name: 'CPFL Energia ON',
    sector: 'Utilidade Pública',
    segment: 'Energia Elétrica',
  },
  {
    proName: 'BMFBOVESPA:EQTL3',
    ticker: 'EQTL3',
    title: 'Equatorial ON',
    name: 'Equatorial ON',
    sector: 'Utilidade Pública',
    segment: 'Energia Elétrica',
  },
];

/**
 * B3 Indices
 */
export const B3_INDICES: B3Symbol[] = [
  {
    proName: 'BMFBOVESPA:IBOV',
    ticker: 'IBOV',
    title: 'Ibovespa',
    name: 'Ibovespa',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:IFIX',
    ticker: 'IFIX',
    title: 'IFIX',
    name: 'IFIX (Fundos Imobiliários)',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:SMLL',
    ticker: 'SMLL',
    title: 'Small Caps',
    name: 'Small Caps Index',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:IDIV',
    ticker: 'IDIV',
    title: 'Dividendos',
    name: 'Índice Dividendos',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:UTIL',
    ticker: 'UTIL',
    title: 'Utilidade Pública',
    name: 'Índice Utilidade Pública',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:IFNC',
    ticker: 'IFNC',
    title: 'Financeiro',
    name: 'Índice Financeiro',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:IMAT',
    ticker: 'IMAT',
    title: 'Materiais Básicos',
    name: 'Índice Materiais Básicos',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:ICON',
    ticker: 'ICON',
    title: 'Consumo',
    name: 'Índice Consumo',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:IEEX',
    ticker: 'IEEX',
    title: 'Energia Elétrica',
    name: 'Índice Energia Elétrica',
    isIndex: true,
  },
  {
    proName: 'BMFBOVESPA:IMOB',
    ticker: 'IMOB',
    title: 'Imobiliário',
    name: 'Índice Imobiliário',
    isIndex: true,
  },
];

/**
 * All B3 Symbols (combined)
 */
export const B3_ALL_SYMBOLS: B3Symbol[] = [
  ...B3_HIGH_LIQUIDITY,
  ...B3_INDICES,
];

// ============================================================================
// INTERNATIONAL SYMBOLS (Popular for comparison)
// ============================================================================

export const INTERNATIONAL_INDICES = [
  {
    proName: 'CURRENCYCOM:US500',
    title: 'S&P 500',
  },
  {
    proName: 'NASDAQ:IXIC',
    title: 'Nasdaq',
  },
  {
    proName: 'DJ:DJI',
    title: 'Dow Jones',
  },
  {
    proName: 'TVC:DAX',
    title: 'DAX (Germany)',
  },
  {
    proName: 'FTSE:UKX',
    title: 'FTSE 100 (UK)',
  },
  {
    proName: 'TVC:NI225',
    title: 'Nikkei 225 (Japan)',
  },
];

export const CRYPTO_POPULAR = [
  {
    proName: 'BINANCE:BTCUSDT',
    title: 'Bitcoin/USDT',
  },
  {
    proName: 'BINANCE:ETHUSDT',
    title: 'Ethereum/USDT',
  },
  {
    proName: 'BINANCE:BNBUSDT',
    title: 'BNB/USDT',
  },
  {
    proName: 'BINANCE:SOLUSDT',
    title: 'Solana/USDT',
  },
  {
    proName: 'BINANCE:ADAUSDT',
    title: 'Cardano/USDT',
  },
];

export const FOREX_POPULAR = [
  {
    proName: 'FX_IDC:USDBRL',
    title: 'USD/BRL',
  },
  {
    proName: 'FX_IDC:EURBRL',
    title: 'EUR/BRL',
  },
  {
    proName: 'FX:EURUSD',
    title: 'EUR/USD',
  },
  {
    proName: 'FX:GBPUSD',
    title: 'GBP/USD',
  },
  {
    proName: 'FX:USDJPY',
    title: 'USD/JPY',
  },
];

// ============================================================================
// THEMES & COLORS
// ============================================================================

/**
 * Default theme
 */
export const DEFAULT_THEME: TradingViewTheme = 'dark';

/**
 * Default locale
 */
export const DEFAULT_LOCALE: TradingViewLocale = 'pt_BR';

/**
 * Theme color palettes
 */
export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    text: '#131722',
    border: '#e0e3eb',
    grid: '#f0f3fa',
    bullish: '#089981',
    bearish: '#f23645',
  },
  dark: {
    background: '#131722',
    text: '#d1d4dc',
    border: '#2a2e39',
    grid: '#1e222d',
    bullish: '#26a69a',
    bearish: '#ef5350',
  },
} as const;

// ============================================================================
// CHART INTERVALS
// ============================================================================

/**
 * Common chart intervals for quick access
 */
export const CHART_INTERVALS: ChartInterval[] = ['1', '5', '15', '30', '60', 'D', 'W', 'M'];

/**
 * Chart interval labels (human-readable)
 */
export const CHART_INTERVAL_LABELS: Record<ChartInterval, string> = {
  '1': '1 minuto',
  '3': '3 minutos',
  '5': '5 minutos',
  '15': '15 minutos',
  '30': '30 minutos',
  '60': '1 hora',
  '120': '2 horas',
  '180': '3 horas',
  'D': '1 dia',
  'W': '1 semana',
  'M': '1 mês',
};

/**
 * Technical Analysis intervals
 */
export const TECHNICAL_ANALYSIS_INTERVALS: TechnicalAnalysisInterval[] = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1D',
  '1W',
  '1M',
];

/**
 * Technical Analysis interval labels
 */
export const TECHNICAL_ANALYSIS_INTERVAL_LABELS: Record<TechnicalAnalysisInterval, string> = {
  '1m': '1 minuto',
  '5m': '5 minutos',
  '15m': '15 minutos',
  '30m': '30 minutos',
  '1h': '1 hora',
  '2h': '2 horas',
  '4h': '4 horas',
  '1D': '1 dia',
  '1W': '1 semana',
  '1M': '1 mês',
};

// ============================================================================
// TECHNICAL STUDIES (INDICATORS)
// ============================================================================

/**
 * Popular technical studies/indicators
 */
export const TECHNICAL_STUDIES = {
  // Trend indicators
  MA: 'Moving Average@tv-basicstudies',
  EMA: 'Moving Average Exponential@tv-basicstudies',
  SMA: 'Moving Average@tv-basicstudies',
  VWMA: 'Volume Weighted Moving Average@tv-basicstudies',
  BB: 'Bollinger Bands@tv-basicstudies',

  // Momentum indicators
  RSI: 'Relative Strength Index@tv-basicstudies',
  MACD: 'MACD@tv-basicstudies',
  STOCH: 'Stochastic@tv-basicstudies',
  CCI: 'Commodity Channel Index@tv-basicstudies',
  MOM: 'Momentum@tv-basicstudies',

  // Volume indicators
  VOL: 'Volume@tv-basicstudies',
  OBV: 'On Balance Volume@tv-basicstudies',

  // Volatility indicators
  ATR: 'Average True Range@tv-basicstudies',

  // Support/Resistance
  PIVOT: 'Pivot Points Standard@tv-basicstudies',
  FIBONACCI: 'Fibonacci Retracement@tv-basicstudies',
} as const;

/**
 * Study names (human-readable)
 */
export const TECHNICAL_STUDIES_LABELS: Record<string, string> = {
  MA: 'Média Móvel',
  EMA: 'Média Móvel Exponencial',
  SMA: 'Média Móvel Simples',
  VWMA: 'Média Móvel Ponderada por Volume',
  BB: 'Bandas de Bollinger',
  RSI: 'Índice de Força Relativa (RSI)',
  MACD: 'MACD',
  STOCH: 'Estocástico',
  CCI: 'Commodity Channel Index',
  MOM: 'Momentum',
  VOL: 'Volume',
  OBV: 'On Balance Volume',
  ATR: 'Average True Range',
  PIVOT: 'Pontos de Pivô',
  FIBONACCI: 'Retração de Fibonacci',
};

/**
 * Default studies for different widget types
 */
export const DEFAULT_STUDIES = {
  advanced_chart: [
    TECHNICAL_STUDIES.MA,
    TECHNICAL_STUDIES.RSI,
    TECHNICAL_STUDIES.MACD,
  ],
  symbol_overview: [
    TECHNICAL_STUDIES.EMA,
    TECHNICAL_STUDIES.BB,
  ],
} as const;

// ============================================================================
// WIDGET DIMENSIONS (DEFAULT)
// ============================================================================

export const WIDGET_DIMENSIONS = {
  ticker_tape: {
    width: '100%',
    height: 46,
  },
  market_overview: {
    width: '100%',
    height: 400,
  },
  screener: {
    width: '100%',
    height: 490,
  },
  advanced_chart: {
    width: '100%',
    height: 610,
  },
  technical_analysis: {
    width: '100%',
    height: 450,
  },
  economic_calendar: {
    width: '100%',
    height: 450,
  },
  symbol_overview: {
    width: '100%',
    height: 400,
  },
  mini_chart: {
    width: '100%',
    height: 220,
  },
  stock_market: {
    width: '100%',
    height: 400,
  },
  market_quotes: {
    width: '100%',
    height: 400,
  },
  ticker: {
    width: '100%',
    height: 46,
  },
  single_ticker: {
    width: '100%',
    height: 46,
  },
  heatmap: {
    width: '100%',
    height: 500,
  },
  symbol_info: {
    width: '100%',
    height: 400,
  },
  fundamental_data: {
    width: '100%',
    height: 400,
  },
  company_profile: {
    width: '100%',
    height: 400,
  },
  top_stories: {
    width: '100%',
    height: 450,
  },
  crypto_screener: {
    width: '100%',
    height: 490,
  },
} as const;

// ============================================================================
// LAZY LOADING CONFIGURATION
// ============================================================================

/**
 * Intersection Observer options for lazy loading
 */
export const LAZY_LOAD_OPTIONS = {
  root: null,
  rootMargin: '50px', // Load widgets 50px before they become visible
  threshold: 0.1, // Trigger when 10% of widget is visible
} as const;

/**
 * Widget load timeout (ms)
 */
export const WIDGET_LOAD_TIMEOUT = 10000; // 10 seconds

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance thresholds (ms)
 */
export const PERFORMANCE_THRESHOLDS = {
  good: 1000, // < 1s
  moderate: 3000, // 1-3s
  poor: 5000, // 3-5s
  critical: 10000, // > 5s
} as const;

// ============================================================================
// CSP (CONTENT SECURITY POLICY) DOMAINS
// ============================================================================

/**
 * TradingView domains for CSP configuration
 */
export const TRADINGVIEW_DOMAINS = [
  'https://s3.tradingview.com',
  'https://www.tradingview.com',
  'https://tradingview.com',
] as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  WIDGET_LOAD_FAILED: 'Falha ao carregar widget TradingView',
  SCRIPT_LOAD_FAILED: 'Falha ao carregar script TradingView',
  INVALID_SYMBOL: 'Símbolo inválido',
  TIMEOUT: 'Tempo limite excedido ao carregar widget',
  NO_DATA: 'Sem dados disponíveis para este símbolo',
} as const;

// ============================================================================
// TRADINGVIEW SCRIPT URL
// ============================================================================

/**
 * TradingView widgets script URL
 */
export const TRADINGVIEW_SCRIPT_URL = 'https://s3.tradingview.com/tv.js';

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

/**
 * Constants exported:
 * - B3_BLUE_CHIPS (10 symbols)
 * - B3_HIGH_LIQUIDITY (30 symbols)
 * - B3_INDICES (10 symbols)
 * - B3_ALL_SYMBOLS (40 symbols combined)
 * - INTERNATIONAL_INDICES (6 symbols)
 * - CRYPTO_POPULAR (5 symbols)
 * - FOREX_POPULAR (5 symbols)
 * - DEFAULT_THEME, DEFAULT_LOCALE
 * - THEME_COLORS (light/dark palettes)
 * - CHART_INTERVALS, CHART_INTERVAL_LABELS
 * - TECHNICAL_ANALYSIS_INTERVALS, TECHNICAL_ANALYSIS_INTERVAL_LABELS
 * - TECHNICAL_STUDIES, TECHNICAL_STUDIES_LABELS, DEFAULT_STUDIES
 * - WIDGET_DIMENSIONS (default sizes)
 * - LAZY_LOAD_OPTIONS, WIDGET_LOAD_TIMEOUT
 * - PERFORMANCE_THRESHOLDS
 * - TRADINGVIEW_DOMAINS (CSP)
 * - ERROR_MESSAGES
 * - TRADINGVIEW_SCRIPT_URL
 */
