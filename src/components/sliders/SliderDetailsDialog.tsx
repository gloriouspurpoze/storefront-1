import React from 'react'
import {
  Image as ImageIcon,
  Globe,
  Users,
  CalendarClock,
  Link as LinkIcon,
  Clock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Slider } from '../../types'

interface SliderDetailsDialogProps {
  open: boolean
  onClose: () => void
  slider: Slider | null
}

const audienceBadge = (audience: string) => {
  switch (audience) {
    case 'all':
      return { variant: 'default' as const, Icon: Globe }
    case 'customers':
      return { variant: 'success' as const, Icon: Users }
    case 'providers':
      return { variant: 'secondary' as const, Icon: Users }
    default:
      return { variant: 'secondary' as const, Icon: Globe }
  }
}

export function SliderDetailsDialog({ open, onClose, slider }: SliderDetailsDialogProps) {
  if (!slider) return null

  const aud = audienceBadge(slider.target_audience || 'all')
  const AudIcon = aud.Icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isExpired = (endDate?: string) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  const isScheduled = (startDate?: string) => {
    if (!startDate) return false
    return new Date(startDate) > new Date()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="border-b border-border pb-2">
          <DialogTitle className="flex items-center gap-3 pr-8 text-left">
            <Avatar className="h-12 w-12 bg-primary text-primary-foreground">
              <AvatarFallback>
                <ImageIcon className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-lg font-semibold">{slider.title}</span>
              {slider.subtitle && <p className="text-sm font-normal text-muted-foreground">{slider.subtitle}</p>}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={slider.is_active ? 'success' : 'secondary'}>{slider.is_active ? 'Active' : 'Inactive'}</Badge>
            <Badge variant={aud.variant} className="inline-flex items-center gap-1">
              <AudIcon className="h-3.5 w-3.5" />
              {slider.target_audience
                ? slider.target_audience.charAt(0).toUpperCase() + slider.target_audience.slice(1)
                : 'All Users'}
            </Badge>
            <Badge variant="outline">Position {slider.position}</Badge>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-primary">Image Preview</h3>
            <Separator className="mb-2" />
            <Card className="overflow-hidden">
              <div className="relative flex h-[300px] w-full items-center justify-center bg-muted/50">
                {slider.image_url ? (
                  <img
                    src={slider.image_url}
                    alt={slider.image_alt || slider.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto mb-1 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No image available</p>
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">{slider.image_alt || 'No alt text provided'}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-primary">Content Information</h3>
            <Separator className="mb-2" />
            <div className="rounded-lg border bg-card p-3">
              <p className="mb-1 text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{slider.description || 'No description provided'}</p>
            </div>
          </div>

          {slider.button_text && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-primary">Call to Action</h3>
              <Separator className="mb-2" />
              <div className="rounded-lg border bg-card p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {slider.button_url ? (
                    <Button asChild>
                      <a href={slider.button_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        {slider.button_text}
                      </a>
                    </Button>
                  ) : (
                    <Button disabled className="inline-flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      {slider.button_text}
                    </Button>
                  )}
                  <div className="text-sm">
                    <p className="font-medium">Button Text: {slider.button_text}</p>
                    <p className="text-muted-foreground">URL: {slider.button_url}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-1 text-sm font-semibold text-primary">Schedule Information</h3>
            <Separator className="mb-2" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-1 flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Start Date
                </div>
                <p className="text-sm text-muted-foreground">
                  {slider.start_date ? formatDate(slider.start_date) : 'No start date set'}
                </p>
                {slider.start_date && isScheduled(slider.start_date) && (
                  <Badge className="mt-1" variant="secondary">
                    Scheduled
                  </Badge>
                )}
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-1 flex items-center gap-1 text-sm font-medium">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  End Date
                </div>
                <p className="text-sm text-muted-foreground">
                  {slider.end_date ? formatDate(slider.end_date) : 'No end date set'}
                </p>
                {slider.end_date && isExpired(slider.end_date) && (
                  <Badge className="mt-1" variant="destructive">
                    Expired
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-primary">Account Information</h3>
            <Separator className="mb-2" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-3">
                <p className="mb-1 text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(slider.created_at)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="mb-1 text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">{formatDate(slider.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
