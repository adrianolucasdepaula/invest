import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api/v1';
const OAUTH_BASE_URL = process.env.NEXT_PUBLIC_OAUTH_URL || 'http://localhost:8000';

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
      (config) => {
        const token = Cookies.get('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          Cookies.remove('access_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      },
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

  async getAssetPrices(ticker: string, params?: { range?: string; startDate?: string; endDate?: string }) {
    const response = await this.client.get(`/assets/${ticker}/price-history`, { params });
    return response.data;
  }

  async getMarketDataPrices(ticker: string, params?: { timeframe?: string; range?: string; days?: number }) {
    const response = await this.client.get(`/market-data/${ticker}/prices`, { params });
    return response.data;
  }

  async getAssetFundamentals(ticker: string) {
    const response = await this.client.get(`/assets/${ticker}/fundamentals`);
    return response.data;
  }

  async syncAllAssets(range: string = '3mo') {
    const response = await this.client.post('/assets/sync-all', {}, {
      params: { range },
    });
    return response.data;
  }

  async syncAsset(ticker: string, range: string = '3mo') {
    const response = await this.client.post(`/assets/${ticker}/sync`, {}, {
      params: { range },
    });
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
      data,
    );
    return response.data;
  }

  async deletePosition(portfolioId: string, positionId: string) {
    const response = await this.client.delete(
      `/portfolio/${portfolioId}/positions/${positionId}`,
    );
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
