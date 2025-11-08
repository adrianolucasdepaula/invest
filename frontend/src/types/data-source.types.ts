/**
 * Data Source Types
 * Tipos para fontes de dados e scraping
 */

export type DataSourceStatus = 'active' | 'inactive' | 'maintenance' | 'error';

export type DataSourceType =
  | 'fundamental'
  | 'technical'
  | 'news'
  | 'options'
  | 'macro'
  | 'insider'
  | 'report'
  | 'ai'
  | 'general';

export interface UpdateDataSourceData {
  status?: DataSourceStatus;
  description?: string;
  reliabilityScore?: number;
  isVerified?: boolean;
  isTrusted?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DataSource {
  id: string;
  name: string;
  code: string;
  url: string;
  type: DataSourceType;
  status: DataSourceStatus;
  description?: string;
  requiresLogin: boolean;
  loginType?: string;
  isVerified: boolean;
  isTrusted: boolean;
  reliabilityScore: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  errorCount: number;
  successCount: number;
  averageResponseTime?: number;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TestConnectionResult {
  success: boolean;
  dataSource: {
    id: string;
    name: string;
    code: string;
    url: string;
    status: DataSourceStatus;
  };
  test: {
    responseTime: number;
    statusCode: number | null;
    error: string | null;
    timestamp: string;
  };
  statistics: {
    successCount: number;
    errorCount: number;
    lastSuccessAt?: string;
    lastErrorAt?: string;
    averageResponseTime?: number;
  };
}
