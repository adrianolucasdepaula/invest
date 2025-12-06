import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from '../../database/entities/portfolio.entity';
import { PortfolioPosition } from '../../database/entities/portfolio-position.entity';
import { Asset, AssetType } from '../../database/entities/asset.entity';
import { B3Parser } from './parsers/b3-parser';
import { KinvoParser } from './parsers/kinvo-parser';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockPortfolio: Partial<Portfolio> = {
    id: 'portfolio-1',
    userId: 'user-1',
    name: 'Test Portfolio',
    description: 'Test description',
    totalInvested: 10000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPosition: Partial<PortfolioPosition> = {
    id: 'position-1',
    portfolioId: 'portfolio-1',
    assetId: 'asset-1',
    quantity: 100,
    averagePrice: 25.5,
    totalInvested: 2550,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAsset: Partial<Asset> = {
    id: 'asset-1',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: AssetType.STOCK,
    isActive: true,
  };

  const mockPortfolioRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockPositionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockAssetRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockB3Parser = {
    source: 'B3',
    canParse: jest.fn(),
    parse: jest.fn(),
  };

  const mockKinvoParser = {
    source: 'Kinvo',
    canParse: jest.fn(),
    parse: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: getRepositoryToken(Portfolio), useValue: mockPortfolioRepository },
        { provide: getRepositoryToken(PortfolioPosition), useValue: mockPositionRepository },
        { provide: getRepositoryToken(Asset), useValue: mockAssetRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: B3Parser, useValue: mockB3Parser },
        { provide: KinvoParser, useValue: mockKinvoParser },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  describe('findUserPortfolios', () => {
    it('should return all portfolios for a user', async () => {
      mockPortfolioRepository.find.mockResolvedValue([mockPortfolio]);

      const result = await service.findUserPortfolios('user-1');

      expect(result).toEqual([mockPortfolio]);
      expect(mockPortfolioRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['positions', 'positions.asset'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array if no portfolios', async () => {
      mockPortfolioRepository.find.mockResolvedValue([]);

      const result = await service.findUserPortfolios('user-2');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return portfolio by id and userId', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);

      const result = await service.findOne('portfolio-1', 'user-1');

      expect(result).toEqual(mockPortfolio);
      expect(mockPortfolioRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'portfolio-1', userId: 'user-1' },
        relations: ['positions', 'positions.asset'],
      });
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new portfolio', async () => {
      const createData = { name: 'New Portfolio', description: 'New description' };
      mockPortfolioRepository.create.mockReturnValue({ ...createData, userId: 'user-1' });
      mockPortfolioRepository.save.mockResolvedValue({ id: 'new-id', ...createData, userId: 'user-1' });

      const result = await service.create('user-1', createData);

      expect(result.id).toBe('new-id');
      expect(mockPortfolioRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        ...createData,
      });
    });

    it('should handle array return from save', async () => {
      const createData = { name: 'Portfolio' };
      mockPortfolioRepository.create.mockReturnValue({ ...createData, userId: 'user-1' });
      mockPortfolioRepository.save.mockResolvedValue([{ id: 'new-id', ...createData, userId: 'user-1' }]);

      const result = await service.create('user-1', createData);

      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update existing portfolio', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue({ ...mockPortfolio });
      mockPortfolioRepository.save.mockResolvedValue({ ...mockPortfolio, name: 'Updated' });

      const result = await service.update('portfolio-1', 'user-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', 'user-1', {})).rejects.toThrow('Portfolio not found');
    });
  });

  describe('remove', () => {
    it('should remove portfolio', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockPortfolioRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('portfolio-1', 'user-1')).resolves.not.toThrow();
      expect(mockPortfolioRepository.remove).toHaveBeenCalledWith(mockPortfolio);
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow('Portfolio not found');
    });
  });

  describe('addPosition', () => {
    it('should add position to portfolio with existing asset', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockPositionRepository.create.mockReturnValue(mockPosition);
      mockPositionRepository.save.mockResolvedValue(mockPosition);

      const result = await service.addPosition('portfolio-1', 'user-1', {
        ticker: 'PETR4',
        quantity: 100,
        averagePrice: 25.5,
      });

      expect(result).toEqual(mockPosition);
    });

    it('should create new asset if not exists', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockAssetRepository.findOne.mockResolvedValue(null);
      mockAssetRepository.create.mockReturnValue(mockAsset);
      mockAssetRepository.save.mockResolvedValue(mockAsset);
      mockPositionRepository.create.mockReturnValue(mockPosition);
      mockPositionRepository.save.mockResolvedValue(mockPosition);

      await service.addPosition('portfolio-1', 'user-1', {
        ticker: 'NEWASSET3',
        quantity: 50,
        averagePrice: 10,
      });

      expect(mockAssetRepository.create).toHaveBeenCalled();
      expect(mockAssetRepository.save).toHaveBeenCalled();
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addPosition('non-existent', 'user-1', { ticker: 'PETR4', quantity: 100, averagePrice: 25 }),
      ).rejects.toThrow('Portfolio not found');
    });
  });

  describe('updatePosition', () => {
    it('should update position', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockPositionRepository.findOne.mockResolvedValue({ ...mockPosition });
      mockPositionRepository.save.mockResolvedValue({ ...mockPosition, quantity: 200 });

      const result = await service.updatePosition('portfolio-1', 'position-1', 'user-1', {
        quantity: 200,
        averagePrice: 30,
      });

      expect(result.quantity).toBe(200);
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePosition('non-existent', 'position-1', 'user-1', {}),
      ).rejects.toThrow('Portfolio not found');
    });

    it('should throw error if position not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockPositionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePosition('portfolio-1', 'non-existent', 'user-1', {}),
      ).rejects.toThrow('Position not found');
    });
  });

  describe('removePosition', () => {
    it('should remove position', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockPositionRepository.findOne.mockResolvedValue(mockPosition);
      mockPositionRepository.remove.mockResolvedValue(undefined);

      await expect(
        service.removePosition('portfolio-1', 'position-1', 'user-1'),
      ).resolves.not.toThrow();
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removePosition('non-existent', 'position-1', 'user-1'),
      ).rejects.toThrow('Portfolio not found');
    });

    it('should throw error if position not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockPositionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removePosition('portfolio-1', 'non-existent', 'user-1'),
      ).rejects.toThrow('Position not found');
    });
  });

  describe('importFromFile', () => {
    it('should import portfolio from file', async () => {
      const mockFileBuffer = Buffer.from('test');
      const mockParsedPortfolio = {
        source: 'B3',
        totalInvested: 5000,
        positions: [
          { ticker: 'PETR4', quantity: 100, averagePrice: 25, totalInvested: 2500 },
          { ticker: 'VALE3', quantity: 50, averagePrice: 50, totalInvested: 2500 },
        ],
        metadata: {},
      };

      mockB3Parser.canParse.mockReturnValue(true);
      mockB3Parser.parse.mockResolvedValue(mockParsedPortfolio);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          save: jest.fn().mockImplementation((entity, data) => {
            if (entity === Portfolio) return { id: 'new-portfolio', ...data };
            if (entity === Asset) return Array.isArray(data) ? data.map((d, i) => ({ id: `asset-${i}`, ...d })) : { id: 'asset-1', ...data };
            return data;
          }),
          find: jest.fn().mockResolvedValue([mockAsset]),
        };
        return callback(mockManager);
      });

      const result = await service.importFromFile('user-1', mockFileBuffer, 'portfolio.csv');

      expect(result.success).toBe(true);
      expect(result.source).toBe('B3');
      expect(result.positionsCount).toBe(2);
    });

    it('should throw error if no parser found', async () => {
      mockB3Parser.canParse.mockReturnValue(false);
      mockKinvoParser.canParse.mockReturnValue(false);

      await expect(
        service.importFromFile('user-1', Buffer.from('test'), 'unknown.xyz'),
      ).rejects.toThrow('No parser found');
    });
  });

  describe('getAssetType', () => {
    it('should detect FII type for tickers ending in 11', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockAssetRepository.findOne.mockResolvedValue(null);
      mockAssetRepository.create.mockImplementation((data) => data);
      mockAssetRepository.save.mockImplementation((data) => ({ id: 'new', ...data }));
      mockPositionRepository.create.mockReturnValue(mockPosition);
      mockPositionRepository.save.mockResolvedValue(mockPosition);

      await service.addPosition('portfolio-1', 'user-1', {
        ticker: 'HGLG11',
        quantity: 10,
        averagePrice: 100,
      });

      expect(mockAssetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: AssetType.FII }),
      );
    });

    it('should detect STOCK type for regular tickers', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockAssetRepository.findOne.mockResolvedValue(null);
      mockAssetRepository.create.mockImplementation((data) => data);
      mockAssetRepository.save.mockImplementation((data) => ({ id: 'new', ...data }));
      mockPositionRepository.create.mockReturnValue(mockPosition);
      mockPositionRepository.save.mockResolvedValue(mockPosition);

      await service.addPosition('portfolio-1', 'user-1', {
        ticker: 'PETR4',
        quantity: 10,
        averagePrice: 25,
      });

      expect(mockAssetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: AssetType.STOCK }),
      );
    });
  });
});
