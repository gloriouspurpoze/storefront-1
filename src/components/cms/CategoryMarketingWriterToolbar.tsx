import React from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Megaphone, Sparkles } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

type LocalityRow = { _id: string; slug: string; name: string; isActive?: boolean }

type Props = {
  industryLabel: string
  selectedCategory: string
  effectiveKey: string
  localityDisplayLabel: string
  normalizedLocalitySlug: string
  localitySlugForKey: string
  localitySelectValue: string
  safeLocalitySelectValue: string
  sortedManagedLocalities: LocalityRow[]
  managedLocalitiesLoading: boolean
  managedLocalitiesError: string | null
  emptyCustomSlugMode: boolean
  industryHub: boolean
  catalogSelectValue: string
  catalogOptions: { value: string; label: string }[]
  catalogOptionsLoading: boolean
  saving: boolean
  qualityScore: number
  qualityLabel: string
  qualityVariant: 'success' | 'warning' | 'secondary'
  lengthIssueCount: number
  onSave: () => void
  onAutofill: () => void
  onCategoryChange: (v: string) => void
  onLocalitySelect: (v: string) => void
  onLocalitySlugChange: (v: string) => void
  onLocalitySlugBlur: () => void
  className?: string
}

export function CategoryMarketingWriterToolbar({
  industryLabel,
  selectedCategory,
  effectiveKey,
  localityDisplayLabel,
  normalizedLocalitySlug,
  localitySlugForKey,
  safeLocalitySelectValue,
  sortedManagedLocalities,
  managedLocalitiesLoading,
  managedLocalitiesError,
  industryHub,
  catalogSelectValue,
  catalogOptions,
  catalogOptionsLoading,
  saving,
  qualityScore,
  qualityLabel,
  qualityVariant,
  lengthIssueCount,
  onSave,
  onAutofill,
  onCategoryChange,
  onLocalitySelect,
  onLocalitySlugChange,
  onLocalitySlugBlur,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 -mx-1 rounded-xl border border-border/80 bg-background/95 px-3 py-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90',
        className,
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          {!industryHub ? (
            <div className="min-w-[160px] flex-1 space-y-1 sm:max-w-[220px]">
              <Label htmlFor="cmm-writer-industry" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Industry
              </Label>
              <Select
                value={catalogSelectValue}
                onValueChange={onCategoryChange}
                disabled={catalogOptionsLoading || catalogOptions.length === 0}
              >
                <SelectTrigger id="cmm-writer-industry" className="h-8 w-full text-sm">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  {catalogOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="hidden text-sm font-medium text-foreground sm:block">
              {industryLabel}
            </p>
          )}

          <div className="min-w-[180px] flex-1 space-y-1 sm:max-w-[260px]">
            <Label htmlFor="cmm-writer-locality" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Location
            </Label>
            <Select value={safeLocalitySelectValue} onValueChange={onLocalitySelect} disabled={managedLocalitiesLoading}>
              <SelectTrigger id="cmm-writer-locality" className="h-8 w-full text-sm">
                <SelectValue placeholder={managedLocalitiesLoading ? 'Loading…' : 'All areas'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">All areas (default)</SelectItem>
                {sortedManagedLocalities.map((loc) => (
                  <SelectItem key={loc._id} value={loc.slug}>
                    {loc.name}
                    {!loc.isActive ? ' · inactive' : ''}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom slug…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {safeLocalitySelectValue === '__custom__' ? (
            <div className="min-w-[140px] flex-1 space-y-1 sm:max-w-[200px]">
              <Label htmlFor="cmm-writer-custom-slug" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Slug
              </Label>
              <Input
                id="cmm-writer-custom-slug"
                className="h-8 font-mono text-xs"
                value={localitySlugForKey}
                onChange={(e) => onLocalitySlugChange(e.target.value)}
                onBlur={onLocalitySlugBlur}
                placeholder="mira-bhayandar"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="hidden min-w-0 text-right text-[11px] leading-tight text-muted-foreground xl:block">
            <span className="block truncate">{localityDisplayLabel}</span>
            <code className="font-mono text-[10px] text-foreground/80">{effectiveKey}</code>
          </div>
          <Badge variant={qualityVariant} className="h-7 shrink-0 tabular-nums">
            {qualityScore}% · {qualityLabel}
          </Badge>
          {lengthIssueCount > 0 ? (
            <Badge variant="warning" className="h-7 shrink-0 tabular-nums">
              {lengthIssueCount} length
            </Badge>
          ) : null}
          {normalizedLocalitySlug ? (
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={onAutofill}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Starter pack
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      {managedLocalitiesError ? (
        <p className="mt-1.5 text-[11px] text-destructive">
          Areas failed to load — use custom slug or{' '}
          <Link to="/cms/category-marketing?tab=service-areas" className="underline">
            Service areas
          </Link>
          .
        </p>
      ) : null}
    </div>
  )
}
