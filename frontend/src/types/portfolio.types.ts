/**
 * Portfolio Types
 * Tipos para gerenciamento de portfólios e posições
 */

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
  currency?: string;
  isActive?: boolean;
}

export interface AddPositionData {
  ticker: string;
  quantity: number;
  averagePrice: number;
  purchaseDate?: string;
  notes?: string;
}

export interface UpdatePositionData {
  quantity?: number;
  averagePrice?: number;
  notes?: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  currency: string;
  isActive: boolean;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  positions: Position[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  totalValue?: number;
  totalCost: number;
  gain?: number;
  gainPercent?: number;
  purchaseDate?: string;
  notes?: string;
  asset?: {
    id: string;
    ticker: string;
    name: string;
    type: string;
    sector?: string;
    logoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}
