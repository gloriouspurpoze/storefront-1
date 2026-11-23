'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { previewCheckoutDiscount, type CheckoutDiscountPreview } from '@/lib/storefront-api'

export interface CheckoutDiscountLine {
  productId: string
  quantity: number
  variantId?: string
}

const DEBOUNCE_MS = 350

/**
 * Server-priced discount state for a cart: auto offers always apply, an optional
 * coupon code can be applied/removed. The server is the authority — the numbers
 * here are for display and match what checkout will charge.
 */
export function useCheckoutDiscount(params: {
  tenantId: string
  lines: CheckoutDiscountLine[]
  email?: string
  fulfillmentMode?: string
}) {
  const { tenantId, lines, email, fulfillmentMode } = params
  const [applied, setApplied] = useState<string | undefined>()
  const [preview, setPreview] = useState<CheckoutDiscountPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const reqId = useRef(0)

  const linesKey = useMemo(
    () => JSON.stringify(lines.map((l) => [l.productId, l.variantId ?? '', l.quantity])),
    [lines],
  )

  // Re-price on cart / coupon changes (debounced; stale responses are dropped).
  useEffect(() => {
    if (!tenantId || !lines.length) {
      setPreview(null)
      return
    }
    const id = ++reqId.current
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      previewCheckoutDiscount({
        tenantId,
        items: lines,
        couponCode: applied,
        customerEmail: email,
        fulfillmentMode,
        signal: controller.signal,
      })
        .then((data) => {
          if (id !== reqId.current) return
          setPreview(data)
          setError(null)
        })
        .catch((err: unknown) => {
          if (id !== reqId.current || controller.signal.aborted) return
          if (applied) {
            // The coupon stopped applying (cart changed, expired, limit hit): drop it and re-price.
            setError(err instanceof Error ? err.message : 'Coupon no longer applies')
            setApplied(undefined)
          } else {
            setPreview(null)
          }
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // `lines` is represented by linesKey so a new array identity does not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, linesKey, applied, email, fulfillmentMode])

  const apply = useCallback(
    async (rawCode: string): Promise<boolean> => {
      const code = rawCode.trim().toUpperCase()
      if (!code) {
        setError('Enter a coupon code')
        return false
      }
      setLoading(true)
      setError(null)
      try {
        const data = await previewCheckoutDiscount({
          tenantId,
          items: lines,
          couponCode: code,
          customerEmail: email,
          fulfillmentMode,
        })
        setPreview(data)
        setApplied(code)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not apply coupon')
        return false
      } finally {
        setLoading(false)
      }
    },
    [tenantId, lines, email, fulfillmentMode],
  )

  const remove = useCallback(() => {
    setApplied(undefined)
    setError(null)
  }, [])

  const discountInr = preview?.discountInr ?? 0
  return { applied, preview, error, loading, apply, remove, discountInr }
}
