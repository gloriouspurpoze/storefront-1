'use client'

import { useState, type KeyboardEvent } from 'react'
import type { CheckoutDiscountPreview } from '@/lib/storefront-api'
import './coupon-input.css'

export interface CouponInputProps {
  applied?: string
  preview: CheckoutDiscountPreview | null
  error: string | null
  loading: boolean
  onApply: (code: string) => Promise<boolean>
  onRemove: () => void
  /** Formats a rupee amount, e.g. formatMoney(n, currency). */
  formatMoney: (amount: number) => string
}

/** Coupon field + applied-offer summary. Server-priced; the parent owns the discount hook. */
export function CouponInput({
  applied,
  preview,
  error,
  loading,
  onApply,
  onRemove,
  formatMoney,
}: CouponInputProps) {
  const [code, setCode] = useState('')

  const submit = async () => {
    if (loading || !code.trim()) return
    if (await onApply(code)) setCode('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    void submit()
  }

  const saved = preview?.discountInr ?? 0

  return (
    <div className="sf-coupon" data-testid="coupon-input">
      {applied ? (
        <div className="sf-coupon-applied" role="status">
          <span className="sf-coupon-chip">
            <strong>{applied}</strong> applied
          </span>
          <button type="button" className="sf-coupon-remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      ) : (
        <div className="sf-coupon-row">
          <label className="sf-coupon-label" htmlFor="sf-coupon-code">
            Coupon code
          </label>
          <input
            id="sf-coupon-code"
            className="sf-coupon-field"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={onKeyDown}
            placeholder="Enter code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={40}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'sf-coupon-error' : undefined}
          />
          <button
            type="button"
            className="sf-coupon-apply"
            onClick={() => void submit()}
            disabled={loading || !code.trim()}
          >
            {loading ? 'Checking…' : 'Apply'}
          </button>
        </div>
      )}

      {error ? (
        <p id="sf-coupon-error" className="sf-coupon-error" role="alert">
          {error}
        </p>
      ) : null}

      {preview?.offerName && !applied ? (
        <p className="sf-coupon-offer">{preview.offerName} applied</p>
      ) : null}

      {saved > 0 ? (
        <p className="sf-coupon-saved">You save {formatMoney(saved)} on this order</p>
      ) : null}
      {preview?.freeShipping ? <p className="sf-coupon-saved">Free shipping applied</p> : null}
    </div>
  )
}
