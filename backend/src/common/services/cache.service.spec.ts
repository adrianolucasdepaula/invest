import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      reset: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value on cache hit', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return null on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return null on error', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 60; // 60 seconds
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 60000); // TTL in ms
    });

    it('should handle set error gracefully', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(service.set('key', 'value')).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete value from cache', async () => {
      const key = 'test-key';
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.del(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should handle delete error gracefully', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(service.del('key')).resolves.toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should call store reset', async () => {
      mockCacheManager.store.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(mockCacheManager.store.reset).toHaveBeenCalled();
    });

    it('should handle missing reset method', async () => {
      const cacheWithoutReset = { store: {} };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: CACHE_MANAGER,
            useValue: cacheWithoutReset,
          },
        ],
      }).compile();

      const serviceWithoutReset = module.get<CacheService>(CacheService);

      // Should not throw
      await expect(serviceWithoutReset.reset()).resolves.toBeUndefined();
    });
  });

  describe('wrap', () => {
    it('should return cached value without calling callback', async () => {
      const cachedValue = { data: 'cached' };
      mockCacheManager.get.mockResolvedValue(cachedValue);
      const callback = jest.fn().mockResolvedValue({ data: 'fresh' });

      const result = await service.wrap('key', callback);

      expect(result).toEqual(cachedValue);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback and cache result on cache miss', async () => {
      const freshValue = { data: 'fresh' };
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockResolvedValue(undefined);
      const callback = jest.fn().mockResolvedValue(freshValue);

      const result = await service.wrap('key', callback, 60);

      expect(result).toEqual(freshValue);
      expect(callback).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith('key', freshValue, 60000);
    });

    it('should propagate callback error', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const callback = jest.fn().mockRejectedValue(new Error('Callback error'));

      await expect(service.wrap('key', callback)).rejects.toThrow('Callback error');
    });
  });

  describe('invalidatePattern', () => {
    it('should not throw', async () => {
      await expect(service.invalidatePattern('test:*')).resolves.toBeUndefined();
    });
  });

  describe('generateKey', () => {
    it('should generate key with prefix only', () => {
      const key = service.generateKey('cache');
      expect(key).toBe('cache');
    });

    it('should generate key with prefix and string parts', () => {
      const key = service.generateKey('asset', 'PETR4', 'fundamental');
      expect(key).toBe('asset:PETR4:fundamental');
    });

    it('should generate key with numbers', () => {
      const key = service.generateKey('page', 1, 10);
      expect(key).toBe('page:1:10');
    });

    it('should serialize objects in key', () => {
      const key = service.generateKey('query', { ticker: 'PETR4', limit: 10 });
      expect(key).toBe('query:{"ticker":"PETR4","limit":10}');
    });

    it('should handle mixed types', () => {
      const key = service.generateKey('data', 'PETR4', 123, { type: 'daily' });
      expect(key).toBe('data:PETR4:123:{"type":"daily"}');
    });

    it('should handle empty parts array', () => {
      const key = service.generateKey('prefix');
      expect(key).toBe('prefix');
    });
  });
});
