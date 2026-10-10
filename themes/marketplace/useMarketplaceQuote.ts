'use client'

import { useEffect, useState } from 'react'
import { quoteMarketplaceCheckout, type MarketplaceQuote } from '@/lib/marketplace-api'
import type { MarketplaceCartLine } from './cart'

/**
 * Server-priced quote for the current cart (per-seller shipping, totals). Re-quotes when the
 * cart changes; an error usually means a listing went unavailable — the cart page says so.
 */
export function useMarketplaceQuote(tenantId: string, lines: MarketplaceCartLine[]) {
  const [quote, setQuote] = useState<MarketplaceQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const key = lines.map((l) => `${l.productId}:${l.quantity}${l.variantId ? `:${l.variantId}` : ''}`).join(',')

  useEffect(() => {
    if (!key) {
      setQuote(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(() => {
      quoteMarketplaceCheckout({
        tenantId,
        lines: key.split(',').map((part) => {
          const [listingId, qty, variantId] = part.split(':')
          return { listingId, quantity: Number(qty) || 1, ...(variantId ? { variantId } : {}) }
        }),
      })
        .then((q) => {
          if (cancelled) return
          setQuote(q)
          setError(null)
        })
        .catch((e: unknown) => {
          if (cancelled) return
          setQuote(null)
          setError(e instanceof Error ? e.message : 'Could not price your cart.')
        })
        .finally(() => !cancelled && setLoading(false))
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [tenantId, key])

  return { quote, error, loading }
}
