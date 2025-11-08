import { useEffect, useState } from 'react';
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

  return {
    isConnected,
    subscribe: wsService.subscribe.bind(wsService),
    unsubscribe: wsService.unsubscribe.bind(wsService),
    on: wsService.on.bind(wsService),
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
    // wsService methods are stable singleton references, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers]);

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
    // wsService methods are stable singleton references, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers]);

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
    // wsService methods are stable singleton references, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers]);

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
    // wsService methods are stable singleton references, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // wsService methods are stable singleton references, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}
