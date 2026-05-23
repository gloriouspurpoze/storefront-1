/**
 * ============================================================================
 * fixer-admin · PROFESSIONAL PRESENCE STORE
 * ============================================================================
 *
 * Ephemeral in-memory map of `professionalId → live presence` that mirrors
 * the partner app's `professional:online` heartbeats in (near) real-time.
 *
 * Why not Redux?
 *   - This data is pure UI cache: it lives only while the admin tab is open
 *     and should be torn down on logout. Persisting it via `redux-persist`
 *     would be confusing (stale "online" badges across sessions).
 *   - Updates fire at most every 30s per professional (heartbeat cadence)
 *     plus disconnect/sweep events. A subscribe/notify store with
 *     `useSyncExternalStore` gives us O(1) per-row updates without a single
 *     reducer running on every event.
 *   - We can selectively subscribe to a single professional id, so a row
 *     for prof A doesn't re-render when prof B's status changes.
 *
 * Authoritative shape: matches the server's `professional:presence` payload
 * (see docs/BACKEND_REALTIME_PATCHES.md §7).
 * ============================================================================
 */
import { useSyncExternalStore } from 'react'

export type PresenceStatus = 'available' | 'busy' | 'offline'

export interface ProfessionalPresence {
  professionalId: string
  status: PresenceStatus
  location: { latitude: number; longitude: number } | null
  /** ISO string from the server. */
  lastSeen: string | null
  /** Local Date.now() when the admin client received this update. */
  receivedAt: number
}

type Listener = () => void

class ProfessionalPresenceStore {
  private map: Map<string, ProfessionalPresence> = new Map()
  /** Per-id listeners — fire only when a specific row changes. */
  private listenersById: Map<string, Set<Listener>> = new Map()
  /** Global listeners — fire on any change (e.g. for the full table). */
  private globalListeners: Set<Listener> = new Set()
  /** Monotonically increasing version, used as snapshot value for the table. */
  private version = 0

  upsert(entry: Omit<ProfessionalPresence, 'receivedAt'>): void {
    const id = String(entry.professionalId || '').trim()
    if (!id) return
    const next: ProfessionalPresence = {
      ...entry,
      professionalId: id,
      receivedAt: Date.now(),
    }
    const prev = this.map.get(id)
    if (
      prev &&
      prev.status === next.status &&
      prev.lastSeen === next.lastSeen &&
      JSON.stringify(prev.location) === JSON.stringify(next.location)
    ) {
      // Same content — refresh receivedAt timestamp silently without
      // notifying subscribers (no UI change).
      prev.receivedAt = next.receivedAt
      return
    }
    this.map.set(id, next)
    this.version += 1
    this.notifyId(id)
    this.notifyGlobal()
  }

  /** Mark a specific professional as offline (e.g. on partner socket disconnect). */
  markOffline(professionalId: string): void {
    const id = String(professionalId || '').trim()
    if (!id) return
    const prev = this.map.get(id)
    if (prev?.status === 'offline') return
    this.map.set(id, {
      professionalId: id,
      status: 'offline',
      location: prev?.location ?? null,
      lastSeen: prev?.lastSeen ?? null,
      receivedAt: Date.now(),
    })
    this.version += 1
    this.notifyId(id)
    this.notifyGlobal()
  }

  get(professionalId: string | null | undefined): ProfessionalPresence | null {
    const id = String(professionalId ?? '').trim()
    if (!id) return null
    return this.map.get(id) ?? null
  }

  /** Snapshot version for the global subscription — cheap === reference. */
  getVersion(): number {
    return this.version
  }

  /** Wipe everything — called on logout. */
  reset(): void {
    if (this.map.size === 0) return
    this.map.clear()
    this.version += 1
    Array.from(this.listenersById.values()).forEach((set) => {
      set.forEach((l) => l())
    })
    this.notifyGlobal()
  }

  subscribeId(professionalId: string, listener: Listener): () => void {
    const id = String(professionalId || '').trim()
    if (!id) return () => {}
    let set = this.listenersById.get(id)
    if (!set) {
      set = new Set()
      this.listenersById.set(id, set)
    }
    set.add(listener)
    return () => {
      set?.delete(listener)
      if (set && set.size === 0) this.listenersById.delete(id)
    }
  }

  subscribeGlobal(listener: Listener): () => void {
    this.globalListeners.add(listener)
    return () => {
      this.globalListeners.delete(listener)
    }
  }

  private notifyId(id: string): void {
    const set = this.listenersById.get(id)
    if (!set) return
    set.forEach((l) => l())
  }

  private notifyGlobal(): void {
    this.globalListeners.forEach((l) => l())
  }
}

export const professionalPresenceStore = new ProfessionalPresenceStore()

/**
 * Hook — returns the live presence for a single professional, or `null` if
 * we've never seen a heartbeat for them this session. Subscribes only to
 * updates for this id, so rows don't re-render for unrelated professionals.
 *
 * Usage:
 *   const presence = useProfessionalPresence(professional._id)
 *   const status = presence?.status ?? professional.availability
 */
export function useProfessionalPresence(
  professionalId: string | null | undefined,
): ProfessionalPresence | null {
  const id = String(professionalId ?? '').trim()
  return useSyncExternalStore(
    (cb) => (id ? professionalPresenceStore.subscribeId(id, cb) : () => {}),
    () => professionalPresenceStore.get(id),
    () => professionalPresenceStore.get(id),
  )
}

/**
 * Hook — returns a monotonically increasing version number that bumps on
 * every store change. Wire it into a `useMemo([..., version])` to derive
 * a presence-merged dataset for whole tables.
 */
export function useProfessionalPresenceVersion(): number {
  return useSyncExternalStore(
    (cb) => professionalPresenceStore.subscribeGlobal(cb),
    () => professionalPresenceStore.getVersion(),
    () => professionalPresenceStore.getVersion(),
  )
}
