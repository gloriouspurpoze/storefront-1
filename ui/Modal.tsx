'use client'

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { portalRoot } from './portal'
import { IconClose } from './icons'
import { IconButton } from './Button'
import { useOverlay } from './useOverlay'

export function Modal({
  open,
  onClose,
  label,
  size,
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  /** Accessible name for the dialog. */
  label: string
  size?: 'sm'
  className?: string
  children: ReactNode
}) {
  const { mounted, closing, panelRef, requestClose } = useOverlay(open, onClose, 150)
  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="sf-overlay sf-overlay--modal" data-closing={closing || undefined} aria-hidden />
      <div className="sf-modal-wrap" onClick={(e) => e.target === e.currentTarget && requestClose()}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className={cx('sf-modal', size === 'sm' && 'sf-modal--sm', className)}
          data-closing={closing || undefined}
        >
          <IconButton label="Close" solid className="sf-modal__close" onClick={requestClose}>
            <IconClose />
          </IconButton>
          {children}
        </div>
      </div>
    </>,
    portalRoot(),
  )
}
