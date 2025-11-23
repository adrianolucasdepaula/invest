import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Analysis,
  AnalysisType,
  AnalysisStatus,
  Asset,
  AssetPrice,
  Recommendation,
} from '@database/entities';
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
        throw new Error(
          'Insufficient price data for technical analysis (minimum 20 days required)',
        );
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
    const closes = prices.map((p) => Number(p.close));
    const volumes = prices.map((p) => Number(p.volume));

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
      price_change_1d: (closes[closes.length - 1] / closes[closes.length - 2] - 1) * 100,
      price_change_5d:
        closes.length >= 5
          ? (closes[closes.length - 1] / closes[closes.length - 6] - 1) * 100
          : null,
      price_change_20d:
        closes.length >= 20
          ? (closes[closes.length - 1] / closes[closes.length - 21] - 1) * 100
          : null,
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
    return 100 - 100 / (1 + rs);
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
    if (indicators.rsi < 30)
      score += 2; // Oversold - buy signal
    else if (indicators.rsi < 40) score += 1;
    else if (indicators.rsi > 70)
      score -= 2; // Overbought - sell signal
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
      const trend =
        indicators.current_price > indicators.sma20 === indicators.sma20 > indicators.sma50;
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

    return (
      `Análise técnica indica ${recommendation.toUpperCase()}. ` +
      `Preço atual: R$ ${price}. RSI: ${rsi}. ` +
      `Variação 5 dias: ${change5d}%.`
    );
  }

  private identifySignals(indicators: any): string[] {
    const signals: string[] = [];

    if (indicators.rsi < 30) signals.push('RSI indica sobrevenda (possível reversão de alta)');
    else if (indicators.rsi > 70)
      signals.push('RSI indica sobrecompra (possível reversão de baixa)');

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
      short_term:
        indicators.sma20 && indicators.current_price > indicators.sma20 ? 'bullish' : 'bearish',
      medium_term:
        indicators.sma50 && indicators.current_price > indicators.sma50 ? 'bullish' : 'bearish',
      long_term:
        indicators.sma200 && indicators.current_price > indicators.sma200 ? 'bullish' : 'bearish',
    };
  }

  async generateCompleteAnalysis(ticker: string, userId?: string) {
    this.logger.log(`Generating COMPLETE analysis (Fundamental + Technical) for ${ticker}`);

    // Get asset ID from ticker
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ticker ${ticker} not found`);
    }

    // Check for existing analysis and delete it to allow new one
    if (userId) {
      const existingAnalysis = await this.analysisRepository.findOne({
        where: {
          assetId: asset.id,
          userId: userId,
          type: AnalysisType.COMPLETE,
        },
      });

      if (existingAnalysis) {
        this.logger.log(
          `Removing old analysis for ${ticker} by user ${userId} before creating new one`,
        );
        await this.analysisRepository.remove(existingAnalysis);
      }
    }

    // Create analysis record
    const createData: Partial<Analysis> = {
      assetId: asset.id,
      type: AnalysisType.COMPLETE,
      status: AnalysisStatus.PROCESSING,
    };

    if (userId) {
      createData.userId = userId;
    }

    const analysis = this.analysisRepository.create(createData);
    await this.analysisRepository.save(analysis);

    this.logger.log(`Analysis created with ID: ${analysis.id}`);

    try {
      const startTime = Date.now();

      // ✅ STEP 1: FUNDAMENTAL ANALYSIS (multi-source scraping)
      this.logger.log(`[Complete] Step 1/3: Scraping fundamental data from 6 sources...`);
      const fundamentalResult = await this.scrapersService.scrapeFundamentalData(ticker);
      this.logger.log(
        `[Complete] Fundamental analysis complete: ${fundamentalResult.sourcesCount} sources, ${(fundamentalResult.confidence * 100).toFixed(1)}% confidence`,
      );

      // ✅ STEP 2: TECHNICAL ANALYSIS (indicators from price data)
      this.logger.log(`[Complete] Step 2/3: Calculating technical indicators...`);
      let technicalAnalysis: any = null;
      let technicalRecommendation: Recommendation | null = null;
      let technicalConfidence = 0;

      const prices = await this.assetPriceRepository.find({
        where: { assetId: asset.id },
        order: { date: 'DESC' },
        take: 200,
      });

      if (prices.length >= 20) {
        prices.reverse(); // Chronological order for calculations
        const indicators = this.calculateTechnicalIndicators(prices);
        technicalRecommendation = this.generateRecommendation(indicators);
        technicalConfidence = this.calculateConfidence(indicators);

        technicalAnalysis = {
          recommendation: technicalRecommendation,
          confidence: technicalConfidence,
          indicators,
          summary: this.generateSummary(indicators, technicalRecommendation),
          signals: this.identifySignals(indicators),
          trends: this.identifyTrends(indicators),
        };

        this.logger.log(
          `[Complete] Technical analysis complete: ${technicalRecommendation}, ${(technicalConfidence * 100).toFixed(1)}% confidence`,
        );
      } else {
        this.logger.warn(
          `[Complete] Insufficient price data (${prices.length} days), skipping technical analysis (minimum 20 required)`,
        );
      }

      // ✅ STEP 3: COMBINE RESULTS (60% fundamental + 40% technical)
      this.logger.log(`[Complete] Step 3/3: Combining fundamental and technical analysis...`);

      const combinedAnalysis = {
        fundamental: {
          data: fundamentalResult.data,
          sources: fundamentalResult.sources,
          sourcesCount: fundamentalResult.sourcesCount,
          confidence: fundamentalResult.confidence,
        },
        technical: technicalAnalysis
          ? {
              recommendation: technicalAnalysis.recommendation,
              confidence: technicalAnalysis.confidence,
              indicators: technicalAnalysis.indicators,
              summary: technicalAnalysis.summary,
              signals: technicalAnalysis.signals,
              trends: technicalAnalysis.trends,
            }
          : null,
        combined: {
          recommendation: this.combineRecommendations(
            fundamentalResult.data,
            technicalRecommendation,
          ),
          confidence: technicalAnalysis
            ? this.combinedConfidence(fundamentalResult.confidence, technicalConfidence)
            : fundamentalResult.confidence, // Fallback to fundamental only if no technical data
          explanation: this.generateCombinedExplanation(
            fundamentalResult.confidence,
            technicalRecommendation,
            technicalConfidence,
          ),
        },
      };

      // Update analysis with combined results
      analysis.status = AnalysisStatus.COMPLETED;
      analysis.analysis = combinedAnalysis;
      analysis.recommendation = combinedAnalysis.combined.recommendation;
      analysis.confidenceScore = combinedAnalysis.combined.confidence;
      analysis.dataSources = [
        ...fundamentalResult.sources,
        ...(technicalAnalysis ? ['database'] : []),
      ];
      analysis.sourcesCount = analysis.dataSources.length;
      analysis.processingTime = Date.now() - startTime;
      analysis.completedAt = new Date();

      await this.analysisRepository.save(analysis);

      this.logger.log(
        `[Complete] ✓ Complete analysis finished for ${ticker} in ${analysis.processingTime}ms: ` +
          `${analysis.recommendation} (${(analysis.confidenceScore * 100).toFixed(1)}% confidence, ${analysis.sourcesCount} sources)`,
      );

      return analysis;
    } catch (error) {
      this.logger.error(`Error generating complete analysis: ${error.message}`);
      analysis.status = AnalysisStatus.FAILED;
      analysis.analysis = { error: error.message };
      await this.analysisRepository.save(analysis);
      throw error;
    }
  }

  /**
   * Combine fundamental data and technical recommendation into final recommendation
   * Weight: 60% fundamental, 40% technical
   */
  private combineRecommendations(
    fundamentalData: any,
    technicalRecommendation?: Recommendation | null,
  ): Recommendation {
    // If no technical data, base on fundamental indicators only
    if (!technicalRecommendation) {
      this.logger.debug('[Combine] No technical recommendation, using fundamental indicators');
      return this.recommendationFromFundamentals(fundamentalData);
    }

    // Score fundamental indicators (-2 to +2)
    const fundamentalScore = this.scoreFundamentals(fundamentalData);

    // Score technical recommendation (-2 to +2)
    const technicalScore = this.scoreRecommendation(technicalRecommendation);

    // Weighted average: 60% fundamental + 40% technical
    const combinedScore = fundamentalScore * 0.6 + technicalScore * 0.4;

    this.logger.debug(
      `[Combine] Fundamental score: ${fundamentalScore}, Technical score: ${technicalScore}, Combined: ${combinedScore.toFixed(2)}`,
    );

    // Convert combined score to recommendation
    if (combinedScore >= 1.5) return Recommendation.STRONG_BUY;
    if (combinedScore >= 0.5) return Recommendation.BUY;
    if (combinedScore <= -1.5) return Recommendation.STRONG_SELL;
    if (combinedScore <= -0.5) return Recommendation.SELL;
    return Recommendation.HOLD;
  }

  /**
   * Score fundamental data (-2 to +2)
   */
  private scoreFundamentals(data: any): number {
    let score = 0;

    // P/L (Price to Earnings)
    if (data.pl) {
      if (data.pl < 10)
        score += 1; // Undervalued
      else if (data.pl > 25) score -= 1; // Overvalued
    }

    // P/VP (Price to Book Value)
    if (data.pvp) {
      if (data.pvp < 1.5)
        score += 1; // Undervalued
      else if (data.pvp > 3) score -= 1; // Overvalued
    }

    // ROE (Return on Equity)
    if (data.roe) {
      if (data.roe > 15)
        score += 1; // Good profitability
      else if (data.roe < 5) score -= 1; // Poor profitability
    }

    // Dividend Yield
    if (data.dividendYield || data.dy) {
      const dy = data.dividendYield || data.dy;
      if (dy > 6) score += 0.5; // Good dividend payer
    }

    return Math.max(-2, Math.min(2, score)); // Clamp to [-2, 2]
  }

  /**
   * Convert recommendation enum to numeric score (-2 to +2)
   */
  private scoreRecommendation(rec: Recommendation): number {
    switch (rec) {
      case Recommendation.STRONG_BUY:
        return 2;
      case Recommendation.BUY:
        return 1;
      case Recommendation.HOLD:
        return 0;
      case Recommendation.SELL:
        return -1;
      case Recommendation.STRONG_SELL:
        return -2;
      default:
        return 0;
    }
  }

  /**
   * Generate recommendation from fundamental data only (fallback)
   */
  private recommendationFromFundamentals(data: any): Recommendation {
    const score = this.scoreFundamentals(data);

    if (score >= 1.5) return Recommendation.STRONG_BUY;
    if (score >= 0.5) return Recommendation.BUY;
    if (score <= -1.5) return Recommendation.STRONG_SELL;
    if (score <= -0.5) return Recommendation.SELL;
    return Recommendation.HOLD;
  }

  /**
   * Calculate combined confidence score (weighted average)
   * Weight: 60% fundamental + 40% technical
   */
  private combinedConfidence(fundamentalConf: number, technicalConf: number): number {
    const combined = fundamentalConf * 0.6 + technicalConf * 0.4;
    this.logger.debug(
      `[Confidence] Combined: ${(combined * 100).toFixed(1)}% (Fundamental: ${(fundamentalConf * 100).toFixed(1)}%, Technical: ${(technicalConf * 100).toFixed(1)}%)`,
    );
    return combined;
  }

  /**
   * Generate explanation of how recommendation was combined
   */
  private generateCombinedExplanation(
    fundamentalConf: number,
    technicalRec: Recommendation | null,
    technicalConf: number,
  ): string {
    if (!technicalRec) {
      return (
        `Baseado apenas em análise fundamentalista (${(fundamentalConf * 100).toFixed(0)}% confiança). ` +
        `Dados técnicos insuficientes (mínimo 20 dias de preços necessário).`
      );
    }

    return (
      `Análise combinada: 60% fundamentalista (${(fundamentalConf * 100).toFixed(0)}% confiança) + ` +
      `40% técnica (${(technicalConf * 100).toFixed(0)}% confiança, recomendação: ${technicalRec}). ` +
      `Confiança final: ${((fundamentalConf * 0.6 + technicalConf * 0.4) * 100).toFixed(0)}%.`
    );
  }

  async findAll(
    userId: string,
    params?: {
      type?: string;
      ticker?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { userId };

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.ticker) {
      where.asset = { ticker: params.ticker.toUpperCase() };
    }

    const query = this.analysisRepository.find({
      where,
      relations: ['asset'],
      order: { createdAt: 'DESC' },
      take: params?.limit || 50,
      skip: params?.offset || 0,
    });

    return query;
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
    const analysis = await this.analysisRepository.findOne({
      where: { id },
      relations: ['asset'],
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    // Buscar preço mais recente do ativo
    const latestPrice = await this.assetPriceRepository.findOne({
      where: { assetId: analysis.assetId },
      order: { date: 'DESC' },
    });

    // Retornar análise com preço atual
    return {
      ...analysis,
      currentPrice: latestPrice?.close,
      currentPriceDate: latestPrice?.date,
      changePercent: latestPrice?.changePercent,
    };
  }

  async deleteAnalysis(id: string, userId: string) {
    const analysis = await this.analysisRepository.findOne({
      where: { id, userId },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found or you do not have permission to delete it');
    }

    await this.analysisRepository.remove(analysis);

    this.logger.log(`Analysis ${id} deleted by user ${userId}`);

    return { message: 'Analysis deleted successfully', id };
  }

  async requestBulkAnalysis(type: AnalysisType, userId: string) {
    this.logger.log(`Requesting bulk ${type} analysis for all active assets`);

    // Get all active assets
    const assets = await this.assetRepository.find({
      where: { isActive: true },
      order: { ticker: 'ASC' },
    });

    if (assets.length === 0) {
      return {
        message: 'No active assets found',
        total: 0,
        requested: 0,
      };
    }

    this.logger.log(`Found ${assets.length} active assets to analyze`);

    const requested = [];
    const skipped = [];

    // Create analysis records for each asset
    for (const asset of assets) {
      try {
        // Check if analysis already exists and is recent (less than 7 days old)
        const existingAnalysis = await this.analysisRepository.findOne({
          where: {
            assetId: asset.id,
            type,
            userId,
          },
          order: { createdAt: 'DESC' },
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (existingAnalysis && existingAnalysis.createdAt > sevenDaysAgo) {
          this.logger.debug(`Skipping ${asset.ticker} - recent analysis exists`);
          skipped.push(asset.ticker);
          continue;
        }

        // Create pending analysis record
        const analysis = this.analysisRepository.create({
          assetId: asset.id,
          type,
          userId,
          status: AnalysisStatus.PENDING,
        });

        await this.analysisRepository.save(analysis);
        requested.push(asset.ticker);

        this.logger.debug(`Created pending ${type} analysis for ${asset.ticker}`);
      } catch (error) {
        this.logger.error(`Failed to create analysis for ${asset.ticker}: ${error.message}`);
      }
    }

    this.logger.log(
      `Bulk analysis request completed: ${requested.length} requested, ${skipped.length} skipped`,
    );

    return {
      message: `Bulk ${type} analysis requested successfully`,
      total: assets.length,
      requested: requested.length,
      skipped: skipped.length,
      requestedAssets: requested,
      skippedAssets: skipped,
    };
  }
}
