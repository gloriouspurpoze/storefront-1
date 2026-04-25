import React, { useState, useEffect } from 'react'
import { X, Plus, Building2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

interface ServiceProvider {
  id: string
  business_name: string
  business_license: string
  services_offered: string[]
  service_areas: string[]
  verification_status: 'pending' | 'verified' | 'rejected'
  rating: number
  total_reviews: number
  years_experience: number
  bio: string
  user?: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

interface ProviderFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  mode: 'create' | 'edit'
  provider?: ServiceProvider | null
  loading?: boolean
}

export function ProviderFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  provider,
  loading = false,
}: ProviderFormDialogProps) {
  const [formData, setFormData] = useState({
    business_name: '',
    business_license: '',
    services_offered: [] as string[],
    service_areas: [] as string[],
    verification_status: 'pending' as 'pending' | 'verified' | 'rejected',
    years_experience: 0,
    bio: '',
    is_active: true,
  })

  const [newService, setNewService] = useState('')
  const [newArea, setNewArea] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit' && provider) {
      setFormData({
        business_name: provider.business_name || '',
        business_license: provider.business_license || '',
        services_offered: provider.services_offered || [],
        service_areas: provider.service_areas || [],
        verification_status: provider.verification_status || 'pending',
        years_experience: provider.years_experience || 0,
        bio: provider.bio || '',
        is_active: true,
      })
    } else {
      setFormData({
        business_name: '',
        business_license: '',
        services_offered: [],
        service_areas: [],
        verification_status: 'pending',
        years_experience: 0,
        bio: '',
        is_active: true,
      })
    }
  }, [mode, provider])

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const addService = () => {
    if (newService.trim() && !formData.services_offered.includes(newService.trim())) {
      handleChange('services_offered', [...formData.services_offered, newService.trim()])
      setNewService('')
    }
  }

  const removeService = (service: string) => {
    handleChange(
      'services_offered',
      formData.services_offered.filter((s) => s !== service),
    )
  }

  const addArea = () => {
    if (newArea.trim() && !formData.service_areas.includes(newArea.trim())) {
      handleChange('service_areas', [...formData.service_areas, newArea.trim()])
      setNewArea('')
    }
  }

  const removeArea = (area: string) => {
    handleChange(
      'service_areas',
      formData.service_areas.filter((a) => a !== area),
    )
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required'
    }
    if (formData.services_offered.length === 0) {
      newErrors.services_offered = 'At least one service is required'
    }
    if (formData.service_areas.length === 0) {
      newErrors.service_areas = 'At least one service area is required'
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
      business_name: '',
      business_license: '',
      services_offered: [],
      service_areas: [],
      verification_status: 'pending',
      years_experience: 0,
      bio: '',
      is_active: true,
    })
    setErrors({})
    setNewService('')
    setNewArea('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Create New Provider' : 'Edit Provider'}
          </DialogTitle>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <h3 className="text-sm font-semibold text-primary">Basic Information</h3>
            <Separator className="my-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">Business Name</Label>
              <Input
                id="pf-name"
                value={formData.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                className={cn(errors.business_name && 'border-destructive')}
              />
              {errors.business_name && <p className="text-xs text-destructive">{errors.business_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-lic">Business License</Label>
              <Input
                id="pf-lic"
                value={formData.business_license}
                onChange={(e) => handleChange('business_license', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-yrs">Years of Experience</Label>
              <Input
                id="pf-yrs"
                type="number"
                value={formData.years_experience}
                onChange={(e) => handleChange('years_experience', parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Verification Status</Label>
              <Select
                value={formData.verification_status}
                onValueChange={(v) =>
                  handleChange('verification_status', v as typeof formData.verification_status)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="mt-2 text-sm font-semibold text-primary">Services Offered</h3>
            <Separator className="my-2" />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add service"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
            />
            <Button type="button" onClick={addService}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {errors.services_offered && (
            <p className="text-xs text-destructive">{errors.services_offered}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {formData.services_offered.map((service) => (
              <Badge key={service} variant="outline" className="cursor-default gap-1 pr-0.5">
                {service}
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => removeService(service)}
                  aria-label={`Remove ${service}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="mt-2 text-sm font-semibold text-primary">Service Areas</h3>
            <Separator className="my-2" />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add service area"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
            />
            <Button type="button" onClick={addArea}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {errors.service_areas && <p className="text-xs text-destructive">{errors.service_areas}</p>}
          <div className="flex flex-wrap gap-1">
            {formData.service_areas.map((area) => (
              <Badge key={area} variant="secondary" className="cursor-default gap-1 pr-0.5">
                {area}
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => removeArea(area)}
                  aria-label={`Remove ${area}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="mt-2 text-sm font-semibold text-primary">Additional Information</h3>
            <Separator className="my-2" />
          </div>
          <Textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Tell us about your business and experience..."
          />

          <div>
            <h3 className="mt-2 text-sm font-semibold text-primary">Settings</h3>
            <Separator className="my-2" />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="pf-active"
              checked={formData.is_active}
              onCheckedChange={(c) => handleChange('is_active', c === true)}
            />
            <Label htmlFor="pf-active">Active Provider</Label>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Provider' : 'Update Provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
