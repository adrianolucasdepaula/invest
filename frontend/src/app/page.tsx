export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          B3 AI Analysis Platform
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Plataforma completa de análise de investimentos B3 com Inteligência Artificial
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Análise Fundamentalista</h2>
            <p className="text-sm text-muted-foreground">
              Indicadores de valuation, endividamento, eficiência e rentabilidade
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Análise Técnica</h2>
            <p className="text-sm text-muted-foreground">
              Indicadores técnicos, padrões gráficos e análise de tendências
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Análise com IA</h2>
            <p className="text-sm text-muted-foreground">
              Relatórios completos gerados com inteligência artificial
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
