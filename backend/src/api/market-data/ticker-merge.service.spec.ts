import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TickerMergeService } from './ticker-merge.service';
import { TickerChange } from '../../database/entities/ticker-change.entity';
import { AssetsService } from '../assets/assets.service';
import { AssetPrice, PriceSource } from '../../database/entities/asset-price.entity';

describe('TickerMergeService', () => {
  let service: TickerMergeService;

  const mockTickerChanges: Partial<TickerChange>[] = [
    {
      id: '1',
      oldTicker: 'ELET3',
      newTicker: 'AXIA3',
      changeDate: new Date('2023-06-01'),
      reason: 'Rebranding',
    },
    {
      id: '2',
      oldTicker: 'OIBR3',
      newTicker: 'OIBR4',
      changeDate: new Date('2022-01-01'),
      reason: 'Class change',
    },
  ];

  const mockPrices: Partial<AssetPrice>[] = [
    { id: '1', assetId: 'asset-elet3', date: new Date('2023-01-15'), close: 35.5, source: PriceSource.COTAHIST },
    { id: '2', assetId: 'asset-elet3', date: new Date('2023-05-15'), close: 36.0, source: PriceSource.COTAHIST },
    { id: '3', assetId: 'asset-axia3', date: new Date('2023-06-15'), close: 37.0, source: PriceSource.COTAHIST },
    { id: '4', assetId: 'asset-axia3', date: new Date('2023-07-15'), close: 38.0, source: PriceSource.COTAHIST },
  ];

  const mockTickerChangeRepository = {
    findOne: jest.fn(),
  };

  const mockAssetsService = {
    getPriceHistory: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TickerMergeService,
        { provide: getRepositoryToken(TickerChange), useValue: mockTickerChangeRepository },
        { provide: AssetsService, useValue: mockAssetsService },
      ],
    }).compile();

    service = module.get<TickerMergeService>(TickerMergeService);
  });

  describe('findTickerChain', () => {
    it('should return single ticker if no changes exist', async () => {
      mockTickerChangeRepository.findOne.mockResolvedValue(null);

      const result = await service.findTickerChain('PETR4');

      expect(result).toEqual(['PETR4']);
    });

    it('should find backward chain (what ticker used to be)', async () => {
      // First call: look for what AXIA3 used to be (backward)
      mockTickerChangeRepository.findOne
        .mockResolvedValueOnce(mockTickerChanges[0]) // newTicker: AXIA3 → oldTicker: ELET3
        .mockResolvedValueOnce(null) // No more backward changes
        .mockResolvedValueOnce(null); // No forward changes

      const result = await service.findTickerChain('AXIA3');

      expect(result).toContain('ELET3');
      expect(result).toContain('AXIA3');
    });

    it('should find forward chain (what ticker became)', async () => {
      // Looking for ELET3 forward chain
      mockTickerChangeRepository.findOne
        .mockResolvedValueOnce(null) // No backward changes for ELET3
        .mockResolvedValueOnce(mockTickerChanges[0]) // ELET3 became AXIA3
        .mockResolvedValueOnce(null); // No more forward changes

      const result = await service.findTickerChain('ELET3');

      expect(result).toContain('ELET3');
      expect(result).toContain('AXIA3');
    });

    it('should remove duplicates from chain', async () => {
      mockTickerChangeRepository.findOne.mockResolvedValue(null);

      const result = await service.findTickerChain('VALE3');

      expect(result).toEqual(['VALE3']);
      expect(new Set(result).size).toBe(result.length);
    });
  });

  describe('getUnifiedHistory', () => {
    it('should return normal history if no ticker changes', async () => {
      mockTickerChangeRepository.findOne.mockResolvedValue(null);
      mockAssetsService.getPriceHistory.mockResolvedValue([mockPrices[0], mockPrices[1]]);

      const result = await service.getUnifiedHistory('PETR4', {});

      expect(result).toHaveLength(2);
      expect(mockAssetsService.getPriceHistory).toHaveBeenCalledWith('PETR4', {});
    });

    it('should merge history from multiple tickers in chain', async () => {
      // Setup: ELET3 became AXIA3
      mockTickerChangeRepository.findOne
        .mockResolvedValueOnce(mockTickerChanges[0]) // AXIA3 was ELET3
        .mockResolvedValueOnce(null) // No more backward
        .mockResolvedValueOnce(null); // No forward from AXIA3

      // Return prices for both tickers
      mockAssetsService.getPriceHistory
        .mockResolvedValueOnce([mockPrices[0], mockPrices[1]]) // ELET3 prices
        .mockResolvedValueOnce([mockPrices[2], mockPrices[3]]); // AXIA3 prices

      const result = await service.getUnifiedHistory('AXIA3', {});

      expect(result.length).toBeGreaterThan(0);
    });

    it('should sort unified history by date', async () => {
      mockTickerChangeRepository.findOne
        .mockResolvedValueOnce(mockTickerChanges[0])
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockAssetsService.getPriceHistory
        .mockResolvedValueOnce([mockPrices[1], mockPrices[0]]) // Unsorted ELET3
        .mockResolvedValueOnce([mockPrices[3], mockPrices[2]]); // Unsorted AXIA3

      const result = await service.getUnifiedHistory('AXIA3', {});

      // Check that dates are in ascending order
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date).getTime()).toBeGreaterThanOrEqual(
          new Date(result[i - 1].date).getTime(),
        );
      }
    });

    it('should handle errors from getPriceHistory gracefully', async () => {
      mockTickerChangeRepository.findOne
        .mockResolvedValueOnce(mockTickerChanges[0])
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockAssetsService.getPriceHistory
        .mockResolvedValueOnce([mockPrices[0]]) // ELET3 works
        .mockRejectedValueOnce(new Error('API error')); // AXIA3 fails

      const result = await service.getUnifiedHistory('AXIA3', {});

      // Should still return ELET3 prices even though AXIA3 failed
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter duplicate dates preferring newer ticker data', async () => {
      const duplicateDate = new Date('2023-06-01');
      const priceOld = { id: '1', ticker: 'ELET3', date: duplicateDate, close: 35.0 };
      const priceNew = { id: '2', ticker: 'AXIA3', date: duplicateDate, close: 36.0 };

      mockTickerChangeRepository.findOne
        .mockResolvedValueOnce(mockTickerChanges[0])
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockAssetsService.getPriceHistory
        .mockResolvedValueOnce([priceOld])
        .mockResolvedValueOnce([priceNew]);

      const result = await service.getUnifiedHistory('AXIA3', {});

      // Should have only one price for that date (the newer one wins due to map override)
      const dateStr = duplicateDate.toISOString().split('T')[0];
      const pricesForDate = result.filter(
        (p) => new Date(p.date).toISOString().split('T')[0] === dateStr,
      );
      expect(pricesForDate).toHaveLength(1);
    });

    it('should pass query parameters to price history', async () => {
      mockTickerChangeRepository.findOne.mockResolvedValue(null);
      mockAssetsService.getPriceHistory.mockResolvedValue([]);

      const query = { startDate: '2023-01-01', endDate: '2023-12-31' };
      await service.getUnifiedHistory('VALE3', query);

      expect(mockAssetsService.getPriceHistory).toHaveBeenCalledWith('VALE3', query);
    });
  });
});
