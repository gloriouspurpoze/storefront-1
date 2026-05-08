import React, { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Eye,
  Touchpad,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import axios from 'axios'
import { ImageUploadField, type ImageFile } from '../../components/forms'
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

interface Banner {
  _id: string
  title: string
  bannerType: string
  position: string
  images: { desktop: string; mobile?: string }
  schedule: { startDate: string; endDate: string }
  isActive: boolean
  analytics: { impressions: number; clicks: number; conversions: number }
  productId?: string
  productSlug?: string
  productName?: string
}

type BannerTarget = 'all' | 'product'

type ProductOption = {
  id: string
  name: string
  slug?: string
}

function bannerTypeClass(type: string): string {
  const colors: Record<string, string> = {
    hero: 'bg-primary/10 text-primary',
    popup: 'bg-destructive/10 text-destructive',
    announcement: 'bg-amber-500/10 text-amber-700',
    sidebar: 'bg-sky-500/10 text-sky-700',
    inline: 'bg-emerald-500/10 text-emerald-700',
  }
  return colors[type] || 'bg-muted text-muted-foreground'
}

export default function BannerManagement() {
  const confirm = useAppConfirm()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bannerType: 'hero',
    position: 'top',
    target: 'all' as BannerTarget,
    productId: '',
    productSlug: '',
    productName: '',
    desktopImages: [] as ImageFile[],
    mobileImages: [] as ImageFile[],
    ctaText: '',
    ctaLink: '',
    startDate: '',
    endDate: '',
    isActive: true,
  })

  const [productSearch, setProductSearch] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    if (!showForm || formData.target !== 'product') return

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

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_BASE}/cms/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBanners(res.data.data.banners || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const payload = {
        title: formData.title,
        description: formData.description,
        bannerType: formData.bannerType,
        position: formData.position,
        productId: formData.target === 'product' ? formData.productId || undefined : undefined,
        productSlug: formData.target === 'product' ? formData.productSlug || undefined : undefined,
        productName: formData.target === 'product' ? formData.productName || undefined : undefined,
        images: {
          desktop: formData.desktopImages[0]?.url || '',
          mobile: formData.mobileImages[0]?.url || formData.desktopImages[0]?.url || '',
        },
        cta: formData.ctaText
          ? {
              text: formData.ctaText,
              link: formData.ctaLink,
              openInNewTab: false,
            }
          : undefined,
        schedule: {
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          timezone: 'Asia/Kolkata',
        },
        priority: 1,
        isActive: formData.isActive,
        targetAudience: { userType: 'all' },
      }

      if (editingBanner) {
        await axios.put(`${API_BASE}/cms/admin/banners/${editingBanner._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(`${API_BASE}/cms/admin/banners`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      fetchBanners()
      handleCloseForm()
    } catch (error: any) {
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save banner'), 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete banner?',
      message: 'Delete this banner?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/cms/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchBanners()
    } catch (error) {
      appToast('Error deleting banner', 'error')
    }
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: '',
      bannerType: banner.bannerType,
      position: banner.position,
      target: banner.productId ? 'product' : 'all',
      productId: banner.productId || '',
      productSlug: banner.productSlug || '',
      productName: banner.productName || '',
      desktopImages: banner.images.desktop
        ? [
            {
              id: '1',
              url: banner.images.desktop,
              alt: banner.title,
              isPrimary: true,
              order: 0,
            },
          ]
        : [],
      mobileImages: banner.images.mobile
        ? [
            {
              id: '2',
              url: banner.images.mobile,
              alt: banner.title,
              isPrimary: true,
              order: 0,
            },
          ]
        : [],
      ctaText: '',
      ctaLink: '',
      startDate: banner.schedule.startDate.split('T')[0],
      endDate: banner.schedule.endDate.split('T')[0],
      isActive: banner.isActive,
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setFormData({
      title: '',
      description: '',
      bannerType: 'hero',
      position: 'top',
      target: 'all',
      productId: '',
      productSlug: '',
      productName: '',
      desktopImages: [],
      mobileImages: [],
      ctaText: '',
      ctaLink: '',
      startDate: '',
      endDate: '',
      isActive: true,
    })
    setProductSearch('')
    setProductOptions([])
    setEditingBanner(null)
    setShowForm(false)
  }

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Banner Management"
          subtitle="Create and schedule promotional banners for your website"
          action={
            <Button
              className="rounded-md"
              onClick={() => setShowForm(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Banner
            </Button>
          }
        />

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ImageIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-muted-foreground">No banners found</h3>
              <p className="mb-6 text-sm text-muted-foreground">Create your first banner to get started</p>
              <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
                Create Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {banners.map((banner) => (
              <Card
                key={banner._id}
                className="border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
                    <div className="md:col-span-3">
                      {banner.images.desktop ? (
                        <img
                          src={banner.images.desktop}
                          alt={banner.title}
                          className="h-[150px] w-full rounded-lg border border-border/80 object-cover"
                        />
                      ) : (
                        <div className="flex h-[150px] w-full items-center justify-center rounded-lg bg-muted">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-7">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{banner.title}</h3>
                          <Badge variant={banner.isActive ? 'success' : 'secondary'} className="gap-1">
                            {banner.isActive ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('border-0 capitalize font-semibold', bannerTypeClass(banner.bannerType))}
                          >
                            {banner.bannerType}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 shrink-0" />
                            {new Date(banner.schedule.startDate).toLocaleDateString()} -{' '}
                            {new Date(banner.schedule.endDate).toLocaleDateString()}
                          </span>
                          <span>
                            <strong className="text-foreground">Position:</strong> {banner.position}
                          </span>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap gap-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <Eye className="h-4 w-4" />
                                {banner.analytics.impressions || 0} views
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Impressions</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <Touchpad className="h-4 w-4" />
                                {banner.analytics.clicks || 0} clicks
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Clicks</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                {banner.analytics.conversions || 0} conversions
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Conversions</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row gap-1 md:col-span-2 md:flex-col md:items-end md:justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={() => handleEdit(banner)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                            onClick={() => handleDelete(banner._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={(open) => !open && handleCloseForm()}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-title">Title</Label>
                  <Input
                    id="banner-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-desc">Description</Label>
                  <Textarea
                    id="banner-desc"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Banner Type</Label>
                  <Select
                    value={formData.bannerType}
                    onValueChange={(v) => setFormData({ ...formData, bannerType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero Banner</SelectItem>
                      <SelectItem value="popup">Pop-up</SelectItem>
                      <SelectItem value="announcement">Announcement Bar</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="middle">Middle</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="floating">Floating</SelectItem>
                      <SelectItem value="header">Header</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <h4 className="text-sm font-semibold">Targeting</h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select
                    value={formData.target}
                    onValueChange={(v: BannerTarget) => {
                      setFormData((prev) => ({
                        ...prev,
                        target: v,
                        productId: v === 'product' ? prev.productId : '',
                        productSlug: v === 'product' ? prev.productSlug : '',
                        productName: v === 'product' ? prev.productName : '',
                      }))
                      if (v !== 'product') {
                        setProductSearch('')
                        setProductOptions([])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users (global)</SelectItem>
                      <SelectItem value="product">Specific product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target === 'product' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="banner-product-search">Search products</Label>
                      <div className="relative">
                        <Input
                          id="banner-product-search"
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
                        onValueChange={(v) => {
                          const id = v === '__none__' ? '' : v
                          const picked = productOptions.find((p) => p.id === id)
                          setFormData((prev) => ({
                            ...prev,
                            productId: id,
                            productName: picked?.name || prev.productName,
                            productSlug: picked?.slug || prev.productSlug,
                          }))
                        }}
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
              </div>

              <Separator />
              <h4 className="text-sm font-semibold">Banner Images</h4>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <ImageUploadField
                  label="Desktop Banner Image"
                  value={formData.desktopImages}
                  onChange={(images) => setFormData({ ...formData, desktopImages: images })}
                  maxFiles={1}
                  maxSize={5}
                  helperText="Upload desktop banner image (Recommended: 1920x600px, Max 5MB)"
                  required
                  showPreview
                  allowPrimary={false}
                />
                <ImageUploadField
                  label="Mobile Banner Image (Optional)"
                  value={formData.mobileImages}
                  onChange={(images) => setFormData({ ...formData, mobileImages: images })}
                  maxFiles={1}
                  maxSize={5}
                  helperText="Upload mobile banner image (Recommended: 768x400px, Max 5MB)"
                  showPreview
                  allowPrimary={false}
                />
              </div>

              <Separator />
              <h4 className="text-sm font-semibold">Call to Action</h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cta-text">CTA Button Text</Label>
                  <Input
                    id="cta-text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta-link">CTA Link</Label>
                  <Input
                    id="cta-link"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="/offers"
                  />
                </div>
              </div>

              <Separator />
              <h4 className="text-sm font-semibold">Schedule</h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-start">Start Date</Label>
                  <Input
                    id="banner-start"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-end">End Date</Label>
                  <Input
                    id="banner-end"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Active</Label>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingBanner ? 'Update' : 'Create'} Banner</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
