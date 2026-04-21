import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import type { RootState } from '../store';

/** REST base is .../api; Socket.IO lives on same host, namespace /chat (not /api/chat). */
function getSocketOrigin(): string {
  const raw = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim();
  return raw.replace(/\/api\/?$/i, '').replace(/\/$/, '') || 'http://localhost:5000';
}

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
 * Socket.IO to backend `/chat` namespace (matches fixer-backend ChatSocketService).
 */
export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const authToken = useSelector((s: RootState) => s.auth.token);
  const tenantId = useSelector((s: RootState) => s.tenant?.tenantId ?? null);
  const callbacksRef = useRef({ onConnect, onDisconnect, onError });
  callbacksRef.current = { onConnect, onDisconnect, onError };

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectTick, setReconnectTick] = useState(0);

  const disconnect = useCallback(() => {
    setSocket((prev) => {
      if (prev) {
        prev.removeAllListeners();
        prev.disconnect();
      }
      return null;
    });
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    setReconnectTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!autoConnect) return;

    const token = authToken || localStorage.getItem('token');
    if (!token) {
      console.log('ℹ️ Socket: No auth token, skipping connection');
      return;
    }

    const socketOrigin = getSocketOrigin();
    let s: Socket;
    try {
      s = io(`${socketOrigin}/chat`, {
        auth: { token, ...(tenantId ? { tenantId } : {}) },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 5000,
        autoConnect: true,
      });
    } catch {
      console.log('ℹ️ Socket: Connection failed (server may not be running)');
      return;
    }

    const { onConnect: oc, onDisconnect: od, onError: oe } = callbacksRef.current;

    s.on('connect', () => {
      console.log('✅ Connected to chat server');
      setIsConnected(true);
      setError(null);
      oc?.();
    });

    s.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
      setIsConnected(false);
      od?.();
    });

    s.on('error', (err) => {
      console.error('❌ Socket error:', err);
      const socketError = new Error(err.message || 'Socket connection error');
      setError(socketError);
      oe?.(socketError);
    });

    s.on('connect_error', (err) => {
      console.log('ℹ️ Socket: Connection error (server may not be available):', err.message);
      const socketError = new Error(err.message || 'Chat socket connection failed');
      setError(socketError);
      callbacksRef.current.onError?.(socketError);
    });

    setSocket(s);

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [autoConnect, authToken, tenantId, reconnectTick]);

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
  };
};
