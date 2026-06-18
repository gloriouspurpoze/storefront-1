import React from 'react'
import { Plus, Trash2, Wand2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export type InternalLinkRow = { label: string; url: string }

function normalizeRows(raw: unknown): InternalLinkRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return { label: '', url: '' }
    const o = item as Record<string, unknown>
    return {
      label: String(o.label ?? '').trim(),
      url: String(o.url ?? o.href ?? '').trim(),
    }
  })
}

export interface SeoLandingInternalLinksEditorProps {
  links: unknown
  onChange: (links: InternalLinkRow[]) => void
  onSuggest?: () => void
  disabled?: boolean
  minRecommended?: number
}

export function SeoLandingInternalLinksEditor({
  links,
  onChange,
  onSuggest,
  disabled,
  minRecommended = 3,
}: SeoLandingInternalLinksEditorProps) {
  const rows = normalizeRows(links)
  const list = rows.length ? rows : [{ label: '', url: '' }]
  const filled = list.filter((r) => r.label.trim() && r.url.trim()).length

  const patch = (index: number, patchRow: Partial<InternalLinkRow>) => {
    const next = [...list]
    next[index] = { ...next[index], ...patchRow }
    onChange(next.filter((r) => r.label.trim() || r.url.trim()))
  }

  const add = () => onChange([...list, { label: '', url: '' }])

  const remove = (index: number) => {
    const next = list.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Aim for {minRecommended}+ contextual links to services, charges, guides, areas, or near-me pages.
        Filled: <strong className="text-foreground">{filled}</strong>
        {filled >= minRecommended ? ' ✓' : ` (${minRecommended - filled} more recommended)`}
      </p>
      {onSuggest ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onSuggest}
          disabled={disabled}
          leftIcon={<Wand2 className="h-4 w-4" />}
        >
          Suggest links from category &amp; location
        </Button>
      ) : null}
      {list.map((row, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-border/80 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anchor text</Label>
            <Input
              value={row.label}
              onChange={(e) => patch(i, { label: e.target.value })}
              placeholder="AC repair cost in Mira Bhayandar"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Path or URL</Label>
            <Input
              value={row.url}
              onChange={(e) => patch(i, { url: e.target.value })}
              placeholder="/services/ac-repair/mira-bhayandar"
              className="font-mono text-sm"
              disabled={disabled}
            />
          </div>
          {list.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive sm:mb-0.5"
              onClick={() => remove(i)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="hidden sm:block sm:h-9" />
          )}
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={add}
        disabled={disabled}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Add internal link
      </Button>
    </div>
  )
}
