import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface DocumentChunk {
  id: string;
  content: string;
  tokens: number;
  relevance?: number;
  metadata?: Record<string, any>;
}

export interface ShardingOptions {
  maxTokensPerChunk?: number;
  overlapTokens?: number;
  preserveParagraphs?: boolean;
}

/**
 * Document Sharding Service
 * Divide documentos grandes em chunks para economizar tokens GPT-4
 * Usa embeddings para selecionar apenas partes relevantes
 */
@Injectable()
export class DocumentShardingService {
  private readonly logger = new Logger(DocumentShardingService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Divide documento em chunks menores
   */
  shardDocument(
    document: string,
    options: ShardingOptions = {},
  ): DocumentChunk[] {
    const {
      maxTokensPerChunk = 2000,
      overlapTokens = 200,
      preserveParagraphs = true,
    } = options;

    const chunks: DocumentChunk[] = [];

    if (preserveParagraphs) {
      return this.shardByParagraphs(document, maxTokensPerChunk);
    } else {
      return this.shardByTokens(document, maxTokensPerChunk, overlapTokens);
    }
  }

  /**
   * Divide por parágrafos (melhor para manter contexto)
   */
  private shardByParagraphs(
    document: string,
    maxTokens: number,
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const paragraphs = document.split(/\n\n+/);

    let currentChunk = '';
    let currentTokens = 0;
    let chunkId = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.estimateTokens(paragraph);

      // Se o parágrafo sozinho excede o limite, divide ele
      if (paragraphTokens > maxTokens) {
        if (currentChunk) {
          chunks.push({
            id: `chunk_${chunkId++}`,
            content: currentChunk.trim(),
            tokens: currentTokens,
          });
          currentChunk = '';
          currentTokens = 0;
        }

        // Divide o parágrafo grande
        const subChunks = this.shardByTokens(paragraph, maxTokens, 0);
        chunks.push(...subChunks.map((c, i) => ({
          ...c,
          id: `chunk_${chunkId++}`,
        })));

        continue;
      }

      // Se adicionar este parágrafo exceder o limite, salva chunk atual
      if (currentTokens + paragraphTokens > maxTokens) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          content: currentChunk.trim(),
          tokens: currentTokens,
        });

        currentChunk = paragraph;
        currentTokens = paragraphTokens;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    // Adiciona último chunk
    if (currentChunk) {
      chunks.push({
        id: `chunk_${chunkId}`,
        content: currentChunk.trim(),
        tokens: currentTokens,
      });
    }

    this.logger.log(
      `Document sharded into ${chunks.length} chunks (avg ${Math.round(chunks.reduce((sum, c) => sum + c.tokens, 0) / chunks.length)} tokens/chunk)`,
    );

    return chunks;
  }

  /**
   * Divide por tokens com overlap (para contexto contínuo)
   */
  private shardByTokens(
    text: string,
    maxTokens: number,
    overlapTokens: number,
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = text.split(/\s+/);
    const tokensPerWord = 1.3; // Estimativa: ~1.3 tokens por palavra

    const wordsPerChunk = Math.floor(maxTokens / tokensPerWord);
    const overlapWords = Math.floor(overlapTokens / tokensPerWord);

    let chunkId = 0;
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + wordsPerChunk, words.length);
      const chunkWords = words.slice(start, end);
      const content = chunkWords.join(' ');

      chunks.push({
        id: `chunk_${chunkId++}`,
        content,
        tokens: this.estimateTokens(content),
      });

      // Próximo chunk começa com overlap
      start = end - overlapWords;

      // Evita loop infinito
      if (start >= words.length - overlapWords) break;
    }

    return chunks;
  }

  /**
   * Seleciona chunks mais relevantes usando embeddings
   * ECONOMIA: Em vez de enviar 10 chunks (20k tokens), enviar apenas 3 (6k tokens) = 70% economia!
   */
  async selectRelevantChunks(
    chunks: DocumentChunk[],
    query: string,
    maxChunks: number = 3,
  ): Promise<DocumentChunk[]> {
    try {
      // Se já tem poucos chunks, retorna todos
      if (chunks.length <= maxChunks) {
        return chunks;
      }

      this.logger.log(
        `Selecting ${maxChunks} most relevant chunks from ${chunks.length} total`,
      );

      // Gerar embedding da query
      const queryEmbedding = await this.getEmbedding(query);

      // Calcular relevância de cada chunk
      const chunksWithRelevance = await Promise.all(
        chunks.map(async (chunk) => {
          const chunkEmbedding = await this.getEmbedding(chunk.content);
          const relevance = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

          return {
            ...chunk,
            relevance,
          };
        }),
      );

      // Ordenar por relevância e pegar top N
      const selected = chunksWithRelevance
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
        .slice(0, maxChunks);

      const totalTokensSaved = chunks.reduce((sum, c) => sum + c.tokens, 0) -
        selected.reduce((sum, c) => sum + c.tokens, 0);

      this.logger.log(
        `Selected ${selected.length} chunks, saved ~${totalTokensSaved} tokens (${((totalTokensSaved / chunks.reduce((sum, c) => sum + c.tokens, 0)) * 100).toFixed(0)}% reduction)`,
      );

      return selected;
    } catch (error) {
      this.logger.error('Error selecting relevant chunks:', error);
      // Fallback: retorna primeiros N chunks
      return chunks.slice(0, maxChunks);
    }
  }

  /**
   * Analisa documento com sharding (economia de tokens!)
   */
  async analyzeWithSharding(
    document: string,
    question: string,
    options: {
      maxChunks?: number;
      maxTokensPerChunk?: number;
      model?: string;
    } = {},
  ): Promise<string> {
    const { maxChunks = 3, maxTokensPerChunk = 2000, model = 'gpt-4-turbo-preview' } = options;

    try {
      // 1. Dividir documento
      const chunks = this.shardDocument(document, { maxTokensPerChunk });

      this.logger.log(`Document sharded into ${chunks.length} chunks`);

      // 2. Selecionar chunks relevantes (ECONOMIA AQUI!)
      const relevantChunks = await this.selectRelevantChunks(
        chunks,
        question,
        maxChunks,
      );

      // 3. Combinar chunks relevantes
      const context = relevantChunks
        .map((c, i) => `[Parte ${i + 1}]\n${c.content}`)
        .join('\n\n---\n\n');

      // 4. Análise com contexto reduzido
      const response = await this.openai.chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'Você é um analista financeiro. Responda baseado apenas no contexto fornecido.',
          },
          {
            role: 'user',
            content: `Contexto:\n${context}\n\nPergunta: ${question}`,
          },
        ],
      });

      const totalTokens = response.usage?.total_tokens || 0;
      this.logger.log(`Analysis completed using ${totalTokens} tokens`);

      return response.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error analyzing with sharding:', error);
      throw error;
    }
  }

  /**
   * Estima tokens de um texto (aproximação)
   * Regra: ~4 caracteres = 1 token para português
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Gera embedding usando OpenAI
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.slice(0, 8000), // Limita tamanho para API
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Calcula similaridade de cosseno entre dois vetores
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calcula economia potencial em tokens
   */
  calculateTokenSavings(
    originalDocument: string,
    selectedChunks: DocumentChunk[],
  ): {
    originalTokens: number;
    reducedTokens: number;
    savedTokens: number;
    savingsPercent: number;
  } {
    const originalTokens = this.estimateTokens(originalDocument);
    const reducedTokens = selectedChunks.reduce((sum, c) => sum + c.tokens, 0);
    const savedTokens = originalTokens - reducedTokens;
    const savingsPercent = (savedTokens / originalTokens) * 100;

    return {
      originalTokens,
      reducedTokens,
      savedTokens,
      savingsPercent,
    };
  }
}
