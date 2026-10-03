'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let lockCount = 0

/**
 * Shared overlay behaviour for Drawer/Modal: keeps the node mounted through the
 * exit animation, locks body scroll, closes on Esc, traps Tab focus inside the
 * panel and restores focus to the opener on close.
 */
export function useOverlay(open: boolean, onClose: () => void, exitMs = 260) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const openerRef = useRef<Element | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setClosing(true)
    const t = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
      const opener = openerRef.current as HTMLElement | null
      opener?.focus?.()
    }, reduce ? 0 : exitMs)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!mounted || closing) return
    lockCount += 1
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFirst = window.setTimeout(() => {
      const panel = panelRef.current
      const target = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
      ;(target ?? panel)?.focus()
    }, 20)

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      )
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKey)
      lockCount -= 1
      if (lockCount <= 0) {
        lockCount = 0
        document.body.style.overflow = prevOverflow
      }
    }
  }, [mounted, closing])

  const requestClose = useCallback(() => onCloseRef.current(), [])
  return { mounted, closing, panelRef, requestClose }
}
