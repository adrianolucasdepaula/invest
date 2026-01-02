import { Injectable, Logger } from '@nestjs/common';
import { TechnicalIndicatorsService, PriceData } from './technical-indicators.service';
import { TechnicalIndicators } from '../../api/market-data/interfaces';

export interface TechnicalAnalysisResult {
  ticker: string;
  analysisDate: Date;
  currentPrice: number;
  indicators: TechnicalIndicators;
  signals: {
    overall: 'BUY' | 'SELL' | 'NEUTRAL';
    strength: number; // 0-100
    trendSignal: 'BUY' | 'SELL' | 'NEUTRAL';
    momentumSignal: 'BUY' | 'SELL' | 'NEUTRAL';
    volatilitySignal: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  patterns: string[];
  supportLevels: number[];
  resistanceLevels: number[];
  recommendations: string[];
}

@Injectable()
export class TechnicalAnalysisService {
  private readonly logger = new Logger(TechnicalAnalysisService.name);

  constructor(private technicalIndicators: TechnicalIndicatorsService) {}

  /**
   * Perform complete technical analysis
   */
  async analyze(ticker: string, priceHistory: PriceData[]): Promise<TechnicalAnalysisResult> {
    this.logger.log(`Performing technical analysis for ${ticker}`);

    const indicators = await this.technicalIndicators.calculateIndicators(ticker, priceHistory);
    const currentPrice = priceHistory[priceHistory.length - 1].close;

    // Analyze signals
    const trendSignal = this.analyzeTrendSignal(indicators, currentPrice);
    const momentumSignal = this.analyzeMomentumSignal(indicators);
    const volatilitySignal = this.analyzeVolatility(indicators);

    // Calculate overall signal
    const signals = {
      overall: this.calculateOverallSignal(trendSignal, momentumSignal),
      strength: this.calculateSignalStrength(indicators, trendSignal, momentumSignal),
      trendSignal,
      momentumSignal,
      volatilitySignal,
    };

    // Detect patterns
    const patterns = this.detectPatterns(priceHistory, indicators);

    // Calculate support and resistance
    const { supportLevels, resistanceLevels } = this.calculateSupportResistance(priceHistory);

    // Generate recommendations
    const recommendations = this.generateRecommendations(indicators, signals, patterns);

    return {
      ticker,
      analysisDate: new Date(),
      currentPrice,
      indicators,
      signals,
      patterns,
      supportLevels,
      resistanceLevels,
      recommendations,
    };
  }

  /**
   * Analyze trend signal
   */
  private analyzeTrendSignal(
    indicators: TechnicalIndicators,
    currentPrice: number,
  ): 'BUY' | 'SELL' | 'NEUTRAL' {
    let buySignals = 0;
    let sellSignals = 0;

    // Helper to get last value
    const getLast = (val: number | number[] | undefined): number => {
      if (Array.isArray(val)) return val[val.length - 1] || 0;
      return val || 0;
    };

    const sma20 = getLast(indicators.sma_20);
    const sma50 = getLast(indicators.sma_50);
    const sma200 = getLast(indicators.sma_200);
    const ema9 = getLast(indicators.ema_9);
    const ema21 = getLast(indicators.ema_21);

    // Check moving averages
    if (currentPrice > sma20 && currentPrice > sma50 && currentPrice > sma200) {
      buySignals += 2;
    } else if (currentPrice < sma20 && currentPrice < sma50 && currentPrice < sma200) {
      sellSignals += 2;
    }

    // Check EMA
    if (currentPrice > ema9 && currentPrice > ema21) {
      buySignals++;
    } else if (currentPrice < ema9 && currentPrice < ema21) {
      sellSignals++;
    }

    // Check trend
    if (indicators.trend === 'UPTREND') {
      buySignals++;
    } else if (indicators.trend === 'DOWNTREND') {
      sellSignals++;
    }

    if (buySignals > sellSignals + 1) return 'BUY';
    if (sellSignals > buySignals + 1) return 'SELL';
    return 'NEUTRAL';
  }

  /**
   * Analyze momentum signal
   */
  private analyzeMomentumSignal(indicators: TechnicalIndicators): 'BUY' | 'SELL' | 'NEUTRAL' {
    let buySignals = 0;
    let sellSignals = 0;

    // Helper to get last value
    const getLast = (val: number | number[] | undefined): number => {
      if (Array.isArray(val)) return val[val.length - 1] || 0;
      return val || 0;
    };

    const rsi = getLast(indicators.rsi);

    // MACD
    const macdHist = getLast(indicators.macd?.histogram);
    const macdLine = getLast(indicators.macd?.macd);
    const macdSignal = getLast(indicators.macd?.signal);

    // Stochastic
    const stochK = getLast(indicators.stochastic?.k);
    const stochD = getLast(indicators.stochastic?.d);

    // RSI
    if (rsi < 30) {
      buySignals += 2; // Oversold
    } else if (rsi > 70) {
      sellSignals += 2; // Overbought
    } else if (rsi > 50) {
      buySignals++;
    } else if (rsi < 50) {
      sellSignals++;
    }

    // MACD
    if (macdHist > 0 && macdLine > macdSignal) {
      buySignals++;
    } else if (macdHist < 0 && macdLine < macdSignal) {
      sellSignals++;
    }

    // Stochastic
    if (stochK < 20 && stochD < 20) {
      buySignals++; // Oversold
    } else if (stochK > 80 && stochD > 80) {
      sellSignals++; // Overbought
    }

    if (buySignals > sellSignals) return 'BUY';
    if (sellSignals > buySignals) return 'SELL';
    return 'NEUTRAL';
  }

  /**
   * Analyze volatility
   */
  private analyzeVolatility(indicators: TechnicalIndicators): 'LOW' | 'MEDIUM' | 'HIGH' {
    const bandwidth = indicators.bollinger_bands?.bandwidth || 0;

    if (bandwidth < 10) return 'LOW';
    if (bandwidth > 25) return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Calculate overall signal
   */
  private calculateOverallSignal(
    trendSignal: 'BUY' | 'SELL' | 'NEUTRAL',
    momentumSignal: 'BUY' | 'SELL' | 'NEUTRAL',
  ): 'BUY' | 'SELL' | 'NEUTRAL' {
    if (trendSignal === 'BUY' && momentumSignal === 'BUY') return 'BUY';
    if (trendSignal === 'SELL' && momentumSignal === 'SELL') return 'SELL';
    if (trendSignal === 'BUY' && momentumSignal !== 'SELL') return 'BUY';
    if (trendSignal === 'SELL' && momentumSignal !== 'BUY') return 'SELL';
    return 'NEUTRAL';
  }

  /**
   * Calculate signal strength (0-100)
   */
  private calculateSignalStrength(
    indicators: TechnicalIndicators,
    trendSignal: 'BUY' | 'SELL' | 'NEUTRAL',
    momentumSignal: 'BUY' | 'SELL' | 'NEUTRAL',
  ): number {
    let strength = 50; // Base strength

    // Helper to get last value
    const getLast = (val: number | number[] | undefined): number => {
      if (Array.isArray(val)) return val[val.length - 1] || 0;
      return val || 0;
    };

    const rsi = getLast(indicators.rsi);
    const trendStrength = indicators.trend_strength || 0;

    // Add trend strength
    strength += trendStrength * 0.3;

    // Adjust based on signal alignment
    if (trendSignal === momentumSignal && trendSignal !== 'NEUTRAL') {
      strength += 20;
    }

    // Adjust based on RSI extremes
    if (rsi < 20 || rsi > 80) {
      strength += 10;
    }

    return Math.min(100, Math.max(0, Math.round(strength)));
  }

  /**
   * Detect chart patterns
   */
  private detectPatterns(priceHistory: PriceData[], indicators: TechnicalIndicators): string[] {
    const patterns: string[] = [];

    const currentPrice = priceHistory[priceHistory.length - 1].close;

    // Helper to get last value
    const getLast = (val: number | number[] | undefined): number => {
      if (Array.isArray(val)) return val[val.length - 1] || 0;
      return val || 0;
    };

    const bandwidth = indicators.bollinger_bands?.bandwidth || 0;
    const bbUpper = getLast(indicators.bollinger_bands?.upper);
    const bbLower = getLast(indicators.bollinger_bands?.lower);
    const sma50 = getLast(indicators.sma_50);
    const sma200 = getLast(indicators.sma_200);
    const macdLine = getLast(indicators.macd?.macd);
    const macdSignal = getLast(indicators.macd?.signal);
    const macdHist = getLast(indicators.macd?.histogram);

    // Bollinger Bands squeeze
    if (bandwidth < 10) {
      patterns.push('Bollinger Bands Squeeze - Volatility Compression');
    }

    // Price touching Bollinger Bands
    if (currentPrice >= bbUpper) {
      patterns.push('Price at Upper Bollinger Band - Overbought');
    } else if (currentPrice <= bbLower) {
      patterns.push('Price at Lower Bollinger Band - Oversold');
    }

    // Golden Cross / Death Cross
    if (sma50 > sma200) {
      patterns.push('Golden Cross - Bullish Long-term');
    } else if (sma50 < sma200) {
      patterns.push('Death Cross - Bearish Long-term');
    }

    // MACD Crossover
    if (macdLine > macdSignal && macdHist > 0) {
      patterns.push('MACD Bullish Crossover');
    } else if (macdLine < macdSignal && macdHist < 0) {
      patterns.push('MACD Bearish Crossover');
    }

    return patterns;
  }

  /**
   * Calculate support and resistance levels
   */
  private calculateSupportResistance(priceHistory: PriceData[]): {
    supportLevels: number[];
    resistanceLevels: number[];
  } {
    const highs = priceHistory.map((p) => p.high);
    const lows = priceHistory.map((p) => p.low);

    // Find local maxima and minima
    const resistanceLevels: number[] = [];
    const supportLevels: number[] = [];

    for (let i = 2; i < highs.length - 2; i++) {
      // Check if local maximum
      if (
        highs[i] > highs[i - 1] &&
        highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] &&
        highs[i] > highs[i + 2]
      ) {
        resistanceLevels.push(highs[i]);
      }

      // Check if local minimum
      if (
        lows[i] < lows[i - 1] &&
        lows[i] < lows[i - 2] &&
        lows[i] < lows[i + 1] &&
        lows[i] < lows[i + 2]
      ) {
        supportLevels.push(lows[i]);
      }
    }

    // Return top 3 levels
    return {
      supportLevels: supportLevels.slice(-3).reverse(),
      resistanceLevels: resistanceLevels.slice(-3).reverse(),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    indicators: TechnicalIndicators,
    signals: any,
    _patterns: string[],
  ): string[] {
    const recommendations: string[] = [];

    // Helper to get last value
    const getLast = (val: number | number[] | undefined): number => {
      if (Array.isArray(val)) return val[val.length - 1] || 0;
      return val || 0;
    };

    const rsi = getLast(indicators.rsi);
    const trendStrength = indicators.trend_strength || 0;

    // Overall recommendation
    if (signals.overall === 'BUY') {
      recommendations.push(
        `⬆️ COMPRA (${signals.strength}% confiança): Indicadores técnicos sugerem tendência de alta`,
      );
    } else if (signals.overall === 'SELL') {
      recommendations.push(
        `⬇️ VENDA (${signals.strength}% confiança): Indicadores técnicos sugerem tendência de baixa`,
      );
    } else {
      recommendations.push(`⏸️ NEUTRO: Aguardar confirmação de tendência`);
    }

    // RSI recommendations
    if (rsi < 30) {
      recommendations.push(
        `📊 RSI em ${rsi.toFixed(1)} - Ativo sobrevendido, possível reversão de alta`,
      );
    } else if (rsi > 70) {
      recommendations.push(`📊 RSI em ${rsi.toFixed(1)} - Ativo sobrecomprado, possível correção`);
    }

    // Trend recommendations
    if (indicators.trend === 'UPTREND' && trendStrength > 70) {
      recommendations.push(`📈 Tendência de alta forte (${trendStrength}%)`);
    } else if (indicators.trend === 'DOWNTREND' && trendStrength > 70) {
      recommendations.push(`📉 Tendência de baixa forte (${trendStrength}%)`);
    }

    // Volatility recommendations
    if (signals.volatilitySignal === 'LOW') {
      recommendations.push(`🔹 Volatilidade baixa - Possível movimento forte em breve`);
    } else if (signals.volatilitySignal === 'HIGH') {
      recommendations.push(`🔸 Volatilidade alta - Cuidado com movimentos bruscos`);
    }

    return recommendations;
  }
}
