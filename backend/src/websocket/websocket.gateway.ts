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
import { Logger } from '@nestjs/common';

interface SubscriptionData {
  tickers: string[];
  types: ('prices' | 'analysis' | 'reports' | 'portfolio')[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class AppWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private userSubscriptions = new Map<string, SubscriptionData>();

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.userSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: SubscriptionData, @ConnectedSocket() client: Socket) {
    this.userSubscriptions.set(client.id, data);
    this.logger.log(`Cliente ${client.id} inscrito em: ${JSON.stringify(data)}`);

    return {
      event: 'subscribed',
      data: {
        success: true,
        tickers: data.tickers,
        types: data.types,
      },
    };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { tickers?: string[]; types?: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const currentSub = this.userSubscriptions.get(client.id);

    if (currentSub) {
      if (data.tickers) {
        currentSub.tickers = currentSub.tickers.filter((t) => !data.tickers.includes(t));
      }
      if (data.types) {
        currentSub.types = currentSub.types.filter((t) => !data.types.includes(t as any));
      }

      this.userSubscriptions.set(client.id, currentSub);
    }

    return {
      event: 'unsubscribed',
      data: { success: true },
    };
  }

  // Métodos para emitir atualizações
  emitPriceUpdate(ticker: string, data: any) {
    this.userSubscriptions.forEach((subscription, clientId) => {
      if (subscription.tickers.includes(ticker) && subscription.types.includes('prices')) {
        this.server.to(clientId).emit('price_update', {
          ticker,
          data,
          timestamp: new Date(),
        });
      }
    });
  }

  emitAnalysisComplete(ticker: string, analysisId: string, type: string) {
    this.userSubscriptions.forEach((subscription, clientId) => {
      if (subscription.tickers.includes(ticker) && subscription.types.includes('analysis')) {
        this.server.to(clientId).emit('analysis_complete', {
          ticker,
          analysisId,
          type,
          timestamp: new Date(),
        });
      }
    });
  }

  emitReportReady(ticker: string, reportId: string) {
    this.userSubscriptions.forEach((subscription, clientId) => {
      if (subscription.tickers.includes(ticker) && subscription.types.includes('reports')) {
        this.server.to(clientId).emit('report_ready', {
          ticker,
          reportId,
          timestamp: new Date(),
        });
      }
    });
  }

  emitPortfolioUpdate(userId: string, portfolioId: string, data: any) {
    this.userSubscriptions.forEach((subscription, clientId) => {
      if (subscription.types.includes('portfolio')) {
        this.server.to(clientId).emit('portfolio_update', {
          userId,
          portfolioId,
          data,
          timestamp: new Date(),
        });
      }
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
}
