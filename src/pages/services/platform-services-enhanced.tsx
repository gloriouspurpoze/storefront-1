import React, { useState, useEffect, useMemo } from 'react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { MobileServiceCardPreview } from '../../components/services/MobileServiceCardPreview'
import { ServiceImageGuidancePanel } from '../../components/services/ServiceImageGuidancePanel'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Layers,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Star,
  X,
  Filter,
  CheckCircle2,
  CircleOff,
  FolderTree,
} from 'lucide-react'
import { platformServicesService, PlatformService, type GetPlatformServicesParams } from '../../services/api/platformServices.service'
import { CategoriesService } from '../../services/api/categories.service'
import { SubcategoriesService } from '../../services/api/subcategories.service'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { appToast } from '../../lib/appToast'
import { formatCurrency, cn } from '../../lib/utils'
import { normalizeRefToMongoIdString } from '../../lib/mongoObjectId'
import {
  buildSubcategoryLookup,
  formatSubcategoryLabel,
  getCategoryDisplayName,
  groupServicesIntoCatalog,
} from './platform-services-catalog-utils'
import { PlatformServicesCatalogView } from './PlatformServicesCatalogView'
import type { Subcategory } from '../../services/api/subcategories.service'

const CATEGORIES_FALLBACK = ['home_repair', 'home_improvement', 'cleaning', 'outdoor', 'maintenance', 'installation']

const CATALOG_PAGE_LIMIT = 500

function displayPlatformSubcategory(service: PlatformService): string {
  const t = service.subcategory?.trim()
  if (!t) return '—'
  if (/^[a-f\d]{24}$/i.test(t)) return t
  return formatSubcategoryLabel(t.toLowerCase())
}

function hasDisplayableBasePrice(v: number | string | undefined | null): boolean {
  if (v == null) return false
  if (typeof v === 'string' && v.trim() === '') return false
  const n = Number(v)
  return !Number.isNaN(n)
}

function displayBasePrice(v: number | string | undefined | null): string {
  if (!hasDisplayableBasePrice(v)) return 'N/A'
  return formatCurrency(Number(v))
}

type PreviewTab = 'overview' | 'pricing' | 'features' | 'availability' | 'products'

function ServicePreviewDialog({
  open,
  onClose,
  service,
  categoryNameById,
  onEdit,
}: {
  open: boolean
  onClose: () => void
  service: PlatformService | null
  categoryNameById: Record<string, string>
  onEdit: (s: PlatformService) => void
}) {
  const [tab, setTab] = useState<PreviewTab>('overview')
  useEffect(() => {
    if (open) setTab('overview')
  }, [open, service?.id])

  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-0 bg-gradient-to-r from-sky-600 to-indigo-700 px-6 py-4 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold text-white">{service.name}</DialogTitle>
              <p className="text-sm text-white/90">Service Preview</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="border-b bg-muted/30 px-6 py-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
            <MobileServiceCardPreview
              imageUrl={service.image}
              name={service.name}
              description={service.short_description}
              price={service.base_price}
              popular={service.is_popular}
              framed
            />
            <ServiceImageGuidancePanel compact className="max-w-sm flex-1" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as PreviewTab)} className="px-0">
          <div className="border-b px-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent py-2">
              {(
                [
                  ['overview', 'Overview'],
                  ['pricing', 'Pricing & Details'],
                  ['features', 'Features'],
                  ['availability', 'Availability'],
                  ['products', 'Products'],
                ] as const
              ).map(([id, label]) => (
                <TabsTrigger key={id} value={id} className="text-xs sm:text-sm">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="max-h-[min(50vh,480px)] overflow-y-auto px-6 py-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-primary">Description</p>
                <div className="rounded-lg bg-muted/50 p-3 text-sm">{service.description}</div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="border">
                  <CardContent className="pt-4">
                    <p className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Pricing</p>
                    <p className="text-2xl font-bold text-emerald-600">{displayBasePrice(service.base_price)}</p>
                    <p className="text-xs text-muted-foreground">
                      GST: {service.gst_percentage}% {service.tax_included ? '(included)' : '(extra)'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="pt-4">
                    <p className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-400">Statistics</p>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-2xl font-bold">{service.total_requests || 0}</p>
                        <p className="text-xs text-muted-foreground">Requests</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-amber-500" />
                        <p className="text-2xl font-bold">
                          {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="border">
                <CardContent className="pt-4">
                  <p className="mb-2 text-sm font-semibold">Status & Settings</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {service.status}
                    </Badge>
                    {service.is_featured && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                        <Star className="mr-1 h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                    {service.is_popular && <Badge variant="secondary">Popular</Badge>}
                    {service.emergency_service && <Badge variant="destructive">Emergency Service</Badge>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="border">
                  <CardContent className="space-y-2 pt-4 text-sm">
                    <p className="font-semibold text-primary">Service Information</p>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{getCategoryDisplayName(categoryNameById, service.category)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service Type</p>
                      <p className="font-medium">{service.service_type}</p>
                    </div>
                    {service.duration && (
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{service.duration}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="space-y-2 pt-4 text-sm">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Pricing Details</p>
                    {hasDisplayableBasePrice(service.base_price) && (
                      <div>
                        <p className="text-xs text-muted-foreground">Base Price</p>
                        <p className="font-medium">{displayBasePrice(service.base_price)}</p>
                      </div>
                    )}
                    {!!service.hourly_rate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Hourly Rate</p>
                        <p className="font-medium">₹{Number(service.hourly_rate).toFixed(2)}/hour</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">GST</p>
                      <p className="font-medium">
                        {service.gst_percentage}% {service.tax_included ? '(included)' : '(extra)'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-0 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-primary">Features</p>
                {service.features?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((f, i) => (
                      <Badge key={i} variant="outline">
                        {f}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No features added</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-semibold">Requirements</p>
                {service.requirements?.length ? (
                  <ul className="space-y-2">
                    {service.requirements.map((req, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No requirements specified</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-semibold text-sky-700 dark:text-sky-400">Tags</p>
                {service.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((t, i) => (
                      <Badge key={i} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags added</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="availability" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="border">
                  <CardContent className="pt-4">
                    <p className="mb-2 text-sm font-semibold">Working Days</p>
                    {service.working_days?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {service.working_days.map((d, i) => (
                          <Badge key={i}>{d}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="pt-4">
                    <p className="mb-2 text-sm font-semibold">Time Slots</p>
                    {service.time_slots?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {service.time_slots.map((s, i) => (
                          <Badge key={i} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              <Card className="border">
                <CardContent className="space-y-3 pt-4 text-sm">
                  <p className="font-semibold">Booking Settings</p>
                  <div className="flex justify-between gap-2">
                    <span>Advance Booking</span>
                    <Badge variant="outline">{service.advance_booking_hours ?? 24} hours</Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Same-day Booking</span>
                    <Badge variant={service.same_day_booking ? 'default' : 'secondary'}>
                      {service.same_day_booking ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Emergency Service</span>
                    <Badge variant={service.emergency_service ? 'destructive' : 'secondary'}>
                      {service.emergency_service ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  {!!service.emergency_charge && (
                    <div className="flex justify-between gap-2">
                      <span>Emergency Charge</span>
                      <span className="font-medium">₹{Number(service.emergency_charge).toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-0 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold">Product Options</p>
                {service.product_options?.length ? (
                  <div className="space-y-3">
                    {service.product_options.map((product: Record<string, unknown>, idx: number) => (
                      <Card key={idx} className="border">
                        <CardContent className="space-y-2 pt-4 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold">{String(product.name ?? '')}</span>
                            {product.price != null && product.price !== '' && (
                              <Badge className="shrink-0">{formatCurrency(Number(product.price))}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {product.brand != null && String(product.brand).length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground">Brand</p>
                                <p>{String(product.brand)}</p>
                              </div>
                            )}
                            {product.warranty != null && String(product.warranty).length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground">Warranty</p>
                                <p>{String(product.warranty)}</p>
                              </div>
                            )}
                          </div>
                          {product.description != null && String(product.description).length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Description</p>
                              <p>{String(product.description)}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No product options added</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-semibold">Service Areas</p>
                {service.service_areas?.length ? (
                  <div className="space-y-2">
                    {(service.service_areas as { name?: string; multiplier?: number; active?: boolean }[]).map(
                      (area, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="font-medium">{area.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{area.multiplier}x</Badge>
                            <Badge variant={area.active ? 'default' : 'secondary'}>
                              {area.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No service areas defined</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t bg-muted/30 px-6 py-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onClose()
              onEdit(service)
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PlatformServicesEnhanced() {
  const navigate = useNavigate()
  const [services, setServices] = useState<PlatformService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [subcategoryFilterOptions, setSubcategoryFilterOptions] = useState<{ id: string; name: string }[]>([])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  /** Catalog = category → subcategory accordions (default). Table / grid = classic paginated lists. */
  const [layoutMode, setLayoutMode] = useState<'catalog' | 'list' | 'grid'>('catalog')
  const [showFilters, setShowFilters] = useState(false)
  const [categoryNameById, setCategoryNameById] = useState<Record<string, string>>({})
  const [categorySlugById, setCategorySlugById] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<PlatformService | null>(null)
  const [stats, setStats] = useState({ total: 0, active: 0, featured: 0, total_requests: 0 })
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([])

  const loadAllSubcategories = async () => {
    try {
      const res = await SubcategoriesService.getSubcategories({ is_active: true })
      const raw = res?.data as { subcategories?: Subcategory[] } | Subcategory[] | undefined
      const list =
        raw && typeof raw === 'object' && 'subcategories' in raw && Array.isArray(raw.subcategories)
          ? raw.subcategories
          : Array.isArray(raw)
            ? raw
            : []
      setAllSubcategories(list)
    } catch {
      setAllSubcategories([])
    }
  }

  useEffect(() => {
    void loadAllSubcategories()
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadLookups = async () => {
      try {
        const cats = await CategoriesService.getCategoriesForServiceUIs({
          page: 1,
          limit: 500,
          is_active: true,
        }).catch(() => [] as { id: string; name: string }[])
        if (!isMounted) return
        const byId: Record<string, string> = {}
        const slugById: Record<string, string> = {}
        ;(Array.isArray(cats) ? cats : []).forEach(
          (c: { id?: string; _id?: string; name?: string; title?: string; slug?: string }) => {
            const id = (c?.id ?? c?._id ?? '').toString().toLowerCase()
            const name = (c?.name ?? c?.title ?? '').toString().trim()
            const slug = (c?.slug ?? '').toString().trim().toLowerCase()
            if (id) {
              byId[id] = name || id
              if (slug) slugById[id] = slug
            }
          },
        )
        setCategoryNameById(byId)
        setCategorySlugById(slugById)
      } catch {
        // ignore
      }
    }
    void loadLookups()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setPage(0)
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedStatus])

  useEffect(() => {
    let cancelled = false
    if (selectedCategory === 'all') {
      setSubcategoryFilterOptions([])
      setSelectedSubcategory('all')
      return
    }
    setSelectedSubcategory('all')
    void (async () => {
      try {
        const res = await SubcategoriesService.getSubcategories({
          categoryId: selectedCategory,
          is_active: true,
        })
        const raw = res?.data as { subcategories?: unknown[] } | undefined
        const list = raw?.subcategories ?? []
        if (cancelled) return
        const normalized = (Array.isArray(list) ? list : [])
          .map((sub: any) => ({
            id: String(sub.id ?? sub._id ?? '').toLowerCase(),
            name: String(sub.name ?? sub.displayName ?? sub.title ?? '').trim() || 'Subcategory',
          }))
          .filter((s: { id: string }) => s.id)
        normalized.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        setSubcategoryFilterOptions(normalized)
      } catch {
        if (!cancelled) setSubcategoryFilterOptions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedCategory])

  const categoryFilterIds = useMemo(() => {
    const keys = Object.keys(categoryNameById)
    if (keys.length > 0) {
      return [...keys].sort((a, b) =>
        (categoryNameById[a] ?? a).localeCompare(categoryNameById[b] ?? b, undefined, { sensitivity: 'base' }),
      )
    }
    return CATEGORIES_FALLBACK
  }, [categoryNameById])

  const subcategoryLookup = useMemo(
    () => buildSubcategoryLookup(allSubcategories, categoryNameById, categorySlugById),
    [allSubcategories, categoryNameById, categorySlugById],
  )

  const catalogGroups = useMemo(
    () => groupServicesIntoCatalog(services, categoryNameById, subcategoryLookup),
    [services, categoryNameById, subcategoryLookup],
  )

  const handleServicesReordered = (updates: { id: string; sort_order: number }[]) => {
    if (!updates.length) return
    const byId = new Map(updates.map((u) => [u.id, u.sort_order]))
    setServices((prev) =>
      prev.map((s) => (byId.has(s.id) ? { ...s, sort_order: byId.get(s.id)! } : s)),
    )
  }

  const handleSubcategoriesReordered = (updates: { id: string; sort_order: number }[]) => {
    if (!updates.length) return
    const byId = new Map(updates.map((u) => [u.id.toLowerCase(), u.sort_order]))
    setAllSubcategories((prev) =>
      prev.map((sub) => {
        const key = String(sub.id ?? sub._id ?? '').toLowerCase()
        return key && byId.has(key) ? { ...sub, sortOrder: byId.get(key)! } : sub
      }),
    )
    void loadAllSubcategories()
  }

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      if (isMounted) await Promise.all([fetchServices(), fetchStats()])
    }
    void loadData()
    return () => {
      isMounted = false
    }
  }, [page, rowsPerPage, selectedCategory, selectedSubcategory, selectedStatus, searchTerm, layoutMode])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const isCatalog = layoutMode === 'catalog'
      const params: Record<string, unknown> = {
        page: isCatalog ? 1 : page + 1,
        limit: isCatalog ? CATALOG_PAGE_LIMIT : rowsPerPage,
        sort_by: 'sort_order',
        sort_order: 'asc',
      }
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (selectedSubcategory !== 'all') params.subcategory = selectedSubcategory
      if (selectedStatus !== 'all') params.is_active = selectedStatus === 'active'
      if (searchTerm) params.search = searchTerm

      const response = await platformServicesService.getServices(params as GetPlatformServicesParams)
      if (response?.services) {
        setServices(response.services)
        setTotalCount(response.pagination?.total || 0)
      } else {
        setServices([])
        setTotalCount(0)
      }
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to fetch services', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsData = await platformServicesService.getServiceStats()
      if (statsData) {
        setStats({
          total: statsData.total_services || 0,
          active: statsData.active_services || 0,
          featured: statsData.featured_services || 0,
          total_requests: statsData.total_requests || 0,
        })
      }
    } catch {
      setStats({ total: 0, active: 0, featured: 0, total_requests: 0 })
    }
  }

  const handleCreate = () => navigate('/platform-services/create')

  const handleEdit = (service: PlatformService) => {
    navigate(`/platform-services/edit/${service.id}`)
  }

  const handlePreview = (service: PlatformService) => {
    setSelectedService(service)
    setPreviewDialogOpen(true)
  }

  const handleDelete = (service: PlatformService) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedService) return
    try {
      await platformServicesService.deleteService(selectedService.id)
      appToast('Service deleted successfully', 'success')
      fetchServices()
      fetchStats()
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to delete service', 'error')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedService(null)
    }
  }

  const handleToggleActive = async (service: PlatformService) => {
    try {
      await platformServicesService.updateService(service.id, { is_active: !service.is_active })
      appToast(`Service ${!service.is_active ? 'activated' : 'deactivated'} successfully`, 'success')
      fetchServices()
      fetchStats()
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to update service', 'error')
    }
  }

  const handleToggleFeatured = async (service: PlatformService) => {
    try {
      await platformServicesService.updateService(service.id, { is_featured: !service.is_featured })
      appToast(`Service ${!service.is_featured ? 'featured' : 'unfeatured'} successfully`, 'success')
      fetchServices()
      fetchStats()
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to update service', 'error')
    }
  }

  const handleDuplicate = async (service: PlatformService) => {
    try {
      const ext = service as PlatformService & {
        created_at?: string
        updated_at?: string
        category_id?: string
        subcategory_id?: string
        categoryId?: string
        subcategoryId?: string
      }
      const categoryId =
        normalizeRefToMongoIdString(ext.category_id) ??
        normalizeRefToMongoIdString(ext.categoryId) ??
        normalizeRefToMongoIdString(ext.category)
      const subcategoryId =
        normalizeRefToMongoIdString(ext.subcategory_id) ??
        normalizeRefToMongoIdString(ext.subcategoryId) ??
        normalizeRefToMongoIdString(ext.subcategory)

      if (!categoryId) {
        appToast(
          'Cannot duplicate: category ID is missing (API returned a slug only). Open the service in the editor, confirm category, and save once.',
          'error',
        )
        return
      }

      const {
        id: _id,
        slug: _slug,
        created_at: _c,
        updated_at: _u,
        category: _cat,
        subcategory: _sub,
        category_id: _cid,
        subcategory_id: _sid,
        categoryId: _cId,
        subcategoryId: _sId,
        ...serviceData
      } = ext

      await platformServicesService.createService({
        ...(serviceData as object),
        category: categoryId,
        ...(subcategoryId ? { subcategory: subcategoryId } : {}),
        name: `${service.name} (Copy)`,
        slug: `${service.slug}-copy`,
        is_active: false,
        status: 'draft',
      } as Parameters<typeof platformServicesService.createService>[0])
      appToast('Service duplicated successfully', 'success')
      fetchServices()
      fetchStats()
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to duplicate service', 'error')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedSubcategory('all')
    setSelectedStatus('all')
    setPage(0)
  }

  const truncatedCatalog =
    layoutMode === 'catalog' && totalCount > services.length && totalCount > 0

  const rangeStart = totalCount === 0 ? 0 : page * rowsPerPage + 1
  const rangeEnd = Math.min((page + 1) * rowsPerPage, totalCount)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Platform Services</h1>
              <p className="text-sm text-muted-foreground">
                Browse by category and subcategory, or switch to a classic table or grid.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border bg-muted/30 p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant={layoutMode === 'catalog' ? 'secondary' : 'ghost'}
                      className="h-8 gap-1.5 px-2.5 sm:px-3"
                      onClick={() => setLayoutMode('catalog')}
                      aria-pressed={layoutMode === 'catalog'}
                    >
                      <Layers className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Catalog</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Category → subcategory accordions</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant={layoutMode === 'list' ? 'secondary' : 'ghost'}
                      className="h-8 gap-1.5 px-2.5 sm:px-3"
                      onClick={() => setLayoutMode('list')}
                      aria-pressed={layoutMode === 'list'}
                    >
                      <List className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Table</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Paginated table</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant={layoutMode === 'grid' ? 'secondary' : 'ghost'}
                      className="h-8 gap-1.5 px-2.5 sm:px-3"
                      onClick={() => setLayoutMode('grid')}
                      aria-pressed={layoutMode === 'grid'}
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Grid</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Card grid</TooltipContent>
                </Tooltip>
              </div>
              <Button className="h-9 min-w-[140px]" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-br from-indigo-500 to-purple-700 text-white">
              <CardContent className="p-4">
                <p className="text-xs opacity-90">📊 Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-br from-emerald-500 to-teal-400 text-white">
              <CardContent className="p-4">
                <p className="text-xs opacity-90">✅ Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white">
              <CardContent className="p-4">
                <p className="text-xs opacity-90">⭐ Featured</p>
                <p className="text-2xl font-bold">{stats.featured}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-br from-sky-400 to-cyan-400 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-1 text-xs opacity-90">
                  <FolderTree className="h-3.5 w-3.5" />
                  Job requests
                </div>
                <p className="text-2xl font-bold tabular-nums">{stats.total_requests}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mb-6 rounded-xl">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Filters</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
            {showFilters && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                <div className="md:col-span-3">
                  <Label className="sr-only" htmlFor="ps-search">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ps-search"
                      className="h-9 pl-9"
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-1 md:col-span-3">
                  <Label className="text-xs">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryFilterIds.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryDisplayName(categoryNameById, cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1 md:col-span-3">
                  <Label className="text-xs">Subcategory</Label>
                  <Select
                    value={selectedSubcategory}
                    onValueChange={setSelectedSubcategory}
                    disabled={selectedCategory === 'all'}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={
                          selectedCategory === 'all' ? 'Pick a category first' : 'All subcategories'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subcategories</SelectItem>
                      {subcategoryFilterOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1 md:col-span-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <Button type="button" variant="outline" className="w-full" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {layoutMode === 'catalog' && (
          <PlatformServicesCatalogView
            loading={loading}
            catalogGroups={catalogGroups}
            truncatedCatalog={truncatedCatalog}
            servicesShown={services.length}
            totalCount={totalCount}
            catalogPageLimit={CATALOG_PAGE_LIMIT}
            onOpenTableView={() => setLayoutMode('list')}
            onCreate={handleCreate}
            onServicesReordered={handleServicesReordered}
            onSubcategoriesReordered={handleSubcategoriesReordered}
            subcategoryLookup={subcategoryLookup}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onToggleActive={handleToggleActive}
            onToggleFeatured={handleToggleFeatured}
            onDelete={handleDelete}
          />
        )}


        {layoutMode === 'list' ? (
          <Card className="rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Loading services...
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <p className="font-medium text-muted-foreground">No services found</p>
                        <Button size="sm" onClick={handleCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Service
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {service.image ? <AvatarImage src={service.image} alt="" /> : null}
                            <AvatarFallback className="bg-primary/10 text-primary">{service.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {getCategoryDisplayName(categoryNameById, service.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                        {displayPlatformSubcategory(service)}
                      </TableCell>
                      <TableCell className="font-medium">{displayBasePrice(service.base_price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={service.is_active ? 'default' : 'secondary'}
                            className="cursor-pointer transition-opacity hover:opacity-90"
                            role="button"
                            tabIndex={0}
                            onClick={() => void handleToggleActive(service)}
                            onKeyDown={(e) => e.key === 'Enter' && void handleToggleActive(service)}
                          >
                            {service.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn('h-8 w-8', service.is_featured && 'text-amber-500')}
                                onClick={() => void handleToggleFeatured(service)}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{service.is_featured ? 'Remove from featured' : 'Mark as featured'}</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 text-amber-500" />
                          {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => handlePreview(service)}>
                              <Eye className="mr-2 h-4 w-4 text-sky-600" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(service)}>
                              <Pencil className="mr-2 h-4 w-4 text-amber-600" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleDuplicate(service)}>
                              <Copy className="mr-2 h-4 w-4 text-primary" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => void handleToggleActive(service)}>
                              {service.is_active ? (
                                <>
                                  <CircleOff className="mr-2 h-4 w-4 text-destructive" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleToggleFeatured(service)}>
                              <Star className="mr-2 h-4 w-4" />
                              {service.is_featured ? 'Unfeature' : 'Feature'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(service)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={(v) => {
                    setRowsPerPage(Number(v))
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="h-8 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 25, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="hidden sm:inline">
                  {totalCount === 0 ? '0–0' : `${rangeStart}–${rangeEnd}`} of {totalCount}
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * rowsPerPage >= totalCount || totalCount === 0}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        ) : layoutMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading && <div className="col-span-full py-12 text-center text-muted-foreground">Loading...</div>}
            {!loading && services.length === 0 && (
              <Card className="col-span-full rounded-xl border-dashed py-12 text-center">
                <p className="mb-3 text-muted-foreground">No services found</p>
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Service
                </Button>
              </Card>
            )}
            {!loading &&
              services.map((service) => (
                <Card
                  key={service.id}
                  className="rounded-xl transition-shadow hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          {service.image ? <AvatarImage src={service.image} alt="" /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary">{service.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{service.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {getCategoryDisplayName(categoryNameById, service.category)}
                            {service.subcategory?.trim()
                              ? ` · ${formatSubcategoryLabel(service.subcategory.trim().toLowerCase())}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => handlePreview(service)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(service)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleDuplicate(service)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => void handleDelete(service)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="line-clamp-3 min-h-[3.5rem] text-sm text-muted-foreground">
                      {service.short_description || (service.description ? `${service.description.slice(0, 100)}…` : '—')}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-primary">{displayBasePrice(service.base_price)}</p>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>{service.is_active ? 'Active' : 'Inactive'}</Badge>
                      {service.is_featured && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>Featured</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        ) : null}

        <ServicePreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          service={selectedService}
          categoryNameById={categoryNameById}
          onEdit={(s) => handleEdit(s)}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Service"
          message={`Are you sure you want to delete "${selectedService?.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteDialogOpen(false)
            setSelectedService(null)
          }}
        />
      </div>
    </TooltipProvider>
  )
}
