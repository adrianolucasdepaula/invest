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
import { Logger, OnModuleDestroy } from '@nestjs/common';

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
    rooms.forEach(room => {
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
        orphanedSubscriptions.forEach(id => this.userSubscriptions.delete(id));
        this.logger.log(`Limpou ${orphanedSubscriptions.length} subscrições órfãs`);
      }
    }, 300000); // 5 minutos
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: SubscriptionData, @ConnectedSocket() client: Socket) {
    this.userSubscriptions.set(client.id, data);

    // Join rooms para broadcast eficiente O(1)
    data.tickers.forEach(ticker => {
      data.types.forEach(type => {
        const roomName = `${ticker}:${type}`;
        client.join(roomName);
      });
    });

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
      // Leave rooms das subscrições removidas
      if (data.tickers) {
        data.tickers.forEach(ticker => {
          currentSub.types.forEach(type => {
            const roomName = `${ticker}:${type}`;
            client.leave(roomName);
          });
        });
        currentSub.tickers = currentSub.tickers.filter((t) => !data.tickers.includes(t));
      }
      if (data.types) {
        const typesToRemove = data.types as ('prices' | 'analysis' | 'reports' | 'portfolio')[];
        typesToRemove.forEach(type => {
          currentSub.tickers.forEach(ticker => {
            const roomName = `${ticker}:${type}`;
            client.leave(roomName);
          });
        });
        currentSub.types = currentSub.types.filter((t) => !typesToRemove.includes(t));
      }

      this.userSubscriptions.set(client.id, currentSub);
    }

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
}
