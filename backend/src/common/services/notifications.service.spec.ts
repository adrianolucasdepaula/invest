import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  NotificationsService,
  NotificationType,
  Notification,
} from './notifications.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        EMAIL_ENABLED: false,
        TELEGRAM_ENABLED: true,
        TELEGRAM_BOT_TOKEN: 'test-bot-token',
        TELEGRAM_CHAT_ID: 'test-chat-id',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
    mockedAxios.post.mockResolvedValue({ data: { ok: true } });
  });

  describe('send', () => {
    it('should send notification to Telegram when enabled', async () => {
      const notification: Notification = {
        type: NotificationType.PRICE_ALERT,
        title: 'Test Alert',
        message: 'Test message',
      };

      await service.send(notification);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/sendMessage',
        expect.objectContaining({
          chat_id: 'test-chat-id',
          parse_mode: 'HTML',
        }),
      );
    });

    it('should handle Telegram API error gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const notification: Notification = {
        type: NotificationType.ANALYSIS_COMPLETE,
        title: 'Analysis',
        message: 'Complete',
      };

      // Should not throw
      await expect(service.send(notification)).resolves.not.toThrow();
    });

    it('should include notification data when provided', async () => {
      const notification: Notification = {
        type: NotificationType.REPORT_READY,
        title: 'Report',
        message: 'Ready',
        data: { ticker: 'PETR4', value: 35.5 },
      };

      await service.send(notification);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('ticker: PETR4'),
        }),
      );
    });
  });

  describe('formatTelegramMessage (via send)', () => {
    it('should use 💰 icon for PRICE_ALERT', async () => {
      await service.send({
        type: NotificationType.PRICE_ALERT,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('💰'),
        }),
      );
    });

    it('should use ✅ icon for ANALYSIS_COMPLETE', async () => {
      await service.send({
        type: NotificationType.ANALYSIS_COMPLETE,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('✅'),
        }),
      );
    });

    it('should use 📊 icon for REPORT_READY', async () => {
      await service.send({
        type: NotificationType.REPORT_READY,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('📊'),
        }),
      );
    });

    it('should use 💼 icon for PORTFOLIO_UPDATE', async () => {
      await service.send({
        type: NotificationType.PORTFOLIO_UPDATE,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('💼'),
        }),
      );
    });

    it('should use ⚠️ icon for SCRAPING_FAILED', async () => {
      await service.send({
        type: NotificationType.SCRAPING_FAILED,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('⚠️'),
        }),
      );
    });

    it('should use 🎯 icon for RECOMMENDATION', async () => {
      await service.send({
        type: NotificationType.RECOMMENDATION,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('🎯'),
        }),
      );
    });

    it('should format object data as JSON', async () => {
      await service.send({
        type: NotificationType.PRICE_ALERT,
        title: 'Test',
        message: 'msg',
        data: { nested: { key: 'value' } },
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('{"key":"value"}'),
        }),
      );
    });
  });

  describe('sendPriceAlert', () => {
    it('should send price alert with formatted values', async () => {
      await service.sendPriceAlert('PETR4', 35.56, 40.0);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('R$ 35.56'),
        }),
      );
    });

    it('should include ticker in title', async () => {
      await service.sendPriceAlert('VALE3', 68.5, 70.0);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('VALE3'),
        }),
      );
    });
  });

  describe('sendAnalysisComplete', () => {
    it('should send analysis complete notification', async () => {
      await service.sendAnalysisComplete('PETR4', 'COMPRA');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringMatching(/PETR4.*foi concluída/),
        }),
      );
    });

    it('should include recommendation in data', async () => {
      await service.sendAnalysisComplete('VALE3', 'VENDA');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('VENDA'),
        }),
      );
    });
  });

  describe('sendReportReady', () => {
    it('should send report ready notification', async () => {
      await service.sendReportReady('ITUB4');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringMatching(/ITUB4.*disponível/),
        }),
      );
    });
  });

  describe('sendPortfolioUpdate', () => {
    it('should use 📈 emoji for positive change', async () => {
      await service.sendPortfolioUpdate('Meu Portfolio', 5.5);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('📈'),
        }),
      );
    });

    it('should use 📉 emoji for negative change', async () => {
      await service.sendPortfolioUpdate('Meu Portfolio', -3.2);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('📉'),
        }),
      );
    });

    it('should use ➡️ emoji for zero change', async () => {
      await service.sendPortfolioUpdate('Meu Portfolio', 0);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('➡️'),
        }),
      );
    });

    it('should format positive change with + sign', async () => {
      await service.sendPortfolioUpdate('Dividendos', 2.5);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('+2.50%'),
        }),
      );
    });
  });

  describe('sendRecommendation', () => {
    it('should use 🟢 for BUY recommendation', async () => {
      await service.sendRecommendation('PETR4', 'BUY', 85, 'Good fundamentals');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('🟢'),
        }),
      );
    });

    it('should use 🟢 for STRONG_BUY recommendation', async () => {
      await service.sendRecommendation('VALE3', 'STRONG_BUY', 95, 'Excellent');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('🟢'),
        }),
      );
    });

    it('should use 🔴 for SELL recommendation', async () => {
      await service.sendRecommendation('OIBR3', 'SELL', 70, 'High risk');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('🔴'),
        }),
      );
    });

    it('should use 🔴 for STRONG_SELL recommendation', async () => {
      await service.sendRecommendation('OIBR3', 'STRONG_SELL', 90, 'Avoid');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('🔴'),
        }),
      );
    });

    it('should use 🟡 for HOLD recommendation', async () => {
      await service.sendRecommendation('ITUB4', 'HOLD', 60, 'Wait and see');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('🟡'),
        }),
      );
    });

    it('should include confidence percentage', async () => {
      await service.sendRecommendation('PETR4', 'BUY', 85, 'Good fundamentals');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('85%'),
        }),
      );
    });

    it('should include reason in message', async () => {
      await service.sendRecommendation('PETR4', 'BUY', 85, 'Excellent ROE and low P/E');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('Excellent ROE and low P/E'),
        }),
      );
    });
  });

  describe('Disabled notifications', () => {
    it('should not send Telegram when disabled', async () => {
      // Create service with Telegram disabled
      const disabledConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'TELEGRAM_ENABLED') return false;
          if (key === 'EMAIL_ENABLED') return false;
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationsService,
          {
            provide: ConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<NotificationsService>(NotificationsService);

      await disabledService.send({
        type: NotificationType.PRICE_ALERT,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should not send Telegram when token is missing', async () => {
      // Create service with missing token
      const missingTokenConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'TELEGRAM_ENABLED') return true;
          if (key === 'TELEGRAM_BOT_TOKEN') return '';
          if (key === 'TELEGRAM_CHAT_ID') return 'chat-id';
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationsService,
          {
            provide: ConfigService,
            useValue: missingTokenConfigService,
          },
        ],
      }).compile();

      const missingTokenService = module.get<NotificationsService>(NotificationsService);

      await missingTokenService.send({
        type: NotificationType.PRICE_ALERT,
        title: 'Test',
        message: 'msg',
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });
});
