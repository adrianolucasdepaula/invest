import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { DeadLetterService } from './dead-letter.service';
import { DeadLetterJob } from '../processors/dead-letter.processor';
import { MetricsService } from '../../metrics/metrics.service';

describe('DeadLetterService', () => {
  let service: DeadLetterService;
  let deadLetterQueue: jest.Mocked<Queue<DeadLetterJob>>;
  let scrapingQueue: jest.Mocked<Queue>;
  let analysisQueue: jest.Mocked<Queue>;
  let reportsQueue: jest.Mocked<Queue>;
  let assetUpdatesQueue: jest.Mocked<Queue>;
  let metricsService: jest.Mocked<MetricsService>;

  const createMockQueue = (name: string): jest.Mocked<Queue> =>
    ({
      name,
      add: jest.fn().mockResolvedValue({ id: 'new-job-123' }),
      getJob: jest.fn(),
      getWaiting: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      clean: jest.fn().mockResolvedValue([]),
    }) as any;

  const createMockJob = (
    data: DeadLetterJob,
    overrides: Partial<Job<DeadLetterJob>> = {},
  ): Job<DeadLetterJob> =>
    ({
      id: 'dlq-job-123',
      name: 'failed-job',
      data,
      remove: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    }) as any;

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
    deadLetterQueue = createMockQueue('dead-letter') as jest.Mocked<Queue<DeadLetterJob>>;
    scrapingQueue = createMockQueue('scraping');
    analysisQueue = createMockQueue('analysis');
    reportsQueue = createMockQueue('reports');
    assetUpdatesQueue = createMockQueue('asset-updates');

    const mockMetricsService = {
      setDeadLetterJobsCount: jest.fn(),
      incrementDeadLetterProcessed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadLetterService,
        { provide: getQueueToken('dead-letter'), useValue: deadLetterQueue },
        { provide: getQueueToken('scraping'), useValue: scrapingQueue },
        { provide: getQueueToken('analysis'), useValue: analysisQueue },
        { provide: getQueueToken('reports'), useValue: reportsQueue },
        { provide: getQueueToken('asset-updates'), useValue: assetUpdatesQueue },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<DeadLetterService>(DeadLetterService);
    metricsService = module.get(MetricsService);
  });

  describe('moveToDeadLetter', () => {
    it('should move a failed job to dead letter queue', async () => {
      const originalJob = {
        id: 'original-123',
        name: 'scrape-fundamentus',
        data: { ticker: 'PETR4' },
        attemptsMade: 3,
        queue: { name: 'scraping' },
      } as any;
      const error = new Error('Connection timeout');

      await service.moveToDeadLetter(originalJob, error);

      expect(deadLetterQueue.add).toHaveBeenCalledWith(
        'failed-job',
        expect.objectContaining({
          originalQueue: 'scraping',
          originalJobName: 'scrape-fundamentus',
          originalJobId: 'original-123',
          originalData: { ticker: 'PETR4' },
          error: 'Connection timeout',
          attemptsMade: 3,
        }),
        { attempts: 1 },
      );
    });

    it('should handle string error', async () => {
      const originalJob = {
        id: 'original-123',
        name: 'test-job',
        data: {},
        attemptsMade: 1,
        queue: { name: 'analysis' },
      } as any;
      const error = 'Simple error string';

      await service.moveToDeadLetter(originalJob, error);

      expect(deadLetterQueue.add).toHaveBeenCalledWith(
        'failed-job',
        expect.objectContaining({
          error: 'Simple error string',
          stack: undefined,
        }),
        { attempts: 1 },
      );
    });

    it('should include error stack trace', async () => {
      const originalJob = {
        id: 'original-123',
        name: 'test-job',
        data: {},
        attemptsMade: 2,
        queue: { name: 'reports' },
      } as any;
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at function\n    at caller';

      await service.moveToDeadLetter(originalJob, error);

      expect(deadLetterQueue.add).toHaveBeenCalledWith(
        'failed-job',
        expect.objectContaining({
          stack: expect.stringContaining('Error: Test error'),
        }),
        { attempts: 1 },
      );
    });
  });

  describe('getDeadLetterJobs', () => {
    it('should return waiting jobs by default', async () => {
      const mockJobs = [createMockJob(createDeadLetterJob())];
      deadLetterQueue.getWaiting.mockResolvedValue(mockJobs);

      const result = await service.getDeadLetterJobs();

      expect(result).toEqual(mockJobs);
      expect(deadLetterQueue.getWaiting).toHaveBeenCalled();
    });

    it('should return completed jobs when requested', async () => {
      const mockJobs = [createMockJob(createDeadLetterJob())];
      deadLetterQueue.getCompleted.mockResolvedValue(mockJobs);

      const result = await service.getDeadLetterJobs('completed');

      expect(result).toEqual(mockJobs);
      expect(deadLetterQueue.getCompleted).toHaveBeenCalled();
    });

    it('should return failed jobs when requested', async () => {
      const mockJobs = [createMockJob(createDeadLetterJob())];
      deadLetterQueue.getFailed.mockResolvedValue(mockJobs);

      const result = await service.getDeadLetterJobs('failed');

      expect(result).toEqual(mockJobs);
      expect(deadLetterQueue.getFailed).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', async () => {
      deadLetterQueue.getWaitingCount.mockResolvedValue(5);
      deadLetterQueue.getCompletedCount.mockResolvedValue(10);
      deadLetterQueue.getFailedCount.mockResolvedValue(2);
      deadLetterQueue.getWaiting.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result).toEqual({
        waiting: 5,
        completed: 10,
        failed: 2,
        byOriginalQueue: {},
      });
    });

    it('should calculate breakdown by original queue', async () => {
      const mockJobs = [
        createMockJob(createDeadLetterJob({ originalQueue: 'scraping' })),
        createMockJob(createDeadLetterJob({ originalQueue: 'scraping' })),
        createMockJob(createDeadLetterJob({ originalQueue: 'analysis' })),
      ];
      deadLetterQueue.getWaiting.mockResolvedValue(mockJobs);
      deadLetterQueue.getWaitingCount.mockResolvedValue(3);
      deadLetterQueue.getCompletedCount.mockResolvedValue(0);
      deadLetterQueue.getFailedCount.mockResolvedValue(0);

      const result = await service.getStats();

      expect(result.byOriginalQueue).toEqual({
        scraping: 2,
        analysis: 1,
      });
    });

    it('should update metrics with current counts', async () => {
      deadLetterQueue.getWaitingCount.mockResolvedValue(5);
      deadLetterQueue.getCompletedCount.mockResolvedValue(10);
      deadLetterQueue.getFailedCount.mockResolvedValue(2);
      deadLetterQueue.getWaiting.mockResolvedValue([]);

      await service.getStats();

      expect(metricsService.setDeadLetterJobsCount).toHaveBeenCalledWith('waiting', 'all', 5);
      expect(metricsService.setDeadLetterJobsCount).toHaveBeenCalledWith('completed', 'all', 10);
      expect(metricsService.setDeadLetterJobsCount).toHaveBeenCalledWith('failed', 'all', 2);
    });
  });

  describe('retryJob', () => {
    it('should retry a job from dead letter queue', async () => {
      const deadLetterData = createDeadLetterJob({ originalQueue: 'scraping' });
      const mockJob = createMockJob(deadLetterData);
      deadLetterQueue.getJob.mockResolvedValue(mockJob);

      const result = await service.retryJob('dlq-job-123');

      expect(result).toBe(true);
      expect(scrapingQueue.add).toHaveBeenCalledWith(
        'scrape-fundamentus',
        { ticker: 'PETR4' },
        { attempts: 1 },
      );
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should return false if job not found', async () => {
      deadLetterQueue.getJob.mockResolvedValue(null);

      const result = await service.retryJob('non-existent');

      expect(result).toBe(false);
    });

    it('should return false for unknown queue', async () => {
      const deadLetterData = createDeadLetterJob({ originalQueue: 'unknown-queue' });
      const mockJob = createMockJob(deadLetterData);
      deadLetterQueue.getJob.mockResolvedValue(mockJob);

      const result = await service.retryJob('dlq-job-123');

      expect(result).toBe(false);
    });

    it('should increment retry count', async () => {
      const deadLetterData = createDeadLetterJob({ retryCount: 2 });
      const mockJob = createMockJob(deadLetterData);
      deadLetterQueue.getJob.mockResolvedValue(mockJob);

      await service.retryJob('dlq-job-123');

      expect(deadLetterQueue.add).toHaveBeenCalledWith(
        'retry-failed',
        expect.objectContaining({
          retryCount: 3,
          retriedAt: expect.any(Date),
        }),
      );
    });

    it('should update metrics on retry', async () => {
      const deadLetterData = createDeadLetterJob();
      const mockJob = createMockJob(deadLetterData);
      deadLetterQueue.getJob.mockResolvedValue(mockJob);

      await service.retryJob('dlq-job-123');

      expect(metricsService.incrementDeadLetterProcessed).toHaveBeenCalledWith('retried');
    });

    it('should retry to analysis queue', async () => {
      const deadLetterData = createDeadLetterJob({
        originalQueue: 'analysis',
        originalJobName: 'analyze-asset',
      });
      const mockJob = createMockJob(deadLetterData);
      deadLetterQueue.getJob.mockResolvedValue(mockJob);

      await service.retryJob('dlq-job-123');

      expect(analysisQueue.add).toHaveBeenCalled();
    });

    it('should retry to reports queue', async () => {
      const deadLetterData = createDeadLetterJob({
        originalQueue: 'reports',
        originalJobName: 'generate-report',
      });
      const mockJob = createMockJob(deadLetterData);
      deadLetterQueue.getJob.mockResolvedValue(mockJob);

      await service.retryJob('dlq-job-123');

      expect(reportsQueue.add).toHaveBeenCalled();
    });

    it('should retry to asset-updates queue', async () => {
      const deadLetterData = createDeadLetterJob({
        originalQueue: 'asset-updates',
        originalJobName: 'update-asset',
      });
      const mockJob = createMockJob(deadLetterData);
      deadLetterQueue.getJob.mockResolvedValue(mockJob);

      await service.retryJob('dlq-job-123');

      expect(assetUpdatesQueue.add).toHaveBeenCalled();
    });
  });

  describe('retryAllFromQueue', () => {
    it('should retry all jobs from a specific queue', async () => {
      const mockJobs = [
        createMockJob(createDeadLetterJob({ originalQueue: 'scraping' }), { id: 'job-1' }),
        createMockJob(createDeadLetterJob({ originalQueue: 'scraping' }), { id: 'job-2' }),
        createMockJob(createDeadLetterJob({ originalQueue: 'analysis' }), { id: 'job-3' }),
      ];
      deadLetterQueue.getWaiting.mockResolvedValue(mockJobs);
      deadLetterQueue.getJob.mockImplementation((id) =>
        Promise.resolve(mockJobs.find((j) => j.id === id) || null),
      );

      const result = await service.retryAllFromQueue('scraping');

      expect(result.retried).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should return correct counts when some retries fail', async () => {
      const mockJobs = [
        createMockJob(createDeadLetterJob({ originalQueue: 'unknown' }), { id: 'job-1' }),
        createMockJob(createDeadLetterJob({ originalQueue: 'unknown' }), { id: 'job-2' }),
      ];
      deadLetterQueue.getWaiting.mockResolvedValue(mockJobs);
      deadLetterQueue.getJob.mockImplementation((id) =>
        Promise.resolve(mockJobs.find((j) => j.id === id) || null),
      );

      const result = await service.retryAllFromQueue('unknown');

      expect(result.retried).toBe(0);
      expect(result.failed).toBe(2);
    });

    it('should handle empty result', async () => {
      deadLetterQueue.getWaiting.mockResolvedValue([]);

      const result = await service.retryAllFromQueue('scraping');

      expect(result).toEqual({ retried: 0, failed: 0 });
    });
  });

  describe('clearCompleted', () => {
    it('should clear completed jobs', async () => {
      deadLetterQueue.clean.mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }] as any);

      const result = await service.clearCompleted();

      expect(result).toBe(2);
      expect(deadLetterQueue.clean).toHaveBeenCalledWith(0, 'completed');
    });

    it('should update metrics for each cleared job', async () => {
      deadLetterQueue.clean.mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }, { id: 'job-3' }] as any);

      await service.clearCompleted();

      expect(metricsService.incrementDeadLetterProcessed).toHaveBeenCalledTimes(3);
      expect(metricsService.incrementDeadLetterProcessed).toHaveBeenCalledWith('cleared');
    });

    it('should return 0 when no jobs to clear', async () => {
      deadLetterQueue.clean.mockResolvedValue([]);

      const result = await service.clearCompleted();

      expect(result).toBe(0);
    });
  });

  describe('clearOldJobs', () => {
    it('should clear jobs older than default age', async () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      deadLetterQueue.clean.mockResolvedValue([{ id: 'old-job-1' }] as any);

      const result = await service.clearOldJobs();

      expect(result).toBe(1);
      expect(deadLetterQueue.clean).toHaveBeenCalledWith(sevenDaysMs, 'failed');
    });

    it('should clear jobs older than custom age', async () => {
      const customAgeMs = 1 * 24 * 60 * 60 * 1000; // 1 day
      deadLetterQueue.clean.mockResolvedValue([]);

      await service.clearOldJobs(customAgeMs);

      expect(deadLetterQueue.clean).toHaveBeenCalledWith(customAgeMs, 'failed');
    });
  });
});
