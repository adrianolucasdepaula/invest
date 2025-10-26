/**
 * Página de Comparação de Ativos
 * Permite comparar múltiplos ativos lado a lado
 */
import { useState } from 'react';
import Layout from '../components/Layout';
import { analysisAPI } from '../services/api';

interface ComparisonResult {
  comparison: any;
  assets: any[];
  rankings: any;
}

export default function ComparePage() {
  const [tickers, setTickers] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addTicker = () => {
    if (tickers.length < 10) {
      setTickers([...tickers, '']);
    }
  };

  const removeTicker = (index: number) => {
    if (tickers.length > 1) {
      setTickers(tickers.filter((_, i) => i !== index));
    }
  };

  const updateTicker = (index: number, value: string) => {
    const newTickers = [...tickers];
    newTickers[index] = value.toUpperCase();
    setTickers(newTickers);
  };

  const handleCompare = async () => {
    const validTickers = tickers.filter((t) => t.trim().length > 0);

    if (validTickers.length < 2) {
      setError('Adicione pelo menos 2 ativos para comparar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analysisAPI.compareAssets(validTickers, true);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Erro ao comparar ativos');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-600';
    if (score >= 6.5) return 'bg-green-500';
    if (score >= 4.5) return 'bg-yellow-500';
    if (score >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('strong_buy') || rec === 'strong buy') {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">COMPRA FORTE</span>;
    }
    if (rec.includes('buy')) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-50 text-green-700">COMPRA</span>;
    }
    if (rec.includes('hold')) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">MANTER</span>;
    }
    if (rec.includes('sell') && !rec.includes('strong')) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-50 text-red-700">VENDA</span>;
    }
    if (rec.includes('strong_sell')) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">VENDA FORTE</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">{recommendation}</span>;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparação de Ativos</h1>
          <p className="text-gray-600">Compare múltiplos ativos lado a lado</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ativos para Comparar</h2>

          <div className="space-y-3 mb-4">
            {tickers.map((ticker, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Ticker ${index + 1} (ex: PETR4)`}
                  value={ticker}
                  onChange={(e) => updateTicker(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {tickers.length > 1 && (
                  <button
                    onClick={() => removeTicker(index)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addTicker}
              disabled={tickers.length >= 10}
              className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Adicionar Ativo
            </button>
            <button
              onClick={handleCompare}
              disabled={loading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Comparando...' : 'Comparar'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && result.assets && (
          <div className="space-y-6">
            {/* Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Tabela Comparativa</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Métrica
                      </th>
                      {result.assets.map((asset: any) => (
                        <th
                          key={asset.ticker}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {asset.ticker}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Overall Score */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Score Geral
                      </td>
                      {result.assets.map((asset: any) => (
                        <td key={asset.ticker} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900">
                              {asset.analysis?.overall_score?.toFixed(1) || 'N/A'}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">/10</span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Recommendation */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Recomendação
                      </td>
                      {result.assets.map((asset: any) => (
                        <td key={asset.ticker} className="px-6 py-4 whitespace-nowrap text-center">
                          {getRecommendationBadge(asset.analysis?.recommendation || 'N/A')}
                        </td>
                      ))}
                    </tr>

                    {/* Scores por Categoria */}
                    {['fundamental', 'technical', 'valuation', 'risk'].map((category, idx) => (
                      <tr key={category} className={idx % 2 === 0 ? '' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {category === 'fundamental' && 'Fundamentalista'}
                          {category === 'technical' && 'Técnica'}
                          {category === 'valuation' && 'Valuation'}
                          {category === 'risk' && 'Risco'}
                        </td>
                        {result.assets.map((asset: any) => {
                          const score =
                            category === 'valuation'
                              ? asset.analysis?.valuation_analysis?.score
                              : asset.analysis?.[`${category}_analysis`]?.overall_score;
                          return (
                            <td key={asset.ticker} className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getScoreColor(score || 0)}`}
                                    style={{ width: `${((score || 0) / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-700">
                                  {score?.toFixed(1) || 'N/A'}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rankings */}
            {result.rankings && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.rankings).map(([category, ranking]: [string, any]) => (
                  <div key={category} className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 capitalize">
                      Ranking - {category === 'overall' ? 'Geral' : category}
                    </h3>
                    <div className="space-y-2">
                      {ranking.slice(0, 5).map((item: any, index: number) => (
                        <div
                          key={item.ticker}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-gray-400 w-8">#{index + 1}</span>
                            <span className="font-semibold text-gray-900">{item.ticker}</span>
                          </div>
                          <span className="text-lg font-bold text-gray-900">{item.score?.toFixed(1) || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma comparação realizada</h3>
            <p className="text-gray-500">Adicione pelo menos 2 ativos acima para comparar</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
