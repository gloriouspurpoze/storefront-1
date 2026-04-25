import React from 'react'
import {
  MoreVertical,
  Image as ImageIcon,
  Eye,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Users,
} from 'lucide-react'
import { Slider } from '../../types'
import { cn } from '../../lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'

interface SliderTableProps {
  sliders: Slider[]
  loading?: boolean
  onMenuClick: (event: React.MouseEvent<HTMLElement>, slider: Slider) => void
  onToggleStatus?: (slider: Slider) => void
  onMoveUp?: (slider: Slider) => void
  onMoveDown?: (slider: Slider) => void
}

function audienceIcon(audience: string) {
  const c = 'h-3.5 w-3.5'
  switch (audience) {
    case 'customers':
    case 'providers':
      return <Users className={c} />
    default:
      return <Globe className={c} />
  }
}

export function SliderTable({
  sliders,
  loading,
  onMenuClick,
  onToggleStatus,
  onMoveUp,
  onMoveDown,
}: SliderTableProps) {
  const getAudienceVariant = (audience: string): 'default' | 'secondary' | 'outline' => {
    switch (audience) {
      case 'all':
        return 'default'
      case 'customers':
        return 'secondary'
      case 'providers':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (endDate?: string) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                Loading sliders...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Preview</TableHead>
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="font-semibold">Position</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Audience</TableHead>
            <TableHead className="font-semibold">Schedule</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
            <TableHead className="text-right font-semibold">Menu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sliders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                No sliders found
              </TableCell>
            </TableRow>
          ) : (
            sliders.map((slider, index) => (
              <TableRow key={slider.id}>
                <TableCell className="py-3">
                  <div className="flex max-w-xs items-center gap-2">
                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded border border-border bg-muted">
                      {slider.image_url ? (
                        <img
                          src={slider.image_url}
                          alt={slider.image_alt || slider.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{slider.title}</p>
                      {slider.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">{slider.subtitle}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <p className="text-sm font-medium">{slider.title}</p>
                  {slider.subtitle && (
                    <p className="text-xs text-muted-foreground">{slider.subtitle}</p>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{slider.position}</span>
                    <div className="flex flex-col">
                      {onMoveUp && index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Move up"
                          onClick={() => onMoveUp(slider)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onMoveDown && index < sliders.length - 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Move down"
                          onClick={() => onMoveDown(slider)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slider.is_active}
                      onCheckedChange={() => onToggleStatus?.(slider)}
                    />
                    <Badge variant={slider.is_active ? 'default' : 'secondary'}>
                      {slider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant={getAudienceVariant(slider.target_audience || 'all')} className="gap-1">
                    {audienceIcon(slider.target_audience || 'all')}
                    {slider.target_audience
                      ? slider.target_audience.charAt(0).toUpperCase() + slider.target_audience.slice(1)
                      : 'All'}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  {slider.start_date && (
                    <span className="block text-xs text-muted-foreground">
                      Start: {formatDate(slider.start_date)}
                    </span>
                  )}
                  {slider.end_date && (
                    <span
                      className={cn(
                        'block text-xs',
                        isExpired(slider.end_date) ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      End: {formatDate(slider.end_date)}
                      {isExpired(slider.end_date) && ' (Expired)'}
                    </span>
                  )}
                  {!slider.start_date && !slider.end_date && (
                    <span className="text-xs text-muted-foreground">No schedule</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="View Details"
                      onClick={(e) => onMenuClick(e, slider)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit"
                      onClick={(e) => onMenuClick(e, slider)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      title="Delete"
                      onClick={(e) => onMenuClick(e, slider)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => onMenuClick(e, slider)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
