import { Controller, Post, Get, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from '../analysis/analysis.service';
import { GenerateReportDto } from './dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly analysisService: AnalysisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all reports (complete analyses)' })
  async getReports(
    @Req() req: any,
    @Query('ticker') ticker?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    // Reports are complete analyses
    return this.analysisService.findAll(req.user.id, {
      type: 'complete',
      ticker,
      limit,
      offset,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific report by ID' })
  async getReport(@Param('id') id: string) {
    return this.analysisService.findById(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate complete report for asset' })
  async generateReport(@Req() req: any, @Body() body: GenerateReportDto) {
    return this.analysisService.generateCompleteAnalysis(body.ticker, req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download report in specified format' })
  async downloadReport(
    @Param('id') id: string,
    @Query('format') format: 'pdf' | 'html' | 'json',
  ) {
    const analysis = await this.analysisService.findById(id);

    if (format === 'json') {
      return analysis;
    }

    // TODO: Implement PDF and HTML generation
    return {
      message: 'PDF and HTML formats not yet implemented',
      analysis,
    };
  }
}
