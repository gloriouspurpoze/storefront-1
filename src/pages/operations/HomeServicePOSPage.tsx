import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
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
import { PosCustomerDialog, type PosCustomerDialogPrefill } from '../../components/operations/PosCustomerDialog'
import { CustomerTrackLinkCard } from '../../components/bookings/CustomerTrackLinkCard'
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
import { OperationsCommercialService } from '../../services/api/operations-commercial.service'
import { CategoriesService } from '../../services/api/categories.service'
import { CMSService } from '../../services/api/cms.service'
import type { Product, User, Category } from '../../types'
import type { Professional } from '../../types/professional.types'
import type { OperatingCityDto } from '../../types/operating-commercial.types'
import { formatMoney } from '../../lib/financeFormat'
import {
  applyCityMultiplierToUnitPrice,
  computePosCheckoutTotals,
  resolveCityPriceMultiplier,
} from '../../lib/posCheckoutPricing'
import {
  buildRateCardPriceIndex,
  resolvePosCatalogUnitPrice,
  serviceMatchesIndustryFilter,
} from '../../lib/posRateCardPrices'
import { rankProfessionals, type BookingMatchInput } from '../../lib/professionalAssignment'
import { POS_CUSTOMER_PATHS, parseCustomerSearchPrefill, type PosCustomerRegisterMode } from '../../lib/posCustomer'
import {
  buildMapsSearchQuery,
  googleMapsEmbedPlaceUrl,
  googleMapsSearchUrl,
} from '../../lib/googleMapsLinks'
import { cn } from '../../lib/utils'
import {
  posScheduledMaxLocalValue,
  posScheduledMinLocalValue,
  sanitizeIndianPinInput,
  validatePosCheckoutForm,
} from '../../lib/posCheckoutValidation'
import type { ApiError } from '../../services/api/base'
import type { TenantCommercialTermsDto } from '../../types/operating-commercial.types'

export type PosPageVariant = 'home_services' | 'salon'

const POS_COPY: Record<
  PosPageVariant,
  {
    title: string
    subtitle: string
    catalogTitle: string
    catalogHint: string
    proLabel: string
    skipAutoAssignHint: string
  }
> = {
  home_services: {
    title: 'ProFixer POS — Home services',
    subtitle:
      'Register on-site and phone bookings against live catalog SKUs, GST-aware totals, workforce assignment, and the same booking + invoice pipeline as profixer.in customers.',
    catalogTitle: 'Service catalog',
    catalogHint:
      'Published platform services — tap to add a line. Prices follow industry rate cards when synced, then city multipliers.',
    proLabel: 'Technician (optional)',
    skipAutoAssignHint:
      'Skip platform auto-assign (leave job unassigned until dispatch assigns a pro)',
  },
  salon: {
    title: 'ProFixer POS — Salon & spa',
    subtitle:
      'Walk-in and phone appointments using the shared booking pipeline. Treatment catalog, GST-aware totals, and stylist assignment — aligned with home-services POS economics until a dedicated salon checkout ships.',
    catalogTitle: 'Treatment catalog',
    catalogHint:
      'Published services for this tenant — tap to add a line. Filter by category; prices use rate cards and city zones when configured.',
    proLabel: 'Stylist (optional)',
    skipAutoAssignHint:
      'Skip platform auto-assign (leave appointment unassigned until dispatch assigns a stylist)',
  },
}

type CartLine =
  | {
      key: string
      kind: 'service'
      serviceId: string
      name: string
      category: string
      quantity: number
      baseUnitPrice: number
      unitPrice: number
      gstPercent: number
      taxIncluded: boolean
      priceSource: 'rate-card' | 'catalog'
    }
  | {
      key: string
      kind: 'part'
      productId: string
      name: string
      sku?: string
      quantity: number
      baseUnitPrice: number
      unitPrice: number
      gstPercent: number
      taxIncluded: boolean
    }

function idempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function HomeServicePOSPage({ variant = 'home_services' }: { variant?: PosPageVariant }) {
  const copy = POS_COPY[variant]
  const navigate = useNavigate()
  const { toast } = useToast()
  const [catalog, setCatalog] = useState<PlatformService[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('__all')
  const [serviceCategories, setServiceCategories] = useState<Category[]>([])
  const [operatingCities, setOperatingCities] = useState<OperatingCityDto[]>([])
  const [rateCardBlob, setRateCardBlob] = useState<Record<string, Array<{ name: string; price: string }>>>({})

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

  const [applyGst, setApplyGst] = useState(true)
  const [applyAfterHours, setApplyAfterHours] = useState(false)
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
  const [checkoutValidated, setCheckoutValidated] = useState(false)
  const [shareTrackOpen, setShareTrackOpen] = useState(false)
  const [shareTrackBookingId, setShareTrackBookingId] = useState('')
  const [shareTrackPhone, setShareTrackPhone] = useState('')

  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [addCustomerPrefill, setAddCustomerPrefill] = useState<PosCustomerDialogPrefill | undefined>()

  const [commercialTerms, setCommercialTerms] = useState<TenantCommercialTermsDto | null>(null)

  const openAddCustomer = useCallback(
    (mode?: PosCustomerRegisterMode) => {
      setAddCustomerPrefill({ ...parseCustomerSearchPrefill(customerQuery), mode })
      setAddCustomerOpen(true)
    },
    [customerQuery],
  )

  useEffect(() => {
    void (async () => {
      try {
        const [termsRes, citiesRes, rateRes, catRes] = await Promise.all([
          OperationsCommercialService.getTerms(),
          OperationsCommercialService.listCities({ activeOnly: true, limit: 100 }),
          CMSService.getRateCards().catch(() => ({})),
          CategoriesService.getCategories({
            page: 1,
            limit: 100,
            category_type: 'service',
            is_active: true,
          }).catch(() => null),
        ])
        if (termsRes.success && termsRes.data) setCommercialTerms(termsRes.data)
        if (citiesRes.success && citiesRes.data?.cities) setOperatingCities(citiesRes.data.cities)
        if (rateRes && typeof rateRes === 'object') {
          setRateCardBlob(rateRes as Record<string, Array<{ name: string; price: string }>>)
        }
        const cats = catRes?.data?.categories
        if (Array.isArray(cats)) setServiceCategories(cats)
      } catch {
        setCommercialTerms(null)
      }
    })()
  }, [])

  const rateCardIndex = useMemo(
    () =>
      buildRateCardPriceIndex(
        rateCardBlob,
        industryFilter === '__all' ? null : industryFilter,
      ),
    [rateCardBlob, industryFilter],
  )

  const { multiplier: cityMultiplier, matchedCity } = useMemo(
    () => resolveCityPriceMultiplier(addrCity, operatingCities),
    [addrCity, operatingCities],
  )

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const res = await platformServicesService.getServices({
        page: 1,
        limit: 500,
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

  useEffect(() => {
    setCart((prev) =>
      prev.map((l) => ({
        ...l,
        unitPrice: applyCityMultiplierToUnitPrice(l.baseUnitPrice, cityMultiplier),
      })),
    )
  }, [cityMultiplier])

  const industryOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of serviceCategories) {
      const slug = String(c.slug || c.name || c.id || '').trim()
      if (!slug) continue
      const key = slug.toLowerCase()
      if (!seen.has(key)) seen.set(key, c.name || slug)
    }
    for (const s of catalog) {
      const cat = String(s.category || '').trim()
      if (!cat) continue
      const key = cat.toLowerCase()
      if (!seen.has(key)) seen.set(key, cat)
    }
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [serviceCategories, catalog])

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase()
    return catalog.filter((s) => {
      if (industryFilter !== '__all' && !serviceMatchesIndustryFilter(s, industryFilter)) {
        return false
      }
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        (s.short_description || '').toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [catalog, catalogSearch, industryFilter])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        String(p.name).toLowerCase().includes(q) ||
        String(p.sku || '').toLowerCase().includes(q),
    )
  }, [products, productSearch])

  const checkoutLines = useMemo(
    () =>
      cart.map((l) => ({
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        gstPercent: l.gstPercent,
        taxIncluded: l.taxIncluded,
      })),
    [cart],
  )

  const pricingTotals = useMemo(
    () =>
      computePosCheckoutTotals({
        lines: checkoutLines,
        manualDiscount: discountInr,
        couponDiscount: appliedCouponDiscount,
        applyMerchandiseGst: applyGst,
        terms: commercialTerms,
        afterHours: applyAfterHours,
      }),
    [
      checkoutLines,
      discountInr,
      appliedCouponDiscount,
      applyGst,
      commercialTerms,
      applyAfterHours,
    ],
  )

  const lineSubtotal = pricingTotals.lineSubtotal
  const afterManual = pricingTotals.afterManual
  const afterCoupon = pricingTotals.afterCoupon
  const gstAmount = pricingTotals.merchandiseGstAmount
  const gstPercent = pricingTotals.effectiveGstPercent
  const platformFeeBreakdown = {
    visitingFee: pricingTotals.visitingFee,
    visitWaived: pricingTotals.visitWaived,
    convenienceFee: pricingTotals.convenienceFee,
    convenienceFeeGst: pricingTotals.convenienceFeeGst,
    afterHoursSurcharge: pricingTotals.afterHoursSurcharge,
  }
  const grandTotal = pricingTotals.grandTotal

  const splitSum = useMemo(
    () => tenderCash + tenderCard + tenderUpi,
    [tenderCash, tenderCard, tenderUpi],
  )

  const splitOk =
    !useSplitTender ||
    (splitSum > 0 && Math.abs(splitSum - grandTotal) <= 0.05)

  const resolvedServicePhone = useMemo(
    () => (addrPhone.trim() || selectedCustomer?.phone?.trim() || '').trim(),
    [addrPhone, selectedCustomer?.phone],
  )

  const scheduledMinLocal = useMemo(() => posScheduledMinLocalValue(), [])
  const scheduledMaxLocal = useMemo(() => posScheduledMaxLocalValue(), [])

  const buildCheckoutValidationInput = useCallback(
    () =>
      validatePosCheckoutForm({
        hasCustomer: Boolean(selectedCustomer),
        cartLineCount: cart.length,
        scheduledLocal,
        addrLine,
        addrCity,
        addrState,
        addrZip,
        addrCountry,
        phone: resolvedServicePhone,
        useSplitTender,
        splitOk,
        grandTotal,
      }),
    [
      selectedCustomer,
      cart.length,
      scheduledLocal,
      addrLine,
      addrCity,
      addrState,
      addrZip,
      addrCountry,
      resolvedServicePhone,
      useSplitTender,
      splitOk,
      grandTotal,
    ],
  )

  const checkoutValidation = useMemo(
    () => buildCheckoutValidationInput(),
    [buildCheckoutValidationInput],
  )

  const fieldErrors = checkoutValidation.errors
  const showFieldError = (key: keyof typeof fieldErrors) =>
    checkoutValidated && Boolean(fieldErrors[key])

  const canSubmit = checkoutValidation.valid

  const couponPricingBasisKey = useMemo(
    () => `${lineSubtotal}|${discountInr}`,
    [lineSubtotal, discountInr],
  )

  const couponStale = Boolean(
    appliedCouponCode &&
      (couponValidatedBasisKey === null ||
        couponValidatedBasisKey !== couponPricingBasisKey),
  )

  const bookingMatchInput = useMemo((): BookingMatchInput => {
    const serviceLines = cart.filter((l): l is Extract<CartLine, { kind: 'service' }> => l.kind === 'service')
    const primaryCategory =
      serviceLines[0]?.category || (industryFilter !== '__all' ? industryFilter : null)
    return {
      category: primaryCategory === '__all' ? null : primaryCategory,
      city: addrCity.trim() || null,
      pincode: addrZip.trim() || null,
      scheduledDateIso: scheduledLocal ? new Date(scheduledLocal).toISOString() : null,
    }
  }, [cart, industryFilter, addrCity, addrZip, scheduledLocal])

  const rankedPros = useMemo(
    () => rankProfessionals(proHits, bookingMatchInput),
    [proHits, bookingMatchInput],
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
    const { unitPrice: baseUnitPrice, priceSource } = resolvePosCatalogUnitPrice(s, rateCardIndex)
    const unitPrice = applyCityMultiplierToUnitPrice(baseUnitPrice, cityMultiplier)
    const key = `${s.id}-${Date.now()}`
    setCart((prev) => [
      ...prev,
      {
        key,
        kind: 'service' as const,
        serviceId: s.id,
        name: s.name,
        category: String(s.category || s.category_id || ''),
        quantity: 1,
        baseUnitPrice,
        unitPrice,
        gstPercent: Number(s.gst_percentage ?? 18) || 18,
        taxIncluded: s.tax_included === true,
        priceSource,
      },
    ])
  }

  const addPartToCart = (p: Product) => {
    const id = String(p.id)
    const baseUnitPrice = Number(p.price) || 0
    const unitPrice = applyCityMultiplierToUnitPrice(baseUnitPrice, cityMultiplier)
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
        baseUnitPrice,
        unitPrice,
        gstPercent: 18,
        taxIncluded: false,
      },
    ])
  }

  const updateLine = (
    key: string,
    patch: Partial<{ quantity: number; unitPrice: number; baseUnitPrice: number }>,
  ) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.key !== key) return l
          const next = { ...l, ...patch }
          if (patch.unitPrice != null && patch.baseUnitPrice == null) {
            next.baseUnitPrice = patch.unitPrice / (cityMultiplier || 1)
          }
          if (patch.baseUnitPrice != null) {
            next.unitPrice = applyCityMultiplierToUnitPrice(patch.baseUnitPrice, cityMultiplier)
          }
          return next
        })
        .filter((l) => l.quantity > 0),
    )
  }

  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key))

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
    setCheckoutValidated(true)
    const validation = buildCheckoutValidationInput()
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Complete required fields',
        description: validation.messages[0] || 'Fix the highlighted fields before committing.',
      })
      return
    }
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

      const totals = computePosCheckoutTotals({
        lines: checkoutLines,
        manualDiscount: discountInr,
        couponDiscount: couponDiscForPayload,
        applyMerchandiseGst: applyGst,
        terms: commercialTerms,
        afterHours: applyAfterHours,
      })
      const grandWithFees = totals.grandTotal

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
          gstPercent: totals.effectiveGstPercent,
          gstApplied: applyGst,
          afterHours: applyAfterHours,
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
        if (bid) {
          const phone =
            addrPhone.trim() || selectedCustomer?.phone?.trim() || body.address.phone?.trim() || ''
          setShareTrackBookingId(bid)
          setShareTrackPhone(phone)
          setShareTrackOpen(true)
          toast({
            title: 'Booking registered',
            description: `Job #${bid.slice(-8).toUpperCase()} — share the customer track link from the dialog.`,
          })
        }
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

  const inputErrorClass = (key: keyof typeof fieldErrors) =>
    cn(showFieldError(key) && 'border-destructive focus-visible:ring-destructive')

  const printSummary = () => {
    window.print()
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 pb-16 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>
          </div>
          <p className="mt-2 max-w-3xl text-muted-foreground">{copy.subtitle}</p>
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
                {copy.catalogTitle}
              </CardTitle>
              <CardDescription>{copy.catalogHint}</CardDescription>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-[220px]"
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  aria-label="Industry filter"
                >
                  <option value="__all">All industries</option>
                  {industryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search services, tags…"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>
              </div>
              {matchedCity ? (
                <p className="text-xs text-muted-foreground">
                  City zone: <span className="font-medium text-foreground">{matchedCity.name}</span> ×
                  {cityMultiplier} applied to catalog counter prices.
                </p>
              ) : addrCity.trim() ? (
                <p className="text-xs text-muted-foreground">
                  No operating-city match for “{addrCity.trim()}” — using ×1.0 until a zone is configured.
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="flex justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No published services match this industry / search.
                </p>
              ) : (
                <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCatalog.map((s) => {
                    const priced = resolvePosCatalogUnitPrice(s, rateCardIndex)
                    const displayPrice = applyCityMultiplierToUnitPrice(priced.unitPrice, cityMultiplier)
                    return (
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
                        {formatMoney(displayPrice)}
                        {s.service_type === 'hourly' ? '/hr' : ''}
                      </span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {priced.priceSource === 'rate-card' ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Rate card
                          </Badge>
                        ) : null}
                        {s.category ? (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {s.category}
                          </Badge>
                        ) : null}
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
                    )
                  })}
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
              <p>• Industry filter + rate-card prices merged with platform services</p>
              <p>• Operating-city multipliers from service address</p>
              <p>• Per-line GST, visit fee, convenience fee — same stack as consumer checkout</p>
              <p>• Workforce ranked by category fit, schedule, and loyalty tier</p>
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
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="gap-1"
                      onClick={() => openAddCustomer('walk_in')}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      Add walk-in
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openAddCustomer('full_account')}
                    >
                      Full account
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border border-dashed bg-muted/25 px-3 py-2 text-[11px] text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Three ways to attach a customer</p>
                  <ul className="space-y-1">
                    {POS_CUSTOMER_PATHS.map((p) => (
                      <li key={p.step}>
                        <span className="font-medium text-foreground">{p.step}. {p.title}</span> — {p.detail}
                      </li>
                    ))}
                  </ul>
                </div>
                {showFieldError('customer') ? (
                  <p className="text-xs text-destructive">{fieldErrors.customer}</p>
                ) : null}
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
                      ) : customerQuery.trim().length < 2 ? (
                        <p className="p-3 text-xs text-muted-foreground">
                          Type at least 2 characters to search the customer directory.
                        </p>
                      ) : customerHits.length === 0 ? (
                        <div className="space-y-2 p-3">
                          <p className="text-xs text-muted-foreground">
                            No match — try another spelling or add a new profile.
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              onClick={() => openAddCustomer('walk_in')}
                            >
                              Add as walk-in
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => openAddCustomer('full_account')}
                            >
                              Full account
                            </Button>
                          </div>
                        </div>
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
                            {l.kind === 'service' && l.priceSource === 'rate-card' ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Rate card
                              </Badge>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {l.kind === 'service'
                              ? `SKU: ${l.serviceId} · GST ${l.gstPercent}%${l.taxIncluded ? ' incl.' : ''}`
                              : `SKU: ${l.sku || l.productId} · GST ${l.gstPercent}%`}
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
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gst"
                    checked={applyGst}
                    onCheckedChange={(c) => setApplyGst(c === true)}
                  />
                  <Label htmlFor="gst" className="font-normal">
                    Add merchandise GST (weighted from catalog lines
                    {applyGst && gstPercent > 0 ? ` — ${gstPercent}% effective` : ''})
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="after-hours"
                    checked={applyAfterHours}
                    onCheckedChange={(c) => setApplyAfterHours(c === true)}
                  />
                  <Label htmlFor="after-hours" className="font-normal">
                    After-hours uplift
                    {commercialTerms?.afterHoursSurchargePercent
                      ? ` (${commercialTerms.afterHoursSurchargePercent}% on merchandise)`
                      : ''}
                  </Label>
                </div>
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
                    Merchandise GST{applyGst && gstPercent > 0 ? ` (${gstPercent}%)` : ''}
                  </span>
                  <span>{applyGst ? formatMoney(gstAmount) : formatMoney(0)}</span>
                </div>
                {platformFeeBreakdown.visitingFee > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visit / inspection fee</span>
                    <span>{formatMoney(platformFeeBreakdown.visitingFee)}</span>
                  </div>
                ) : platformFeeBreakdown.visitWaived ? (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Visit fee</span>
                    <span>Waived (cart ≥ threshold)</span>
                  </div>
                ) : null}
                {platformFeeBreakdown.afterHoursSurcharge > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After-hours uplift</span>
                    <span>{formatMoney(platformFeeBreakdown.afterHoursSurcharge)}</span>
                  </div>
                ) : null}
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
                {useSplitTender && showFieldError('splitTender') ? (
                  <p className="text-xs font-medium text-destructive">{fieldErrors.splitTender}</p>
                ) : useSplitTender && !splitOk ? (
                  <p className="text-xs font-medium text-destructive">
                    Split total {formatMoney(splitSum)} does not match due.
                  </p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                  Scheduled start <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledLocal}
                  min={scheduledMinLocal}
                  max={scheduledMaxLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  className={inputErrorClass('scheduled')}
                  aria-invalid={showFieldError('scheduled')}
                />
                {showFieldError('scheduled') ? (
                  <p className="text-xs text-destructive">{fieldErrors.scheduled}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Service address <span className="text-destructive">*</span>
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
                <Input
                  placeholder="Street / landmark *"
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  className={inputErrorClass('addrLine')}
                  aria-invalid={showFieldError('addrLine')}
                />
                {showFieldError('addrLine') ? (
                  <p className="text-xs text-destructive">{fieldErrors.addrLine}</p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      placeholder="City *"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className={inputErrorClass('addrCity')}
                      aria-invalid={showFieldError('addrCity')}
                    />
                    {showFieldError('addrCity') ? (
                      <p className="mt-1 text-xs text-destructive">{fieldErrors.addrCity}</p>
                    ) : null}
                  </div>
                  <div>
                    <Input
                      placeholder="PIN *"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      value={addrZip}
                      onChange={(e) => setAddrZip(sanitizeIndianPinInput(e.target.value))}
                      className={inputErrorClass('addrZip')}
                      aria-invalid={showFieldError('addrZip')}
                    />
                    {showFieldError('addrZip') ? (
                      <p className="mt-1 text-xs text-destructive">{fieldErrors.addrZip}</p>
                    ) : null}
                  </div>
                </div>
                <Input
                  placeholder="State *"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className={inputErrorClass('addrState')}
                  aria-invalid={showFieldError('addrState')}
                />
                {showFieldError('addrState') ? (
                  <p className="text-xs text-destructive">{fieldErrors.addrState}</p>
                ) : null}
                <Input
                  placeholder="Country"
                  value={addrCountry}
                  onChange={(e) => setAddrCountry(e.target.value)}
                  className={inputErrorClass('addrCountry')}
                  aria-invalid={showFieldError('addrCountry')}
                />
                {showFieldError('addrCountry') ? (
                  <p className="text-xs text-destructive">{fieldErrors.addrCountry}</p>
                ) : null}
                <div>
                  <Label htmlFor="pos-addr-phone" className="text-xs text-muted-foreground">
                    Contact mobile on job <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pos-addr-phone"
                    type="tel"
                    placeholder="10-digit mobile for SMS / tracking"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className={cn('mt-1', inputErrorClass('phone'))}
                    aria-invalid={showFieldError('phone')}
                  />
                  {showFieldError('phone') ? (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Prefilled from customer profile when selected; required for track link and SMS.
                    </p>
                  )}
                </div>
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
                <Label>{copy.proLabel}</Label>
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
                  <div className="max-h-40 overflow-y-auto rounded-md border text-sm">
                    {rankedPros.length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground">
                        Type at least 2 characters to search; results rank by category fit and availability.
                      </p>
                    ) : (
                      rankedPros.map((m) => (
                        <button
                          key={m.professional.id}
                          type="button"
                          disabled={!m.eligible}
                          className={cn(
                            'block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-accent',
                            !m.eligible && 'opacity-60',
                          )}
                          onClick={() => {
                            setSelectedPro(m.professional)
                            setProQuery('')
                            setProHits([])
                          }}
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span>
                              {m.professional.firstName} {m.professional.lastName}
                            </span>
                            <Badge variant={m.band === 'excellent' ? 'default' : 'secondary'} className="text-[10px]">
                              {m.score}/100
                            </Badge>
                            {!m.eligible ? (
                              <Badge variant="outline" className="text-[10px]">
                                Blocked
                              </Badge>
                            ) : null}
                          </span>
                          {m.professional.email ? (
                            <span className="block text-xs text-muted-foreground">{m.professional.email}</span>
                          ) : null}
                          {m.ineligibleReasons[0] ? (
                            <span className="block text-[10px] text-destructive">{m.ineligibleReasons[0]}</span>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skipauto"
                    checked={skipAutoAssign}
                    onCheckedChange={(c) => setSkipAutoAssign(c === true)}
                  />
                  <Label htmlFor="skipauto" className="font-normal leading-snug">
                    {copy.skipAutoAssignHint}
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
                {checkoutValidated && !canSubmit ? (
                  <div
                    className="mb-2 w-full rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    <p className="font-medium">Before you commit:</p>
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {checkoutValidation.messages.slice(0, 5).map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Button type="button" disabled={submitting} onClick={() => void submit()}>
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

      <Dialog open={shareTrackOpen} onOpenChange={setShareTrackOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share with customer</DialogTitle>
            <DialogDescription>
              Send this link by SMS or WhatsApp. They can see status without logging in.
            </DialogDescription>
          </DialogHeader>
          {shareTrackBookingId ? (
            <CustomerTrackLinkCard
              bookingId={shareTrackBookingId}
              customerPhone={shareTrackPhone || undefined}
            />
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShareTrackOpen(false)
              }}
            >
              Stay on POS
            </Button>
            <Button
              type="button"
              onClick={() => {
                const id = shareTrackBookingId
                setShareTrackOpen(false)
                if (id) navigate(`/bookings/${id}`)
              }}
            >
              Open booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PosCustomerDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        prefill={addCustomerPrefill}
        onSelected={(user) => {
          setSelectedCustomer(user)
          setCustomerQuery('')
          setCustomerHits([])
        }}
      />

      <div className="hidden print:block">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">profixer.in · Industry-aligned desk checkout</p>
        <Separator className="my-4" />
        <p className="text-sm">
          Use this printout as a counter receipt; authoritative records live in Bookings and Invoices.
        </p>
      </div>
    </div>
  )
}

export default HomeServicePOSPage
