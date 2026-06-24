import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  SEO_LANDING_LENGTH_RULES,
  evaluateLength,
} from '../../lib/seoLandingContentLengthRules'
import { SeoContentLengthHint } from './SeoContentLengthHint'

export type FaqRow = { question: string; answer: string }

function normalizeFaqs(raw: unknown): FaqRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return { question: '', answer: '' }
    const o = item as Record<string, unknown>
    return { question: String(o.question ?? ''), answer: String(o.answer ?? '') }
  })
}

export interface SeoLandingFaqEditorProps {
  faqs: unknown
  onChange: (faqs: FaqRow[]) => void
  disabled?: boolean
}

export function SeoLandingFaqEditor({ faqs, onChange, disabled }: SeoLandingFaqEditorProps) {
  const rows = normalizeFaqs(faqs)
  const list = rows.length ? rows : [{ question: '', answer: '' }]

  const patch = (index: number, patchRow: Partial<FaqRow>) => {
    const next = [...list]
    next[index] = { ...next[index], ...patchRow }
    onChange(next.filter((r) => r.question.trim() || r.answer.trim()))
  }

  const add = () => onChange([...list, { question: '', answer: '' }])

  const remove = (index: number) => {
    const next = list.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {list.map((row, i) => (
        <div
          key={i}
          className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium text-muted-foreground">FAQ {i + 1}</Label>
            {list.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => remove(i)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <Input
            value={row.question}
            onChange={(e) => patch(i, { question: e.target.value })}
            placeholder="Question shown on page & in FAQ schema"
            disabled={disabled}
          />
          <SeoContentLengthHint
            warning={evaluateLength(`faq-q-${i}`, 'Question', row.question, SEO_LANDING_LENGTH_RULES.faqQuestion)}
            compact
          />
          <Textarea
            rows={2}
            value={row.answer}
            onChange={(e) => patch(i, { answer: e.target.value })}
            placeholder="Answer (plain text or short HTML)"
            disabled={disabled}
          />
          <SeoContentLengthHint
            warning={evaluateLength(`faq-a-${i}`, 'Answer', row.answer, SEO_LANDING_LENGTH_RULES.faqAnswer)}
            compact
          />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={add} disabled={disabled} leftIcon={<Plus className="h-4 w-4" />}>
        Add FAQ
      </Button>
    </div>
  )
}
