import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, TrendingUp, Sparkles, Shield, Zap, Database } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center p-8 md:p-24 min-h-[80vh]">
        <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
          <div className="mb-8 inline-block">
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              Análise B3 com IA
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            B3 AI Analysis Platform
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Plataforma completa de análise de investimentos B3 com Inteligência Artificial.
            Tome decisões informadas com análise fundamentalista, técnica e insights de IA.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/dashboard">
                Acessar Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/login">
                Fazer Login
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="border rounded-lg p-6 hover:border-primary/50 transition-colors bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Análise Fundamentalista</h2>
              <p className="text-sm text-muted-foreground">
                Indicadores de valuation, endividamento, eficiência e rentabilidade em tempo real
              </p>
            </div>

            <div className="border rounded-lg p-6 hover:border-primary/50 transition-colors bg-card">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Análise Técnica</h2>
              <p className="text-sm text-muted-foreground">
                Indicadores técnicos, padrões gráficos e análise de tendências automática
              </p>
            </div>

            <div className="border rounded-lg p-6 hover:border-primary/50 transition-colors bg-card">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Análise com IA</h2>
              <p className="text-sm text-muted-foreground">
                Relatórios completos gerados por GPT-4 com insights e recomendações
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Recursos da Plataforma</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dados em Tempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Coleta automática de dados de múltiplas fontes B3
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestão de Portfólio</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe seus investimentos e performance
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Alertas Inteligentes</h3>
              <p className="text-sm text-muted-foreground">
                Notificações em tempo real sobre oportunidades
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-16 text-center">
            <h3 className="text-xl font-semibold mb-6">Navegação Rápida</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/assets">Ativos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/portfolio">Portfólio</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/reports">Relatórios</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/analysis">Análise</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings">Configurações</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t">
        <div className="max-w-6xl mx-auto px-8 text-center text-sm text-muted-foreground">
          <p>B3 AI Analysis Platform - Análise Inteligente de Investimentos</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/api/docs" target="_blank" className="hover:text-primary transition-colors">API Docs</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
