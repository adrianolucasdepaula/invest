import { Controller, Post, Get, Param, Query, Body, UseGuards, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from '../analysis/analysis.service';
import { AssetWithAnalysisStatusDto } from './dto/asset-with-analysis-status.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly analysisService: AnalysisService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Get('assets-status')
  @ApiOperation({
    summary: 'Get all assets with analysis status',
    description:
      'Returns all active assets with information about their latest complete analysis (if any)',
  })
  @ApiOkResponse({
    description: 'List of assets with analysis status',
    type: [AssetWithAnalysisStatusDto],
  })
  async getAssetsWithAnalysisStatus(): Promise<AssetWithAnalysisStatusDto[]> {
    return this.reportsService.getAssetsWithAnalysisStatus();
  }

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
  async generateReport(@Req() req: any, @Body() body: { ticker: string }) {
    return this.analysisService.generateCompleteAnalysis(body.ticker, req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download report in specified format (PDF or JSON)',
    description: 'Generates and downloads the report in the specified format. PDF format generates a professional formatted document, JSON returns structured data.',
  })
  async downloadReport(
    @Param('id') id: string,
    @Query('format') format: 'pdf' | 'json',
    @Res() res: Response,
  ) {
    try {
      // Buscar análise para validação e obter ticker
      const analysis = await this.analysisService.findById(id);

      if (!analysis) {
        throw new HttpException('Analysis not found', HttpStatus.NOT_FOUND);
      }

      if (!analysis.asset) {
        throw new HttpException('Asset data not found for analysis', HttpStatus.NOT_FOUND);
      }

      const ticker = analysis.asset.ticker;

      if (format === 'json') {
        // Gerar JSON estruturado
        const jsonData = await this.pdfGeneratorService.generateJson(id);
        const fileName = this.pdfGeneratorService.getFileName(ticker, 'json');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(jsonData);
      }

      if (format === 'pdf') {
        // Gerar PDF
        const pdfBuffer = await this.pdfGeneratorService.generatePdf(id);
        const fileName = this.pdfGeneratorService.getFileName(ticker, 'pdf');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        return res.send(pdfBuffer);
      }

      // Formato inválido
      throw new HttpException(
        'Invalid format. Supported formats: pdf, json',
        HttpStatus.BAD_REQUEST,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to generate report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
