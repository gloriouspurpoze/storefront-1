'use client'

import { useEffect, useState } from 'react'

const EVENT = 'sf:cart-drawer'
let hosts = 0

/**
 * Opens the shared CartDrawer if the current page mounted one (via a theme
 * header). Returns false when no drawer is mounted so callers can fall back
 * to their own behaviour (navigate to /cart, show a toast, …).
 */
export function openCartDrawer(): boolean {
  if (typeof window === 'undefined' || hosts === 0) return false
  window.dispatchEvent(new CustomEvent(EVENT, { detail: true }))
  return true
}

export function closeCartDrawer() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT, { detail: false }))
}

/** Used by the drawer host: open/close state wired to the bus. */
export function useCartDrawerState(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    hosts += 1
    const onEvent = (e: Event) => setOpen(Boolean((e as CustomEvent<boolean>).detail))
    window.addEventListener(EVENT, onEvent)
    return () => {
      hosts -= 1
      window.removeEventListener(EVENT, onEvent)
    }
  }, [])
  return [open, setOpen]
}
