'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiPaneChart } from '@/components/charts/multi-pane-chart';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function TechnicalAnalysisPage() {
  const params = useParams();
  const ticker = (params?.ticker as string) || '';

  const [timeframe, setTimeframe] = useState('1D');
  const [priceData, setPriceData] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    sma50: true,
    sma200: false,
    ema9: false,
    ema21: false,
    bollinger: false,
    pivotPoints: false,
    rsi: true,
    macd: true,
    stochastic: false,
  });

  // Fetch technical data (prices + indicators) from backend
  useEffect(() => {
    const fetchTechnicalData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/market-data/${ticker}/technical?timeframe=${timeframe}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch technical data');

        const data = await response.json();

        // Set prices
        setPriceData(data.prices);

        // Set current price and change
        if (data.prices.length > 0) {
          const latest = data.prices[data.prices.length - 1];
          const previous = data.prices[data.prices.length - 2];
          setCurrentPrice(latest.close);
          if (previous) {
            const change = ((latest.close - previous.close) / previous.close) * 100;
            setPriceChange(change);
          }
        }

        // Set indicators (may be null if insufficient data or Python Service error)
        setIndicators(data.indicators);

        // Log metadata (cache hit/miss, duration, errors)
        console.log('Technical data metadata:', data.metadata);

        // Show warning if insufficient data
        if (data.metadata.error === 'INSUFFICIENT_DATA') {
          console.warn(
            `Insufficient data: ${data.metadata.available}/${data.metadata.required} points`
          );
        }

        // Show warning if Python Service error
        if (data.metadata.error === 'PYTHON_SERVICE_ERROR') {
          console.warn('Indicators unavailable (Python Service error)');
        }
      } catch (error) {
        console.error('Error fetching technical data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicalData();
  }, [ticker, timeframe]);

  const handleIndicatorToggle = (indicator: keyof typeof showIndicators) => {
    setShowIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/assets" className="hover:text-foreground">Ativos</Link>
        <span>/</span>
        <Link href={`/assets/${ticker}`} className="hover:text-foreground">{ticker}</Link>
        <span>/</span>
        <span className="text-foreground">Análise Técnica</span>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <Link href={`/assets/${ticker}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{ticker}</h1>
                <p className="text-muted-foreground">Análise Técnica Avançada</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">R$ {currentPrice.toFixed(2)}</div>
            <div className={`flex items-center justify-end space-x-1 text-sm ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeframe Selector */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          {['1D', '1MO', '3MO', '6MO', '1Y', '2Y', '5Y', 'MAX'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </Card>

      {/* Indicator Toggles */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Indicadores</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(showIndicators).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={() => handleIndicatorToggle(key as keyof typeof showIndicators)}
              />
              <label
                htmlFor={key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Multi-Pane Chart */}
      {priceData.length > 0 && indicators && (
        <Card className="p-0 overflow-hidden">
          <MultiPaneChart
            data={priceData}
            indicators={indicators}
            showIndicators={showIndicators}
          />
        </Card>
      )}
    </div>
  );
}
