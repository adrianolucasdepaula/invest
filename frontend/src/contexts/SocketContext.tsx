'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<Socket | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3101';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      logger.info('[Socket] Connected', { socketId: newSocket.id });
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      logger.info('[Socket] Disconnected', { reason });
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      logger.error('[Socket] Connection error', { error });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      logger.debug('[Socket] Cleaning up connection');
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  return socket;
}

export { SocketContext };
