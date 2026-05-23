/**
 * ============================================================================
 * fixer-admin · LIVE-OPS ADMIN GATE
 * ============================================================================
 *
 * Lifecycle component (renders nothing) that:
 *   1. Connects `liveOpsAdminSocket` to the backend default namespace when
 *      an admin is authenticated.
 *   2. Subscribes to `professional:presence` events and pipes them into the
 *      `professionalPresenceStore` so any UI calling
 *      `useProfessionalPresence(id)` sees live status.
 *   3. Disconnects + wipes the presence cache on logout / token rotation.
 *
 * Mount once near the top of the app tree (sibling of `<OneSignalWeb />`)
 * — see `src/App.tsx`.
 *
 * Backend contract (see docs/BACKEND_REALTIME_PATCHES.md §7):
 *
 *   server emits `professional:presence` to room `admins`:
 *     {
 *       professionalId: string,
 *       status: 'available' | 'busy' | 'offline',
 *       location: { latitude: number; longitude: number } | null,
 *       lastSeen: string,     // ISO
 *       reason?: 'heartbeat' | 'disconnect' | 'stale_sweep' | 'manual',
 *     }
 *
 *   server may also emit `professional:offline` shorthand (legacy / cheap)
 *   with just `{ professionalId, lastSeen }` — handled too.
 * ============================================================================
 */
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { liveOpsAdminSocket } from '../../services/liveOpsAdminSocket'
import {
  professionalPresenceStore,
  type PresenceStatus,
} from '../../state/professionalPresence'

/**
 * Which dashboard accounts get a live-ops socket.
 * `userType` is the canonical field on `User`; `rbacRole` is the optional
 * fine-grained role (manager/staff) layered on top for `admin` userType.
 * Provider/professional/customer accounts viewing the admin shell don't
 * get a connection — they shouldn't see other professionals' presence.
 */
const ADMIN_USER_TYPES = new Set(['admin', 'super_admin'])
const ADMIN_RBAC_ROLES = new Set([
  'super_admin',
  'admin',
  'manager',
  // 'staff' deliberately excluded by default — flip on if needed.
])

interface PresencePayload {
  professionalId?: string | number
  status?: PresenceStatus | string
  location?: { latitude?: number; longitude?: number } | null
  lastSeen?: string | number | null
}

function isAdminLike(userType: unknown, rbacRole: unknown): boolean {
  const ut = typeof userType === 'string' ? userType.toLowerCase() : ''
  if (ADMIN_USER_TYPES.has(ut)) return true
  const rr = typeof rbacRole === 'string' ? rbacRole.toLowerCase() : ''
  return ADMIN_RBAC_ROLES.has(rr)
}

function normaliseStatus(s: unknown): PresenceStatus {
  if (s === 'available' || s === 'busy' || s === 'offline') return s
  return 'offline'
}

function normaliseLocation(
  loc: unknown,
): { latitude: number; longitude: number } | null {
  if (!loc || typeof loc !== 'object') return null
  const l = loc as { latitude?: unknown; longitude?: unknown }
  const lat = typeof l.latitude === 'number' ? l.latitude : Number(l.latitude)
  const lng = typeof l.longitude === 'number' ? l.longitude : Number(l.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { latitude: lat, longitude: lng }
}

function normaliseLastSeen(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v
  if (typeof v === 'number' && Number.isFinite(v)) {
    return new Date(v).toISOString()
  }
  return null
}

const onPresence = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') return
  const p = raw as PresencePayload
  const id = String(p.professionalId ?? '').trim()
  if (!id) return
  professionalPresenceStore.upsert({
    professionalId: id,
    status: normaliseStatus(p.status),
    location: normaliseLocation(p.location),
    lastSeen: normaliseLastSeen(p.lastSeen) ?? new Date().toISOString(),
  })
}

const onOffline = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') return
  const p = raw as { professionalId?: string | number }
  const id = String(p.professionalId ?? '').trim()
  if (id) professionalPresenceStore.markOffline(id)
}

export function LiveOpsAdminGate(): null {
  const token = useSelector((s: RootState) => s.auth.token)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const userType = useSelector((s: RootState) => s.auth.user?.userType as unknown)
  const rbacRole = useSelector((s: RootState) => s.auth.user?.rbacRole as unknown)

  useEffect(() => {
    if (!isAuthenticated || !token || !isAdminLike(userType, rbacRole)) {
      liveOpsAdminSocket.off('professional:presence', onPresence)
      liveOpsAdminSocket.off('professional:offline', onOffline)
      liveOpsAdminSocket.disconnect()
      professionalPresenceStore.reset()
      return
    }

    liveOpsAdminSocket.connect(token)
    liveOpsAdminSocket.on('professional:presence', onPresence)
    liveOpsAdminSocket.on('professional:offline', onOffline)

    return () => {
      // We deliberately do NOT disconnect on every effect re-run — only on
      // logout / role change. The `connect()` method is idempotent for the
      // same token; the listener `.on()` calls dedupe internally.
      liveOpsAdminSocket.off('professional:presence', onPresence)
      liveOpsAdminSocket.off('professional:offline', onOffline)
    }
  }, [isAuthenticated, token, userType, rbacRole])

  return null
}

export default LiveOpsAdminGate
