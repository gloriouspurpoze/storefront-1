import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { CouponsService } from '../../services/api/coupons.service'
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
  created_at: string
  updated_at: string
}

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
}

export default function Coupons() {
  const confirm = useAppConfirm()
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState('all')
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [copiedCode, setCopiedCode] = useState('')

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
  }))

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
        applicable_to: formData.applicable_to,
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
          title="Coupon Management"
          subtitle="Create and manage discount coupons"
          action={
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
          <Card className="rounded-xl border-emerald-200 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-emerald-500/15 p-3 text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{coupons.filter((c) => c.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Coupons</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-sky-200 bg-gradient-to-br from-sky-500/10 to-sky-500/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-sky-500/15 p-3 text-sky-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-700">{coupons.reduce((sum, c) => sum + c.usage_count, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Usage</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-amber-200 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-amber-500/15 p-3 text-amber-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-800">{expiredCount}</p>
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
                                    {copiedCode === coupon.code ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
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
