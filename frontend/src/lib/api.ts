import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api/v1';
const OAUTH_BASE_URL = process.env.NEXT_PUBLIC_OAUTH_URL || 'http://localhost:8080';

/**
 * Generate W3C TraceContext trace ID and span ID
 * Format: traceparent: {version}-{trace-id}-{span-id}-{flags}
 * https://www.w3.org/TR/trace-context/
 */
function generateTraceContext(): { traceparent: string; traceId: string } {
  // Generate 32-char hex trace ID (16 bytes)
  const traceId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Generate 16-char hex span ID (8 bytes)
  const spanId = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Version 00, sampled flag 01
  const traceparent = `00-${traceId}-${spanId}-01`;

  return { traceparent, traceId };
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        const token = Cookies.get('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add W3C TraceContext headers for distributed tracing (FASE 76)
        const { traceparent } = generateTraceContext();
        config.headers['traceparent'] = traceparent;

        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          Cookies.remove('access_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }

  async patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }

  // Assets endpoints
  async getAssets(params?: { search?: string; type?: string; limit?: number; offset?: number }) {
    const response = await this.client.get('/assets', { params });
    return response.data;
  }

  async getAsset(ticker: string) {
    const response = await this.client.get(`/assets/${ticker}`);
    return response.data;
  }

  async getAssetPrices(
    ticker: string,
    params?: { range?: string; startDate?: string; endDate?: string }
  ) {
    const response = await this.client.get(`/assets/${ticker}/price-history`, { params });
    return response.data;
  }

  async getMarketDataPrices(
    ticker: string,
    params?: { timeframe?: string; range?: string; days?: number; unified?: boolean }
  ) {
    const response = await this.client.get(`/market-data/${ticker}/prices`, { params });
    return response.data;
  }

  async getAssetFundamentals(ticker: string) {
    const response = await this.client.get(`/assets/${ticker}/fundamentals`);
    return response.data;
  }

  async getAssetDataSources(ticker: string) {
    const response = await this.client.get(`/assets/${ticker}/data-sources`);
    return response.data;
  }

  async syncAllAssets(range: string = '3mo') {
    const response = await this.client.post(
      '/assets/sync-all',
      {},
      {
        params: { range },
      }
    );
    return response.data;
  }

  async getSyncStatus(jobId: string) {
    const response = await this.client.get(`/assets/sync-status/${jobId}`);
    return response.data;
  }

  async syncAsset(ticker: string, range: string = '3mo') {
    const response = await this.client.post(
      `/assets/${ticker}/sync`,
      {},
      {
        params: { range },
      }
    );
    return response.data;
  }

  // Update a single asset's fundamental data (same process as bulk update)
  async updateAssetFundamentals(ticker: string) {
    const response = await this.client.post(`/assets/${ticker}/update-fundamentals`);
    return response.data;
  }

  async syncOptionsLiquidity() {
    const response = await this.client.post('/assets/sync-options-liquidity');
    return response.data;
  }

  // Bulk update all assets with fundamental data (async with WebSocket)
  async bulkUpdateAllAssetsFundamentals(userId?: string, hasOptionsOnly?: boolean) {
    const response = await this.client.post('/assets/updates/bulk-all', {
      userId,
      hasOptionsOnly: hasOptionsOnly ?? false,
    });
    return response.data;
  }

  // Update multiple specific assets (batch)
  async updateMultipleAssets(params: { tickers: string[]; userId?: string }) {
    const response = await this.client.post('/assets/updates/batch', {
      tickers: params.tickers,
      userId: params.userId,
    });
    return response.data;
  }

  // Get current bulk update status (for page refresh recovery)
  async getBulkUpdateStatus() {
    const response = await this.client.get('/assets/bulk-update-status');
    return response.data;
  }

  // Cancel all pending bulk update jobs
  async cancelBulkUpdate() {
    const response = await this.client.post('/assets/bulk-update-cancel');
    return response.data;
  }

  // Pause bulk update queue
  async pauseBulkUpdate() {
    const response = await this.client.post('/assets/bulk-update-pause');
    return response.data;
  }

  // Resume bulk update queue
  async resumeBulkUpdate() {
    const response = await this.client.post('/assets/bulk-update-resume');
    return response.data;
  }

  // Clean stale/orphaned jobs from queue
  async cleanStaleJobs() {
    const response = await this.client.post('/assets/bulk-update-clean-stale');
    return response.data;
  }

  // Analysis endpoints
  async getAnalysis(ticker: string, type?: 'fundamental' | 'technical' | 'complete') {
    const response = await this.client.get(`/analysis/${ticker}`, {
      params: { type },
    });
    return response.data;
  }

  async requestAnalysis(ticker: string, type: 'fundamental' | 'technical' | 'complete') {
    const response = await this.client.post('/analysis', { ticker, type });
    return response.data;
  }

  async listAnalyses(params?: { ticker?: string; type?: string; limit?: number }) {
    const response = await this.client.get('/analysis', { params });
    return response.data;
  }

  async requestBulkAnalysis(type: 'fundamental' | 'technical' | 'complete') {
    const response = await this.client.post('/analysis/bulk/request', { type });
    return response.data;
  }

  async requestCompleteAnalysis(ticker: string) {
    const response = await this.client.post(`/analysis/${ticker}/complete`);
    return response.data;
  }

  // Portfolio endpoints
  async getPortfolios() {
    const response = await this.client.get('/portfolio');
    return response.data;
  }

  async getPortfolio(id: string) {
    const response = await this.client.get(`/portfolio/${id}`);
    return response.data;
  }

  async createPortfolio(data: { name: string; description?: string }) {
    const response = await this.client.post('/portfolio', data);
    return response.data;
  }

  async updatePortfolio(id: string, data: any) {
    const response = await this.client.patch(`/portfolio/${id}`, data);
    return response.data;
  }

  async deletePortfolio(id: string) {
    const response = await this.client.delete(`/portfolio/${id}`);
    return response.data;
  }

  async addPosition(portfolioId: string, data: any) {
    const response = await this.client.post(`/portfolio/${portfolioId}/positions`, data);
    return response.data;
  }

  async updatePosition(portfolioId: string, positionId: string, data: any) {
    const response = await this.client.patch(
      `/portfolio/${portfolioId}/positions/${positionId}`,
      data
    );
    return response.data;
  }

  async deletePosition(portfolioId: string, positionId: string) {
    const response = await this.client.delete(`/portfolio/${portfolioId}/positions/${positionId}`);
    return response.data;
  }

  async importPortfolio(file: File, source: 'b3' | 'kinvo' | 'myprofit' | 'nuinvest') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);

    const response = await this.client.post('/portfolio/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Reports endpoints
  async getReports(params?: { ticker?: string; limit?: number; offset?: number }) {
    const response = await this.client.get('/reports', { params });
    return response.data;
  }

  async getReport(id: string) {
    const response = await this.client.get(`/reports/${id}`);
    return response.data;
  }

  async generateReport(ticker: string) {
    const response = await this.client.post('/reports/generate', { ticker });
    return response.data;
  }

  async downloadReport(id: string, format: 'pdf' | 'html' | 'json') {
    const response = await this.client.get(`/reports/${id}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async getReportsAssetsStatus() {
    const response = await this.client.get('/reports/assets-status');
    return response.data;
  }

  // Data Sources endpoints
  async getDataSources() {
    const response = await this.client.get('/data-sources');
    return response.data;
  }

  async getDataSource(id: string) {
    const response = await this.client.get(`/data-sources/${id}`);
    return response.data;
  }

  async updateDataSource(id: string, data: any) {
    const response = await this.client.patch(`/data-sources/${id}`, data);
    return response.data;
  }

  async testDataSource(id: string) {
    const response = await this.client.post(`/data-sources/${id}/test`);
    return response.data;
  }

  async triggerScraping(source: string, ticker?: string) {
    const response = await this.client.post('/data-sources/scrape', {
      source,
      ticker,
    });
    return response.data;
  }

  // Scrapers endpoints - FASE 4: Quality Stats
  async getScrapersStatus() {
    const response = await this.client.get('/scrapers/status');
    return response.data;
  }

  async getScrapersQualityStats() {
    const response = await this.client.get('/scrapers/quality-stats');
    return response.data;
  }

  async getScrapersDiscrepancies(params?: {
    limit?: number;
    severity?: string;
    field?: string;
    ticker?: string;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: string;
  }) {
    const response = await this.client.get('/scrapers/discrepancies', { params });
    return response.data;
  }

  async getDiscrepancyStats(params?: { topLimit?: number }) {
    const response = await this.client.get('/scrapers/discrepancies/stats', { params });
    return response.data;
  }

  // ========================================
  // FASE 90: Discrepancy Resolution API
  // ========================================

  /**
   * Get detailed discrepancy info for a specific ticker/field
   */
  async getDiscrepancyDetail(ticker: string, field: string) {
    const response = await this.client.get(`/scrapers/discrepancies/${ticker}/${field}`);
    return response.data;
  }

  /**
   * Manually resolve a discrepancy
   */
  async resolveDiscrepancy(
    ticker: string,
    field: string,
    data: {
      selectedValue: number;
      selectedSource?: string;
      notes?: string;
    }
  ) {
    const response = await this.client.post(
      `/scrapers/discrepancies/${ticker}/${field}/resolve`,
      data
    );
    return response.data;
  }

  /**
   * Auto-resolve discrepancies in batch
   */
  async autoResolveDiscrepancies(data: {
    method: 'consensus' | 'priority';
    severity?: 'all' | 'high' | 'medium' | 'low';
    tickerFilter?: string;
    fieldFilter?: string;
    dryRun?: boolean;
  }) {
    const response = await this.client.post('/scrapers/discrepancies/auto-resolve', data);
    return response.data;
  }

  /**
   * Get resolution history
   */
  async getResolutionHistory(params?: {
    ticker?: string;
    limit?: number;
    method?: 'manual' | 'auto_consensus' | 'auto_priority';
  }) {
    const response = await this.client.get('/scrapers/discrepancies/resolution-history', {
      params,
    });
    return response.data;
  }

  // ========================================
  // FASE 93.4: Test All Scrapers API
  // ========================================

  /**
   * Test all scrapers in batch with controlled concurrency
   * Returns results for all TypeScript + Python scrapers
   */
  async testAllScrapers(concurrency: number = 5) {
    const response = await this.client.post('/scrapers/test-all', {}, {
      params: { concurrency },
      timeout: 300000, // 5 minutes timeout for batch test
    });
    return response.data;
  }

  // ========================================
  // FASE 93.5: Cross-Validation Config API
  // ========================================

  /**
   * Get current cross-validation configuration
   */
  async getCrossValidationConfig() {
    const response = await this.client.get('/scrapers/cross-validation-config');
    return response.data;
  }

  /**
   * Update cross-validation configuration
   */
  async updateCrossValidationConfig(config: {
    minSources?: number;
    severityThresholdHigh?: number;
    severityThresholdMedium?: number;
    sourcePriority?: string[];
    fieldTolerances?: {
      default: number;
      byField: Record<string, number>;
    };
  }) {
    const response = await this.client.put('/scrapers/cross-validation-config', config);
    return response.data;
  }

  /**
   * Preview impact of configuration changes
   */
  async previewConfigImpact(config: {
    minSources?: number;
    severityThresholdHigh?: number;
    severityThresholdMedium?: number;
    sourcePriority?: string[];
    fieldTolerances?: {
      default: number;
      byField: Record<string, number>;
    };
  }) {
    const response = await this.client.post('/scrapers/cross-validation-config/preview', config);
    return response.data;
  }

  // Economic Indicators endpoints - FASE 1.4 (8 indicator types)
  async getEconomicIndicators(params?: { type?: string; limit?: number }) {
    const response = await this.client.get('/economic-indicators', { params });
    return response.data;
  }

  async getLatestIndicator(
    type:
      | 'SELIC'
      | 'IPCA'
      | 'CDI'
      | 'IPCA_15'
      | 'IDP_INGRESSOS'
      | 'IDE_SAIDAS'
      | 'IDP_LIQUIDO'
      | 'OURO_MONETARIO'
  ) {
    const response = await this.client.get(`/economic-indicators/${type}`);
    return response.data;
  }

  async getLatestIndicatorWithAccumulated(
    type:
      | 'SELIC'
      | 'IPCA'
      | 'CDI'
      | 'IPCA_15'
      | 'IDP_INGRESSOS'
      | 'IDE_SAIDAS'
      | 'IDP_LIQUIDO'
      | 'OURO_MONETARIO'
  ) {
    const response = await this.client.get(`/economic-indicators/${type}/accumulated`);
    return response.data;
  }

  async syncEconomicIndicators() {
    const response = await this.client.post('/economic-indicators/sync');
    return response.data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.token) {
      // Store token in cookie with 7 days expiration
      Cookies.set('access_token', response.data.token, {
        expires: 7,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return response.data;
  }

  async loginWithGoogle(token: string) {
    const response = await this.client.post('/auth/google', { token });
    if (response.data.token) {
      // Store token in cookie with 7 days expiration
      Cookies.set('access_token', response.data.token, {
        expires: 7,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return response.data;
  }

  async logout() {
    Cookies.remove('access_token');
  }

  async register(data: { email: string; password: string; firstName?: string; lastName?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // OAuth Management endpoints (FastAPI api-service port 8000)
  // Note: These use direct connection to api-service
  private getOAuthClient() {
    return axios.create({
      baseURL: OAUTH_BASE_URL,
      timeout: 150000, // OAuth operations can take longer (150s for heavy sites like ADVFN)
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  oauth = {
    // Start new OAuth session
    startSession: async () => {
      const client = this.getOAuthClient();
      const response = await client.post('/api/oauth/session/start');
      return response.data;
    },

    // Get current session status
    getSessionStatus: async () => {
      const client = this.getOAuthClient();
      const response = await client.get('/api/oauth/session/status');
      return response.data;
    },

    // Confirm login on current site and move to next
    confirmLogin: async () => {
      const client = this.getOAuthClient();
      const response = await client.post('/api/oauth/session/confirm-login');
      return response.data;
    },

    // Skip current site
    skipSite: async (reason?: string) => {
      const client = this.getOAuthClient();
      const response = await client.post('/api/oauth/session/skip-site', {
        reason: reason || 'Usuário optou por pular',
      });
      return response.data;
    },

    // Save cookies and finish session
    saveCookies: async () => {
      const client = this.getOAuthClient();
      const response = await client.post('/api/oauth/session/save');
      return response.data;
    },

    // Cancel session
    cancelSession: async () => {
      const client = this.getOAuthClient();
      const response = await client.delete('/api/oauth/session/cancel');
      return response.data;
    },

    // Get VNC URL
    getVncUrl: async () => {
      const client = this.getOAuthClient();
      const response = await client.get('/api/oauth/vnc-url');
      return response.data;
    },

    // Get list of OAuth sites
    getSites: async () => {
      const client = this.getOAuthClient();
      const response = await client.get('/api/oauth/sites');
      return response.data;
    },

    // Navigate to specific site (advanced)
    navigateToSite: async (siteId: string) => {
      const client = this.getOAuthClient();
      const response = await client.post(`/api/oauth/navigate/${siteId}`);
      return response.data;
    },

    // Go back to previous site
    goBack: async () => {
      const client = this.getOAuthClient();
      const response = await client.post('/api/oauth/session/go-back');
      return response.data;
    },

    // Health check
    healthCheck: async () => {
      const client = this.getOAuthClient();
      const response = await client.get('/api/oauth/health');
      return response.data;
    },
  };
}

export const api = new ApiClient();

// ========================================
// FASE 93: Standalone Functions for Turbopack Compatibility
// Turbopack HMR has issues with class method resolution.
// These functions use direct axios calls to bypass the issue.
// ========================================

/**
 * Create a standalone axios instance for Turbopack-safe calls
 * This avoids class method resolution issues in Turbopack HMR
 */
function createStandaloneClient() {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token if available
  client.interceptors.request.use(config => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const { traceparent } = generateTraceContext();
    config.headers['traceparent'] = traceparent;
    return config;
  });

  return client;
}

/**
 * Test all scrapers in batch (Turbopack-safe - direct axios call)
 */
export async function testAllScrapersApi(concurrency: number = 5) {
  const client = createStandaloneClient();
  const response = await client.post('/scrapers/test-all', {}, {
    params: { concurrency },
    timeout: 300000, // 5 minutes timeout for batch test
  });
  return response.data;
}

/**
 * Get cross-validation config (Turbopack-safe - direct axios call)
 */
export async function getCrossValidationConfigApi() {
  const client = createStandaloneClient();
  const response = await client.get('/scrapers/cross-validation-config');
  return response.data;
}

/**
 * Update cross-validation config (Turbopack-safe - direct axios call)
 */
export async function updateCrossValidationConfigApi(config: {
  minSources?: number;
  severityThresholdHigh?: number;
  severityThresholdMedium?: number;
  sourcePriority?: string[];
  fieldTolerances?: {
    default: number;
    byField: Record<string, number>;
  };
}) {
  const client = createStandaloneClient();
  const response = await client.put('/scrapers/cross-validation-config', config);
  return response.data;
}

/**
 * Preview config impact (Turbopack-safe - direct axios call)
 */
export async function previewConfigImpactApi(config: {
  minSources?: number;
  severityThresholdHigh?: number;
  severityThresholdMedium?: number;
  sourcePriority?: string[];
  fieldTolerances?: {
    default: number;
    byField: Record<string, number>;
  };
}) {
  const client = createStandaloneClient();
  const response = await client.post('/scrapers/cross-validation-config/preview', config);
  return response.data;
}
