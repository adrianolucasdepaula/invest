'use client';

import { Button } from '@/components/ui/button';

export type CandleTimeframe = '1D' | '1W' | '1M';
export type ViewingRange = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';

interface TimeframeRangePickerProps {
  selectedTimeframe: CandleTimeframe;
  selectedRange: ViewingRange;
  onTimeframeChange: (timeframe: CandleTimeframe) => void;
  onRangeChange: (range: ViewingRange) => void;
}

export function TimeframeRangePicker({
  selectedTimeframe,
  selectedRange,
  onTimeframeChange,
  onRangeChange,
}: TimeframeRangePickerProps) {
  const timeframes: { value: CandleTimeframe; label: string; description: string }[] = [
    { value: '1D', label: '1D', description: 'Daily candles' },
    { value: '1W', label: '1W', description: 'Weekly candles' },
    { value: '1M', label: '1M', description: 'Monthly candles' },
  ];

  const ranges: { value: ViewingRange; label: string }[] = [
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '6mo', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' },
    { value: '5y', label: '5Y' },
    { value: 'max', label: 'MAX' },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      {/* Candle Timeframe Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Candle:
        </span>
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={selectedTimeframe === tf.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeframeChange(tf.value)}
              className="min-w-[50px]"
              title={tf.description}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Viewing Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Period:
        </span>
        <div className="flex gap-1 flex-wrap">
          {ranges.map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange(range.value)}
              className="min-w-[45px]"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
