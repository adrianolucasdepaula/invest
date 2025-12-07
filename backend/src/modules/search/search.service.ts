import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index, SearchResponse, SearchParams } from 'meilisearch';

export interface AssetSearchDocument {
  id: string;
  ticker: string;
  name: string;
  type: 'stock' | 'fii' | 'etf' | 'bdr';
  sector?: string;
  subsector?: string;
  segment?: string;
  lastPrice?: number;
  marketCap?: number;
  updatedAt: string;
}

export interface NewsSearchDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  ticker?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  publishedAt: string;
  createdAt: string;
}

export interface SearchResult<T> {
  hits: T[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private assetsIndex: Index<AssetSearchDocument>;
  private newsIndex: Index<NewsSearchDocument>;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MEILISEARCH_HOST', 'http://localhost:7700');
    const apiKey = this.configService.get<string>('MEILISEARCH_MASTER_KEY', 'masterKey123');

    this.client = new MeiliSearch({
      host,
      apiKey,
    });
  }

  async onModuleInit() {
    try {
      // Check if Meilisearch is healthy
      const health = await this.client.health();
      this.logger.log(`Meilisearch connected: ${health.status}`);

      // Initialize indexes
      await this.initializeIndexes();
    } catch (error) {
      this.logger.warn(`Meilisearch not available: ${error.message}. Search features disabled.`);
    }
  }

  private async initializeIndexes() {
    // Create or get assets index
    try {
      this.assetsIndex = await this.client.getIndex('assets');
    } catch {
      await this.client.createIndex('assets', { primaryKey: 'id' });
      // Wait a bit for index creation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.assetsIndex = await this.client.getIndex('assets');
    }

    // Configure assets index settings
    await this.assetsIndex.updateSettings({
      searchableAttributes: ['ticker', 'name', 'sector', 'subsector', 'segment'],
      filterableAttributes: ['type', 'sector', 'subsector'],
      sortableAttributes: ['ticker', 'name', 'lastPrice', 'marketCap', 'updatedAt'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    });

    // Create or get news index
    try {
      this.newsIndex = await this.client.getIndex('news');
    } catch {
      await this.client.createIndex('news', { primaryKey: 'id' });
      // Wait a bit for index creation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.newsIndex = await this.client.getIndex('news');
    }

    // Configure news index settings
    await this.newsIndex.updateSettings({
      searchableAttributes: ['title', 'content', 'source', 'ticker'],
      filterableAttributes: ['source', 'ticker', 'sentiment', 'publishedAt'],
      sortableAttributes: ['publishedAt', 'createdAt'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    });

    this.logger.log('Meilisearch indexes configured successfully');
  }

  /**
   * Index multiple assets
   */
  async indexAssets(assets: AssetSearchDocument[]): Promise<void> {
    if (!this.assetsIndex) {
      this.logger.warn('Assets index not available');
      return;
    }

    try {
      await this.assetsIndex.addDocuments(assets);
      this.logger.log(`Queued ${assets.length} assets for indexing`);
    } catch (error) {
      this.logger.error(`Failed to index assets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Index a single asset
   */
  async indexAsset(asset: AssetSearchDocument): Promise<void> {
    await this.indexAssets([asset]);
  }

  /**
   * Search assets
   */
  async searchAssets(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      filter?: string;
      sort?: string[];
    } = {},
  ): Promise<SearchResult<AssetSearchDocument>> {
    if (!this.assetsIndex) {
      return {
        hits: [],
        query,
        processingTimeMs: 0,
        limit: options.limit || 20,
        offset: options.offset || 0,
        estimatedTotalHits: 0,
      };
    }

    const searchParams: SearchParams = {
      limit: options.limit || 20,
      offset: options.offset || 0,
    };

    if (options.filter) {
      searchParams.filter = options.filter;
    }

    if (options.sort) {
      searchParams.sort = options.sort;
    }

    const result = await this.assetsIndex.search(query, searchParams);

    return {
      hits: result.hits as AssetSearchDocument[],
      query: result.query,
      processingTimeMs: result.processingTimeMs,
      limit: searchParams.limit as number,
      offset: searchParams.offset as number,
      estimatedTotalHits: result.estimatedTotalHits || 0,
    };
  }

  /**
   * Index multiple news articles
   */
  async indexNews(news: NewsSearchDocument[]): Promise<void> {
    if (!this.newsIndex) {
      this.logger.warn('News index not available');
      return;
    }

    try {
      await this.newsIndex.addDocuments(news);
      this.logger.log(`Queued ${news.length} news articles for indexing`);
    } catch (error) {
      this.logger.error(`Failed to index news: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search news
   */
  async searchNews(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      filter?: string;
      sort?: string[];
    } = {},
  ): Promise<SearchResult<NewsSearchDocument>> {
    if (!this.newsIndex) {
      return {
        hits: [],
        query,
        processingTimeMs: 0,
        limit: options.limit || 20,
        offset: options.offset || 0,
        estimatedTotalHits: 0,
      };
    }

    const searchParams: SearchParams = {
      limit: options.limit || 20,
      offset: options.offset || 0,
    };

    if (options.filter) {
      searchParams.filter = options.filter;
    }

    if (options.sort) {
      searchParams.sort = options.sort;
    }

    const result = await this.newsIndex.search(query, searchParams);

    return {
      hits: result.hits as NewsSearchDocument[],
      query: result.query,
      processingTimeMs: result.processingTimeMs,
      limit: searchParams.limit as number,
      offset: searchParams.offset as number,
      estimatedTotalHits: result.estimatedTotalHits || 0,
    };
  }

  /**
   * Global search across all indexes
   */
  async searchAll(
    query: string,
    limit: number = 10,
  ): Promise<{
    assets: SearchResult<AssetSearchDocument>;
    news: SearchResult<NewsSearchDocument>;
  }> {
    const [assets, news] = await Promise.all([
      this.searchAssets(query, { limit }),
      this.searchNews(query, { limit }),
    ]);

    return { assets, news };
  }

  /**
   * Delete an asset from index
   */
  async deleteAsset(id: string): Promise<void> {
    if (!this.assetsIndex) return;
    await this.assetsIndex.deleteDocument(id);
  }

  /**
   * Delete a news article from index
   */
  async deleteNews(id: string): Promise<void> {
    if (!this.newsIndex) return;
    await this.newsIndex.deleteDocument(id);
  }

  /**
   * Get index stats
   */
  async getStats(): Promise<{
    assets: { numberOfDocuments: number; isIndexing: boolean };
    news: { numberOfDocuments: number; isIndexing: boolean };
  }> {
    const [assetsStats, newsStats] = await Promise.all([
      this.assetsIndex?.getStats() || { numberOfDocuments: 0, isIndexing: false },
      this.newsIndex?.getStats() || { numberOfDocuments: 0, isIndexing: false },
    ]);

    return {
      assets: assetsStats,
      news: newsStats,
    };
  }

  /**
   * Check if Meilisearch is available
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.client.health();
      return health.status === 'available';
    } catch {
      return false;
    }
  }
}
