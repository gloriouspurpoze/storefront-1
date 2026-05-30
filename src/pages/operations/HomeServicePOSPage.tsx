import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  Copy,
  CreditCard,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  UserPlus,
  UserRound,
  Wrench,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { Checkbox } from '../../components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { useToast } from '../../components/ui'
import { platformServicesService, type PlatformService } from '../../services/api/platformServices.service'
import { usersService } from '../../services/api/users.service'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { PosService } from '../../services/api/pos.service'
import { CouponsService } from '../../services/api/coupons.service'
import { ProductsService } from '../../services/api/products.service'
import type { Product, User } from '../../types'
import type { Professional } from '../../types/professional.types'
import { formatMoney } from '../../lib/financeFormat'
import {
  buildMapsSearchQuery,
  googleMapsEmbedPlaceUrl,
  googleMapsSearchUrl,
} from '../../lib/googleMapsLinks'
import { cn } from '../../lib/utils'
import type { ApiError } from '../../services/api/base'
import { OperationsCommercialService } from '../../services/api/operations-commercial.service'
import type { TenantCommercialTermsDto } from '../../types/operating-commercial.types'

type CartLine =
  | {
      key: string
      kind: 'service'
      serviceId: string
      name: string
      quantity: number
      unitPrice: number
    }
  | {
      key: string
      kind: 'part'
      productId: string
      name: string
      sku?: string
      quantity: number
      unitPrice: number
    }

function serviceUnitPrice(s: PlatformService): number {
  if (s.service_type === 'hourly' && s.hourly_rate != null) return Number(s.hourly_rate)
  if (s.service_type === 'consultation' && s.consultation_fee != null)
    return Number(s.consultation_fee)
  if (s.base_price != null) return Number(s.base_price)
  return 0
}

function idempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Public `/auth/register` expects E.164-style phone starting with + and country digit 1–9 */
function normalizePhoneForRegister(raw: string): string {
  const s = raw.replace(/\s/g, '')
  if (!s) return s
  if (s.startsWith('+')) return s
  const digits = s.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return s
}

/** Matches ticket GST / total math in submit after coupon revalidation. */
function computePosTotals(
  lineSubtotal: number,
  manualDiscount: number,
  couponDiscount: number,
  gstPercent: number,
  gstApplied: boolean,
) {
  const afterManual = Math.max(0, lineSubtotal - manualDiscount)
  const afterCoupon = Math.max(0, afterManual - couponDiscount)
  const gstAmount =
    gstApplied && gstPercent > 0
      ? Math.round(afterCoupon * (gstPercent / 100) * 100) / 100
      : 0
  const grandTotal = Math.round((afterCoupon + gstAmount) * 100) / 100
  return { afterManual, afterCoupon, gstAmount, grandTotal }
}

/** Mirrors backend `computePlatformConvenienceFeesFromTerms` — fee base is merchandise after discounts (before service GST). */
function computePlatformConvenienceFeesFromTermsLocal(
  baseAfterDiscounts: number,
  terms: TenantCommercialTermsDto | null,
): { convenienceFee: number; convenienceFeeGst: number } {
  if (!terms) return { convenienceFee: 0, convenienceFeeGst: 0 }
  const base = Math.max(0, Number(baseAfterDiscounts) || 0)
  const pct = Number(terms.convenienceFeePercent) || 0
  const fixed = Number(terms.convenienceFeeFixed) || 0
  const minFee = Number(terms.minimumPlatformFeePerBooking) || 0
  const gstPct = Number(terms.gstPercentOnFees) || 0
  let fee = base * (pct / 100) + fixed
  fee = Math.round(fee * 100) / 100
  if (fee < minFee) fee = Math.round(minFee * 100) / 100
  const feeGst = gstPct > 0 ? Math.round(fee * (gstPct / 100) * 100) / 100 : 0
  return { convenienceFee: fee, convenienceFeeGst: feeGst }
}

function generatePosCustomerPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const special = '@$!%*?&'
  const all = upper + lower + digits + special
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]!
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)]
  for (let i = 0; i < 8; i++) chars.push(pick(all))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

export function HomeServicePOSPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [catalog, setCatalog] = useState<PlatformService[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogSearch, setCatalogSearch] = useState('')

  const [customerQuery, setCustomerQuery] = useState('')
  const [customerHits, setCustomerHits] = useState<User[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)

  const [cart, setCart] = useState<CartLine[]>([])

  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productSearch, setProductSearch] = useState('')

  const [couponInput, setCouponInput] = useState('')
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null)
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0)
  const [couponValidatedBasisKey, setCouponValidatedBasisKey] = useState<string | null>(null)
  const [couponValidating, setCouponValidating] = useState(false)

  const [useSplitTender, setUseSplitTender] = useState(false)
  const [tenderCash, setTenderCash] = useState(0)
  const [tenderCard, setTenderCard] = useState(0)
  const [tenderUpi, setTenderUpi] = useState(0)

  const [gstPercent, setGstPercent] = useState(18)
  const [applyGst, setApplyGst] = useState(true)
  const [discountInr, setDiscountInr] = useState(0)

  const [scheduledLocal, setScheduledLocal] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })

  const [addrFirst, setAddrFirst] = useState('')
  const [addrLast, setAddrLast] = useState('')
  const [addrLine, setAddrLine] = useState('')
  const [addrCity, setAddrCity] = useState('')
  const [addrState, setAddrState] = useState('')
  const [addrZip, setAddrZip] = useState('')
  const [addrCountry, setAddrCountry] = useState('India')
  const [addrPhone, setAddrPhone] = useState('')

  const [showGoogleMapPreview, setShowGoogleMapPreview] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'pay_now'>('COD')
  const [jobNotes, setJobNotes] = useState('')

  const [proQuery, setProQuery] = useState('')
  const [proHits, setProHits] = useState<Professional[]>([])
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null)
  const [skipAutoAssign, setSkipAutoAssign] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [ncEmail, setNcEmail] = useState('')
  const [ncFirst, setNcFirst] = useState('')
  const [ncLast, setNcLast] = useState('')
  const [ncPhone, setNcPhone] = useState('')
  const [ncPassword, setNcPassword] = useState('')
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const [commercialTerms, setCommercialTerms] = useState<TenantCommercialTermsDto | null>(null)

  useEffect(() => {
    if (newCustomerOpen) {
      setNcPassword(generatePosCustomerPassword())
    }
  }, [newCustomerOpen])

  useEffect(() => {
    void (async () => {
      try {
        const res = await OperationsCommercialService.getTerms()
        if (res.success && res.data) setCommercialTerms(res.data)
      } catch {
        setCommercialTerms(null)
      }
    })()
  }, [])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const res = await platformServicesService.getServices({
        page: 1,
        limit: 100,
        status: 'published',
        is_active: true,
        sort_by: 'sort_order',
        sort_order: 'asc',
      })
      setCatalog(res.services || [])
    } catch {
      setCatalog([])
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const res = await ProductsService.getProducts({
        page: 1,
        limit: 80,
        is_active: true,
        sort_by: 'name',
        sort_order: 'asc',
      })
      const payload = res.success ? res.data : null
      setProducts(payload?.products || [])
    } catch {
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    if (!customerQuery.trim() || customerQuery.trim().length < 2) {
      setCustomerHits([])
      return
    }
    const t = window.setTimeout(() => {
      void (async () => {
        setCustomerLoading(true)
        try {
          const res = await usersService.getUsers({
            scope: 'directory',
            user_type: 'customer',
            search: customerQuery.trim(),
            limit: 15,
            page: 1,
          })
          setCustomerHits(res?.users || [])
        } catch {
          setCustomerHits([])
        } finally {
          setCustomerLoading(false)
        }
      })()
    }, 320)
    return () => window.clearTimeout(t)
  }, [customerQuery])

  useEffect(() => {
    if (!proQuery.trim() || proQuery.trim().length < 2) {
      setProHits([])
      return
    }
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await ProfessionalsService.getProfessionals({
            search: proQuery.trim(),
            page: 1,
            limit: 20,
          })
          const payload = res.success ? res.data : null
          setProHits(payload?.professionals || [])
        } catch {
          setProHits([])
        }
      })()
    }, 320)
    return () => window.clearTimeout(t)
  }, [proQuery])

  useEffect(() => {
    if (selectedCustomer) {
      setAddrFirst(selectedCustomer.firstName || '')
      setAddrLast(selectedCustomer.lastName || '')
      setAddrPhone(selectedCustomer.phone || '')
    }
  }, [selectedCustomer])

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.short_description || '').toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q)),
    )
  }, [catalog, catalogSearch])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        String(p.name).toLowerCase().includes(q) ||
        String(p.sku || '').toLowerCase().includes(q),
    )
  }, [products, productSearch])

  const lineSubtotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [cart],
  )

  const afterManual = useMemo(
    () => Math.max(0, lineSubtotal - discountInr),
    [lineSubtotal, discountInr],
  )

  const afterCoupon = useMemo(
    () => Math.max(0, afterManual - appliedCouponDiscount),
    [afterManual, appliedCouponDiscount],
  )

  const gstAmount = useMemo(() => {
    if (!applyGst || gstPercent <= 0) return 0
    return Math.round(afterCoupon * (gstPercent / 100) * 100) / 100
  }, [applyGst, gstPercent, afterCoupon])

  const platformFeeBreakdown = useMemo(
    () => computePlatformConvenienceFeesFromTermsLocal(afterCoupon, commercialTerms),
    [afterCoupon, commercialTerms],
  )

  const grandTotal = useMemo(
    () =>
      Math.round(
        (afterCoupon +
          gstAmount +
          platformFeeBreakdown.convenienceFee +
          platformFeeBreakdown.convenienceFeeGst) *
          100,
      ) / 100,
    [afterCoupon, gstAmount, platformFeeBreakdown],
  )

  const splitSum = useMemo(
    () => tenderCash + tenderCard + tenderUpi,
    [tenderCash, tenderCard, tenderUpi],
  )

  const splitOk =
    !useSplitTender ||
    (splitSum > 0 && Math.abs(splitSum - grandTotal) <= 0.05)

  const couponPricingBasisKey = useMemo(
    () => `${lineSubtotal}|${discountInr}`,
    [lineSubtotal, discountInr],
  )

  const couponStale = Boolean(
    appliedCouponCode &&
      (couponValidatedBasisKey === null ||
        couponValidatedBasisKey !== couponPricingBasisKey),
  )

  const googleMapsEmbedKey = process.env.REACT_APP_GOOGLE_MAPS_EMBED_KEY?.trim() ?? ''

  const mapsSearchQuery = useMemo(
    () =>
      buildMapsSearchQuery({
        line: addrLine,
        city: addrCity,
        state: addrState,
        zip: addrZip,
        country: addrCountry,
      }),
    [addrLine, addrCity, addrState, addrZip, addrCountry],
  )

  const clearCoupon = useCallback(() => {
    setAppliedCouponCode(null)
    setAppliedCouponDiscount(0)
    setCouponInput('')
    setCouponValidatedBasisKey(null)
  }, [])

  useEffect(() => {
    if (afterManual <= 0 && appliedCouponCode) clearCoupon()
  }, [afterManual, appliedCouponCode, clearCoupon])

  const runCouponValidation = useCallback(
    async (rawCode: string, options?: { silent?: boolean }): Promise<number | null> => {
      const code = rawCode.trim()
      if (!code) {
        if (!options?.silent) {
          toast({ variant: 'destructive', title: 'Enter a code', description: 'Type a coupon code first.' })
        }
        return null
      }
      if (!selectedCustomer) {
        if (!options?.silent) {
          toast({
            variant: 'destructive',
            title: 'Select customer',
            description: 'Coupons are checked per customer account.',
          })
        }
        return null
      }
      if (afterManual <= 0) {
        if (!options?.silent) {
          toast({
            variant: 'destructive',
            title: 'No eligible subtotal',
            description: 'Add services or parts before applying a coupon.',
          })
        }
        return null
      }
      setCouponValidating(true)
      try {
        const res = await CouponsService.validateCoupon(code, {
          subtotal: afterManual,
          type: 'booking',
          userId: selectedCustomer.id,
        })
        const d = res.success ? res.data : null
        if (!d?.valid) {
          if (!options?.silent) {
            toast({
              variant: 'destructive',
              title: 'Coupon not applied',
              description: d?.error || d?.message || 'Invalid or ineligible code.',
            })
          } else {
            toast({
              variant: 'destructive',
              title: 'Coupon no longer valid',
              description: d?.error || d?.message || 'Re-check the code or remove it.',
            })
          }
          return null
        }
        const disc = Number(d.discountAmount ?? 0)
        const upper = code.toUpperCase()
        setAppliedCouponCode(upper)
        setAppliedCouponDiscount(disc)
        setCouponInput(upper)
        setCouponValidatedBasisKey(`${lineSubtotal}|${discountInr}`)
        if (!options?.silent) {
          toast({
            title: 'Coupon applied',
            description: `${formatMoney(disc)} off before GST.`,
          })
        }
        return disc
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Validation failed'
        if (!options?.silent) {
          toast({ variant: 'destructive', title: 'Coupon error', description: msg })
        } else {
          toast({ variant: 'destructive', title: 'Coupon validation failed', description: msg })
        }
        return null
      } finally {
        setCouponValidating(false)
      }
    },
    [selectedCustomer, afterManual, lineSubtotal, discountInr, toast],
  )

  const applyCouponCode = async () => {
    await runCouponValidation(couponInput, { silent: false })
  }

  const reapplyStaleCoupon = async () => {
    if (!appliedCouponCode) return
    await runCouponValidation(appliedCouponCode, { silent: false })
  }

  const addToCart = (s: PlatformService) => {
    const price = serviceUnitPrice(s)
    const key = `${s.id}-${Date.now()}`
    setCart((prev) => [
      ...prev,
      {
        key,
        kind: 'service' as const,
        serviceId: s.id,
        name: s.name,
        quantity: 1,
        unitPrice: price,
      },
    ])
  }

  const addPartToCart = (p: Product) => {
    const id = String(p.id)
    const price = Number(p.price) || 0
    const key = `part-${id}-${Date.now()}`
    setCart((prev) => [
      ...prev,
      {
        key,
        kind: 'part' as const,
        productId: id,
        name: p.name,
        sku: p.sku,
        quantity: 1,
        unitPrice: price,
      },
    ])
  }

  const updateLine = (key: string, patch: Partial<{ quantity: number; unitPrice: number }>) => {
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)).filter((l) => l.quantity > 0),
    )
  }

  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key))

  const copyNcPassword = async () => {
    try {
      await navigator.clipboard.writeText(ncPassword)
      toast({ title: 'Password copied', description: 'Hand this to the customer securely.' })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Select and copy the password manually.',
      })
    }
  }

  const createQuickCustomer = async () => {
    const email = ncEmail.trim()
    const fn = ncFirst.trim()
    const ln = ncLast.trim()
    const phone = normalizePhoneForRegister(ncPhone.trim())
    if (fn.length < 2 || ln.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Invalid name',
        description: 'First and last name must be at least 2 characters.',
      })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Invalid email', description: 'Enter a valid email.' })
      return
    }
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      toast({
        variant: 'destructive',
        title: 'Invalid phone',
        description: 'Use 10 digits (India: auto +91) or full international +country…',
      })
      return
    }
    setCreatingCustomer(true)
    try {
      const { user } = await usersService.createUser({
        email,
        firstName: fn,
        lastName: ln,
        phone,
        userType: 'customer',
        password: ncPassword,
      })
      setSelectedCustomer(user)
      toast({
        title: 'Customer created',
        description: `${user.email} is selected for this ticket. Share the password securely.`,
      })
      setNewCustomerOpen(false)
      setNcEmail('')
      setNcFirst('')
      setNcLast('')
      setNcPhone('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast({ variant: 'destructive', title: 'Could not create customer', description: msg })
    } finally {
      setCreatingCustomer(false)
    }
  }

  const clearFullTicket = () => {
    setCart([])
    setDiscountInr(0)
    setJobNotes('')
    setSelectedPro(null)
    setSkipAutoAssign(false)
    setSelectedCustomer(null)
    clearCoupon()
    setUseSplitTender(false)
    setTenderCash(0)
    setTenderCard(0)
    setTenderUpi(0)
    setShowGoogleMapPreview(false)
  }

  const submit = async () => {
    if (!selectedCustomer) return
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      let couponDiscForPayload = 0
      if (appliedCouponCode) {
        if (couponStale) {
          const disc = await runCouponValidation(appliedCouponCode, { silent: true })
          if (disc === null) return
          couponDiscForPayload = disc
        } else {
          couponDiscForPayload = appliedCouponDiscount
        }
      }

      const totals = computePosTotals(
        lineSubtotal,
        discountInr,
        couponDiscForPayload,
        gstPercent,
        applyGst,
      )
      const feeRows = computePlatformConvenienceFeesFromTermsLocal(totals.afterCoupon, commercialTerms)
      const grandWithFees =
        Math.round(
          (totals.afterCoupon + totals.gstAmount + feeRows.convenienceFee + feeRows.convenienceFeeGst) * 100,
        ) / 100

      if (useSplitTender) {
        const sum = tenderCash + tenderCard + tenderUpi
        if (!(sum > 0 && Math.abs(sum - grandWithFees) <= 0.05)) {
          toast({
            variant: 'destructive',
            title: 'Split tender mismatch',
            description: `Allocated cash, card, and UPI must total ${formatMoney(grandWithFees)} (±₹0.05).`,
          })
          return
        }
      }

      const scheduledIso = new Date(scheduledLocal).toISOString()
      const servicesPayload = cart
        .filter((l): l is Extract<CartLine, { kind: 'service' }> => l.kind === 'service')
        .map((l) => ({
          serviceId: l.serviceId,
          quantity: l.quantity,
          price: l.unitPrice,
          name: l.name,
        }))
      const partsPayload = cart
        .filter((l): l is Extract<CartLine, { kind: 'part' }> => l.kind === 'part')
        .map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          price: l.unitPrice,
          name: l.name,
        }))

      const splitTender =
        useSplitTender
          ? [
              ...(tenderCash > 0 ? [{ method: 'cash' as const, amount: tenderCash }] : []),
              ...(tenderCard > 0 ? [{ method: 'card' as const, amount: tenderCard }] : []),
              ...(tenderUpi > 0 ? [{ method: 'upi' as const, amount: tenderUpi }] : []),
            ]
          : []

      const body = {
        customerId: selectedCustomer.id,
        professionalId: selectedPro?._id || selectedPro?.id || selectedPro?.professionalId,
        skipAutoAssign: skipAutoAssign && !selectedPro,
        scheduled_time: scheduledIso,
        notes: jobNotes.trim() || undefined,
        ...(servicesPayload.length > 0 ? { services: servicesPayload } : {}),
        ...(partsPayload.length > 0 ? { parts: partsPayload } : {}),
        couponCode: appliedCouponCode || undefined,
        posPricing: {
          lineSubtotal,
          manualDiscount: discountInr,
          couponDiscount: couponDiscForPayload,
          gstPercent,
          gstApplied: applyGst,
        },
        ...(splitTender.length > 0 ? { splitTender } : {}),
        address: {
          firstName: addrFirst || selectedCustomer.firstName || '',
          lastName: addrLast || selectedCustomer.lastName || '',
          address: addrLine,
          city: addrCity,
          state: addrState,
          zipCode: addrZip,
          country: addrCountry || 'India',
          phone: addrPhone || selectedCustomer.phone || '',
        },
        totalAmount: grandWithFees,
        paymentMethod: useSplitTender ? 'split' : paymentMethod,
        checkoutIdempotencyKey: idempotencyKey(),
      }

      const res = await PosService.adminCreateBooking(body)
      if (res.success && res.data?.booking) {
        const b = res.data.booking
        const bid = String(b.id || (b as { _id?: string })._id || '')
        setCart([])
        setDiscountInr(0)
        setJobNotes('')
        setSelectedPro(null)
        setSkipAutoAssign(false)
        clearCoupon()
        setUseSplitTender(false)
        setTenderCash(0)
        setTenderCard(0)
        setTenderUpi(0)
        if (bid) navigate(`/bookings/${bid}`)
      } else {
        toast({
          variant: 'destructive',
          title: 'Booking not created',
          description: res.message?.trim() || 'The server did not return a booking.',
        })
      }
    } catch (err: unknown) {
      const apiErr = err as Partial<ApiError>
      const raw =
        typeof apiErr.message === 'string' && apiErr.message.trim()
          ? apiErr.message.trim()
          : ''
      toast({
        variant: 'destructive',
        title: 'Checkout failed',
        description: raw || 'Could not create booking. Check totals and try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    !!selectedCustomer &&
    cart.length > 0 &&
    addrLine.trim() &&
    addrCity.trim() &&
    addrState.trim() &&
    scheduledLocal &&
    grandTotal >= 0 &&
    splitOk

  const printSummary = () => {
    window.print()
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 pb-16 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              ProFixer POS — Home services
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Register on-site and phone bookings against live catalog SKUs, GST-aware totals, workforce
            assignment, and the same booking + invoice pipeline as profixer.in customers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" asChild>
            <Link to="/bookings">Bookings ledger</Link>
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link to="/payments">Payments</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-5 w-5" aria-hidden />
                Service catalog
              </CardTitle>
              <CardDescription>
                Published platform services — tap to add a line. Tune price per visit when rates are
                negotiated.
              </CardDescription>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search services, tags…"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="flex justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                </div>
              ) : (
                <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCatalog.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addToCart(s)}
                      className={cn(
                        'flex flex-col rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-accent/40',
                      )}
                    >
                      <span className="font-medium leading-snug">{s.name}</span>
                      <span className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {s.short_description || s.service_type}
                      </span>
                      <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary">
                        <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                        {formatMoney(serviceUnitPrice(s))}
                        {s.service_type === 'hourly' ? '/hr' : ''}
                      </span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.emergency_service ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Emergency
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {s.service_type}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" aria-hidden />
                Parts catalog
              </CardTitle>
              <CardDescription>
                Retail SKUs (filters, consumables). Tap to add a line; quantity and counter price are
                editable like services.
              </CardDescription>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search parts by name or SKU…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No active parts match this search. Adjust filters or add products in Catalog.
                </p>
              ) : (
                <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((p) => (
                    <button
                      key={String(p.id)}
                      type="button"
                      onClick={() => addPartToCart(p)}
                      className={cn(
                        'flex flex-col rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-accent/40',
                      )}
                    >
                      <span className="font-medium leading-snug">{p.name}</span>
                      <span className="mt-1 font-mono text-[11px] text-muted-foreground">{p.sku}</span>
                      <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary">
                        <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                        {formatMoney(Number(p.price) || 0)}
                      </span>
                      {typeof p.stock_quantity === 'number' ? (
                        <span className="mt-1 text-[10px] text-muted-foreground">
                          Stock {p.stock_quantity}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-lg">Capabilities</CardTitle>
              <CardDescription>
                Built for Indian home services: GST line, pay-on-service vs pay-now, optional technician
                dispatch without platform auto-routing, and audit notes on every ticket.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>• Services + parts SKUs from the same catalogs as digital channels</p>
              <p>• Customer directory lookup + quick-create at the counter</p>
              <p>• Coupons validated before checkout; split tender recorded on the booking</p>
              <p>• Totals and `posPricing` align with `totalAmount` + downstream invoice</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-primary/20 shadow-md print:border print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" aria-hidden />
                Ticket
              </CardTitle>
              <CardDescription>Customer, cart, tax, schedule, and checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="flex items-center gap-2">
                    <UserRound className="h-4 w-4" aria-hidden />
                    Customer
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setNewCustomerOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden />
                    New customer
                  </Button>
                </div>
                {selectedCustomer ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <div>
                      <p className="font-medium">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                      {selectedCustomer.phone ? (
                        <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                      ) : null}
                    </div>
                    <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedCustomer(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search name, email, phone…"
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                    />
                    <div className="max-h-40 overflow-y-auto rounded-md border">
                      {customerLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : customerHits.length === 0 ? (
                        <p className="p-3 text-xs text-muted-foreground">
                          Type at least 2 characters to search customers.
                        </p>
                      ) : (
                        customerHits.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent"
                            onClick={() => {
                              setSelectedCustomer(u)
                              setCustomerQuery('')
                              setCustomerHits([])
                            }}
                          >
                            <span className="font-medium">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Cart</Label>
                {cart.length === 0 ? (
                  <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                    Add services or parts from the catalogs.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {cart.map((l) => (
                      <li
                        key={l.key}
                        className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium leading-snug">{l.name}</p>
                            {l.kind === 'service' ? (
                              <Badge variant="outline" className="text-[10px]">
                                Service
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Part
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {l.kind === 'service'
                              ? `SKU: ${l.serviceId}`
                              : `SKU: ${l.sku || l.productId}`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center rounded-md border">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateLine(l.key, { quantity: l.quantity - 1 })}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[2rem] text-center text-sm">{l.quantity}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateLine(l.key, { quantity: l.quantity + 1 })}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              className="h-8 w-24"
                              type="number"
                              min={0}
                              step={1}
                              value={l.unitPrice}
                              onChange={(e) =>
                                updateLine(l.key, { unitPrice: Math.max(0, Number(e.target.value)) })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeLine(l.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" aria-hidden />
                  Coupon
                </Label>
                {couponStale ? (
                  <div className="flex gap-2 rounded-md border border-bloom-coral/40 bg-bloom-coral/10 px-3 py-2 text-sm text-bloom-coral dark:text-bloom-deep">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p>
                        Cart or manual discount changed — confirm{' '}
                        <span className="font-medium">{appliedCouponCode}</span> before checkout (commit
                        will re-validate silently).
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        disabled={couponValidating || !selectedCustomer || afterManual <= 0}
                        onClick={() => void reapplyStaleCoupon()}
                      >
                        {couponValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          'Re-apply now'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="min-w-[160px] flex-1"
                    placeholder="Code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    disabled={!!appliedCouponCode && !couponStale}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      (!!appliedCouponCode && !couponStale) ||
                      couponValidating ||
                      !selectedCustomer ||
                      afterManual <= 0
                    }
                    onClick={() => void applyCouponCode()}
                  >
                    {couponValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                  {appliedCouponCode ? (
                    <Button type="button" variant="outline" onClick={clearCoupon}>
                      Clear coupon
                    </Button>
                  ) : null}
                </div>
                {appliedCouponCode ? (
                  <p className="text-xs text-muted-foreground">
                    Applied <span className="font-medium">{appliedCouponCode}</span> —{' '}
                    {formatMoney(appliedCouponDiscount)} off before GST.
                    {couponStale ? ' · Stale until re-applied or commit.' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Validates against the selected customer. Changing the cart or manual discount marks the
                    coupon stale until you re-apply or commit (auto re-validates on commit).
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={discountInr}
                    onChange={(e) => setDiscountInr(Math.max(0, Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gst"
                  checked={applyGst}
                  onCheckedChange={(c) => setApplyGst(c === true)}
                />
                <Label htmlFor="gst" className="font-normal">
                  Add GST to ticket total (India — default 18%)
                </Label>
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(lineSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Manual discount</span>
                  <span>− {formatMoney(discountInr)}</span>
                </div>
                {appliedCouponCode ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coupon ({appliedCouponCode})</span>
                    <span>− {formatMoney(appliedCouponDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    GST{applyGst ? ` (${gstPercent}%)` : ''}
                  </span>
                  <span>{applyGst ? formatMoney(gstAmount) : formatMoney(0)}</span>
                </div>
                {platformFeeBreakdown.convenienceFee > 0 ||
                platformFeeBreakdown.convenienceFeeGst > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform convenience fee</span>
                      <span>{formatMoney(platformFeeBreakdown.convenienceFee)}</span>
                    </div>
                    {platformFeeBreakdown.convenienceFeeGst > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          GST on platform fee ({commercialTerms?.gstPercentOnFees ?? 0}%)
                        </span>
                        <span>{formatMoney(platformFeeBreakdown.convenienceFeeGst)}</span>
                      </div>
                    ) : null}
                  </>
                ) : null}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Due</span>
                  <span>{formatMoney(grandTotal)}</span>
                </div>
                {useSplitTender ? (
                  <p className="pt-1 text-xs text-muted-foreground">
                    Split tender entries must sum to {formatMoney(grandTotal)} (±₹0.05).
                  </p>
                ) : null}
                {useSplitTender && !splitOk ? (
                  <p className="text-xs font-medium text-destructive">
                    Split total {formatMoney(splitSum)} does not match due.
                  </p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                  Scheduled start
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Service address
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={!mapsSearchQuery.trim()}
                      onClick={() =>
                        window.open(googleMapsSearchUrl(mapsSearchQuery), '_blank', 'noopener,noreferrer')
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      Google Maps
                    </Button>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="pos-map-embed"
                        checked={showGoogleMapPreview}
                        onCheckedChange={(c) => setShowGoogleMapPreview(c === true)}
                      />
                      <Label htmlFor="pos-map-embed" className="text-xs font-normal text-muted-foreground">
                        Map preview
                      </Label>
                    </div>
                  </div>
                </div>
                <Input placeholder="Street / landmark" value={addrLine} onChange={(e) => setAddrLine(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
                  <Input placeholder="PIN" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} />
                </div>
                <Input placeholder="State" value={addrState} onChange={(e) => setAddrState(e.target.value)} />
                <Input placeholder="Country" value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)} />
                {showGoogleMapPreview && googleMapsEmbedKey ? (
                  <div className="overflow-hidden rounded-md border bg-muted/30">
                    <iframe
                      title="Service address map preview"
                      className="aspect-[16/9] min-h-[180px] w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={googleMapsEmbedPlaceUrl(mapsSearchQuery || 'India', googleMapsEmbedKey)}
                      allowFullScreen
                    />
                  </div>
                ) : showGoogleMapPreview && !googleMapsEmbedKey ? (
                  <p className="text-xs text-muted-foreground">
                    Set <code className="rounded bg-muted px-1">REACT_APP_GOOGLE_MAPS_EMBED_KEY</code> for an
                    embedded preview (Maps Embed API, HTTP referrer–restricted). Use Open in Google Maps
                    above without a key.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Fill the address and use Google Maps to verify the pin. Optional embed uses{' '}
                    <code className="rounded bg-muted px-1">REACT_APP_GOOGLE_MAPS_EMBED_KEY</code>.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  value={paymentMethod}
                  disabled={useSplitTender}
                  onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'pay_now')}
                >
                  <option value="COD">Pay after service (COD / field collect)</option>
                  <option value="pay_now">Pay now (online link / terminal)</option>
                </select>
                {useSplitTender ? (
                  <p className="text-xs text-muted-foreground">
                    Checkout uses split tender below; primary payment method is recorded as split.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="split-tender"
                    checked={useSplitTender}
                    onCheckedChange={(c) => {
                      const on = c === true
                      setUseSplitTender(on)
                      if (!on) {
                        setTenderCash(0)
                        setTenderCard(0)
                        setTenderUpi(0)
                      }
                    }}
                  />
                  <Label htmlFor="split-tender" className="font-normal leading-snug">
                    Split tender (cash / card / UPI)
                  </Label>
                </div>
                {useSplitTender ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cash (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={tenderCash || ''}
                        onChange={(e) => setTenderCash(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Card (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={tenderCard || ''}
                        onChange={(e) => setTenderCard(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">UPI (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={tenderUpi || ''}
                        onChange={(e) => setTenderUpi(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Technician (optional)</Label>
                <Input
                  placeholder="Search professional…"
                  value={proQuery}
                  onChange={(e) => setProQuery(e.target.value)}
                />
                {selectedPro ? (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>
                      {selectedPro.firstName} {selectedPro.lastName}
                    </span>
                    <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedPro(null)}>
                      Clear
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-32 overflow-y-auto rounded-md border text-sm">
                    {proHits.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-accent"
                        onClick={() => {
                          setSelectedPro(p)
                          setProQuery('')
                          setProHits([])
                        }}
                      >
                        {p.firstName} {p.lastName}
                        {p.email ? <span className="block text-xs text-muted-foreground">{p.email}</span> : null}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skipauto"
                    checked={skipAutoAssign}
                    onCheckedChange={(c) => setSkipAutoAssign(c === true)}
                  />
                  <Label htmlFor="skipauto" className="font-normal leading-snug">
                    Skip platform auto-assign (leave job unassigned until dispatch assigns a pro)
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job notes (visible on booking)</Label>
                <Input
                  placeholder="Access instructions, scope, upsells…"
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2 print:hidden">
                <Button type="button" disabled={!canSubmit || submitting} onClick={() => void submit()}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    'Commit booking'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={clearFullTicket}>
                  Clear ticket
                </Button>
                <Button type="button" variant="outline" onClick={printSummary}>
                  <Printer className="mr-2 h-4 w-4" aria-hidden />
                  Print summary
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New customer</DialogTitle>
            <DialogDescription>
              Creates a customer via public signup with a generated password. Ideal for walk-ins; share the
              password securely or reset later from support. Deploy notes: docs/POS_DEPLOY.md
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pos-nc-email">Email</Label>
              <Input
                id="pos-nc-email"
                type="email"
                autoComplete="email"
                value={ncEmail}
                onChange={(e) => setNcEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="pos-nc-fn">First name</Label>
                <Input
                  id="pos-nc-fn"
                  value={ncFirst}
                  onChange={(e) => setNcFirst(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pos-nc-ln">Last name</Label>
                <Input
                  id="pos-nc-ln"
                  value={ncLast}
                  onChange={(e) => setNcLast(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pos-nc-phone">Phone</Label>
              <Input
                id="pos-nc-phone"
                placeholder="9876543210 or +919876543210"
                value={ncPhone}
                onChange={(e) => setNcPhone(e.target.value)}
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground">10-digit India numbers get +91 automatically.</p>
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="pos-nc-pw">Temporary password</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setNcPassword(generatePosCustomerPassword())}
                  >
                    Regenerate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => void copyNcPassword()}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    Copy
                  </Button>
                </div>
              </div>
              <Input id="pos-nc-pw" readOnly value={ncPassword} className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setNewCustomerOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={creatingCustomer} onClick={() => void createQuickCustomer()}>
              {creatingCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                'Create & select'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="hidden print:block">
        <h2 className="text-lg font-semibold">ProFixer — POS summary</h2>
        <p className="text-sm text-muted-foreground">profixer.in · Home services control plane</p>
        <Separator className="my-4" />
        <p className="text-sm">
          Use this printout as a counter receipt; authoritative records live in Bookings and Invoices.
        </p>
      </div>
    </div>
  )
}

export default HomeServicePOSPage
