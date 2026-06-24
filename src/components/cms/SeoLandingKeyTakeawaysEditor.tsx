import React from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { SeoCompactRichTextField } from './SeoCompactRichTextField'
import {
  SEO_LANDING_LENGTH_RULES,
  evaluateLength,
  stripHtmlPlain,
} from '../../lib/seoLandingContentLengthRules'
import { SeoContentLengthHint } from './SeoContentLengthHint'

function normalizeRows(raw: unknown): string[] {
  if (!Array.isArray(raw)) return ['']
  const rows = raw.map((item) => String(item ?? '').trim())
  return rows.length ? rows : ['']
}

function stripHtml(s: string): string {
  return stripHtmlPlain(s)
}

export interface SeoLandingKeyTakeawaysEditorProps {
  takeaways: unknown
  onChange: (takeaways: string[]) => void
  disabled?: boolean
}

export function SeoLandingKeyTakeawaysEditor({
  takeaways,
  onChange,
  disabled,
}: SeoLandingKeyTakeawaysEditorProps) {
  const rows = normalizeRows(takeaways)
  const filled = rows.filter((r) => stripHtml(r).length > 0).length
  const countWarning = evaluateLength(
    'takeaway-count',
    'Takeaway count',
    filled,
    SEO_LANDING_LENGTH_RULES.keyTakeawayBullets,
  )

  const patch = (index: number, html: string) => {
    const next = [...rows]
    next[index] = html
    onChange(next.filter((r) => stripHtml(r).length > 0))
  }

  const add = () => onChange([...rows.filter((r) => stripHtml(r).length > 0), ''])

  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.filter((r) => stripHtml(r).length > 0))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Key takeaways</Label>
        <span className="text-xs text-muted-foreground">{filled} bullet{filled === 1 ? '' : 's'}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Rich-text bullets shown under the quick answer. Use bold for numbers and prices — eligible for speakable / AI Overview blocks on-site.
      </p>
      <SeoContentLengthHint warning={countWarning} compact />
      {rows.map((row, i) => {
        const itemWarning = stripHtml(row)
          ? evaluateLength(
              `takeaway-${i}`,
              `Takeaway ${i + 1}`,
              row,
              SEO_LANDING_LENGTH_RULES.takeawayItem,
            )
          : null
        return (
        <div key={i} className="flex gap-2 rounded-lg border border-border/70 bg-muted/15 p-2">
          <GripVertical className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <SeoCompactRichTextField
              label={`Takeaway ${i + 1}`}
              value={row}
              onChange={(html) => patch(i, html)}
              disabled={disabled}
              placeholder="Same-day AC service from ₹499 with transparent pricing…"
              height={110}
            />
            <SeoContentLengthHint warning={itemWarning} compact />
          </div>
          {rows.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-7 h-9 w-9 shrink-0 text-destructive"
              onClick={() => remove(i)}
              disabled={disabled}
              aria-label={`Remove takeaway ${i + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        )
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={add}
        disabled={disabled}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Add takeaway
      </Button>
    </div>
  )
}
