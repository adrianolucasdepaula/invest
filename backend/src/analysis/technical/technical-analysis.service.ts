import { Injectable, Logger } from '@nestjs/common';
import {
  TechnicalIndicatorsService,
  PriceData,
  TechnicalIndicators,
} from './technical-indicators.service';

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

    // Check moving averages
    if (
      currentPrice > indicators.sma20 &&
      currentPrice > indicators.sma50 &&
      currentPrice > indicators.sma200
    ) {
      buySignals += 2;
    } else if (
      currentPrice < indicators.sma20 &&
      currentPrice < indicators.sma50 &&
      currentPrice < indicators.sma200
    ) {
      sellSignals += 2;
    }

    // Check EMA
    if (currentPrice > indicators.ema9 && currentPrice > indicators.ema21) {
      buySignals++;
    } else if (currentPrice < indicators.ema9 && currentPrice < indicators.ema21) {
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

    // RSI
    if (indicators.rsi < 30) {
      buySignals += 2; // Oversold
    } else if (indicators.rsi > 70) {
      sellSignals += 2; // Overbought
    } else if (indicators.rsi > 50) {
      buySignals++;
    } else if (indicators.rsi < 50) {
      sellSignals++;
    }

    // MACD
    if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
      buySignals++;
    } else if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
      sellSignals++;
    }

    // Stochastic
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
      buySignals++; // Oversold
    } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
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
    const bandwidth = indicators.bollingerBands.bandwidth;

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

    // Add trend strength
    strength += indicators.trendStrength * 0.3;

    // Adjust based on signal alignment
    if (trendSignal === momentumSignal && trendSignal !== 'NEUTRAL') {
      strength += 20;
    }

    // Adjust based on RSI extremes
    if (indicators.rsi < 20 || indicators.rsi > 80) {
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

    // Bollinger Bands squeeze
    if (indicators.bollingerBands.bandwidth < 10) {
      patterns.push('Bollinger Bands Squeeze - Volatility Compression');
    }

    // Price touching Bollinger Bands
    if (currentPrice >= indicators.bollingerBands.upper) {
      patterns.push('Price at Upper Bollinger Band - Overbought');
    } else if (currentPrice <= indicators.bollingerBands.lower) {
      patterns.push('Price at Lower Bollinger Band - Oversold');
    }

    // Golden Cross / Death Cross
    if (indicators.sma50 > indicators.sma200) {
      patterns.push('Golden Cross - Bullish Long-term');
    } else if (indicators.sma50 < indicators.sma200) {
      patterns.push('Death Cross - Bearish Long-term');
    }

    // MACD Crossover
    if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
      patterns.push('MACD Bullish Crossover');
    } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
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
    patterns: string[],
  ): string[] {
    const recommendations: string[] = [];

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
    if (indicators.rsi < 30) {
      recommendations.push(
        `📊 RSI em ${indicators.rsi.toFixed(1)} - Ativo sobreven dido, possível reversão de alta`,
      );
    } else if (indicators.rsi > 70) {
      recommendations.push(
        `📊 RSI em ${indicators.rsi.toFixed(1)} - Ativo sobrecomprado, possível correção`,
      );
    }

    // Trend recommendations
    if (indicators.trend === 'UPTREND' && indicators.trendStrength > 70) {
      recommendations.push(`📈 Tendência de alta forte (${indicators.trendStrength}%)`);
    } else if (indicators.trend === 'DOWNTREND' && indicators.trendStrength > 70) {
      recommendations.push(`📉 Tendência de baixa forte (${indicators.trendStrength}%)`);
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
