'use client'

import { useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { portalRoot } from './portal'
import { IconClose } from './icons'
import { IconButton } from './Button'
import { useOverlay } from './useOverlay'

export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  footer,
  className,
  bodyClassName,
  children,
  hideHeader,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  side?: 'left' | 'right' | 'bottom' | 'top'
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
  /** Render your own header inside children. */
  hideHeader?: boolean
}) {
  const { mounted, closing, panelRef, requestClose } = useOverlay(open, onClose)
  const titleId = useId()
  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="sf-overlay" data-closing={closing || undefined} onClick={requestClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cx('sf-drawer', `sf-drawer--${side}`, className)}
        data-closing={closing || undefined}
      >
        {!hideHeader && (
          <div className="sf-drawer__head">
            <h2 id={titleId} className="sf-drawer__title">
              {title}
            </h2>
            <IconButton label="Close" onClick={requestClose}>
              <IconClose />
            </IconButton>
          </div>
        )}
        <div className={cx('sf-drawer__body', bodyClassName)}>{children}</div>
        {footer && <div className="sf-drawer__foot">{footer}</div>}
      </div>
    </>,
    portalRoot(),
  )
}
