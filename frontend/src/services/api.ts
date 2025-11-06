import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export const assetsApi = {
  getAll: (type?: string) => api.get('/assets', { params: { type } }),
  getByTicker: (ticker: string) => api.get(`/assets/${ticker}`),
  getPriceHistory: (ticker: string, startDate?: string, endDate?: string) =>
    api.get(`/assets/${ticker}/price-history`, { params: { startDate, endDate } }),
  syncAsset: (ticker: string) => api.post(`/assets/${ticker}/sync`),
}

export const analysisApi = {
  generateFundamental: (ticker: string) => api.post(`/analysis/${ticker}/fundamental`),
  generateTechnical: (ticker: string) => api.post(`/analysis/${ticker}/technical`),
  generateComplete: (ticker: string) => api.post(`/analysis/${ticker}/complete`),
  getByTicker: (ticker: string, type?: string) =>
    api.get(`/analysis/${ticker}`, { params: { type } }),
  getDetails: (id: string) => api.get(`/analysis/${id}/details`),
}

export const portfolioApi = {
  getAll: () => api.get('/portfolio'),
  create: (data: any) => api.post('/portfolio', data),
  import: (data: any) => api.post('/portfolio/import', data),
}

export const reportsApi = {
  generate: (ticker: string) => api.post(`/reports/${ticker}/generate`),
}

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
}

export const dataSourcesApi = {
  getAll: () => api.get('/data-sources'),
  getStatus: () => api.get('/data-sources/status'),
}
