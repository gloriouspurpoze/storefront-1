import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
  Badge,
  Switch,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from '../../components/ui'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  TicketPercent,
  TrendingUp,
  Users,
  Calendar,
  Copy,
  Check,
  IndianRupee,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { CouponsService } from '../../services/api/coupons.service'
import { CategoriesService } from '../../services/api/categories.service'
import { platformServicesService } from '../../services/api/platformServices.service'
import type { PlatformService } from '../../services/api/platformServices.service'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { cn } from '../../lib/utils'

function toDateInputValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

interface Coupon {
  id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'first_order'
  value: number
  minimum_amount: number
  maximum_discount?: number
  usage_limit?: number
  usage_count: number
  user_limit: number
  is_active: boolean
  starts_at: string
  expires_at?: string
  applicable_to: 'all' | 'services' | 'products' | 'bookings'
  applicable_categories?: string[]
  applicable_services?: string[]
  min_items?: number
  created_at: string
  updated_at: string
}

type OfferMode = 'simple' | 'quantity_combo'

type CouponFormData = Pick<
  Coupon,
  | 'code'
  | 'name'
  | 'description'
  | 'type'
  | 'value'
  | 'minimum_amount'
  | 'user_limit'
  | 'is_active'
  | 'starts_at'
  | 'applicable_to'
> & {
  maximum_discount: number
  usage_limit: number
  expires_at: string
  offer_mode: OfferMode
  min_items: number
  applicable_categories: string[]
  applicable_services: string[]
}

/** Quick-start templates founders can pick instead of filling every field. */
const COMBO_PRESETS: Array<{
  id: string
  label: string
  hint: string
  patch: Partial<CouponFormData>
}> = [
  {
    id: 'ac2',
    label: '2 AC services — 15% off',
    hint: 'Most households have 2+ ACs. Provider visits once.',
    patch: {
      offer_mode: 'quantity_combo',
      name: '2 AC Services Combo',
      type: 'percentage',
      value: 15,
      min_items: 2,
      applicable_to: 'services',
    },
  },
  {
    id: 'reg2',
    label: '2 regulator changes — ₹100 off',
    hint: 'Flat discount when customer books 2 electrical jobs.',
    patch: {
      offer_mode: 'quantity_combo',
      name: '2 Regulator Change Combo',
      type: 'fixed_amount',
      value: 100,
      min_items: 2,
      applicable_to: 'services',
    },
  },
  {
    id: 'any3',
    label: 'Any 3 services — 10% off',
    hint: 'Cross-category basket builder — good for festival campaigns.',
    patch: {
      offer_mode: 'quantity_combo',
      name: 'Triple Service Combo',
      type: 'percentage',
      value: 10,
      min_items: 3,
      applicable_to: 'services',
    },
  },
]

export default function Coupons() {
  const confirm = useAppConfirm()
  const { checkPermission } = usePermissions()
  const canManageAdvanced = checkPermission('manage_coupons')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState('all')
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [copiedCode, setCopiedCode] = useState('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [serviceOptions, setServiceOptions] = useState<PlatformService[]>([])

  const [formData, setFormData] = useState<CouponFormData>(() => ({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    usage_limit: 1000,
    user_limit: 1,
    is_active: true,
    starts_at: new Date().toISOString().slice(0, 10),
    expires_at: '',
    applicable_to: 'all',
    offer_mode: 'simple',
    min_items: 2,
    applicable_categories: [],
    applicable_services: [],
  }))

  useEffect(() => {
    if (viewMode !== 'form') return
    void (async () => {
      try {
        const [catRes, svcRes] = await Promise.all([
          CategoriesService.getCategories({ limit: 200, is_active: true }),
          platformServicesService.getServices({ limit: 200, status: 'published' }),
        ])
        const cats = catRes.data?.categories ?? []
        setCategories(
          (cats as Array<{ id?: string; _id?: string; name: string }>).map((c) => ({
            id: String(c.id ?? c._id),
            name: c.name,
          })),
        )
        setServiceOptions(svcRes.services ?? [])
      } catch {
        /* non-fatal — combo targeting still works via manual IDs */
      }
    })()
  }, [viewMode])

  useEffect(() => {
    if (viewMode === 'list') {
      void fetchCoupons()
    }
  }, [viewMode])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await CouponsService.getCoupons({ limit: 500, page: 1 })
      if (response.success && response.data?.coupons?.length !== undefined) {
        setCoupons(response.data.coupons as unknown as Coupon[])
      } else {
        setCoupons([])
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const usageLimit = formData.usage_limit > 0 ? formData.usage_limit : undefined
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type,
        value: formData.value,
        minimum_amount: formData.minimum_amount,
        maximum_discount: formData.maximum_discount > 0 ? formData.maximum_discount : undefined,
        usage_limit: usageLimit,
        user_limit: formData.user_limit,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined,
        applicable_to:
          formData.offer_mode === 'quantity_combo' ? 'services' : formData.applicable_to,
        ...(formData.offer_mode === 'quantity_combo' && formData.min_items >= 2
          ? { min_items: formData.min_items }
          : {}),
        ...(formData.offer_mode === 'quantity_combo' && formData.applicable_categories.length > 0
          ? { applicable_categories: formData.applicable_categories }
          : {}),
        ...(canManageAdvanced &&
        formData.offer_mode === 'quantity_combo' &&
        formData.applicable_services.length > 0
          ? { applicable_services: formData.applicable_services }
          : {}),
      }

      if (editingCoupon) {
        const res = await CouponsService.updateCoupon(editingCoupon.id, {
          ...payload,
          is_active: formData.is_active,
        })
        if (!res.success) {
          appToast(res.message || 'Failed to update coupon', 'error')
          return
        }
      } else {
        const res = await CouponsService.createCoupon(payload)
        if (!res.success) {
          appToast(res.message || 'Failed to create coupon', 'error')
          return
        }
      }

      appToast(editingCoupon ? 'Coupon updated' : 'Coupon created', 'success')
      void fetchCoupons()
      setViewMode('list')
      resetForm()
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Failed to save coupon'
      appToast(msg, 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete coupon?',
      message: 'Delete this coupon?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const res = await CouponsService.deleteCoupon(id)
      if (!res.success) {
        appToast(res.message || 'Failed to delete coupon', 'error')
        return
      }
      appToast('Coupon deleted', 'success')
      void fetchCoupons()
    } catch {
      appToast('Error deleting coupon', 'error')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    const isCombo = (coupon.min_items ?? 0) >= 2
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minimum_amount: coupon.minimum_amount,
      maximum_discount: coupon.maximum_discount || 0,
      usage_limit: coupon.usage_limit ?? 1000,
      user_limit: coupon.user_limit,
      is_active: coupon.is_active,
      starts_at: toDateInputValue(coupon.starts_at),
      expires_at: toDateInputValue(coupon.expires_at),
      applicable_to: coupon.applicable_to,
      offer_mode: isCombo ? 'quantity_combo' : 'simple',
      min_items: coupon.min_items ?? 2,
      applicable_categories: coupon.applicable_categories ?? [],
      applicable_services: coupon.applicable_services ?? [],
    })
    setViewMode('form')
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimum_amount: 0,
      maximum_discount: 0,
      usage_limit: 1000,
      user_limit: 1,
      is_active: true,
      starts_at: new Date().toISOString().slice(0, 10),
      expires_at: '',
      applicable_to: 'all',
      offer_mode: 'simple',
      min_items: 2,
      applicable_categories: [],
      applicable_services: [],
    })
    setEditingCoupon(null)
  }

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.usage_limit) return 0
    return (coupon.usage_count / coupon.usage_limit) * 100
  }

  const filteredCoupons = () => {
    switch (tabValue) {
      case 'active':
        return coupons.filter((c) => c.is_active)
      case 'expired':
        return coupons.filter((c) => c.expires_at && new Date(c.expires_at) < new Date())
      default:
        return coupons
    }
  }

  const expiredCount = coupons.filter((c) => c.expires_at && new Date(c.expires_at) < new Date()).length

  if (viewMode === 'form') {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          subtitle={editingCoupon ? 'Update coupon details' : 'Add a new discount coupon'}
          action={
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setViewMode('list')
                resetForm()
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          }
        />

        <Card className="mt-6 rounded-xl">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <Separator className="mb-6" />
                <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="code">Coupon Code</Label>
                    <div className="relative">
                      <Input
                        id="code"
                        className="pr-10 font-mono font-semibold"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="WELCOME10"
                        required
                      />
                      <TicketPercent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Coupon Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Welcome Discount"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea
                      id="desc"
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="10% off for new customers"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Separator className="mb-6" />
                <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                  <Layers className="h-5 w-5 text-primary" />
                  Offer type
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Quantity combos unlock when the customer adds enough eligible services — ideal for
                  &ldquo;2 AC services 15% off&rdquo; or &ldquo;2 regulator changes ₹100 off&rdquo;.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: 'simple' as const,
                        title: 'Simple coupon',
                        desc: 'One code, one discount — no quantity floor.',
                      },
                      {
                        id: 'quantity_combo' as const,
                        title: 'Quantity combo',
                        desc: 'Discount unlocks when cart hits a min item count.',
                      },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, offer_mode: mode.id }))}
                      className={cn(
                        'rounded-lg border p-4 text-left transition-colors',
                        formData.offer_mode === mode.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:bg-muted/40',
                      )}
                    >
                      <div className="font-medium">{mode.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{mode.desc}</p>
                    </button>
                  ))}
                </div>

                {formData.offer_mode === 'quantity_combo' && (
                  <div className="mt-4 space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-wrap gap-2">
                      {COMBO_PRESETS.map((preset) => (
                        <Button
                          key={preset.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto flex-col items-start gap-0.5 py-2 text-left"
                          onClick={() =>
                            setFormData((f) => ({
                              ...f,
                              ...preset.patch,
                              code: f.code || '',
                            }))
                          }
                        >
                          <span className="flex items-center gap-1 font-medium">
                            <Sparkles className="h-3 w-3" />
                            {preset.label}
                          </span>
                          <span className="text-caption-sm font-normal text-muted-foreground">
                            {preset.hint}
                          </span>
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="min-items">Minimum quantity to unlock</Label>
                        <Input
                          id="min-items"
                          type="number"
                          min={2}
                          value={formData.min_items || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, min_items: Number(e.target.value) || 2 })
                          }
                          required
                        />
                        <p className="text-caption-sm text-muted-foreground">
                          Customer must add at least this many eligible services (same or different SKUs).
                        </p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Target categories (optional)</Label>
                        <div className="flex flex-wrap gap-2 rounded-md border border-border bg-background p-3 max-h-40 overflow-y-auto">
                          {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Loading categories…</p>
                          ) : (
                            categories.map((cat) => {
                              const checked = formData.applicable_categories.includes(cat.id)
                              return (
                                <label
                                  key={cat.id}
                                  className={cn(
                                    'flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-sm',
                                    checked ? 'border-primary bg-primary/10' : 'border-border',
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={checked}
                                    onChange={() =>
                                      setFormData((f) => ({
                                        ...f,
                                        applicable_categories: checked
                                          ? f.applicable_categories.filter((x) => x !== cat.id)
                                          : [...f.applicable_categories, cat.id],
                                      }))
                                    }
                                  />
                                  {cat.name}
                                </label>
                              )
                            })
                          )}
                        </div>
                        <p className="text-caption-sm text-muted-foreground">
                          Leave empty to apply to any service. Pick &ldquo;AC&rdquo; to restrict the combo to AC jobs only.
                        </p>
                      </div>

                      {canManageAdvanced && (
                        <div className="space-y-2 md:col-span-2">
                          <Label>Target specific services (advanced)</Label>
                          <div className="flex flex-wrap gap-2 rounded-md border border-border bg-background p-3 max-h-48 overflow-y-auto">
                            {serviceOptions.slice(0, 80).map((svc) => {
                              const checked = formData.applicable_services.includes(svc.id)
                              return (
                                <label
                                  key={svc.id}
                                  className={cn(
                                    'flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-sm',
                                    checked ? 'border-primary bg-primary/10' : 'border-border',
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={checked}
                                    onChange={() =>
                                      setFormData((f) => ({
                                        ...f,
                                        applicable_services: checked
                                          ? f.applicable_services.filter((x) => x !== svc.id)
                                          : [...f.applicable_services, svc.id],
                                      }))
                                    }
                                  />
                                  {svc.name}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Separator className="mb-6" />
                <h2 className="mb-4 text-lg font-semibold">Discount Details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as CouponFormData['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                        <SelectItem value="bogo">Buy One Get One</SelectItem>
                        <SelectItem value="first_order">First Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Discount Value {formData.type === 'percentage' ? '(%)' : '(₹)'}</Label>
                    <Input
                      id="value"
                      type="number"
                      min={0}
                      value={formData.value || ''}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min">Minimum Order Value (₹)</Label>
                    <Input
                      id="min"
                      type="number"
                      min={0}
                      value={formData.minimum_amount || ''}
                      onChange={(e) => setFormData({ ...formData, minimum_amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxd">Maximum Discount (₹)</Label>
                    <Input
                      id="maxd"
                      type="number"
                      min={0}
                      value={formData.maximum_discount || ''}
                      onChange={(e) => setFormData({ ...formData, maximum_discount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Separator className="mb-6" />
                <h2 className="mb-4 text-lg font-semibold">Usage Limits</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="usage_limit">Total Usage Limit</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      min={1}
                      value={formData.usage_limit || ''}
                      onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_limit">Per User Limit</Label>
                    <Input
                      id="user_limit"
                      type="number"
                      min={1}
                      value={formData.user_limit || ''}
                      onChange={(e) => setFormData({ ...formData, user_limit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Applicable To</Label>
                    <Select
                      value={formData.applicable_to}
                      onValueChange={(v) =>
                        setFormData({ ...formData, applicable_to: v as CouponFormData['applicable_to'] })
                      }
                      disabled={formData.offer_mode === 'quantity_combo'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="products">Products</SelectItem>
                        <SelectItem value="bookings">Bookings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Separator className="mb-6" />
                <h2 className="mb-4 text-lg font-semibold">Schedule</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="starts">Start Date</Label>
                    <Input
                      id="starts"
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires">End Date</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
                    <Label htmlFor="active-switch">Active</Label>
                    <Switch
                      id="active-switch"
                      checked={formData.is_active}
                      onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => {
                    setViewMode('list')
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg">
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const list = filteredCoupons()

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Coupons & promo codes"
          subtitle="One place for all discount codes — promotions, seasonal offers, first-order codes and more."
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-lg" asChild>
                <Link to="/marketing/cart-tiers">
                  <IndianRupee className="mr-2 h-4 w-4" />
                  Cart spend tiers
                </Link>
              </Button>
              <Button variant="outline" className="rounded-lg" asChild>
                <Link to="/marketing/service-combos">
                  <Layers className="mr-2 h-4 w-4" />
                  Service bundles
                </Link>
              </Button>
              <Button
                className="rounded-lg"
                onClick={() => {
                  resetForm()
                  setViewMode('form')
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            </div>
          }
        />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <TicketPercent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.length}</p>
                <p className="text-sm text-muted-foreground">Total Coupons</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-storm-mist/30 bg-gradient-to-br from-storm-deep/10 to-storm-deep/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-storm-deep/15 p-3 text-storm-deep">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-storm-deep">{coupons.filter((c) => c.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Coupons</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-primary/15 p-3 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{coupons.reduce((sum, c) => sum + c.usage_count, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Usage</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-bloom-coral/40 bg-gradient-to-br from-bloom-coral/10 to-bloom-coral/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-bloom-coral/15 p-3 text-bloom-coral">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-bloom-coral">{expiredCount}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl">
          <Tabs value={tabValue} onValueChange={setTabValue}>
            <div className="border-b px-4">
              <TabsList className="h-auto w-full justify-start gap-1 bg-transparent py-2">
                <TabsTrigger value="all">All ({coupons.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({coupons.filter((c) => c.is_active).length})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({expiredCount})</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : list.length === 0 ? (
              <div className="py-12 text-center">
                <TicketPercent className="mx-auto mb-3 h-14 w-14 text-muted-foreground" />
                <p className="mb-2 font-medium text-muted-foreground">No coupons found</p>
                <Button
                  className="mt-2 rounded-lg"
                  onClick={() => {
                    resetForm()
                    setViewMode('form')
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Coupon
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {list.map((coupon) => (
                      <Card
                        key={coupon.id}
                        className="border transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        <CardContent className="space-y-3 pt-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <TicketPercent className="h-5 w-5 shrink-0 text-primary" />
                                <h3 className="font-semibold">{coupon.name}</h3>
                                <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                                  {coupon.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{coupon.description}</p>
                            </div>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEdit(coupon)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => void handleDelete(coupon.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Coupon Code</p>
                                <p className="font-mono text-lg font-bold text-primary">{coupon.code}</p>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => copyCode(coupon.code)}>
                                    {copiedCode === coupon.code ? <Check className="h-4 w-4 text-storm-deep" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{copiedCode === coupon.code ? 'Copied!' : 'Copy code'}</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className="gap-1 font-semibold">
                              <IndianRupee className="h-3 w-3" />
                              {coupon.value}
                              {coupon.type === 'percentage' ? '%' : '₹'} OFF
                            </Badge>
                            {(coupon.min_items ?? 0) >= 2 && (
                              <Badge variant="secondary" className="gap-1">
                                <Layers className="h-3 w-3" />
                                Combo · min {coupon.min_items}
                              </Badge>
                            )}
                            {coupon.minimum_amount > 0 && (
                              <Badge variant="outline">Min: ₹{coupon.minimum_amount}</Badge>
                            )}
                            {!!coupon.maximum_discount && (
                              <Badge variant="outline">Max: ₹{coupon.maximum_discount}</Badge>
                            )}
                          </div>

                          <Separator />

                          <div>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="text-muted-foreground">Usage</span>
                              <span className="font-semibold">
                                {coupon.usage_count} / {coupon.usage_limit || '∞'}
                              </span>
                            </div>
                            {!!coupon.usage_limit && (
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${Math.min(100, getUsagePercentage(coupon))}%` }}
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              {new Date(coupon.starts_at).toLocaleDateString()} —{' '}
                              {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No expiry'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
