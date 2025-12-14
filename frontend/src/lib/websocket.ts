import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3101';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Function>>();

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket desconectado');
    });

    this.socket.on('error', (error) => {
      console.error('Erro WebSocket:', error);
    });

    // Configurar listeners gerais
    this.setupGeneralListeners();

    return this.socket;
  }

  private setupGeneralListeners() {
    if (!this.socket) return;

    // Price updates
    this.socket.on('price_update', (data) => {
      this.notifyListeners('price_update', data);
    });

    // Analysis complete
    this.socket.on('analysis_complete', (data) => {
      this.notifyListeners('analysis_complete', data);
    });

    // Report ready
    this.socket.on('report_ready', (data) => {
      this.notifyListeners('report_ready', data);
    });

    // Portfolio update
    this.socket.on('portfolio_update', (data) => {
      this.notifyListeners('portfolio_update', data);
    });

    // Market status
    this.socket.on('market_status', (data) => {
      this.notifyListeners('market_status', data);
    });

    // FASE 110: Option price events
    this.socket.on('option_price_update', (data) => {
      this.notifyListeners('option_price_update', data);
    });

    this.socket.on('option_chain_update', (data) => {
      this.notifyListeners('option_chain_update', data);
    });

    this.socket.on('option_greeks_update', (data) => {
      this.notifyListeners('option_greeks_update', data);
    });

    this.socket.on('option_expiration_alert', (data) => {
      this.notifyListeners('option_expiration_alert', data);
    });

    this.socket.on('wheel_recommendation_update', (data) => {
      this.notifyListeners('wheel_recommendation_update', data);
    });
  }

  subscribe(tickers: string[], types: ('prices' | 'analysis' | 'reports' | 'portfolio' | 'options')[]) {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.emit('subscribe', { tickers, types });
  }

  unsubscribe(tickers?: string[], types?: string[]) {
    this.socket?.emit('unsubscribe', { tickers, types });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Retorna função para remover listener
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // FASE 110.1: Error isolation - prevent one bad callback from breaking others
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for "${event}":`, error);
        }
      });
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();
