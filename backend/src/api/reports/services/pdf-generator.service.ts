import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Generates a PDF from HTML content using Puppeteer
   */
  async generatePdf(html: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      this.logger.log('Launching Puppeteer browser...');

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Set the HTML content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      this.logger.log('Generating PDF from HTML...');

      // Generate PDF with optimized settings
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: false,
        preferCSSPageSize: false,
      });

      this.logger.log('PDF generated successfully');

      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
        this.logger.log('Browser closed');
      }
    }
  }

  /**
   * Generates a PDF with custom page options
   */
  async generatePdfWithOptions(
    html: string,
    options: {
      format?: puppeteer.PaperFormat;
      landscape?: boolean;
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    } = {},
  ): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: true,
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: false,
        preferCSSPageSize: false,
      });

      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('Error generating PDF with options:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
