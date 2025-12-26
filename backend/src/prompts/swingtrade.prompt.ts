/**
 * Swing Trade Prompt Template
 *
 * FASE 102: LLM Prompts Estruturados
 *
 * Horizonte: 2-10 dias
 * Foco: Tendência, padrões gráficos, médias móveis
 */

import { PromptTemplate } from './base.prompt';

export const swingtradePrompt: PromptTemplate = {
  name: 'swingtrade-analysis',
  horizon: 'swing',
  description: 'Análise para operações de swing trade (2-10 dias)',
  outputFormat: 'structured',

  variables: ['ticker', 'currentPrice', 'technicalData', 'fundamentalData'],

  systemInstructions: `Você é um analista técnico especializado em swing trade no mercado brasileiro.
Seu objetivo é identificar oportunidades de médio prazo baseadas em:
- Tendência primária e secundária
- Padrões gráficos clássicos
- Médias móveis (9, 21, 50 períodos)
- Níveis de Fibonacci
- Volume confirmando movimentos
- Contexto setorial e do IBOV`,

  template: `## ANÁLISE SWING TRADE - {{ticker}}

### DADOS DE ENTRADA
- **Ticker:** {{ticker}}
- **Preço Atual:** R$ {{currentPrice}}
- **Setor:** {{sector}}

### INDICADORES TÉCNICOS
{{technicalData}}

### DADOS FUNDAMENTALISTAS (CONTEXTO)
{{fundamentalData}}

---

## RESPOSTA ESTRUTURADA

Analise os dados acima para operação de swing trade:

### 1. TENDÊNCIA
\`\`\`
TENDÊNCIA PRIMÁRIA: [ALTA | BAIXA | LATERAL]
TENDÊNCIA SECUNDÁRIA: [ALTA | BAIXA | LATERAL]
FORÇA DA TENDÊNCIA: [1-10]
MÉDIAS MÓVEIS:
  - SMA9: [acima/abaixo] do preço
  - SMA21: [acima/abaixo] do preço
  - SMA50: [acima/abaixo] do preço
  - Alinhamento: [alinhadas alta | alinhadas baixa | entrelaçadas]
\`\`\`

### 2. PADRÃO GRÁFICO
\`\`\`
PADRÃO IDENTIFICADO: [nome do padrão ou "Nenhum padrão claro"]
TIPO: [continuação | reversão | acumulação | distribuição]
ESTÁGIO: [formação | confirmação | execução]
PROJEÇÃO: R$ [alvo baseado no padrão]
CONFIABILIDADE: [1-10]
\`\`\`

### 3. ZONA DE ENTRADA
\`\`\`
TIPO: [COMPRA | VENDA | AGUARDAR]
ZONA IDEAL: R$ [min] - R$ [max]
GATILHO: [condição específica para entrada]
TIMING: [imediato | aguardar pullback | aguardar rompimento]
\`\`\`

### 4. NÍVEIS DE FIBONACCI
\`\`\`
0% (topo/fundo): R$ [valor]
23.6%: R$ [valor]
38.2%: R$ [valor] [suporte/resistência chave]
50%: R$ [valor]
61.8%: R$ [valor] [suporte/resistência chave]
100% (fundo/topo): R$ [valor]
\`\`\`

### 5. GESTÃO DA OPERAÇÃO
\`\`\`
STOP LOSS: R$ [valor] ([%] abaixo/acima)
JUSTIFICATIVA STOP: [onde está o stop e por quê]

ALVO PARCIAL (50%): R$ [valor] (R/R: [X]:1)
ALVO FINAL (50%): R$ [valor] (R/R: [X]:1)

TEMPO ESTIMADO: [X] a [Y] dias
TRAILING STOP: [sim/não] - [critério se sim]
\`\`\`

### 6. CHECKPOINTS
\`\`\`
DIA 1-2: [o que observar]
DIA 3-5: [o que deve acontecer para manter posição]
DIA 6-10: [sinais de saída ou extensão]
INVALIDAÇÃO: [condição que invalida a tese]
\`\`\`

### 7. CONTEXTO
\`\`\`
IBOV: [tendência do índice]
SETOR: [momento do setor]
CORRELAÇÃO: [correlação com IBOV/setor]
EVENTOS: [resultados, dividendos, AGO/AGE próximos]
\`\`\`

### 8. SCORE FINAL
\`\`\`
TÉCNICO: [1-10]
TIMING: [1-10]
RISCO/RETORNO: [1-10]
SCORE GERAL: [1-10]

RECOMENDAÇÃO: [ENTRAR | AGUARDAR | EVITAR]
\`\`\`

---

**DISCLAIMER:** Esta análise é apenas informativa e não constitui recomendação de investimento.
`,
};

export default swingtradePrompt;
