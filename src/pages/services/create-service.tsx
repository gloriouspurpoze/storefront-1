import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Upload,
  Star,
  IndianRupee,
  Info,
  Calendar,
  MapPin,
  Wrench,
  ArrowUp,
  ArrowDown,
  CircleCheck,
  CircleX,
  Lightbulb,
  ShieldCheck,
  CircleHelp,
  ListOrdered,
  Search,
  X,
  MessageSquare,
  Layers,
  Puzzle,
  Package,
  GripVertical,
  MessageCircle,
  Sparkles,
  Pencil,
  ImageIcon,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'
import { normalizeRefToMongoIdString } from '../../lib/mongoObjectId'
import {
  platformServicesService,
  type ProductRelationType,
  type ServiceProductLinkInput,
} from '../../services/api/platformServices.service'
import {
  ReviewsService,
  type BookingReview,
  type ReviewStats,
  type AdminCreateReviewPayload,
  type AdminUpdateReviewPayload,
} from '../../services/api/reviews.service'
import { CategoriesService } from '../../services/api/categories.service'
import { SubcategoriesService } from '../../services/api/subcategories.service'
import { ProvidersService } from '../../services/api/providers.service'
import { ProductsService } from '../../services/api/products.service'
import {
  RichTextField,
  ImageUploadField,
  type ImageFile,
} from '../../components/forms'
import UploadService from '../../services/api/upload.service'
import { MobileServiceCardPreview } from '../../components/services/MobileServiceCardPreview'
import { ServiceImageGuidancePanel } from '../../components/services/ServiceImageGuidancePanel'
import { SERVICE_CARD_IMAGE_SPEC } from '../../constants/serviceImageSpec'

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'consultation', label: 'Consultation' },
]

const WORKING_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (9:00 AM - 12:00 PM)' },
  { value: 'afternoon', label: 'Afternoon (12:00 PM - 3:00 PM)' },
  { value: 'evening', label: 'Evening (3:00 PM - 6:00 PM)' },
  { value: 'night', label: 'Night (6:00 PM - 9:00 PM)' },
]

type ServiceProductLink = {
  product_id: string
  relation_type: ProductRelationType
  display_order: number
}

const PRODUCT_RELATION_TYPES: Array<{
  value: ProductRelationType
  label: string
  hint: string
}> = [
  {
    value: 'recommended',
    label: 'Recommended',
    hint: 'Suggested upsell — customer can skip',
  },
  {
    value: 'required',
    label: 'Required',
    hint: 'Must be included to complete the booking',
  },
  {
    value: 'optional',
    label: 'Optional',
    hint: 'Available but not highlighted',
  },
  {
    value: 'alternative',
    label: 'Alternative',
    hint: 'Substitute option when multiple parts apply',
  },
]

function reindexProductLinks(links: ServiceProductLink[]): ServiceProductLink[] {
  return links
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((link, index) => ({ ...link, display_order: index }))
}

function productLinksFromApi(service: unknown): ServiceProductLink[] {
  const s = service as Record<string, unknown>
  const related = s?.relatedProducts
  if (Array.isArray(related) && related.length) {
    return reindexProductLinks(
      related
        .map((rp: any, i: number) => ({
          product_id: String(rp?.product_id ?? rp?.productId ?? rp?.product?.id ?? ''),
          relation_type: (rp?.relation_type ?? 'recommended') as ProductRelationType,
          display_order: Number(rp?.display_order ?? i),
        }))
        .filter((l) => l.product_id),
    )
  }
  const flat = s?.selected_products
  if (Array.isArray(flat) && flat.length) {
    if (typeof flat[0] === 'object' && flat[0] != null && 'product_id' in (flat[0] as object)) {
      return reindexProductLinks(
        (flat as ServiceProductLinkInput[]).map((item, i) => ({
          product_id: String(item.product_id),
          relation_type: (item.relation_type ?? 'recommended') as ProductRelationType,
          display_order: Number(item.display_order ?? i),
        })),
      )
    }
    return reindexProductLinks(
      (flat as string[]).map((id, i) => ({
        product_id: String(id),
        relation_type: 'recommended' as const,
        display_order: i,
      })),
    )
  }
  return []
}

function serializeProductLinksForApi(links: ServiceProductLink[]): ServiceProductLinkInput[] {
  return reindexProductLinks(links).map(({ product_id, relation_type, display_order }) => ({
    product_id,
    relation_type,
    display_order,
  }))
}

function deriveReviewCustomerName(review: BookingReview): string {
  if (review.customerName?.trim()) return review.customerName.trim()
  const cust = review.customerId
  if (cust && typeof cust === 'object') {
    const first = (cust as { firstName?: string }).firstName ?? ''
    const last = (cust as { lastName?: string }).lastName ?? ''
    const joined = `${first} ${last}`.trim()
    if (joined) return joined
  }
  return 'Customer'
}

function formatRelativeDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getCategoryId(c: any): string {
  return String(c?.id ?? c?._id ?? '').toLowerCase()
}

function slugifyLabel(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractIdLikeString(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const id = o.id ?? o._id
    if (id != null && String(id).trim()) return String(id).trim().toLowerCase()
    if (o.slug != null && String(o.slug).trim()) return String(o.slug).trim().toLowerCase()
    if (o.name != null && String(o.name).trim()) return String(o.name).trim().toLowerCase()
    return ''
  }
  return String(raw).trim().toLowerCase()
}

/** Map API category (id, slug, or name) to a dropdown value that exists in loaded categories. */
function resolveCategoryPick(raw: unknown, categories: any[]): string {
  const hint = extractIdLikeString(raw)
  if (!hint || !categories.length) return hint
  if (categories.some((c) => getCategoryId(c) === hint)) return hint
  const bySlug = categories.find((c) => String((c as any).slug ?? '').toLowerCase() === hint)
  if (bySlug) return getCategoryId(bySlug)
  const byName = categories.find((c) => String((c as any).name ?? '').toLowerCase() === hint)
  if (byName) return getCategoryId(byName)
  const bySlugifiedName = categories.find((c) => slugifyLabel(String((c as any).name ?? '')) === hint)
  if (bySlugifiedName) return getCategoryId(bySlugifiedName)
  return hint
}

function resolveSubcategoryPick(raw: unknown, subs: any[]): string {
  const hint = extractIdLikeString(raw)
  if (!hint || !subs.length) return hint
  if (subs.some((s) => getCategoryId(s) === hint)) return hint
  const bySlug = subs.find((s) => String((s as any).slug ?? '').toLowerCase() === hint)
  if (bySlug) return getCategoryId(bySlug)
  const byName = subs.find((s) => String((s as any).name ?? '').toLowerCase() === hint)
  if (byName) return getCategoryId(byName)
  return hint
}

/** Read category/subcategory from GET payload (ids, populated objects, or slugs). */
function extractServiceCategoryRefs(service: unknown): { category: string; subcategory: string } {
  const s = service as Record<string, unknown>
  const category =
    normalizeRefToMongoIdString(s.category_id) ??
    normalizeRefToMongoIdString(s.categoryId) ??
    normalizeRefToMongoIdString(s.category) ??
    extractIdLikeString(s.category_id ?? s.categoryId ?? s.category)

  const subcategory =
    normalizeRefToMongoIdString(s.subcategory_id) ??
    normalizeRefToMongoIdString(s.subcategoryId) ??
    normalizeRefToMongoIdString(s.subcategory) ??
    extractIdLikeString(s.subcategory_id ?? s.subcategoryId ?? s.subcategory)

  return {
    category: category ?? '',
    subcategory: subcategory ?? '',
  }
}

/** Rich text often saves as `<p><br></p>` — treat as empty for required validation. */
function richTextHasPlainText(html: string): boolean {
  if (!html || !String(html).trim()) return false
  const stripped = String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > 0
}

/**
 * Single-image dropzone tailored for the package / variant row.
 *
 * Why not reuse the big `ImageUploadField`?
 *   - That component is multi-image, alt-text, reorder, primary-flag etc.
 *   - The package tile needs ONE square photo with two obvious actions:
 *     upload a new file OR pick one from the existing Cloudinary library
 *     (lets ops re-use the same hero across packages without re-uploading).
 *   - 1:1 ratio matches the customer-facing "Choose a package" tile.
 */
function PackagePhotoSlot({
  target,
  url,
  uploading,
  error,
  disabled,
  onUpload,
  onPickFromLibrary,
  onClear,
  cloudinaryFolder = 'homeservice',
}: {
  target: number | 'new'
  url: string
  uploading: boolean
  error?: string
  disabled?: boolean
  onUpload: (file: File) => void
  /** Called when the operator picks an existing asset from Cloudinary. */
  onPickFromLibrary: (asset: { url: string; publicId?: string }) => void
  onClear: () => void
  /** Cloudinary folder to scope the picker against. */
  cloudinaryFolder?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputId = `pkg-img-${target}`

  // Cloudinary library picker state — local to each slot so two open dialogs
  // can't fight over the same fetch.
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryItems, setLibraryItems] = useState<Array<{ url: string; publicId: string }>>([])
  const [librarySearch, setLibrarySearch] = useState('')

  const pickFile = () => inputRef.current?.click()

  const handleFile = (file: File | undefined) => {
    if (!file) return
    onUpload(file)
  }

  const openLibrary = useCallback(async () => {
    setLibraryOpen(true)
    setLibraryError(null)
    setLibraryLoading(true)
    try {
      // Search both the package-specific folder and the parent folder so older
      // assets uploaded before this scope existed still show up.
      const [scoped, parent] = await Promise.all([
        UploadService.listImages(`${cloudinaryFolder}/service-packages`, 60).catch(() => []),
        UploadService.listImages(cloudinaryFolder, 60).catch(() => []),
      ])
      const seen = new Set<string>()
      const merged: Array<{ url: string; publicId: string }> = []
      for (const item of [...scoped, ...parent]) {
        const key = (item.publicId || item.url || '').trim()
        if (!key || seen.has(key)) continue
        seen.add(key)
        merged.push({ url: item.url, publicId: item.publicId })
      }
      setLibraryItems(merged)
    } catch (e: any) {
      setLibraryError(e?.message || 'Failed to load images')
      setLibraryItems([])
    } finally {
      setLibraryLoading(false)
    }
  }, [cloudinaryFolder])

  const filteredLibrary = useMemo(() => {
    const q = librarySearch.trim().toLowerCase()
    if (!q) return libraryItems
    return libraryItems.filter((item) =>
      (item.publicId || item.url).toLowerCase().includes(q),
    )
  }, [libraryItems, librarySearch])

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId} className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <ImageIcon className="h-3 w-3" />
        Package image<span className="text-destructive">*</span>
      </Label>
      <div
        onDragEnter={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragOver(false)
        }}
        onDrop={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          handleFile(file)
        }}
        className={cn(
          'relative flex aspect-square w-full select-none items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 text-center transition',
          dragOver && !url && 'border-primary/60 bg-primary/[0.06]',
          error && !uploading && 'border-destructive/60 bg-destructive/[0.05]',
          !url && !error && 'border-border hover:border-primary/40',
          url && 'border-solid border-border bg-card',
        )}
      >
        {url ? (
          <>
            <img src={url} alt="Package preview" className="h-full w-full object-cover" />
            {!disabled ? (
              <div className="absolute inset-0 flex flex-col items-center justify-end gap-1.5 bg-gradient-to-t from-black/55 via-transparent to-transparent p-2 opacity-0 transition-opacity hover:opacity-100">
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-[11px]"
                    onClick={pickFile}
                    disabled={uploading}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-[11px]"
                    onClick={onClear}
                    disabled={uploading}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Remove
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 bg-background/95 px-2 text-[10px]"
                  onClick={() => void openLibrary()}
                  disabled={uploading}
                >
                  <ImageIcon className="mr-1 h-3 w-3" />
                  Library
                </Button>
              </div>
            ) : null}
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading…
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-xs font-medium text-muted-foreground">
            <button
              type="button"
              onClick={pickFile}
              disabled={disabled}
              className="flex flex-col items-center gap-1 hover:text-foreground"
            >
              <Upload className="h-5 w-5" />
              <span>Drop or click to upload</span>
              <span className="text-[10px] font-normal">JPG / PNG / WebP · up to 5 MB</span>
            </button>
            <span className="text-[10px] font-normal text-muted-foreground">or</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              onClick={() => void openLibrary()}
              disabled={disabled}
            >
              <ImageIcon className="mr-1 h-3 w-3" />
              Pick from Cloudinary
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            // Reset so picking the same file twice still triggers onChange.
            e.target.value = ''
            handleFile(file)
          }}
          disabled={disabled}
        />
        {uploading && url ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading…
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="flex items-start gap-1 text-[11px] text-destructive">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          Square 1:1 ratio works best. Shown ~180×180 px on the storefront tile.
        </p>
      )}

      <Dialog
        open={libraryOpen}
        onOpenChange={(open) => {
          setLibraryOpen(open)
          if (!open) {
            setLibraryError(null)
            setLibrarySearch('')
          }
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,640px)] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="shrink-0 space-y-1.5 border-b px-5 pb-3 pt-5 text-left">
            <DialogTitle className="text-base">Pick a package image from Cloudinary</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Showing assets from <span className="font-mono">{cloudinaryFolder}/service-packages</span>{' '}
              and the parent <span className="font-mono">{cloudinaryFolder}</span> folder.
            </p>
          </DialogHeader>

          <div className="shrink-0 border-b px-5 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Filter by name or public id…"
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {libraryLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading images…
              </div>
            ) : libraryError ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-destructive">{libraryError}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void openLibrary()}>
                  Try again
                </Button>
              </div>
            ) : filteredLibrary.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
                {librarySearch
                  ? 'No images match that filter.'
                  : 'No images uploaded to this folder yet. Upload one first to fill the library.'}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                {filteredLibrary.map((item) => {
                  const isCurrent = item.url === url
                  return (
                    <button
                      key={item.publicId || item.url}
                      type="button"
                      onClick={() => {
                        onPickFromLibrary({ url: item.url, publicId: item.publicId })
                        setLibraryOpen(false)
                      }}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition',
                        isCurrent
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-primary/60',
                      )}
                      title={item.publicId}
                    >
                      <img
                        src={item.url}
                        alt={item.publicId}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      {isCurrent ? (
                        <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground">
                          Current
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t bg-muted/30 px-5 py-3">
            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
              <span>
                {libraryLoading
                  ? '—'
                  : `${filteredLibrary.length} of ${libraryItems.length} image${
                      libraryItems.length === 1 ? '' : 's'
                    }`}
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setLibraryOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function CreateService() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() // Get service ID from URL for edit mode
  const isEditMode = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [loadingService, setLoadingService] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  
  // API Data
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const categoriesRef = useRef<any[]>([])
  const subcategoriesRef = useRef<any[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Form state — optional fields pre-filled with valid defaults so user only fills mandatory ones
  const [formData, setFormData] = useState({
  // Basic Info (mandatory: name, category, subcategory, description)
    name: '',
    slug: '',
    description: '',
    short_description: 'Quality service by trained professionals.',
    category: '',
    subcategory: '',
    provider_id: '',
    selected_products: [] as ServiceProductLink[],
    service_type: 'fixed' as 'fixed' | 'hourly' | 'consultation',
    duration: '60 mins',
    images: [] as ImageFile[],
    is_popular: false,
    is_active: true,
  // Pricing (pre-filled)
    base_price: '299',
    original_price: '',
    hourly_rate: '199',
    consultation_fee: '99',
    min_hours: '1',
    max_hours: '8',
    gst_percentage: 18,
    tax_included: false,
  // Availability (pre-filled)
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    time_slots: ['morning', 'afternoon'] as string[],
    advance_booking_hours: 24,
    same_day_booking: true,
    emergency_service: false,
    emergency_charge: '',
  // Features & Requirements
    features: [] as string[],
    requirements: [] as string[],
    product_options: [] as any[],
    service_addons: [] as Array<{ name: string; price: string; description: string }>,
    // Service Areas — real-world defaults
    service_areas: [
      { name: 'Within city (0–15 km)', multiplier: 1.0, active: true },
      { name: 'Suburbs / outskirts (15–30 km)', multiplier: 1.2, active: true },
      { name: 'Out of city (30+ km)', multiplier: 1.5, active: true },
    ] as any[],
    // Our Process — step-by-step home service flow
    our_process: [
      { step: 1, title: 'Book online', description: 'Select your service, choose a time slot, and confirm your booking. You will receive a confirmation with expert details.' },
      { step: 2, title: 'Expert assigned', description: 'A verified professional is assigned to your job. You can view their profile and get an estimated arrival time.' },
      { step: 3, title: 'Service at your place', description: 'Our expert arrives at the scheduled time, completes the job with quality materials, and explains what was done.' },
      { step: 4, title: 'Payment & feedback', description: 'Pay securely after service. Share your feedback to help us improve and to help other customers.' },
    ] as Array<{ step: number; title: string; description: string }>,
    whats_included: [
      'Labour and service charges as quoted',
      'Basic materials and consumables (unless specified otherwise)',
      'Workmanship warranty as per plan',
      'Post-service support for the warranty period',
    ] as string[],
    whats_excluded: [
      'Parts or components not included in the quote',
      'Additional work not part of the original scope',
      'Structural or design changes',
      'Repairs due to misuse or tampering after service',
    ] as string[],
    please_note: [
      'Advance booking of at least 24 hours is recommended for confirmed slots.',
      'Please keep the work area accessible; our expert will need power/water as applicable.',
      'Valid ID may be required for verification at the time of service.',
    ] as string[],
    our_promises: [
      'Verified, trained professionals for every booking',
      'Transparent pricing—no hidden charges',
      'Satisfaction guarantee on workmanship',
      'Easy reschedule or cancellation as per policy',
    ] as string[],
    faqs: [
      { question: 'What is included in the service?', answer: 'Labour, basic materials as mentioned in the quote, and workmanship warranty are included. Any parts not in the quote are charged separately with your consent.' },
      { question: 'How do I book and pay?', answer: 'Book online by selecting date and time. You can pay online or pay at the time of service. We accept cards, UPI, and cash as per policy.' },
      { question: 'Is there a warranty?', answer: 'Yes. We offer workmanship warranty as per your chosen plan. Defects in our work within the warranty period will be rectified at no extra cost.' },
    ] as Array<{ question: string; answer: string }>,
    seo_title: '',
    seo_description: '',
    seo_keywords: [] as string[],
    is_featured: false,
    sort_order: 0,
    tags: [] as string[],
    icon: '',
  })

  // Dynamic fields
  const [newTag, setNewTag] = useState('')
  const [newSeoKeyword, setNewSeoKeyword] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    brand: '',
    warranty: '',
    description: '',
    image: '',
    imagePublicId: '',
  })
  /** Per-row inline upload spinner — true while a Cloudinary upload is in flight. */
  const [packageImageUploadIndex, setPackageImageUploadIndex] = useState<number | 'new' | null>(null)
  /** Inline error message keyed by package index ('new' for the add-form). Cleared on next upload attempt. */
  const [packageImageErrors, setPackageImageErrors] = useState<Record<string, string>>({})
  const [newAddon, setNewAddon] = useState({ name: '', price: '', description: '' })
  const [productToLink, setProductToLink] = useState('')
  const [serviceReviews, setServiceReviews] = useState<BookingReview[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  })
  const [reviewSavingId, setReviewSavingId] = useState<string | null>(null)
  const [reviewDeletingId, setReviewDeletingId] = useState<string | null>(null)
  const blankAdminReview = useMemo(
    () => ({
      rating: 5,
      customerName: '',
      customerLocation: '',
      customerAvatar: '',
      variantName: '',
      comment: '',
      isVerified: true,
      isFeatured: false,
    }),
    [],
  )
  const [reviewForm, setReviewForm] = useState(blankAdminReview)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [editingReview, setEditingReview] = useState<BookingReview | null>(null)
  const [editReviewForm, setEditReviewForm] = useState(blankAdminReview)
  const [newServiceArea, setNewServiceArea] = useState({
    name: '',
    multiplier: 1.0,
    active: true
  })
  
  // NEW: Dynamic fields for customer-focused sections
  const [newProcessStep, setNewProcessStep] = useState({
    step: 1,
    title: '',
    description: ''
  })
  const [newIncluded, setNewIncluded] = useState('')
  const [newExcluded, setNewExcluded] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newPromise, setNewPromise] = useState('')
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: ''
  })


  // Create subcategory inline (for selected category)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [creatingSubcategory, setCreatingSubcategory] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const addSeoKeyword = () => {
    const k = newSeoKeyword.trim()
    if (k && !formData.seo_keywords.includes(k)) {
      setFormData((prev) => ({
        ...prev,
        seo_keywords: [...prev.seo_keywords, k],
      }))
      setNewSeoKeyword('')
    }
  }

  const removeSeoKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      seo_keywords: prev.seo_keywords.filter((x) => x !== keyword),
    }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
    setFormData(prev => ({
      ...prev,
        features: [...prev.features, newFeature.trim()]
    }))
      setNewFeature('')
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (requirementToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== requirementToRemove)
    }))
  }

  const addProduct = () => {
    if (!newProduct.name.trim()) {
      appToast('Package name is required', 'error')
      return
    }
    if (!newProduct.image.trim()) {
      // Mirrors the main-service image rule — every customer-visible variant
      // tile needs a thumbnail to render the "Choose a package" scroller.
      appToast('Package image is required — upload before adding the package', 'error')
      setPackageImageErrors((prev) => ({ ...prev, new: 'Image is required for every package.' }))
      return
    }
    setFormData((prev) => ({
      ...prev,
      product_options: [...prev.product_options, { ...newProduct }],
    }))
    setNewProduct({
      name: '',
      price: '',
      brand: '',
      warranty: '',
      description: '',
      image: '',
      imagePublicId: '',
    })
    setPackageImageErrors((prev) => {
      const next = { ...prev }
      delete next.new
      return next
    })
  }

  const removeProduct = (index: number) => {
      setFormData(prev => ({
        ...prev,
      product_options: prev.product_options.filter((_, i) => i !== index)
      }))
  }

  const updateProductOption = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      product_options: prev.product_options.map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }))
  }

  /**
   * Cloudinary upload for a single package thumbnail.
   *
   * `target = 'new'` writes into the "Add package" form (the unsaved row at the
   * bottom of the section); a numeric `target` patches the existing
   * `product_options[index]` row. Both paths surface inline progress + error
   * feedback so the field never feels like a black box.
   */
  const uploadPackageImage = async (target: number | 'new', file: File) => {
    const key = String(target)
    setPackageImageErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    if (!file.type.startsWith('image/')) {
      setPackageImageErrors((prev) => ({ ...prev, [key]: 'Only image files are allowed (JPG, PNG, WebP).' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPackageImageErrors((prev) => ({ ...prev, [key]: 'File must be 5 MB or smaller.' }))
      return
    }
    try {
      setPackageImageUploadIndex(target)
      const res = await UploadService.uploadImage(file, 'homeservice/service-packages')
      const url = res?.url
      const publicId = res?.publicId
      if (!url) throw new Error('Upload returned no URL')
      if (target === 'new') {
        setNewProduct((prev) => ({ ...prev, image: url, imagePublicId: publicId || '' }))
      } else {
        setFormData((prev) => ({
          ...prev,
          product_options: prev.product_options.map((p, i) =>
            i === target ? { ...p, image: url, imagePublicId: publicId || '' } : p,
          ),
        }))
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      setPackageImageErrors((prev) => ({ ...prev, [key]: msg }))
      appToast(msg, 'error')
    } finally {
      setPackageImageUploadIndex(null)
    }
  }

  const clearPackageImage = (target: number | 'new') => {
    if (target === 'new') {
      setNewProduct((prev) => ({ ...prev, image: '', imagePublicId: '' }))
    } else {
      setFormData((prev) => ({
        ...prev,
        product_options: prev.product_options.map((p, i) =>
          i === target ? { ...p, image: '', imagePublicId: '' } : p,
        ),
      }))
    }
    setPackageImageErrors((prev) => {
      const next = { ...prev }
      delete next[String(target)]
      return next
    })
  }

  /**
   * Apply an existing Cloudinary asset to a package slot — no re-upload, just
   * pointers. We still clear any stale error chip on the row.
   */
  const setPackageImageFromLibrary = (
    target: number | 'new',
    asset: { url: string; publicId?: string },
  ) => {
    const url = asset.url
    const publicId = asset.publicId || ''
    if (target === 'new') {
      setNewProduct((prev) => ({ ...prev, image: url, imagePublicId: publicId }))
    } else {
      setFormData((prev) => ({
        ...prev,
        product_options: prev.product_options.map((p, i) =>
          i === target ? { ...p, image: url, imagePublicId: publicId } : p,
        ),
      }))
    }
    setPackageImageErrors((prev) => {
      const next = { ...prev }
      delete next[String(target)]
      return next
    })
  }

  const addAddon = () => {
    if (!newAddon.name.trim()) return
    setFormData((prev) => ({
      ...prev,
      service_addons: [...prev.service_addons, { ...newAddon }],
    }))
    setNewAddon({ name: '', price: '', description: '' })
  }

  const removeAddon = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      service_addons: prev.service_addons.filter((_, i) => i !== index),
    }))
  }

  const updateAddon = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      service_addons: prev.service_addons.map((a, i) =>
        i === index ? { ...a, [field]: value } : a,
      ),
    }))
  }

  const sortedProductLinks = useMemo(
    () => reindexProductLinks(formData.selected_products),
    [formData.selected_products],
  )

  const linkedProductIdSet = useMemo(
    () => new Set(sortedProductLinks.map((l) => l.product_id)),
    [sortedProductLinks],
  )

  const availableCatalogProducts = useMemo(
    () => products.filter((p) => p?.id && !linkedProductIdSet.has(String(p.id))),
    [products, linkedProductIdSet],
  )

  const addLinkedProduct = () => {
    const productId = productToLink.trim()
    if (!productId) return
    setFormData((prev) => {
      if (prev.selected_products.some((l) => l.product_id === productId)) return prev
      return {
        ...prev,
        selected_products: [
          ...prev.selected_products,
          {
            product_id: productId,
            relation_type: 'recommended',
            display_order: prev.selected_products.length,
          },
        ],
      }
    })
    setProductToLink('')
  }

  const removeLinkedProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_products: reindexProductLinks(
        prev.selected_products.filter((l) => l.product_id !== productId),
      ),
    }))
  }

  const updateLinkedProductRelation = (productId: string, relation_type: ProductRelationType) => {
    setFormData((prev) => ({
      ...prev,
      selected_products: prev.selected_products.map((l) =>
        l.product_id === productId ? { ...l, relation_type } : l,
      ),
    }))
  }

  const moveLinkedProduct = (productId: string, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const sorted = reindexProductLinks(prev.selected_products)
      const index = sorted.findIndex((l) => l.product_id === productId)
      if (index < 0) return prev
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= sorted.length) return prev
      const next = [...sorted]
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return { ...prev, selected_products: reindexProductLinks(next) }
    })
  }

  const addServiceArea = () => {
    if (newServiceArea.name.trim()) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, { ...newServiceArea }]
      }))
      setNewServiceArea({
        name: '',
        multiplier: 1.0,
        active: true
      })
    }
  }

  const removeServiceArea = (index: number) => {
      setFormData(prev => ({
        ...prev,
      service_areas: prev.service_areas.filter((_, i) => i !== index)
    }))
  }

  // NEW: Handlers for customer-focused sections
  const addProcessStep = () => {
    if (newProcessStep.title.trim() && newProcessStep.description.trim()) {
      setFormData(prev => ({
        ...prev,
        our_process: [...prev.our_process, { 
          ...newProcessStep, 
          step: prev.our_process.length + 1 
        }]
      }))
      setNewProcessStep({
        step: 1,
        title: '',
        description: ''
      })
    }
  }

  const removeProcessStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      our_process: prev.our_process.filter((_, i) => i !== index).map((step, idx) => ({
        ...step,
        step: idx + 1 // Re-number steps
      }))
    }))
  }

  const moveProcessStep = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newProcess = [...prev.our_process]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      if (targetIndex >= 0 && targetIndex < newProcess.length) {
        [newProcess[index], newProcess[targetIndex]] = [newProcess[targetIndex], newProcess[index]]
        // Re-number steps
        return {
          ...prev,
          our_process: newProcess.map((step, idx) => ({ ...step, step: idx + 1 }))
        }
      }
      return prev
    })
  }

  const addIncluded = () => {
    if (newIncluded.trim()) {
      setFormData(prev => ({
        ...prev,
        whats_included: [...prev.whats_included, newIncluded.trim()]
      }))
      setNewIncluded('')
    }
  }

  const removeIncluded = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whats_included: prev.whats_included.filter((_, i) => i !== index)
    }))
  }

  const addExcluded = () => {
    if (newExcluded.trim()) {
      setFormData(prev => ({
        ...prev,
        whats_excluded: [...prev.whats_excluded, newExcluded.trim()]
      }))
      setNewExcluded('')
    }
  }

  const removeExcluded = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whats_excluded: prev.whats_excluded.filter((_, i) => i !== index)
    }))
  }

  const addNote = () => {
    if (newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        please_note: [...prev.please_note, newNote.trim()]
      }))
      setNewNote('')
    }
  }

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      please_note: prev.please_note.filter((_, i) => i !== index)
    }))
  }

  const addPromise = () => {
    if (newPromise.trim()) {
      setFormData(prev => ({
        ...prev,
        our_promises: [...prev.our_promises, newPromise.trim()]
      }))
      setNewPromise('')
    }
  }

  const removePromise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      our_promises: prev.our_promises.filter((_, i) => i !== index)
    }))
  }

  const addFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFormData(prev => ({
        ...prev,
        faqs: [...prev.faqs, { ...newFaq }]
      }))
      setNewFaq({
        question: '',
        answer: ''
      })
    }
  }

  const removeFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
  }

  const handleNameChange = (name: string) => {
      setFormData(prev => ({
        ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleGenerateSeoFromContent = () => {
    const title = formData.name.trim().slice(0, 60)
    const plain = richTextHasPlainText(formData.description)
      ? String(formData.description)
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 160)
      : ''
    const keywords = formData.tags.length ? [...formData.tags] : []
    setFormData((prev) => ({
      ...prev,
      seo_title: title || prev.seo_title,
      seo_description: plain || prev.seo_description,
      seo_keywords: keywords.length ? keywords : prev.seo_keywords,
    }))
    appToast('SEO fields filled from name, description, and tags', 'success')
  }

  const handleSubmit = async (action: 'draft' | 'publish' = 'publish') => {
    try {
      setLoading(true)

      if (action === 'draft') {
        if (!formData.name?.trim()) {
          appToast('Add a service name to save as draft', 'error')
          setActiveTab(0)
          return
        }
      } else {
        if (!formData.name?.trim()) {
          appToast('Service name is required', 'error')
          setActiveTab(0)
          return
        }
        if (!formData.category?.trim()) {
          appToast('Please select a category', 'error')
          setActiveTab(0)
          return
        }
        const subsRequired =
          Boolean(formData.category?.trim()) && !loadingSubcategories && subcategories.length > 0
        if (subsRequired && !formData.subcategory?.trim()) {
          appToast('Please select a subcategory', 'error')
          setActiveTab(0)
          return
        }
        if (!richTextHasPlainText(formData.description)) {
          appToast('Description is required', 'error')
          setActiveTab(0)
          return
        }
        const minH = parseInt(String(formData.min_hours), 10)
        const maxH = parseInt(String(formData.max_hours), 10)
        if (
          formData.min_hours &&
          formData.max_hours &&
          !Number.isNaN(minH) &&
          !Number.isNaN(maxH) &&
          minH > maxH
        ) {
          appToast('Minimum hours cannot be greater than maximum hours', 'error')
          setActiveTab(1)
          return
        }
        // Every customer-visible package needs a thumbnail or the
        // "Choose a package" scroller renders a stale placeholder. We
        // enforce on Publish only — draft saves can still ship partial.
        const packagesWithoutImage: Array<{ index: number; name: string }> = []
        const nextErrors: Record<string, string> = {}
        formData.product_options.forEach((pkg: any, idx: number) => {
          if (!String(pkg?.image ?? '').trim()) {
            packagesWithoutImage.push({ index: idx, name: String(pkg?.name ?? `Package ${idx + 1}`) })
            nextErrors[String(idx)] = 'Image required'
          }
        })
        if (packagesWithoutImage.length > 0) {
          setPackageImageErrors(nextErrors)
          appToast(
            `Add an image for: ${packagesWithoutImage.map((p) => p.name).join(', ')}`,
            'error',
          )
          setActiveTab(4)
          return
        }
      }

      // Get primary image or first image
      const primaryImage = formData.images.find(img => img.isPrimary) || formData.images[0]

      // Map new form data to API format; use undefined for empty strings so they are omitted in JSON (avoids 400 on strict backends)
      const raw: Record<string, any> = {
        name: formData.name.trim(),
        display_name: formData.name.trim(),
        slug: formData.slug || undefined,
        description: formData.description?.trim() || undefined,
        short_description: formData.short_description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        subcategory: formData.subcategory?.trim() || undefined,
        provider_id: formData.provider_id?.trim() || undefined,
        // Junction links with relation_type + display_order (idempotent on edit).
        selected_products: isEditMode
          ? serializeProductLinksForApi(formData.selected_products)
          : formData.selected_products.length
            ? serializeProductLinksForApi(formData.selected_products)
            : undefined,
        service_type: formData.service_type as 'fixed' | 'hourly' | 'consultation',
        duration: formData.duration?.trim() || undefined,
        base_price: formData.base_price ? parseFloat(String(formData.base_price)) : undefined,
        original_price:
          formData.original_price !== '' && formData.original_price != null
            ? parseFloat(String(formData.original_price))
            : (isEditMode ? null : undefined),
        hourly_rate: formData.hourly_rate ? parseFloat(String(formData.hourly_rate)) : undefined,
        consultation_fee: formData.consultation_fee ? parseFloat(String(formData.consultation_fee)) : undefined,
        min_hours: formData.min_hours ? parseInt(String(formData.min_hours), 10) : undefined,
        max_hours: formData.max_hours ? parseInt(String(formData.max_hours), 10) : undefined,
        gst_percentage: formData.gst_percentage,
        tax_included: formData.tax_included,
        is_active: action === 'publish',
        is_featured: formData.is_featured,
        is_popular: formData.is_popular,
        sort_order: formData.sort_order,
        tags: formData.tags?.length ? formData.tags : undefined,
        features: formData.features?.length ? formData.features : undefined,
        requirements: formData.requirements?.length ? formData.requirements : undefined,
        working_days: formData.working_days?.length ? formData.working_days : undefined,
        time_slots: formData.time_slots?.length ? formData.time_slots : undefined,
        advance_booking_hours: formData.advance_booking_hours,
        same_day_booking: formData.same_day_booking,
        emergency_service: formData.emergency_service,
        emergency_charge: formData.emergency_charge ? parseFloat(String(formData.emergency_charge)) : undefined,
        product_options: isEditMode
          ? (Array.isArray(formData.product_options) ? formData.product_options : [])
          : (formData.product_options?.length ? formData.product_options : undefined),
        service_addons: isEditMode
          ? (Array.isArray(formData.service_addons) ? formData.service_addons : [])
          : (formData.service_addons?.length ? formData.service_addons : undefined),
        service_areas: formData.service_areas?.length ? formData.service_areas : undefined,
        icon: formData.icon?.trim() || undefined,
        image: primaryImage?.url || undefined,
        images: formData.images?.length ? formData.images.map((img: any) => img.url).filter(Boolean) : undefined,
        our_process: formData.our_process?.length ? formData.our_process : undefined,
        whats_included: formData.whats_included?.length ? formData.whats_included : undefined,
        whats_excluded: formData.whats_excluded?.length ? formData.whats_excluded : undefined,
        please_note: formData.please_note?.length ? formData.please_note : undefined,
        our_promises: formData.our_promises?.length ? formData.our_promises : undefined,
        faqs: formData.faqs?.length ? formData.faqs : undefined,
        seo_title: formData.seo_title?.trim() || undefined,
        seo_description: formData.seo_description?.trim() || undefined,
        seo_keywords: formData.seo_keywords?.length ? formData.seo_keywords : undefined,
      }
      // Publish: explicit status. Edit + draft: send draft status on update. Create + draft: omit (saveAsDraft sets it).
      if (action === 'publish') {
        raw.status = 'published'
      } else if (action === 'draft' && isEditMode && id) {
        raw.status = 'draft'
      }

      // Drop undefined, empty string, and NaN so backend doesn't get invalid values
      const submitData = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => {
          if (v === undefined || v === '') return false
          if (typeof v === 'number' && Number.isNaN(v)) return false
          return true
        })
      ) as any

      if (isEditMode && id) {
        await platformServicesService.updateService(id, submitData)
        appToast(
          action === 'draft' ? 'Draft saved successfully.' : 'Service updated successfully!',
          'success',
        )
      } else {
        if (action === 'draft') {
          await platformServicesService.saveAsDraft(submitData)
          appToast('Service saved as draft successfully!', 'success')
        } else {
          await platformServicesService.createService(submitData)
          appToast('Service published successfully!', 'success')
        }
      }

      setTimeout(() => navigate('/platform-services'), 1500)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        (error?.errors ? error.errors.map((e: any) => e.message || e.msg).join(', ') : null) ??
        `Failed to ${isEditMode ? 'update' : action} service`
      appToast(String(message), 'error')
    } finally {
      setLoading(false)
    }
  }


  // Load service data if in edit mode
  useEffect(() => {
    const loadService = async () => {
      if (!id) return
      
      try {
        setLoadingService(true)
        const service = await platformServicesService.getServiceById(id)

        const { category: rawCategory, subcategory: rawSubcategory } = extractServiceCategoryRefs(service)
        const cats = categoriesRef.current
        const categoryId = cats.length ? resolveCategoryPick(rawCategory, cats) : rawCategory
        const subs = subcategoriesRef.current
        const subcategoryId =
          subs.length && categoryId ? resolveSubcategoryPick(rawSubcategory, subs) : rawSubcategory
        // Normalize images: support image (string), images (array of strings or objects with url)
        const rawImages = (service as any).images ?? ((service as any).image ? [(service as any).image] : [])
        const images: ImageFile[] = (Array.isArray(rawImages) ? rawImages : []).map((img: any, i: number) => {
          const url = typeof img === 'string' ? img : (img?.url ?? img?.secure_url ?? '')
          if (!url) return null
          return {
            id: (img?.id ?? img?.public_id ?? `loaded-${i}-${Date.now()}`).toString(),
            url,
            alt: (typeof img === 'object' && img.alt) ? img.alt : (service.name || 'Service image'),
            isPrimary: i === 0,
            order: i,
            file: undefined,
            publicId: typeof img === 'object' ? img.public_id ?? img.publicId : undefined,
            fromLibrary: true,
          }
        }).filter(Boolean) as ImageFile[]
        // If no array images, fallback to single service.image
        const finalImages = images.length > 0 ? images : (service.image ? [{
          id: `loaded-0-${Date.now()}`,
          url: service.image,
          file: undefined,
          isPrimary: true,
          alt: service.name || 'Service image',
          order: 0,
          fromLibrary: true,
        }] as ImageFile[] : [])

        // Convert service data to form format
        setFormData({
          name: service.name || '',
          slug: service.slug || '',
          description: service.description || '',
          short_description: service.short_description || '',
          category: String(categoryId || ''),
          subcategory: String(subcategoryId || ''),
          provider_id: '', // Not available in API response
          selected_products: productLinksFromApi(service),
          service_type: service.service_type || 'fixed',
          duration: service.duration || '',
          images: finalImages,
          is_popular: service.is_popular || false,
          is_active: service.is_active || false,
          
          // Pricing
          base_price: service.base_price?.toString() || '',
          original_price:
            service.original_price != null && service.original_price !== 0
              ? service.original_price.toString()
              : '',
          hourly_rate: service.hourly_rate?.toString() || '',
          consultation_fee: service.consultation_fee?.toString() || '',
          min_hours: service.min_hours?.toString() || '',
          max_hours: service.max_hours?.toString() || '',
          gst_percentage: service.gst_percentage || 18,
          tax_included: service.tax_included || false,
          
          // Availability
          working_days: service.working_days || [],
          time_slots: service.time_slots || [],
          advance_booking_hours: service.advance_booking_hours || 24,
          same_day_booking: service.same_day_booking || false,
          emergency_service: service.emergency_service || false,
          emergency_charge: service.emergency_charge?.toString() || '',
          
          // Features & Requirements
          features: service.features || [],
          requirements: service.requirements || [],
          
          // Packages & add-ons
          product_options: (service.product_options || []).map((p: any) => ({
            name: String(p.name ?? ''),
            price: String(p.price ?? ''),
            brand: String(p.brand ?? ''),
            warranty: String(p.warranty ?? ''),
            description: String(p.description ?? ''),
            image: String(p.image ?? ''),
            imagePublicId: String(p.imagePublicId ?? ''),
          })),
          service_addons: (
            (service as any).serviceAddons ||
            (service as any).service_addons ||
            (service as any).addons ||
            []
          ).map((a: any) => ({
            name: String(a.name ?? ''),
            price: String(a.price ?? ''),
            description: String(a.description ?? ''),
          })),
          
          // Service Areas (backend returns { city, areas?, pincodes? }; form uses { name, multiplier, active })
          service_areas: (service.service_areas || []).map((a: any) => ({
            name: a.city ?? a.name ?? 'General',
            multiplier: a.multiplier ?? 1,
            active: a.active !== false,
          })),
          
          // NEW: Customer-focused sections
          our_process: (service as any).our_process || [],
          whats_included: (service as any).whats_included || [],
          whats_excluded: (service as any).whats_excluded || [],
          please_note: (service as any).please_note || [],
          our_promises: (service as any).our_promises || [],
          faqs: (service as any).faqs || [],
          seo_title: (service as any).seo_title || '',
          seo_description: (service as any).seo_description || '',
          seo_keywords: Array.isArray((service as any).seo_keywords) ? [...(service as any).seo_keywords] : [],

          is_featured: service.is_featured || false,
          sort_order: service.sort_order || 0,
          tags: service.tags || [],
          icon: service.icon || '',
        })
        
        appToast('Service loaded successfully', 'success')
      } catch (error: any) {
        appToast(error.message || 'Failed to load service', 'error')
        // Navigate back if service not found
        setTimeout(() => navigate('/platform-services'), 2000)
      } finally {
        setLoadingService(false)
      }
    }
    
    loadService()
  }, [id])

  const reloadReviews = async (
    options: { silent?: boolean } = {},
  ): Promise<void> => {
    if (!id || !isEditMode) {
      setServiceReviews([])
      return
    }
    if (!options.silent) setLoadingReviews(true)
    try {
      const data = await ReviewsService.getAdminServiceReviews(id, { limit: 100 })
      setServiceReviews(data.reviews ?? [])
      setReviewStats(
        data.stats ?? {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      )
    } catch {
      setServiceReviews([])
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      })
    } finally {
      if (!options.silent) setLoadingReviews(false)
    }
  }

  useEffect(() => {
    if (!id || !isEditMode) {
      setServiceReviews([])
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      })
      return
    }
    let cancelled = false
    const loadReviews = async () => {
      try {
        setLoadingReviews(true)
        const data = await ReviewsService.getAdminServiceReviews(id, { limit: 100 })
        if (cancelled) return
        setServiceReviews(data.reviews ?? [])
        setReviewStats(
          data.stats ?? {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        )
      } catch {
        if (!cancelled) {
          setServiceReviews([])
          setReviewStats({
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          })
        }
      } finally {
        if (!cancelled) setLoadingReviews(false)
      }
    }
    void loadReviews()
    return () => {
      cancelled = true
    }
  }, [id, isEditMode])

  const handleCreateAdminReview = async () => {
    if (!id) return
    const customerName = reviewForm.customerName.trim()
    if (!customerName) {
      appToast('Customer name is required', 'error')
      return
    }
    const rating = Number(reviewForm.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      appToast('Rating must be between 1 and 5', 'error')
      return
    }
    try {
      setReviewSubmitting(true)
      const payload: AdminCreateReviewPayload = {
        platformServiceId: id,
        rating,
        customerName,
        comment: reviewForm.comment.trim() || undefined,
        customerLocation: reviewForm.customerLocation.trim() || undefined,
        customerAvatar: reviewForm.customerAvatar.trim() || undefined,
        variantName: reviewForm.variantName.trim() || undefined,
        isVerified: reviewForm.isVerified,
        isFeatured: reviewForm.isFeatured,
      }
      await ReviewsService.adminCreateReview(payload)
      appToast('Review added', 'success')
      setReviewForm(blankAdminReview)
      await reloadReviews({ silent: true })
    } catch (err: any) {
      appToast(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          err?.message ??
          'Failed to create review',
        'error',
      )
    } finally {
      setReviewSubmitting(false)
    }
  }

  const openEditReview = (review: BookingReview) => {
    setEditingReview(review)
    setEditReviewForm({
      rating: review.rating,
      customerName: review.customerName ?? deriveReviewCustomerName(review),
      customerLocation: review.customerLocation ?? '',
      customerAvatar: review.customerAvatar ?? '',
      variantName: review.variantName ?? '',
      comment: review.comment ?? '',
      isVerified: review.isVerified ?? true,
      isFeatured: review.isFeatured ?? false,
    })
  }

  const handleSaveEditReview = async () => {
    if (!editingReview) return
    const rating = Number(editReviewForm.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      appToast('Rating must be between 1 and 5', 'error')
      return
    }
    try {
      setReviewSavingId(editingReview._id)
      const payload: AdminUpdateReviewPayload = {
        rating,
        comment: editReviewForm.comment.trim(),
        variantName: editReviewForm.variantName.trim() || undefined,
        isVerified: editReviewForm.isVerified,
        isFeatured: editReviewForm.isFeatured,
      }
      // Only update display fields when this is admin-curated (organic reviews
      // keep their populated user identity).
      if (editingReview.isAdminCurated) {
        payload.customerName = editReviewForm.customerName.trim()
        payload.customerLocation = editReviewForm.customerLocation.trim() || ''
        payload.customerAvatar = editReviewForm.customerAvatar.trim() || ''
      }
      await ReviewsService.adminUpdateReview(editingReview._id, payload)
      appToast('Review updated', 'success')
      setEditingReview(null)
      await reloadReviews({ silent: true })
    } catch (err: any) {
      appToast(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          err?.message ??
          'Failed to update review',
        'error',
      )
    } finally {
      setReviewSavingId(null)
    }
  }

  const handleToggleReviewFlag = async (
    review: BookingReview,
    field: 'isVerified' | 'isFeatured',
    next: boolean,
  ) => {
    try {
      setReviewSavingId(review._id)
      await ReviewsService.adminUpdateReview(review._id, { [field]: next })
      await reloadReviews({ silent: true })
    } catch (err: any) {
      appToast(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          err?.message ??
          'Failed to update review',
        'error',
      )
    } finally {
      setReviewSavingId(null)
    }
  }

  const handleDeleteReview = async (review: BookingReview) => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        `Delete this review${review.customerName ? ` from ${review.customerName}` : ''}? This cannot be undone.`,
      )
      if (!ok) return
    }
    try {
      setReviewDeletingId(review._id)
      await ReviewsService.adminDeleteReview(review._id)
      appToast('Review deleted', 'success')
      await reloadReviews({ silent: true })
    } catch (err: any) {
      appToast(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          err?.message ??
          'Failed to delete review',
        'error',
      )
    } finally {
      setReviewDeletingId(null)
    }
  }

  categoriesRef.current = categories
  subcategoriesRef.current = subcategories

  // Align category/subcategory with dropdown ids after service + catalogs finish loading (fixes edit race).
  useEffect(() => {
    if (loadingCategories || loadingService || categories.length === 0) return
    setFormData((prev) => {
      if (!prev.category?.trim()) return prev
      const resolved = resolveCategoryPick(prev.category, categories)
      if (resolved === prev.category) return prev
      return { ...prev, category: resolved }
    })
  }, [categories, loadingCategories, loadingService])

  useEffect(() => {
    if (loadingSubcategories || loadingService || subcategories.length === 0) return
    setFormData((prev) => {
      if (!prev.subcategory?.trim()) return prev
      const resolved = resolveSubcategoryPick(prev.subcategory, subcategories)
      if (resolved === prev.subcategory) return prev
      return { ...prev, subcategory: resolved }
    })
  }, [subcategories, loadingSubcategories, loadingService])

  // Fetch categories for dropdown: full service/both list so ids match API (not only root parents).
  useEffect(() => {
    const normalizeList = (raw: any): any[] => {
      const list = Array.isArray(raw)
        ? raw
        : raw?.categories ?? raw?.data?.categories ?? []
      return (list || [])
        .map((c: any) => ({
          ...c,
          id: getCategoryId(c),
          name: (c.name ?? c.title ?? '').toString().trim(),
        }))
        .filter((c: any) => c.id && c.name)
    }
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const raw = await CategoriesService.getCategoriesForServiceUIs({
          page: 1,
          limit: 500,
          is_active: true,
        })
        const list = normalizeList({ categories: raw })
        list.sort((a: any, b: any) =>
          String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' }),
        )
        setCategories(list)
      } catch (error) {
        console.error('Error fetching categories:', error)
        appToast('Failed to load categories', 'error')
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true)
        const response = await ProvidersService.getProviders({
          page: 1,
          limit: 100
        })
        if (response.success) {
          setProviders(response?.data?.providers || [])
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
        appToast('Failed to load providers', 'error')
      } finally {
        setLoadingProviders(false)
      }
    }

    fetchProviders()
  }, [])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await ProductsService.getProducts({
          page: 1,
          limit: 100,
          is_active: true
        })
        
        if (response.success) {
          setProducts(response.data.products || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        appToast('Failed to load products', 'error')
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  const fetchSubcategoriesForCategory = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    const resolvedCategoryId = categoriesRef.current.length
      ? resolveCategoryPick(categoryId, categoriesRef.current)
      : categoryId
    try {
      setLoadingSubcategories(true)
      const response = await SubcategoriesService.getSubcategories({
        categoryId: resolvedCategoryId,
        is_active: true,
      })
      const raw = response?.data
      const list = raw?.subcategories ?? (Array.isArray(raw) ? raw : [])
      const normalized = list
        .map((sub: any) => ({
          ...sub,
          id: String(sub.id ?? sub._id ?? '').toLowerCase(),
          name: sub.name ?? sub.displayName ?? sub.title ?? '',
        }))
        .filter((sub: any) => sub.id && sub.name)
      setSubcategories(normalized)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      appToast('Failed to load subcategories', 'error')
    } finally {
      setLoadingSubcategories(false)
    }
  }

  useEffect(() => {
    fetchSubcategoriesForCategory(formData.category)
  }, [formData.category])

  const handleCreateSubcategory = async () => {
    const name = newSubcategoryName.trim()
    if (!name) {
      appToast('Enter a subcategory name', 'error')
      return
    }
    if (!formData.category) {
      appToast('Select a category first', 'error')
      return
    }
    const parentCategory = categories.find((c) => getCategoryId(c) === formData.category)
    try {
      setCreatingSubcategory(true)
      const response = await SubcategoriesService.createSubcategory(
        {
          name,
          category_id: formData.category,
          service_intent: 'repair',
          is_active: true,
        },
        { showSuccessToast: false, showLoading: false }
      )
      const raw = response?.data
      const created = (raw && typeof raw === 'object' && ('name' in raw || 'id' in raw))
        ? raw
        : (raw as any)?.subcategory ?? (raw as any)?.data
      const newId = created ? String(created.id ?? (created as any)._id ?? '').toLowerCase() : ''
      if (newId) {
        setSubcategories((prev) => [...prev, { ...created, id: newId, name: created.name ?? name }])
        handleInputChange('subcategory', newId)
        setNewSubcategoryName('')
        appToast(`Subcategory "${name}" created under ${parentCategory?.name ?? 'category'}`, 'success')
      } else {
        await fetchSubcategoriesForCategory(formData.category)
        appToast('Subcategory created', 'success')
      }
    } catch (error: any) {
      console.error('Error creating subcategory:', error)
      appToast(error?.message ?? 'Failed to create subcategory', 'error')
    } finally {
      setCreatingSubcategory(false)
    }
  }


  const publishDisabled =
    loading ||
    !formData.name?.trim() ||
    !formData.category?.trim() ||
    (Boolean(formData.category?.trim()) &&
      !loadingSubcategories &&
      subcategories.length > 0 &&
      !formData.subcategory?.trim()) ||
    !richTextHasPlainText(formData.description)

  const draftDisabled = loading || !formData.name?.trim()

  const selectedCategoryLabel = useMemo(() => {
    const c = categories.find((x) => getCategoryId(x) === formData.category)
    return (c?.name ?? '').trim() || formData.category || '—'
  }, [categories, formData.category])

  const selectedSubcategoryLabel = useMemo(() => {
    const s = subcategories.find(
      (x) => String(x.id ?? (x as { _id?: string })._id ?? '').toLowerCase() === formData.subcategory,
    )
    return (s?.name ?? '').trim() || formData.subcategory || '—'
  }, [subcategories, formData.subcategory])

  const priceReviewLabel = useMemo(() => {
    if (formData.service_type === 'hourly') return `Hourly · ₹${formData.hourly_rate || '—'}`
    if (formData.service_type === 'consultation') return `Consultation · ₹${formData.consultation_fee || '—'}`
    return `Fixed · ₹${formData.base_price || '—'}`
  }, [formData.service_type, formData.hourly_rate, formData.consultation_fee, formData.base_price])

  const hasPrimaryImage = Boolean(formData.images?.some((img) => Boolean(img.url)))

  const primaryImageUrl = useMemo(() => {
    const primary = formData.images.find((img) => img.isPrimary) || formData.images[0]
    return primary?.url?.trim() || undefined
  }, [formData.images])

  const previewCardPrice = useMemo(() => {
    if (formData.service_type === 'hourly') return formData.hourly_rate
    if (formData.service_type === 'consultation') return formData.consultation_fee
    return formData.base_price
  }, [
    formData.service_type,
    formData.hourly_rate,
    formData.consultation_fee,
    formData.base_price,
  ])

  return (
    <div className="p-4 md:p-6">
      {/* Loading indicator for edit mode */}
      {loadingService && (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm">Loading service data...</p>
          </div>
        </div>
      )}
      
      {!loadingService && (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/platform-services')}
                className="bg-muted hover:bg-muted/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="mb-0.5 text-2xl font-semibold">
                  {isEditMode ? 'Edit Service' : 'Create New Service'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? 'Update service details and settings' : 'Add a new service to your platform'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Button
                variant="outline"
                leftIcon={<Eye className="h-4 w-4" />}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              <Button
                variant="outline"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={() => void handleSubmit('draft')}
                disabled={draftDisabled}
              >
                Save as Draft
              </Button>
              <Button
                loading={loading}
                leftIcon={!loading ? <Save className="h-4 w-4" /> : undefined}
                onClick={() => void handleSubmit('publish')}
                disabled={publishDisabled}
              >
                {loading
                  ? isEditMode
                    ? 'Saving…'
                    : 'Publishing…'
                  : isEditMode
                    ? 'Update & publish'
                    : 'Publish service'}
              </Button>
            </div>
          </div>

          <Card className="mb-4 border-border/80 bg-muted/30">
            <CardContent className="space-y-3 py-4">
              <p className="text-sm font-semibold text-foreground">Review before publish</p>
              <p className="text-xs text-muted-foreground">
                Draft saves need only a name. Publishing requires category, description, and subcategory when your
                category defines them.
              </p>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service</p>
                  <p className="font-medium text-foreground">{formData.name.trim() || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">{selectedCategoryLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subcategory</p>
                  <p className="font-medium text-foreground">{selectedSubcategoryLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing</p>
                  <p className="font-medium capitalize text-foreground">
                    {formData.service_type.replace(/_/g, ' ')} · {priceReviewLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Flags</p>
                  <p className="text-foreground">
                    {formData.is_featured ? 'Featured · ' : ''}
                    {formData.is_popular ? 'Popular · ' : ''}
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hero image</p>
                  <p className="font-medium text-foreground">{hasPrimaryImage ? 'Set' : 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Main Form with Tabs */}
      <Card className="overflow-hidden rounded-lg border shadow-sm">
        <div className="overflow-x-auto border-b">
          <Tabs
            value={String(activeTab)}
            onValueChange={(v) => setActiveTab(Number(v))}
            className="w-full"
          >
            <TabsList className="h-auto min-h-[4rem] w-full flex-wrap justify-start gap-0 rounded-none border-0 bg-transparent p-1">
              <TabsTrigger value="0" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Info className="h-4 w-4 shrink-0" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="1" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <IndianRupee className="h-4 w-4 shrink-0" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="2" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Calendar className="h-4 w-4 shrink-0" />
                Availability
              </TabsTrigger>
              <TabsTrigger value="3" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Star className="h-4 w-4 shrink-0" />
                Features & Requirements
              </TabsTrigger>
              <TabsTrigger value="4" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Layers className="h-4 w-4 shrink-0" />
                <span className="flex items-center gap-1.5">
                  Packages & Add-ons
                  {/* Surface missing-image issues on the tab itself so users don't
                      have to open the tab to discover the validation block. */}
                  {formData.product_options.some((p: any) => !p?.image) ? (
                    <span
                      aria-label="One or more packages are missing images"
                      className="inline-flex h-2 w-2 rounded-full bg-destructive"
                    />
                  ) : null}
                </span>
              </TabsTrigger>
              <TabsTrigger value="5" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <MapPin className="h-4 w-4 shrink-0" />
                Service Areas
              </TabsTrigger>
              <TabsTrigger value="6" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <ListOrdered className="h-4 w-4 shrink-0" />
                Our Process
              </TabsTrigger>
              <TabsTrigger value="7" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <CircleCheck className="h-4 w-4 shrink-0" />
                Include & Exclude
              </TabsTrigger>
              <TabsTrigger value="8" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Lightbulb className="h-4 w-4 shrink-0" />
                Notes & Promises
              </TabsTrigger>
              <TabsTrigger value="9" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <CircleHelp className="h-4 w-4 shrink-0" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="10" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <Search className="h-4 w-4 shrink-0" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="11" className="gap-2 data-[state=active]:bg-muted sm:min-h-16">
                <MessageSquare className="h-4 w-4 shrink-0" />
                Reviews
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Basic Information Tab — Mandatory fields first, then optional (pre-filled) */}
          {activeTab === 0 && (
            <div>
              <p className="mb-6 text-sm text-muted-foreground">
                Complete name, category, description, and subcategory when your category has sub-types. Other fields
                have sensible defaults you can adjust later.
              </p>

              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-6">
                <p className="mb-4 flex items-center gap-2 text-base font-bold">
                  <Badge>Required</Badge>
                  Basic info
                </p>
                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input
                      id="service-name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Switch & Socket Repair"
                      disabled={previewMode}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Clear name customers will see</p>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category || undefined}
                        onValueChange={(v) => {
                          handleInputChange('category', v)
                          handleInputChange('subcategory', '')
                        }}
                        disabled={previewMode || loadingCategories}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              loadingCategories
                                ? 'Loading...'
                                : categories.length === 0
                                  ? 'No categories'
                                  : 'Select category'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={getCategoryId(cat)} value={getCategoryId(cat)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>
                        Subcategory
                        {formData.category && !loadingSubcategories && subcategories.length === 0 ? (
                          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                        ) : null}
                      </Label>
                      <Select
                        value={formData.subcategory || undefined}
                        onValueChange={(v) => handleInputChange('subcategory', v)}
                        disabled={previewMode || !formData.category || loadingSubcategories}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              loadingSubcategories
                                ? 'Loading...'
                                : formData.category
                                  ? 'Select subcategory'
                                  : 'Select category first'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((sub) => (
                            <SelectItem key={getCategoryId(sub)} value={getCategoryId(sub)}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.category && (
                    <div className="rounded-md border bg-background p-3">
                      <p className="mb-2 block text-xs text-muted-foreground">Need a new subcategory?</p>
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-[140px] flex-1 space-y-2">
                          <Label htmlFor="new-subcat">New subcategory name</Label>
                          <Input
                            id="new-subcat"
                            placeholder="e.g. Socket, Switch"
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && (e.preventDefault(), handleCreateSubcategory())
                            }
                            disabled={creatingSubcategory || previewMode}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={creatingSubcategory}
                          leftIcon={!creatingSubcategory ? <Plus className="h-4 w-4" /> : undefined}
                          onClick={handleCreateSubcategory}
                          disabled={creatingSubcategory || !newSubcategoryName.trim() || previewMode}
                          className="shrink-0"
                        >
                          {creatingSubcategory ? 'Creating…' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <RichTextField
                    label="Description"
                    value={formData.description}
                    onChange={(value) => handleInputChange('description', value)}
                    placeholder="Describe what the service includes and what customers can expect. You can use formatting and lists."
                    required
                    disabled={previewMode}
                    height={200}
                    helperText="Required. Detailed description helps customers and SEO."
                  />
                </div>
              </div>

              <div className="mb-6 rounded-lg border bg-card p-6">
                <p className="mb-1 flex items-center gap-2 text-base font-bold">
                  <Upload className="h-5 w-5 text-primary" />
                  Service Images
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Primary image powers the customer app service card (Home, Services, search). Use the live
                  preview to check crop before publishing.
                </p>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <ImageUploadField
                      label="Upload Service Images"
                      value={formData.images}
                      onChange={(images) => handleInputChange('images', images)}
                      maxFiles={SERVICE_CARD_IMAGE_SPEC.maxGalleryImages}
                      maxSize={SERVICE_CARD_IMAGE_SPEC.maxUploadMb}
                      disabled={previewMode}
                      allowPrimary
                      showPreview
                      folder="platform-services"
                      helperText={`Up to ${SERVICE_CARD_IMAGE_SPEC.maxGalleryImages} images · ${SERVICE_CARD_IMAGE_SPEC.recommendedWidth}×${SERVICE_CARD_IMAGE_SPEC.recommendedHeight}px (${SERVICE_CARD_IMAGE_SPEC.aspectLabel}) · max ${SERVICE_CARD_IMAGE_SPEC.maxUploadMb}MB · first = card hero`}
                      error={formData.images.length === 0 ? 'Add at least one image for a better listing' : undefined}
                    />
                    <ServiceImageGuidancePanel />
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <MobileServiceCardPreview
                      imageUrl={primaryImageUrl}
                      name={formData.name.trim() || 'Service name'}
                      description={formData.short_description?.trim()}
                      price={previewCardPrice}
                      originalPrice={formData.original_price}
                      popular={formData.is_popular}
                      emergency={formData.emergency_service}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-lg border bg-card p-6">
                <p className="mb-4 block text-sm font-medium text-muted-foreground">Visibility</p>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(v) => handleInputChange('is_featured', v)}
                      disabled={previewMode}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_popular}
                      onCheckedChange={(v) => handleInputChange('is_popular', v)}
                      disabled={previewMode}
                    />
                    <Label>Popular</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => handleInputChange('is_active', v)}
                      disabled={previewMode}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <p className="mt-2 block text-xs text-muted-foreground">
                  Featured services appear in highlighted sections; popular in &quot;Popular&quot; listings. Inactive
                  services are hidden from customers.
                </p>
              </div>

              <Accordion type="single" collapsible className="rounded-md border">
                <AccordionItem value="optional-details" className="border-0 px-4">
                  <AccordionTrigger className="py-3 text-left text-sm font-medium text-muted-foreground no-underline hover:no-underline">
                    Optional details (pre-filled with defaults — edit if needed)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4 pb-4">
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug (optional)</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => handleInputChange('slug', e.target.value)}
                          placeholder="Auto-generated from name"
                          disabled={previewMode}
                          className="w-full font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to auto-generate from service name</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Service Provider (optional)</Label>
                        <Select
                          value={formData.provider_id || 'platform'}
                          onValueChange={(v) => handleInputChange('provider_id', v === 'platform' ? '' : v)}
                          disabled={previewMode || loadingProviders}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Platform managed" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="platform">Platform managed</SelectItem>
                            {providers?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.business_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex-1 space-y-2">
                          <Label>Service type</Label>
                          <Select
                            value={formData.service_type}
                            onValueChange={(v) =>
                              handleInputChange('service_type', v as 'fixed' | 'hourly' | 'consultation')
                            }
                            disabled={previewMode}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICE_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="duration-field">Duration</Label>
                          <Input
                            id="duration-field"
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            placeholder="e.g. 60 mins"
                            disabled={previewMode}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Featured, Popular and Active toggles are in Basic Info above.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 1 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Pricing Configuration</h2>

              <div className="flex flex-col gap-6">
                {formData.service_type === 'fixed' && (() => {
                  const basePriceNum = parseFloat(String(formData.base_price ?? '')) || 0
                  const mrpNum = parseFloat(String(formData.original_price ?? '')) || 0
                  const hasMrp = mrpNum > 0
                  const mrpBelowBase = hasMrp && mrpNum < basePriceNum
                  const savings = hasMrp && !mrpBelowBase ? Math.round(mrpNum - basePriceNum) : 0
                  const pct =
                    hasMrp && !mrpBelowBase && mrpNum > 0
                      ? Math.round((savings / mrpNum) * 100)
                      : 0
                  return (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="base-price">Offer Price (₹) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            ₹
                          </span>
                          <Input
                            id="base-price"
                            type="number"
                            value={formData.base_price}
                            onChange={(e) => handleInputChange('base_price', e.target.value)}
                            placeholder="299"
                            disabled={previewMode}
                            className="w-full pl-8"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          What the customer actually pays. Shown big &amp; bold on the booking card.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mrp">
                          Original Price / MRP (₹){' '}
                          <span className="text-xs font-normal text-muted-foreground">— optional</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            ₹
                          </span>
                          <Input
                            id="mrp"
                            type="number"
                            value={formData.original_price}
                            onChange={(e) => handleInputChange('original_price', e.target.value)}
                            placeholder="e.g. 499"
                            disabled={previewMode}
                            className={cn(
                              'w-full pl-8',
                              mrpBelowBase &&
                                'border-destructive focus-visible:ring-destructive',
                            )}
                          />
                        </div>
                        {mrpBelowBase ? (
                          <p className="text-xs font-medium text-destructive">
                            MRP must be greater than or equal to the offer price.
                          </p>
                        ) : pct > 0 ? (
                          <p className="text-xs font-medium text-success-700">
                            Customers see <span className="font-bold">{pct}% OFF</span> · they
                            save <span className="font-bold">₹{savings.toLocaleString()}</span>.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Set a higher list price to show a strike-through discount badge.
                            Industry data: anchored pricing lifts add-to-cart by 15–25%.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {formData.service_type === 'hourly' && (
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="hourly">Hourly Rate (₹) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="hourly"
                          type="number"
                          value={formData.hourly_rate}
                          onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                          placeholder="199"
                          disabled={previewMode}
                          className="w-full pl-8"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="min-h">Minimum Hours</Label>
                      <Input
                        id="min-h"
                        type="number"
                        value={formData.min_hours}
                        onChange={(e) => handleInputChange('min_hours', e.target.value)}
                        placeholder="2"
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="max-h">Maximum Hours</Label>
                      <Input
                        id="max-h"
                        type="number"
                        value={formData.max_hours}
                        onChange={(e) => handleInputChange('max_hours', e.target.value)}
                        placeholder="8"
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {formData.service_type === 'consultation' && (
                  <div className="space-y-2">
                    <Label htmlFor="consult">Consultation Fee (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="consult"
                        type="number"
                        value={formData.consultation_fee}
                        onChange={(e) => handleInputChange('consultation_fee', e.target.value)}
                        placeholder="999"
                        disabled={previewMode}
                        className="w-full pl-8"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="gst">GST (%)</Label>
                    <Input
                      id="gst"
                      type="number"
                      value={formData.gst_percentage}
                      onChange={(e) =>
                        handleInputChange('gst_percentage', parseFloat(e.target.value) || 0)
                      }
                      disabled={previewMode}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-2 pb-2">
                    <Switch
                      checked={formData.tax_included}
                      onCheckedChange={(v) => handleInputChange('tax_included', v)}
                      disabled={previewMode}
                    />
                    <Label>Tax included in price</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 2 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Service Availability</h2>

              <div className="flex flex-col gap-6">
                <div>
                  <p className="mb-3 text-sm font-semibold">Working Days</p>
                  <div className="flex flex-wrap gap-4">
                    {WORKING_DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={formData.working_days.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleArrayChange('working_days', [...formData.working_days, day])
                            } else {
                              handleArrayChange(
                                'working_days',
                                formData.working_days.filter((d) => d !== day),
                              )
                            }
                          }}
                          disabled={previewMode}
                        />
                        <Label htmlFor={`day-${day}`} className="font-normal">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">Available Time Slots</p>
                  <div className="flex flex-col gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <div key={slot.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`slot-${slot.value}`}
                          checked={formData.time_slots.includes(slot.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleArrayChange('time_slots', [...formData.time_slots, slot.value])
                            } else {
                              handleArrayChange(
                                'time_slots',
                                formData.time_slots.filter((s) => s !== slot.value),
                              )
                            }
                          }}
                          disabled={previewMode}
                        />
                        <Label htmlFor={`slot-${slot.value}`} className="font-normal">
                          {slot.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="adv-hours">Advance Booking (hours)</Label>
                    <Input
                      id="adv-hours"
                      type="number"
                      value={formData.advance_booking_hours}
                      onChange={(e) =>
                        handleInputChange('advance_booking_hours', parseInt(e.target.value, 10) || 0)
                      }
                      disabled={previewMode}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="em-charge">Emergency Charge (₹)</Label>
                    <Input
                      id="em-charge"
                      type="number"
                      value={formData.emergency_charge}
                      onChange={(e) => handleInputChange('emergency_charge', e.target.value)}
                      placeholder="200"
                      disabled={previewMode}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.same_day_booking}
                      onCheckedChange={(v) => handleInputChange('same_day_booking', v)}
                      disabled={previewMode}
                    />
                    <Label>Allow Same-day Booking</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.emergency_service}
                      onCheckedChange={(v) => handleInputChange('emergency_service', v)}
                      disabled={previewMode}
                    />
                    <Label>Emergency Service Available</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features & Requirements Tab */}
          {activeTab === 3 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Features & Requirements</h2>

              <div className="flex flex-col gap-8">
                <div>
                  <p className="mb-3 text-sm font-semibold">Service Features</p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="inline-flex items-center gap-1 border-primary/40 py-1 pl-2 pr-1"
                      >
                        {feature}
                        {!previewMode && (
                          <button
                            type="button"
                            className="rounded p-0.5 hover:bg-muted"
                            onClick={() => removeFeature(feature)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Switch replacement"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                      disabled={previewMode}
                      className="max-w-md flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                      disabled={previewMode || !newFeature.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">Customer Requirements</p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {formData.requirements.map((requirement, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="inline-flex items-center gap-1 border-muted py-1 pl-2 pr-1"
                      >
                        {requirement}
                        {!previewMode && (
                          <button
                            type="button"
                            className="rounded p-0.5 hover:bg-muted"
                            onClick={() => removeRequirement(requirement)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Clear workspace"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRequirement()}
                      disabled={previewMode}
                      className="max-w-md flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addRequirement}
                      disabled={previewMode || !newRequirement.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Packages & Add-ons Tab */}
          {activeTab === 4 && (
            <>
              <div>
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Choose a package</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Each package becomes a tile in the customer&apos;s &ldquo;Choose a package&rdquo; scroller
                      (Urban Company / UC Procare pattern). Image is <span className="font-medium text-foreground">required</span> —
                      it&apos;s the first thing customers see before reading the name or price.
                    </p>
                  </div>
                  <Badge variant="outline" className="self-start gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700">
                    <ImageIcon className="h-3 w-3" />
                    Image is mandatory
                  </Badge>
                </div>

                <div className="flex flex-col gap-4">
                  {formData.product_options.map((product, index) => {
                    const errKey = String(index)
                    const imgError = packageImageErrors[errKey]
                    const isUploading = packageImageUploadIndex === index
                    const hasImage = Boolean(product.image)
                    return (
                      <Card
                        key={index}
                        className={cn(
                          'border p-4 transition',
                          imgError && 'border-destructive/50 bg-destructive/5',
                        )}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                              {index + 1}
                            </span>
                            <p className="font-semibold">{product.name || `Package ${index + 1}`}</p>
                            {!hasImage ? (
                              <Badge variant="outline" className="gap-1 border-destructive/40 bg-destructive/10 text-[10px] text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                Missing image
                              </Badge>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeProduct(index)}
                            disabled={previewMode}
                            aria-label={`Remove package ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                          {/* Image column — square thumbnail, matches the customer scroller's aspect ratio */}
                          <PackagePhotoSlot
                            target={index}
                            url={product.image || ''}
                            uploading={isUploading}
                            error={imgError}
                            disabled={previewMode}
                            onUpload={(f) => void uploadPackageImage(index, f)}
                            onPickFromLibrary={(asset) => setPackageImageFromLibrary(index, asset)}
                            onClear={() => clearPackageImage(index)}
                          />

                          {/* Field column */}
                          <div className="grid gap-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Package name<span className="ml-1 text-destructive">*</span>
                                </Label>
                                <Input
                                  value={product.name}
                                  onChange={(e) => updateProductOption(index, 'name', e.target.value)}
                                  disabled={previewMode}
                                  placeholder="e.g. Deep clean — split AC"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Price (₹)<span className="ml-1 text-destructive">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  value={product.price}
                                  onChange={(e) => updateProductOption(index, 'price', e.target.value)}
                                  disabled={previewMode}
                                  placeholder="899"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Brand</Label>
                                <Input
                                  value={product.brand}
                                  onChange={(e) => updateProductOption(index, 'brand', e.target.value)}
                                  disabled={previewMode}
                                  placeholder="optional"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Warranty</Label>
                                <Input
                                  value={product.warranty}
                                  onChange={(e) => updateProductOption(index, 'warranty', e.target.value)}
                                  disabled={previewMode}
                                  placeholder="e.g. 30-day service warranty"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                Description
                              </Label>
                              <Textarea
                                value={product.description}
                                onChange={(e) => updateProductOption(index, 'description', e.target.value)}
                                disabled={previewMode}
                                rows={2}
                                placeholder="One-line value prop — “High-pressure jet spray, anti-bacterial wash, foam clean”"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}

                  {/* Add package — empty state-ish form */}
                  <Card className="border-2 border-dashed border-primary/30 bg-primary/[0.03] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Add a package</p>
                      <span className="text-xs text-muted-foreground">
                        — image, name and price are required
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                      <PackagePhotoSlot
                        target="new"
                        url={newProduct.image}
                        uploading={packageImageUploadIndex === 'new'}
                        error={packageImageErrors.new}
                        disabled={previewMode}
                        onUpload={(f) => void uploadPackageImage('new', f)}
                        onPickFromLibrary={(asset) => setPackageImageFromLibrary('new', asset)}
                        onClear={() => clearPackageImage('new')}
                      />
                      <div className="grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="np-name" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Package name<span className="ml-1 text-destructive">*</span>
                            </Label>
                            <Input
                              id="np-name"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                              disabled={previewMode}
                              placeholder="e.g. Standard service"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="np-price" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Price (₹)<span className="ml-1 text-destructive">*</span>
                            </Label>
                            <Input
                              id="np-price"
                              type="number"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                              disabled={previewMode}
                              placeholder="499"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="np-brand" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Brand
                            </Label>
                            <Input
                              id="np-brand"
                              value={newProduct.brand}
                              onChange={(e) => setNewProduct((prev) => ({ ...prev, brand: e.target.value }))}
                              disabled={previewMode}
                              placeholder="optional"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="np-warranty" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Warranty
                            </Label>
                            <Input
                              id="np-warranty"
                              value={newProduct.warranty}
                              onChange={(e) => setNewProduct((prev) => ({ ...prev, warranty: e.target.value }))}
                              disabled={previewMode}
                              placeholder="optional"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="np-desc" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Description
                          </Label>
                          <Textarea
                            id="np-desc"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                            disabled={previewMode}
                            rows={2}
                            placeholder="One-liner shown under the package title"
                          />
                        </div>
                        <div>
                          <Button
                            variant="default"
                            onClick={addProduct}
                            disabled={previewMode || !newProduct.name.trim() || !newProduct.image.trim() || packageImageUploadIndex === 'new'}
                            leftIcon={<Plus className="h-4 w-4" />}
                          >
                            Add package
                          </Button>
                          {!newProduct.image && newProduct.name ? (
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              Upload a package image to enable &ldquo;Add package&rdquo;.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="mt-10 border-t pt-8">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <Package className="h-5 w-5" />
                  Associated catalog products
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Link parts or materials customers can buy with this service. Set how each
                  product appears at checkout and drag order with the arrows (top = shown first).
                </p>

                <Card className="mb-6 border-2 border-dashed p-4">
                  <p className="mb-3 text-sm font-semibold">Add product from catalog</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label>Product</Label>
                      {loadingProducts ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading products...
                        </div>
                      ) : (
                        <Select
                          value={productToLink || undefined}
                          onValueChange={setProductToLink}
                          disabled={previewMode || availableCatalogProducts.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                products.length === 0
                                  ? 'No products in catalog'
                                  : availableCatalogProducts.length === 0
                                    ? 'All products already linked'
                                    : 'Choose a product…'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCatalogProducts.map((product) => (
                              <SelectItem key={product.id} value={String(product.id)}>
                                {product.name}
                                {product.price != null ? ` — ₹${product.price}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={addLinkedProduct}
                      disabled={previewMode || !productToLink}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Link product
                    </Button>
                  </div>
                </Card>

                {sortedProductLinks.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {sortedProductLinks.map((link, index) => {
                      const catalogProduct = products.find((p) => String(p.id) === link.product_id)
                      const relationMeta = PRODUCT_RELATION_TYPES.find(
                        (t) => t.value === link.relation_type,
                      )
                      return (
                        <Card key={link.product_id} className="border p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                  <p className="truncate font-semibold">
                                    {catalogProduct?.name ?? link.product_id}
                                  </p>
                                  {catalogProduct?.price != null && (
                                    <Badge variant="outline">₹{catalogProduct.price}</Badge>
                                  )}
                                </div>
                                {relationMeta && (
                                  <p className="text-xs text-muted-foreground">{relationMeta.hint}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-end gap-3">
                              <div className="w-full min-w-[10rem] space-y-2 sm:w-44">
                                <Label>Relation at checkout</Label>
                                <Select
                                  value={link.relation_type}
                                  onValueChange={(v) =>
                                    updateLinkedProductRelation(
                                      link.product_id,
                                      v as ProductRelationType,
                                    )
                                  }
                                  disabled={previewMode}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PRODUCT_RELATION_TYPES.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => moveLinkedProduct(link.product_id, 'up')}
                                      disabled={previewMode || index === 0}
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Move up (shown earlier)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => moveLinkedProduct(link.product_id, 'down')}
                                      disabled={
                                        previewMode || index === sortedProductLinks.length - 1
                                      }
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Move down (shown later)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9 text-destructive hover:text-destructive"
                                      onClick={() => removeLinkedProduct(link.product_id)}
                                      disabled={previewMode}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove link</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No catalog products linked yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add products customers can purchase alongside this service
                    </p>
                  </div>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {PRODUCT_RELATION_TYPES.map((opt) => (
                    <div
                      key={opt.value}
                      className="rounded-md border bg-muted/30 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-muted-foreground"> — {opt.hint}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 border-t pt-8">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <Puzzle className="h-5 w-5" />
                  Add-ons (optional)
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Optional extras customers can select in the service modal.
                </p>
                <div className="flex flex-col gap-4">
                  {formData.service_addons.map((addon, index) => (
                    <Card key={`addon-${index}`} className="border p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <p className="font-semibold">{addon.name || `Add-on ${index + 1}`}</p>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeAddon(index)} disabled={previewMode}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex-1 space-y-2">
                          <Label>Name</Label>
                          <Input value={addon.name} onChange={(e) => updateAddon(index, 'name', e.target.value)} disabled={previewMode} />
                        </div>
                        <div className="w-32 space-y-2">
                          <Label>Price (₹)</Label>
                          <Input type="number" value={addon.price} onChange={(e) => updateAddon(index, 'price', e.target.value)} disabled={previewMode} />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label>Description</Label>
                        <Textarea value={addon.description} onChange={(e) => updateAddon(index, 'description', e.target.value)} disabled={previewMode} rows={2} />
                      </div>
                    </Card>
                  ))}
                  <Card className="border-2 border-dashed p-4">
                    <p className="mb-3 text-sm font-semibold">Add add-on</p>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Name</Label>
                        <Input value={newAddon.name} onChange={(e) => setNewAddon((p) => ({ ...p, name: e.target.value }))} disabled={previewMode} placeholder="e.g. Deep cleaning" />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Price (₹)</Label>
                        <Input type="number" value={newAddon.price} onChange={(e) => setNewAddon((p) => ({ ...p, price: e.target.value }))} disabled={previewMode} />
                      </div>
                      <Button variant="outline" onClick={addAddon} disabled={previewMode || !newAddon.name.trim()} leftIcon={<Plus className="h-4 w-4" />}>Add</Button>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Label>Description</Label>
                      <Textarea value={newAddon.description} onChange={(e) => setNewAddon((p) => ({ ...p, description: e.target.value }))} disabled={previewMode} rows={2} />
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* Service Areas Tab */}
          {activeTab === 5 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold">Service Areas</h2>

              <div className="flex flex-col gap-6">
                {formData.service_areas.map((area, index) => (
                  <Card key={index} className="bg-muted/40 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{area.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Base price multiplier: {area.multiplier}x
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={area.active ? 'default' : 'secondary'}>
                          {area.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeServiceArea(index)}
                          disabled={previewMode}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <Card className="border-2 border-dashed p-4">
                  <p className="mb-4 text-sm font-semibold">Add New Service Area</p>
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="sa-name">Area Name</Label>
                      <Input
                        id="sa-name"
                        value={newServiceArea.name}
                        onChange={(e) => setNewServiceArea((prev) => ({ ...prev, name: e.target.value }))}
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="sa-mult">Price Multiplier</Label>
                      <Input
                        id="sa-mult"
                        type="number"
                        value={newServiceArea.multiplier}
                        onChange={(e) =>
                          setNewServiceArea((prev) => ({
                            ...prev,
                            multiplier: parseFloat(e.target.value) || 1.0,
                          }))
                        }
                        disabled={previewMode}
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-1 items-center gap-2 pb-2">
                      <Switch
                        checked={newServiceArea.active}
                        onCheckedChange={(v) => setNewServiceArea((prev) => ({ ...prev, active: v }))}
                        disabled={previewMode}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={addServiceArea}
                    disabled={previewMode || !newServiceArea.name.trim()}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Service Area
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* Our Process Tab */}
          {activeTab === 6 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <ListOrdered className="h-6 w-6 text-primary" />
                  Our Process
                </h2>
                <p className="text-sm text-muted-foreground">
                  Define the step-by-step process customers can expect. This builds trust and sets clear expectations.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {formData.our_process.length > 0 ? (
                  formData.our_process.map((step, index) => (
                    <Card
                      key={index}
                      className="relative overflow-visible border-2 border-primary/30 bg-gradient-to-br from-cloud to-fog p-6 shadow-sm"
                    >
                      <div className="absolute -top-4 left-5 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-md">
                        {step.step}
                      </div>

                      <div className="mt-4">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-primary">{step.title}</h3>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-background"
                                  onClick={() => moveProcessStep(index, 'up')}
                                  disabled={previewMode || index === 0}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move up</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-background"
                                  onClick={() => moveProcessStep(index, 'down')}
                                  disabled={previewMode || index === formData.our_process.length - 1}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move down</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-background text-destructive hover:text-destructive"
                                  onClick={() => removeProcessStep(index)}
                                  disabled={previewMode}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove step</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{step.description}</p>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-10 text-center">
                    <ListOrdered className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="mb-1 font-medium text-muted-foreground">No process steps added yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add step-by-step instructions to help customers understand your workflow
                    </p>
                  </div>
                )}

                <Card className="border-2 border-dashed border-primary/40 bg-primary/5 p-6">
                  <p className="mb-4 flex items-center gap-2 text-base font-bold">
                    <Plus className="h-5 w-5 text-primary" />
                    Add New Process Step
                  </p>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="step-title">Step Title</Label>
                      <Input
                        id="step-title"
                        value={newProcessStep.title}
                        onChange={(e) => setNewProcessStep((prev) => ({ ...prev, title: e.target.value }))}
                        disabled={previewMode}
                        placeholder="e.g., Schedule Appointment"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="step-desc">Step Description</Label>
                      <Textarea
                        id="step-desc"
                        rows={3}
                        value={newProcessStep.description}
                        onChange={(e) => setNewProcessStep((prev) => ({ ...prev, description: e.target.value }))}
                        disabled={previewMode}
                        placeholder="Describe what happens in this step..."
                        className="bg-background"
                      />
                    </div>
                    <Button
                      onClick={addProcessStep}
                      disabled={
                        previewMode || !newProcessStep.title.trim() || !newProcessStep.description.trim()
                      }
                      leftIcon={<Plus className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      Add Process Step
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Include & Exclude Tab */}
          {activeTab === 7 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <CircleCheck className="h-6 w-6 text-storm-deep" />
                  What&apos;s Included & Excluded
                </h2>
                <p className="text-sm text-muted-foreground">
                  Clearly define what is and isn&apos;t included in your service to avoid misunderstandings.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex h-full flex-col overflow-hidden border-2 border-storm-deep/40">
                  <div className="flex items-center gap-2 bg-storm-deep p-4 text-white">
                    <CircleCheck className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">What&apos;s Included</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.whats_included.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[200px]">
                      {formData.whats_included.length > 0 ? (
                        <div className="space-y-2">
                          {formData.whats_included.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 rounded-md bg-storm-mist/30 p-3 dark:bg-storm-deep/30"
                            >
                              <CircleCheck className="h-4 w-4 shrink-0 text-storm-deep" />
                              <p className="flex-1 text-sm">{item}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeIncluded(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <p className="text-sm text-muted-foreground">No items added yet</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., All materials and labor"
                        value={newIncluded}
                        onChange={(e) => setNewIncluded(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addIncluded()}
                        disabled={previewMode}
                        className="flex-1"
                      />
                      <Button
                        className="bg-storm-deep hover:bg-storm-deep"
                        onClick={addIncluded}
                        disabled={previewMode || !newIncluded.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex h-full flex-col overflow-hidden border-2 border-destructive/40">
                  <div className="flex items-center gap-2 bg-destructive p-4 text-white">
                    <CircleX className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">What&apos;s Excluded</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.whats_excluded.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[200px]">
                      {formData.whats_excluded.length > 0 ? (
                        <div className="space-y-2">
                          {formData.whats_excluded.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 dark:bg-destructive/30"
                            >
                              <CircleX className="h-4 w-4 shrink-0 text-destructive" />
                              <p className="flex-1 text-sm">{item}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeExcluded(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <p className="text-sm text-muted-foreground">No items added yet</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Structural repairs"
                        value={newExcluded}
                        onChange={(e) => setNewExcluded(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addExcluded()}
                        disabled={previewMode}
                        className="flex-1"
                      />
                      <Button
                        variant="destructive"
                        onClick={addExcluded}
                        disabled={previewMode || !newExcluded.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Notes & Promises Tab */}
          {activeTab === 8 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <Lightbulb className="h-6 w-6 text-bloom-coral" />
                  Important Notes & Our Promises
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add important notes and service commitments to build customer confidence.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex h-full flex-col overflow-hidden border-2 border-bloom-coral/40">
                  <div className="flex items-center gap-2 bg-bloom-coral p-4 text-white">
                    <Lightbulb className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">Please Note</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.please_note.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[250px]">
                      {formData.please_note.length > 0 ? (
                        <div className="space-y-3">
                          {formData.please_note.map((note, index) => (
                            <div
                              key={index}
                              className="flex gap-2 rounded-md border-l-4 border-bloom-coral bg-bloom-rose p-3 dark:bg-bloom-coral/20"
                            >
                              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-bloom-coral" />
                              <p className="flex-1 text-sm leading-relaxed">{note}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => removeNote(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <Lightbulb className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No notes added yet</p>
                          <p className="text-xs text-muted-foreground">
                            Add important information customers should know
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="e.g., 24-hour advance booking required"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        disabled={previewMode}
                        rows={2}
                        className="min-w-0 flex-1"
                      />
                      <Button
                        className="min-w-14 bg-bloom-coral hover:bg-bloom-coral"
                        onClick={addNote}
                        disabled={previewMode || !newNote.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex h-full flex-col overflow-hidden border-2 border-primary/40">
                  <div className="flex items-center gap-2 bg-primary p-4 text-white">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="flex-1 text-lg font-bold">Our Promises</span>
                    <Badge variant="secondary" className="bg-white/30 text-white hover:bg-white/40">
                      {formData.our_promises.length}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-4 min-h-[250px]">
                      {formData.our_promises.length > 0 ? (
                        <div className="space-y-3">
                          {formData.our_promises.map((promise, index) => (
                            <div
                              key={index}
                              className="flex gap-2 rounded-md border-l-4 border-primary bg-primary-soft p-3 dark:bg-primary/20"
                            >
                              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <p className="flex-1 text-sm font-medium leading-relaxed">{promise}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => removePromise(index)}
                                disabled={previewMode}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                          <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No promises added yet</p>
                          <p className="text-xs text-muted-foreground">Build trust with service commitments</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="e.g., 100% Satisfaction Guaranteed"
                        value={newPromise}
                        onChange={(e) => setNewPromise(e.target.value)}
                        disabled={previewMode}
                        rows={2}
                        className="min-w-0 flex-1"
                      />
                      <Button
                        className="min-w-14 bg-primary hover:bg-primary"
                        onClick={addPromise}
                        disabled={previewMode || !newPromise.trim()}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 9 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <CircleHelp className="h-6 w-6 text-muted-foreground" />
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Answer common customer questions to reduce support inquiries and build confidence.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {formData.faqs.length > 0 ? (
                  <Accordion
                    type="multiple"
                    defaultValue={formData.faqs.map((_, i) => String(i))}
                    className="space-y-3"
                  >
                    {formData.faqs.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={String(index)}
                        className="rounded-xl border border-border bg-card px-4 shadow-sm"
                      >
                        <div className="flex items-stretch gap-2">
                          <AccordionTrigger className="flex-1 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                            <div className="flex flex-1 items-center gap-2 text-left">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                                Q{index + 1}
                              </span>
                              <span className="font-medium">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-2 shrink-0 self-start text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeFaq(index)
                            }}
                            disabled={previewMode}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <AccordionContent className="border-t pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-12 text-center">
                    <CircleHelp className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <p className="mb-1 font-medium text-muted-foreground">No FAQs added yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add frequently asked questions to help customers make informed decisions
                    </p>
                  </div>
                )}

                <Card className="border-2 border-dashed border-muted-foreground/40 bg-muted/20 p-6">
                  <p className="mb-4 flex items-center gap-2 text-base font-bold">
                    <Plus className="h-5 w-5" />
                    Add New FAQ
                  </p>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faq-q">Question</Label>
                      <Input
                        id="faq-q"
                        value={newFaq.question}
                        onChange={(e) => setNewFaq((prev) => ({ ...prev, question: e.target.value }))}
                        disabled={previewMode}
                        placeholder="e.g., How long does the service take?"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faq-a">Answer</Label>
                      <Textarea
                        id="faq-a"
                        rows={4}
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq((prev) => ({ ...prev, answer: e.target.value }))}
                        disabled={previewMode}
                        placeholder="Provide a detailed answer..."
                        className="bg-background"
                      />
                    </div>
                    <Button
                      onClick={addFaq}
                      disabled={previewMode || !newFaq.question.trim() || !newFaq.answer.trim()}
                      leftIcon={<Plus className="h-4 w-4" />}
                      size="lg"
                      className="w-full sm:w-auto"
                      variant="secondary"
                    >
                      Add FAQ
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 10 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Meta title and description power search and social previews. Optional — if empty, many sites fall back
                to the service name and first lines of the description.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateSeoFromContent}
                  disabled={previewMode}
                >
                  Generate from name, description & tags
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="seo-title">SEO title</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formData.seo_title.length}/60
                  </span>
                </div>
                <Input
                  id="seo-title"
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value.slice(0, 60))}
                  disabled={previewMode}
                  placeholder="e.g., AC gas refill in Bangalore — same-day service"
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="seo-desc">Meta description</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formData.seo_description.length}/160
                  </span>
                </div>
                <Textarea
                  id="seo-desc"
                  rows={4}
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value.slice(0, 160))}
                  disabled={previewMode}
                  placeholder="One or two sentences: what the customer gets, where you operate, and trust signals."
                  maxLength={160}
                />
              </div>

              <div className="space-y-3">
                <Label>SEO keywords</Label>
                <p className="text-xs text-muted-foreground">Short phrases; avoid stuffing. Same pattern as service tags.</p>
                <div className="flex flex-wrap gap-2">
                  {formData.seo_keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-muted"
                        onClick={() => removeSeoKeyword(kw)}
                        disabled={previewMode}
                        aria-label={`Remove ${kw}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSeoKeyword}
                    onChange={(e) => setNewSeoKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSeoKeyword()
                      }
                    }}
                    disabled={previewMode}
                    placeholder="e.g., AC repair Bangalore"
                  />
                  <Button type="button" variant="outline" onClick={addSeoKeyword} disabled={previewMode}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 11 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <MessageCircle className="h-5 w-5" />
                  Customer reviews
                </h2>
                <p className="text-sm text-muted-foreground">
                  Build trust by curating reviews. Real booking reviews appear here automatically.
                  You can also add featured testimonials to showcase on the customer-facing service page.
                </p>
              </div>

              {!isEditMode || !id ? (
                <Card className="border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Save the service first, then return here to manage customer reviews.
                </Card>
              ) : (
                <>
                  {/* Stats summary */}
                  <Card className="bg-gradient-to-br from-bloom-rose to-bloom-rose p-5">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-bloom-coral">
                          {reviewStats.averageRating.toFixed(1)}
                        </p>
                        <div className="my-1 flex justify-center text-bloom-coral">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={cn(
                                'h-4 w-4',
                                n <= Math.round(reviewStats.averageRating) ? 'fill-current' : 'opacity-30',
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {reviewStats.totalReviews} review{reviewStats.totalReviews === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count =
                            reviewStats.ratingDistribution[star as 1 | 2 | 3 | 4 | 5] ?? 0
                          const total = reviewStats.totalReviews || 1
                          const pct = Math.round((count / total) * 100)
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-12 text-muted-foreground">{star} star</span>
                              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-bloom-rose">
                                <div
                                  className="h-full rounded-full bg-bloom-coral"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-muted-foreground">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>

                  {/* Add new admin-curated review */}
                  <Card className="border-2 border-dashed p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <p className="font-semibold">Add a review</p>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        Curated by admin
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Customer name *</Label>
                        <Input
                          value={reviewForm.customerName}
                          onChange={(e) =>
                            setReviewForm((p) => ({ ...p, customerName: e.target.value }))
                          }
                          placeholder="e.g. Anita S."
                          disabled={previewMode || reviewSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location (optional)</Label>
                        <Input
                          value={reviewForm.customerLocation}
                          onChange={(e) =>
                            setReviewForm((p) => ({ ...p, customerLocation: e.target.value }))
                          }
                          placeholder="e.g. Bangalore"
                          disabled={previewMode || reviewSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Customer photo URL (optional)</Label>
                        <Input
                          type="url"
                          value={reviewForm.customerAvatar}
                          onChange={(e) =>
                            setReviewForm((p) => ({ ...p, customerAvatar: e.target.value }))
                          }
                          placeholder="https://..."
                          disabled={previewMode || reviewSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Package / variant (optional)</Label>
                        <Input
                          value={reviewForm.variantName}
                          onChange={(e) =>
                            setReviewForm((p) => ({ ...p, variantName: e.target.value }))
                          }
                          placeholder="e.g. Premium plan"
                          disabled={previewMode || reviewSubmitting}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Rating *</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="rounded-md p-1 transition-transform hover:scale-110"
                            onClick={() =>
                              setReviewForm((p) => ({ ...p, rating: n }))
                            }
                            disabled={previewMode || reviewSubmitting}
                            aria-label={`${n} star${n === 1 ? '' : 's'}`}
                          >
                            <Star
                              className={cn(
                                'h-7 w-7',
                                n <= reviewForm.rating
                                  ? 'fill-bloom-coral text-bloom-coral'
                                  : 'text-muted-foreground/40',
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {reviewForm.rating}/5
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Review text</Label>
                      <Textarea
                        rows={3}
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((p) => ({ ...p, comment: e.target.value }))
                        }
                        placeholder="Share what the customer loved about the service…"
                        disabled={previewMode || reviewSubmitting}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={reviewForm.isVerified}
                          onCheckedChange={(v) =>
                            setReviewForm((p) => ({ ...p, isVerified: !!v }))
                          }
                          disabled={previewMode || reviewSubmitting}
                        />
                        <span className="font-medium">Show on customer page</span>
                        <span className="text-muted-foreground">(verified)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={reviewForm.isFeatured}
                          onCheckedChange={(v) =>
                            setReviewForm((p) => ({ ...p, isFeatured: !!v }))
                          }
                          disabled={previewMode || reviewSubmitting}
                        />
                        <span className="font-medium">Pin as featured</span>
                      </label>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setReviewForm(blankAdminReview)}
                        disabled={previewMode || reviewSubmitting}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateAdminReview}
                        loading={reviewSubmitting}
                        leftIcon={!reviewSubmitting ? <Plus className="h-4 w-4" /> : undefined}
                        disabled={
                          previewMode ||
                          reviewSubmitting ||
                          !reviewForm.customerName.trim()
                        }
                      >
                        Add review
                      </Button>
                    </div>
                  </Card>

                  {/* Existing reviews list */}
                  {loadingReviews ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Loading reviews…
                    </div>
                  ) : serviceReviews.length === 0 ? (
                    <Card className="border border-dashed p-8 text-center">
                      <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="font-medium text-muted-foreground">
                        No reviews yet for this service
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add a curated review above, or wait for completed bookings to flow in.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {serviceReviews.length} review
                          {serviceReviews.length === 1 ? '' : 's'}
                        </p>
                      </div>

                      {serviceReviews.map((review) => {
                        const customer = deriveReviewCustomerName(review)
                        const isAdmin = !!review.isAdminCurated || review.source === 'admin'
                        const isSaving = reviewSavingId === review._id
                        const isDeleting = reviewDeletingId === review._id
                        return (
                          <Card
                            key={review._id}
                            className={cn(
                              'p-4 transition-colors',
                              review.isFeatured ? 'border-bloom-coral bg-bloom-rose/40' : '',
                            )}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                {review.customerAvatar ? (
                                  <img
                                    src={review.customerAvatar}
                                    alt={customer}
                                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                                    {customer.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-foreground">{customer}</span>
                                    {isAdmin ? (
                                      <Badge variant="outline" className="text-[10px]">
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        Curated
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-[10px]">
                                        <ShieldCheck className="mr-1 h-3 w-3" />
                                        Booking
                                      </Badge>
                                    )}
                                    {review.isFeatured && (
                                      <Badge className="bg-bloom-coral text-[10px] text-white hover:bg-bloom-coral">
                                        Featured
                                      </Badge>
                                    )}
                                    {!review.isVerified && (
                                      <Badge variant="destructive" className="text-[10px]">
                                        Hidden
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {review.customerLocation ? (
                                      <span>{review.customerLocation}</span>
                                    ) : null}
                                    {review.customerLocation ? <span>•</span> : null}
                                    <span>{formatRelativeDate(review.createdAt)}</span>
                                    {review.variantName ? (
                                      <>
                                        <span>•</span>
                                        <span>{review.variantName}</span>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditReview(review)}
                                      disabled={previewMode || isSaving || isDeleting}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit review</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteReview(review)}
                                      disabled={previewMode || isSaving || isDeleting}
                                    >
                                      {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-1 text-bloom-coral">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  className={cn(
                                    'h-4 w-4',
                                    n <= review.rating ? 'fill-current' : 'opacity-30',
                                  )}
                                />
                              ))}
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({review.rating}/5)
                              </span>
                            </div>

                            {review.comment ? (
                              <p className="mt-2 text-sm text-foreground">{review.comment}</p>
                            ) : (
                              <p className="mt-2 text-sm italic text-muted-foreground">
                                No written comment
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-4 border-t pt-3 text-xs">
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={!!review.isVerified}
                                  onCheckedChange={(v) =>
                                    handleToggleReviewFlag(review, 'isVerified', !!v)
                                  }
                                  disabled={previewMode || isSaving}
                                />
                                <span className="font-medium">Visible on customer page</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={!!review.isFeatured}
                                  onCheckedChange={(v) =>
                                    handleToggleReviewFlag(review, 'isFeatured', !!v)
                                  }
                                  disabled={previewMode || isSaving}
                                />
                                <span className="font-medium">Featured</span>
                              </label>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Edit review modal */}
              <Dialog
                open={!!editingReview}
                onOpenChange={(open) => {
                  if (!open) setEditingReview(null)
                }}
              >
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit review</DialogTitle>
                  </DialogHeader>
                  {editingReview ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Display name</Label>
                          <Input
                            value={editReviewForm.customerName}
                            onChange={(e) =>
                              setEditReviewForm((p) => ({ ...p, customerName: e.target.value }))
                            }
                            disabled={!editingReview.isAdminCurated}
                          />
                          {!editingReview.isAdminCurated ? (
                            <p className="text-[10px] text-muted-foreground">
                              Linked to a real customer — name is read-only.
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={editReviewForm.customerLocation}
                            onChange={(e) =>
                              setEditReviewForm((p) => ({ ...p, customerLocation: e.target.value }))
                            }
                            disabled={!editingReview.isAdminCurated}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Avatar URL</Label>
                          <Input
                            type="url"
                            value={editReviewForm.customerAvatar}
                            onChange={(e) =>
                              setEditReviewForm((p) => ({ ...p, customerAvatar: e.target.value }))
                            }
                            disabled={!editingReview.isAdminCurated}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Package / variant</Label>
                          <Input
                            value={editReviewForm.variantName}
                            onChange={(e) =>
                              setEditReviewForm((p) => ({ ...p, variantName: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="rounded-md p-1"
                              onClick={() =>
                                setEditReviewForm((p) => ({ ...p, rating: n }))
                              }
                            >
                              <Star
                                className={cn(
                                  'h-6 w-6',
                                  n <= editReviewForm.rating
                                    ? 'fill-bloom-coral text-bloom-coral'
                                    : 'text-muted-foreground/40',
                                )}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">
                            {editReviewForm.rating}/5
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Review text</Label>
                        <Textarea
                          rows={4}
                          value={editReviewForm.comment}
                          onChange={(e) =>
                            setEditReviewForm((p) => ({ ...p, comment: e.target.value }))
                          }
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={editReviewForm.isVerified}
                            onCheckedChange={(v) =>
                              setEditReviewForm((p) => ({ ...p, isVerified: !!v }))
                            }
                          />
                          <span>Visible on customer page</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={editReviewForm.isFeatured}
                            onCheckedChange={(v) =>
                              setEditReviewForm((p) => ({ ...p, isFeatured: !!v }))
                            }
                          />
                          <span>Featured</span>
                        </label>
                      </div>
                    </div>
                  ) : null}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingReview(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveEditReview}
                      loading={!!reviewSavingId && editingReview?._id === reviewSavingId}
                      leftIcon={
                        reviewSavingId && editingReview?._id === reviewSavingId
                          ? undefined
                          : <Save className="h-4 w-4" />
                      }
                      disabled={!editingReview}
                    >
                      Save changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col gap-3 border-t bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/platform-services')}>
            Back to Services
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void handleSubmit('draft')}
              disabled={draftDisabled}
            >
              Save as Draft
            </Button>
            <Button
              loading={loading}
              leftIcon={!loading ? <Save className="h-4 w-4" /> : undefined}
              onClick={() => void handleSubmit('publish')}
              disabled={publishDisabled}
            >
              {loading
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Service'
                  : 'Publish Service'}
            </Button>
          </div>
        </div>
      </Card>

        </>
      )}
    </div>
  )
}