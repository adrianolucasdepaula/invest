import { useState } from 'react'
import Head from 'next/head'
import { Search, TrendingUp, BarChart3, PieChart, Newspaper, Brain } from 'lucide-react'
import Layout from '@/components/Layout'
import AssetSearch from '@/components/AssetSearch'
import MarketOverview from '@/components/MarketOverview'
import PortfolioSummary from '@/components/PortfolioSummary'

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState<string>('')

  return (
    <>
      <Head>
        <title>B3 Investment Analysis Platform</title>
        <meta name="description" content="Plataforma completa de análise de investimentos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,1),rgba(0,0,0,0.6))]" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">Análise com IA</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white">
                  Análise Completa de
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {' '}Investimentos B3
                  </span>
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300">
                  Coleta de dados em tempo real de múltiplas fontes, análise fundamentalista,
                  técnica, macroeconômica e geração de relatórios inteligentes.
                </p>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto">
                  <AssetSearch onSelect={setSelectedTicker} />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8">
                  <StatCard
                    icon={<BarChart3 className="w-6 h-6" />}
                    label="Fontes de Dados"
                    value="20+"
                  />
                  <StatCard
                    icon={<TrendingUp className="w-6 h-6" />}
                    label="Ativos"
                    value="1000+"
                  />
                  <StatCard
                    icon={<PieChart className="w-6 h-6" />}
                    label="Indicadores"
                    value="50+"
                  />
                  <StatCard
                    icon={<Newspaper className="w-6 h-6" />}
                    label="Notícias/dia"
                    value="500+"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Análise Fundamentalista"
                description="Indicadores de valuation, rentabilidade, endividamento e crescimento de múltiplas fontes validadas."
                icon={<BarChart3 className="w-8 h-8" />}
                color="blue"
              />
              <FeatureCard
                title="Análise Técnica"
                description="Indicadores técnicos, padrões gráficos, volume e análise de tendências em tempo real."
                icon={<TrendingUp className="w-8 h-8" />}
                color="green"
              />
              <FeatureCard
                title="Análise de Opções"
                description="Volatilidade implícita, Greeks, análise de vencimentos e impactos no ativo."
                icon={<PieChart className="w-8 h-8" />}
                color="purple"
              />
            </div>
          </section>

          {/* Market Overview */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <MarketOverview />
          </section>

          {/* Portfolio Summary */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PortfolioSummary />
          </section>
        </div>
      </Layout>
    </>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon,
  color
}: {
  title: string
  description: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-2xl transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />

      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white mb-4`}>
        {icon}
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}
