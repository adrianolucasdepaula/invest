import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestAnalysisDto } from './dto';

@ApiTags('analysis')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  @ApiOperation({ summary: 'Generate analysis (generic router)' })
  async requestAnalysis(@Req() req: any, @Body() dto: RequestAnalysisDto) {
    const { ticker, type } = dto;
    const userId = req.user.id;

    switch (type) {
      case 'fundamental':
        return this.analysisService.generateFundamentalAnalysis(ticker);
      case 'technical':
        return this.analysisService.generateTechnicalAnalysis(ticker);
      case 'complete':
        return this.analysisService.generateCompleteAnalysis(ticker, userId);
      default:
        throw new Error(`Invalid analysis type: ${type}`);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all analyses for current user' })
  async getAllAnalyses(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('ticker') ticker?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user.id;
    return this.analysisService.findAll(userId, {
      type,
      ticker,
      limit,
      offset,
    });
  }

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
