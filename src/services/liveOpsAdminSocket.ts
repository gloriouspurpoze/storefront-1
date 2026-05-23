/**
 * ============================================================================
 * fixer-admin · LIVE-OPS ADMIN SOCKET
 * ============================================================================
 *
 * Singleton Socket.IO client connected to the backend's **default namespace**
 * (NOT `/chat`) so the admin dashboard can see real-time professional
 * presence and live-ops events.
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Partner app  ──emits─→  professional:online  (every 30s)       │
 *   │  Backend      ──tracks→  in-memory professionalStatus Map       │
 *   │  Backend      ──emits─→  professional:presence  (to admin room) │
 *   │  Admin app    ──reads─→  professional presence store            │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Why a separate socket from `useSocket()` (chat namespace):
 *   1. The chat namespace is gated/feature-flagged in the partner app and
 *      uses different message types.
 *   2. We want presence + booking ops on the default namespace because
 *      that's where the partner app already sends `professional:online`.
 *   3. Keeps the chat reconnect cycle from also disturbing live-ops.
 *
 * Designed with the same idempotent-reconnect pattern we shipped in the
 * partner app's `liveOpsSocketService` so a flaky network doesn't stack
 * duplicate listeners (the bug that caused "alarm rings infinitely").
 *
 * Backend contract (see docs/BACKEND_REALTIME_PATCHES.md):
 *   - Server joins admin sockets to room `admins` after JWT auth.
 *   - Server emits `professional:presence` to `admins` whenever a
 *     `professional:online` heartbeat is received, with payload:
 *       {
 *         professionalId: string,
 *         status: 'available' | 'busy' | 'offline',
 *         location: { latitude: number, longitude: number } | null,
 *         lastSeen: string  // ISO
 *       }
 *   - Server also emits `professional:presence` with `status: 'offline'`
 *     when a partner socket disconnects or the stale-sweep demotes them.
 * ============================================================================
 */
import { io, type Socket } from 'socket.io-client'

type EventHandler = (data: unknown) => void

function getSocketOrigin(): string {
  const raw = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()
  return raw.replace(/\/api\/?$/i, '').replace(/\/$/, '') || 'http://localhost:5000'
}

class LiveOpsAdminSocketService {
  private socket: Socket | null = null
  private currentToken: string | null = null
  /** Pending listeners registered before connect — re-applied on (re)connect. */
  private pendingListeners: Array<[string, EventHandler]> = []
  /** All active listeners — re-applied (idempotently) on every reconnect. */
  private activeListeners: Map<string, Set<EventHandler>> = new Map()

  /**
   * Idempotent connect: calling with the same token while already connected
   * is a no-op. Calling with a different token tears down the old session
   * first so we don't accidentally double-subscribe.
   */
  connect(token: string): void {
    const cleanToken = token?.trim()
    if (!cleanToken) return

    if (this.socket?.connected && this.currentToken === cleanToken) {
      return
    }

    this.disconnect()
    this.currentToken = cleanToken

    const origin = getSocketOrigin()
    const socket = io(origin, {
      // Default namespace — that's where the partner app emits
      // `professional:online`. Do NOT use `/chat` here.
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
      if (process.env.NODE_ENV === 'development') {
        console.log('[liveOpsAdmin] connected', socket.id)
      }
      // Re-bind every active handler. socket.io-client KEEPS handlers
      // across reconnects, so we always `.off(event, h)` before `.on(event, h)`
      // — otherwise a 10-reconnect session fires every event 11 times.
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

      // Tell the server this socket is an admin client so it can join us
      // to the `admins` room (server can also infer from JWT role; this is
      // a belt-and-braces signal).
      socket.emit('admin:identify', { surface: 'admin' })
    })

    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[liveOpsAdmin] disconnect', reason)
      }
    })

    socket.on('connect_error', (err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[liveOpsAdmin] connect_error', err?.message || err)
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.removeAllListeners()
        this.socket.disconnect()
      } catch {
        // ignore
      }
      this.socket = null
    }
    this.currentToken = null
  }

  isConnected(): boolean {
    return this.socket?.connected === true
  }

  /**
   * Subscribe to a server event. Idempotent — attaching the same handler
   * twice (e.g. React Strict Mode double-mount, hot reload) is a no-op,
   * so events never fire twice for the same logical subscription.
   */
  on(event: string, handler: EventHandler): void {
    this.trackListener(event, handler)
    if (this.socket) {
      this.socket.off(event, handler)
      this.socket.on(event, handler)
    } else {
      const already = this.pendingListeners.some(
        ([e, h]) => e === event && h === handler,
      )
      if (!already) this.pendingListeners.push([event, handler])
    }
  }

  off(event: string, handler?: EventHandler): void {
    if (handler) {
      this.activeListeners.get(event)?.delete(handler)
      this.socket?.off(event, handler)
      this.pendingListeners = this.pendingListeners.filter(
        ([e, h]) => !(e === event && h === handler),
      )
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

export const liveOpsAdminSocket = new LiveOpsAdminSocketService()
export default liveOpsAdminSocket
