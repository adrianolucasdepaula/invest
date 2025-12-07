export { User } from './user.entity';
export { Asset, AssetType } from './asset.entity';
export { AssetPrice, PriceSource } from './asset-price.entity';
export { FundamentalData } from './fundamental-data.entity';
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
