/**
 * Página de Relatórios
 * Gera relatórios completos com IA
 */
import { useState } from 'react';
import Layout from '../components/Layout';
import { reportsAPI } from '../services/api';

export default function ReportsPage() {
  const [ticker, setTicker] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!ticker.trim()) {
      setError('Digite um ticker válido');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await reportsAPI.generateReport(ticker.toUpperCase(), aiProvider, true);
      setReport(response.report);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportMarkdown = async () => {
    if (!ticker.trim()) return;

    try {
      const response = await reportsAPI.exportMarkdown(ticker.toUpperCase(), aiProvider) as any;
      const blob = new Blob([response.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${ticker.toLowerCase()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erro ao exportar');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios com IA</h1>
          <p className="text-gray-600">Gere relatórios completos com análise qualitativa de IA</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Ticker (ex: PETR4)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google (Gemini)</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {report && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Relatório: {ticker}</h2>
              <button
                onClick={exportMarkdown}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Exportar Markdown
              </button>
            </div>

            <div className="prose max-w-none">
              {report.overview && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Visão Geral</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(report.overview, null, 2)}
                  </pre>
                </div>
              )}

              {report.qualitative_analysis && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Análise Qualitativa (IA)</h3>
                  <div className="bg-blue-50 p-6 rounded-lg whitespace-pre-wrap">
                    {report.qualitative_analysis}
                  </div>
                </div>
              )}

              {report.final_recommendation && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Recomendação Final</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(report.final_recommendation, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {report.disclaimers && report.disclaimers.length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <h4 className="text-sm font-semibold mb-2 text-gray-700">Disclaimers</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {report.disclaimers.map((disclaimer: string, index: number) => (
                      <li key={index}>{disclaimer}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum relatório gerado</h3>
            <p className="text-gray-500">Digite um ticker e selecione um provedor de IA acima</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
