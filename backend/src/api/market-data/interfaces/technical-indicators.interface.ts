export interface SmaIndicator {
  [period: string]: number[]; // { "20": [...], "50": [...], "200": [...] }
}

export interface EmaIndicator {
  [period: string]: number[]; // { "9": [...], "21": [...] }
}

export interface RsiIndicator {
  values: number[];
  period: number; // 14
}

export interface MacdIndicator {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerIndicator {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number; // Single value (latest)
}

export interface StochasticIndicator {
  k: number[];
  d: number[];
}

export interface PivotPointsIndicator {
  r2: number;
  r1: number;
  pivot: number;
  s1: number;
  s2: number;
  r3: number;
  s3: number;
}

export interface TechnicalIndicators {
  // Trend Indicators (Flat Arrays)
  sma_20?: number[];
  sma_50?: number[];
  sma_200?: number[];
  ema_9?: number[];
  ema_21?: number[];

  // Momentum Indicators (Flat Arrays)
  rsi?: number[];
  macd?: MacdIndicator; // Nested object with arrays
  stochastic?: StochasticIndicator; // Nested object with arrays

  // Volatility Indicators
  bollinger_bands?: BollingerIndicator; // Nested object with arrays
  atr?: number[];

  // Volume Indicators
  obv?: number[];
  volume_sma?: number[];

  // Support and Resistance (Single Values)
  pivot?: PivotPointsIndicator;

  // Trend Analysis (Single Values)
  trend?: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  trend_strength?: number;
  
  // Legacy/Alternative structures (kept for compatibility if needed, but marked optional)
  sma?: SmaIndicator;
  ema?: EmaIndicator;
}
