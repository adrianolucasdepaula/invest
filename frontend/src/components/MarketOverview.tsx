import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'

export default function MarketOverview() {
  // Mock data - será substituído por dados reais da API
  const indices = [
    { name: 'IBOVESPA', ticker: '^BVSP', value: 125234.56, change: 1234.56, changePercent: 0.99, trend: 'up' },
    { name: 'IFIX', ticker: 'IFIX', value: 3145.23, change: -12.45, changePercent: -0.39, trend: 'down' },
    { name: 'SMLL', ticker: 'SMLL', value: 2847.91, change: 34.21, changePercent: 1.22, trend: 'up' },
    { name: 'S&P 500', ticker: '^GSPC', value: 4567.89, change: 45.67, changePercent: 1.01, trend: 'up' },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Visão Geral do Mercado
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {indices.map((index) => (
          <div
            key={index.ticker}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {index.name}
              </span>
              {index.trend === 'up' ? (
                <ArrowUp className="w-4 h-4 text-success" />
              ) : (
                <ArrowDown className="w-4 h-4 text-danger" />
              )}
            </div>

            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {index.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  index.trend === 'up' ? 'text-success' : 'text-danger'
                }`}
              >
                {index.change > 0 ? '+' : ''}
                {index.change.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-sm ${
                  index.trend === 'up' ? 'text-success' : 'text-danger'
                }`}
              >
                ({index.changePercent > 0 ? '+' : ''}
                {index.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </span>
          <button className="text-primary hover:text-primary/80 font-medium transition-colors">
            Ver mais índices
          </button>
        </div>
      </div>
    </div>
  )
}
