/**
 * Coupon Input Component
 * Allows users to enter and apply coupon codes
 */

import React, { useState } from 'react'
import { Gift, X, Check, Loader2 } from 'lucide-react'
import { CouponsService } from '../../services/api/coupons.service'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'

export interface CouponInputProps {
  subtotal: number
  onCouponApplied: (coupon: { code: string; discount: number; couponId: string }) => void
  onCouponRemoved: () => void
  disabled?: boolean
  appliedCouponCode?: string
}

export function CouponInput({
  subtotal,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
  appliedCouponCode,
}: CouponInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(!!appliedCouponCode)

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = (await CouponsService.validateCoupon(code.toUpperCase(), {
        subtotal,
        type: 'order',
      })) as { success?: boolean; data?: { valid?: boolean; message?: string; coupon?: { code: string; id: string }; discount?: number } }

      if (response.success && response.data?.valid && response.data.coupon) {
        onCouponApplied({
          code: response.data.coupon.code,
          discount: response.data.discount ?? 0,
          couponId: response.data.coupon.id,
        })
        setApplied(true)
        setError(null)
      } else {
        setError(response.data?.message || 'Invalid coupon code')
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Failed to validate coupon')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setCode('')
    setApplied(false)
    setError(null)
    onCouponRemoved()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleApply()
    }
  }

  if (applied) {
    return (
      <div>
        <Badge
          variant="default"
          className="h-8 gap-1.5 border-emerald-600/30 bg-emerald-600/15 pl-2 pr-1 text-emerald-900 dark:text-emerald-100"
        >
          <Check className="h-3.5 w-3.5" />
          Coupon Applied: {appliedCouponCode || code}
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="ml-1 rounded p-0.5 hover:bg-emerald-900/10"
              aria-label="Remove coupon"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </Badge>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
        <div className="relative min-w-0 flex-1">
          <Label htmlFor="coupon-code" className="sr-only">
            Coupon Code
          </Label>
          <Gift
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="coupon-code"
            className="pl-9"
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            aria-invalid={!!error}
          />
        </div>
        <Button
          type="button"
          onClick={() => void handleApply()}
          disabled={disabled || loading || !code.trim()}
          className="min-w-[100px] shrink-0"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Apply'}
        </Button>
      </div>

      {error && (
        <div
          className={cn('mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive')}
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  )
}
