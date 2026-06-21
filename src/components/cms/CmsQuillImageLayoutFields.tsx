import React from 'react'
import { AlignHorizontalJustifyCenter, AlignLeft, AlignRight, Rows3 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import {
  CMS_IMAGE_LAYOUT_OPTIONS,
  CMS_IMAGE_WIDTH_PRESETS,
  type CmsImageLayout,
  type CmsImageLayoutOptions,
} from '../../lib/quillCmsImage'

type LayoutFieldsProps = {
  layout: CmsImageLayout
  widthPx: number | 'full' | ''
  heightPx: number | 'auto' | ''
  onLayoutChange: (layout: CmsImageLayout) => void
  onWidthChange: (width: number | 'full' | '') => void
  onHeightChange: (height: number | 'auto' | '') => void
  compact?: boolean
}

export function CmsQuillImageLayoutFields({
  layout,
  widthPx,
  heightPx,
  onLayoutChange,
  onWidthChange,
  onHeightChange,
  compact,
}: LayoutFieldsProps) {
  return (
    <div className={cn('space-y-3', compact ? 'mt-3' : 'mt-4')}>
      <div className="space-y-1.5">
        <Label className="text-xs">Position (text wrap)</Label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {CMS_IMAGE_LAYOUT_OPTIONS.map((opt) => {
            const Icon =
              opt.value === 'float-left'
                ? AlignLeft
                : opt.value === 'float-right'
                  ? AlignRight
                  : opt.value === 'center'
                    ? AlignHorizontalJustifyCenter
                    : Rows3
            const active = layout === opt.value
            return (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                className="h-auto flex-col gap-0.5 py-2 text-[10px] leading-tight"
                onClick={() => onLayoutChange(opt.value)}
                title={opt.hint}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Width preset</Label>
        <div className="flex flex-wrap gap-1.5">
          {CMS_IMAGE_WIDTH_PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              size="sm"
              variant={widthPx === p.value ? 'secondary' : 'outline'}
              className="text-xs"
              onClick={() => onWidthChange(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="cms-img-width" className="text-xs">
            Width (px)
          </Label>
          <Input
            id="cms-img-width"
            type="number"
            min={80}
            max={900}
            placeholder="Auto"
            value={widthPx === 'full' ? '' : widthPx === '' ? '' : String(widthPx)}
            onChange={(e) => {
              const v = e.target.value.trim()
              onWidthChange(v ? Number(v) : '')
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cms-img-height" className="text-xs">
            Height (px)
          </Label>
          <Input
            id="cms-img-height"
            type="number"
            min={60}
            max={600}
            placeholder="Auto"
            value={heightPx === 'auto' || heightPx === '' ? '' : String(heightPx)}
            onChange={(e) => {
              const v = e.target.value.trim()
              onHeightChange(v ? Number(v) : 'auto')
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function layoutOptionsFromFields(
  layout: CmsImageLayout,
  widthPx: number | 'full' | '',
  heightPx: number | 'auto' | '',
): CmsImageLayoutOptions {
  return {
    layout,
    widthPx: widthPx === '' ? undefined : widthPx,
    heightPx: heightPx === '' ? 'auto' : heightPx,
  }
}
