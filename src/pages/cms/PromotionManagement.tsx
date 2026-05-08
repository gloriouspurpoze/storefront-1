import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Tag,
  Copy,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Loader2,
} from 'lucide-react'
import axios from 'axios'
import { PageHeader } from '../../components/common/PageHeader'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '../../components/ui'
import { cn } from '../../lib/utils'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

type PromotionTarget = 'all' | 'products'

type ProductOption = {
  id: string
  name: string
  slug?: string
}

interface Promotion {
  _id: string
  code: string
  title: string
  description: string
  promotionType: string
  discountValue: number
  schedule: { startDate: string; endDate: string }
  isActive: boolean
  isFeatured: boolean
  usage: { currentUsage: number; totalLimit?: number }
  conditions: { minOrderValue?: number; maxDiscount?: number }
}

export default function PromotionManagement() {
  const confirm = useAppConfirm()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    promotionType: 'percentage',
    discountValue: 0,
    target: 'all' as PromotionTarget,
    productId: '',
    minOrderValue: 0,
    maxDiscount: 0,
    totalLimit: 1000,
    perUserLimit: 1,
    startDate: '',
    endDate: '',
    isActive: true,
    isFeatured: false,
  })

  const [productSearch, setProductSearch] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])

  useEffect(() => {
    fetchPromotions()
  }, [])

  useEffect(() => {
    if (!showForm || formData.target !== 'products') return

    const q = productSearch.trim()
    const controller = new AbortController()

    const run = async () => {
      try {
        setProductLoading(true)
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API_BASE}/products`, {
          params: { page: 1, limit: 10, search: q || undefined },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
        })

        const items = (res.data?.data?.products || res.data?.products || []) as any[]
        setProductOptions(
          items.map((p) => ({
            id: String(p.id || p._id),
            name: String(p.name || 'Unnamed product'),
            slug: p.slug ? String(p.slug) : undefined,
          })),
        )
      } catch (e: any) {
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return
        setProductOptions([])
      } finally {
        setProductLoading(false)
      }
    }

    const t = window.setTimeout(() => void run(), 350)
    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [productSearch, showForm, formData.target])

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_BASE}/cms/admin/promotions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPromotions(res.data.data.promotions || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const payload = {
        code: formData.code.toUpperCase(),
        title: formData.title,
        description: formData.description,
        promotionType: formData.promotionType,
        discountValue: formData.discountValue,
        applicableTo:
          formData.target === 'products'
            ? { type: 'products', productIds: formData.productId ? [formData.productId] : [] }
            : { type: 'all' },
        conditions: {
          minOrderValue: formData.minOrderValue || undefined,
          maxDiscount: formData.maxDiscount || undefined,
          userType: 'all',
        },
        usage: {
          totalLimit: formData.totalLimit,
          perUserLimit: formData.perUserLimit,
        },
        schedule: {
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        },
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        priority: formData.isFeatured ? 1 : 0,
      }

      await axios.post(`${API_BASE}/cms/admin/promotions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      fetchPromotions()
      handleCloseForm()
    } catch (error: any) {
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save'), 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete promotion?',
      message: 'Delete this promotion?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/cms/admin/promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchPromotions()
    } catch (error) {
      appToast('Error deleting promotion', 'error')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const handleCloseForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      promotionType: 'percentage',
      discountValue: 0,
      target: 'all',
      productId: '',
      minOrderValue: 0,
      maxDiscount: 0,
      totalLimit: 1000,
      perUserLimit: 1,
      startDate: '',
      endDate: '',
      isActive: true,
      isFeatured: false,
    })
    setProductSearch('')
    setProductOptions([])
    setShowForm(false)
  }

  const getUsagePercentage = (promo: Promotion) => {
    const usage = promo.usage ?? (promo as any).usage_stats
    if (!usage?.totalLimit) return 0
    const current = usage.currentUsage ?? (usage as any).current_usage ?? 0
    return (current / (usage.totalLimit ?? 1)) * 100
  }

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Promotion Management"
          subtitle="Create and manage discount codes & promotional offers"
          action={
            <Button
              className="rounded-md"
              onClick={() => setShowForm(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Promotion
            </Button>
          }
        />

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : promotions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Tag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-muted-foreground">No promotions found</h3>
              <p className="mb-6 text-sm text-muted-foreground">Create your first promotion to get started</p>
              <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
                Create Promotion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {promotions.filter(Boolean).map((promo) => (
              <Card
                key={promo._id}
                className="h-full border-border/80 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Tag className="h-5 w-5 shrink-0 text-emerald-600" />
                        <h3 className="truncate text-lg font-semibold">{promo.title}</h3>
                        <Badge variant={promo.isActive ? 'success' : 'secondary'} className="gap-1">
                          {promo.isActive && <CheckCircle2 className="h-3 w-3" />}
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {promo.isFeatured && <Badge variant="warning">Featured</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{promo.description}</p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      onClick={() => handleDelete(promo._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div
                    className={cn(
                      'rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="mb-1 block text-xs text-muted-foreground">Promo Code</span>
                        <p className="font-mono text-lg font-bold text-primary">{promo.code}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="bg-primary/10 hover:bg-primary/20"
                            onClick={() => copyCode(promo.code)}
                          >
                            {copiedCode === promo.code ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{copiedCode === promo.code ? 'Copied!' : 'Copy code'}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success" className="gap-1 font-semibold">
                      <IndianRupee className="h-3 w-3" />
                      {promo.discountValue}
                      {promo.promotionType === 'percentage' ? '%' : '₹'} OFF
                    </Badge>
                    {promo.conditions.minOrderValue ? (
                      <Badge variant="outline">Min: ₹{promo.conditions.minOrderValue}</Badge>
                    ) : null}
                    {promo.conditions.maxDiscount ? (
                      <Badge variant="outline">Max: ₹{promo.conditions.maxDiscount}</Badge>
                    ) : null}
                  </div>

                  <Separator />

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-semibold">
                        {promo.usage?.currentUsage ?? (promo as any).usage_stats?.current_usage ?? 0} /{' '}
                        {promo.usage?.totalLimit ?? (promo as any).usage_stats?.total_limit ?? '∞'}
                      </span>
                    </div>
                    {(promo.usage?.totalLimit ?? (promo as any).usage_stats?.total_limit) ? (
                      <div className="h-2 w-full overflow-hidden rounded-md bg-muted">
                        <div
                          className="h-full rounded-md bg-primary transition-all"
                          style={{ width: `${Math.min(100, getUsagePercentage(promo))}%` }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      {promo.schedule?.startDate && promo.schedule?.endDate
                        ? `${new Date(promo.schedule.startDate).toLocaleDateString()} - ${new Date(
                            promo.schedule.endDate,
                          ).toLocaleDateString()}`
                        : 'No schedule'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={(open) => !open && handleCloseForm()}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Create New Promotion</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promo-code">Promo Code</Label>
                  <Input
                    id="promo-code"
                    className="font-mono font-semibold"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-title">Title</Label>
                  <Input
                    id="promo-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Welcome Offer"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-desc">Description</Label>
                <Textarea
                  id="promo-desc"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get 30% off on your first booking"
                  required
                />
              </div>

              <div>
                <Separator className="my-4" />
                <h4 className="mb-4 text-sm font-semibold">Discount Details</h4>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Applies To</Label>
                  <Select
                    value={formData.target}
                    onValueChange={(v: PromotionTarget) => {
                      setFormData((prev) => ({
                        ...prev,
                        target: v,
                        productId: v === 'products' ? prev.productId : '',
                      }))
                      if (v !== 'products') {
                        setProductSearch('')
                        setProductOptions([])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All orders (global)</SelectItem>
                      <SelectItem value="products">Specific product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target === 'products' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="product-search">Search products</Label>
                      <div className="relative">
                        <Input
                          id="product-search"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Type product name…"
                        />
                        {productLoading ? (
                          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Product</Label>
                      <Select
                        value={formData.productId || '__none__'}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, productId: v === '__none__' ? '' : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select a product</SelectItem>
                          {productOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}

                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.promotionType}
                    onValueChange={(v) => setFormData({ ...formData, promotionType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-val">
                    Discount Value {formData.promotionType === 'percentage' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    id="discount-val"
                    type="number"
                    min={0}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-order">Min Order Value (₹)</Label>
                  <Input
                    id="min-order"
                    type="number"
                    min={0}
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-disc">Max Discount (₹)</Label>
                  <Input
                    id="max-disc"
                    type="number"
                    min={0}
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Separator className="my-4" />
                <h4 className="mb-4 text-sm font-semibold">Usage Limits</h4>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total-limit">Total Usage Limit</Label>
                  <Input
                    id="total-limit"
                    type="number"
                    min={1}
                    value={formData.totalLimit}
                    onChange={(e) => setFormData({ ...formData, totalLimit: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="per-user">Per User Limit</Label>
                  <Input
                    id="per-user"
                    type="number"
                    min={1}
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Separator className="my-4" />
                <h4 className="mb-4 text-sm font-semibold">Schedule</h4>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 sm:col-span-1">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-3 sm:col-span-1">
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancel
                </Button>
                <Button type="submit">Create Promotion</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
