'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { STOREFRONT_ADDON_FLAGS, isAddonActive } from '@/lib/storefrontAddons'
import {
  WishlistUnavailableError,
  addAccountWishlistItem,
  fetchAccountWishlist,
  mergeGuestWishlist,
  readGuestWishlist,
  removeAccountWishlistItem,
  toggleWishlistId,
  writeGuestWishlist,
} from '@/lib/storefrontWishlist'

/**
 * Module-level wishlist store shared by every heart / header icon on the page — no provider
 * needed (the tenant layout is owned elsewhere). `enabled` starts false and is switched on by
 * any component that can see the storefront config (`useRegisterWishlistAddon`) or is handed
 * `enabled` explicitly, so an inactive add-on never renders hearts.
 */
interface WishlistSnapshot {
  enabled: boolean
  ready: boolean
  mode: 'guest' | 'account'
  ids: string[]
}

const SERVER_SNAPSHOT: WishlistSnapshot = { enabled: false, ready: false, mode: 'guest', ids: [] }
let state: WishlistSnapshot = SERVER_SNAPSHOT
let sessionKey: string | null = null
const listeners = new Set<() => void>()

function setState(patch: Partial<WishlistSnapshot>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setWishlistAddonEnabled(enabled: boolean) {
  // Only ever switch on: a component rendered without config must not hide a live add-on.
  if (enabled && !state.enabled) setState({ enabled: true })
}

/** Call from components that have the storefront config (headers, PDP, layout themes). */
export function useRegisterWishlistAddon(config: StorefrontConfig | null | undefined): boolean {
  const enabled = isAddonActive(config, STOREFRONT_ADDON_FLAGS.wishlist)
  useEffect(() => {
    setWishlistAddonEnabled(enabled)
  }, [enabled])
  return enabled
}

function ensureSession(tenantId: string, accessToken: string | null) {
  const key = `${tenantId}:${accessToken ?? 'guest'}`
  if (sessionKey === key) return
  sessionKey = key

  const guestIds = readGuestWishlist(tenantId)
  if (!accessToken) {
    setState({ mode: 'guest', ids: guestIds, ready: true })
    return
  }

  // Show the guest picks immediately while the account list loads / merges.
  setState({ mode: 'account', ids: guestIds, ready: false })
  const request = guestIds.length
    ? mergeGuestWishlist(tenantId, accessToken, guestIds)
    : fetchAccountWishlist(tenantId, accessToken)
  request
    .then((view) => {
      if (sessionKey !== key) return
      if (guestIds.length) writeGuestWishlist(tenantId, [])
      setState({ ids: view.productIds, ready: true })
    })
    .catch((err) => {
      if (sessionKey !== key) return
      if (err instanceof WishlistUnavailableError) setState({ enabled: false })
      // Keep guest ids locally (not cleared) so a later visit retries the merge.
      setState({ ready: true })
      sessionKey = null
    })
}

export function useWishlist(enabledOverride?: boolean) {
  const { tenantId, tokens, isAuthenticated, isReady } = useAccountAuth()
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER_SNAPSHOT)
  const accessToken = isAuthenticated ? tokens?.accessToken ?? null : null

  useEffect(() => {
    if (enabledOverride) setWishlistAddonEnabled(true)
  }, [enabledOverride])

  const enabled = enabledOverride ?? snap.enabled

  useEffect(() => {
    if (!enabled || !isReady || !tenantId) return
    ensureSession(tenantId, accessToken)
  }, [enabled, isReady, tenantId, accessToken])

  const has = useCallback((productId: string) => snap.ids.includes(productId.toLowerCase()), [snap.ids])

  /** Optimistic toggle. Resolves to the new saved state (or the old one on failure). */
  const toggle = useCallback(
    async (productId: string): Promise<boolean> => {
      const id = productId.toLowerCase()
      const before = state.ids
      const wasSaved = before.includes(id)
      const next = toggleWishlistId(before, id)
      setState({ ids: next })
      if (state.mode === 'guest' || !accessToken) {
        writeGuestWishlist(tenantId, next)
        return !wasSaved
      }
      const keyAtStart = sessionKey
      try {
        const view = wasSaved
          ? await removeAccountWishlistItem(tenantId, accessToken, id)
          : await addAccountWishlistItem(tenantId, accessToken, id)
        if (sessionKey === keyAtStart) setState({ ids: view.productIds })
        return !wasSaved
      } catch (err) {
        if (sessionKey === keyAtStart) setState({ ids: before })
        if (err instanceof WishlistUnavailableError) setState({ enabled: false })
        return wasSaved
      }
    },
    [accessToken, tenantId],
  )

  return {
    enabled,
    ready: snap.ready,
    mode: snap.mode,
    ids: snap.ids,
    count: snap.ids.length,
    tenantId,
    has,
    toggle,
  }
}
