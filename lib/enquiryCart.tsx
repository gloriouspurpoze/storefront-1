/**
 * Home-services enquiry cart — multi-service lines for storefront lead submit.
 * Guest cart: localStorage per tenant. Logged-in: keyed by tenant + userId (persists).
 */
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import type { PublicService } from '@/lib/storefront-api'

export interface EnquiryCartLine {
  /** Unique line id so the same service can be added more than once as separate lines. */
  lineId: string
  serviceId: string
  serviceSlug: string
  name: string
  unitPrice: number
  currency: string
  quantity: number
  imageUrl?: string
}

interface EnquiryCartContextValue {
  lines: EnquiryCartLine[]
  itemCount: number
  estimatedTotal: number
  currency: string
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addService: (service: PublicService, quantity?: number) => void
  setQuantity: (lineId: string, quantity: number) => void
  removeLine: (lineId: string) => void
  clear: () => void
}

const EnquiryCartContext = createContext<EnquiryCartContextValue | null>(null)

const GUEST_PREFIX = 'sf-hs-enquiry-cart'
const USER_PREFIX = 'sf-hs-enquiry-cart-user'

function guestKey(tenantId: string): string {
  return `${GUEST_PREFIX}:${tenantId}`
}

function userKey(tenantId: string, userId: string): string {
  return `${USER_PREFIX}:${tenantId}:${userId}`
}

function readLines(key: string): EnquiryCartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as EnquiryCartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLines(key: string, lines: EnquiryCartLine[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(lines))
}

function newLineId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function EnquiryCartProvider({
  tenantId,
  children,
}: {
  tenantId: string
  children: ReactNode
}) {
  const { user, isReady, isAuthenticated } = useAccountAuth()
  const [lines, setLines] = useState<EnquiryCartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [storageReady, setStorageReady] = useState(false)

  const activeKey = useMemo(() => {
    if (isAuthenticated && user?.id) return userKey(tenantId, user.id)
    return guestKey(tenantId)
  }, [isAuthenticated, user?.id, tenantId])

  useEffect(() => {
    if (!isReady || !tenantId) return
    let next = readLines(activeKey)
    // Migrate guest cart into the logged-in bucket once.
    if (isAuthenticated && user?.id) {
      const guest = readLines(guestKey(tenantId))
      if (guest.length > 0) {
        next = [...next, ...guest]
        writeLines(activeKey, next)
        localStorage.removeItem(guestKey(tenantId))
      }
    }
    setLines(next)
    setStorageReady(true)
  }, [activeKey, isReady, isAuthenticated, user?.id, tenantId])

  const persist = useCallback(
    (next: EnquiryCartLine[]) => {
      setLines(next)
      if (storageReady) writeLines(activeKey, next)
    },
    [activeKey, storageReady],
  )

  const addService = useCallback(
    (service: PublicService, quantity = 1) => {
      const qty = Math.min(Math.max(Math.floor(quantity), 1), 99)
      // New line each add so the same service can appear twice (distinct lineIds).
      const line: EnquiryCartLine = {
        lineId: newLineId(),
        serviceId: service.id,
        serviceSlug: service.slug,
        name: service.name,
        unitPrice: typeof service.basePrice === 'number' && service.basePrice > 0 ? service.basePrice : 0,
        currency: (service.currency || 'INR').toUpperCase(),
        quantity: qty,
        imageUrl: service.imageUrl,
      }
      setLines((prev) => {
        const next = [...prev, line]
        writeLines(activeKey, next)
        return next
      })
    },
    [activeKey],
  )

  const setQuantity = useCallback(
    (lineId: string, quantity: number) => {
      const qty = Math.floor(quantity)
      setLines((prev) => {
        const next =
          qty <= 0
            ? prev.filter((l) => l.lineId !== lineId)
            : prev.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.min(qty, 99) } : l))
        writeLines(activeKey, next)
        return next
      })
    },
    [activeKey],
  )

  const removeLine = useCallback(
    (lineId: string) => {
      setLines((prev) => {
        const next = prev.filter((l) => l.lineId !== lineId)
        writeLines(activeKey, next)
        return next
      })
    },
    [activeKey],
  )

  const clear = useCallback(() => persist([]), [persist])

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])
  const estimatedTotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines],
  )
  const currency = lines[0]?.currency ?? 'INR'

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      estimatedTotal,
      currency,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((v) => !v),
      addService,
      setQuantity,
      removeLine,
      clear,
    }),
    [lines, itemCount, estimatedTotal, currency, isOpen, addService, setQuantity, removeLine, clear],
  )

  return <EnquiryCartContext.Provider value={value}>{children}</EnquiryCartContext.Provider>
}

export function useEnquiryCart(): EnquiryCartContextValue {
  const ctx = useContext(EnquiryCartContext)
  if (!ctx) throw new Error('useEnquiryCart must be used within EnquiryCartProvider')
  return ctx
}

export function formatEnquiryMoney(amount: number, currency = 'INR'): string {
  const code = currency.toUpperCase()
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${code} ${amount.toLocaleString()}`
  }
}
