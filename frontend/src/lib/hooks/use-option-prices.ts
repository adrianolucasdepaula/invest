'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsService } from '@/lib/websocket';
import { wheelKeys } from './use-wheel';

// ============================================================================
// FASE 110: Option Prices Real-time Hook
// ============================================================================

// Types
export interface OptionPriceData {
  optionTicker: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  delta?: number;
  impliedVolatility?: number;
}

export interface OptionChainData {
  underlyingTicker: string;
  expirationDate: string;
  calls: OptionPriceData[];
  puts: OptionPriceData[];
  timestamp: Date;
}

export interface OptionGreeksData {
  underlyingTicker: string;
  underlyingPrice: number;
  options: Array<{
    optionTicker: string;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    impliedVolatility: number;
    intrinsicValue: number;
    extrinsicValue: number;
  }>;
  timestamp: Date;
}

export interface OptionExpirationAlert {
  ticker: string;
  optionTicker: string;
  strike: number;
  type: 'CALL' | 'PUT';
  expiration: string;
  daysToExpiration: number;
  inTheMoney: boolean;
  timestamp: Date;
}

export interface WheelRecommendationUpdate {
  strategyId: string;
  ticker: string;
  type: 'PUT' | 'CALL';
  recommendations: Array<{
    optionTicker: string;
    strike: number;
    expiration: string;
    premium: number;
    delta: number;
    annualizedReturn: number;
    score: number;
  }>;
  timestamp: Date;
}

/**
 * Hook for subscribing to real-time option chain updates
 * @param ticker - Underlying ticker to subscribe to (e.g., 'PETR4')
 */
export function useOptionChainRealtime(ticker: string | null) {
  const [chainData, setChainData] = useState<OptionChainData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ticker) {
      setChainData(null);
      return;
    }

    // Connect to WebSocket
    wsService.connect();
    setIsConnected(true);

    // Subscribe to options for this ticker
    wsService.subscribe([ticker], ['options']);

    // Listen for option chain updates
    const handleChainUpdate = (data: OptionChainData) => {
      if (data.underlyingTicker === ticker) {
        setChainData(data);
      }
    };

    cleanupRef.current = wsService.on('option_chain_update', handleChainUpdate);

    return () => {
      cleanupRef.current?.();
      wsService.unsubscribe([ticker], ['options']);
      setIsConnected(false);
    };
  }, [ticker]);

  return { chainData, isConnected };
}

/**
 * Hook for subscribing to real-time Greeks updates
 * @param ticker - Underlying ticker to subscribe to
 */
export function useOptionGreeksRealtime(ticker: string | null) {
  const [greeksData, setGreeksData] = useState<OptionGreeksData | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ticker) {
      setGreeksData(null);
      return;
    }

    wsService.connect();
    wsService.subscribe([ticker], ['options']);

    const handleGreeksUpdate = (data: OptionGreeksData) => {
      if (data.underlyingTicker === ticker) {
        setGreeksData(data);
      }
    };

    cleanupRef.current = wsService.on('option_greeks_update', handleGreeksUpdate);

    return () => {
      cleanupRef.current?.();
      wsService.unsubscribe([ticker], ['options']);
    };
  }, [ticker]);

  return { greeksData };
}

/**
 * Hook for listening to option expiration alerts for a specific ticker
 * Useful for showing notifications when options are about to expire
 * FASE 110.2: Fixed - now properly subscribes to ticker-specific room
 * @param ticker - Optional ticker to subscribe to (if null, only listens)
 */
export function useOptionExpirationAlerts(ticker?: string | null) {
  const [alerts, setAlerts] = useState<OptionExpirationAlert[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    wsService.connect();

    // FASE 110.2: Subscribe to ticker-specific room to receive alerts
    if (ticker) {
      wsService.subscribe([ticker], ['options']);
    }

    const handleAlert = (data: OptionExpirationAlert) => {
      setAlerts((prev) => {
        // Avoid duplicates
        const exists = prev.some(
          (a) => a.optionTicker === data.optionTicker && a.expiration === data.expiration
        );
        if (exists) return prev;
        return [...prev, data].slice(-50); // Keep last 50 alerts
      });
    };

    cleanupRef.current = wsService.on('option_expiration_alert', handleAlert);

    return () => {
      cleanupRef.current?.();
      // Unsubscribe when component unmounts
      if (ticker) {
        wsService.unsubscribe([ticker], ['options']);
      }
    };
  }, [ticker]);

  const clearAlerts = useCallback(() => setAlerts([]), []);
  const dismissAlert = useCallback((optionTicker: string) => {
    setAlerts((prev) => prev.filter((a) => a.optionTicker !== optionTicker));
  }, []);

  return { alerts, clearAlerts, dismissAlert };
}

/**
 * Hook for listening to WHEEL recommendation updates
 * Invalidates React Query cache when recommendations change
 * @param strategyId - WHEEL strategy ID to listen for
 */
export function useWheelRecommendationUpdates(strategyId: string | null) {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<WheelRecommendationUpdate | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!strategyId) return;

    wsService.connect();

    const handleUpdate = (data: WheelRecommendationUpdate) => {
      if (data.strategyId === strategyId) {
        setLastUpdate(data);
        // Invalidate React Query cache to trigger refetch
        queryClient.invalidateQueries({ queryKey: wheelKeys.putRecommendations(strategyId) });
        queryClient.invalidateQueries({ queryKey: wheelKeys.callRecommendations(strategyId) });
      }
    };

    cleanupRef.current = wsService.on('wheel_recommendation_update', handleUpdate);

    return () => {
      cleanupRef.current?.();
    };
  }, [strategyId, queryClient]);

  return { lastUpdate };
}

/**
 * Combined hook for all option-related real-time updates
 * Use this when you need multiple types of updates for the same ticker
 */
export function useOptionPricesRealtime(ticker: string | null, strategyId?: string | null) {
  const { chainData, isConnected } = useOptionChainRealtime(ticker);
  const { greeksData } = useOptionGreeksRealtime(ticker);
  const { alerts, clearAlerts, dismissAlert } = useOptionExpirationAlerts();
  const { lastUpdate: wheelUpdate } = useWheelRecommendationUpdates(strategyId || null);

  // Filter alerts for this ticker
  const tickerAlerts = ticker
    ? alerts.filter((a) => a.ticker === ticker)
    : alerts;

  return {
    // Connection status
    isConnected,

    // Option chain data
    chainData,

    // Greeks data
    greeksData,

    // Expiration alerts (filtered by ticker if provided)
    alerts: tickerAlerts,
    clearAlerts,
    dismissAlert,

    // WHEEL recommendation updates
    wheelUpdate,
  };
}
