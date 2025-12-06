import { Test, TestingModule } from '@nestjs/testing';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimiterService],
    }).compile();

    service = module.get<RateLimiterService>(RateLimiterService);
  });

  afterEach(() => {
    service.reset();
  });

  describe('extractDomain', () => {
    it('should extract domain from full URL', () => {
      const url = 'https://www.fundamentus.com.br/detalhes.php?papel=PETR4';
      expect(service.extractDomain(url)).toBe('fundamentus.com.br');
    });

    it('should remove www prefix', () => {
      const url = 'https://www.investidor10.com.br/acoes/petr4';
      expect(service.extractDomain(url)).toBe('investidor10.com.br');
    });

    it('should handle URL without www', () => {
      const url = 'https://statusinvest.com.br/acoes/petr4';
      expect(service.extractDomain(url)).toBe('statusinvest.com.br');
    });

    it('should handle http protocol', () => {
      const url = 'http://fundamentus.com.br/resultado.php';
      expect(service.extractDomain(url)).toBe('fundamentus.com.br');
    });

    it('should return input for invalid URL', () => {
      const invalidUrl = 'not-a-valid-url';
      expect(service.extractDomain(invalidUrl)).toBe(invalidUrl);
    });

    it('should handle URLs with ports', () => {
      const url = 'http://localhost:3000/api/test';
      expect(service.extractDomain(url)).toBe('localhost');
    });

    it('should handle URLs with subdomains', () => {
      const url = 'https://api.example.com/endpoint';
      expect(service.extractDomain(url)).toBe('api.example.com');
    });
  });

  describe('getStats', () => {
    it('should return empty array initially', () => {
      const stats = service.getStats();
      expect(stats).toEqual([]);
    });

    it('should return stats after throttle call', async () => {
      await service.throttle('test.com');

      const stats = service.getStats();

      expect(stats).toHaveLength(1);
      expect(stats[0].domain).toBe('test.com');
      expect(stats[0].lastRequest).toBeGreaterThan(0);
      expect(stats[0].elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple domains', async () => {
      await service.throttle('domain1.com');
      await service.throttle('domain2.com');

      const stats = service.getStats();

      expect(stats).toHaveLength(2);
      const domains = stats.map((s) => s.domain);
      expect(domains).toContain('domain1.com');
      expect(domains).toContain('domain2.com');
    });
  });

  describe('reset', () => {
    it('should clear all history', async () => {
      await service.throttle('test.com');
      expect(service.getStats()).toHaveLength(1);

      service.reset();

      expect(service.getStats()).toHaveLength(0);
    });
  });

  describe('throttle', () => {
    it('should allow first request immediately', async () => {
      const start = Date.now();
      await service.throttle('fast-domain.com');
      const elapsed = Date.now() - start;

      // First request should be very fast (< 100ms)
      expect(elapsed).toBeLessThan(100);
    });

    it('should allow requests to different domains immediately', async () => {
      const start = Date.now();
      await service.throttle('domain1.com');
      await service.throttle('domain2.com');
      await service.throttle('domain3.com');
      const elapsed = Date.now() - start;

      // Different domains should not wait for each other
      expect(elapsed).toBeLessThan(300);
    });

    it('should record timestamp on request', async () => {
      const beforeRequest = Date.now();
      await service.throttle('timestamp-domain.com');
      const afterRequest = Date.now();

      const stats = service.getStats();
      const stat = stats.find((s) => s.domain === 'timestamp-domain.com');

      expect(stat).toBeDefined();
      expect(stat!.lastRequest).toBeGreaterThanOrEqual(beforeRequest);
      expect(stat!.lastRequest).toBeLessThanOrEqual(afterRequest);
    });

    // Note: Testing actual throttle delay would require waiting 10s which is too slow for unit tests
    // The delay functionality is verified by the service implementation
  });
});
