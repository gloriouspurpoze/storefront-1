/**
 * Mixed marketplace cart — products, services, and bazaar lines in one checkout.
 */
'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type MarketplaceListingType = 'product' | 'service' | 'bazaar'

export interface MarketplaceCartLine {
  listingId: string
  listingType: MarketplaceListingType
  sellerId: string
  sellerName: string
  title: string
  unitPriceInr: number
  quantity: number
  metadata?: Record<string, unknown>
}

interface MarketplaceCartContextValue {
  lines: MarketplaceCartLine[]
  itemCount: number
  subtotalInr: number
  sellerGroups: Array<{ sellerId: string; sellerName: string; lines: MarketplaceCartLine[]; subtotalInr: number }>
  addLine: (line: Omit<MarketplaceCartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (listingId: string, quantity: number) => void
  removeLine: (listingId: string) => void
  clear: () => void
  toCheckoutPayload: () => Array<{ listingId: string; quantity: number; metadata?: Record<string, unknown> }>
}

const MarketplaceCartContext = createContext<MarketplaceCartContextValue | null>(null)

function storageKey(tenantId: string): string {
  return `sf-marketplace-cart:${tenantId}`
}

function readCart(tenantId: string): MarketplaceCartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(tenantId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as MarketplaceCartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCart(tenantId: string, lines: MarketplaceCartLine[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(tenantId), JSON.stringify(lines))
}

export function MarketplaceCartProvider({
  tenantId,
  children,
}: {
  tenantId: string
  children: React.ReactNode
}) {
  const [lines, setLines] = useState<MarketplaceCartLine[]>([])

  useEffect(() => {
    setLines(readCart(tenantId))
  }, [tenantId])

  const persist = useCallback(
    (next: MarketplaceCartLine[]) => {
      setLines(next)
      writeCart(tenantId, next)
    },
    [tenantId],
  )

  const addLine = useCallback(
    (line: Omit<MarketplaceCartLine, 'quantity'>, quantity = 1) => {
      const qty = Math.min(Math.max(Math.floor(quantity), 1), 99)
      setLines((prev) => {
        const existing = prev.find((l) => l.listingId === line.listingId)
        const next = existing
          ? prev.map((l) =>
              l.listingId === line.listingId
                ? { ...l, quantity: Math.min(l.quantity + qty, 99) }
                : l,
            )
          : [...prev, { ...line, quantity: qty }]
        writeCart(tenantId, next)
        return next
      })
    },
    [tenantId],
  )

  const setQuantity = useCallback(
    (listingId: string, quantity: number) => {
      const qty = Math.min(Math.max(Math.floor(quantity), 0), 99)
      setLines((prev) => {
        const next =
          qty <= 0 ? prev.filter((l) => l.listingId !== listingId) : prev.map((l) => (l.listingId === listingId ? { ...l, quantity: qty } : l))
        writeCart(tenantId, next)
        return next
      })
    },
    [tenantId],
  )

  const removeLine = useCallback(
    (listingId: string) => {
      setLines((prev) => {
        const next = prev.filter((l) => l.listingId !== listingId)
        writeCart(tenantId, next)
        return next
      })
    },
    [tenantId],
  )

  const clear = useCallback(() => persist([]), [persist])

  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines])
  const subtotalInr = useMemo(
    () => lines.reduce((s, l) => s + l.unitPriceInr * l.quantity, 0),
    [lines],
  )

  const sellerGroups = useMemo(() => {
    const map = new Map<string, { sellerId: string; sellerName: string; lines: MarketplaceCartLine[]; subtotalInr: number }>()
    for (const line of lines) {
      const g = map.get(line.sellerId) ?? {
        sellerId: line.sellerId,
        sellerName: line.sellerName,
        lines: [],
        subtotalInr: 0,
      }
      g.lines.push(line)
      g.subtotalInr += line.unitPriceInr * line.quantity
      map.set(line.sellerId, g)
    }
    return [...map.values()]
  }, [lines])

  const toCheckoutPayload = useCallback(
    () =>
      lines.map((l) => ({
        listingId: l.listingId,
        quantity: l.quantity,
        metadata: l.metadata,
      })),
    [lines],
  )

  const value: MarketplaceCartContextValue = {
    lines,
    itemCount,
    subtotalInr,
    sellerGroups,
    addLine,
    setQuantity,
    removeLine,
    clear,
    toCheckoutPayload,
  }

  return (
    <MarketplaceCartContext.Provider value={value}>{children}</MarketplaceCartContext.Provider>
  )
}

export function useMarketplaceCart(): MarketplaceCartContextValue {
  const ctx = useContext(MarketplaceCartContext)
  if (!ctx) {
    throw new Error('useMarketplaceCart must be used within MarketplaceCartProvider')
  }
  return ctx
}
