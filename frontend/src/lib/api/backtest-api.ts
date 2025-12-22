'use client';

import axios from 'axios';
import Cookies from 'js-cookie';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api/v1';

/**
 * Generate trace context for distributed tracing
 */
function generateTraceContext() {
  const traceId = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const spanId = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const traceparent = `00-${traceId}-${spanId}-01`;
  return { traceparent, traceId, spanId };
}

/**
 * Create a standalone axios client for backtest API calls
 * Isolated from main api.ts to avoid Turbopack bundling issues
 */
function createBacktestClient() {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds for long backtest operations
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth interceptor
  client.interceptors.request.use((config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add trace context
    const { traceparent } = generateTraceContext();
    config.headers['traceparent'] = traceparent;
    return config;
  });

  return client;
}

// =============================================================================
// BACKTEST API FUNCTIONS - FASE 101.4
// =============================================================================

/**
 * Create and start a new backtest
 */
export async function createBacktestApi(data: {
  assetId: string;
  name: string;
  startDate: string;
  endDate: string;
  config: {
    initialCapital: number;
    targetDelta: number;
    minROE: number;
    minDividendYield: number;
    maxDebtEbitda: number;
    minMargemLiquida?: number;
    expirationDays?: number;
    weeklyDistribution: boolean;
    maxWeeklyAllocation?: number;
    reinvestDividends: boolean;
    includeLendingIncome: boolean;
  };
}) {
  const client = createBacktestClient();
  const response = await client.post('/wheel/backtest', data);
  return response.data;
}

/**
 * Get all backtests for the user
 */
export async function getBacktestsApi(params?: {
  assetId?: string;
  status?: 'running' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
}) {
  const client = createBacktestClient();
  const response = await client.get('/wheel/backtest', { params });
  return response.data;
}

/**
 * Get a specific backtest result
 */
export async function getBacktestApi(id: string) {
  const client = createBacktestClient();
  const response = await client.get(`/wheel/backtest/${id}`);
  return response.data;
}

/**
 * Get backtest progress
 */
export async function getBacktestProgressApi(id: string) {
  const client = createBacktestClient();
  const response = await client.get(`/wheel/backtest/${id}/progress`);
  return response.data;
}

/**
 * Delete a backtest
 */
export async function deleteBacktestApi(id: string) {
  const client = createBacktestClient();
  const response = await client.delete(`/wheel/backtest/${id}`);
  return response.data;
}

/**
 * Compare two backtests
 */
export async function compareBacktestsApi(id1: string, id2: string) {
  const client = createBacktestClient();
  const response = await client.get(`/wheel/backtest/compare/${id1}/${id2}`);
  return response.data;
}
