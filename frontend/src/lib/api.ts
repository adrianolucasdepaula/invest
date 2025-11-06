import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
        const token = localStorage.getItem('access_token');
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
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
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

  async getAssetPrices(ticker: string, params?: { startDate?: string; endDate?: string }) {
    const response = await this.client.get(`/assets/${ticker}/prices`, { params });
    return response.data;
  }

  async getAssetFundamentals(ticker: string) {
    const response = await this.client.get(`/assets/${ticker}/fundamentals`);
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
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  }

  async loginWithGoogle(token: string) {
    const response = await this.client.post('/auth/google', { token });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  }

  async logout() {
    localStorage.removeItem('access_token');
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }
}

export const api = new ApiClient();
