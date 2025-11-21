import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * FASE 35: WebSocket Gateway para comunicação em tempo real de sync operations
 *
 * Eventos emitidos:
 * - sync:started - Sync bulk iniciado
 * - sync:progress - Progresso de sync individual (ticker atual)
 * - sync:completed - Sync bulk concluído
 * - sync:failed - Sync individual falhou
 *
 * Uso:
 * - Frontend conecta via Socket.IO client
 * - Backend emite eventos durante processamento sequencial
 * - UI atualiza em tempo real (progress bar, tabela, logs)
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3100',
    credentials: true,
  },
  namespace: '/sync', // Namespace dedicado para sync operations
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SyncGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`[SYNC WS] Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[SYNC WS] Cliente desconectado: ${client.id}`);
  }

  /**
   * Emitir evento de início de sync bulk
   */
  emitSyncStarted(data: {
    tickers: string[];
    totalAssets: number;
    startYear: number;
    endYear: number;
  }) {
    this.server.emit('sync:started', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[SYNC WS] Sync started: ${data.totalAssets} assets (${data.startYear}-${data.endYear})`,
    );
  }

  /**
   * Emitir progresso de sync individual
   */
  emitSyncProgress(data: {
    ticker: string;
    current: number; // Asset atual (ex: 3)
    total: number; // Total de assets (ex: 20)
    status: 'processing' | 'success' | 'failed';
    recordsInserted?: number;
    duration?: number; // Segundos
    error?: string;
  }) {
    this.server.emit('sync:progress', {
      ...data,
      percentage: Math.round((data.current / data.total) * 100),
      timestamp: new Date(),
    });

    if (data.status === 'success') {
      this.logger.log(
        `[SYNC WS] Progress ${data.current}/${data.total}: ${data.ticker} ✅ (${data.recordsInserted} records, ${data.duration}s)`,
      );
    } else if (data.status === 'failed') {
      this.logger.error(
        `[SYNC WS] Progress ${data.current}/${data.total}: ${data.ticker} ❌ (${data.error})`,
      );
    } else {
      this.logger.log(
        `[SYNC WS] Progress ${data.current}/${data.total}: ${data.ticker} ⏳ processing...`,
      );
    }
  }

  /**
   * Emitir evento de conclusão de sync bulk
   */
  emitSyncCompleted(data: {
    totalAssets: number;
    successCount: number;
    failedCount: number;
    duration: number; // Segundos totais
    failedTickers?: string[];
  }) {
    this.server.emit('sync:completed', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(
      `[SYNC WS] Sync completed: ${data.successCount}/${data.totalAssets} successful (${Math.round(data.duration / 60)}min total)`,
    );
  }

  /**
   * Emitir falha crítica de sync bulk (ex: validação prévia falhou)
   */
  emitSyncFailed(data: { error: string; tickers?: string[] }) {
    this.server.emit('sync:failed', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.error(`[SYNC WS] Sync failed: ${data.error}`);
  }

  /**
   * Broadcast genérico para todos os clientes conectados
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }
}
