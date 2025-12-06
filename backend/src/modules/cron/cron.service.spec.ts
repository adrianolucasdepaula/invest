import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { MarketDataService } from '../../api/market-data/market-data.service';

describe('CronService', () => {
  let service: CronService;
  let marketDataService: MarketDataService;

  const mockMarketDataService = {
    syncHistoricalDataFromCotahist: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        {
          provide: MarketDataService,
          useValue: mockMarketDataService,
        },
      ],
    }).compile();

    service = module.get<CronService>(CronService);
    marketDataService = module.get<MarketDataService>(MarketDataService);
  });

  describe('handleDailyCotahistSync', () => {
    it('should sync all 5 active tickers', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      await service.handleDailyCotahistSync();

      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledTimes(5);
    });

    it('should sync with current year', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);
      const currentYear = new Date().getFullYear();

      await service.handleDailyCotahistSync();

      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledWith(
        expect.any(String),
        currentYear,
        currentYear,
      );
    });

    it('should sync ABEV3', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      await service.handleDailyCotahistSync();

      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledWith(
        'ABEV3',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should sync VALE3', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      await service.handleDailyCotahistSync();

      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledWith(
        'VALE3',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should sync PETR4', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      await service.handleDailyCotahistSync();

      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledWith(
        'PETR4',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should sync ITUB4', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      await service.handleDailyCotahistSync();

      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledWith(
        'ITUB4',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should sync BBDC4', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      await service.handleDailyCotahistSync();

      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledWith(
        'BBDC4',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should continue on individual ticker failure', async () => {
      // First ticker fails, others succeed
      mockMarketDataService.syncHistoricalDataFromCotahist
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      // Should not throw
      await expect(service.handleDailyCotahistSync()).resolves.not.toThrow();

      // All 5 tickers should have been attempted
      expect(mockMarketDataService.syncHistoricalDataFromCotahist).toHaveBeenCalledTimes(5);
    });

    it('should handle multiple failures gracefully', async () => {
      // All tickers fail
      mockMarketDataService.syncHistoricalDataFromCotahist.mockRejectedValue(
        new Error('API unavailable'),
      );

      // Should not throw
      await expect(service.handleDailyCotahistSync()).resolves.not.toThrow();
    });
  });

  describe('triggerDailySyncManually', () => {
    it('should return success result when all syncs succeed', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      const result = await service.triggerDailySyncManually();

      expect(result.success).toBe(true);
      expect(result.details.successCount).toBe(5);
      expect(result.details.failureCount).toBe(0);
      expect(result.details.totalTickers).toBe(5);
      expect(result.details.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return partial success result when some syncs fail', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist
        .mockResolvedValueOnce(undefined) // ABEV3 success
        .mockRejectedValueOnce(new Error('Error')) // VALE3 fail
        .mockResolvedValueOnce(undefined) // PETR4 success
        .mockResolvedValueOnce(undefined) // ITUB4 success
        .mockResolvedValueOnce(undefined); // BBDC4 success

      const result = await service.triggerDailySyncManually();

      expect(result.success).toBe(false);
      expect(result.details.successCount).toBe(4);
      expect(result.details.failureCount).toBe(1);
    });

    it('should return failure result when all syncs fail', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockRejectedValue(
        new Error('Complete failure'),
      );

      const result = await service.triggerDailySyncManually();

      expect(result.success).toBe(false);
      expect(result.details.successCount).toBe(0);
      expect(result.details.failureCount).toBe(5);
    });

    it('should include duration in result', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      const result = await service.triggerDailySyncManually();

      expect(typeof result.details.duration).toBe('number');
      expect(result.details.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include message in result', async () => {
      mockMarketDataService.syncHistoricalDataFromCotahist.mockResolvedValue(undefined);

      const result = await service.triggerDailySyncManually();

      expect(result.message).toContain('5/5');
      expect(result.message).toContain('ms');
    });
  });
});
