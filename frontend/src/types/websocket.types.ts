/**
 * WebSocket Types
 * Tipos para eventos e dados em tempo real via Socket.IO
 */

export interface PriceUpdateData {
  ticker: string;
  data: {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
    high?: number;
    low?: number;
    open?: number;
    close?: number;
  };
}

export interface AnalysisCompleteData {
  ticker: string;
  analysisId: string;
  type: 'fundamental' | 'technical' | 'complete';
  status: 'completed' | 'failed';
  completedAt: string;
  message?: string;
}

export interface ReportReadyData {
  reportId: string;
  ticker: string;
  type: 'pdf' | 'html' | 'json';
  url?: string;
  status: 'ready' | 'failed';
  createdAt: string;
  message?: string;
}

export interface PortfolioUpdateData {
  portfolioId: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  updatedAt: string;
  assets?: Array<{
    ticker: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    gain: number;
    gainPercent: number;
  }>;
}

export interface MarketStatusData {
  status: 'open' | 'closed' | 'pre_open' | 'post_close';
  timestamp: string;
  nextOpen?: string;
  nextClose?: string;
}

export type WebSocketEventMap = {
  price_update: PriceUpdateData;
  analysis_complete: AnalysisCompleteData;
  report_ready: ReportReadyData;
  portfolio_update: PortfolioUpdateData;
  market_status: MarketStatusData;
};

export type WebSocketEventName = keyof WebSocketEventMap;
