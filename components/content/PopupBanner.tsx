'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from '@/ui'

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

  // The popup lives in the site layout, so following its offer link (client-side navigation) would
  // otherwise leave it open on the next page. Closing is deferred one tick so the click still
  // reaches the link and navigation proceeds; it counts as dismissed for this session.
  const onContentClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('a[href], [data-popup-dismiss]')) window.setTimeout(dismiss, 0)
    },
    [dismiss],
  )

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
          <IconClose size={18} />
        </button>
        <div id={titleId} onClick={onContentClick}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// popupStorageKey lives in lib/storefrontContent: this module is 'use client', so server
// components (theme-kit factories, StoreOffers) cannot call functions exported from here.
export { popupStorageKey } from '@/lib/storefrontContent'
