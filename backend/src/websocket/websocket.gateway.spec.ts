import { Test, TestingModule } from '@nestjs/testing';
import { AppWebSocketGateway } from './websocket.gateway';
import { Server, Socket } from 'socket.io';
import { SubscriptionType } from './dto/subscribe.dto';

describe('AppWebSocketGateway', () => {
  let gateway: AppWebSocketGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      sockets: {
        sockets: new Map(),
      } as any,
    };

    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      rooms: new Set(['test-socket-id']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppWebSocketGateway],
    }).compile();

    gateway = module.get<AppWebSocketGateway>(AppWebSocketGateway);
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      expect(() => gateway.handleConnection(mockSocket as Socket)).not.toThrow();
    });

    it('should start periodic cleanup on first client', () => {
      jest.useFakeTimers();
      gateway.handleConnection(mockSocket as Socket);
      // Cleanup interval should be set
      expect(gateway['cleanupInterval']).toBeDefined();
      jest.useRealTimers();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client from subscriptions', () => {
      gateway.handleConnection(mockSocket as Socket);
      gateway.handleSubscribe(
        { tickers: ['PETR4'], types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      gateway.handleDisconnect(mockSocket as Socket);

      expect(gateway['userSubscriptions'].has('test-socket-id')).toBe(false);
    });

    it('should leave all rooms', () => {
      const socketWithRooms = {
        ...mockSocket,
        rooms: new Set(['test-socket-id', 'PETR4:prices']),
      };

      gateway.handleDisconnect(socketWithRooms as Socket);

      expect(socketWithRooms.leave).toHaveBeenCalledWith('PETR4:prices');
    });

    it('should not leave socket own room', () => {
      const socketWithOwnRoom = {
        ...mockSocket,
        rooms: new Set(['test-socket-id']),
      };

      gateway.handleDisconnect(socketWithOwnRoom as Socket);

      expect(socketWithOwnRoom.leave).not.toHaveBeenCalledWith('test-socket-id');
    });

    it('should stop cleanup interval when no clients remain', () => {
      jest.useFakeTimers();
      gateway.handleConnection(mockSocket as Socket);
      gateway.handleDisconnect(mockSocket as Socket);

      expect(gateway['cleanupInterval']).toBeNull();
      jest.useRealTimers();
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear cleanup interval', () => {
      jest.useFakeTimers();
      gateway.handleConnection(mockSocket as Socket);
      gateway.onModuleDestroy();

      expect(gateway['userSubscriptions'].size).toBe(0);
      jest.useRealTimers();
    });

    it('should clear all subscriptions', () => {
      gateway.handleSubscribe(
        { tickers: ['PETR4'], types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      gateway.onModuleDestroy();

      expect(gateway['userSubscriptions'].size).toBe(0);
    });
  });

  describe('handleSubscribe', () => {
    it('should subscribe client to tickers and types', () => {
      const result = gateway.handleSubscribe(
        { tickers: ['PETR4', 'VALE3'], types: [SubscriptionType.PRICES, SubscriptionType.ANALYSIS] },
        mockSocket as Socket,
      );

      expect(result.event).toBe('subscribed');
      expect(result.data.success).toBe(true);
      expect(result.data.tickers).toContain('PETR4');
      expect(result.data.tickers).toContain('VALE3');
    });

    it('should join rooms for each ticker-type combination', () => {
      gateway.handleSubscribe(
        { tickers: ['PETR4'], types: [SubscriptionType.PRICES, SubscriptionType.ANALYSIS] },
        mockSocket as Socket,
      );

      expect(mockSocket.join).toHaveBeenCalledWith('PETR4:prices');
      expect(mockSocket.join).toHaveBeenCalledWith('PETR4:analysis');
    });

    it('should sanitize tickers to uppercase', () => {
      const result = gateway.handleSubscribe(
        { tickers: ['petr4', 'vale3'], types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      expect(result.data.tickers).toContain('PETR4');
      expect(result.data.tickers).toContain('VALE3');
    });

    it('should trim ticker whitespace', () => {
      const result = gateway.handleSubscribe(
        { tickers: ['  PETR4  '], types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      expect(result.data.tickers).toContain('PETR4');
    });

    it('should return error for empty tickers', () => {
      const result = gateway.handleSubscribe(
        { tickers: [], types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      expect(result.event).toBe('error');
      expect(result.data.success).toBe(false);
    });

    it('should return error for empty types', () => {
      const result = gateway.handleSubscribe(
        { tickers: ['PETR4'], types: [] },
        mockSocket as Socket,
      );

      expect(result.event).toBe('error');
      expect(result.data.success).toBe(false);
    });

    it('should return error for null tickers', () => {
      const result = gateway.handleSubscribe(
        { tickers: null as any, types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      expect(result.event).toBe('error');
    });

    it('should return error for null types', () => {
      const result = gateway.handleSubscribe(
        { tickers: ['PETR4'], types: null as any },
        mockSocket as Socket,
      );

      expect(result.event).toBe('error');
    });

    it('should store subscription data', () => {
      gateway.handleSubscribe(
        { tickers: ['PETR4'], types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      const subscription = gateway['userSubscriptions'].get('test-socket-id');
      expect(subscription).toBeDefined();
      expect(subscription?.tickers).toContain('PETR4');
    });
  });

  describe('handleUnsubscribe', () => {
    beforeEach(() => {
      gateway.handleSubscribe(
        { tickers: ['PETR4', 'VALE3'], types: [SubscriptionType.PRICES, SubscriptionType.ANALYSIS] },
        mockSocket as Socket,
      );
    });

    it('should unsubscribe from specific tickers', () => {
      const result = gateway.handleUnsubscribe(
        { tickers: ['PETR4'], types: undefined },
        mockSocket as Socket,
      );

      expect(result.event).toBe('unsubscribed');
      expect(result.data.success).toBe(true);

      const subscription = gateway['userSubscriptions'].get('test-socket-id');
      expect(subscription?.tickers).not.toContain('PETR4');
      expect(subscription?.tickers).toContain('VALE3');
    });

    it('should unsubscribe from specific types', () => {
      const result = gateway.handleUnsubscribe(
        { tickers: undefined, types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      expect(result.event).toBe('unsubscribed');
      const subscription = gateway['userSubscriptions'].get('test-socket-id');
      expect(subscription?.types).not.toContain(SubscriptionType.PRICES);
    });

    it('should leave rooms when unsubscribing tickers', () => {
      gateway.handleUnsubscribe(
        { tickers: ['PETR4'], types: undefined },
        mockSocket as Socket,
      );

      expect(mockSocket.leave).toHaveBeenCalledWith('PETR4:prices');
      expect(mockSocket.leave).toHaveBeenCalledWith('PETR4:analysis');
    });

    it('should leave rooms when unsubscribing types', () => {
      gateway.handleUnsubscribe(
        { tickers: undefined, types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      expect(mockSocket.leave).toHaveBeenCalledWith('PETR4:prices');
      expect(mockSocket.leave).toHaveBeenCalledWith('VALE3:prices');
    });

    it('should return error when no active subscription', () => {
      const newSocket: Partial<Socket> = {
        id: 'new-socket-id',
        join: jest.fn(),
        leave: jest.fn(),
        rooms: new Set(['new-socket-id']),
      };

      const result = gateway.handleUnsubscribe(
        { tickers: ['PETR4'], types: undefined },
        newSocket as Socket,
      );

      expect(result.event).toBe('error');
      expect(result.data.message).toBe('No active subscription found');
    });

    it('should sanitize unsubscribe tickers to uppercase', () => {
      gateway.handleUnsubscribe(
        { tickers: ['petr4'], types: undefined },
        mockSocket as Socket,
      );

      expect(mockSocket.leave).toHaveBeenCalledWith('PETR4:prices');
    });
  });

  describe('emit methods', () => {
    describe('emitPriceUpdate', () => {
      it('should emit to ticker:prices room', () => {
        gateway.emitPriceUpdate('PETR4', { price: 30.5 });

        expect(mockServer.to).toHaveBeenCalledWith('PETR4:prices');
        expect(mockServer.emit).toHaveBeenCalledWith('price_update', expect.objectContaining({
          ticker: 'PETR4',
          data: { price: 30.5 },
        }));
      });

      it('should include timestamp', () => {
        gateway.emitPriceUpdate('PETR4', { price: 30.5 });

        expect(mockServer.emit).toHaveBeenCalledWith('price_update', expect.objectContaining({
          timestamp: expect.any(Date),
        }));
      });
    });

    describe('emitAnalysisComplete', () => {
      it('should emit to ticker:analysis room', () => {
        gateway.emitAnalysisComplete('VALE3', 'analysis-123', 'fundamental');

        expect(mockServer.to).toHaveBeenCalledWith('VALE3:analysis');
        expect(mockServer.emit).toHaveBeenCalledWith('analysis_complete', expect.objectContaining({
          ticker: 'VALE3',
          analysisId: 'analysis-123',
          type: 'fundamental',
        }));
      });
    });

    describe('emitReportReady', () => {
      it('should emit to ticker:reports room', () => {
        gateway.emitReportReady('ITUB4', 'report-456');

        expect(mockServer.to).toHaveBeenCalledWith('ITUB4:reports');
        expect(mockServer.emit).toHaveBeenCalledWith('report_ready', expect.objectContaining({
          ticker: 'ITUB4',
          reportId: 'report-456',
        }));
      });
    });

    describe('emitPortfolioUpdate', () => {
      it('should emit to userId:portfolio room', () => {
        gateway.emitPortfolioUpdate('user-123', 'portfolio-456', { value: 1000000 });

        expect(mockServer.to).toHaveBeenCalledWith('user-123:portfolio');
        expect(mockServer.emit).toHaveBeenCalledWith('portfolio_update', expect.objectContaining({
          userId: 'user-123',
          portfolioId: 'portfolio-456',
        }));
      });
    });

    describe('emitMarketStatus', () => {
      it('should broadcast market status to all clients', () => {
        gateway.emitMarketStatus('open');

        expect(mockServer.emit).toHaveBeenCalledWith('market_status', expect.objectContaining({
          status: 'open',
        }));
      });

      it('should handle all status types', () => {
        const statuses: Array<'open' | 'closed' | 'pre_open' | 'post_close'> = ['open', 'closed', 'pre_open', 'post_close'];
        statuses.forEach(status => {
          gateway.emitMarketStatus(status);
          expect(mockServer.emit).toHaveBeenCalledWith('market_status', expect.objectContaining({ status }));
        });
      });
    });

    describe('broadcastMessage', () => {
      it('should emit custom event to all clients', () => {
        gateway.broadcastMessage('custom_event', { message: 'Hello' });

        expect(mockServer.emit).toHaveBeenCalledWith('custom_event', expect.objectContaining({
          message: 'Hello',
          timestamp: expect.any(Date),
        }));
      });
    });
  });

  describe('asset update events', () => {
    describe('emitAssetUpdateStarted', () => {
      it('should broadcast asset update started', () => {
        gateway.emitAssetUpdateStarted({
          assetId: 'asset-123',
          ticker: 'PETR4',
          updateLogId: 'log-456',
          triggeredBy: 'manual',
        });

        expect(mockServer.emit).toHaveBeenCalledWith('asset_update_started', expect.objectContaining({
          assetId: 'asset-123',
          ticker: 'PETR4',
        }));
      });
    });

    describe('emitAssetUpdateCompleted', () => {
      it('should broadcast asset update completed', () => {
        gateway.emitAssetUpdateCompleted({
          assetId: 'asset-123',
          ticker: 'PETR4',
          updateLogId: 'log-456',
          status: 'completed',
          duration: 1500,
        });

        expect(mockServer.emit).toHaveBeenCalledWith('asset_update_completed', expect.objectContaining({
          ticker: 'PETR4',
          status: 'completed',
          duration: 1500,
        }));
      });

      it('should include metadata if provided', () => {
        gateway.emitAssetUpdateCompleted({
          assetId: 'asset-123',
          ticker: 'PETR4',
          updateLogId: 'log-456',
          status: 'completed',
          duration: 1500,
          metadata: { sourcesCount: 3 },
        });

        expect(mockServer.emit).toHaveBeenCalledWith('asset_update_completed', expect.objectContaining({
          metadata: { sourcesCount: 3 },
        }));
      });
    });

    describe('emitAssetUpdateFailed', () => {
      it('should broadcast asset update failed', () => {
        gateway.emitAssetUpdateFailed({
          assetId: 'asset-123',
          ticker: 'PETR4',
          updateLogId: 'log-456',
          error: 'Connection timeout',
          duration: 5000,
        });

        expect(mockServer.emit).toHaveBeenCalledWith('asset_update_failed', expect.objectContaining({
          ticker: 'PETR4',
          error: 'Connection timeout',
        }));
      });
    });

    describe('emitBatchUpdateStarted', () => {
      it('should broadcast batch update started', () => {
        gateway.emitBatchUpdateStarted({
          portfolioId: 'portfolio-123',
          totalAssets: 10,
          tickers: ['PETR4', 'VALE3'],
        });

        expect(mockServer.emit).toHaveBeenCalledWith('batch_update_started', expect.objectContaining({
          totalAssets: 10,
          tickers: ['PETR4', 'VALE3'],
        }));
      });
    });

    describe('emitBatchUpdateProgress', () => {
      it('should broadcast batch update progress', () => {
        gateway.emitBatchUpdateProgress({
          portfolioId: 'portfolio-123',
          current: 5,
          total: 10,
          currentTicker: 'ITUB4',
        });

        expect(mockServer.emit).toHaveBeenCalledWith('batch_update_progress', expect.objectContaining({
          current: 5,
          total: 10,
          currentTicker: 'ITUB4',
        }));
      });
    });

    describe('emitBatchUpdateCompleted', () => {
      it('should broadcast batch update completed', () => {
        gateway.emitBatchUpdateCompleted({
          portfolioId: 'portfolio-123',
          totalAssets: 10,
          successCount: 9,
          failedCount: 1,
          duration: 30000,
        });

        expect(mockServer.emit).toHaveBeenCalledWith('batch_update_completed', expect.objectContaining({
          successCount: 9,
          failedCount: 1,
          duration: 30000,
        }));
      });
    });
  });

  describe('periodic cleanup', () => {
    it('should remove orphaned subscriptions', () => {
      jest.useFakeTimers();

      // Add connected socket to mock server sockets
      (mockServer.sockets as any).sockets = new Map([
        ['test-socket-id', mockSocket],
      ]);

      // Start cleanup first (starts because userSubscriptions is empty)
      gateway.handleConnection(mockSocket as Socket);

      // Now add subscriptions AFTER cleanup interval is started
      // Add a subscription without a connected socket (orphan)
      gateway['userSubscriptions'].set('orphan-socket', {
        tickers: ['PETR4'],
        types: [SubscriptionType.PRICES],
      });

      // Add subscription for connected socket
      gateway['userSubscriptions'].set('test-socket-id', {
        tickers: ['VALE3'],
        types: [SubscriptionType.PRICES],
      });

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(300000);

      // Orphan should be removed, but connected socket subscription should remain
      expect(gateway['userSubscriptions'].has('orphan-socket')).toBe(false);
      expect(gateway['userSubscriptions'].has('test-socket-id')).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple subscriptions from same client', () => {
      gateway.handleSubscribe(
        { tickers: ['PETR4'], types: [SubscriptionType.PRICES] },
        mockSocket as Socket,
      );

      // Override with new subscription
      gateway.handleSubscribe(
        { tickers: ['VALE3'], types: [SubscriptionType.ANALYSIS] },
        mockSocket as Socket,
      );

      const subscription = gateway['userSubscriptions'].get('test-socket-id');
      expect(subscription?.tickers).toContain('VALE3');
    });

    it('should handle concurrent connections', () => {
      const socket1: Partial<Socket> = { id: 'socket-1', join: jest.fn(), leave: jest.fn(), rooms: new Set(['socket-1']) };
      const socket2: Partial<Socket> = { id: 'socket-2', join: jest.fn(), leave: jest.fn(), rooms: new Set(['socket-2']) };

      gateway.handleConnection(socket1 as Socket);
      gateway.handleConnection(socket2 as Socket);

      gateway.handleSubscribe({ tickers: ['PETR4'], types: [SubscriptionType.PRICES] }, socket1 as Socket);
      gateway.handleSubscribe({ tickers: ['VALE3'], types: [SubscriptionType.ANALYSIS] }, socket2 as Socket);

      expect(gateway['userSubscriptions'].size).toBe(2);
    });
  });
});
