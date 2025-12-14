import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleDestroy, UsePipes, ValidationPipe } from '@nestjs/common';
import { SubscribeDto, SubscriptionType, UnsubscribeDto } from './dto/subscribe.dto';

interface SubscriptionData {
  tickers: string[];
  types: SubscriptionType[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3100',
    credentials: true,
  },
})
export class AppWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private userSubscriptions = new Map<string, SubscriptionData>();
  private cleanupInterval: NodeJS.Timeout;

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);

    // Inicia cleanup periódico no primeiro cliente
    if (this.userSubscriptions.size === 0 && !this.cleanupInterval) {
      this.startPeriodicCleanup();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);

    // Remove das subscrições
    this.userSubscriptions.delete(client.id);

    // Leave all rooms para liberar memória
    const rooms = Array.from(client.rooms);
    rooms.forEach((room) => {
      if (room !== client.id) {
        client.leave(room);
      }
    });

    // Para cleanup se não houver mais clientes
    if (this.userSubscriptions.size === 0 && this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  onModuleDestroy() {
    // Cleanup ao destruir o módulo
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.userSubscriptions.clear();
  }

  private startPeriodicCleanup() {
    // Limpa conexões órfãs a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      const connectedSockets = this.server.sockets.sockets;
      const orphanedSubscriptions: string[] = [];

      this.userSubscriptions.forEach((_, clientId) => {
        if (!connectedSockets.has(clientId)) {
          orphanedSubscriptions.push(clientId);
        }
      });

      if (orphanedSubscriptions.length > 0) {
        orphanedSubscriptions.forEach((id) => this.userSubscriptions.delete(id));
        this.logger.log(`Limpou ${orphanedSubscriptions.length} subscrições órfãs`);
      }
    }, 300000); // 5 minutos
  }

  @SubscribeMessage('subscribe')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  handleSubscribe(@MessageBody() data: SubscribeDto, @ConnectedSocket() client: Socket) {
    // Guard: Validar arrays não vazios (já validado pelo DTO, mas double-check por segurança)
    if (!data.tickers || !data.types || data.tickers.length === 0 || data.types.length === 0) {
      return {
        event: 'error',
        data: {
          success: false,
          message: 'tickers and types are required and cannot be empty',
        },
      };
    }

    // Sanitize tickers (uppercase, trim)
    const sanitizedTickers = data.tickers.map((ticker) => ticker.trim().toUpperCase());

    const subscriptionData: SubscriptionData = {
      tickers: sanitizedTickers,
      types: data.types,
    };

    this.userSubscriptions.set(client.id, subscriptionData);

    // Join rooms para broadcast eficiente O(1)
    subscriptionData.tickers.forEach((ticker) => {
      subscriptionData.types.forEach((type) => {
        const roomName = `${ticker}:${type}`;
        client.join(roomName);
      });
    });

    this.logger.log(`Cliente ${client.id} inscrito em: ${JSON.stringify(subscriptionData)}`);

    return {
      event: 'subscribed',
      data: {
        success: true,
        tickers: subscriptionData.tickers,
        types: subscriptionData.types,
      },
    };
  }

  @SubscribeMessage('unsubscribe')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  handleUnsubscribe(@MessageBody() data: UnsubscribeDto, @ConnectedSocket() client: Socket) {
    const currentSub = this.userSubscriptions.get(client.id);

    if (!currentSub) {
      return {
        event: 'error',
        data: {
          success: false,
          message: 'No active subscription found',
        },
      };
    }

    // Leave rooms das subscrições removidas
    if (data.tickers && data.tickers.length > 0) {
      const sanitizedTickers = data.tickers.map((ticker) => ticker.trim().toUpperCase());
      sanitizedTickers.forEach((ticker) => {
        currentSub.types.forEach((type) => {
          const roomName = `${ticker}:${type}`;
          client.leave(roomName);
        });
      });
      currentSub.tickers = currentSub.tickers.filter((t) => !sanitizedTickers.includes(t));
    }

    if (data.types && data.types.length > 0) {
      data.types.forEach((type) => {
        currentSub.tickers.forEach((ticker) => {
          const roomName = `${ticker}:${type}`;
          client.leave(roomName);
        });
      });
      currentSub.types = currentSub.types.filter((t) => !data.types.includes(t));
    }

    this.userSubscriptions.set(client.id, currentSub);

    return {
      event: 'unsubscribed',
      data: { success: true },
    };
  }

  // Métodos para emitir atualizações - Otimizado com rooms O(1)
  emitPriceUpdate(ticker: string, data: any) {
    const roomName = `${ticker}:prices`;
    this.server.to(roomName).emit('price_update', {
      ticker,
      data,
      timestamp: new Date(),
    });
  }

  emitAnalysisComplete(ticker: string, analysisId: string, type: string) {
    const roomName = `${ticker}:analysis`;
    this.server.to(roomName).emit('analysis_complete', {
      ticker,
      analysisId,
      type,
      timestamp: new Date(),
    });
  }

  emitReportReady(ticker: string, reportId: string) {
    const roomName = `${ticker}:reports`;
    this.server.to(roomName).emit('report_ready', {
      ticker,
      reportId,
      timestamp: new Date(),
    });
  }

  emitPortfolioUpdate(userId: string, portfolioId: string, data: any) {
    // Portfolio usa um padrão diferente pois não é por ticker
    const roomName = `${userId}:portfolio`;
    this.server.to(roomName).emit('portfolio_update', {
      userId,
      portfolioId,
      data,
      timestamp: new Date(),
    });
  }

  emitMarketStatus(status: 'open' | 'closed' | 'pre_open' | 'post_close') {
    this.server.emit('market_status', {
      status,
      timestamp: new Date(),
    });
  }

  // Broadcast para todos os clientes
  broadcastMessage(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  // ============================================================================
  // MÉTODOS PARA ASSET UPDATES
  // ============================================================================

  emitAssetUpdateStarted(data: {
    assetId: string;
    ticker: string;
    updateLogId: string;
    triggeredBy: string;
  }) {
    this.server.emit('asset_update_started', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`[WS] Asset update started: ${data.ticker}`);
  }

  emitAssetUpdateCompleted(data: {
    assetId: string;
    ticker: string;
    updateLogId: string;
    status: string;
    duration: number;
    metadata?: any;
  }) {
    this.server.emit('asset_update_completed', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`[WS] Asset update completed: ${data.ticker} (${data.duration}ms)`);
  }

  emitAssetUpdateFailed(data: {
    assetId: string;
    ticker: string;
    updateLogId: string;
    error: string;
    duration: number;
  }) {
    this.server.emit('asset_update_failed', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.error(`[WS] Asset update failed: ${data.ticker} - ${data.error}`);
  }

  emitBatchUpdateStarted(data: {
    batchId: string;
    portfolioId?: string;
    totalAssets: number;
    tickers: string[];
  }) {
    this.server.emit('batch_update_started', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`[WS] Batch update started: ${data.totalAssets} assets (batchId: ${data.batchId})`);
  }

  emitBatchUpdateProgress(data: {
    batchId: string;
    portfolioId?: string;
    current: number;
    total: number;
    currentTicker: string;
  }) {
    this.server.emit('batch_update_progress', {
      ...data,
      timestamp: new Date(),
    });
  }

  emitBatchUpdateCompleted(data: {
    batchId: string;
    portfolioId?: string;
    totalAssets: number;
    successCount: number;
    failedCount: number;
    duration: number;
  }) {
    this.server.emit('batch_update_completed', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[WS] Batch update completed: ${data.successCount}/${data.totalAssets} successful (${data.duration}ms, batchId: ${data.batchId})`,
    );
  }

  // ============================================================================
  // FASE 93.4: SCRAPER TEST ALL EVENTS
  // ============================================================================

  emitScraperTestAllStarted(data: { totalScrapers: number; scraperIds: string[] }) {
    this.server.emit('scraper_test_all_started', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`[WS] Scraper test all started: ${data.totalScrapers} scrapers`);
  }

  emitScraperTestProgress(data: {
    currentScraperId: string;
    scraperName: string;
    current: number;
    total: number;
    success: boolean;
    responseTime: number;
    error?: string;
    runtime: 'typescript' | 'python';
  }) {
    this.server.emit('scraper_test_progress', {
      ...data,
      timestamp: new Date(),
    });
    const status = data.success ? '✓' : '✗';
    this.logger.log(
      `[WS] Scraper test progress: ${status} ${data.scraperName} (${data.current}/${data.total}) - ${data.responseTime}ms`,
    );
  }

  emitScraperTestAllCompleted(data: {
    totalScrapers: number;
    successCount: number;
    failedCount: number;
    duration: number;
    results: Array<{
      scraperId: string;
      scraperName: string;
      success: boolean;
      responseTime: number;
      error?: string;
      runtime: 'typescript' | 'python';
    }>;
  }) {
    this.server.emit('scraper_test_all_completed', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[WS] Scraper test all completed: ${data.successCount}/${data.totalScrapers} successful (${data.duration}ms)`,
    );
  }

  // ============================================================================
  // FASE 110: OPTION PRICES REAL-TIME EVENTS
  // ============================================================================

  /**
   * Emit option price update for a specific underlying ticker
   * Room format: ${ticker}:options
   */
  emitOptionPriceUpdate(
    ticker: string,
    data: {
      optionTicker: string;
      strike: number;
      expiration: string;
      type: 'CALL' | 'PUT';
      lastPrice: number;
      bid: number;
      ask: number;
      volume: number;
      openInterest: number;
      delta?: number;
      gamma?: number;
      theta?: number;
      vega?: number;
      impliedVolatility?: number;
    },
  ) {
    const roomName = `${ticker}:options`;
    this.server.to(roomName).emit('option_price_update', {
      underlyingTicker: ticker,
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit full option chain update for an underlying ticker
   */
  emitOptionChainUpdate(
    ticker: string,
    data: {
      expirationDate: string;
      calls: Array<{
        optionTicker: string;
        strike: number;
        lastPrice: number;
        bid: number;
        ask: number;
        volume: number;
        openInterest: number;
        delta?: number;
        impliedVolatility?: number;
      }>;
      puts: Array<{
        optionTicker: string;
        strike: number;
        lastPrice: number;
        bid: number;
        ask: number;
        volume: number;
        openInterest: number;
        delta?: number;
        impliedVolatility?: number;
      }>;
    },
  ) {
    const roomName = `${ticker}:options`;
    this.server.to(roomName).emit('option_chain_update', {
      underlyingTicker: ticker,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[WS] Option chain update: ${ticker} exp ${data.expirationDate} (${data.calls.length} calls, ${data.puts.length} puts)`,
    );
  }

  /**
   * Emit Greeks recalculation for options (after underlying price change)
   */
  emitOptionGreeksUpdate(
    ticker: string,
    data: {
      underlyingPrice: number;
      options: Array<{
        optionTicker: string;
        delta: number;
        gamma: number;
        theta: number;
        vega: number;
        impliedVolatility: number;
        intrinsicValue: number;
        extrinsicValue: number;
      }>;
    },
  ) {
    const roomName = `${ticker}:options`;
    this.server.to(roomName).emit('option_greeks_update', {
      underlyingTicker: ticker,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[WS] Option Greeks update: ${ticker} @ ${data.underlyingPrice} (${data.options.length} options)`,
    );
  }

  /**
   * Emit WHEEL recommendation update when option prices change
   * FASE 110.1: Fixed security bug - now emits to strategy-specific room instead of broadcast
   */
  emitWheelRecommendationUpdate(
    strategyId: string,
    data: {
      ticker: string;
      type: 'PUT' | 'CALL';
      recommendations: Array<{
        optionTicker: string;
        strike: number;
        expiration: string;
        premium: number;
        delta: number;
        annualizedReturn: number;
        score: number;
      }>;
    },
  ) {
    // FASE 110.1: Use strategy-specific room to prevent data leak to other users
    const roomName = `strategy:${strategyId}`;
    this.server.to(roomName).emit('wheel_recommendation_update', {
      strategyId,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[WS] WHEEL recommendation update: ${data.ticker} ${data.type} (${data.recommendations.length} recs) -> room ${roomName}`,
    );
  }

  /**
   * Emit option expiration alert
   */
  emitOptionExpirationAlert(data: {
    ticker: string;
    optionTicker: string;
    strike: number;
    type: 'CALL' | 'PUT';
    expiration: string;
    daysToExpiration: number;
    inTheMoney: boolean;
  }) {
    const roomName = `${data.ticker}:options`;
    this.server.to(roomName).emit('option_expiration_alert', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[WS] Option expiration alert: ${data.optionTicker} expires in ${data.daysToExpiration} days`,
    );
  }
}
