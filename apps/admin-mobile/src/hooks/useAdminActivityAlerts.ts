/**
 * Real-time + polling alerts for new bookings/orders (mobile admin).
 *
 *   1. Realtime: connects `adminSocket` and listens for `admin:booking_created`
 *      / `admin:order_created`, shows Alert with View + refreshes the inbox.
 *   2. Polling fallback: refetches notifications every 30s; when the socket is
 *      down, brand-new booking/order notifications still surface an Alert.
 *
 * Copy is industry-aware via `useVerticalLabels` (and server title/message when present).
 * Mount once inside the authenticated admin shell (AdminTabNavigator).
 */
import { useCallback, useEffect, useRef } from 'react'
import { Alert, Vibration } from 'react-native'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useVerticalLabels } from '@/hooks/useVerticalLabels'
import { navigateToBookingDetail, navigateToOrderDetail } from '@/lib/deepNavigation'
import { adminSocket } from '@/services/adminSocket'
import { getSecureToken } from '@/services/auth/keychain'
import { notificationsApi, useGetNotificationsQuery } from '@/store/api/notificationsApi'

const ADMIN_TYPES = new Set(['admin', 'super_admin', 'manager'])
const POLL_INTERVAL_MS = 30_000

function isAdminLike(userType?: string, rbacRole?: string): boolean {
  const ut = (userType || '').toLowerCase()
  if (ADMIN_TYPES.has(ut)) return true
  const rr = (rbacRole || '').toLowerCase()
  return ADMIN_TYPES.has(rr)
}

interface BookingAlertPayload {
  bookingId?: string
  serviceName?: string
  customerName?: string | null
  relatedId?: string
  title?: string
  message?: string
}
interface OrderAlertPayload {
  orderId?: string
  orderNumber?: string | null
  customerName?: string | null
  relatedId?: string
  title?: string
  message?: string
}

function alertWithView(title: string, message: string, onView?: () => void) {
  if (onView) {
    Alert.alert(title, message, [
      { text: 'Dismiss', style: 'cancel' },
      { text: 'View', onPress: onView },
    ])
  } else {
    Alert.alert(title, message)
  }
}

export function useAdminActivityAlerts(): void {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const userType = useAppSelector((s) => s.auth.user?.userType as string | undefined)
  const rbacRole = useAppSelector((s) => s.auth.user?.rbacRole as string | undefined)
  const labels = useVerticalLabels()

  const admin = isAuthenticated && isAdminLike(userType, rbacRole)

  const toastedRef = useRef<Set<string>>(new Set())
  const seededRef = useRef(false)
  const labelRef = useRef(labels.engagementSingular)
  labelRef.current = labels.engagementSingular

  const refreshInbox = useCallback(() => {
    dispatch(
      notificationsApi.util.invalidateTags([
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD' },
      ]),
    )
  }, [dispatch])

  const showBookingAlert = useCallback(
    (title: string, message: string, bookingId: string) => {
      Vibration.vibrate(400)
      const id = bookingId.trim()
      alertWithView(title, message, id ? () => navigateToBookingDetail(id) : undefined)
      refreshInbox()
    },
    [refreshInbox],
  )

  const showOrderAlert = useCallback(
    (title: string, message: string, orderId: string) => {
      Vibration.vibrate(400)
      const id = orderId.trim()
      alertWithView(title, message, id ? () => navigateToOrderDetail(id) : undefined)
      refreshInbox()
    },
    [refreshInbox],
  )

  const onBooking = useCallback(
    (raw: unknown) => {
      const p = (raw ?? {}) as BookingAlertPayload
      const id = String(p.bookingId ?? p.relatedId ?? '')
      const key = `booking:${id || Date.now()}`
      if (toastedRef.current.has(key)) return
      toastedRef.current.add(key)
      const who = p.customerName ? ` from ${p.customerName}` : ''
      const svc = p.serviceName ? `: ${p.serviceName}` : ''
      const title = p.title?.trim() || `New ${labelRef.current.toLowerCase()}`
      const message =
        p.message?.trim() ||
        `New ${labelRef.current.toLowerCase()}${svc}${who}.`
      showBookingAlert(title, message, id)
    },
    [showBookingAlert],
  )

  const onOrder = useCallback(
    (raw: unknown) => {
      const p = (raw ?? {}) as OrderAlertPayload
      const id = String(p.orderId ?? p.relatedId ?? '')
      const key = `order:${id || Date.now()}`
      if (toastedRef.current.has(key)) return
      toastedRef.current.add(key)
      const ref = p.orderNumber || (id ? `#${id.slice(-6)}` : '')
      const who = p.customerName ? ` from ${p.customerName}` : ''
      const title = p.title?.trim() || 'New order'
      const message = p.message?.trim() || `New order ${ref}${who}.`
      showOrderAlert(title, message, id)
    },
    [showOrderAlert],
  )

  // Connect socket + subscribe (admin only).
  useEffect(() => {
    if (!admin) {
      adminSocket.off('admin:booking_created', onBooking)
      adminSocket.off('admin:order_created', onOrder)
      adminSocket.disconnect()
      return
    }
    let cancelled = false
    void getSecureToken().then((token) => {
      if (cancelled || !token) return
      adminSocket.connect(token)
      adminSocket.on('admin:booking_created', onBooking)
      adminSocket.on('admin:order_created', onOrder)
    })
    return () => {
      cancelled = true
      adminSocket.off('admin:booking_created', onBooking)
      adminSocket.off('admin:order_created', onOrder)
    }
  }, [admin, onBooking, onOrder])

  // Polling fallback — keeps inbox fresh and toasts new items when socket is down.
  const { data: notifications } = useGetNotificationsQuery(undefined, {
    skip: !admin,
    pollingInterval: POLL_INTERVAL_MS,
  })

  useEffect(() => {
    if (!admin || !notifications) return
    const seedOnly = !seededRef.current || adminSocket.isConnected()
    for (const n of notifications) {
      const id = n.relatedId || n.id
      const isBooking = n.type === 'booking_created'
      const isOrder = n.type === 'order_placed'
      if (!isBooking && !isOrder) continue
      const key = `${isBooking ? 'booking' : 'order'}:${id}`
      if (toastedRef.current.has(key)) continue
      if (seedOnly) {
        toastedRef.current.add(key)
        continue
      }
      if (n.isRead) {
        toastedRef.current.add(key)
        continue
      }
      toastedRef.current.add(key)
      const title = n.title?.trim() || (isBooking ? `New ${labelRef.current.toLowerCase()}` : 'New order')
      const message =
        (n.message || n.body || '').trim() ||
        (isBooking ? `New ${labelRef.current.toLowerCase()} received.` : 'New order received.')
      if (isBooking) {
        showBookingAlert(title, message, String(id))
      } else {
        showOrderAlert(title, message, String(id))
      }
    }
    if (!seededRef.current) seededRef.current = true
  }, [admin, notifications, showBookingAlert, showOrderAlert])
}

export default useAdminActivityAlerts
