/**
 * ============================================================================
 * fixer-admin · NEW BOOKING / ORDER ALERTS
 * ============================================================================
 *
 * Layered, industry-aware alerts so an admin never misses a new booking/order:
 *   1. Realtime: listens on `liveOpsAdminSocket` for `admin:booking_created` /
 *      `admin:order_created` (emitted by the backend to the tenant admin room),
 *      pops a toast + chime instantly and refreshes the notification bell.
 *   2. Polling fallback: every 30s refreshes notifications; if the socket is
 *      down, brand-new booking/order notifications still surface a toast.
 *
 * Copy is relabeled per industry vertical (Booking → Reservation → Appointment…)
 * via the active vertical pack.
 *
 * Mount inside `NotificationsProvider` (see main-layout) so it can refresh the
 * bell. Admin-only — non-admin accounts attach no listeners.
 * ============================================================================
 */
import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { liveOpsAdminSocket } from '../../services/liveOpsAdminSocket'
import { useNotifications } from '../../contexts/notifications-context'
import { useVerticalPack } from '../../hooks/useVerticalPack'
import { appToast } from '../../lib/appToast'

const ADMIN_USER_TYPES = new Set(['admin', 'super_admin'])
const ADMIN_RBAC_ROLES = new Set(['super_admin', 'admin', 'manager'])

const POLL_INTERVAL_MS = 30_000

function isAdminLike(userType: unknown, rbacRole: unknown): boolean {
  const ut = typeof userType === 'string' ? userType.toLowerCase() : ''
  if (ADMIN_USER_TYPES.has(ut)) return true
  const rr = typeof rbacRole === 'string' ? rbacRole.toLowerCase() : ''
  return ADMIN_RBAC_ROLES.has(rr)
}

/** Best-effort attention chime via WebAudio (no asset to bundle). */
function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start()
    osc.stop(ctx.currentTime + 0.32)
    osc.onended = () => ctx.close().catch(() => undefined)
  } catch {
    /* autoplay blocked / unsupported — toast still shows */
  }
}

interface BookingAlertPayload {
  bookingId?: string
  serviceName?: string
  customerName?: string | null
  totalAmount?: number | null
  relatedId?: string
  /** Industry-aware copy from backend (preferred when present). */
  title?: string
  message?: string
}

interface OrderAlertPayload {
  orderId?: string
  orderNumber?: string | null
  customerName?: string | null
  totalAmount?: number | null
  relatedId?: string
  title?: string
  message?: string
}

function formatAmount(amount?: number | null): string {
  if (amount == null || !Number.isFinite(Number(amount))) return ''
  return ` · ₹${Number(amount).toLocaleString('en-IN')}`
}

export function AdminNewActivityAlerts(): null {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const userType = useSelector((s: RootState) => s.auth.user?.userType as unknown)
  const rbacRole = useSelector((s: RootState) => s.auth.user?.rbacRole as unknown)
  const { pack } = useVerticalPack()
  const { notifications, refreshNotifications } = useNotifications()

  const admin = isAuthenticated && isAdminLike(userType, rbacRole)

  // Industry-aware singular noun: "Booking" / "Reservation" / "Appointment"…
  const engagementLabel = pack.engagementTypes?.[0]?.label || 'Booking'

  // Dedupe across socket + poll. Key = `${kind}:${id}`.
  const toastedRef = useRef<Set<string>>(new Set())
  // Seed guard so first notifications load doesn't toast historical rows.
  const seededRef = useRef(false)

  // Keep latest label/refresh/navigate in refs so socket handlers stay stable.
  const labelRef = useRef(engagementLabel)
  labelRef.current = engagementLabel
  const refreshRef = useRef(refreshNotifications)
  refreshRef.current = refreshNotifications

  const toastBooking = useCallback((message: string, bookingId: string) => {
    const id = bookingId.trim()
    const view =
      id.length > 0
        ? {
            label: 'View',
            onClick: () => {
              window.location.assign(`/bookings/${id}`)
            },
          }
        : undefined
    appToast(message, 'info', 12_000, view)
    playChime()
    void refreshRef.current()
  }, [])

  const toastOrder = useCallback((message: string, orderId: string) => {
    const id = orderId.trim()
    const view =
      id.length > 0
        ? {
            label: 'View',
            onClick: () => {
              window.location.assign(`/orders?id=${encodeURIComponent(id)}`)
            },
          }
        : undefined
    appToast(message, 'info', 12_000, view)
    playChime()
    void refreshRef.current()
  }, [])

  const onBooking = useCallback(
    (raw: unknown) => {
      const p = (raw ?? {}) as BookingAlertPayload
      const id = String(p.bookingId ?? p.relatedId ?? '')
      const key = `booking:${id || Math.random()}`
      if (toastedRef.current.has(key)) return
      toastedRef.current.add(key)
      const who = p.customerName ? ` from ${p.customerName}` : ''
      const svc = p.serviceName ? `: ${p.serviceName}` : ''
      const fallback = `New ${labelRef.current.toLowerCase()}${svc}${who}${formatAmount(p.totalAmount)}`
      toastBooking(p.message?.trim() || fallback, id)
    },
    [toastBooking],
  )

  const onOrder = useCallback(
    (raw: unknown) => {
      const p = (raw ?? {}) as OrderAlertPayload
      const id = String(p.orderId ?? p.relatedId ?? '')
      const key = `order:${id || Math.random()}`
      if (toastedRef.current.has(key)) return
      toastedRef.current.add(key)
      const ref = p.orderNumber || (id ? `#${id.slice(-6)}` : '')
      const who = p.customerName ? ` from ${p.customerName}` : ''
      const fallback = `New order ${ref}${who}${formatAmount(p.totalAmount)}`
      toastOrder(p.message?.trim() || fallback, id)
    },
    [toastOrder],
  )

  // Realtime socket subscription (admin only). The socket itself is connected by
  // LiveOpsAdminGate; `.on` is idempotent and queues until connected.
  useEffect(() => {
    if (!admin) return
    liveOpsAdminSocket.on('admin:booking_created', onBooking)
    liveOpsAdminSocket.on('admin:order_created', onOrder)
    return () => {
      liveOpsAdminSocket.off('admin:booking_created', onBooking)
      liveOpsAdminSocket.off('admin:order_created', onOrder)
    }
  }, [admin, onBooking, onOrder])

  // Polling fallback — keeps the bell fresh and (when the socket is down) still
  // toasts brand-new booking/order notifications exactly once.
  useEffect(() => {
    if (!admin) return
    const id = window.setInterval(() => {
      void refreshRef.current()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [admin])

  // Detect new booking/order notifications arriving via poll and toast once.
  useEffect(() => {
    if (!admin) return
    if (!seededRef.current) {
      // First load: mark everything as already-seen, don't toast history.
      notifications.forEach((n) => {
        const id = n.relatedId || n.id
        if (n.type === 'booking_created') toastedRef.current.add(`booking:${id}`)
        if (n.type === 'order_placed') toastedRef.current.add(`order:${id}`)
      })
      seededRef.current = true
      return
    }
    // If the socket is live, realtime handlers already cover toasts.
    if (liveOpsAdminSocket.isConnected()) {
      notifications.forEach((n) => {
        const id = n.relatedId || n.id
        if (n.type === 'booking_created') toastedRef.current.add(`booking:${id}`)
        if (n.type === 'order_placed') toastedRef.current.add(`order:${id}`)
      })
      return
    }
    for (const n of notifications) {
      if (n.isRead) continue
      const id = n.relatedId || n.id
      if (n.type === 'booking_created') {
        const key = `booking:${id}`
        if (!toastedRef.current.has(key)) {
          toastedRef.current.add(key)
          const msg =
            (n.message || n.body || '').trim() ||
            `New ${labelRef.current.toLowerCase()} received`
          toastBooking(msg, String(id))
        }
      } else if (n.type === 'order_placed') {
        const key = `order:${id}`
        if (!toastedRef.current.has(key)) {
          toastedRef.current.add(key)
          const msg = (n.message || n.body || '').trim() || 'New order received'
          toastOrder(msg, String(id))
        }
      }
    }
  }, [admin, notifications, toastBooking, toastOrder])

  return null
}

export default AdminNewActivityAlerts
