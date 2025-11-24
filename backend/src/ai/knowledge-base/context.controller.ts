import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';

class SearchContextDto {
  query: string;
  topK?: number;
}

@ApiTags('AI Context')
@Controller('api/v1/context')
export class ContextController {
  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  @Post('search')
  @ApiOperation({ summary: 'Search relevant code context using AI embeddings' })
  @ApiResponse({ status: 200, description: 'Relevant code chunks returned' })
  async search(@Body() dto: SearchContextDto) {
    const { query, topK = 5 } = dto;

    const results = await this.knowledgeBaseService.searchContext(query, topK);

    return {
      query,
      resultsCount: results.length,
      results: results.map((r) => ({
        file: r.chunk.file,
        type: r.chunk.type,
        lines: `${r.chunk.lineStart}-${r.chunk.lineEnd}`,
        snippet: r.chunk.content.substring(0, 300) + '...',
        score: r.score.toFixed(4),
        metadata: r.chunk.metadata,
      })),
    };
  }

  @Post('index')
  @ApiOperation({ summary: 'Re-index entire codebase (admin only)' })
  @ApiResponse({ status: 200, description: 'Indexing started' })
  async indexCodebase() {
    // Executar em background (não bloquear request)
    this.knowledgeBaseService.indexCodebase().catch((error) => {
      console.error('Error indexing codebase:', error);
    });

    return {
      message: 'Indexing started in background. Check logs for progress.',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get knowledge base statistics' })
  @ApiResponse({ status: 200, description: 'Statistics returned' })
  getStats() {
    return this.knowledgeBaseService.getStats();
  }
}
