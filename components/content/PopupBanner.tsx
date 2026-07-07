'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type PopupBannerProps = {
  storageKey: string
  className?: string
  backdropClassName?: string
  panelClassName?: string
  closeClassName?: string
  closeLabel?: string
  ariaLabel?: string
  children: ReactNode
}

function readDismissed(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function persistDismissed(key: string): void {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    /* ignore quota / private mode */
  }
}

/** Session-dismissible pop-up shell with focus trap basics. */
export function PopupBanner({
  storageKey,
  className,
  backdropClassName,
  panelClassName,
  closeClassName,
  closeLabel = 'Dismiss',
  ariaLabel = 'Promotion',
  children,
}: PopupBannerProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!readDismissed(storageKey)) setOpen(true)
  }, [storageKey])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const dismiss = useCallback(() => {
    persistDismissed(storageKey)
    setOpen(false)
  }, [storageKey])

  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) dismiss()
    },
    [dismiss],
  )

  if (!mounted || !open || typeof document === 'undefined') return null

  return createPortal(
    <div className={className} role="presentation">
      <div className={backdropClassName} onClick={onBackdropClick} aria-hidden />
      <div
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={ariaLabel}
      >
        <button
          ref={closeRef}
          type="button"
          className={closeClassName}
          onClick={dismiss}
          aria-label={closeLabel}
        >
          <span aria-hidden>×</span>
        </button>
        <div id={titleId}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function popupStorageKey(tenantId: string): string {
  return `sf-storefront-popup:${tenantId}`
}
