import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { SearchService, AssetSearchDocument, NewsSearchDocument, SearchResult } from './search.service';

@ApiTags('Search')
@Controller('api/v1/search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Global search',
    description: 'Search across all indexes (assets and news)',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per index (default: 10)' })
  @ApiResponse({ status: 200, description: 'Search results from all indexes' })
  async searchAll(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ): Promise<{
    assets: SearchResult<AssetSearchDocument>;
    news: SearchResult<NewsSearchDocument>;
  }> {
    this.logger.log(`Global search: "${query}"`);
    return this.searchService.searchAll(query, limit || 10);
  }

  @Get('assets')
  @ApiOperation({
    summary: 'Search assets',
    description: 'Search assets by ticker, name, sector, etc.',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, description: 'Asset type filter (stock, fii, etf, bdr)' })
  @ApiQuery({ name: 'sector', required: false, description: 'Sector filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Results offset (default: 0)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort field (e.g., ticker:asc, marketCap:desc)' })
  @ApiResponse({ status: 200, description: 'Asset search results' })
  async searchAssets(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('sector') sector?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sort') sort?: string,
  ): Promise<SearchResult<AssetSearchDocument>> {
    this.logger.log(`Asset search: "${query}"`);

    // Build filter
    const filters: string[] = [];
    if (type) filters.push(`type = "${type}"`);
    if (sector) filters.push(`sector = "${sector}"`);

    // Parse sort
    const sortArray = sort ? [sort] : undefined;

    return this.searchService.searchAssets(query, {
      limit: limit || 20,
      offset: offset || 0,
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      sort: sortArray,
    });
  }

  @Get('news')
  @ApiOperation({
    summary: 'Search news',
    description: 'Search news articles by title, content, source, etc.',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'ticker', required: false, description: 'Ticker filter' })
  @ApiQuery({ name: 'source', required: false, description: 'Source filter' })
  @ApiQuery({ name: 'sentiment', required: false, description: 'Sentiment filter (positive, negative, neutral)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Results offset (default: 0)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort field (e.g., publishedAt:desc)' })
  @ApiResponse({ status: 200, description: 'News search results' })
  async searchNews(
    @Query('q') query: string,
    @Query('ticker') ticker?: string,
    @Query('source') source?: string,
    @Query('sentiment') sentiment?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sort') sort?: string,
  ): Promise<SearchResult<NewsSearchDocument>> {
    this.logger.log(`News search: "${query}"`);

    // Build filter
    const filters: string[] = [];
    if (ticker) filters.push(`ticker = "${ticker}"`);
    if (source) filters.push(`source = "${source}"`);
    if (sentiment) filters.push(`sentiment = "${sentiment}"`);

    // Parse sort (default to publishedAt:desc for news)
    const sortArray = sort ? [sort] : ['publishedAt:desc'];

    return this.searchService.searchNews(query, {
      limit: limit || 20,
      offset: offset || 0,
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      sort: sortArray,
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get search index statistics',
    description: 'Returns statistics about search indexes',
  })
  @ApiResponse({ status: 200, description: 'Index statistics' })
  async getStats(): Promise<{
    healthy: boolean;
    assets: { numberOfDocuments: number; isIndexing: boolean };
    news: { numberOfDocuments: number; isIndexing: boolean };
  }> {
    const [healthy, stats] = await Promise.all([
      this.searchService.isHealthy(),
      this.searchService.getStats(),
    ]);

    return {
      healthy,
      ...stats,
    };
  }
}
