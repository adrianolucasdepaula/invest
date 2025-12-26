/**
 * Day Trade Prompt Template
 *
 * FASE 102: LLM Prompts Estruturados
 *
 * Horizonte: Intraday (minutos a horas)
 * Foco: Price action, volume, níveis técnicos
 */

import { PromptTemplate } from './base.prompt';

export const daytradePrompt: PromptTemplate = {
  name: 'daytrade-analysis',
  horizon: 'intraday',
  description: 'Análise para operações de day trade com viés, níveis e setup',
  outputFormat: 'structured',

  variables: ['ticker', 'currentPrice', 'technicalData'],

  systemInstructions: `Você é um analista técnico especializado em day trade no mercado brasileiro.
Seu objetivo é fornecer análises claras e acionáveis para operações intraday.
Sempre considere:
- Liquidez do ativo
- Horário de maior volume (10h-12h, 14h-16h)
- Gaps de abertura
- Contexto do IBOV
- Risco/retorno mínimo de 2:1`,

  template: `## ANÁLISE DAY TRADE - {{ticker}}

### DADOS DE ENTRADA
- **Ticker:** {{ticker}}
- **Preço Atual:** R$ {{currentPrice}}
- **Data/Hora:** {{timestamp}}

### INDICADORES TÉCNICOS
{{technicalData}}

---

## RESPOSTA ESTRUTURADA

Analise os dados acima e forneça:

### 1. VIÉS DO DIA
\`\`\`
VIÉS: [COMPRA | VENDA | NEUTRO]
FORÇA: [1-10]
JUSTIFICATIVA: [máximo 2 linhas]
\`\`\`

### 2. NÍVEIS CRÍTICOS
\`\`\`
SUPORTE 1: R$ [valor] (probabilidade: [%])
SUPORTE 2: R$ [valor] (probabilidade: [%])
RESISTÊNCIA 1: R$ [valor] (probabilidade: [%])
RESISTÊNCIA 2: R$ [valor] (probabilidade: [%])
PIVOT DO DIA: R$ [valor]
\`\`\`

### 3. SETUP (SE HOUVER)
\`\`\`
PADRÃO: [nome do padrão identificado ou "Sem padrão claro"]
GATILHO: [condição para entrada]
ENTRADA: R$ [valor]
STOP LOSS: R$ [valor] ([%] de risco)
ALVO 1: R$ [valor] (R/R: [X]:1)
ALVO 2: R$ [valor] (R/R: [X]:1)
\`\`\`

### 4. VOLUME E LIQUIDEZ
\`\`\`
VOLUME ATUAL vs MÉDIA: [acima/abaixo] [X]%
BOOK: [equilibrado/comprador/vendedor]
LIQUIDEZ: [adequada/baixa] para operação de R$ [valor máximo]
\`\`\`

### 5. CENÁRIOS
\`\`\`
CENÁRIO OTIMISTA (prob: [%]):
- [descrição curta]

CENÁRIO PESSIMISTA (prob: [%]):
- [descrição curta]

CENÁRIO BASE (prob: [%]):
- [descrição curta]
\`\`\`

### 6. ALERTAS E EVENTOS
\`\`\`
⚠️ [lista de eventos que podem impactar: dividendos, resultados, notícias]
\`\`\`

### 7. CONFIANÇA GERAL
\`\`\`
SCORE: [1-10]
RECOMENDAÇÃO: [OPERAR | AGUARDAR | EVITAR]
\`\`\`

---

**DISCLAIMER:** Esta análise é apenas informativa e não constitui recomendação de investimento.
`,
};

export default daytradePrompt;
