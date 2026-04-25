import React, { useState, useEffect } from 'react'
import { Image } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'
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
import { Separator } from '../ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

interface Slider {
  id: string
  title: string
  subtitle?: string
  description?: string
  image_url: string
  image_alt?: string
  button_text?: string
  button_url?: string
  position: number
  is_active: boolean
  start_date?: string
  end_date?: string
  target_audience?: 'all' | 'customers' | 'providers'
  created_at: string
  updated_at: string
}

interface SliderFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: unknown) => void
  mode: 'create' | 'edit'
  slider?: Slider | null
  loading?: boolean
}

function dateToInputValue(d: Date | null): string {
  if (!d || !isValid(d)) return ''
  return format(d, 'yyyy-MM-dd')
}

function inputValueToDate(v: string): Date | null {
  if (!v) return null
  const d = parse(v, 'yyyy-MM-dd', new Date())
  return isValid(d) ? d : null
}

export function SliderFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  slider,
  loading = false,
}: SliderFormDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    image_alt: '',
    button_text: '',
    button_url: '',
    position: 1,
    is_active: true,
    start_date: null as Date | null,
    end_date: null as Date | null,
    target_audience: 'all' as 'all' | 'customers' | 'providers',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit' && slider) {
      setFormData({
        title: slider.title || '',
        subtitle: slider.subtitle || '',
        description: slider.description || '',
        image_url: slider.image_url || '',
        image_alt: slider.image_alt || '',
        button_text: slider.button_text || '',
        button_url: slider.button_url || '',
        position: slider.position || 1,
        is_active: slider.is_active ?? true,
        start_date: slider.start_date ? new Date(slider.start_date) : null,
        end_date: slider.end_date ? new Date(slider.end_date) : null,
        target_audience: slider.target_audience || 'all',
      })
    } else {
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        image_alt: '',
        button_text: '',
        button_url: '',
        position: 1,
        is_active: true,
        start_date: null,
        end_date: null,
        target_audience: 'all',
      })
    }
  }, [mode, slider])

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.image_url.trim()) {
      newErrors.image_url = 'Image URL is required'
    }

    if (formData.button_text && !formData.button_url) {
      newErrors.button_url = 'Button URL is required when button text is provided'
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString() : undefined,
        end_date: formData.end_date ? formData.end_date.toISOString() : undefined,
      }
      onSubmit(submitData)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      image_alt: '',
      button_text: '',
      button_url: '',
      position: 1,
      is_active: true,
      start_date: null,
      end_date: null,
      target_audience: 'all',
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="border-b border-border pb-2">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="flex items-center gap-2 text-lg">
              <Image className="h-5 w-5 text-primary" />
              {mode === 'create' ? 'Create New Slider' : 'Edit Slider'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-primary">Basic Information</h3>
            <Separator className="my-2" />
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-title">Title *</Label>
            <Input
              id="s-title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-sub">Subtitle</Label>
            <Input
              id="s-sub"
              value={formData.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-desc">Description</Label>
            <Textarea
              id="s-desc"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter slider description..."
            />
          </div>

          <div className="sm:col-span-2">
            <h3 className="mt-2 text-sm font-semibold text-primary">Image Information</h3>
            <Separator className="my-2" />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-img">Image URL *</Label>
            <Input
              id="s-img"
              value={formData.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={cn(errors.image_url && 'border-destructive')}
            />
            {errors.image_url && <p className="text-xs text-destructive">{errors.image_url}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-alt">Image Alt Text</Label>
            <Input
              id="s-alt"
              value={formData.image_alt}
              onChange={(e) => handleChange('image_alt', e.target.value)}
              placeholder="Alt text for accessibility"
            />
          </div>
          {formData.image_url && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-medium">Image Preview</p>
              <div className="max-h-48 max-w-md overflow-hidden rounded-md border border-border bg-muted/30">
                <img
                  src={formData.image_url}
                  alt={formData.image_alt || formData.title}
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <h3 className="mt-2 text-sm font-semibold text-primary">Call to Action</h3>
            <Separator className="my-2" />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-btnt">Button Text</Label>
            <Input
              id="s-btnt"
              value={formData.button_text}
              onChange={(e) => handleChange('button_text', e.target.value)}
              placeholder="e.g., Learn More"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-btnu">Button URL</Label>
            <Input
              id="s-btnu"
              value={formData.button_url}
              onChange={(e) => handleChange('button_url', e.target.value)}
              placeholder="https://example.com/action"
              className={cn(errors.button_url && 'border-destructive')}
            />
            {errors.button_url && <p className="text-xs text-destructive">{errors.button_url}</p>}
          </div>

          <div className="sm:col-span-2">
            <h3 className="mt-2 text-sm font-semibold text-primary">Settings</h3>
            <Separator className="my-2" />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-pos">Position</Label>
            <Input
              id="s-pos"
              type="number"
              min={1}
              value={formData.position}
              onChange={(e) => handleChange('position', parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label>Target Audience</Label>
            <Select
              value={formData.target_audience}
              onValueChange={(v) => handleChange('target_audience', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="customers">Customers Only</SelectItem>
                <SelectItem value="providers">Providers Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:col-span-1">
            <Switch
              id="s-active"
              checked={formData.is_active}
              onCheckedChange={(c) => handleChange('is_active', c === true)}
            />
            <Label htmlFor="s-active">Active</Label>
          </div>

          <div className="sm:col-span-2">
            <h3 className="mt-2 text-sm font-semibold text-primary">Schedule (Optional)</h3>
            <Separator className="my-2" />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-start">Start Date</Label>
            <Input
              id="s-start"
              type="date"
              value={dateToInputValue(formData.start_date)}
              onChange={(e) => handleChange('start_date', inputValueToDate(e.target.value))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="s-end">End Date</Label>
            <Input
              id="s-end"
              type="date"
              value={dateToInputValue(formData.end_date)}
              onChange={(e) => handleChange('end_date', inputValueToDate(e.target.value))}
              className={cn(errors.end_date && 'border-destructive')}
            />
            {errors.end_date && <p className="text-xs text-destructive">{errors.end_date}</p>}
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Slider' : 'Update Slider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
