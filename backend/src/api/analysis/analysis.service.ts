import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis, AnalysisType, AnalysisStatus, Asset, AssetPrice, Recommendation } from '@database/entities';
import { ScrapersService } from '@scrapers/scrapers.service';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
    private scrapersService: ScrapersService,
  ) {}

  async generateFundamentalAnalysis(ticker: string) {
    this.logger.log(`Generating fundamental analysis for ${ticker}`);

    // Get asset ID from ticker
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ticker ${ticker} not found`);
    }

    // Create analysis record
    const analysis = this.analysisRepository.create({
      assetId: asset.id,
      type: AnalysisType.FUNDAMENTAL,
      status: AnalysisStatus.PROCESSING,
    });
    await this.analysisRepository.save(analysis);

    try {
      // Scrape fundamental data from multiple sources
      const result = await this.scrapersService.scrapeFundamentalData(ticker);

      // Update analysis with results
      analysis.status = AnalysisStatus.COMPLETED;
      analysis.analysis = result.data;
      analysis.dataSources = result.sources;
      analysis.sourcesCount = result.sourcesCount;
      analysis.confidenceScore = result.confidence;
      analysis.completedAt = new Date();

      await this.analysisRepository.save(analysis);

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to generate fundamental analysis: ${error.message}`);
      analysis.status = AnalysisStatus.FAILED;
      analysis.errorMessage = error.message;
      await this.analysisRepository.save(analysis);
      throw error;
    }
  }

  async generateTechnicalAnalysis(ticker: string) {
    this.logger.log(`Generating technical analysis for ${ticker}`);

    // Get asset
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ticker ${ticker} not found`);
    }

    // Create analysis record
    const analysis = this.analysisRepository.create({
      assetId: asset.id,
      type: AnalysisType.TECHNICAL,
      status: AnalysisStatus.PROCESSING,
    });
    await this.analysisRepository.save(analysis);

    try {
      const startTime = Date.now();

      // Get last 200 days of price data for technical indicators
      const prices = await this.assetPriceRepository.find({
        where: { assetId: asset.id },
        order: { date: 'DESC' },
        take: 200,
      });

      if (prices.length < 20) {
        throw new Error('Insufficient price data for technical analysis (minimum 20 days required)');
      }

      // Reverse to chronological order for calculations
      prices.reverse();

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(prices);

      // Generate recommendation based on indicators
      const recommendation = this.generateRecommendation(indicators);

      // Calculate confidence score based on indicator alignment
      const confidence = this.calculateConfidence(indicators);

      // Update analysis with results
      analysis.status = AnalysisStatus.COMPLETED;
      analysis.recommendation = recommendation;
      analysis.confidenceScore = confidence;
      analysis.indicators = indicators;
      analysis.analysis = {
        summary: this.generateSummary(indicators, recommendation),
        signals: this.identifySignals(indicators),
        trends: this.identifyTrends(indicators),
      };
      analysis.dataSources = ['database'];
      analysis.sourcesCount = 1;
      analysis.processingTime = Date.now() - startTime;
      analysis.completedAt = new Date();

      await this.analysisRepository.save(analysis);

      this.logger.log(`Technical analysis completed for ${ticker} in ${analysis.processingTime}ms`);
      return analysis;
    } catch (error) {
      this.logger.error(`Failed to generate technical analysis: ${error.message}`);
      analysis.status = AnalysisStatus.FAILED;
      analysis.errorMessage = error.message;
      await this.analysisRepository.save(analysis);
      throw error;
    }
  }

  private calculateTechnicalIndicators(prices: AssetPrice[]) {
    const closes = prices.map(p => Number(p.close));
    const volumes = prices.map(p => Number(p.volume));

    return {
      rsi: this.calculateRSI(closes, 14),
      sma20: this.calculateSMA(closes, 20),
      sma50: this.calculateSMA(closes, 50),
      sma200: this.calculateSMA(closes, 200),
      ema12: this.calculateEMA(closes, 12),
      ema26: this.calculateEMA(closes, 26),
      macd: this.calculateMACD(closes),
      volume_avg: this.calculateSMA(volumes, 20),
      current_price: closes[closes.length - 1],
      price_change_1d: ((closes[closes.length - 1] / closes[closes.length - 2]) - 1) * 100,
      price_change_5d: closes.length >= 5 ? ((closes[closes.length - 1] / closes[closes.length - 6]) - 1) * 100 : null,
      price_change_20d: closes.length >= 20 ? ((closes[closes.length - 1] / closes[closes.length - 21]) - 1) * 100 : null,
    };
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Neutral if insufficient data

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI using smoothed averages
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);

    if (!ema12 || !ema26) return { line: null, signal: null, histogram: null };

    const macdLine = ema12 - ema26;

    // Simplified signal line (would need full MACD history for accurate EMA of MACD)
    const signalLine = macdLine * 0.9; // Approximation

    return {
      line: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine,
    };
  }

  private generateRecommendation(indicators: any): Recommendation {
    let score = 0;

    // RSI signals
    if (indicators.rsi < 30) score += 2; // Oversold - buy signal
    else if (indicators.rsi < 40) score += 1;
    else if (indicators.rsi > 70) score -= 2; // Overbought - sell signal
    else if (indicators.rsi > 60) score -= 1;

    // Moving average signals
    if (indicators.sma20 && indicators.current_price > indicators.sma20) score += 1;
    else if (indicators.sma20 && indicators.current_price < indicators.sma20) score -= 1;

    if (indicators.sma50 && indicators.current_price > indicators.sma50) score += 1;
    else if (indicators.sma50 && indicators.current_price < indicators.sma50) score -= 1;

    // MACD signals
    if (indicators.macd.histogram && indicators.macd.histogram > 0) score += 1;
    else if (indicators.macd.histogram && indicators.macd.histogram < 0) score -= 1;

    // Price momentum
    if (indicators.price_change_5d && indicators.price_change_5d > 5) score += 1;
    else if (indicators.price_change_5d && indicators.price_change_5d < -5) score -= 1;

    // Convert score to recommendation
    if (score >= 4) return Recommendation.STRONG_BUY;
    if (score >= 2) return Recommendation.BUY;
    if (score <= -4) return Recommendation.STRONG_SELL;
    if (score <= -2) return Recommendation.SELL;
    return Recommendation.HOLD;
  }

  private calculateConfidence(indicators: any): number {
    let signals = 0;
    let total = 0;

    // Check RSI confidence
    if (indicators.rsi < 30 || indicators.rsi > 70) signals += 2;
    else if (indicators.rsi < 40 || indicators.rsi > 60) signals += 1;
    total += 2;

    // Check MA alignment
    if (indicators.sma20 && indicators.sma50) {
      const trend = (indicators.current_price > indicators.sma20) === (indicators.sma20 > indicators.sma50);
      if (trend) signals += 2;
      total += 2;
    }

    // Check MACD strength
    if (indicators.macd.histogram) {
      if (Math.abs(indicators.macd.histogram) > 0.5) signals += 1;
      total += 1;
    }

    return Math.min(signals / total, 1);
  }

  private generateSummary(indicators: any, recommendation: Recommendation): string {
    const price = indicators.current_price.toFixed(2);
    const rsi = indicators.rsi.toFixed(1);
    const change5d = indicators.price_change_5d?.toFixed(2) || 'N/A';

    return `Análise técnica indica ${recommendation.toUpperCase()}. ` +
           `Preço atual: R$ ${price}. RSI: ${rsi}. ` +
           `Variação 5 dias: ${change5d}%.`;
  }

  private identifySignals(indicators: any): string[] {
    const signals: string[] = [];

    if (indicators.rsi < 30) signals.push('RSI indica sobrevenda (possível reversão de alta)');
    else if (indicators.rsi > 70) signals.push('RSI indica sobrecompra (possível reversão de baixa)');

    if (indicators.sma20 && indicators.current_price > indicators.sma20) {
      signals.push('Preço acima da SMA 20 (tendência de alta)');
    }

    if (indicators.macd.histogram && indicators.macd.histogram > 0) {
      signals.push('MACD positivo (momentum de alta)');
    } else if (indicators.macd.histogram && indicators.macd.histogram < 0) {
      signals.push('MACD negativo (momentum de baixa)');
    }

    return signals;
  }

  private identifyTrends(indicators: any): any {
    return {
      short_term: indicators.sma20 && indicators.current_price > indicators.sma20 ? 'bullish' : 'bearish',
      medium_term: indicators.sma50 && indicators.current_price > indicators.sma50 ? 'bullish' : 'bearish',
      long_term: indicators.sma200 && indicators.current_price > indicators.sma200 ? 'bullish' : 'bearish',
    };
  }

  async generateCompleteAnalysis(ticker: string) {
    // TODO: Implement complete analysis with AI
    return { message: 'Complete analysis generation not implemented yet' };
  }

  async findByTicker(ticker: string, type?: string) {
    const where: any = { asset: { ticker: ticker.toUpperCase() } };
    if (type) {
      where.type = type;
    }

    return this.analysisRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    return this.analysisRepository.findOne({
      where: { id },
      relations: ['asset'],
    });
  }
}
