import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/providers'
import { WidgetErrorBoundary } from '@/components/tradingview/ErrorBoundary'
import { TickerTape } from '@/components/tradingview/widgets/TickerTape'
import { SkipLink } from '@/components/layout/skip-link'

export const metadata: Metadata = {
  title: 'B3 AI Analysis Platform',
  description: 'Plataforma completa de análise de investimentos B3 com Inteligência Artificial',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {/* TradingView Script - Global (beforeInteractive para máxima performance) */}
        <Script
          src="https://s3.tradingview.com/tv.js"
          strategy="beforeInteractive"
        />

        <Providers>
          {/* Skip Link for Keyboard Accessibility (WCAG 2.4.1) */}
          <SkipLink targetId="main-content" />

          {/* TickerTape - Complementary Region (market data ticker) */}
          <aside
            role="complementary"
            aria-label="Cotações em tempo real"
            className="sticky top-0 z-50"
          >
            <WidgetErrorBoundary widgetName="TickerTape">
              <TickerTape />
            </WidgetErrorBoundary>
          </aside>

          {children}
        </Providers>
      </body>
    </html>
  )
}
