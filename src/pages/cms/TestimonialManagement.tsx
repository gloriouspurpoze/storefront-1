import React, { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  StarHalf,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { CMSService } from '../../services/api'
import { format } from 'date-fns'
import { PageHeader } from '../../components/common/PageHeader'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { cn } from '../../lib/utils'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar'
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
  Separator,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../../components/ui'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'

interface Testimonial {
  _id: string
  customerName: string
  customerTitle?: string
  customerRole?: string
  customerAvatar?: string
  customerImage?: string
  rating: number
  comment?: string
  title?: string
  content?: string
  service?: string
  serviceType?: string
  isApproved?: boolean
  isActive?: boolean
  isFeatured: boolean
  displayOrder?: number
  order?: number
  createdAt: string
}

function StarRatingDisplay({ value, className }: { value: number; className?: string }) {
  const v = Math.min(5, Math.max(0, Math.round(value * 2) / 2))
  const full = Math.floor(v)
  const half = v % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div className={cn('flex items-center gap-0.5', className)} role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="h-4 w-4 fill-bloom-coral text-bloom-coral" aria-hidden />
      ))}
      {half && <StarHalf className="h-4 w-4 fill-bloom-coral text-bloom-coral" aria-hidden />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="h-4 w-4 text-muted-foreground/40" aria-hidden />
      ))}
    </div>
  )
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className="rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onChange(i)}
          aria-label={`${i} stars`}
        >
          <Star
            className={cn(
              'h-7 w-7',
              i <= value ? 'fill-bloom-coral text-bloom-coral' : 'text-muted-foreground/35',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export default function TestimonialManagement() {
  const confirm = useAppConfirm()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'featured'>('all')

  const [formData, setFormData] = useState({
    customerName: '',
    customerTitle: '',
    customerAvatar: '',
    rating: 5,
    comment: '',
    service: '',
    isApproved: false,
    isFeatured: false,
    displayOrder: 0,
  })

  useEffect(() => {
    fetchTestimonials()
  }, [filter])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const params: Record<string, unknown> = {}
      if (filter === 'approved') params.isActive = true
      if (filter === 'pending') params.isActive = false
      if (filter === 'featured') params.isFeatured = true

      const data = await CMSService.getTestimonials(params)
      let list: unknown[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (data?.testimonials && Array.isArray(data.testimonials)) {
        list = data.testimonials
      } else if (data?.data && Array.isArray(data.data)) {
        list = data.data
      }
      setTestimonials(list.map(normalizeTestimonial))
    } catch (error: any) {
      console.error('Error fetching testimonials:', error)
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load testimonials'
      appToast('Error: ' + errorMessage, 'error')
      setTestimonials([])
    } finally {
      setLoading(false)
    }
  }

  function normalizeTestimonial(t: unknown): Testimonial {
    const r = t && typeof t === 'object' ? (t as Record<string, unknown>) : {}
    return {
      _id: String(r._id),
      customerName: String(r.customerName ?? ''),
      customerTitle: (r.customerRole ?? r.customerTitle) as string | undefined,
      customerAvatar: (r.customerImage ?? r.customerAvatar) as string | undefined,
      rating: typeof r.rating === 'number' ? r.rating : 5,
      comment: String(r.content ?? r.comment ?? ''),
      service: (r.serviceType ?? r.service) as string | undefined,
      isApproved: (r.isActive ?? r.isApproved ?? true) as boolean,
      isFeatured: Boolean(r.isFeatured),
      displayOrder:
        typeof r.order === 'number'
          ? r.order
          : typeof r.displayOrder === 'number'
            ? r.displayOrder
            : 0,
      createdAt: String(r.createdAt ?? ''),
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.customerName.trim() || !formData.comment.trim()) {
        appToast('Please fill in all required fields', 'warning')
        return
      }

      const payload = {
        customerName: formData.customerName.trim(),
        customerRole: formData.customerTitle || undefined,
        customerImage: formData.customerAvatar || undefined,
        rating: Number(formData.rating),
        title: formData.comment.slice(0, 80) || 'Testimonial',
        content: formData.comment.trim(),
        serviceType: formData.service || undefined,
        isFeatured: formData.isFeatured,
        order: Number(formData.displayOrder),
        isActive: formData.isApproved,
      }

      if (editingTestimonial) {
        await CMSService.updateTestimonial(editingTestimonial._id, payload)
      } else {
        await CMSService.createTestimonial(payload)
      }

      fetchTestimonials()
      handleCloseForm()
    } catch (error: any) {
      console.error('Error saving testimonial:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save testimonial'), 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete testimonial?',
      message: 'Are you sure you want to delete this testimonial?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      await CMSService.deleteTestimonial(id)
      fetchTestimonials()
    } catch (error: any) {
      console.error('Error deleting testimonial:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to delete testimonial'), 'error')
    }
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setFormData({
      customerName: testimonial.customerName || '',
      customerTitle: testimonial.customerTitle || testimonial.customerRole || '',
      customerAvatar: testimonial.customerAvatar || testimonial.customerImage || '',
      rating: testimonial.rating ?? 5,
      comment: testimonial.comment || testimonial.content || '',
      service: testimonial.service || testimonial.serviceType || '',
      isApproved: testimonial.isApproved ?? testimonial.isActive ?? true,
      isFeatured: testimonial.isFeatured ?? false,
      displayOrder: testimonial.displayOrder ?? testimonial.order ?? 0,
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTestimonial(null)
    setFormData({
      customerName: '',
      customerTitle: '',
      customerAvatar: '',
      rating: 5,
      comment: '',
      service: '',
      isApproved: false,
      isFeatured: false,
      displayOrder: 0,
    })
  }

  const handleToggleApproval = async (testimonial: Testimonial) => {
    try {
      const next = !(testimonial.isApproved ?? testimonial.isActive ?? true)
      await CMSService.updateTestimonial(testimonial._id, { isActive: next })
      fetchTestimonials()
    } catch (error: any) {
      console.error('Error updating approval:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to update approval'), 'error')
    }
  }

  const handleToggleFeatured = async (testimonial: Testimonial) => {
    try {
      await CMSService.updateTestimonial(testimonial._id, {
        isFeatured: !testimonial.isFeatured,
      })
      fetchTestimonials()
    } catch (error: any) {
      console.error('Error updating featured status:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to update featured status'), 'error')
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Testimonial Management"
          subtitle="Manage customer reviews and testimonials"
          action={
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          }
        />

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/80 p-1">
            <TabsTrigger value="all" className="font-semibold">
              All ({testimonials.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="font-semibold">
              Approved ({testimonials.filter((t) => t.isApproved).length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="font-semibold">
              Pending ({testimonials.filter((t) => !t.isApproved).length})
            </TabsTrigger>
            <TabsTrigger value="featured" className="font-semibold">
              Featured ({testimonials.filter((t) => t.isFeatured).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : testimonials.length === 0 ? (
          <Card>
            <CardContent className="px-6 py-16 text-center">
              <Star className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" aria-hidden />
              <h3 className="mb-2 text-lg font-semibold text-muted-foreground">No testimonials found</h3>
              <p className="mb-6 text-sm text-muted-foreground">Add your first testimonial to showcase customer feedback</p>
              <Button type="button" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Testimonial
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial._id}
                className={cn(
                  'relative flex h-full flex-col transition-shadow hover:-translate-y-1 hover:shadow-md',
                  testimonial.isFeatured ? 'border-2 border-primary' : 'border',
                )}
              >
                {testimonial.isFeatured && (
                  <Badge className="absolute right-3 top-3 gap-1 font-semibold">
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
                <CardContent className="flex flex-1 flex-col gap-4 p-6 pt-8">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={testimonial.customerAvatar} alt="" />
                      <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                        {testimonial.customerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{testimonial.customerName}</p>
                      {testimonial.customerTitle && (
                        <p className="text-xs text-muted-foreground">{testimonial.customerTitle}</p>
                      )}
                    </div>
                  </div>

                  <StarRatingDisplay value={testimonial.rating} />

                  <p className="flex-1 text-sm italic leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.comment}&rdquo;
                  </p>

                  {testimonial.service && (
                    <Badge variant="outline" className="w-fit">
                      {testimonial.service}
                    </Badge>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={testimonial.isApproved ? 'success' : 'warning'} className="gap-1 font-semibold">
                      {testimonial.isApproved ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {testimonial.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                    <div className="flex gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-8 w-8',
                              testimonial.isApproved ? 'bg-storm-deep/10 text-storm-deep hover:bg-storm-deep/20' : 'bg-muted',
                            )}
                            onClick={() => handleToggleApproval(testimonial)}
                            aria-label={testimonial.isApproved ? 'Unapprove' : 'Approve'}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{testimonial.isApproved ? 'Unapprove' : 'Approve'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-8 w-8',
                              testimonial.isFeatured ? 'bg-primary/10 text-primary' : 'bg-muted',
                            )}
                            onClick={() => handleToggleFeatured(testimonial)}
                            aria-label={testimonial.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{testimonial.isFeatured ? 'Unfeature' : 'Feature'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={() => handleEdit(testimonial)}
                            aria-label="Edit"
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
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-destructive/10 text-destructive hover:bg-destructive/20"
                            onClick={() => handleDelete(testimonial._id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Added {format(new Date(testimonial.createdAt), 'MMM dd, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={(open) => !open && handleCloseForm()}>
          <DialogContent className="max-w-md sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="tm-name">Customer Name</Label>
                <Input
                  id="tm-name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tm-title">Customer Title/Position</Label>
                <Input
                  id="tm-title"
                  value={formData.customerTitle}
                  onChange={(e) => setFormData({ ...formData, customerTitle: e.target.value })}
                  placeholder="e.g., Homeowner, Business Owner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tm-avatar">Customer Avatar URL</Label>
                <Input
                  id="tm-avatar"
                  value={formData.customerAvatar}
                  onChange={(e) => setFormData({ ...formData, customerAvatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Rating *</Label>
                <StarRatingInput value={formData.rating} onChange={(n) => setFormData({ ...formData, rating: n })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tm-comment">Testimonial Comment</Label>
                <Textarea
                  id="tm-comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                  required
                  placeholder="Share your experience..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tm-service">Service</Label>
                <Input
                  id="tm-service"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  placeholder="e.g., Plumbing, Electrical"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tm-order">Display Order</Label>
                <Input
                  id="tm-order"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tm-approved"
                  checked={formData.isApproved}
                  onCheckedChange={(checked) => setFormData({ ...formData, isApproved: checked })}
                />
                <Label htmlFor="tm-approved" className="cursor-pointer font-normal">
                  Approved
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tm-featured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="tm-featured" className="cursor-pointer font-normal">
                  Featured
                </Label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSubmit()}>
                {editingTestimonial ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
