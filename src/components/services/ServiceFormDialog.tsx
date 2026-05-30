import React, { useState, useCallback, useEffect } from 'react'
import {
  Plus,
  CloudUpload,
  Image as ImageIcon,
  X,
  Info,
  CheckCircle,
  Pencil,
  IndianRupee,
  Clock,
  Settings,
  Tag,
  Wrench,
  GraduationCap,
  BadgeCheck,
  Star,
  Eye,
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Card, CardContent } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

interface ServiceImage {
  url: string
  file?: File
}

interface ServiceFormData {
  name: string
  slug: string
  description: string
  short_description: string
  category: string
  base_price: string
  price_type: 'fixed' | 'hourly' | 'quote'
  duration_minutes: string
  is_popular: boolean
  is_active: boolean
  is_featured: boolean
  sort_order: number
  requirements: {
    tools: string[]
    skills: string[]
    licenses: string[]
  }
  tags: string[]
  images: ServiceImage[]
  icon?: string
}

interface ServiceFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ServiceFormData) => void
  mode: 'create' | 'edit'
  initialData?: Partial<ServiceFormData>
  loading?: boolean
}

const CATEGORIES = [
  { value: 'home_repair', label: 'Home Repair' },
  { value: 'home_improvement', label: 'Home Improvement' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'installation', label: 'Installation' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'consultation', label: 'Consultation' },
]

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'quote', label: 'Quote Based' },
]

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ color: [] }, { background: [] }],
    ['link'],
    ['clean'],
  ],
}

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'indent',
  'color',
  'background',
  'link',
]

function RemovableBadge({
  label,
  onRemove,
  variant = 'outline',
}: {
  label: string
  onRemove: () => void
  variant?: React.ComponentProps<typeof Badge>['variant']
}) {
  return (
    <Badge variant={variant} className="gap-1 pr-0.5 font-normal">
      {label}
      <button
        type="button"
        className="rounded p-0.5 hover:bg-muted"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

export function ServiceFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  loading = false,
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: '',
    base_price: '',
    price_type: 'fixed',
    duration_minutes: '',
    is_popular: false,
    is_active: true,
    is_featured: false,
    sort_order: 0,
    requirements: {
      tools: [],
      skills: [],
      licenses: [],
    },
    tags: [],
    images: [],
    icon: '',
    ...initialData,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState('')
  const [newTool, setNewTool] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newLicense, setNewLicense] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState(0)

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        short_description: initialData.short_description || '',
        category: initialData.category || '',
        base_price: initialData.base_price || '',
        price_type: initialData.price_type || 'fixed',
        duration_minutes: initialData.duration_minutes || '',
        is_popular: initialData.is_popular || false,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        is_featured: initialData.is_featured || false,
        sort_order: initialData.sort_order || 0,
        requirements: {
          tools: initialData.requirements?.tools || [],
          skills: initialData.requirements?.skills || [],
          licenses: initialData.requirements?.licenses || [],
        },
        tags: initialData.tags || [],
        images: initialData.images || [],
        icon: initialData.icon || '',
      })
      setErrors({})
      setNewTag('')
      setNewTool('')
      setNewSkill('')
      setNewLicense('')
    } else if (open && !initialData) {
      setFormData({
        name: '',
        slug: '',
        description: '',
        short_description: '',
        category: '',
        base_price: '',
        price_type: 'fixed',
        duration_minutes: '',
        is_popular: false,
        is_active: true,
        is_featured: false,
        sort_order: 0,
        requirements: {
          tools: [],
          skills: [],
          licenses: [],
        },
        tags: [],
        images: [],
        icon: '',
      })
      setErrors({})
      setNewTag('')
      setNewTool('')
      setNewSkill('')
      setNewLicense('')
    }
  }, [open, initialData])

  useEffect(() => {
    const fields = [
      formData.name,
      formData.description,
      formData.category,
      formData.base_price,
      formData.duration_minutes,
      formData.images.length > 0 ? 'hasImages' : '',
      formData.short_description,
    ]
    const filledFields = fields.filter((field) => field && field.toString().trim() !== '').length
    const percentage = Math.round((filledFields / fields.length) * 100)
    setCompletionPercentage(percentage)
  }, [formData])

  useEffect(() => {
    if (formData.name && !initialData?.slug && mode === 'create') {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, mode])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData((prev) => {
      const currentImages = prev.images
      const remainingSlots = 4 - currentImages.length
      if (remainingSlots <= 0) return prev
      const newImages = acceptedFiles
        .slice(0, remainingSlots)
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({
          url: URL.createObjectURL(file),
          file,
        }))
      return { ...prev, images: [...currentImages, ...newImages] }
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: true,
    maxFiles: 4,
  })

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleRequirementsChange = (type: 'tools' | 'skills' | 'licenses', value: string[]) => {
    setFormData((prev) => ({
      ...prev,
      requirements: { ...prev.requirements, [type]: value },
    }))
  }

  const addItem = (type: 'tags' | 'tools' | 'skills' | 'licenses', value: string) => {
    if (!value.trim()) return
    if (type === 'tags') {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, value.trim()] }))
      setNewTag('')
    } else {
      handleRequirementsChange(type as 'tools' | 'skills' | 'licenses', [
        ...formData.requirements[type as 'tools' | 'skills' | 'licenses'],
        value.trim(),
      ])
      if (type === 'tools') setNewTool('')
      if (type === 'skills') setNewSkill('')
      if (type === 'licenses') setNewLicense('')
    }
  }

  const removeItem = (type: 'tags' | 'tools' | 'skills' | 'licenses', index: number) => {
    if (type === 'tags') {
      setFormData((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }))
    } else {
      const currentItems = formData.requirements[type as 'tools' | 'skills' | 'licenses']
      handleRequirementsChange(
        type as 'tools' | 'skills' | 'licenses',
        currentItems.filter((_, i) => i !== index),
      )
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Service name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (formData.base_price && isNaN(Number(formData.base_price))) {
      newErrors.base_price = 'Base price must be a valid number'
    }
    if (formData.duration_minutes && isNaN(Number(formData.duration_minutes))) {
      newErrors.duration_minutes = 'Duration must be a valid number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      category: '',
      base_price: '',
      price_type: 'fixed',
      duration_minutes: '',
      is_popular: false,
      is_active: true,
      is_featured: false,
      sort_order: 0,
      requirements: { tools: [], skills: [], licenses: [] },
      tags: [],
      images: [],
      icon: '',
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !loading) handleClose()
      }}
    >
      <DialogContent className="flex max-h-[95vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 [&>button]:hidden">
        <div className="relative bg-primary px-6 pb-4 pt-6 text-primary-foreground">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-primary-foreground hover:bg-white/10"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </Button>
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-2xl font-bold text-primary-foreground">
              {mode === 'create' ? 'Create New Service' : 'Edit Service'}
            </DialogTitle>
            <p className="text-sm opacity-90">
              {mode === 'create'
                ? 'Add a new service to your platform'
                : 'Update service information and settings'}
            </p>
          </DialogHeader>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Form Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {loading && <div className="h-1 w-full animate-pulse bg-primary/30" />}

        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Pencil className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Basic Information</h3>
                    <p className="text-sm text-muted-foreground">Essential details about your service</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label htmlFor="sf-name">Service Name *</Label>
                    <div className="relative">
                      <Input
                        id="sf-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Leaky Faucet Repair"
                        className={cn(errors.name && 'border-destructive', 'pr-9')}
                      />
                      {formData.name ? (
                        <CheckCircle className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-storm-deep" />
                      ) : null}
                    </div>
                    {errors.name ? (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Enter a clear, descriptive name</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-slug">URL Slug</Label>
                    <div className="flex rounded-md border border-input shadow-sm">
                      <span className="flex items-center border-r bg-muted px-2 text-xs text-muted-foreground">
                        /services/
                      </span>
                      <Input
                        id="sf-slug"
                        className="border-0 font-mono shadow-none focus-visible:ring-0"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="auto-generated"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">URL-friendly version (auto-generated)</p>
                  </div>
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label>Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleInputChange('category', v)}
                    >
                      <SelectTrigger className={cn(errors.category && 'border-destructive')}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <Info className="h-3.5 w-3.5" />
                        {errors.category}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="sf-short">Short Description</Label>
                    <Textarea
                      id="sf-short"
                      rows={2}
                      value={formData.short_description}
                      onChange={(e) => handleInputChange('short_description', e.target.value)}
                      placeholder="Brief overview for listings (max 120 chars)"
                      maxLength={120}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.short_description.length}/120 characters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(errors.description && 'border-destructive')}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Pencil className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Detailed Description *</h3>
                      <p className="text-sm text-muted-foreground">Provide comprehensive information</p>
                    </div>
                  </div>
                  {formData.description && formData.description.replace(/<[^>]*>/g, '').length > 50 && (
                    <Badge variant="success" className="shrink-0">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Complete
                    </Badge>
                  )}
                </div>
                <div
                  className={cn(
                    'overflow-hidden rounded-md border bg-background',
                    errors.description ? 'border-destructive' : 'border-input',
                  )}
                >
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={(value) => handleInputChange('description', value)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Describe what's included, process, benefits..."
                  />
                </div>
                {errors.description && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errors.description}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-storm-deep/10">
                    <IndianRupee className="h-6 w-6 text-storm-deep" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Pricing &amp; Duration</h3>
                    <p className="text-sm text-muted-foreground">Set pricing structure and estimated time</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Price Type *</Label>
                    <Select
                      value={formData.price_type}
                      onValueChange={(v) => handleInputChange('price_type', v)}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-price">Base Price</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-storm-deep" />
                      <Input
                        id="sf-price"
                        type="number"
                        className={cn('pl-9', errors.base_price && 'border-destructive')}
                        value={formData.base_price}
                        onChange={(e) => handleInputChange('base_price', e.target.value)}
                      />
                    </div>
                    {errors.base_price ? (
                      <p className="text-xs text-destructive">{errors.base_price}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Leave empty for quote-based pricing</p>
                    )}
                    {formData.base_price ? (
                      <Badge variant="outline" className="mt-1">
                        ₹{formData.base_price} (INR)
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-dur">Duration (minutes)</Label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="sf-dur"
                        type="number"
                        className={cn('pl-9', errors.duration_minutes && 'border-destructive')}
                        value={formData.duration_minutes}
                        onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                      />
                    </div>
                    {errors.duration_minutes ? (
                      <p className="text-xs text-destructive">{errors.duration_minutes}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {formData.duration_minutes
                          ? `~${Math.round(Number(formData.duration_minutes) / 60)} hours`
                          : 'Estimated time'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bloom-coral/10">
                      <ImageIcon className="h-6 w-6 text-bloom-coral" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Service Images</h3>
                      <p className="text-sm text-muted-foreground">Upload up to 4 images</p>
                    </div>
                  </div>
                  <Badge variant={formData.images.length >= 4 ? 'destructive' : formData.images.length > 0 ? 'success' : 'secondary'}>
                    {formData.images.length}/4
                  </Badge>
                </div>
                {formData.images.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {formData.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-lg border-2 border-storm-deep/30"
                      >
                        {index === 0 && (
                          <Badge className="absolute left-2 top-2 z-10">Primary</Badge>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-2 top-2 z-10 h-7 w-7"
                          onClick={() => removeImage(index)}
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <img
                          src={image.url}
                          alt=""
                          className="h-44 w-full object-cover"
                        />
                        <div className="border-t bg-card p-2 text-xs">
                          <p className="truncate font-medium">{image.file?.name || `Image ${index + 1}`}</p>
                          <p className="text-muted-foreground">
                            {image.file ? `${(image.file.size / 1024).toFixed(1)} KB` : 'External'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {formData.images.length < 4 && (
                  <div
                    {...getRootProps()}
                    className={cn(
                      'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                      isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
                    )}
                  >
                    <input {...getInputProps()} />
                    <CloudUpload
                      className={cn('mx-auto mb-2 h-12 w-12', isDragActive ? 'text-primary' : 'text-muted-foreground')}
                    />
                    <p className="font-medium">
                      {isDragActive
                        ? 'Drop images here!'
                        : formData.images.length > 0
                          ? `Add ${4 - formData.images.length} more image${4 - formData.images.length !== 1 ? 's' : ''}`
                          : 'Drop images here or click to browse'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Recommended: 1200×800px, max 5MB per image
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {['JPEG', 'PNG', 'WebP', 'GIF'].map((f) => (
                        <Badge key={f} variant="outline">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {formData.images.length >= 4 && (
                  <div className="rounded-md border border-primary/20 bg-primary-soft px-3 py-2 text-sm text-primary dark:border-primary dark:bg-primary/40 dark:text-primary-deep">
                    Maximum of 4 images reached. Remove an image to upload a new one.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              {(
                [
                  {
                    key: 'tools' as const,
                    title: 'Required Tools',
                    icon: Wrench,
                    color: 'text-destructive',
                    bg: 'bg-destructive/10',
                    items: formData.requirements.tools,
                    newVal: newTool,
                    setNew: setNewTool,
                    placeholder: 'e.g., Wrench, Drill…',
                  },
                  {
                    key: 'skills',
                    title: 'Required Skills',
                    icon: GraduationCap,
                    color: 'text-bloom-coral',
                    bg: 'bg-bloom-coral/10',
                    items: formData.requirements.skills,
                    newVal: newSkill,
                    setNew: setNewSkill,
                    placeholder: 'e.g., Plumbing…',
                  },
                  {
                    key: 'licenses',
                    title: 'Required Licenses',
                    icon: BadgeCheck,
                    color: 'text-storm-deep',
                    bg: 'bg-storm-deep/10',
                    items: formData.requirements.licenses,
                    newVal: newLicense,
                    setNew: setNewLicense,
                    placeholder: 'e.g., EPA 608…',
                  },
                ] as const
              ).map((col) => (
                <Card key={col.key}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <col.icon className={cn('h-5 w-5', col.color)} />
                        <span className="text-sm font-semibold">{col.title}</span>
                      </div>
                      <Badge variant="secondary">{col.items.length}</Badge>
                    </div>
                    <div className="flex min-h-[40px] flex-wrap gap-1">
                      {col.items.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None added yet</span>
                      ) : (
                        col.items.map((item, index) => (
                          <RemovableBadge
                            key={`${col.key}-${index}`}
                            label={item}
                            onRemove={() => removeItem(col.key, index)}
                            variant="outline"
                          />
                        ))
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Input
                        placeholder={col.placeholder}
                        value={col.newVal}
                        onChange={(e) => col.setNew(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addItem(col.key, col.newVal)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        disabled={!col.newVal.trim()}
                        onClick={() => addItem(col.key, col.newVal)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Tags &amp; Keywords</h3>
                      <p className="text-sm text-muted-foreground">Searchable tags for this service</p>
                    </div>
                  </div>
                  <Badge variant="outline">{formData.tags.length} tags</Badge>
                </div>
                <div className="flex min-h-[50px] flex-wrap gap-2">
                  {formData.tags.length === 0 ? (
                    <div className="w-full rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                      No tags yet. Tags help with search and categorization.
                    </div>
                  ) : (
                    formData.tags.map((tag, index) => (
                      <RemovableBadge
                        key={index}
                        label={tag}
                        onRemove={() => removeItem('tags', index)}
                        variant="default"
                      />
                    ))
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Type a tag and press Enter…"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem('tags', newTag)
                      }
                    }}
                  />
                  <Button type="button" onClick={() => addItem('tags', newTag)} disabled={!newTag.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tag
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-deep/10">
                    <Settings className="h-6 w-6 text-primary-deep" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Settings &amp; Visibility</h3>
                    <p className="text-sm text-muted-foreground">Display options and status</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-icon">Icon</Label>
                    <div className="relative">
                      <ImageIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="sf-icon"
                        className="pl-9"
                        value={formData.icon || ''}
                        onChange={(e) => handleInputChange('icon', e.target.value)}
                        placeholder="Icon name or URL"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Lucide icon name or image URL</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-sort">Sort Order</Label>
                    <Input
                      id="sf-sort"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value, 10) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                  </div>
                </div>
                <Separator />
                <p className="text-sm font-medium">Visibility &amp; status</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-lg border-2 p-3',
                      formData.is_active ? 'border-storm-deep/40 bg-storm-deep/5' : 'border-border',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Eye className={cn('h-5 w-5', formData.is_active ? 'text-storm-deep' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-sm font-semibold">Active</p>
                        <p className="text-xs text-muted-foreground">Service is live</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(c) => handleInputChange('is_active', c === true)}
                    />
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-lg border-2 p-3',
                      formData.is_popular ? 'border-bloom-coral/40 bg-bloom-coral/5' : 'border-border',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Star className={cn('h-5 w-5', formData.is_popular ? 'text-bloom-coral' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-sm font-semibold">Popular</p>
                        <p className="text-xs text-muted-foreground">Mark as popular</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_popular}
                      onCheckedChange={(c) => handleInputChange('is_popular', c === true)}
                    />
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-lg border-2 p-3',
                      formData.is_featured ? 'border-primary/40 bg-primary/5' : 'border-border',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Star className={cn('h-5 w-5', formData.is_featured ? 'text-primary' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-sm font-semibold">Featured</p>
                        <p className="text-xs text-muted-foreground">Show in featured</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(c) => handleInputChange('is_featured', c === true)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground" title="Form completion progress">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                completionPercentage === 100 ? 'bg-storm-deep' : 'bg-bloom-coral',
              )}
            />
            {completionPercentage === 100 ? 'Ready to submit' : `${completionPercentage}% complete`}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create Service' : 'Update Service'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
