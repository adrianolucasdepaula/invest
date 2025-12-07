import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News, NewsAnalysis, AIProvider, NewsAnalysisStatus } from '../../../database/entities';

/**
 * Configuração de cada AI Provider
 */
interface AIProviderConfig {
  provider: AIProvider;
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  timeout: number;
  enabled: boolean;
}

/**
 * Resposta padronizada de análise de sentimento
 */
interface SentimentAnalysisResult {
  sentimentScore: number; // -1 a +1
  confidence: number; // 0 a 1
  analysisText: string;
  keyFactors: {
    bullish: string[];
    bearish: string[];
    neutral: string[];
  };
  processingTime: number;
  rawResponse?: Record<string, unknown>;
}

/**
 * FASE 75.3: Multi-AI Orchestrator Service
 *
 * Orquestra análise de sentimento usando 6 AI providers:
 * - ChatGPT (GPT-5)
 * - Claude (Sonnet 4.5)
 * - Gemini (2.5 Pro)
 * - DeepSeek (V3.2)
 * - Grok (4.1)
 * - Perplexity (Sonar Pro)
 *
 * Cada provider analisa independentemente, depois o ConsensusService
 * faz cross-validation dos resultados.
 */
@Injectable()
export class AIOrchestatorService {
  private readonly logger = new Logger(AIOrchestatorService.name);
  private readonly providers: Map<AIProvider, AIProviderConfig> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(NewsAnalysis)
    private readonly newsAnalysisRepository: Repository<NewsAnalysis>,
  ) {
    this.initializeProviders();
  }

  /**
   * Inicializa configurações de todos os providers
   */
  private initializeProviders(): void {
    // ChatGPT (OpenAI)
    this.providers.set(AIProvider.CHATGPT, {
      provider: AIProvider.CHATGPT,
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: this.configService.get('OPENAI_API_KEY', ''),
      model: 'gpt-5', // Modelo Dez/2025
      maxTokens: 2000,
      timeout: 60000,
      enabled: !!this.configService.get('OPENAI_API_KEY'),
    });

    // Claude (Anthropic)
    this.providers.set(AIProvider.CLAUDE, {
      provider: AIProvider.CLAUDE,
      apiUrl: 'https://api.anthropic.com/v1/messages',
      apiKey: this.configService.get('ANTHROPIC_API_KEY', ''),
      model: 'claude-sonnet-4-5-20251201', // Modelo Dez/2025
      maxTokens: 2000,
      timeout: 60000,
      enabled: !!this.configService.get('ANTHROPIC_API_KEY'),
    });

    // Gemini (Google)
    this.providers.set(AIProvider.GEMINI, {
      provider: AIProvider.GEMINI,
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      apiKey: this.configService.get('GOOGLE_AI_API_KEY', ''),
      model: 'gemini-2.5-pro', // Modelo Dez/2025
      maxTokens: 2000,
      timeout: 60000,
      enabled: !!this.configService.get('GOOGLE_AI_API_KEY'),
    });

    // DeepSeek
    this.providers.set(AIProvider.DEEPSEEK, {
      provider: AIProvider.DEEPSEEK,
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: this.configService.get('DEEPSEEK_API_KEY', ''),
      model: 'deepseek-v3.2', // Modelo Dez/2025 - 685B params
      maxTokens: 2000,
      timeout: 60000,
      enabled: !!this.configService.get('DEEPSEEK_API_KEY'),
    });

    // Grok (xAI)
    this.providers.set(AIProvider.GROK, {
      provider: AIProvider.GROK,
      apiUrl: 'https://api.x.ai/v1/chat/completions',
      apiKey: this.configService.get('XAI_API_KEY', ''),
      model: 'grok-4.1', // Modelo Dez/2025
      maxTokens: 2000,
      timeout: 60000,
      enabled: !!this.configService.get('XAI_API_KEY'),
    });

    // Perplexity
    this.providers.set(AIProvider.PERPLEXITY, {
      provider: AIProvider.PERPLEXITY,
      apiUrl: 'https://api.perplexity.ai/chat/completions',
      apiKey: this.configService.get('PERPLEXITY_API_KEY', ''),
      model: 'sonar-pro', // Modelo Dez/2025
      maxTokens: 2000,
      timeout: 60000,
      enabled: !!this.configService.get('PERPLEXITY_API_KEY'),
    });

    const enabledCount = Array.from(this.providers.values()).filter(p => p.enabled).length;
    this.logger.log(`Initialized ${enabledCount}/6 AI providers`);
  }

  /**
   * Retorna providers habilitados
   */
  getEnabledProviders(): AIProvider[] {
    return Array.from(this.providers.entries())
      .filter(([, config]) => config.enabled)
      .map(([provider]) => provider);
  }

  /**
   * Analisa uma notícia com todos os providers habilitados
   */
  async analyzeNews(news: News, specificProviders?: AIProvider[]): Promise<NewsAnalysis[]> {
    const providersToUse = specificProviders || this.getEnabledProviders();

    if (providersToUse.length === 0) {
      this.logger.warn('No AI providers configured. Set API keys in environment.');
      return [];
    }

    this.logger.log(`Analyzing news ${news.id} with ${providersToUse.length} providers`);

    // Executar análises em paralelo
    const analysisPromises = providersToUse.map(provider =>
      this.analyzeWithProvider(news, provider)
    );

    const results = await Promise.allSettled(analysisPromises);

    // Coletar resultados bem-sucedidos
    const analyses: NewsAnalysis[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        analyses.push(result.value);
      }
    }

    this.logger.log(`Completed ${analyses.length}/${providersToUse.length} analyses for news ${news.id}`);
    return analyses;
  }

  /**
   * Analisa com um provider específico
   */
  private async analyzeWithProvider(news: News, provider: AIProvider): Promise<NewsAnalysis | null> {
    const config = this.providers.get(provider);
    if (!config || !config.enabled) {
      return null;
    }

    const startTime = Date.now();

    // Verificar se já existe análise para este provider
    const existing = await this.newsAnalysisRepository.findOne({
      where: { newsId: news.id, provider },
    });

    if (existing && existing.status === NewsAnalysisStatus.COMPLETED) {
      this.logger.debug(`Analysis already exists for news ${news.id} with ${provider}`);
      return existing;
    }

    // Criar ou atualizar registro de análise
    let analysis = existing || this.newsAnalysisRepository.create({
      newsId: news.id,
      provider,
      modelVersion: config.model,
      status: NewsAnalysisStatus.PROCESSING,
    });

    analysis.status = NewsAnalysisStatus.PROCESSING;
    analysis = await this.newsAnalysisRepository.save(analysis);

    try {
      const result = await this.callProviderAPI(config, news);

      analysis.sentimentScore = result.sentimentScore;
      analysis.confidence = result.confidence;
      analysis.analysisText = result.analysisText;
      analysis.keyFactors = result.keyFactors;
      analysis.rawResponse = result.rawResponse;
      analysis.processingTime = Date.now() - startTime;
      analysis.status = NewsAnalysisStatus.COMPLETED;
      analysis.completedAt = new Date();

      return await this.newsAnalysisRepository.save(analysis);
    } catch (error) {
      this.logger.error(`Error analyzing with ${provider}: ${error.message}`);

      analysis.status = NewsAnalysisStatus.FAILED;
      analysis.errorMessage = error.message;
      analysis.retryCount += 1;
      analysis.processingTime = Date.now() - startTime;

      await this.newsAnalysisRepository.save(analysis);
      return null;
    }
  }

  /**
   * Chama API do provider específico
   */
  private async callProviderAPI(
    config: AIProviderConfig,
    news: News,
  ): Promise<SentimentAnalysisResult> {
    const prompt = this.buildSentimentPrompt(news);

    switch (config.provider) {
      case AIProvider.CHATGPT:
        return this.callOpenAI(config, prompt);
      case AIProvider.CLAUDE:
        return this.callClaude(config, prompt);
      case AIProvider.GEMINI:
        return this.callGemini(config, prompt);
      case AIProvider.DEEPSEEK:
        return this.callDeepSeek(config, prompt);
      case AIProvider.GROK:
        return this.callGrok(config, prompt);
      case AIProvider.PERPLEXITY:
        return this.callPerplexity(config, prompt);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  /**
   * Constrói prompt padronizado para análise de sentimento
   */
  private buildSentimentPrompt(news: News): string {
    return `Você é um analista financeiro especializado em mercado de ações brasileiro (B3).
Analise a seguinte notícia e determine o sentimento de mercado para o ativo ${news.ticker}.

NOTÍCIA:
Título: ${news.title}
${news.summary ? `Resumo: ${news.summary}` : ''}
${news.content ? `Conteúdo: ${news.content.substring(0, 2000)}` : ''}
Fonte: ${news.sourceName || news.source}
Data: ${news.publishedAt.toISOString()}

INSTRUÇÕES:
1. Analise o impacto potencial no preço da ação
2. Identifique fatores positivos (bullish), negativos (bearish) e neutros
3. Atribua um score de sentimento de -1 (muito bearish) a +1 (muito bullish)
4. Indique sua confiança de 0 a 1

RESPONDA EXATAMENTE no formato JSON:
{
  "sentimentScore": <número de -1 a 1>,
  "confidence": <número de 0 a 1>,
  "analysisText": "<análise em 2-3 frases>",
  "keyFactors": {
    "bullish": ["fator1", "fator2"],
    "bearish": ["fator1", "fator2"],
    "neutral": ["fator1"]
  }
}`;
  }

  /**
   * Chama OpenAI API (ChatGPT)
   */
  private async callOpenAI(
    config: AIProviderConfig,
    prompt: string,
  ): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      sentimentScore: this.clamp(parsed.sentimentScore, -1, 1),
      confidence: this.clamp(parsed.confidence, 0, 1),
      analysisText: parsed.analysisText || '',
      keyFactors: parsed.keyFactors || { bullish: [], bearish: [], neutral: [] },
      processingTime: Date.now() - startTime,
      rawResponse: data,
    };
  }

  /**
   * Chama Anthropic API (Claude)
   */
  private async callClaude(
    config: AIProviderConfig,
    prompt: string,
  ): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2024-01-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      sentimentScore: this.clamp(parsed.sentimentScore, -1, 1),
      confidence: this.clamp(parsed.confidence, 0, 1),
      analysisText: parsed.analysisText || '',
      keyFactors: parsed.keyFactors || { bullish: [], bearish: [], neutral: [] },
      processingTime: Date.now() - startTime,
      rawResponse: data,
    };
  }

  /**
   * Chama Google Gemini API
   */
  private async callGemini(
    config: AIProviderConfig,
    prompt: string,
  ): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();
    const url = `${config.apiUrl}/${config.model}:generateContent?key=${config.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: 0.3,
        },
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      sentimentScore: this.clamp(parsed.sentimentScore, -1, 1),
      confidence: this.clamp(parsed.confidence, 0, 1),
      analysisText: parsed.analysisText || '',
      keyFactors: parsed.keyFactors || { bullish: [], bearish: [], neutral: [] },
      processingTime: Date.now() - startTime,
      rawResponse: data,
    };
  }

  /**
   * Chama DeepSeek API
   */
  private async callDeepSeek(
    config: AIProviderConfig,
    prompt: string,
  ): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from DeepSeek response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      sentimentScore: this.clamp(parsed.sentimentScore, -1, 1),
      confidence: this.clamp(parsed.confidence, 0, 1),
      analysisText: parsed.analysisText || '',
      keyFactors: parsed.keyFactors || { bullish: [], bearish: [], neutral: [] },
      processingTime: Date.now() - startTime,
      rawResponse: data,
    };
  }

  /**
   * Chama xAI Grok API
   */
  private async callGrok(
    config: AIProviderConfig,
    prompt: string,
  ): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Grok response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      sentimentScore: this.clamp(parsed.sentimentScore, -1, 1),
      confidence: this.clamp(parsed.confidence, 0, 1),
      analysisText: parsed.analysisText || '',
      keyFactors: parsed.keyFactors || { bullish: [], bearish: [], neutral: [] },
      processingTime: Date.now() - startTime,
      rawResponse: data,
    };
  }

  /**
   * Chama Perplexity API
   */
  private async callPerplexity(
    config: AIProviderConfig,
    prompt: string,
  ): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Perplexity response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      sentimentScore: this.clamp(parsed.sentimentScore, -1, 1),
      confidence: this.clamp(parsed.confidence, 0, 1),
      analysisText: parsed.analysisText || '',
      keyFactors: parsed.keyFactors || { bullish: [], bearish: [], neutral: [] },
      processingTime: Date.now() - startTime,
      rawResponse: data,
    };
  }

  /**
   * Limita valor entre min e max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Retorna estatísticas de análises
   */
  async getAnalysisStats(): Promise<{
    total: number;
    byProvider: Record<AIProvider, number>;
    byStatus: Record<NewsAnalysisStatus, number>;
  }> {
    const analyses = await this.newsAnalysisRepository.find();

    const byProvider = {} as Record<AIProvider, number>;
    const byStatus = {} as Record<NewsAnalysisStatus, number>;

    for (const provider of Object.values(AIProvider)) {
      byProvider[provider] = 0;
    }
    for (const status of Object.values(NewsAnalysisStatus)) {
      byStatus[status] = 0;
    }

    for (const analysis of analyses) {
      byProvider[analysis.provider]++;
      byStatus[analysis.status]++;
    }

    return {
      total: analyses.length,
      byProvider,
      byStatus,
    };
  }
}
