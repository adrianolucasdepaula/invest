'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Download,
  Eye,
  Clock,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

const mockReports = [
  {
    id: '1',
    ticker: 'PETR4',
    assetName: 'Petrobras PN',
    createdAt: '2024-01-15T10:30:00',
    recommendation: 'STRONG_BUY',
    confidence: 85,
    targetPrice: 45.00,
    currentPrice: 38.45,
    upside: 17.03,
  },
  {
    id: '2',
    ticker: 'VALE3',
    assetName: 'Vale ON',
    createdAt: '2024-01-14T15:45:00',
    recommendation: 'HOLD',
    confidence: 70,
    targetPrice: 67.00,
    currentPrice: 65.78,
    upside: 1.85,
  },
  {
    id: '3',
    ticker: 'ITUB4',
    assetName: 'Itaú Unibanco PN',
    createdAt: '2024-01-13T09:15:00',
    recommendation: 'BUY',
    confidence: 78,
    targetPrice: 32.50,
    currentPrice: 28.90,
    upside: 12.46,
  },
  {
    id: '4',
    ticker: 'MGLU3',
    assetName: 'Magazine Luiza ON',
    createdAt: '2024-01-12T14:20:00',
    recommendation: 'SELL',
    confidence: 82,
    targetPrice: 2.80,
    currentPrice: 3.45,
    upside: -18.84,
  },
  {
    id: '5',
    ticker: 'WEGE3',
    assetName: 'WEG ON',
    createdAt: '2024-01-11T11:00:00',
    recommendation: 'STRONG_BUY',
    confidence: 88,
    targetPrice: 52.00,
    currentPrice: 42.15,
    upside: 23.37,
  },
];

const getRecommendationColor = (recommendation: string) => {
  switch (recommendation) {
    case 'STRONG_BUY':
      return 'text-success bg-success/10 border-success/20';
    case 'BUY':
      return 'text-success bg-success/10 border-success/20';
    case 'HOLD':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'SELL':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'STRONG_SELL':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    default:
      return 'text-muted-foreground bg-muted/10 border-muted/20';
  }
};

const getRecommendationLabel = (recommendation: string) => {
  switch (recommendation) {
    case 'STRONG_BUY':
      return 'Compra Forte';
    case 'BUY':
      return 'Compra';
    case 'HOLD':
      return 'Manter';
    case 'SELL':
      return 'Venda';
    case 'STRONG_SELL':
      return 'Venda Forte';
    default:
      return recommendation;
  }
};

const getRecommendationIcon = (recommendation: string) => {
  switch (recommendation) {
    case 'STRONG_BUY':
    case 'BUY':
      return <TrendingUp className="h-4 w-4" />;
    case 'HOLD':
      return <Minus className="h-4 w-4" />;
    case 'SELL':
    case 'STRONG_SELL':
      return <TrendingDown className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = mockReports.filter(
    (report) =>
      report.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.assetName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Relatórios de análise gerados com inteligência artificial
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Gerar Novo Relatório
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar relatórios por ticker ou ativo..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-xl font-semibold">{report.ticker}</h3>
                    <p className="text-sm text-muted-foreground">{report.assetName}</p>
                  </div>
                  <div
                    className={cn(
                      'flex items-center space-x-2 rounded-full border px-3 py-1',
                      getRecommendationColor(report.recommendation),
                    )}
                  >
                    {getRecommendationIcon(report.recommendation)}
                    <span className="text-sm font-semibold">
                      {getRecommendationLabel(report.recommendation)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <span>Confiança:</span>
                    <span className="font-semibold text-foreground">
                      {report.confidence}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Atual</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(report.currentPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Alvo</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(report.targetPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Potencial</p>
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        report.upside >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {report.upside >= 0 ? '+' : ''}
                      {report.upside.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gerado em</p>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold">Nenhum relatório encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente buscar por outro termo ou gere um novo relatório
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
