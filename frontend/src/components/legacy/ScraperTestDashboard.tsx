'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Play, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ScraperCard from '@/components/ScraperCard';
import TestResultModal from '@/components/TestResultModal';
import CookieStatusBanner from '@/components/CookieStatusBanner';

// Scraper type definitions
interface Scraper {
  id: string;
  name: string;
  category: string;
  auth: 'public' | 'oauth' | 'credentials';
  status: string;
}

// Scraper definitions with categorization
const SCRAPERS: Scraper[] = [
  // Fundamental Analysis (5)
  { id: 'fundamentus', name: 'Fundamentus', category: 'fundamental', auth: 'public', status: 'implemented' },
  { id: 'investsite', name: 'Investsite', category: 'fundamental', auth: 'public', status: 'implemented' },
  { id: 'statusinvest', name: 'StatusInvest', category: 'fundamental', auth: 'oauth', status: 'implemented' },
  { id: 'fundamentei', name: 'Fundamentei', category: 'fundamental', auth: 'oauth', status: 'implemented' },
  { id: 'investidor10', name: 'Investidor10', category: 'fundamental', auth: 'oauth', status: 'implemented' },

  // Market Analysis (4)
  { id: 'investing', name: 'Investing.com', category: 'market', auth: 'oauth', status: 'implemented' },
  { id: 'advfn', name: 'ADVFN', category: 'market', auth: 'oauth', status: 'implemented' },
  { id: 'googlefinance', name: 'Google Finance', category: 'market', auth: 'oauth', status: 'implemented' },
  { id: 'tradingview', name: 'TradingView', category: 'market', auth: 'oauth', status: 'implemented' },

  // Official Data (2)
  { id: 'b3', name: 'B3', category: 'official', auth: 'public', status: 'implemented' },
  { id: 'bcb', name: 'BCB (Banco Central)', category: 'official', auth: 'public', status: 'implemented' },

  // Insider Trading (1)
  { id: 'griffin', name: 'Griffin', category: 'insider', auth: 'public', status: 'implemented' },

  // Crypto (1)
  { id: 'coinmarketcap', name: 'CoinMarketCap', category: 'crypto', auth: 'public', status: 'implemented' },

  // Options (1)
  { id: 'opcoes', name: 'Opcoes.net.br', category: 'options', auth: 'credentials', status: 'implemented' },

  // AI Assistants (5)
  { id: 'chatgpt', name: 'ChatGPT', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'gemini', name: 'Gemini', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'deepseek', name: 'DeepSeek', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'claude', name: 'Claude', category: 'ai', auth: 'oauth', status: 'implemented' },
  { id: 'grok', name: 'Grok', category: 'ai', auth: 'oauth', status: 'implemented' },

  // News (6)
  { id: 'bloomberg', name: 'Bloomberg Línea', category: 'news', auth: 'public', status: 'implemented' },
  { id: 'googlenews', name: 'Google News', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'investing_news', name: 'Investing News', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'valor', name: 'Valor Econômico', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'exame', name: 'Exame', category: 'news', auth: 'oauth', status: 'implemented' },
  { id: 'infomoney', name: 'InfoMoney', category: 'news', auth: 'oauth', status: 'implemented' },

  // Institutional Reports (2)
  { id: 'estadao', name: 'Estadão Investidor', category: 'institutional', auth: 'oauth', status: 'implemented' },
  { id: 'maisretorno', name: 'Mais Retorno', category: 'institutional', auth: 'oauth', status: 'implemented' },
];

const CATEGORIES = [
  { value: 'all', label: 'Todas as Categorias' },
  { value: 'fundamental', label: 'Análise Fundamentalista (5)' },
  { value: 'market', label: 'Análise de Mercado (4)' },
  { value: 'official', label: 'Dados Oficiais (2)' },
  { value: 'insider', label: 'Insider Trading (1)' },
  { value: 'crypto', label: 'Criptomoedas (1)' },
  { value: 'options', label: 'Opções (1)' },
  { value: 'ai', label: 'IAs (5)' },
  { value: 'news', label: 'Notícias (6)' },
  { value: 'institutional', label: 'Relatórios Institucionais (2)' },
];

const AUTH_TYPES = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'public', label: 'Público (sem login)' },
  { value: 'oauth', label: 'Google OAuth' },
  { value: 'credentials', label: 'Credenciais Específicas' },
];

interface TestResult {
  scraperId: string;
  scraperName: string;
  query: string;
  status: 'success' | 'error' | 'running';
  data?: any;
  error?: string;
  executionTime?: number;
  timestamp: Date;
}

export default function ScraperTestDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAuthType, setSelectedAuthType] = useState('all');
  const [selectedScraper, setSelectedScraper] = useState<typeof SCRAPERS[0] | null>(null);
  const [testQuery, setTestQuery] = useState('PETR4');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);
  const [bulkTestProgress, setBulkTestProgress] = useState(0);
  const [isBulkTesting, setIsBulkTesting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentTestResult, setCurrentTestResult] = useState<TestResult | null>(null);

  // Filter scrapers based on search and filters
  const filteredScrapers = SCRAPERS.filter((scraper) => {
    const matchesSearch = scraper.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || scraper.category === selectedCategory;
    const matchesAuth = selectedAuthType === 'all' || scraper.auth === selectedAuthType;
    return matchesSearch && matchesCategory && matchesAuth;
  });

  // Get scraper test status
  const getScraperStatus = (scraperId: string) => {
    const result = testResults.find((r) => r.scraperId === scraperId);
    if (!result) return 'not-tested';
    return result.status === 'success' ? 'tested' : 'failed';
  };

  // Test individual scraper
  const testScraper = async (scraper: typeof SCRAPERS[0], query: string) => {
    const startTime = Date.now();
    const testResult: TestResult = {
      scraperId: scraper.id,
      scraperName: scraper.name,
      query,
      status: 'running',
      timestamp: new Date(),
    };

    // Add to recent tests
    setRecentTests((prev) => [testResult, ...prev.slice(0, 19)]);
    setCurrentTestResult(testResult);

    try {
      // Make API call to test scraper
      const response = await fetch(`/api/scrapers/test/${scraper.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const executionTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const successResult: TestResult = {
          ...testResult,
          status: 'success',
          data,
          executionTime,
        };

        setTestResults((prev) => [...prev.filter((r) => r.scraperId !== scraper.id), successResult]);
        setRecentTests((prev) => [successResult, ...prev.slice(1)]);
        setCurrentTestResult(successResult);
        return successResult;
      } else {
        const error = await response.text();
        const errorResult: TestResult = {
          ...testResult,
          status: 'error',
          error,
          executionTime,
        };

        setTestResults((prev) => [...prev.filter((r) => r.scraperId !== scraper.id), errorResult]);
        setRecentTests((prev) => [errorResult, ...prev.slice(1)]);
        setCurrentTestResult(errorResult);
        return errorResult;
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorResult: TestResult = {
        ...testResult,
        status: 'error',
        error: error.message,
        executionTime,
      };

      setTestResults((prev) => [...prev.filter((r) => r.scraperId !== scraper.id), errorResult]);
      setRecentTests((prev) => [errorResult, ...prev.slice(1)]);
      setCurrentTestResult(errorResult);
      return errorResult;
    }
  };

  // Bulk test scrapers
  const bulkTestScrapers = async (scrapers: typeof SCRAPERS) => {
    setIsBulkTesting(true);
    setBulkTestProgress(0);

    for (let i = 0; i < scrapers.length; i++) {
      await testScraper(scrapers[i], testQuery);
      setBulkTestProgress(((i + 1) / scrapers.length) * 100);
    }

    setIsBulkTesting(false);
  };

  // Handle scraper card click
  const handleScraperClick = (scraper: typeof SCRAPERS[0]) => {
    setSelectedScraper(scraper);
  };

  // Handle test now button
  const handleTestNow = async () => {
    if (!selectedScraper) return;
    const result = await testScraper(selectedScraper, testQuery);
    setShowResultModal(true);
  };

  // Get statistics
  const stats = {
    total: SCRAPERS.length,
    tested: testResults.filter((r) => r.status === 'success').length,
    failed: testResults.filter((r) => r.status === 'error').length,
    notTested: SCRAPERS.length - testResults.length,
    public: SCRAPERS.filter((s) => s.auth === 'public').length,
    oauth: SCRAPERS.filter((s) => s.auth === 'oauth').length,
    credentials: SCRAPERS.filter((s) => s.auth === 'credentials').length,
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scraper Test Dashboard</h1>
          <p className="text-muted-foreground">
            Teste e monitore todos os {SCRAPERS.length} scrapers da plataforma
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cookie Status Banner */}
      <CookieStatusBanner />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scrapers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.public} públicos, {stats.oauth} OAuth, {stats.credentials} credenciais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Testados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.tested}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.tested / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Não Testados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-500">{stats.notTested}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.notTested / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Testes em Massa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => bulkTestScrapers(SCRAPERS.filter((s) => s.auth === 'public'))}
              disabled={isBulkTesting}
              variant="default"
            >
              {isBulkTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Todos Públicos ({stats.public})
            </Button>
            <Button
              onClick={() => bulkTestScrapers(SCRAPERS.filter((s) => s.auth === 'oauth'))}
              disabled={isBulkTesting}
              variant="default"
            >
              {isBulkTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Todos OAuth ({stats.oauth})
            </Button>
            <Button
              onClick={() => bulkTestScrapers(SCRAPERS)}
              disabled={isBulkTesting}
              variant="default"
            >
              {isBulkTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Todos Scrapers ({stats.total})
            </Button>
          </div>
          {isBulkTesting && (
            <div className="space-y-2">
              <Progress value={bulkTestProgress} />
              <p className="text-sm text-muted-foreground">
                Progresso: {Math.round(bulkTestProgress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scraper List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar scraper..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedAuthType} onValueChange={setSelectedAuthType}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo de Auth" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Scraper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScrapers.map((scraper) => (
              <ScraperCard
                key={scraper.id}
                scraper={scraper}
                status={getScraperStatus(scraper.id)}
                onClick={() => handleScraperClick(scraper)}
                isSelected={selectedScraper?.id === scraper.id}
              />
            ))}
          </div>
          {filteredScrapers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum scraper encontrado com os filtros aplicados
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Test Panel & Recent Tests */}
        <div className="space-y-4">
          {/* Individual Test Panel */}
          {selectedScraper && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Testar {selectedScraper.name}</span>
                  <Badge variant={selectedScraper.auth === 'public' ? 'default' : 'secondary'}>
                    {selectedScraper.auth}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Query (Ticker/Termo de busca)
                  </label>
                  <Input
                    placeholder="Ex: PETR4, BTC, etc"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleTestNow}
                  className="w-full"
                  disabled={!testQuery || currentTestResult?.status === 'running'}
                >
                  {currentTestResult?.status === 'running' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Testar Agora
                    </>
                  )}
                </Button>
                {currentTestResult && currentTestResult.scraperId === selectedScraper.id && (
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Status:</span>
                      {currentTestResult.status === 'success' && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sucesso
                        </Badge>
                      )}
                      {currentTestResult.status === 'error' && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Erro
                        </Badge>
                      )}
                      {currentTestResult.status === 'running' && (
                        <Badge variant="secondary">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Executando
                        </Badge>
                      )}
                    </div>
                    {currentTestResult.executionTime && (
                      <p className="text-sm text-muted-foreground">
                        Tempo: {currentTestResult.executionTime}ms
                      </p>
                    )}
                    {currentTestResult.error && (
                      <p className="text-sm text-red-600 mt-2">{currentTestResult.error}</p>
                    )}
                    {currentTestResult.data && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setShowResultModal(true)}
                      >
                        Ver Dados JSON
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Tests Log */}
          <Card>
            <CardHeader>
              <CardTitle>Testes Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentTests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum teste executado ainda
                  </p>
                ) : (
                  recentTests.map((test, idx) => (
                    <div
                      key={`${test.scraperId}-${idx}`}
                      className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setCurrentTestResult(test);
                        setShowResultModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{test.scraperName}</span>
                        {test.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {test.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        {test.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Query: {test.query}</span>
                        <span>{test.executionTime ? `${test.executionTime}ms` : '...'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {test.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Result Modal */}
      {showResultModal && currentTestResult && (
        <TestResultModal
          result={currentTestResult}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}
