import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for Socket.IO connection
 */
export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // Silently fail if no token - don't show error for unauthenticated users
      console.log('ℹ️ Socket: No auth token, skipping connection');
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    try {
      socketRef.current = io(`${apiUrl}/chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 5000,
        // Suppress connection errors in console if server is not available
        autoConnect: true,
      });
    } catch (err) {
      console.log('ℹ️ Socket: Connection failed (server may not be running)');
      // Don't set error for connection failures - it's expected if server is down
      return;
    }

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to chat server');
      setIsConnected(true);
      setError(null);
      onConnect?.();
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
      setIsConnected(false);
      onDisconnect?.();
    });

    socketRef.current.on('error', (err) => {
      console.error('❌ Socket error:', err);
      const socketError = new Error(err.message || 'Socket connection error');
      setError(socketError);
      onError?.(socketError);
    });

    socketRef.current.on('connect_error', (err) => {
      // Only log, don't show error - server may not be running
      console.log('ℹ️ Socket: Connection error (server may not be available):', err.message);
      // Don't set error or call onError - this is expected if chat server is not running
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
  };
};

