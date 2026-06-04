/**
 * Admin live-ops socket (mobile).
 *
 * Singleton Socket.IO client on the backend default namespace so the mobile
 * admin receives real-time `admin:booking_created` / `admin:order_created`
 * alerts (emitted by the backend to the tenant admin room).
 *
 * Mirrors the web `liveOpsAdminSocket` idempotent-reconnect pattern so flaky
 * mobile networks never stack duplicate listeners.
 */
import { io, type Socket } from 'socket.io-client'
import { AppConfig } from '@/config/env'

type EventHandler = (data: unknown) => void

function getSocketOrigin(): string {
  const raw = (AppConfig.API_URL || 'http://localhost:8005/api').trim()
  return raw.replace(/\/api\/?$/i, '').replace(/\/$/, '') || 'http://localhost:8005'
}

class AdminSocketService {
  private socket: Socket | null = null
  private currentToken: string | null = null
  private pendingListeners: Array<[string, EventHandler]> = []
  private activeListeners: Map<string, Set<EventHandler>> = new Map()

  connect(token: string): void {
    const cleanToken = token?.trim()
    if (!cleanToken) return
    if (this.socket?.connected && this.currentToken === cleanToken) return

    this.disconnect()
    this.currentToken = cleanToken

    const socket = io(getSocketOrigin(), {
      auth: { token: cleanToken, surface: 'admin' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2_000,
      reconnectionDelayMax: 15_000,
      timeout: 20_000,
    })
    this.socket = socket

    socket.on('connect', () => {
      // Re-bind active handlers idempotently (socket.io keeps them across reconnects).
      Array.from(this.activeListeners.entries()).forEach(([event, handlers]) => {
        handlers.forEach((h) => {
          socket.off(event, h)
          socket.on(event, h)
        })
      })
      for (const [event, handler] of this.pendingListeners) {
        socket.off(event, handler)
        socket.on(event, handler)
        this.trackListener(event, handler)
      }
      this.pendingListeners = []
      socket.emit('admin:identify', { surface: 'admin' })
    })
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.removeAllListeners()
        this.socket.disconnect()
      } catch {
        /* ignore */
      }
      this.socket = null
    }
    this.currentToken = null
  }

  isConnected(): boolean {
    return this.socket?.connected === true
  }

  on(event: string, handler: EventHandler): void {
    this.trackListener(event, handler)
    if (this.socket) {
      this.socket.off(event, handler)
      this.socket.on(event, handler)
    } else {
      const already = this.pendingListeners.some(([e, h]) => e === event && h === handler)
      if (!already) this.pendingListeners.push([event, handler])
    }
  }

  off(event: string, handler?: EventHandler): void {
    if (handler) {
      this.activeListeners.get(event)?.delete(handler)
      this.socket?.off(event, handler)
      this.pendingListeners = this.pendingListeners.filter(([e, h]) => !(e === event && h === handler))
    } else {
      this.activeListeners.delete(event)
      this.socket?.off(event)
      this.pendingListeners = this.pendingListeners.filter(([e]) => e !== event)
    }
  }

  private trackListener(event: string, handler: EventHandler) {
    let set = this.activeListeners.get(event)
    if (!set) {
      set = new Set()
      this.activeListeners.set(event, set)
    }
    set.add(handler)
  }
}

export const adminSocket = new AdminSocketService()
export default adminSocket
