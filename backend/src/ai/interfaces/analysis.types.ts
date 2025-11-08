// Tipos base para análise de agentes

export interface AgentResponse {
  analysis: string;
  confidence: number; // 0-1
  recommendation?: 'BUY' | 'HOLD' | 'SELL';
  signals?: Signal[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Signal {
  type: 'BUY' | 'SELL' | 'HOLD' | 'WARNING';
  strength: number; // 0-1
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;

  // Fundamentals
  pe?: number;
  roe?: number;
  dividendYield?: number;
  debtToEquity?: number;
  priceToBook?: number;
  eps?: number;

  // Technical
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  sma20?: number;
  sma50?: number;
  sma200?: number;
  bollingerBands?: { upper: number; middle: number; lower: number };

  // Additional
  sector?: string;
  industry?: string;
  beta?: number;
}

export interface NewsData {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: Date;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  relevance?: number;
  url?: string;
}

export interface MacroData {
  selic: number; // Taxa Selic
  ipca: number; // Inflação
  usdBrl: number; // Câmbio
  gdpGrowth: number; // Crescimento PIB
  unemployment: number; // Desemprego
  commodityPrices?: {
    oil: number;
    iron: number;
    soy: number;
  };
}

export interface Portfolio {
  id: string;
  userId: string;
  positions: Position[];
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;

  // Risk metrics
  volatility?: number;
  beta?: number;
  sharpe?: number;
  concentration?: Record<string, number>; // sector -> percentage
}

export interface Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  returnValue: number;
  returnPercent: number;
  weight: number; // peso no portfólio
}

export interface AnalysisContext {
  ticker: string;
  stockData: StockData;
  news?: NewsData[];
  macroData?: MacroData;
  portfolio?: Portfolio;
  userProfile?: {
    riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    investmentHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
    objectives: string[];
  };
}
