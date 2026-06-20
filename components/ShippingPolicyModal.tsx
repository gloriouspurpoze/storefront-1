'use client'

import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { ShippingPolicyPanel } from '@/components/ShippingPolicyPanel'
import './shipping-policy-modal.css'

export function ShippingPolicyModal({
  open,
  onClose,
  config,
  title = 'Shipping policy',
}: {
  open: boolean
  onClose: () => void
  config?: StorefrontConfig | null
  title?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="sf-shipping-policy-modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sf-shipping-policy-title"
      onClick={onOverlayClick}
    >
      <div className="sf-shipping-policy-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="sf-shipping-policy-modal__head">
          <h2 id="sf-shipping-policy-title" className="sf-shipping-policy-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="sf-shipping-policy-modal__close"
            aria-label="Close shipping policy"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="sf-shipping-policy-modal__body">
          <ShippingPolicyPanel config={config} onClose={onClose} showFullPageLink />
        </div>
        <button type="button" className="sf-shipping-policy-modal__ack" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>,
    document.body,
  )
}
