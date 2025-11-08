'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAssets } from '@/lib/hooks/use-assets';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AssetTable } from '@/components/dashboard/asset-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter } from 'lucide-react';

export default function AssetsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: assets, isLoading, error } = useAssets();

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter(
      (asset: any) =>
        asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [assets, searchTerm]);

  const handleAssetClick = (ticker: string) => {
    router.push(`/assets/${ticker}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ativos</h1>
        <p className="text-muted-foreground">
          Explore e analise os principais ativos da B3
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por ticker ou nome..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Erro ao carregar ativos</p>
            <p className="text-sm text-muted-foreground mt-2">
              Verifique sua conexão e tente novamente
            </p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum ativo encontrado</p>
          </div>
        ) : (
          <AssetTable assets={filteredAssets} onAssetClick={handleAssetClick} />
        )}
      </Card>
    </div>
  );
}
