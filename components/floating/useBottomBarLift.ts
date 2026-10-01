'use client'

import { useEffect, useState } from 'react'

/**
 * Known full-width bottom bars rendered by themes. Anything else can opt in
 * with `data-storefront-bottom-bar`.
 */
const BOTTOM_BAR_SELECTORS = [
  '[data-storefront-bottom-bar]',
  '.tp-mobile-cta--visible', // trade-pro mobile sticky CTA
  '.saffron-mobile-fab', // saffron mobile cart button
  '.sticky-pay-confirm', // brown-butter pay bar
].join(',')

/** Only bars that reach the dock's (left) edge matter. */
const DOCK_EDGE_PX = 96

function measureLift(): number {
  if (typeof window === 'undefined') return 0
  const vh = window.innerHeight
  let lift = 0
  for (const el of document.querySelectorAll<HTMLElement>(BOTTOM_BAR_SELECTORS)) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    if (rect.left > DOCK_EDGE_PX) continue
    // Must be anchored to the bottom of the viewport (allow a little offset).
    if (rect.bottom < vh - 32 || rect.top >= vh) continue
    lift = Math.max(lift, Math.ceil(vh - rect.top))
  }
  return lift
}

/**
 * Pixels to raise the floating dock so it sits above theme bottom bars.
 * Re-measures on resize, scroll, and DOM/class changes (bars toggle classes).
 */
export function useBottomBarLift(): number {
  const [lift, setLift] = useState(0)

  useEffect(() => {
    let frame = 0
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setLift(measureLift())
      })
      // Bars animate in (transform transitions) — re-measure once settled.
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => setLift(measureLift()), 260)
    }

    schedule()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule)
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [])

  return lift
}
