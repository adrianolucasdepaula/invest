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
}

export interface StochasticIndicator {
  k: number[];
  d: number[];
}

export interface PivotPointsIndicator {
  r2: number[];
  r1: number[];
  pivot: number[];
  s1: number[];
  s2: number[];
}

export interface TechnicalIndicators {
  sma?: SmaIndicator;
  ema?: EmaIndicator;
  rsi?: RsiIndicator;
  macd?: MacdIndicator;
  bollinger?: BollingerIndicator;
  stochastic?: StochasticIndicator;
  pivot_points?: PivotPointsIndicator;
}
