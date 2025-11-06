import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  PortfolioParser,
  ParsedPortfolio,
  PortfolioPosition,
} from './portfolio-parser.interface';

@Injectable()
export class B3Parser implements PortfolioParser {
  private readonly logger = new Logger(B3Parser.name);
  readonly source = 'b3';

  canParse(filename: string, fileBuffer: Buffer): boolean {
    const ext = filename.toLowerCase();
    return ext.endsWith('.xlsx') || ext.endsWith('.xls');
  }

  async parse(fileBuffer: Buffer, filename: string): Promise<ParsedPortfolio> {
    this.logger.log(`Parsing B3 portfolio from ${filename}`);

    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const positions: PortfolioPosition[] = [];
      let totalInvested = 0;

      for (const row of data as any[]) {
        // B3 format variations
        const ticker = this.extractTicker(row);
        const quantity = this.extractQuantity(row);
        const averagePrice = this.extractAveragePrice(row);

        if (ticker && quantity && averagePrice) {
          const totalInv = quantity * averagePrice;
          positions.push({
            ticker,
            quantity,
            averagePrice,
            totalInvested: totalInv,
            assetType: this.detectAssetType(ticker),
          });
          totalInvested += totalInv;
        }
      }

      return {
        source: this.source,
        positions,
        totalInvested,
        metadata: {
          filename,
          parsedAt: new Date().toISOString(),
          rowCount: data.length,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse B3 portfolio: ${error.message}`);
      throw new Error(`Failed to parse B3 portfolio: ${error.message}`);
    }
  }

  private extractTicker(row: any): string | null {
    // Try different column names
    const tickerKeys = [
      'Código do Ativo',
      'Codigo do Ativo',
      'Código',
      'Codigo',
      'Ticker',
      'Ativo',
    ];

    for (const key of tickerKeys) {
      if (row[key]) {
        return String(row[key]).trim().toUpperCase();
      }
    }

    return null;
  }

  private extractQuantity(row: any): number | null {
    const quantityKeys = ['Quantidade', 'Qtd', 'Qtde', 'Qty', 'Quantidade de Ativos'];

    for (const key of quantityKeys) {
      if (row[key] !== undefined && row[key] !== null) {
        const value = typeof row[key] === 'string' ? parseFloat(row[key].replace(/\./g, '').replace(',', '.')) : row[key];
        if (!isNaN(value)) return value;
      }
    }

    return null;
  }

  private extractAveragePrice(row: any): number | null {
    const priceKeys = [
      'Preço Médio',
      'Preco Medio',
      'Preço',
      'Preco',
      'PM',
      'Valor',
      'Preço Médio de Compra',
    ];

    for (const key of priceKeys) {
      if (row[key] !== undefined && row[key] !== null) {
        let value = row[key];

        // Handle string prices
        if (typeof value === 'string') {
          value = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
          value = parseFloat(value);
        }

        if (!isNaN(value)) return value;
      }
    }

    return null;
  }

  private detectAssetType(ticker: string): string {
    if (ticker.endsWith('11') || ticker.endsWith('B')) return 'fii';
    if (ticker.match(/^[A-Z]{4}[0-9]{2}$/)) return 'bdr';
    if (ticker.match(/^[A-Z]{4}[A-Z][0-9]{2}$/)) return 'option';
    if (ticker.match(/^[A-Z]{4}[0-9]{1}$/)) return 'stock';
    return 'stock';
  }
}
