'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssetUpdates } from '@/hooks/useAssetUpdates';
import { cn } from '@/lib/utils';

interface AssetUpdateButtonProps {
  ticker: string;
  userId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  onUpdateStart?: () => void;
  onUpdateComplete?: (result: any) => void;
  onUpdateError?: (error: any) => void;
}

export function AssetUpdateButton({
  ticker,
  userId,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
  onUpdateStart,
  onUpdateComplete,
  onUpdateError,
}: AssetUpdateButtonProps) {
  const { updateSingleAsset, isUpdating, currentTicker } = useAssetUpdates();
  const [isLoading, setIsLoading] = useState(false);

  const isThisAssetUpdating = isUpdating && currentTicker === ticker;

  const handleUpdate = async () => {
    setIsLoading(true);
    onUpdateStart?.();

    try {
      const result = await updateSingleAsset(ticker, userId);
      onUpdateComplete?.(result);
    } catch (error) {
      onUpdateError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonVariant = variant === 'icon' ? 'ghost' : variant;
  const buttonSize = variant === 'icon' ? 'icon' : size;

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={handleUpdate}
      disabled={isLoading || isThisAssetUpdating}
      className={cn(
        'gap-2',
        variant === 'icon' && 'h-9 w-9 p-0',
        className
      )}
    >
      <RefreshCw
        className={cn(
          'h-4 w-4',
          (isLoading || isThisAssetUpdating) && 'animate-spin'
        )}
      />
      {showLabel && variant !== 'icon' && (
        <span>
          {isLoading || isThisAssetUpdating ? 'Atualizando...' : 'Atualizar'}
        </span>
      )}
    </Button>
  );
}
