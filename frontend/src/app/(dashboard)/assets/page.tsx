'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AssetTable } from '@/components/dashboard/asset-table';
import { Search, Filter } from 'lucide-react';

// Mock data
const mockAssets = [
  { ticker: 'PETR4', name: 'Petrobras PN', price: 38.45, change: 2.34, volume: 125000000, marketCap: 500000000000 },
  { ticker: 'VALE3', name: 'Vale ON', price: 65.78, change: -1.12, volume: 98000000, marketCap: 350000000000 },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', price: 28.90, change: 0.87, volume: 67000000, marketCap: 280000000000 },
  { ticker: 'BBDC4', name: 'Bradesco PN', price: 14.56, change: 1.45, volume: 89000000, marketCap: 150000000000 },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', price: 25.34, change: -0.34, volume: 45000000, marketCap: 120000000000 },
  { ticker: 'ABEV3', name: 'Ambev ON', price: 12.89, change: 0.78, volume: 78000000, marketCap: 200000000000 },
  { ticker: 'WEGE3', name: 'WEG ON', price: 42.15, change: 1.92, volume: 34000000, marketCap: 160000000000 },
  { ticker: 'RENT3', name: 'Localiza ON', price: 58.32, change: -0.56, volume: 23000000, marketCap: 80000000000 },
  { ticker: 'MGLU3', name: 'Magazine Luiza ON', price: 3.45, change: 3.45, volume: 156000000, marketCap: 45000000000 },
  { ticker: 'SUZB3', name: 'Suzano ON', price: 52.67, change: -1.23, volume: 19000000, marketCap: 95000000000 },
];

export default function AssetsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = mockAssets.filter(
    (asset) =>
      asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        <AssetTable
          assets={filteredAssets}
          onAssetClick={handleAssetClick}
        />
      </Card>
    </div>
  );
}
