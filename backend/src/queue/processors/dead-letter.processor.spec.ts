import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { DeadLetterProcessor, DeadLetterJob } from './dead-letter.processor';

describe('DeadLetterProcessor', () => {
  let processor: DeadLetterProcessor;

  const createMockJob = <T>(data: T, overrides: Partial<Job<T>> = {}): Job<T> =>
    ({
      id: 'dlq-job-123',
      name: 'failed-job',
      data,
      attemptsMade: 0,
      ...overrides,
    }) as Job<T>;

  const createDeadLetterJob = (overrides: Partial<DeadLetterJob> = {}): DeadLetterJob => ({
    originalQueue: 'scraping',
    originalJobName: 'scrape-fundamentus',
    originalJobId: 'job-456',
    originalData: { ticker: 'PETR4' },
    error: 'Connection timeout',
    stack: 'Error: Connection timeout\n    at Scraper.scrape',
    attemptsMade: 3,
    failedAt: new Date('2025-12-15T10:00:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeadLetterProcessor],
    }).compile();

    processor = module.get<DeadLetterProcessor>(DeadLetterProcessor);
  });

  describe('processFailedJob', () => {
    it('should process a failed job and return logged action', async () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result).toEqual({
        action: 'logged',
        originalQueue: 'scraping',
        originalJobName: 'scrape-fundamentus',
        processedAt: expect.any(Date),
      });
    });

    it('should handle different original queues', async () => {
      const queues = ['scraping', 'analysis', 'reports', 'asset-updates'];

      for (const queue of queues) {
        const deadLetterData = createDeadLetterJob({ originalQueue: queue });
        const job = createMockJob(deadLetterData);

        const result = await processor.processFailedJob(job);

        expect(result.originalQueue).toBe(queue);
        expect(result.action).toBe('logged');
      }
    });

    it('should handle jobs without stack trace', async () => {
      const deadLetterData = createDeadLetterJob({ stack: undefined });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result).toEqual({
        action: 'logged',
        originalQueue: 'scraping',
        originalJobName: 'scrape-fundamentus',
        processedAt: expect.any(Date),
      });
    });

    it('should handle jobs with various attempt counts', async () => {
      const attempts = [1, 3, 5, 10];

      for (const attemptsMade of attempts) {
        const deadLetterData = createDeadLetterJob({ attemptsMade });
        const job = createMockJob(deadLetterData);

        const result = await processor.processFailedJob(job);

        expect(result.action).toBe('logged');
      }
    });

    it('should handle complex original data', async () => {
      const complexData = {
        ticker: 'VALE3',
        options: { includeHistorical: true, sources: ['fundamentus', 'statusinvest'] },
        metadata: { userId: 'user-123', priority: 'high' },
      };
      const deadLetterData = createDeadLetterJob({ originalData: complexData });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle different error messages', async () => {
      const errors = [
        'Connection timeout',
        'Rate limit exceeded',
        'Parse error: Invalid HTML',
        'Database connection failed',
        'External API returned 500',
      ];

      for (const error of errors) {
        const deadLetterData = createDeadLetterJob({ error });
        const job = createMockJob(deadLetterData);

        const result = await processor.processFailedJob(job);

        expect(result.action).toBe('logged');
      }
    });
  });

  describe('processRetry', () => {
    it('should process a retry request', async () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData as DeadLetterJob & { retryToQueue: string });

      const result = await processor.processRetry(job);

      expect(result).toEqual({
        action: 'retry-scheduled',
        originalQueue: 'scraping',
        originalJobName: 'scrape-fundamentus',
        retryCount: 1,
      });
    });

    it('should increment retry count from 0', async () => {
      const deadLetterData = createDeadLetterJob({ retryCount: 0 });
      const job = createMockJob(deadLetterData as DeadLetterJob & { retryToQueue: string });

      const result = await processor.processRetry(job);

      expect(result.retryCount).toBe(1);
      expect(job.data.retryCount).toBe(1);
      expect(job.data.retriedAt).toBeInstanceOf(Date);
    });

    it('should increment retry count from existing value', async () => {
      const deadLetterData = createDeadLetterJob({ retryCount: 3 });
      const job = createMockJob(deadLetterData as DeadLetterJob & { retryToQueue: string });

      const result = await processor.processRetry(job);

      expect(result.retryCount).toBe(4);
      expect(job.data.retryCount).toBe(4);
    });

    it('should handle retry without previous retry count', async () => {
      const deadLetterData = createDeadLetterJob();
      delete (deadLetterData as any).retryCount;
      const job = createMockJob(deadLetterData as DeadLetterJob & { retryToQueue: string });

      const result = await processor.processRetry(job);

      expect(result.retryCount).toBe(1);
    });

    it('should set retriedAt timestamp', async () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData as DeadLetterJob & { retryToQueue: string });

      const beforeRetry = new Date();
      await processor.processRetry(job);
      const afterRetry = new Date();

      expect(job.data.retriedAt).toBeInstanceOf(Date);
      expect(job.data.retriedAt!.getTime()).toBeGreaterThanOrEqual(beforeRetry.getTime());
      expect(job.data.retriedAt!.getTime()).toBeLessThanOrEqual(afterRetry.getTime());
    });
  });

  describe('event handlers', () => {
    it('should handle onActive event', () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData);

      expect(() => processor.onActive(job)).not.toThrow();
    });

    it('should handle onCompleted event with logged action', () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData);
      const result = { action: 'logged' };

      expect(() => processor.onCompleted(job, result)).not.toThrow();
    });

    it('should handle onCompleted event with retry-scheduled action', () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData);
      const result = { action: 'retry-scheduled' };

      expect(() => processor.onCompleted(job, result)).not.toThrow();
    });

    it('should handle onCompleted event with undefined result', () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData);

      expect(() => processor.onCompleted(job, undefined)).not.toThrow();
    });

    it('should handle onCompleted event with null result', () => {
      const deadLetterData = createDeadLetterJob();
      const job = createMockJob(deadLetterData);

      expect(() => processor.onCompleted(job, null)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty originalData', async () => {
      const deadLetterData = createDeadLetterJob({ originalData: {} });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle null originalData', async () => {
      const deadLetterData = createDeadLetterJob({ originalData: null });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle very long error messages', async () => {
      const longError = 'A'.repeat(10000);
      const deadLetterData = createDeadLetterJob({ error: longError });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle special characters in error message', async () => {
      const specialError = 'Error: <script>alert("XSS")</script> & "quotes" \'apostrophes\'';
      const deadLetterData = createDeadLetterJob({ error: specialError });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle numeric originalJobId', async () => {
      const deadLetterData = createDeadLetterJob({ originalJobId: 12345 });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle string originalJobId', async () => {
      const deadLetterData = createDeadLetterJob({ originalJobId: 'uuid-123-456' });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle failedAt as Date object', async () => {
      const deadLetterData = createDeadLetterJob({ failedAt: new Date() });
      const job = createMockJob(deadLetterData);

      const result = await processor.processFailedJob(job);

      expect(result.action).toBe('logged');
    });

    it('should handle high retry counts', async () => {
      const deadLetterData = createDeadLetterJob({ retryCount: 100 });
      const job = createMockJob(deadLetterData as DeadLetterJob & { retryToQueue: string });

      const result = await processor.processRetry(job);

      expect(result.retryCount).toBe(101);
    });
  });
});
