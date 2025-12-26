/**
 * Position Trade / Long-Term Investment Prompt Template
 *
 * FASE 102: LLM Prompts Estruturados
 *
 * Horizonte: Semanas a meses
 * Foco: Análise fundamentalista, valuation, tese de investimento
 */

import { PromptTemplate } from './base.prompt';

export const positionPrompt: PromptTemplate = {
  name: 'position-analysis',
  horizon: 'position',
  description: 'Análise para position trade e investimento de longo prazo',
  outputFormat: 'structured',

  variables: ['ticker', 'currentPrice', 'fundamentalData', 'technicalData', 'newsData'],

  systemInstructions: `Você é um analista fundamentalista especializado no mercado brasileiro.
Seu objetivo é fornecer análises completas para decisões de investimento de médio/longo prazo.
Considere sempre:
- Qualidade do negócio e vantagens competitivas
- Governança corporativa
- Perspectivas setoriais
- Valuation relativo e absoluto
- Riscos macro e micro
- Dividend yield e crescimento`,

  template: `## ANÁLISE POSITION / LONGO PRAZO - {{ticker}}

### DADOS DE ENTRADA
- **Ticker:** {{ticker}}
- **Preço Atual:** R$ {{currentPrice}}
- **Setor:** {{sector}}

### DADOS FUNDAMENTALISTAS
{{fundamentalData}}

### INDICADORES TÉCNICOS (TIMING)
{{technicalData}}

### NOTÍCIAS E SENTIMENTO
{{newsData}}

---

## RESPOSTA ESTRUTURADA

Analise os dados para decisão de investimento de longo prazo:

### 1. RESUMO DA EMPRESA
\`\`\`
NOME: [nome completo]
SETOR: [setor/subsetor]
NEGÓCIO PRINCIPAL: [descrição em 1-2 linhas]
MARKET CAP: R$ [valor] - [small/mid/large cap]
FREE FLOAT: [%]
TAG ALONG: [100%/80%/0%]
GOVERNANÇA: [Novo Mercado/N1/N2/Tradicional]
\`\`\`

### 2. TESE DE INVESTIMENTO
\`\`\`
TESE CENTRAL: [descrição em 2-3 linhas do motivo para investir]

CATALISADORES:
  1. [catalisador 1 - prazo estimado]
  2. [catalisador 2 - prazo estimado]
  3. [catalisador 3 - prazo estimado]

VANTAGENS COMPETITIVAS (MOAT):
  - [vantagem 1]
  - [vantagem 2]
\`\`\`

### 3. ANÁLISE FUNDAMENTALISTA
\`\`\`
VALUATION:
  P/L: [valor] vs setor: [valor] → [barato/caro/justo]
  P/VP: [valor] vs setor: [valor] → [barato/caro/justo]
  EV/EBITDA: [valor] vs setor: [valor] → [barato/caro/justo]

RENTABILIDADE:
  ROE: [%] - [excelente/bom/regular/ruim]
  ROIC: [%] - [excelente/bom/regular/ruim]
  Margem Líquida: [%] - tendência [crescente/estável/decrescente]

ENDIVIDAMENTO:
  Dív. Líq./EBITDA: [X]x - [saudável/atenção/crítico]
  Dív. Líq./PL: [%]

CRESCIMENTO:
  CAGR Receita 5a: [%]
  CAGR Lucro 5a: [%]
  Perspectiva: [acelerando/estável/desacelerando]
\`\`\`

### 4. DIVIDENDOS
\`\`\`
DIVIDEND YIELD: [%]
PAYOUT: [%]
FREQUÊNCIA: [mensal/trimestral/semestral/anual]
HISTÓRICO: [consistente/irregular]
SUSTENTABILIDADE: [alta/média/baixa]
YIELD ON COST PROJETADO (5a): [%]
\`\`\`

### 5. RISCOS
\`\`\`
RISCOS MACRO:
  1. [risco 1 - impacto: alto/médio/baixo]
  2. [risco 2 - impacto: alto/médio/baixo]

RISCOS MICRO:
  1. [risco 1 - impacto: alto/médio/baixo]
  2. [risco 2 - impacto: alto/médio/baixo]

RISCO REGULATÓRIO: [alto/médio/baixo]
RISCO DE GOVERNANÇA: [alto/médio/baixo]
RISCO DE LIQUIDEZ: [alto/médio/baixo]
\`\`\`

### 6. VALUATION
\`\`\`
METODOLOGIA: [DCF/Múltiplos/DDM/Soma das Partes]

PREÇO JUSTO ESTIMADO: R$ [valor]
UPSIDE/DOWNSIDE: [+/-][%]

CENÁRIOS:
  PESSIMISTA: R$ [valor] (prob: [%])
  BASE: R$ [valor] (prob: [%])
  OTIMISTA: R$ [valor] (prob: [%])

MARGEM DE SEGURANÇA ATUAL: [%]
\`\`\`

### 7. ALOCAÇÃO SUGERIDA
\`\`\`
PERFIL DO ATIVO: [growth/value/income/quality]
PESO SUGERIDO NA CARTEIRA: [%]

ESTRATÉGIA DE ENTRADA:
  - Entrada imediata: [% da posição]
  - Aguardar pullback até R$ [valor]: [% da posição]
  - Compras mensais: [% da posição]

PREÇO MÁXIMO DE COMPRA: R$ [valor]
\`\`\`

### 8. COMPARATIVO SETORIAL
\`\`\`
| Empresa    | P/L   | P/VP  | ROE   | DY    | Score |
|------------|-------|-------|-------|-------|-------|
| {{ticker}} | [val] | [val] | [val] | [val] | [1-10]|
| [peer 1]   | [val] | [val] | [val] | [val] | [1-10]|
| [peer 2]   | [val] | [val] | [val] | [val] | [1-10]|
| [peer 3]   | [val] | [val] | [val] | [val] | [1-10]|

POSIÇÃO RELATIVA: [melhor/pior/alinhada] ao setor
\`\`\`

### 9. TIMING TÉCNICO
\`\`\`
TENDÊNCIA LONGO PRAZO: [alta/baixa/lateral]
DISTÂNCIA DA MM200: [%]
SUPORTE RELEVANTE: R$ [valor]
RESISTÊNCIA RELEVANTE: R$ [valor]
TIMING ATUAL: [bom/regular/ruim] para entrada
\`\`\`

### 10. SCORE FINAL
\`\`\`
QUALIDADE DO NEGÓCIO: [1-10]
VALUATION: [1-10]
CRESCIMENTO: [1-10]
DIVIDENDOS: [1-10]
GOVERNANÇA: [1-10]
TIMING: [1-10]

SCORE GERAL: [1-10]

RECOMENDAÇÃO: [COMPRAR | MANTER | AGUARDAR | EVITAR]
HORIZONTE: [X] meses a [Y] anos
\`\`\`

---

**DISCLAIMER:** Esta análise é apenas informativa e não constitui recomendação de investimento.
`,
};

export default positionPrompt;
