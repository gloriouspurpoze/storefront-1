import React, { useState, useEffect } from 'react'
import { X, Plus, Pencil, IndianRupee } from 'lucide-react'
import { ServiceRequest, CreateServiceRequest, UpdateServiceRequest } from '../../services/api/services.service'
import { useAppPrompt } from '../providers/AppDialogsProvider'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface ServiceRequestFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  service: ServiceRequest | null
  onClose: () => void
  onSubmit: (data: CreateServiceRequest | UpdateServiceRequest) => void
  loading?: boolean
}

const SERVICE_TYPES = [
  'plumbing',
  'electrical',
  'hvac',
  'cleaning',
  'landscaping',
  'painting',
  'carpentry',
  'handyman',
  'roofing',
  'flooring',
  'appliance_repair',
  'pest_control',
]

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low - Can wait a few days' },
  { value: 'medium', label: 'Medium - Within a week' },
  { value: 'high', label: 'High - Urgent, ASAP' },
] as const

export function ServiceRequestFormDialog({
  open,
  mode,
  service,
  onClose,
  onSubmit,
  loading = false,
}: ServiceRequestFormDialogProps) {
  const prompt = useAppPrompt()
  const [formData, setFormData] = useState({
    service_type: '',
    title: '',
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      zip_code: '',
      coordinates: {
        lat: '',
        lng: '',
      },
    },
    urgency: 'medium' as 'low' | 'medium' | 'high',
    budget_min: '',
    budget_max: '',
    preferred_date: '',
    images: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit' && service) {
      setFormData({
        service_type: service.service_type,
        title: service.title,
        description: service.description,
        location: {
          address: service.location.address,
          city: service.location.city,
          state: service.location.state,
          zip_code: service.location.zip_code,
          coordinates: {
            lat: String(service.location.coordinates?.lat ?? ''),
            lng: String(service.location.coordinates?.lng ?? ''),
          },
        },
        urgency: service.urgency,
        budget_min: String(parseFloat(String(service.budget_min))),
        budget_max: String(parseFloat(String(service.budget_max))),
        preferred_date: service.preferred_date ? service.preferred_date.split('T')[0] : '',
        images: service.images || [],
      })
    } else {
      setFormData({
        service_type: '',
        title: '',
        description: '',
        location: {
          address: '',
          city: '',
          state: '',
          zip_code: '',
          coordinates: { lat: '', lng: '' },
        },
        urgency: 'medium',
        budget_min: '',
        budget_max: '',
        preferred_date: '',
        images: [],
      })
    }
    setErrors({})
  }, [mode, service, open])

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleLocationChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }))
  }

  const handleAddImage = async () => {
    const imageUrl = await prompt({
      title: 'Add image',
      label: 'Image URL',
      defaultValue: '',
      confirmLabel: 'Add',
    })
    if (imageUrl && imageUrl.trim()) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, imageUrl.trim()] }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.service_type) newErrors.service_type = 'Service type is required'
    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }
    if (!formData.location.address) newErrors.address = 'Address is required'
    if (!formData.location.city) newErrors.city = 'City is required'
    if (!formData.location.state) newErrors.state = 'State is required'
    if (!formData.location.zip_code) newErrors.zip_code = 'ZIP code is required'
    if (!formData.location.coordinates.lat || !formData.location.coordinates.lng) {
      newErrors.coordinates = 'Coordinates (latitude and longitude) are required'
    }
    if (!formData.budget_min || parseFloat(formData.budget_min) <= 0) {
      newErrors.budget_min = 'Minimum budget must be greater than 0'
    }
    if (!formData.budget_max || parseFloat(formData.budget_max) <= 0) {
      newErrors.budget_max = 'Maximum budget must be greater than 0'
    }
    if (
      formData.budget_min &&
      formData.budget_max &&
      parseFloat(formData.budget_max) < parseFloat(formData.budget_min)
    ) {
      newErrors.budget_max = 'Maximum budget must be greater than minimum budget'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    const submitData: CreateServiceRequest & { preferred_date?: string } = {
      service_type: formData.service_type,
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: {
        address: formData.location.address.trim(),
        city: formData.location.city.trim(),
        state: formData.location.state.trim(),
        zip_code: formData.location.zip_code.trim(),
        coordinates: {
          lat: parseFloat(formData.location.coordinates.lat),
          lng: parseFloat(formData.location.coordinates.lng),
        },
      },
      urgency: formData.urgency,
      budget_min: parseFloat(formData.budget_min),
      budget_max: parseFloat(formData.budget_max),
      images: formData.images,
    }
    if (formData.preferred_date) {
      submitData.preferred_date = new Date(formData.preferred_date).toISOString()
    }
    onSubmit(submitData as CreateServiceRequest | UpdateServiceRequest)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {mode === 'create' ? 'Create New Service Request' : 'Edit Service Request'}
          </DialogTitle>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(v) => handleChange('service_type', v)}
              >
                <SelectTrigger className={cn(errors.service_type && 'border-destructive')}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_type && <p className="text-xs text-destructive">{errors.service_type}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Urgency *</Label>
              <Select
                value={formData.urgency}
                onValueChange={(v) => handleChange('urgency', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="srf-title">Title *</Label>
            <Input
              id="srf-title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={cn(errors.title && 'border-destructive')}
              placeholder="e.g., Fix leaking kitchen faucet"
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Min 5 characters</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="srf-desc">Description *</Label>
            <Textarea
              id="srf-desc"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={cn(errors.description && 'border-destructive')}
              placeholder="Describe the problem in detail..."
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Min 20 characters</p>
            )}
          </div>

          <p className="text-sm font-medium">Location</p>

          <div className="space-y-1.5">
            <Label htmlFor="srf-addr">Address *</Label>
            <Input
              id="srf-addr"
              value={formData.location.address}
              onChange={(e) => handleLocationChange('address', e.target.value)}
              className={cn(errors.address && 'border-destructive')}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="srf-city">City *</Label>
              <Input
                id="srf-city"
                value={formData.location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                className={cn(errors.city && 'border-destructive')}
              />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="srf-state">State *</Label>
                <Input
                  id="srf-state"
                  value={formData.location.state}
                  onChange={(e) => handleLocationChange('state', e.target.value.toUpperCase())}
                  maxLength={2}
                  className={cn(errors.state && 'border-destructive')}
                />
                {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="srf-zip">ZIP *</Label>
                <Input
                  id="srf-zip"
                  value={formData.location.zip_code}
                  onChange={(e) => handleLocationChange('zip_code', e.target.value)}
                  maxLength={5}
                  className={cn(errors.zip_code && 'border-destructive')}
                />
                {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code}</p>}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Coordinates * (from{' '}
            <a href="https://www.google.com/maps" className="text-primary underline" target="_blank" rel="noreferrer">
              Google Maps
            </a>
            )
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="srf-lat">Latitude *</Label>
              <Input
                id="srf-lat"
                type="number"
                step="any"
                value={formData.location.coordinates.lat}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      coordinates: { ...prev.location.coordinates, lat: e.target.value },
                    },
                  }))
                }
                className={cn(errors.coordinates && 'border-destructive')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="srf-lng">Longitude *</Label>
              <Input
                id="srf-lng"
                type="number"
                step="any"
                value={formData.location.coordinates.lng}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      coordinates: { ...prev.location.coordinates, lng: e.target.value },
                    },
                  }))
                }
                className={cn(errors.coordinates && 'border-destructive')}
              />
            </div>
          </div>
          {errors.coordinates && <p className="text-xs text-destructive">{errors.coordinates}</p>}

          <p className="text-sm font-medium">Budget</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="srf-bmin">Minimum Budget *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="srf-bmin"
                  type="number"
                  className={cn('pl-9', errors.budget_min && 'border-destructive')}
                  value={formData.budget_min}
                  onChange={(e) => handleChange('budget_min', e.target.value)}
                  min={0}
                />
              </div>
              {errors.budget_min && <p className="text-xs text-destructive">{errors.budget_min}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="srf-bmax">Maximum Budget *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="srf-bmax"
                  type="number"
                  className={cn('pl-9', errors.budget_max && 'border-destructive')}
                  value={formData.budget_max}
                  onChange={(e) => handleChange('budget_max', e.target.value)}
                  min={0}
                />
              </div>
              {errors.budget_max && <p className="text-xs text-destructive">{errors.budget_max}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="srf-date">Preferred Date</Label>
            <Input
              id="srf-date"
              type="date"
              value={formData.preferred_date}
              onChange={(e) => handleChange('preferred_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">When would you like the service completed?</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Images (optional)</span>
              <Button type="button" size="sm" variant="outline" onClick={handleAddImage}>
                <Plus className="mr-1 h-4 w-4" />
                Add Image URL
              </Button>
            </div>
            {formData.images.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {formData.images.map((image: string, index: number) => (
                  <Badge key={index} variant="outline" className="max-w-full gap-1 pr-0.5 font-normal">
                    <span className="truncate">{image.length > 40 ? `${image.slice(0, 40)}…` : image}</span>
                    <button
                      type="button"
                      className="rounded p-0.5 hover:bg-muted"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40">
                No images added. You can add image URLs to help providers understand the issue.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              'Saving...'
            ) : (
              <>
                {mode === 'create' ? <Plus className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                {mode === 'create' ? 'Create Request' : 'Update Request'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
