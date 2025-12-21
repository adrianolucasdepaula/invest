/**
 * MarketIndices Component - Painel de Índices Financeiros com Seletor Dinâmico
 *
 * Exibe principais índices financeiros (B3, internacional, câmbio, futuros, commodities, macro)
 * com gráfico TradingView interativo que atualiza ao clicar em um índice.
 *
 * @module components/dashboard/market-indices
 * @version 1.0.0
 * @created 2025-11-21
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AdvancedChart } from '@/components/tradingview/widgets/AdvancedChart';
import { ChartErrorBoundary } from '@/components/error-boundary';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Globe,
  Zap,
  BarChart3,
  Activity,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface MarketIndex {
  symbol: string; // TradingView symbol (ex: "BMFBOVESPA:IBOV")
  name: string; // Nome do índice
  category: IndexCategory;
  color?: string; // Cor do card (opcional)
}

type IndexCategory = 'B3' | 'Internacional' | 'Câmbio' | 'Futuros' | 'Commodities' | 'Macro';

// ============================================================================
// CONSTANTS - Símbolos TradingView Disponíveis
// ============================================================================

const MARKET_INDICES: MarketIndex[] = [
  // 🇧🇷 B3 - Índices Brasileiros
  { symbol: 'BMFBOVESPA:IBOV', name: 'Ibovespa', category: 'B3' },
  { symbol: 'BMFBOVESPA:IFIX', name: 'IFIX', category: 'B3' },
  { symbol: 'BMFBOVESPA:IDIV', name: 'IDIV', category: 'B3' },
  { symbol: 'BMFBOVESPA:SMLL', name: 'Small Cap', category: 'B3' },
  { symbol: 'BMFBOVESPA:UTIL', name: 'Utilidade Pública', category: 'B3' },
  { symbol: 'BMFBOVESPA:IFNC', name: 'Financeiro', category: 'B3' },

  // 🌎 Internacional - Índices Globais
  { symbol: 'SP:SPX', name: 'S&P 500', category: 'Internacional' },
  { symbol: 'DJ:DJI', name: 'Dow Jones', category: 'Internacional' },
  { symbol: 'NASDAQ:NDX', name: 'NASDAQ 100', category: 'Internacional' },
  { symbol: 'FOREXCOM:DXY', name: 'DXY (Índice Dólar)', category: 'Internacional' },
  { symbol: 'CBOE:VIX', name: 'VIX (Volatilidade)', category: 'Internacional' },

  // 💵 Câmbio - Moedas vs Real
  { symbol: 'FX:USDBRL', name: 'Dólar Real (USD/BRL)', category: 'Câmbio' },
  { symbol: 'FX:EURBRL', name: 'Euro Real (EUR/BRL)', category: 'Câmbio' },
  { symbol: 'FX:GBPBRL', name: 'Libra Real (GBP/BRL)', category: 'Câmbio' },

  // 📈 Futuros - Contratos B3
  { symbol: 'BMFBOVESPA:WINM2025', name: 'Mini Índice Futuro', category: 'Futuros' },
  { symbol: 'BMFBOVESPA:DOLU25', name: 'Dólar Futuro', category: 'Futuros' },
  { symbol: 'BMFBOVESPA:DI1!', name: 'DI Futuro', category: 'Futuros' },

  // 🛢️ Commodities
  { symbol: 'TVC:GOLD', name: 'Ouro', category: 'Commodities' },
  { symbol: 'TVC:USOIL', name: 'Petróleo WTI', category: 'Commodities' },
  { symbol: 'TVC:SILVER', name: 'Prata', category: 'Commodities' },

  // 📊 Macro - Indicadores Macroeconômicos (placeholder - backend futuro)
  // Nota: Estes não existem no TradingView, serão implementados via backend na FASE 2
  // { symbol: 'MACRO:SELIC', name: 'SELIC', category: 'Macro' },
  // { symbol: 'MACRO:IPCA', name: 'IPCA', category: 'Macro' },
  // { symbol: 'MACRO:CDI', name: 'CDI', category: 'Macro' },
];

const CATEGORIES: { id: IndexCategory; label: string; icon: any }[] = [
  { id: 'B3', label: 'B3', icon: Activity },
  { id: 'Internacional', label: 'Internacional', icon: Globe },
  { id: 'Câmbio', label: 'Câmbio', icon: DollarSign },
  { id: 'Futuros', label: 'Futuros', icon: Zap },
  { id: 'Commodities', label: 'Commodities', icon: BarChart3 },
  // { id: 'Macro', label: 'Macro', icon: TrendingUp }, // FASE 2
];

// ============================================================================
// COMPONENT
// ============================================================================

export function MarketIndices() {
  const [selectedCategory, setSelectedCategory] = useState<IndexCategory>('B3');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(MARKET_INDICES[0].symbol);

  // Filtrar índices da categoria selecionada
  const filteredIndices = MARKET_INDICES.filter(
    (index) => index.category === selectedCategory
  );

  // Encontrar índice selecionado (para exibir nome no gráfico)
  const currentIndex = MARKET_INDICES.find((idx) => idx.symbol === selectedSymbol);

  return (
    <Card className="p-6">
      {/* Header com seletor de categorias */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Índices de Mercado</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe os principais indicadores financeiros
            </p>
          </div>
        </div>

        {/* Tabs de Categorias */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  // Auto-selecionar primeiro índice da nova categoria
                  const firstIndex = MARKET_INDICES.find((idx) => idx.category === cat.id);
                  if (firstIndex) setSelectedSymbol(firstIndex.symbol);
                }}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grid de Índices */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {filteredIndices.map((index) => (
            <button
              key={index.symbol}
              onClick={() => setSelectedSymbol(index.symbol)}
              className={`p-3 rounded-lg border transition-all ${
                selectedSymbol === index.symbol
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border hover:border-primary/50 bg-card'
              }`}
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {index.category}
              </p>
              <p className="text-sm font-semibold truncate" title={index.name}>
                {index.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico TradingView */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
        <div className="mb-3">
          <h4 className="text-md font-medium">
            {currentIndex?.name || 'Gráfico'} - Últimos 30 dias
          </h4>
          <p className="text-sm text-muted-foreground">
            Gráfico interativo TradingView
          </p>
        </div>

        <ChartErrorBoundary chartType="TradingView Market Indices">
          <AdvancedChart
            symbol={selectedSymbol}
            interval="D" // Daily
            range="1M" // 1 mês
            height={400}
            allowSymbolChange={false} // Usuário troca via botões acima
            hideTopToolbar={false} // Mostrar toolbar (fullscreen, save, etc)
            saveImage={true}
          />
        </ChartErrorBoundary>
      </div>
    </Card>
  );
}
