export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  currentPrice?: number;
  assetType?: string;
  notes?: string;
}

export interface ParsedPortfolio {
  source: string;
  positions: PortfolioPosition[];
  totalInvested: number;
  metadata?: Record<string, any>;
}

export interface PortfolioParser {
  readonly source: string;

  /**
   * Parse portfolio from file buffer
   */
  parse(fileBuffer: Buffer, filename: string): Promise<ParsedPortfolio>;

  /**
   * Validate if file can be parsed by this parser
   */
  canParse(filename: string, fileBuffer: Buffer): boolean;
}
