import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFinancialAgent, AgentConfig } from '../interfaces/financial-agent.interface';
import { AgentResponse, AnalysisContext } from '../interfaces/analysis.types';
import OpenAI from 'openai';

/**
 * Classe base abstrata para agentes financeiros
 * Todos os agentes especializados devem estender esta classe
 */
@Injectable()
export abstract class BaseFinancialAgent implements IFinancialAgent {
  protected openai: OpenAI;
  protected config: AgentConfig;

  abstract readonly name: string;
  abstract readonly specialty: string;
  abstract readonly version: string;

  constructor(protected configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.get('OPENAI_API_KEY'),
    });

    // Configuração padrão (pode ser sobrescrita)
    this.config = {
      model: 'gpt-4-turbo-preview',
      temperature: 0.3, // Mais conservador para análises financeiras
      maxTokens: 2000,
    };
  }

  /**
   * Implementação padrão - pode ser sobrescrita por agentes específicos
   */
  canAnalyze(context: AnalysisContext): boolean {
    return !!context.ticker && !!context.stockData;
  }

  /**
   * Confiança base padrão - pode ser sobrescrita
   */
  getBaseConfidence(): number {
    return 0.75; // 75% de confiança base
  }

  /**
   * Método abstrato - cada agente deve implementar sua análise
   */
  abstract analyze(context: AnalysisContext): Promise<AgentResponse>;

  /**
   * Método auxiliar para chamar GPT-4
   */
  protected async callGPT4(
    systemPrompt: string,
    userPrompt: string,
    temperature?: number,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        temperature: temperature ?? this.config.temperature,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error(`[${this.name}] Error calling GPT-4:`, error);
      throw error;
    }
  }

  /**
   * Formata dados de ação para prompt
   */
  protected formatStockData(stockData: any): string {
    const lines: string[] = [];

    lines.push(`Ticker: ${stockData.ticker}`);
    lines.push(`Nome: ${stockData.name}`);
    lines.push(`Preço Atual: R$ ${stockData.price?.toFixed(2)}`);
    lines.push(
      `Variação: ${stockData.change > 0 ? '+' : ''}${stockData.change?.toFixed(2)} (${stockData.changePercent?.toFixed(2)}%)`,
    );
    lines.push(`Volume: ${stockData.volume?.toLocaleString('pt-BR')}`);
    lines.push(`Market Cap: R$ ${(stockData.marketCap / 1_000_000_000).toFixed(2)}B`);

    if (stockData.sector) lines.push(`Setor: ${stockData.sector}`);
    if (stockData.industry) lines.push(`Indústria: ${stockData.industry}`);

    return lines.join('\n');
  }

  /**
   * Extrai recomendação do texto da resposta
   */
  protected extractRecommendation(text: string): 'BUY' | 'HOLD' | 'SELL' | undefined {
    const normalized = text.toUpperCase();

    // Procura por palavras-chave
    if (
      normalized.includes('COMPRA') ||
      normalized.includes('BUY') ||
      normalized.includes('COMPRAR')
    ) {
      return 'BUY';
    }

    if (
      normalized.includes('VENDA') ||
      normalized.includes('SELL') ||
      normalized.includes('VENDER')
    ) {
      return 'SELL';
    }

    if (
      normalized.includes('MANTER') ||
      normalized.includes('HOLD') ||
      normalized.includes('SEGURAR')
    ) {
      return 'HOLD';
    }

    return undefined;
  }

  /**
   * Extrai nível de confiança do texto
   */
  protected extractConfidence(text: string): number {
    const normalized = text.toLowerCase();

    // Procura por indicadores de confiança
    if (normalized.includes('muito confiante') || normalized.includes('alta confiança')) {
      return 0.9;
    }

    if (normalized.includes('confiante') || normalized.includes('confiança moderada')) {
      return 0.75;
    }

    if (normalized.includes('incerto') || normalized.includes('baixa confiança')) {
      return 0.5;
    }

    // Padrão
    return this.getBaseConfidence();
  }
}
