import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ReportData {
  ticker: string;
  fundamentalData: any;
  technicalData: any;
  optionsData?: any;
  newsData?: any;
  macroData?: any;
}

export interface AIReport {
  ticker: string;
  generatedAt: Date;
  summary: string;
  fundamentalAnalysis: string;
  technicalAnalysis: string;
  riskAnalysis: string;
  recommendation: {
    action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    reasoning: string;
  };
  targetPrices: {
    conservative: number;
    moderate: number;
    optimistic: number;
  };
  keyPoints: string[];
  warnings: string[];
  opportunities: string[];
  fullReport: string;
}

@Injectable()
export class AIReportService {
  private readonly logger = new Logger(AIReportService.name);
  private readonly apiKey: string;
  private readonly provider: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.provider = this.configService.get<string>('AI_DEFAULT_PROVIDER', 'openai');
  }

  /**
   * Generate complete AI report for an asset
   */
  async generateReport(data: ReportData): Promise<AIReport> {
    this.logger.log(`Generating AI report for ${data.ticker}`);

    try {
      const prompt = this.buildPrompt(data);
      const aiResponse = await this.callAI(prompt);
      const report = this.parseAIResponse(aiResponse, data.ticker);

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate AI report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for AI
   */
  private buildPrompt(data: ReportData): string {
    const { ticker, fundamentalData, technicalData, optionsData } = data;

    let prompt = `Você é um analista financeiro experiente especializado no mercado brasileiro (B3).
Analise o ativo ${ticker} com base nos dados fornecidos e gere um relatório completo e profissional.

# DADOS FUNDAMENTALISTAS
${JSON.stringify(fundamentalData, null, 2)}

# DADOS TÉCNICOS
${JSON.stringify(technicalData, null, 2)}
`;

    if (optionsData) {
      prompt += `\n# DADOS DE OPÇÕES
${JSON.stringify(optionsData, null, 2)}
`;
    }

    prompt += `
# INSTRUÇÕES
Gere um relatório completo seguindo esta estrutura:

1. RESUMO EXECUTIVO (2-3 parágrafos)
   - Visão geral do ativo
   - Principal conclusão

2. ANÁLISE FUNDAMENTALISTA (detalhada)
   - Valuation (P/L, P/VP, EV/EBITDA, etc.)
   - Rentabilidade (ROE, ROIC, Margens)
   - Endividamento e saúde financeira
   - Crescimento histórico
   - Dividendos e payout

3. ANÁLISE TÉCNICA (detalhada)
   - Tendência atual
   - Indicadores de momentum (RSI, MACD)
   - Suportes e resistências
   - Padrões identificados
   - Volume e liquidez

4. ANÁLISE DE RISCOS
   - Riscos específicos do ativo
   - Riscos setoriais
   - Riscos macroeconômicos
   - Nível de risco: BAIXO, MÉDIO ou ALTO

5. RECOMENDAÇÃO
   - Ação: COMPRA FORTE, COMPRA, MANTER, VENDA ou VENDA FORTE
   - Nível de confiança (0-100)
   - Justificativa detalhada

6. PREÇOS-ALVO
   - Cenário conservador
   - Cenário moderado
   - Cenário otimista

7. PONTOS-CHAVE (bullet points)
   - 5-7 pontos principais

8. AVISOS E ATENÇÕES
   - Riscos importantes
   - Pontos de atenção

9. OPORTUNIDADES
   - Catalisadores potenciais
   - Oportunidades identificadas

Retorne a resposta em formato JSON com a seguinte estrutura:
{
  "summary": "...",
  "fundamentalAnalysis": "...",
  "technicalAnalysis": "...",
  "riskAnalysis": "...",
  "recommendation": {
    "action": "COMPRA FORTE | COMPRA | MANTER | VENDA | VENDA FORTE",
    "confidence": 85,
    "reasoning": "..."
  },
  "targetPrices": {
    "conservative": 25.50,
    "moderate": 30.00,
    "optimistic": 35.00
  },
  "keyPoints": ["...", "...", "..."],
  "warnings": ["...", "..."],
  "opportunities": ["...", "..."],
  "fullReport": "Relatório completo em markdown..."
}

Seja profissional, objetivo e baseie todas as conclusões nos dados fornecidos.
`;

    return prompt;
  }

  /**
   * Call AI API (OpenAI, Anthropic, etc.)
   */
  private async callAI(prompt: string): Promise<string> {
    if (this.provider === 'openai') {
      return this.callOpenAI(prompt);
    }

    throw new Error(`AI provider ${this.provider} not implemented`);
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'Você é um analista financeiro especializado em ações da B3.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw new Error(`Failed to call OpenAI API: ${error.message}`);
    }
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string, ticker: string): AIReport {
    try {
      const parsed = JSON.parse(response);

      // Map recommendation action
      const actionMap: Record<string, any> = {
        'COMPRA FORTE': 'STRONG_BUY',
        COMPRA: 'BUY',
        MANTER: 'HOLD',
        VENDA: 'SELL',
        'VENDA FORTE': 'STRONG_SELL',
        STRONG_BUY: 'STRONG_BUY',
        BUY: 'BUY',
        HOLD: 'HOLD',
        SELL: 'SELL',
        STRONG_SELL: 'STRONG_SELL',
      };

      return {
        ticker,
        generatedAt: new Date(),
        summary: parsed.summary || '',
        fundamentalAnalysis: parsed.fundamentalAnalysis || '',
        technicalAnalysis: parsed.technicalAnalysis || '',
        riskAnalysis: parsed.riskAnalysis || '',
        recommendation: {
          action: actionMap[parsed.recommendation?.action] || 'HOLD',
          confidence: parsed.recommendation?.confidence || 50,
          reasoning: parsed.recommendation?.reasoning || '',
        },
        targetPrices: {
          conservative: parsed.targetPrices?.conservative || 0,
          moderate: parsed.targetPrices?.moderate || 0,
          optimistic: parsed.targetPrices?.optimistic || 0,
        },
        keyPoints: parsed.keyPoints || [],
        warnings: parsed.warnings || [],
        opportunities: parsed.opportunities || [],
        fullReport: parsed.fullReport || '',
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Generate summary report (shorter version)
   */
  async generateSummary(data: ReportData): Promise<string> {
    this.logger.log(`Generating AI summary for ${data.ticker}`);

    const prompt = `Analise o ativo ${data.ticker} e gere um resumo executivo de 2-3 parágrafos.

Dados fundamentalistas: ${JSON.stringify(data.fundamentalData)}
Dados técnicos: ${JSON.stringify(data.technicalData)}

Inclua:
- Visão geral do ativo
- Principal conclusão sobre valuation e momento
- Recomendação geral

Seja conciso e objetivo.`;

    try {
      const response = await this.callAI(prompt);
      return response;
    } catch (error) {
      this.logger.error(`Failed to generate summary: ${error.message}`);
      throw error;
    }
  }
}
