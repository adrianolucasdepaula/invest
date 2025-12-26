/**
 * Market Overview Prompt Template
 *
 * FASE 102: LLM Prompts Estruturados
 *
 * Horizonte: Diário/Semanal
 * Foco: Visão geral do mercado, sentimento, drivers
 */

import { PromptTemplate } from './base.prompt';

export const marketOverviewPrompt: PromptTemplate = {
  name: 'market-overview',
  horizon: 'market',
  description: 'Visão geral do mercado brasileiro e internacional',
  outputFormat: 'structured',

  variables: ['ibovData', 'dollarData', 'selicData', 'newsData', 'sectorData'],

  systemInstructions: `Você é um estrategista de mercado especializado no mercado brasileiro.
Seu objetivo é fornecer uma visão macro do ambiente de investimentos, considerando:
- Índices brasileiros (IBOV, IFIX, SMLL)
- Mercados internacionais (S&P500, Nasdaq, DAX)
- Câmbio (USD/BRL, EUR/BRL)
- Juros (Selic, DI Futuro, Treasuries)
- Commodities (Petróleo, Minério, Ouro)
- Fluxo estrangeiro
- Contexto político e econômico`,

  template: `## VISÃO GERAL DO MERCADO - {{date}}

### DADOS DE ENTRADA

#### Índices
{{ibovData}}

#### Câmbio
{{dollarData}}

#### Juros
{{selicData}}

#### Setores
{{sectorData}}

#### Notícias Relevantes
{{newsData}}

---

## RESPOSTA ESTRUTURADA

### 1. SENTIMENTO DO MERCADO
\`\`\`
SENTIMENTO GERAL: [RISK-ON | RISK-OFF | MISTO]
NÍVEL DE MEDO/GANÂNCIA: [1-10] (1=medo extremo, 10=ganância extrema)
VOLATILIDADE: [baixa/normal/alta/extrema]
\`\`\`

### 2. PERFORMANCE DIÁRIA
\`\`\`
BRASIL:
  IBOV: [+/-][%] | [pontos] | Volume: R$ [Bi]
  IFIX: [+/-][%]
  SMLL: [+/-][%]
  IBrX50: [+/-][%]

INTERNACIONAL:
  S&P500: [+/-][%]
  Nasdaq: [+/-][%]
  Dow Jones: [+/-][%]
  DAX: [+/-][%]
  Shanghai: [+/-][%]

CÂMBIO:
  USD/BRL: R$ [valor] ([+/-][%])
  EUR/BRL: R$ [valor] ([+/-][%])
  DXY: [valor] ([+/-][%])

JUROS:
  Selic: [%]
  DI Jan/[ano]: [%]
  Treasury 10y: [%]

COMMODITIES:
  Petróleo (Brent): US$ [valor] ([+/-][%])
  Minério de Ferro: US$ [valor] ([+/-][%])
  Ouro: US$ [valor] ([+/-][%])
\`\`\`

### 3. DRIVERS DO DIA
\`\`\`
PRINCIPAIS DRIVERS:
  1. [driver 1 - impacto: positivo/negativo]
  2. [driver 2 - impacto: positivo/negativo]
  3. [driver 3 - impacto: positivo/negativo]

FLUXO ESTRANGEIRO:
  B3: R$ [+/-][valor] (acumulado mês: R$ [valor])
  Tendência: [entrada/saída/neutro]
\`\`\`

### 4. DESTAQUES SETORIAIS
\`\`\`
SETORES EM ALTA:
  1. [setor] ([+][%]) - motivo: [razão]
  2. [setor] ([+][%]) - motivo: [razão]
  3. [setor] ([+][%]) - motivo: [razão]

SETORES EM BAIXA:
  1. [setor] ([-][%]) - motivo: [razão]
  2. [setor] ([-][%]) - motivo: [razão]
  3. [setor] ([-][%]) - motivo: [razão]

ROTAÇÃO SETORIAL: [de setor X para setor Y] ou [sem rotação clara]
\`\`\`

### 5. AÇÕES DESTAQUE
\`\`\`
MAIORES ALTAS:
  1. [ticker] ([+][%]) - R$ [volume]
  2. [ticker] ([+][%]) - R$ [volume]
  3. [ticker] ([+][%]) - R$ [volume]

MAIORES BAIXAS:
  1. [ticker] ([-][%]) - R$ [volume]
  2. [ticker] ([-][%]) - R$ [volume]
  3. [ticker] ([-][%]) - R$ [volume]

MAIOR VOLUME:
  1. [ticker] - R$ [volume]
  2. [ticker] - R$ [volume]
  3. [ticker] - R$ [volume]
\`\`\`

### 6. ANÁLISE TÉCNICA IBOV
\`\`\`
TENDÊNCIA: [alta/baixa/lateral]
NÍVEL ATUAL: [pontos]
SUPORTE IMEDIATO: [pontos]
RESISTÊNCIA IMEDIATA: [pontos]
MM21: [pontos] - [acima/abaixo] do índice
MM50: [pontos] - [acima/abaixo] do índice
IFR (14): [valor] - [sobrecomprado/sobrevendido/neutro]
\`\`\`

### 7. AGENDA ECONÔMICA
\`\`\`
HOJE:
  [horário] - [evento] - impacto esperado: [alto/médio/baixo]

PRÓXIMOS DIAS:
  [data] - [evento importante 1]
  [data] - [evento importante 2]
  [data] - [evento importante 3]

RESULTADOS CORPORATIVOS:
  [data] - [empresa]
  [data] - [empresa]
\`\`\`

### 8. EVENTOS A MONITORAR
\`\`\`
RISCO POLÍTICO: [descrição ou "nenhum evento relevante"]
RISCO FISCAL: [descrição ou "nenhum evento relevante"]
RISCO GLOBAL: [descrição ou "nenhum evento relevante"]

OPORTUNIDADES:
  1. [oportunidade identificada]
  2. [oportunidade identificada]
\`\`\`

### 9. PERSPECTIVA DE CURTO PRAZO
\`\`\`
CENÁRIO PARA OS PRÓXIMOS DIAS:

CENÁRIO BASE (prob: [%]):
  [descrição em 2-3 linhas]

CENÁRIO OTIMISTA (prob: [%]):
  [descrição em 2-3 linhas]

CENÁRIO PESSIMISTA (prob: [%]):
  [descrição em 2-3 linhas]
\`\`\`

### 10. RECOMENDAÇÃO TÁTICA
\`\`\`
POSTURA RECOMENDADA: [ofensiva/defensiva/neutra]
EXPOSIÇÃO A RISCO: [aumentar/manter/reduzir]
SETORES PREFERIDOS: [setor 1], [setor 2], [setor 3]
SETORES A EVITAR: [setor 1], [setor 2]
HEDGES SUGERIDOS: [dólar/ouro/puts/nenhum]
\`\`\`

---

**Atualizado em:** {{timestamp}}

**DISCLAIMER:** Esta análise é apenas informativa e não constitui recomendação de investimento.
`,
};

export default marketOverviewPrompt;
