import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PortfolioParser, ParsedPortfolio, PortfolioPosition } from './portfolio-parser.interface';

@Injectable()
export class KinvoParser implements PortfolioParser {
  private readonly logger = new Logger(KinvoParser.name);
  readonly source = 'kinvo';

  canParse(filename: string, _fileBuffer: Buffer): boolean {
    const ext = filename.toLowerCase();
    return (
      (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv')) &&
      filename.toLowerCase().includes('kinvo')
    );
  }

  async parse(fileBuffer: Buffer, filename: string): Promise<ParsedPortfolio> {
    this.logger.log(`Parsing Kinvo portfolio from ${filename}`);

    try {
      let data: any[];

      if (filename.toLowerCase().endsWith('.csv')) {
        data = this.parseCSV(fileBuffer);
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer as any);

        const worksheet = workbook.worksheets[0];
        data = [];

        // Convert worksheet to JSON format
        const headers: string[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            // First row is headers
            row.eachCell((cell) => {
              headers.push(String(cell.value || ''));
            });
          } else {
            // Data rows
            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber - 1];
              if (header) {
                rowData[header] = cell.value;
              }
            });
            if (Object.keys(rowData).length > 0) {
              data.push(rowData);
            }
          }
        });
      }

      const positions: PortfolioPosition[] = [];
      let totalInvested = 0;

      for (const row of data) {
        const ticker = this.extractValue(row, ['Ticker', 'Código', 'Ativo']);
        const quantity = this.extractNumber(row, ['Quantidade', 'Qtd']);
        const averagePrice = this.extractNumber(row, ['Preço Médio', 'PM', 'Valor Médio']);
        const currentPrice = this.extractNumber(row, ['Cotação', 'Preço Atual', 'Valor Atual']);

        if (ticker && quantity && averagePrice) {
          const totalInv = quantity * averagePrice;
          positions.push({
            ticker: ticker.toUpperCase(),
            quantity,
            averagePrice,
            totalInvested: totalInv,
            currentPrice,
            assetType: this.extractValue(row, ['Tipo', 'Categoria', 'Classe']),
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
          format: filename.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse Kinvo portfolio: ${error.message}`);
      throw new Error(`Failed to parse Kinvo portfolio: ${error.message}`);
    }
  }

  private parseCSV(buffer: Buffer): any[] {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(';').map((h) => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(';');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim();
      });
      data.push(row);
    }

    return data;
  }

  private extractValue(row: any, keys: string[]): string | null {
    for (const key of keys) {
      if (row[key]) {
        return String(row[key]).trim();
      }
    }
    return null;
  }

  private extractNumber(row: any, keys: string[]): number | null {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        let value = row[key];

        if (typeof value === 'string') {
          value = value
            .replace(/R\$\s?/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
          value = parseFloat(value);
        }

        if (!isNaN(value)) return value;
      }
    }
    return null;
  }
}
