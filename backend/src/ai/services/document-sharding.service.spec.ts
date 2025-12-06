import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DocumentShardingService, DocumentChunk } from './document-sharding.service';

describe('DocumentShardingService', () => {
  let service: DocumentShardingService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentShardingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DocumentShardingService>(DocumentShardingService);
  });

  describe('estimateTokens', () => {
    it('should estimate tokens based on character count', () => {
      // 4 characters = 1 token
      expect(service.estimateTokens('test')).toBe(1);
      expect(service.estimateTokens('testing1')).toBe(2);
      expect(service.estimateTokens('a'.repeat(100))).toBe(25);
    });

    it('should handle empty string', () => {
      expect(service.estimateTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(4000);
      expect(service.estimateTokens(longText)).toBe(1000);
    });

    it('should round up token count', () => {
      // 5 characters = ceil(5/4) = 2 tokens
      expect(service.estimateTokens('hello')).toBe(2);
    });
  });

  describe('shardDocument', () => {
    it('should return single chunk for short document', () => {
      const doc = 'This is a short document.';
      const chunks = service.shardDocument(doc, { maxTokensPerChunk: 1000 });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(doc);
      expect(chunks[0].id).toBe('chunk_0');
    });

    it('should split document into multiple chunks', () => {
      // Create a document with multiple paragraphs
      const paragraphs = Array(10).fill('This is a paragraph with some content.').join('\n\n');
      const chunks = service.shardDocument(paragraphs, { maxTokensPerChunk: 50 });

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should use default options', () => {
      const doc = 'Short document';
      const chunks = service.shardDocument(doc);

      expect(chunks).toHaveLength(1);
    });

    it('should preserve paragraphs by default', () => {
      const doc = 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.';
      const chunks = service.shardDocument(doc, {
        maxTokensPerChunk: 1000,
        preserveParagraphs: true
      });

      // All paragraphs should fit in one chunk with high token limit
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toContain('Paragraph 1');
      expect(chunks[0].content).toContain('Paragraph 2');
      expect(chunks[0].content).toContain('Paragraph 3');
    });

    it('should split by tokens when preserveParagraphs is false', () => {
      const longText = 'word '.repeat(1000);
      const chunks = service.shardDocument(longText, {
        maxTokensPerChunk: 100,
        preserveParagraphs: false,
        overlapTokens: 20
      });

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should assign unique IDs to chunks', () => {
      const doc = 'Para 1.\n\nPara 2.\n\nPara 3.';
      const chunks = service.shardDocument(doc, { maxTokensPerChunk: 10 });

      const ids = chunks.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include token count in each chunk', () => {
      const doc = 'This is a test document.';
      const chunks = service.shardDocument(doc);

      expect(chunks[0].tokens).toBeDefined();
      expect(chunks[0].tokens).toBeGreaterThan(0);
    });
  });

  describe('calculateTokenSavings', () => {
    it('should calculate token savings correctly', () => {
      const originalDoc = 'a'.repeat(4000); // 1000 tokens
      const selectedChunks: DocumentChunk[] = [
        { id: 'chunk_0', content: 'a'.repeat(400), tokens: 100 },
        { id: 'chunk_1', content: 'a'.repeat(400), tokens: 100 },
      ];

      const savings = service.calculateTokenSavings(originalDoc, selectedChunks);

      expect(savings.originalTokens).toBe(1000);
      expect(savings.reducedTokens).toBe(200);
      expect(savings.savedTokens).toBe(800);
      expect(savings.savingsPercent).toBe(80);
    });

    it('should handle no savings', () => {
      const originalDoc = 'short';
      const selectedChunks: DocumentChunk[] = [
        { id: 'chunk_0', content: 'short', tokens: 2 },
      ];

      const savings = service.calculateTokenSavings(originalDoc, selectedChunks);

      expect(savings.savedTokens).toBe(0);
      expect(savings.savingsPercent).toBe(0);
    });

    it('should handle empty chunks', () => {
      const originalDoc = 'some content';
      const selectedChunks: DocumentChunk[] = [];

      const savings = service.calculateTokenSavings(originalDoc, selectedChunks);

      expect(savings.reducedTokens).toBe(0);
      expect(savings.savingsPercent).toBe(100);
    });
  });

  describe('cosineSimilarity (via public interface)', () => {
    // Testing through selectRelevantChunks fallback behavior
    it('should handle few chunks without calling embeddings', async () => {
      const chunks: DocumentChunk[] = [
        { id: 'chunk_0', content: 'Test content 1', tokens: 10 },
        { id: 'chunk_1', content: 'Test content 2', tokens: 10 },
      ];

      // With maxChunks >= chunks.length, should return all without calling API
      const selected = await service.selectRelevantChunks(chunks, 'query', 5);

      expect(selected).toHaveLength(2);
    });
  });

  describe('sharding edge cases', () => {
    it('should handle document with only one paragraph', () => {
      const doc = 'Single paragraph without any line breaks.';
      const chunks = service.shardDocument(doc);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(doc);
    });

    it('should handle document with empty paragraphs', () => {
      const doc = 'Para 1.\n\n\n\nPara 2.';
      const chunks = service.shardDocument(doc, { maxTokensPerChunk: 1000 });

      // Should still work with multiple newlines
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very long single paragraph', () => {
      const longPara = 'word '.repeat(5000); // Very long paragraph
      const chunks = service.shardDocument(longPara, { maxTokensPerChunk: 500 });

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle mixed paragraph sizes', () => {
      const doc = [
        'Short paragraph.',
        'a '.repeat(500), // Long paragraph
        'Another short one.',
      ].join('\n\n');

      const chunks = service.shardDocument(doc, { maxTokensPerChunk: 200 });

      // Should split the long paragraph
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('options validation', () => {
    it('should use default maxTokensPerChunk of 2000', () => {
      const doc = 'a'.repeat(100);
      const chunks = service.shardDocument(doc);

      // With default 2000 tokens limit, 100 chars = 25 tokens should fit in 1 chunk
      expect(chunks).toHaveLength(1);
    });

    it('should use default overlapTokens of 200', () => {
      const longText = 'word '.repeat(2000);
      const chunks = service.shardDocument(longText, {
        maxTokensPerChunk: 500,
        preserveParagraphs: false
      });

      // With overlap, chunks should have some content overlap
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should respect preserveParagraphs option', () => {
      const doc = 'Para 1.\n\nPara 2.\n\nPara 3.';

      const withPreserve = service.shardDocument(doc, {
        maxTokensPerChunk: 1000,
        preserveParagraphs: true
      });

      const withoutPreserve = service.shardDocument(doc, {
        maxTokensPerChunk: 1000,
        preserveParagraphs: false
      });

      // Both should produce valid chunks
      expect(withPreserve.length).toBeGreaterThanOrEqual(1);
      expect(withoutPreserve.length).toBeGreaterThanOrEqual(1);
    });
  });
});
