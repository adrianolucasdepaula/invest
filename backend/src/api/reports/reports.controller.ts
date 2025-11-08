import { Controller, Post, Get, Param, Query, Body, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from '../analysis/analysis.service';
import { ReportTemplateService } from './services/report-template.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { GenerateReportDto } from './dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly analysisService: AnalysisService,
    private readonly reportTemplateService: ReportTemplateService,
    private readonly pdfGeneratorService: PdfGeneratorService,
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
    @Query('format') format: 'pdf' | 'html' | 'json' = 'json',
    @Res() res: Response,
  ) {
    const analysis = await this.analysisService.findById(id);

    if (!analysis) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: 'Report not found',
      });
    }

    const ticker = analysis.asset?.ticker || 'report';
    const timestamp = new Date().toISOString().split('T')[0];

    // JSON format - return the raw data
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${ticker}_${timestamp}.json"`,
      );
      return res.json(analysis);
    }

    // Generate HTML
    const html = this.reportTemplateService.generateHtmlReport(analysis);

    // HTML format - return the HTML string
    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${ticker}_${timestamp}.html"`,
      );
      return res.send(html);
    }

    // PDF format - convert HTML to PDF
    if (format === 'pdf') {
      try {
        const pdfBuffer = await this.pdfGeneratorService.generatePdf(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${ticker}_${timestamp}.pdf"`,
        );
        return res.send(pdfBuffer);
      } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Failed to generate PDF',
          error: error.message,
        });
      }
    }

    // Invalid format
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Invalid format. Use: pdf, html, or json',
    });
  }
}
