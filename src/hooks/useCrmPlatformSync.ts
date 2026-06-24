import { useCallback, useEffect, useRef, useState } from 'react'
import { crmService } from '../services/api/crm.service'
import { BookingsService } from '../services/api/bookings.service'
import { usersService } from '../services/api/users.service'
import type { PlatformSyncStats } from '../lib/crmPlatformSync'

export interface UseCrmPlatformSyncOptions {
  /** Run once on mount when user can manage CRM */
  auto?: boolean
  enabled?: boolean
}

export function useCrmPlatformSync(options: UseCrmPlatformSyncOptions = {}) {
  const { auto = false, enabled = true } = options
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<PlatformSyncStats | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const ranAuto = useRef(false)

  const syncNow = useCallback(async (): Promise<PlatformSyncStats | null> => {
    if (!enabled) return null
    setSyncing(true)
    setSyncError(null)
    try {
      if (crmService.isApiEnabled()) {
        const stats = await crmService.syncFromPlatform()
        setLastSync(stats)
        return stats
      }

      const [usersRes, bookingsRes, contacts] = await Promise.all([
        usersService.getUsers({ page: 1, limit: 200, user_type: 'customer', scope: 'directory' }),
        BookingsService.getBookings({ page: 1, limit: 200 }),
        crmService.listContacts(),
      ])

      const stats = await crmService.syncFromPlatform({
        users: usersRes.users,
        bookings: bookingsRes.bookings ?? [],
        contacts,
      })
      setLastSync(stats)
      return stats
    } catch (e: unknown) {
      setSyncError(e instanceof Error ? e.message : 'Platform sync failed')
      return null
    } finally {
      setSyncing(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!auto || !enabled || ranAuto.current) return
    ranAuto.current = true
    void syncNow()
  }, [auto, enabled, syncNow])

  return { syncing, lastSync, syncError, syncNow }
}
