/**
 * Página de Portfólio Completa
 * Gerenciamento completo de portfólio de investimentos
 */
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { portfolioAPI } from '../services/api';

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'performance' | 'allocation' | 'dividends'>('summary');

  // Mock portfolio ID - em produção viria de um estado global ou contexto
  const mockPortfolioId = 'portfolio_1';

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Carregar dados principais
      const [portfolioRes, summaryRes, allocationRes] = await Promise.all([
        portfolioAPI.getPortfolio(mockPortfolioId),
        portfolioAPI.getSummary(mockPortfolioId),
        portfolioAPI.getAllocation(mockPortfolioId),
      ]);

      setSelectedPortfolio(portfolioRes.portfolio);
      setSummary(summaryRes.summary);
      setAllocation(allocationRes.allocation);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar portfólio');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async (period: string) => {
    try {
      const res = await portfolioAPI.getPerformance(mockPortfolioId, period);
      setPerformance(res.performance);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar performance');
    }
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Portfólio</h1>
          <p className="text-gray-600">Gerencie e analise seu portfólio de investimentos</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {summary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Total Investido</div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {summary.total_invested?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Valor Atual</div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {summary.current_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Lucro/Prejuízo</div>
                <div className={`text-2xl font-bold ${getChangeColor(summary.total_profit_loss || 0)}`}>
                  R$ {summary.total_profit_loss?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">Rentabilidade</div>
                <div className={`text-2xl font-bold ${getChangeColor(summary.total_profit_loss_percent || 0)}`}>
                  {summary.total_profit_loss_percent?.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {[
                    { id: 'summary', label: 'Resumo' },
                    { id: 'performance', label: 'Performance' },
                    { id: 'allocation', label: 'Alocação' },
                    { id: 'dividends', label: 'Dividendos' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        if (tab.id === 'performance' && !performance) {
                          loadPerformance('1M');
                        }
                      }}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'summary' && selectedPortfolio && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Posições</h3>
                    <div className="space-y-3">
                      {selectedPortfolio.positions?.map((position: any) => (
                        <div
                          key={position.ticker}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{position.ticker}</div>
                            <div className="text-sm text-gray-600">
                              {position.quantity} ações @ R$ {position.average_price?.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              R$ {position.current_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-sm ${getChangeColor(position.profit_loss_percent || 0)}`}>
                              {position.profit_loss_percent > 0 ? '+' : ''}
                              {position.profit_loss_percent?.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Performance Histórica</h3>
                      <select
                        onChange={(e) => loadPerformance(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="1M">1 Mês</option>
                        <option value="3M">3 Meses</option>
                        <option value="6M">6 Meses</option>
                        <option value="1Y">1 Ano</option>
                        <option value="YTD">Ano Atual</option>
                      </select>
                    </div>

                    {performance && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Retorno Total</div>
                          <div className={`text-xl font-bold ${getChangeColor(performance.metrics?.total_return || 0)}`}>
                            {performance.metrics?.total_return?.toFixed(2)}%
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">vs IBOVESPA</div>
                          <div className={`text-xl font-bold ${getChangeColor(performance.benchmark_comparison?.outperformance_ibov || 0)}`}>
                            {performance.benchmark_comparison?.outperformance_ibov > 0 ? '+' : ''}
                            {performance.benchmark_comparison?.outperformance_ibov?.toFixed(2)}%
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">vs CDI</div>
                          <div className={`text-xl font-bold ${getChangeColor(performance.benchmark_comparison?.outperformance_cdi || 0)}`}>
                            {performance.benchmark_comparison?.outperformance_cdi > 0 ? '+' : ''}
                            {performance.benchmark_comparison?.outperformance_cdi?.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'allocation' && allocation && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Alocação do Portfólio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Por Tipo de Ativo</h4>
                        {allocation.by_asset_type && Object.entries(allocation.by_asset_type).map(([type, data]: [string, any]) => (
                          <div key={type} className="flex items-center justify-between mb-2 p-3 bg-gray-50 rounded">
                            <span className="capitalize">{type}</span>
                            <span className="font-semibold">{data.percentage?.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Por Setor</h4>
                        {allocation.by_sector && Object.entries(allocation.by_sector).map(([sector, data]: [string, any]) => (
                          <div key={sector} className="flex items-center justify-between mb-2 p-3 bg-gray-50 rounded">
                            <span>{sector}</span>
                            <span className="font-semibold">{data.percentage?.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {allocation.recommendations && allocation.recommendations.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-3">Recomendações</h4>
                        <ul className="space-y-2">
                          {allocation.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              <span className="text-sm text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'dividends' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dividendos</h3>
                    <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!summary && loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando portfólio...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
