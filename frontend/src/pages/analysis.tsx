/**
 * Página de Análise de Ativos
 * Permite analisar um ativo com score, recomendação e dados detalhados
 */
import { useState } from 'react';
import Layout from '../components/Layout';
import { analysisAPI, reportsAPI, Analysis, Report } from '../services/api';

export default function AnalysisPage() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fundamental' | 'technical' | 'risk' | 'report'>('overview');

  const handleAnalyze = async () => {
    if (!ticker.trim()) {
      setError('Digite um ticker válido');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setReport(null);

    try {
      const response = await analysisAPI.analyzeAsset(ticker.toUpperCase(), true);
      setAnalysis(response.analysis);
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar ativo');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await reportsAPI.generateReport(ticker.toUpperCase(), 'openai', false);
      setReport(response.report);
      setActiveTab('report');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('strong_buy') || rec === 'strong buy') return 'text-green-600 bg-green-50';
    if (rec.includes('buy') || rec === 'comprar') return 'text-green-500 bg-green-50';
    if (rec.includes('hold') || rec === 'manter') return 'text-yellow-600 bg-yellow-50';
    if (rec.includes('sell') || rec === 'vender') return 'text-red-500 bg-red-50';
    if (rec.includes('strong_sell') || rec === 'strong sell') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6.5) return 'text-green-500';
    if (score >= 4.5) return 'text-yellow-600';
    if (score >= 3) return 'text-red-500';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Análise de Ativos</h1>
          <p className="text-gray-600">Análise completa com scoring, recomendação e insights com IA</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Digite o ticker (ex: PETR4, VALE3)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{analysis.ticker}</h2>
                  <p className="text-gray-600">Análise Completa</p>
                </div>
                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Gerando...' : 'Gerar Relatório com IA'}
                </button>
              </div>

              {/* Score e Recomendação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Score Geral</div>
                  <div className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                    {analysis.overall_score.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">de 10.0</div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Recomendação</div>
                  <div className={`text-2xl font-bold px-4 py-2 rounded-lg inline-block ${getRecommendationColor(analysis.recommendation)}`}>
                    {analysis.recommendation.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {[
                    { id: 'overview', label: 'Visão Geral' },
                    { id: 'fundamental', label: 'Fundamentalista' },
                    { id: 'technical', label: 'Técnica' },
                    { id: 'risk', label: 'Risco' },
                    { id: 'report', label: 'Relatório IA', disabled: !report },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                      disabled={tab.disabled}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : tab.disabled
                          ? 'border-transparent text-gray-300 cursor-not-allowed'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Fundamentalista', value: analysis.fundamental_analysis?.overall_score || 0 },
                      { label: 'Técnica', value: analysis.technical_analysis?.overall_score || 0 },
                      { label: 'Valuation', value: analysis.valuation_analysis?.score || 0 },
                      { label: 'Risco', value: analysis.risk_analysis?.overall_score || 0 },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                        <div className={`text-3xl font-bold ${getScoreColor(item.value)}`}>
                          {item.value.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'fundamental' && analysis.fundamental_analysis && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Análise Fundamentalista</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(analysis.fundamental_analysis, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'technical' && analysis.technical_analysis && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Análise Técnica</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(analysis.technical_analysis, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'risk' && analysis.risk_analysis && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Análise de Risco</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(analysis.risk_analysis, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'report' && report && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Relatório com IA</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      {report.qualitative_analysis && (
                        <div className="prose max-w-none">
                          <p className="whitespace-pre-wrap">{report.qualitative_analysis}</p>
                        </div>
                      )}
                      {!report.qualitative_analysis && (
                        <pre className="overflow-auto text-sm">
                          {JSON.stringify(report, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise realizada</h3>
            <p className="text-gray-500">Digite um ticker acima para começar a análise</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
