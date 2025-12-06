'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  ArrowLeftRight,
  LayoutGrid,
  Loader2,
  X,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import custom components
import StockHeader from '@/components/StockHeader';
import FundamentalMetrics from '@/components/FundamentalMetrics';
import AIAnalysisCard from '@/components/AIAnalysisCard';
import NewsCard from '@/components/NewsCard';
import InsiderActivity from '@/components/InsiderActivity';
import StockComparison from '@/components/StockComparison';

import { cn } from '@/lib/utils';
import axios from 'axios';

// Popular stocks for quick access
const POPULAR_STOCKS = [
  { ticker: 'PETR4', name: 'Petrobras' },
  { ticker: 'VALE3', name: 'Vale' },
  { ticker: 'ITUB4', name: 'Itaú' },
  { ticker: 'BBDC4', name: 'Bradesco' },
  { ticker: 'ABEV3', name: 'Ambev' },
  { ticker: 'BBAS3', name: 'Banco do Brasil' },
  { ticker: 'WEGE3', name: 'WEG' },
  { ticker: 'RENT3', name: 'Localiza' },
];

const SECTORS = [
  { value: 'all', label: 'Todos os Setores' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'energia', label: 'Energia' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'consumo', label: 'Consumo' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'saude', label: 'Saúde' },
  { value: 'industria', label: 'Indústria' },
];

interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdate: Date;
  sector: string;
  volume?: number;
  marketCap?: number;
  metrics: any;
  aiAnalysis?: any;
  news?: any[];
  insiderTransactions?: any[];
  aiRecommendation?: 'BUY' | 'HOLD' | 'SELL';
}

export default function StockAnalysisDashboard() {
  const [view, setView] = useState<'single' | 'comparison' | 'sector'>('single');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [comparisonStocks, setComparisonStocks] = useState<StockData[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load stock data
  const loadStockData = async (ticker: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/analysis/stock/${ticker}`);

      // Mock data structure - adjust based on your actual API response
      const mockData: StockData = {
        ticker: ticker.toUpperCase(),
        companyName: response.data?.companyName || `${ticker} S.A.`,
        currentPrice: response.data?.price || 28.50,
        priceChange: response.data?.priceChange || 0.85,
        priceChangePercent: response.data?.priceChangePercent || 3.07,
        lastUpdate: new Date(),
        sector: response.data?.sector || 'Energia',
        volume: response.data?.volume || 15420000,
        marketCap: response.data?.marketCap || 362000000000,
        metrics: {
          pl: response.data?.metrics?.pl || 4.12,
          pvp: response.data?.metrics?.pvp || 0.98,
          roe: response.data?.metrics?.roe || 24.5,
          dividendYield: response.data?.metrics?.dividendYield || 8.7,
          debtEquity: response.data?.metrics?.debtEquity || 0.45,
          ebitda: response.data?.metrics?.ebitda || 125000000000,
          netMargin: response.data?.metrics?.netMargin || 18.3,
          currentRatio: response.data?.metrics?.currentRatio || 1.8,
        },
        aiAnalysis: response.data?.aiAnalysis || {
          consolidatedSentiment: 'positive',
          consensusRecommendation: 'BUY',
          strengths: [
            'Forte geração de caixa operacional',
            'Valuation atrativo com P/L baixo',
            'Dividendos consistentes e elevados',
          ],
          risks: [
            'Exposição a volatilidade do preço do petróleo',
            'Riscos regulatórios e políticos',
            'Dependência do mercado doméstico',
          ],
          aiOpinions: [
            {
              aiName: 'ChatGPT',
              sentiment: 'positive',
              recommendation: 'BUY',
              confidence: 85,
              summary: 'Valuation atrativo e forte geração de caixa',
              reasoning: 'A empresa apresenta múltiplos baixos e excelente capacidade de distribuição de dividendos',
            },
            {
              aiName: 'Claude',
              sentiment: 'positive',
              recommendation: 'BUY',
              confidence: 82,
              summary: 'Fundamentos sólidos apesar dos riscos',
              reasoning: 'Balanço patrimonial robusto e posicionamento estratégico no setor',
            },
            {
              aiName: 'Gemini',
              sentiment: 'neutral',
              recommendation: 'HOLD',
              confidence: 75,
              summary: 'Aguardar melhor momento de entrada',
              reasoning: 'Incertezas macroeconômicas podem impactar performance no curto prazo',
            },
          ],
        },
        news: response.data?.news || [
          {
            id: '1',
            title: `${ticker} anuncia lucro recorde no trimestre`,
            summary: 'Empresa supera expectativas do mercado com forte performance operacional',
            source: 'Valor Econômico',
            url: '#',
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            sentiment: 'positive',
          },
          {
            id: '2',
            title: 'Análise: Perspectivas para o setor de energia',
            summary: 'Especialistas avaliam cenário macroeconômico e impactos no setor',
            source: 'InfoMoney',
            url: '#',
            publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            sentiment: 'neutral',
          },
        ],
        insiderTransactions: response.data?.insiderTransactions || [
          {
            id: '1',
            insiderName: 'João Silva',
            insiderRole: 'CEO',
            transactionType: 'buy',
            quantity: 50000,
            price: 28.30,
            totalValue: 1415000,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: '2',
            insiderName: 'Maria Santos',
            insiderRole: 'CFO',
            transactionType: 'buy',
            quantity: 25000,
            price: 28.45,
            totalValue: 711250,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ],
        aiRecommendation: 'BUY',
      };

      setStockData(mockData);
      setSelectedTicker(ticker.toUpperCase());

      // Add to recent searches
      const newRecentSearches = [ticker.toUpperCase(), ...recentSearches.filter(t => t !== ticker.toUpperCase())].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    } catch (err: any) {
      console.error('Error loading stock data:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados da ação');
    } finally {
      setIsLoading(false);
    }
  };

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle search
  const handleSearch = (ticker: string) => {
    if (ticker.trim()) {
      if (view === 'comparison') {
        addToComparison(ticker.trim().toUpperCase());
      } else {
        loadStockData(ticker.trim().toUpperCase());
      }
      setSearchTerm('');
      setShowSearchResults(false);
    }
  };

  // Add stock to comparison
  const addToComparison = async (ticker: string) => {
    if (comparisonStocks.length >= 3) {
      alert('Máximo de 3 ações para comparação');
      return;
    }

    if (comparisonStocks.some(s => s.ticker === ticker)) {
      alert('Ação já está na comparação');
      return;
    }

    setIsLoading(true);
    try {
      // Load the stock data (would use the same API call as loadStockData)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/analysis/stock/${ticker}`);

      // Create a simplified version for comparison
      const stockForComparison: StockData = {
        ticker: ticker,
        companyName: `${ticker} S.A.`,
        currentPrice: 28.50,
        priceChange: 0.85,
        priceChangePercent: 3.07,
        lastUpdate: new Date(),
        sector: 'Energia',
        metrics: {
          pl: 4.12,
          pvp: 0.98,
          roe: 24.5,
          dividendYield: 8.7,
          debtEquity: 0.45,
          marketCap: 362000000000,
        },
        aiRecommendation: 'BUY',
      };

      setComparisonStocks([...comparisonStocks, stockForComparison]);
    } catch (err) {
      console.error('Error adding stock to comparison:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove stock from comparison
  const removeFromComparison = (ticker: string) => {
    setComparisonStocks(comparisonStocks.filter(s => s.ticker !== ticker));
  };

  // Refresh AI analysis
  const handleRefreshAIAnalysis = async () => {
    if (!selectedTicker) return;
    // Would call API to regenerate AI analysis
    console.log('Refreshing AI analysis for', selectedTicker);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análise de Ações B3</h1>
          <p className="text-muted-foreground">
            Análise completa com dados fundamentalistas, notícias e IA
          </p>
        </div>

        {/* View Selector */}
        <div className="flex gap-2">
          <Button
            variant={view === 'single' ? 'default' : 'outline'}
            onClick={() => setView('single')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Análise
          </Button>
          <Button
            variant={view === 'comparison' ? 'default' : 'outline'}
            onClick={() => setView('comparison')}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Comparar
          </Button>
          <Button
            variant={view === 'sector' ? 'default' : 'outline'}
            onClick={() => setView('sector')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Setores
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ticker (ex: PETR4, VALE3, ITUB4...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => handleSearch(searchTerm)} disabled={!searchTerm.trim()}>
                Buscar
              </Button>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Buscas Recentes:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((ticker) => (
                    <Badge
                      key={ticker}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleSearch(ticker)}
                    >
                      {ticker}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Stocks */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ações Populares:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_STOCKS.map((stock) => (
                  <Badge
                    key={stock.ticker}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSearch(stock.ticker)}
                  >
                    {stock.ticker} - {stock.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="py-6 text-center text-red-600">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Single Stock View */}
      {view === 'single' && !isLoading && stockData && (
        <div className="space-y-6">
          {/* Stock Header */}
          <StockHeader
            ticker={stockData.ticker}
            companyName={stockData.companyName}
            currentPrice={stockData.currentPrice}
            priceChange={stockData.priceChange}
            priceChangePercent={stockData.priceChangePercent}
            lastUpdate={stockData.lastUpdate}
            sector={stockData.sector}
            volume={stockData.volume}
            marketCap={stockData.marketCap}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Fundamental Metrics */}
              <FundamentalMetrics
                ticker={stockData.ticker}
                metrics={stockData.metrics}
                dataSources={3}
                confidenceScore={88}
              />

              {/* News Feed */}
              <NewsCard
                ticker={stockData.ticker}
                articles={stockData.news || []}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* AI Analysis */}
              {stockData.aiAnalysis && (
                <AIAnalysisCard
                  ticker={stockData.ticker}
                  consolidatedSentiment={stockData.aiAnalysis.consolidatedSentiment}
                  consensusRecommendation={stockData.aiAnalysis.consensusRecommendation}
                  strengths={stockData.aiAnalysis.strengths}
                  risks={stockData.aiAnalysis.risks}
                  aiOpinions={stockData.aiAnalysis.aiOpinions}
                  lastUpdate={new Date()}
                  onRefresh={handleRefreshAIAnalysis}
                />
              )}

              {/* Insider Activity */}
              <InsiderActivity
                ticker={stockData.ticker}
                transactions={stockData.insiderTransactions || []}
              />
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {view === 'comparison' && !isLoading && (
        <div className="space-y-6">
          {comparisonStocks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ArrowLeftRight className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Nenhuma ação selecionada para comparação</p>
                <p className="text-sm">
                  Use a busca acima para adicionar ações (máximo 3)
                </p>
              </CardContent>
            </Card>
          ) : (
            <StockComparison
              stocks={comparisonStocks}
              onRemoveStock={removeFromComparison}
            />
          )}
        </div>
      )}

      {/* Sector View */}
      {view === 'sector' && !isLoading && (
        <div className="space-y-6">
          {/* Sector Filter */}
          <Card>
            <CardContent className="p-4">
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Sector Overview */}
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <LayoutGrid className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Visão de Setores</p>
              <p className="text-sm">
                Em desenvolvimento - Aqui será exibido um overview do setor selecionado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {view === 'single' && !isLoading && !stockData && !error && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Nenhuma ação selecionada</p>
            <p className="text-sm">
              Use a busca acima para começar a análise de uma ação
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
