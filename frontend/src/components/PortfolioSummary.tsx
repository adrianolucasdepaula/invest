import { Briefcase, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function PortfolioSummary() {
  // Mock data - será substituído por dados reais da API
  const portfolioData = {
    totalInvested: 150000,
    currentValue: 172500,
    profitLoss: 22500,
    profitLossPercentage: 15.0,
  }

  const allocationData = [
    { name: 'Ações', value: 45, color: '#3b82f6' },
    { name: 'FIIs', value: 25, color: '#10b981' },
    { name: 'Renda Fixa', value: 20, color: '#f59e0b' },
    { name: 'Cripto', value: 10, color: '#8b5cf6' },
  ]

  const topPositions = [
    { ticker: 'PETR4', name: 'Petrobras', allocation: 8.5, profitLoss: 12.3 },
    { ticker: 'VALE3', name: 'Vale', allocation: 7.2, profitLoss: -2.1 },
    { ticker: 'ITUB4', name: 'Itaú', allocation: 6.8, profitLoss: 8.9 },
    { ticker: 'BBDC4', name: 'Bradesco', allocation: 5.5, profitLoss: 5.4 },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-primary" />
        Resumo do Portfólio
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Valor Investido"
          value={portfolioData.totalInvested}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard
          title="Valor Atual"
          value={portfolioData.currentValue}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          title="Lucro/Prejuízo"
          value={portfolioData.profitLoss}
          icon={portfolioData.profitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          color={portfolioData.profitLoss >= 0 ? 'green' : 'red'}
          percentage={portfolioData.profitLossPercentage}
        />
        <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Rentabilidade</div>
          <div className="text-3xl font-bold">
            {portfolioData.profitLossPercentage.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Allocation Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Alocação por Classe
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Positions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Maiores Posições
          </h3>

          <div className="space-y-3">
            {topPositions.map((position) => (
              <div
                key={position.ticker}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {position.ticker}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {position.name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {position.allocation}%
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      position.profitLoss >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {position.profitLoss >= 0 ? '+' : ''}
                    {position.profitLoss}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  color,
  percentage,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red'
  percentage?: number
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>

      <div className="text-2xl font-bold text-slate-900 dark:text-white">
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </div>

      {percentage !== undefined && (
        <div
          className={`text-sm font-medium mt-2 ${
            percentage >= 0 ? 'text-success' : 'text-danger'
          }`}
        >
          {percentage >= 0 ? '+' : ''}
          {percentage.toFixed(2)}%
        </div>
      )}
    </div>
  )
}
