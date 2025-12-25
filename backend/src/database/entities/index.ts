export { User } from './user.entity';
export { Asset, AssetType } from './asset.entity';
export { AssetPrice, PriceSource } from './asset-price.entity';
export { FundamentalData } from './fundamental-data.entity';
export { AssetIndexMembership } from './asset-index-membership.entity';
export { Portfolio } from './portfolio.entity';
export { PortfolioPosition } from './portfolio-position.entity';
export { DataSource, DataSourceType, DataSourceStatus } from './data-source.entity';
export { ScrapedData } from './scraped-data.entity';
export { TickerChange } from './ticker-change.entity';
export { Analysis, AnalysisType, AnalysisStatus, Recommendation } from './analysis.entity';
export { UpdateLog, UpdateStatus, UpdateTrigger } from './update-log.entity';
export { ScraperMetric } from './scraper-metric.entity';
export { SyncHistory, SyncStatus, SyncOperationType } from './sync-history.entity';
export { EconomicIndicator } from './economic-indicator.entity'; // FASE 2
export { IntradayPrice, IntradayTimeframe, IntradaySource } from './intraday-price.entity'; // FASE 67
// FASE 75 - AI Sentiment Multi-Provider
export { News, NewsSource } from './news.entity';
export { NewsAnalysis, AIProvider, NewsAnalysisStatus, KeyFactors } from './news-analysis.entity';
export {
  SentimentConsensus,
  SentimentLabel,
  ProviderResult,
  ConsensusDetails,
} from './sentiment-consensus.entity';
// FASE 75.7 - Calendário Econômico
export {
  EconomicEvent,
  EventImportance,
  EventCategory,
  EventSource,
} from './economic-event.entity';
// FASE 75.3 - Sistema de Alertas
export {
  Alert,
  AlertType,
  AlertStatus,
  NotificationChannel,
} from './alert.entity';
// FASE 75.4 - Options Chain
export {
  OptionPrice,
  OptionType,
  OptionStyle,
  OptionStatus,
} from './option-price.entity';
// FASE 90 - Sistema de Resolução de Discrepâncias
export {
  DiscrepancyResolution,
  ResolutionMethod,
} from './discrepancy-resolution.entity';
// FASE 93 - Cross-Validation Configuration
export { CrossValidationConfig } from './cross-validation-config.entity';
// FASE 101 - WHEEL Strategy
export {
  WheelStrategy,
  WheelPhase,
  MarketTrend,
  WheelStrategyStatus,
  WheelConfig,
} from './wheel-strategy.entity';
export {
  WheelTrade,
  WheelTradeType,
  WheelTradeStatus,
} from './wheel-trade.entity';
// FASE 101.2 - Dividendos para Wheel Turbinada
export { Dividend, DividendType, DividendStatus } from './dividend.entity';
// FASE 101.3 - Aluguel de Ações (BTC) para Wheel Turbinada
export { StockLendingRate } from './stock-lending.entity';
// FASE 101.4 - Backtesting Engine para Wheel Turbinada
export {
  BacktestResult,
  BacktestStatus,
  BacktestConfig,
  EquityCurvePoint,
  SimulatedTrade,
} from './backtest-result.entity';
// FASE: Dynamic Scraper Configuration
export { ScraperConfig, ScraperParameters } from './scraper-config.entity';
export { ScraperExecutionProfile, ProfileConfig } from './scraper-execution-profile.entity';
