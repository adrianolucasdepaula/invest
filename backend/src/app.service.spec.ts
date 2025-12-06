import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'test';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const health = service.getHealth();

      expect(health.status).toBe('ok');
      expect(health.version).toBe('1.0.0');
      expect(health.environment).toBe('test');
    });

    it('should return valid timestamp', () => {
      const health = service.getHealth();

      expect(health.timestamp).toBeDefined();
      const date = new Date(health.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should return uptime as a number', () => {
      const health = service.getHealth();

      expect(typeof health.uptime).toBe('number');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should use NODE_ENV from config', () => {
      const health = service.getHealth();

      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(health.environment).toBe('test');
    });

    it('should return all required fields', () => {
      const health = service.getHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('environment');
      expect(health).toHaveProperty('version');
    });
  });
});
