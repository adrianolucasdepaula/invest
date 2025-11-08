import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analysis')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post(':ticker/fundamental')
  @ApiOperation({ summary: 'Generate fundamental analysis' })
  async fundamentalAnalysis(@Param('ticker') ticker: string) {
    return this.analysisService.generateFundamentalAnalysis(ticker);
  }

  @Post(':ticker/technical')
  @ApiOperation({ summary: 'Generate technical analysis' })
  async technicalAnalysis(@Param('ticker') ticker: string) {
    return this.analysisService.generateTechnicalAnalysis(ticker);
  }

  @Post(':ticker/complete')
  @ApiOperation({ summary: 'Generate complete analysis with AI' })
  async completeAnalysis(@Param('ticker') ticker: string) {
    return this.analysisService.generateCompleteAnalysis(ticker);
  }

  @Get(':ticker')
  @ApiOperation({ summary: 'Get all analyses for a ticker' })
  async getAnalyses(@Param('ticker') ticker: string, @Query('type') type?: string) {
    return this.analysisService.findByTicker(ticker, type);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get analysis details' })
  async getAnalysisDetails(@Param('id') id: string) {
    return this.analysisService.findById(id);
  }
}
