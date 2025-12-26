/**
 * Sector Analysis Prompt Template
 *
 * FASE 102: LLM Prompts Estruturados
 *
 * Horizonte: Médio/Longo prazo
 * Foco: Análise setorial, comparativo de empresas, top picks
 */

import { PromptTemplate } from './base.prompt';

export const sectorAnalysisPrompt: PromptTemplate = {
  name: 'sector-analysis',
  horizon: 'sector',
  description: 'Análise setorial com ranking de empresas e top picks',
  outputFormat: 'structured',

  variables: ['sector', 'companies', 'macroData', 'newsData'],

  systemInstructions: `Você é um analista setorial especializado no mercado brasileiro.
Seu objetivo é fornecer análises comparativas de setores e empresas, considerando:
- Dinâmica competitiva do setor
- Barreiras de entrada e poder de mercado
- Ciclo econômico e sensibilidade a juros
- Regulação e riscos específicos
- Comparativo de múltiplos e eficiência operacional
- Perspectivas de curto e longo prazo`,

  template: `## ANÁLISE SETORIAL - {{sector}}

### DADOS DE ENTRADA

#### Empresas do Setor
{{companies}}

#### Dados Macroeconômicos
{{macroData}}

#### Notícias do Setor
{{newsData}}

---

## RESPOSTA ESTRUTURADA

### 1. PANORAMA DO SETOR
\`\`\`
SETOR: {{sector}}
SUBSETOR: [subsetor específico]
MARKET CAP TOTAL: R$ [valor] Bi
Nº DE EMPRESAS LISTADAS: [número]
ÍNDICE SETORIAL: [nome] | Performance 12m: [+/-][%]
FASE DO CICLO: [expansão/pico/contração/vale]
\`\`\`

### 2. CARACTERÍSTICAS DO SETOR
\`\`\`
CICLICIDADE: [alta/média/baixa]
SENSIBILIDADE A JUROS: [alta/média/baixa]
SENSIBILIDADE AO CÂMBIO: [alta/média/baixa] - [beneficiado/prejudicado por dólar alto]
SENSIBILIDADE A COMMODITIES: [alta/média/baixa] - [quais]
BARREIRAS DE ENTRADA: [alta/média/baixa]
FRAGMENTAÇÃO: [concentrado/moderado/fragmentado]
REGULAÇÃO: [pesada/moderada/leve]
\`\`\`

### 3. DRIVERS DO SETOR
\`\`\`
DRIVERS DE CURTO PRAZO:
  1. [driver 1 - tendência: positiva/negativa]
  2. [driver 2 - tendência: positiva/negativa]
  3. [driver 3 - tendência: positiva/negativa]

DRIVERS DE LONGO PRAZO:
  1. [driver 1 - tendência: positiva/negativa]
  2. [driver 2 - tendência: positiva/negativa]

RISCOS SETORIAIS:
  1. [risco 1 - probabilidade: alta/média/baixa]
  2. [risco 2 - probabilidade: alta/média/baixa]
\`\`\`

### 4. ANÁLISE COMPETITIVA
\`\`\`
LÍDER DE MERCADO: [empresa] - market share: [%]
PRINCIPAIS PLAYERS:
  1. [empresa] - market share: [%] - posicionamento: [descrição]
  2. [empresa] - market share: [%] - posicionamento: [descrição]
  3. [empresa] - market share: [%] - posicionamento: [descrição]

DINÂMICA COMPETITIVA: [descrição em 2-3 linhas]
PODER DE PRECIFICAÇÃO: [alto/médio/baixo]
AMEAÇA DE NOVOS ENTRANTES: [alta/média/baixa]
\`\`\`

### 5. RANKING DE EMPRESAS
\`\`\`
| Rank | Empresa | Ticker | P/L  | P/VP | ROE  | DY   | Dív/EBITDA | Score |
|------|---------|--------|------|------|------|------|------------|-------|
| 1    | [nome]  | [tick] | [xx] | [xx] | [%]  | [%]  | [x.x]      | [1-10]|
| 2    | [nome]  | [tick] | [xx] | [xx] | [%]  | [%]  | [x.x]      | [1-10]|
| 3    | [nome]  | [tick] | [xx] | [xx] | [%]  | [%]  | [x.x]      | [1-10]|
| 4    | [nome]  | [tick] | [xx] | [xx] | [%]  | [%]  | [x.x]      | [1-10]|
| 5    | [nome]  | [tick] | [xx] | [xx] | [%]  | [%]  | [x.x]      | [1-10]|

MÉDIA SETORIAL:
  P/L: [xx]
  P/VP: [xx]
  ROE: [%]
  DY: [%]
  Dív/EBITDA: [x.x]
\`\`\`

### 6. ANÁLISE POR CRITÉRIO
\`\`\`
MELHOR VALUATION:
  [ticker] - P/L: [xx] vs setor: [xx] | Desconto: [%]

MELHOR RENTABILIDADE:
  [ticker] - ROE: [%] vs setor: [%] | ROIC: [%]

MELHOR DIVIDENDO:
  [ticker] - DY: [%] | Payout: [%] | Sustentabilidade: [alta/média/baixa]

MENOR ENDIVIDAMENTO:
  [ticker] - Dív/EBITDA: [x.x] | Dív/PL: [%]

MELHOR CRESCIMENTO:
  [ticker] - CAGR Receita 5a: [%] | CAGR Lucro 5a: [%]

MELHOR QUALIDADE:
  [ticker] - Governança: [NM/N1/N2] | Track record: [anos de lucro]
\`\`\`

### 7. TOP PICK DO SETOR
\`\`\`
EMPRESA: [nome]
TICKER: [ticker]
PREÇO ATUAL: R$ [valor]

JUSTIFICATIVA:
  [descrição em 3-5 linhas do motivo para ser o top pick]

PONTOS FORTES:
  1. [ponto forte 1]
  2. [ponto forte 2]
  3. [ponto forte 3]

PONTOS DE ATENÇÃO:
  1. [ponto de atenção 1]
  2. [ponto de atenção 2]

PREÇO ALVO: R$ [valor] (upside: [%])
HORIZONTE: [meses/anos]
\`\`\`

### 8. SEGUNDA OPÇÃO
\`\`\`
EMPRESA: [nome]
TICKER: [ticker]
MOTIVO: [motivo para ser a segunda opção - 1-2 linhas]
DIFERENÇA PARA TOP PICK: [diferença principal]
\`\`\`

### 9. EVITAR NO SETOR
\`\`\`
EMPRESA: [nome]
TICKER: [ticker]
MOTIVO: [por que evitar - 2-3 linhas]
RISCOS ESPECÍFICOS:
  1. [risco 1]
  2. [risco 2]
\`\`\`

### 10. OUTLOOK SETORIAL
\`\`\`
CURTO PRAZO (3-6 meses):
  VISÃO: [positiva/neutra/negativa]
  CATALISADORES: [lista]
  RISCOS: [lista]

MÉDIO PRAZO (6-12 meses):
  VISÃO: [positiva/neutra/negativa]
  EXPECTATIVA: [descrição]

LONGO PRAZO (12+ meses):
  TENDÊNCIA ESTRUTURAL: [positiva/neutra/negativa]
  TESE: [descrição da tese de longo prazo]

RECOMENDAÇÃO SETORIAL: [overweight/neutral/underweight]
\`\`\`

---

**Atualizado em:** {{timestamp}}

**DISCLAIMER:** Esta análise é apenas informativa e não constitui recomendação de investimento.
`,
};

export default sectorAnalysisPrompt;
