/**
 * API Service - Comunicação com Backend
 * Serviço centralizado para todas as requisições HTTP
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Types
export interface Asset {
  ticker: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

export interface AssetData {
  ticker: string;
  collected_at: string;
  fundamental?: any;
  technical?: any;
  news?: any;
  options?: any;
  insider?: any;
}

export interface Analysis {
  ticker: string;
  overall_score: number;
  recommendation: string;
  fundamental_analysis?: any;
  technical_analysis?: any;
  valuation_analysis?: any;
  risk_analysis?: any;
  sentiment_analysis?: any;
}

export interface Report {
  ticker?: string;
  overview?: any;
  quantitative_analysis?: any;
  qualitative_analysis?: any;
  data?: any;
  news_summary?: any;
  final_recommendation?: any;
  disclaimers?: string[];
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  positions: PortfolioPosition[];
  summary?: PortfolioSummary;
}

export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  average_price: number;
  current_price?: number;
  asset_type?: string;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_profit_loss: number;
  total_profit_loss_percent: number;
  total_positions: number;
}

// Helper function for API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ========== ASSETS ENDPOINTS ==========

export const assetsAPI = {
  /**
   * Obter dados consolidados de um ativo
   */
  getAsset: async (
    ticker: string,
    options?: {
      include_fundamental?: boolean;
      include_technical?: boolean;
      include_news?: boolean;
      include_options?: boolean;
      include_insider?: boolean;
    }
  ): Promise<AssetData> => {
    const params = new URLSearchParams();
    if (options?.include_fundamental !== undefined) params.append('include_fundamental', String(options.include_fundamental));
    if (options?.include_technical !== undefined) params.append('include_technical', String(options.include_technical));
    if (options?.include_news !== undefined) params.append('include_news', String(options.include_news));
    if (options?.include_options !== undefined) params.append('include_options', String(options.include_options));
    if (options?.include_insider !== undefined) params.append('include_insider', String(options.include_insider));

    const query = params.toString();
    return fetchAPI(`/assets/${ticker}${query ? `?${query}` : ''}`);
  },

  /**
   * Coletar dados de um ativo (background)
   */
  collectAsset: async (ticker: string, force_refresh = false) => {
    return fetchAPI('/assets/collect', {
      method: 'POST',
      body: JSON.stringify({ ticker, force_refresh }),
    });
  },

  /**
   * Coletar dados em lote
   */
  batchCollect: async (tickers: string[]) => {
    return fetchAPI('/assets/batch-collect', {
      method: 'POST',
      body: JSON.stringify({ tickers }),
    });
  },

  /**
   * Obter dados de criptomoeda
   */
  getCrypto: async (symbol: string) => {
    return fetchAPI(`/crypto/${symbol}`);
  },

  /**
   * Obter calendário econômico
   */
  getEconomicCalendar: async (country = 'BR', importance = 'high', days = 7) => {
    return fetchAPI(`/market/economic-calendar?country=${country}&importance=${importance}&days=${days}`);
  },
};

// ========== ANALYSIS ENDPOINTS ==========

export const analysisAPI = {
  /**
   * Analisar um ativo completo
   */
  analyzeAsset: async (ticker: string, fetch_fresh_data = false): Promise<{ analysis: Analysis }> => {
    return fetchAPI('/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({ ticker, fetch_fresh_data }),
    });
  },

  /**
   * Comparar múltiplos ativos
   */
  compareAssets: async (tickers: string[], fetch_fresh_data = false) => {
    return fetchAPI('/analysis/compare', {
      method: 'POST',
      body: JSON.stringify({ tickers, fetch_fresh_data }),
    });
  },

  /**
   * Obter score de um ativo
   */
  getScore: async (ticker: string) => {
    return fetchAPI(`/analysis/${ticker}/score`);
  },

  /**
   * Obter análise fundamentalista
   */
  getFundamentals: async (ticker: string) => {
    return fetchAPI(`/analysis/${ticker}/fundamentals`);
  },

  /**
   * Obter análise técnica
   */
  getTechnical: async (ticker: string) => {
    return fetchAPI(`/analysis/${ticker}/technical`);
  },

  /**
   * Obter análise de risco
   */
  getRisk: async (ticker: string) => {
    return fetchAPI(`/analysis/${ticker}/risk`);
  },

  /**
   * Identificar oportunidades
   */
  getOpportunities: async (tickers?: string[], min_score = 7.0) => {
    const params = new URLSearchParams();
    if (tickers) params.append('tickers', tickers.join(','));
    params.append('min_score', String(min_score));
    return fetchAPI(`/analysis/opportunities?${params.toString()}`);
  },

  /**
   * Obter rankings de ativos
   */
  getRankings: async (tickers?: string[], category?: string) => {
    const params = new URLSearchParams();
    if (tickers) params.append('tickers', tickers.join(','));
    if (category) params.append('category', category);
    return fetchAPI(`/analysis/rankings?${params.toString()}`);
  },
};

// ========== REPORTS ENDPOINTS ==========

export const reportsAPI = {
  /**
   * Gerar relatório completo
   */
  generateReport: async (
    ticker: string,
    ai_provider: 'openai' | 'anthropic' | 'gemini' = 'openai',
    fetch_fresh_data = false
  ): Promise<{ report: Report }> => {
    return fetchAPI('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ ticker, ai_provider, fetch_fresh_data }),
    });
  },

  /**
   * Gerar relatório comparativo
   */
  compareReport: async (
    tickers: string[],
    ai_provider: 'openai' | 'anthropic' | 'gemini' = 'openai',
    fetch_fresh_data = false
  ) => {
    return fetchAPI('/reports/compare', {
      method: 'POST',
      body: JSON.stringify({ tickers, ai_provider, fetch_fresh_data }),
    });
  },

  /**
   * Gerar relatório de portfólio
   */
  portfolioReport: async (portfolio_data: any) => {
    return fetchAPI('/reports/portfolio', {
      method: 'POST',
      body: JSON.stringify({ portfolio_data }),
    });
  },

  /**
   * Gerar visão geral do mercado
   */
  marketOverview: async (
    tickers?: string[],
    country = 'BR',
    importance = 'high',
    days = 7,
    ai_provider: 'openai' | 'anthropic' | 'gemini' = 'openai'
  ) => {
    return fetchAPI('/reports/market-overview', {
      method: 'POST',
      body: JSON.stringify({ tickers, country, importance, days, ai_provider }),
    });
  },

  /**
   * Exportar relatório para Markdown
   */
  exportMarkdown: async (ticker: string, ai_provider: 'openai' | 'anthropic' | 'gemini' = 'openai') => {
    return fetchAPI(`/reports/export/${ticker}/markdown?ai_provider=${ai_provider}`);
  },

  /**
   * Listar provedores de IA disponíveis
   */
  getAIProviders: async () => {
    return fetchAPI('/reports/ai-providers');
  },

  /**
   * Análise multi-IA
   */
  multiAIAnalysis: async (ticker: string, providers?: string[]) => {
    return fetchAPI('/reports/multi-ai', {
      method: 'POST',
      body: JSON.stringify({ ticker, providers }),
    });
  },
};

// ========== PORTFOLIO ENDPOINTS ==========

export const portfolioAPI = {
  /**
   * Criar portfólio
   */
  createPortfolio: async (portfolio: Omit<Portfolio, 'id'>) => {
    return fetchAPI('/portfolio/create', {
      method: 'POST',
      body: JSON.stringify(portfolio),
    });
  },

  /**
   * Importar portfólio de fonte externa
   */
  importPortfolio: async (source: string, data: any) => {
    return fetchAPI('/portfolio/import', {
      method: 'POST',
      body: JSON.stringify({ source, data }),
    });
  },

  /**
   * Obter dados do portfólio
   */
  getPortfolio: async (portfolio_id: string): Promise<{ portfolio: Portfolio }> => {
    return fetchAPI(`/portfolio/${portfolio_id}`);
  },

  /**
   * Obter resumo do portfólio
   */
  getSummary: async (portfolio_id: string) => {
    return fetchAPI(`/portfolio/${portfolio_id}/summary`);
  },

  /**
   * Obter performance do portfólio
   */
  getPerformance: async (portfolio_id: string, period = '1M') => {
    return fetchAPI(`/portfolio/${portfolio_id}/performance?period=${period}`);
  },

  /**
   * Adicionar/atualizar posição
   */
  updatePosition: async (
    portfolio_id: string,
    position: {
      ticker: string;
      quantity: number;
      average_price: number;
      operation: 'add' | 'remove' | 'update';
    }
  ) => {
    return fetchAPI(`/portfolio/${portfolio_id}/position`, {
      method: 'POST',
      body: JSON.stringify(position),
    });
  },

  /**
   * Remover posição
   */
  removePosition: async (portfolio_id: string, ticker: string) => {
    return fetchAPI(`/portfolio/${portfolio_id}/position/${ticker}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obter alocação detalhada
   */
  getAllocation: async (portfolio_id: string) => {
    return fetchAPI(`/portfolio/${portfolio_id}/allocation`);
  },

  /**
   * Obter histórico de dividendos
   */
  getDividends: async (portfolio_id: string, period = '1Y') => {
    return fetchAPI(`/portfolio/${portfolio_id}/dividends?period=${period}`);
  },

  /**
   * Listar todos os portfólios
   */
  listPortfolios: async () => {
    return fetchAPI('/portfolios');
  },

  /**
   * Remover portfólio
   */
  deletePortfolio: async (portfolio_id: string) => {
    return fetchAPI(`/portfolio/${portfolio_id}`, {
      method: 'DELETE',
    });
  },
};

export default {
  assets: assetsAPI,
  analysis: analysisAPI,
  reports: reportsAPI,
  portfolio: portfolioAPI,
};
