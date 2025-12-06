import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AssetUpdateJobsService } from './asset-update-jobs.service';
import { AppWebSocketGateway } from '../../websocket/websocket.gateway';
import { UpdateTrigger } from '@database/entities';

describe('AssetUpdateJobsService', () => {
  let service: AssetUpdateJobsService;
  let mockQueue: any;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockWebSocketGateway: jest.Mocked<AppWebSocketGateway>;

  const createMockJob = (id: string, state: string = 'completed') => ({
    id,
    name: 'test-job',
    data: { ticker: 'PETR4' },
    remove: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockResolvedValue(state),
    progress: jest.fn().mockReturnValue(50),
    returnvalue: { success: true },
    failedReason: null,
    timestamp: Date.now(),
    processedOn: Date.now(),
    finishedOn: Date.now(),
    attemptsMade: 1,
  });

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 5,
        failed: 1,
        delayed: 0,
      }),
      getWaiting: jest.fn().mockResolvedValue([]),
      getActive: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      getDelayed: jest.fn().mockResolvedValue([]),
      getJob: jest.fn().mockResolvedValue(createMockJob('job-123')),
      clean: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      isPaused: jest.fn().mockResolvedValue(false),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('development'),
    } as any;

    mockWebSocketGateway = {
      emitBatchUpdateStarted: jest.fn(),
      emitBatchUpdateProgress: jest.fn(),
      emitBatchUpdateCompleted: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetUpdateJobsService,
        {
          provide: getQueueToken('asset-updates'),
          useValue: mockQueue,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AppWebSocketGateway,
          useValue: mockWebSocketGateway,
        },
      ],
    }).compile();

    service = module.get<AssetUpdateJobsService>(AssetUpdateJobsService);
  });

  describe('onModuleInit', () => {
    it('should log queue info on initialization', async () => {
      await service.onModuleInit();

      expect(mockQueue.getJobCounts).toHaveBeenCalled();
    });
  });

  describe('scheduleDailyOutdatedUpdate', () => {
    it('should add daily outdated update job to queue', async () => {
      await service.scheduleDailyOutdatedUpdate();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'daily-outdated-update',
        { type: 'daily_outdated' },
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        }),
      );
    });
  });

  describe('scheduleRetryFailed', () => {
    it('should add retry failed job to queue', async () => {
      await service.scheduleRetryFailed();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'retry-failed',
        { type: 'retry_failed' },
        expect.objectContaining({
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
          removeOnComplete: 5,
          removeOnFail: 20,
        }),
      );
    });
  });

  describe('queueSingleAsset', () => {
    it('should add single asset update job to queue', async () => {
      const jobId = await service.queueSingleAsset('PETR4', 'user-123', UpdateTrigger.MANUAL);

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'update-single-asset',
        {
          type: 'single',
          ticker: 'PETR4',
          userId: 'user-123',
          triggeredBy: UpdateTrigger.MANUAL,
        },
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }),
      );
    });

    it('should use default trigger when not specified', async () => {
      await service.queueSingleAsset('VALE3');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'update-single-asset',
        expect.objectContaining({
          ticker: 'VALE3',
          triggeredBy: UpdateTrigger.MANUAL,
        }),
        expect.any(Object),
      );
    });

    it('should handle undefined userId', async () => {
      await service.queueSingleAsset('ITUB4', undefined, UpdateTrigger.CRON);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'update-single-asset',
        expect.objectContaining({
          ticker: 'ITUB4',
          userId: undefined,
          triggeredBy: UpdateTrigger.CRON,
        }),
        expect.any(Object),
      );
    });
  });

  describe('queueMultipleAssets', () => {
    it('should create individual jobs for each asset', async () => {
      const tickers = ['PETR4', 'VALE3', 'ITUB4'];

      await service.queueMultipleAssets(tickers, 'user-123');

      expect(mockQueue.add).toHaveBeenCalledTimes(3);
      expect(mockWebSocketGateway.emitBatchUpdateStarted).toHaveBeenCalledWith({
        totalAssets: 3,
        tickers,
      });
    });

    it('should return first job ID', async () => {
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-1' })
        .mockResolvedValueOnce({ id: 'job-2' })
        .mockResolvedValueOnce({ id: 'job-3' });

      const jobId = await service.queueMultipleAssets(['PETR4', 'VALE3', 'ITUB4']);

      expect(jobId).toBe('job-1');
    });

    it('should handle empty tickers array', async () => {
      const jobId = await service.queueMultipleAssets([]);

      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(mockWebSocketGateway.emitBatchUpdateStarted).toHaveBeenCalledWith({
        totalAssets: 0,
        tickers: [],
      });
    });

    it('should handle WebSocket error gracefully', async () => {
      mockWebSocketGateway.emitBatchUpdateStarted.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      // Should not throw
      await expect(service.queueMultipleAssets(['PETR4'])).resolves.toBeDefined();
    });
  });

  describe('queuePortfolio', () => {
    it('should add portfolio update job to queue', async () => {
      const jobId = await service.queuePortfolio('portfolio-123', 'user-123');

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'update-portfolio',
        {
          type: 'portfolio',
          portfolioId: 'portfolio-123',
          userId: 'user-123',
        },
        expect.objectContaining({
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: 50,
          removeOnFail: 50,
        }),
      );
    });
  });

  describe('queueSector', () => {
    it('should add sector update job to queue', async () => {
      const jobId = await service.queueSector('Petróleo', 'user-123');

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'update-sector',
        {
          type: 'sector',
          sector: 'Petróleo',
          userId: 'user-123',
        },
        expect.objectContaining({
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: 20,
          removeOnFail: 20,
        }),
      );
    });

    it('should handle undefined userId', async () => {
      await service.queueSector('Bancos');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'update-sector',
        expect.objectContaining({
          sector: 'Bancos',
          userId: undefined,
        }),
        expect.any(Object),
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueue.getWaiting.mockResolvedValue([createMockJob('waiting-1', 'waiting')]);
      mockQueue.getActive.mockResolvedValue([createMockJob('active-1', 'active')]);
      mockQueue.getCompleted.mockResolvedValue([createMockJob('completed-1')]);
      mockQueue.getFailed.mockResolvedValue([{
        ...createMockJob('failed-1', 'failed'),
        failedReason: 'Test error',
        attemptsMade: 3,
      }]);
      mockQueue.getDelayed.mockResolvedValue([createMockJob('delayed-1', 'delayed')]);

      const stats = await service.getQueueStats();

      expect(stats.counts).toEqual({
        waiting: 0,
        active: 0,
        completed: 5,
        failed: 1,
        delayed: 0,
      });
      expect(stats.waiting).toBe(1);
      expect(stats.active).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.delayed).toBe(1);
    });

    it('should include job details', async () => {
      const waitingJob = createMockJob('waiting-1', 'waiting');
      mockQueue.getWaiting.mockResolvedValue([waitingJob]);
      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getCompleted.mockResolvedValue([]);
      mockQueue.getFailed.mockResolvedValue([]);
      mockQueue.getDelayed.mockResolvedValue([]);

      const stats = await service.getQueueStats();

      expect(stats.jobs.waiting).toHaveLength(1);
      expect(stats.jobs.waiting[0]).toEqual({
        id: 'waiting-1',
        name: 'test-job',
        data: { ticker: 'PETR4' },
      });
    });
  });

  describe('cleanOldJobs', () => {
    it('should clean completed and failed jobs older than 7 days', async () => {
      await service.cleanOldJobs();

      const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
      expect(mockQueue.clean).toHaveBeenCalledWith(sevenDaysMs, 'completed');
      expect(mockQueue.clean).toHaveBeenCalledWith(sevenDaysMs, 'failed');
    });
  });

  describe('pauseQueue', () => {
    it('should pause the queue', async () => {
      await service.pauseQueue();

      expect(mockQueue.pause).toHaveBeenCalled();
    });
  });

  describe('resumeQueue', () => {
    it('should resume the queue', async () => {
      await service.resumeQueue();

      expect(mockQueue.resume).toHaveBeenCalled();
    });
  });

  describe('cancelAllPendingJobs', () => {
    it('should remove all waiting jobs', async () => {
      const waitingJobs = [
        createMockJob('waiting-1'),
        createMockJob('waiting-2'),
        createMockJob('waiting-3'),
      ];
      mockQueue.getWaiting.mockResolvedValue(waitingJobs);
      mockQueue.getActive.mockResolvedValue([createMockJob('active-1')]);

      const result = await service.cancelAllPendingJobs();

      expect(result.removedWaitingJobs).toBe(3);
      expect(result.activeJobsInProgress).toBe(1);
      expect(waitingJobs[0].remove).toHaveBeenCalled();
      expect(waitingJobs[1].remove).toHaveBeenCalled();
      expect(waitingJobs[2].remove).toHaveBeenCalled();
    });

    it('should emit WebSocket completion event', async () => {
      mockQueue.getWaiting.mockResolvedValue([createMockJob('waiting-1')]);
      mockQueue.getActive.mockResolvedValue([]);

      await service.cancelAllPendingJobs();

      expect(mockWebSocketGateway.emitBatchUpdateCompleted).toHaveBeenCalledWith({
        totalAssets: 1,
        successCount: 0,
        failedCount: 0,
        duration: 0,
      });
    });

    it('should handle empty queues', async () => {
      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.getActive.mockResolvedValue([]);

      const result = await service.cancelAllPendingJobs();

      expect(result.removedWaitingJobs).toBe(0);
      expect(result.activeJobsInProgress).toBe(0);
    });
  });

  describe('isQueuePaused', () => {
    it('should return true when queue is paused', async () => {
      mockQueue.isPaused.mockResolvedValue(true);

      const result = await service.isQueuePaused();

      expect(result).toBe(true);
    });

    it('should return false when queue is running', async () => {
      mockQueue.isPaused.mockResolvedValue(false);

      const result = await service.isQueuePaused();

      expect(result).toBe(false);
    });
  });

  describe('getJobStatus', () => {
    it('should return job status when job exists', async () => {
      const mockJob = createMockJob('job-123', 'completed');
      mockQueue.getJob.mockResolvedValue(mockJob);

      const status = await service.getJobStatus('job-123');

      expect(status.jobId).toBe('job-123');
      expect(status.status).toBe('completed');
      expect(status.progress).toBe(50);
      expect(status.result).toEqual({ success: true });
      expect(status.attemptsMade).toBe(1);
    });

    it('should return not_found when job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const status = await service.getJobStatus('nonexistent');

      expect(status.status).toBe('not_found');
      expect(status.message).toBe('Job not found');
    });

    it('should include failed reason for failed jobs', async () => {
      const failedJob = {
        ...createMockJob('failed-job', 'failed'),
        failedReason: 'Connection timeout',
      };
      mockQueue.getJob.mockResolvedValue(failedJob);

      const status = await service.getJobStatus('failed-job');

      expect(status.status).toBe('failed');
      expect(status.failedReason).toBe('Connection timeout');
    });

    it('should handle null processedOn', async () => {
      const pendingJob = {
        ...createMockJob('pending-job', 'waiting'),
        processedOn: null,
        finishedOn: null,
      };
      mockQueue.getJob.mockResolvedValue(pendingJob);

      const status = await service.getJobStatus('pending-job');

      expect(status.processedOn).toBeNull();
      expect(status.finishedOn).toBeNull();
    });
  });

  describe('environment configuration', () => {
    it('should detect production environment', async () => {
      mockConfigService.get.mockReturnValue('production');

      const prodModule: TestingModule = await Test.createTestingModule({
        providers: [
          AssetUpdateJobsService,
          {
            provide: getQueueToken('asset-updates'),
            useValue: mockQueue,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: AppWebSocketGateway,
            useValue: mockWebSocketGateway,
          },
        ],
      }).compile();

      const prodService = prodModule.get<AssetUpdateJobsService>(AssetUpdateJobsService);

      expect(prodService).toBeDefined();
    });

    it('should detect staging environment', async () => {
      mockConfigService.get.mockReturnValue('staging');

      const stagingModule: TestingModule = await Test.createTestingModule({
        providers: [
          AssetUpdateJobsService,
          {
            provide: getQueueToken('asset-updates'),
            useValue: mockQueue,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: AppWebSocketGateway,
            useValue: mockWebSocketGateway,
          },
        ],
      }).compile();

      const stagingService = stagingModule.get<AssetUpdateJobsService>(AssetUpdateJobsService);

      expect(stagingService).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle queue add failure', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue unavailable'));

      await expect(service.queueSingleAsset('PETR4')).rejects.toThrow('Queue unavailable');
    });

    it('should handle concurrent queue operations', async () => {
      const results = await Promise.all([
        service.queueSingleAsset('PETR4'),
        service.queueSingleAsset('VALE3'),
        service.queueSingleAsset('ITUB4'),
      ]);

      expect(results).toHaveLength(3);
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should handle large batch of tickers', async () => {
      const tickers = Array.from({ length: 100 }, (_, i) => `TICK${i}`);

      await service.queueMultipleAssets(tickers);

      expect(mockQueue.add).toHaveBeenCalledTimes(100);
      expect(mockWebSocketGateway.emitBatchUpdateStarted).toHaveBeenCalledWith({
        totalAssets: 100,
        tickers,
      });
    });

    it('should handle special characters in sector name', async () => {
      await service.queueSector('Petróleo & Gás');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'update-sector',
        expect.objectContaining({
          sector: 'Petróleo & Gás',
        }),
        expect.any(Object),
      );
    });
  });
});
