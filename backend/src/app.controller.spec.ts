import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;

  const mockHealthResponse = {
    status: 'ok',
    timestamp: '2025-12-06T10:00:00.000Z',
    uptime: 12345,
    environment: 'test',
    version: '1.0.0',
  };

  beforeEach(async () => {
    const mockAppService = {
      getHealth: jest.fn().mockReturnValue(mockHealthResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    appService = module.get(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status from AppService', () => {
      const result = controller.getHealth();

      expect(result).toEqual(mockHealthResponse);
      expect(appService.getHealth).toHaveBeenCalled();
    });

    it('should return status ok', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
    });

    it('should return version', () => {
      const result = controller.getHealth();

      expect(result.version).toBe('1.0.0');
    });

    it('should return environment', () => {
      const result = controller.getHealth();

      expect(result.environment).toBe('test');
    });

    it('should return timestamp', () => {
      const result = controller.getHealth();

      expect(result.timestamp).toBeDefined();
    });

    it('should return uptime', () => {
      const result = controller.getHealth();

      expect(result.uptime).toBe(12345);
    });
  });

  describe('getRoot', () => {
    it('should return API info', () => {
      const result = controller.getRoot();

      expect(result).toEqual({
        message: 'B3 Investment Analysis Platform API',
        version: '1.0.0',
        docs: '/api/docs',
      });
    });

    it('should return message', () => {
      const result = controller.getRoot();

      expect(result.message).toBe('B3 Investment Analysis Platform API');
    });

    it('should return version 1.0.0', () => {
      const result = controller.getRoot();

      expect(result.version).toBe('1.0.0');
    });

    it('should return docs path', () => {
      const result = controller.getRoot();

      expect(result.docs).toBe('/api/docs');
    });

    it('should have all required properties', () => {
      const result = controller.getRoot();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('docs');
    });
  });
});
