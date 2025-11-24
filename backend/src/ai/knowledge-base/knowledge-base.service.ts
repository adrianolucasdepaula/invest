import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface CodeChunk {
  file: string;
  content: string;
  embedding: number[];
  type: 'entity' | 'service' | 'controller' | 'component' | 'doc' | 'config';
  lineStart: number;
  lineEnd: number;
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  chunk: CodeChunk;
  score: number;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private chunks: CodeChunk[] = [];
  private openai: OpenAI;
  private readonly knowledgeBasePath = path.join(
    process.cwd(),
    '..',
    '.gemini',
    'memory',
    'knowledge-base.json',
  );

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. Knowledge base will be disabled.');
      return;
    }
    this.openai = new OpenAI({ apiKey });
    this.loadKnowledgeBase();
  }

  /**
   * Indexar codebase completo (backend + frontend + docs)
   * Gera embeddings para cada chunk de código
   */
  async indexCodebase(): Promise<void> {
    this.logger.log('Starting codebase indexing...');

    const files = await this.getAllCodeFiles();
    this.logger.log(`Found ${files.length} files to index`);

    let indexed = 0;
    const batchSize = 10;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (file) => {
          try {
            const content = fs.readFileSync(file, 'utf-8');
            const chunks = this.chunkCode(content, file);

            for (const chunk of chunks) {
              const embedding = await this.createEmbedding(chunk.content);
              chunk.embedding = embedding;
              this.chunks.push(chunk);
              indexed++;

              if (indexed % 50 === 0) {
                this.logger.log(`Indexed ${indexed}/${files.length * 5} chunks`);
              }
            }
          } catch (error) {
            this.logger.error(`Error indexing ${file}: ${error.message}`);
          }
        }),
      );
    }

    // Salvar knowledge base
    await this.saveKnowledgeBase();
    this.logger.log(
      `Indexing complete! ${this.chunks.length} chunks indexed from ${files.length} files.`,
    );
  }

  /**
   * Buscar contexto relevante usando similaridade de embeddings
   * @param query Query de busca
   * @param topK Número de resultados (default: 5)
   * @returns Array de chunks mais relevantes com scores
   */
  async searchContext(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (this.chunks.length === 0) {
      this.logger.warn('Knowledge base is empty. Run indexCodebase() first.');
      return [];
    }

    const queryEmbedding = await this.createEmbedding(query);

    // Calcular similaridade coseno para todos os chunks
    const scored: SearchResult[] = this.chunks.map((chunk) => ({
      chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Ordenar por score e retornar top-k
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((result) => result.score > 0.5); // Threshold mínimo de relevância
  }

  /**
   * Criar embedding usando OpenAI
   */
  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Mais barato e rápido
        input: text.substring(0, 8000), // Limitar tamanho para não exceder limite da API
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Error creating embedding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcular similaridade coseno entre dois vetores
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Chunking inteligente de código
   * Quebra código em pedaços lógicos (por funções, classes, seções)
   */
  private chunkCode(content: string, file: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');
    const chunkSize = 200; // Linhas por chunk
    const overlap = 20; // Overlap entre chunks para manter contexto

    let currentChunk: string[] = [];
    let lineStart = 1;

    for (let i = 0; i < lines.length; i++) {
      currentChunk.push(lines[i]);

      // Quebrar em chunks de tamanho fixo com overlap
      if (currentChunk.length >= chunkSize || (i === lines.length - 1 && currentChunk.length > 0)) {
        const chunkContent = currentChunk.join('\n');
        if (chunkContent.trim().length > 50) {
          // Evitar chunks vazios
          chunks.push({
            file,
            content: chunkContent,
            embedding: [], // Será preenchido depois
            type: this.detectType(file),
            lineStart,
            lineEnd: lineStart + currentChunk.length - 1,
          });
        }

        // Manter overlap
        currentChunk = currentChunk.slice(-overlap);
        lineStart = i - overlap + 2;
      }
    }

    return chunks;
  }

  /**
   * Detectar tipo de arquivo
   */
  private detectType(
    file: string,
  ): 'entity' | 'service' | 'controller' | 'component' | 'doc' | 'config' {
    if (file.includes('.entity.ts')) return 'entity';
    if (file.includes('.service.ts')) return 'service';
    if (file.includes('.controller.ts')) return 'controller';
    if (file.includes('.tsx') || file.includes('.jsx')) return 'component';
    if (file.endsWith('.md')) return 'doc';
    return 'config';
  }

  /**
   * Obter todos os arquivos de código
   */
  private async getAllCodeFiles(): Promise<string[]> {
    const projectRoot = path.join(process.cwd(), '..');

    const patterns = [
      'backend/src/**/*.ts',
      '!backend/src/**/*.spec.ts', // Excluir testes
      'frontend/src/**/*.tsx',
      'frontend/src/**/*.ts',
      '!frontend/src/**/*.test.tsx',
      '*.md', // Documentação
      '!node_modules/**',
      '!dist/**',
      '!.next/**',
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      });
      files.push(...matches);
    }

    return files;
  }

  /**
   * Salvar knowledge base em disco
   */
  private async saveKnowledgeBase(): Promise<void> {
    try {
      const dir = path.dirname(this.knowledgeBasePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.knowledgeBasePath, JSON.stringify(this.chunks, null, 2));
      this.logger.log(`Knowledge base saved to ${this.knowledgeBasePath}`);
    } catch (error) {
      this.logger.error(`Error saving knowledge base: ${error.message}`);
    }
  }

  /**
   * Carregar knowledge base do disco
   */
  private loadKnowledgeBase(): void {
    try {
      if (fs.existsSync(this.knowledgeBasePath)) {
        const data = fs.readFileSync(this.knowledgeBasePath, 'utf-8');
        this.chunks = JSON.parse(data);
        this.logger.log(`Loaded ${this.chunks.length} chunks from knowledge base`);
      } else {
        this.logger.log('No existing knowledge base found');
      }
    } catch (error) {
      this.logger.error(`Error loading knowledge base: ${error.message}`);
      this.chunks = [];
    }
  }

  /**
   * Obter estatísticas do knowledge base
   */
  getStats() {
    const stats = {
      totalChunks: this.chunks.length,
      byType: {} as Record<string, number>,
      byFile: {} as Record<string, number>,
    };

    this.chunks.forEach((chunk) => {
      stats.byType[chunk.type] = (stats.byType[chunk.type] || 0) + 1;

      const fileName = path.basename(chunk.file);
      stats.byFile[fileName] = (stats.byFile[fileName] || 0) + 1;
    });

    return stats;
  }
}
