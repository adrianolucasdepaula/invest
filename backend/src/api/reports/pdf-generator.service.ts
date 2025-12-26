import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis, Asset, AssetPrice } from '@database/entities';
import { chromium } from 'playwright';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  analysis: Analysis;
  asset: Asset;
  currentPrice?: number;
  currentPriceDate?: Date;
  changePercent?: number;
  formattedDate: string;
  formattedPrice: string;
  formattedChangePercent: string;
  recommendationLabel: string;
  recommendationColor: string;
  confidencePercent: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private templateCache: HandlebarsTemplateDelegate | null = null;

  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
  ) {
    this.registerHandlebarsHelpers();
  }

  /**
   * Registra helpers customizados do Handlebars
   */
  private registerHandlebarsHelpers() {
    // Helper para formatar números com 2 casas decimais
    handlebars.registerHelper('formatNumber', (value: number) => {
      if (value === null || value === undefined) return 'N/A';
      return Number(value).toFixed(2);
    });

    // Helper para formatar percentual
    handlebars.registerHelper('formatPercent', (value: number) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Number(value).toFixed(2)}%`;
    });

    // Helper para formatar data
    handlebars.registerHelper('formatDate', (date: Date) => {
      if (!date) return 'N/A';
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    });

    // Helpers condicionais
    handlebars.registerHelper('eq', (a, b) => a === b);
    handlebars.registerHelper('gt', (a, b) => a > b);
    handlebars.registerHelper('lt', (a, b) => a < b);
    handlebars.registerHelper('gte', (a, b) => a >= b);
    handlebars.registerHelper('lte', (a, b) => a <= b);
  }

  /**
   * Carrega e compila o template HTML
   */
  private async loadTemplate(): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache) {
      return this.templateCache;
    }

    try {
      // Usar process.cwd() ao invés de __dirname (webpack pode modificar __dirname)
      // Em Docker: process.cwd() = /app, então dist/templates/report-template.hbs
      const templatePath = path.join(process.cwd(), 'dist', 'templates', 'report-template.hbs');

      this.logger.log(`Loading template from: ${templatePath}`);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at ${templatePath}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.templateCache = handlebars.compile(templateContent);

      return this.templateCache;
    } catch (error) {
      this.logger.error(`Failed to load template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Prepara dados da análise para o template
   */
  private async prepareReportData(analysis: Analysis): Promise<ReportData> {
    const asset =
      analysis.asset ||
      (await this.assetRepository.findOne({
        where: { id: analysis.assetId },
      }));

    if (!asset) {
      throw new Error(`Asset not found for analysis ${analysis.id}`);
    }

    // Buscar preço mais recente
    const latestPrice = await this.assetPriceRepository.findOne({
      where: { assetId: asset.id },
      order: { date: 'DESC' },
    });

    // Mapear recomendação para label
    const recommendationLabels = {
      strong_buy: 'Compra Forte',
      buy: 'Compra',
      hold: 'Manter',
      sell: 'Venda',
      strong_sell: 'Venda Forte',
    };

    // Mapear recomendação para cor
    const recommendationColors = {
      strong_buy: '#16a34a', // green-600
      buy: '#22c55e', // green-500
      hold: '#6b7280', // gray-500
      sell: '#ef4444', // red-500
      strong_sell: '#dc2626', // red-600
    };

    const recommendationLabel = recommendationLabels[analysis.recommendation] || 'Indefinido';
    const recommendationColor = recommendationColors[analysis.recommendation] || '#6b7280';

    const formattedDate = analysis.createdAt
      ? format(new Date(analysis.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      : 'N/A';

    const formattedPrice = latestPrice?.close
      ? `R$ ${Number(latestPrice.close).toFixed(2)}`
      : 'N/A';

    const formattedChangePercent = latestPrice?.changePercent
      ? `${Number(latestPrice.changePercent) >= 0 ? '+' : ''}${Number(latestPrice.changePercent).toFixed(2)}%`
      : 'N/A';

    const confidencePercent = analysis.confidenceScore
      ? `${(Number(analysis.confidenceScore) * 100).toFixed(0)}%`
      : '0%';

    return {
      analysis,
      asset,
      currentPrice: latestPrice?.close ? Number(latestPrice.close) : undefined,
      currentPriceDate: latestPrice?.date,
      changePercent: latestPrice?.changePercent ? Number(latestPrice.changePercent) : undefined,
      formattedDate,
      formattedPrice,
      formattedChangePercent,
      recommendationLabel,
      recommendationColor,
      confidencePercent,
    };
  }

  /**
   * Gera PDF a partir da análise
   */
  async generatePdf(analysisId: string): Promise<Buffer> {
    this.logger.log(`Generating PDF for analysis ${analysisId}`);

    try {
      // Buscar análise completa
      const analysis = await this.analysisRepository.findOne({
        where: { id: analysisId },
        relations: ['asset'],
      });

      if (!analysis) {
        throw new Error(`Analysis ${analysisId} not found`);
      }

      // Preparar dados
      const reportData = await this.prepareReportData(analysis);

      // Carregar e compilar template
      const template = await this.loadTemplate();

      // Renderizar HTML
      const html = template(reportData);

      // Gerar PDF com Playwright
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Configurar conteúdo HTML
      await page.setContent(html, {
        waitUntil: 'networkidle',
      });

      // Gerar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();

      this.logger.log(`PDF generated successfully for analysis ${analysisId}`);

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`Failed to generate PDF for analysis ${analysisId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera JSON formatado da análise
   */
  async generateJson(analysisId: string): Promise<object> {
    this.logger.log(`Generating JSON for analysis ${analysisId}`);

    try {
      // Buscar análise completa
      const analysis = await this.analysisRepository.findOne({
        where: { id: analysisId },
        relations: ['asset'],
      });

      if (!analysis) {
        throw new Error(`Analysis ${analysisId} not found`);
      }

      // Buscar preço mais recente
      const latestPrice = await this.assetPriceRepository.findOne({
        where: { assetId: analysis.assetId },
        order: { date: 'DESC' },
      });

      // Montar JSON estruturado
      const jsonData = {
        metadata: {
          analysisId: analysis.id,
          generatedAt: new Date().toISOString(),
          version: '1.0',
        },
        asset: {
          ticker: analysis.asset.ticker,
          name: analysis.asset.name,
          type: analysis.asset.type,
          sector: analysis.asset.sector,
          subsector: analysis.asset.subsector,
        },
        analysis: {
          type: analysis.type,
          status: analysis.status,
          recommendation: analysis.recommendation,
          confidenceScore: Number(analysis.confidenceScore),
          summary: analysis.summary,
          data: analysis.analysis,
          dataSources: analysis.dataSources,
          sourcesCount: analysis.sourcesCount,
          targetPrices: analysis.targetPrices || null,
          createdAt: analysis.createdAt,
          completedAt: analysis.completedAt,
        },
        currentPrice: latestPrice
          ? {
              price: Number(latestPrice.close),
              date: latestPrice.date,
              change: Number(latestPrice.change),
              changePercent: Number(latestPrice.changePercent),
              volume: Number(latestPrice.volume),
              marketCap: latestPrice.marketCap ? Number(latestPrice.marketCap) : null,
            }
          : null,
        risks: analysis.risks || null,
      };

      this.logger.log(`JSON generated successfully for analysis ${analysisId}`);

      return jsonData;
    } catch (error) {
      this.logger.error(`Failed to generate JSON for analysis ${analysisId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retorna nome do arquivo baseado no ticker e data
   */
  getFileName(ticker: string, fileFormat: 'pdf' | 'json'): string {
    const date = format(new Date(), 'yyyy-MM-dd');
    return `relatorio-${ticker.toLowerCase()}-${date}.${fileFormat}`;
  }
}
