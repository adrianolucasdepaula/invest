import { useEffect, useState, useCallback } from 'react';
import { wsService } from '../websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = wsService.connect();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const subscribe = useCallback((tickers: string[], events: ('prices' | 'analysis' | 'reports' | 'portfolio')[]) => {
    return wsService.subscribe(tickers, events);
  }, []);

  const unsubscribe = useCallback((tickers?: string[], events?: string[]) => {
    return wsService.unsubscribe(tickers, events);
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    return wsService.on(event, callback);
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    on,
  };
}

export function usePriceUpdates(tickers: string[]) {
  const [prices, setPrices] = useState<Record<string, any>>({});
  const { subscribe, unsubscribe, on } = useWebSocket();

  useEffect(() => {
    if (tickers.length === 0) return;

    subscribe(tickers, ['prices']);

    const unsubscribeListener = on('price_update', (data: any) => {
      setPrices((prev) => ({
        ...prev,
        [data.ticker]: data.data,
      }));
    });

    return () => {
      unsubscribe(tickers, ['prices']);
      unsubscribeListener();
    };
  }, [tickers, subscribe, unsubscribe, on]);

  return prices;
}

export function useAnalysisUpdates(tickers: string[]) {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const { subscribe, unsubscribe, on } = useWebSocket();

  useEffect(() => {
    if (tickers.length === 0) return;

    subscribe(tickers, ['analysis']);

    const unsubscribeListener = on('analysis_complete', (data: any) => {
      setAnalyses((prev) => [...prev, data]);
    });

    return () => {
      unsubscribe(tickers, ['analysis']);
      unsubscribeListener();
    };
  }, [tickers, subscribe, unsubscribe, on]);

  return analyses;
}

export function useReportUpdates(tickers: string[]) {
  const [reports, setReports] = useState<any[]>([]);
  const { subscribe, unsubscribe, on } = useWebSocket();

  useEffect(() => {
    if (tickers.length === 0) return;

    subscribe(tickers, ['reports']);

    const unsubscribeListener = on('report_ready', (data: any) => {
      setReports((prev) => [...prev, data]);
    });

    return () => {
      unsubscribe(tickers, ['reports']);
      unsubscribeListener();
    };
  }, [tickers, subscribe, unsubscribe, on]);

  return reports;
}

export function usePortfolioUpdates() {
  const [updates, setUpdates] = useState<any[]>([]);
  const { subscribe, unsubscribe, on } = useWebSocket();

  useEffect(() => {
    subscribe([], ['portfolio']);

    const unsubscribeListener = on('portfolio_update', (data: any) => {
      setUpdates((prev) => [...prev, data]);
    });

    return () => {
      unsubscribe([], ['portfolio']);
      unsubscribeListener();
    };
  }, [subscribe, unsubscribe, on]);

  return updates;
}

export function useMarketStatus() {
  const [status, setStatus] = useState<'open' | 'closed' | 'pre_open' | 'post_close'>('closed');
  const { on } = useWebSocket();

  useEffect(() => {
    const unsubscribe = on('market_status', (data: any) => {
      setStatus(data.status);
    });

    return () => {
      unsubscribe();
    };
  }, [on]);

  return status;
}
